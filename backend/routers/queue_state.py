"""
Queue State Router
Handles initial state loading for dashboards
Provides current queue snapshots via HTTP GET endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, case
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel

from database import get_db
import models

router = APIRouter(
    prefix="/api/queue",
    tags=["Queue State"]
)

# ============================================================================
# RESPONSE MODELS
# ============================================================================

class QueueSummary(BaseModel):
    """Summary statistics for queue"""
    total: int = 0
    waiting: int = 0
    called: int = 0
    in_progress: int = 0
    completed_today: Optional[int] = None
    average_wait_time: Optional[float] = None

class QueueTicketPublic(BaseModel):
    """Queue ticket info for public display (anonymized)"""
    ticket_id: int
    visit_id: int
    queue_position: int
    queue_status: str
    estimated_wait_time: Optional[int]
    patient_name: str  # Anonymized (e.g., "J. Smith")
    doctor_name: str
    check_in_time: Optional[str]

class QueueTicketClinician(BaseModel):
    """Queue ticket info for clinician dashboard (detailed)"""
    ticket_id: int
    visit_id: int
    patient_id: int
    queue_position: int
    queue_status: str
    estimated_wait_time: Optional[int]
    patient_name: str  # Full name
    patient_age: Optional[int]
    check_in_time: Optional[str]
    called_at: Optional[str]
    started_at: Optional[str]

class QueueTicketAdmin(BaseModel):
    """Queue ticket info for admin dashboard (full details)"""
    ticket_id: int
    visit_id: int
    patient_id: int
    queue_position: int
    queue_status: str
    estimated_wait_time: Optional[int]
    actual_wait_time: Optional[int]
    patient_name: str
    patient_phone: Optional[str]
    doctor_id: Optional[int]
    doctor_name: str
    department_id: Optional[int]
    department_name: str
    check_in_time: Optional[str]
    check_in_method: Optional[str]
    called_at: Optional[str]
    started_at: Optional[str]
    created_at: Optional[str]

class PublicDisplayStateResponse(BaseModel):
    """Response for public display initial state"""
    success: bool
    timestamp: str
    summary: QueueSummary
    queue: List[QueueTicketPublic]

class ClinicianStateResponse(BaseModel):
    """Response for clinician dashboard initial state"""
    success: bool
    clinician_id: int
    timestamp: str
    summary: QueueSummary
    queue: List[QueueTicketClinician]

class AdminStateResponse(BaseModel):
    """Response for admin dashboard initial state"""
    success: bool
    timestamp: str
    summary: QueueSummary
    queue: List[QueueTicketAdmin]

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def anonymize_name(first_name: str, last_name: str) -> str:
    """Anonymize patient name for public display"""
    if not first_name or not last_name:
        return "Patient"
    return f"{first_name[0]}. {last_name}"

def format_doctor_name(first_name: Optional[str], last_name: Optional[str]) -> str:
    """Format doctor name"""
    if not first_name or not last_name:
        return "Unassigned"
    return f"Dr. {first_name} {last_name}"

def calculate_wait_time(check_in: datetime, started_at: Optional[datetime]) -> Optional[int]:
    """Calculate actual wait time in minutes"""
    if started_at:
        return int((started_at - check_in).total_seconds() / 60)
    else:
        return int((datetime.utcnow() - check_in).total_seconds() / 60)

# ============================================================================
# PUBLIC DISPLAY ENDPOINT
# ============================================================================

@router.get("/public-display", response_model=PublicDisplayStateResponse)
async def get_public_display_queue(db: Session = Depends(get_db)):
    """
    Get current queue state for public display
    Returns all active tickets (WAITING, CALLED, IN_PROGRESS)
    
    Use this endpoint when the public display dashboard first loads
    to show the current state, then rely on WebSocket for real-time updates.
    """
    today = date.today()
    
    # Get all active queue tickets
    tickets = db.query(
        models.QueueTicket.ticket_id,
        models.QueueTicket.queue_position,
        models.QueueTicket.queue_status,
        models.QueueTicket.estimated_wait_time,
        models.Visit.visit_id,
        models.Visit.check_in_datetime,
        models.Patient.first_name,
        models.Patient.last_name,
        models.Doctor.first_name.label('doctor_first'),
        models.Doctor.last_name.label('doctor_last')
    ).join(
        models.Visit, models.QueueTicket.visit_id == models.Visit.visit_id
    ).join(
        models.Patient, models.Visit.patient_id == models.Patient.patient_id
    ).outerjoin(
        models.Doctor, models.Visit.doctor_id == models.Doctor.doctor_id
    ).filter(
        and_(
            models.QueueTicket.queue_date == today,
            models.QueueTicket.queue_status.in_(['WAITING', 'CALLED', 'IN_PROGRESS']),
            models.QueueTicket.deleted_at.is_(None)
        )
    ).order_by(
        models.QueueTicket.queue_position
    ).all()
    
    # Format response
    queue_list = []
    for ticket in tickets:
        queue_list.append(QueueTicketPublic(
            ticket_id=ticket.ticket_id,
            visit_id=ticket.visit_id,
            queue_position=ticket.queue_position,
            queue_status=ticket.queue_status,
            estimated_wait_time=ticket.estimated_wait_time,
            patient_name=anonymize_name(ticket.first_name, ticket.last_name),
            doctor_name=format_doctor_name(ticket.doctor_first, ticket.doctor_last),
            check_in_time=ticket.check_in_datetime.isoformat() if ticket.check_in_datetime else None
        ))
    
    # Count by status
    waiting = sum(1 for t in queue_list if t.queue_status == 'WAITING')
    called = sum(1 for t in queue_list if t.queue_status == 'CALLED')
    in_progress = sum(1 for t in queue_list if t.queue_status == 'IN_PROGRESS')
    
    return PublicDisplayStateResponse(
        success=True,
        timestamp=datetime.utcnow().isoformat(),
        summary=QueueSummary(
            total=len(queue_list),
            waiting=waiting,
            called=called,
            in_progress=in_progress
        ),
        queue=queue_list
    )


# ============================================================================
# CLINICIAN DASHBOARD ENDPOINT
# ============================================================================

@router.get("/clinician/{clinician_id}", response_model=ClinicianStateResponse)
async def get_clinician_queue_state(
    clinician_id: int,
    db: Session = Depends(get_db)
):
    """
    Get current queue state for specific clinician
    Returns all active tickets assigned to this clinician
    
    Use this endpoint when the clinician dashboard first loads
    to show the current patient queue, then rely on WebSocket for real-time updates.
    """
    today = date.today()
    
    # Verify clinician exists
    doctor = db.query(models.Doctor).filter(
        models.Doctor.doctor_id == clinician_id,
        models.Doctor.is_active == True
    ).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinician with ID {clinician_id} not found"
        )
    
    # Get clinician's queue tickets
    tickets = db.query(
        models.QueueTicket.ticket_id,
        models.QueueTicket.queue_position,
        models.QueueTicket.queue_status,
        models.QueueTicket.estimated_wait_time,
        models.QueueTicket.started_at,
        models.QueueTicket.called_at,
        models.Visit.visit_id,
        models.Visit.check_in_datetime,
        models.Patient.patient_id,
        models.Patient.first_name,
        models.Patient.last_name,
        models.Patient.date_of_birth
    ).join(
        models.Visit, models.QueueTicket.visit_id == models.Visit.visit_id
    ).join(
        models.Patient, models.Visit.patient_id == models.Patient.patient_id
    ).filter(
        and_(
            models.Visit.doctor_id == clinician_id,
            models.QueueTicket.queue_date == today,
            models.QueueTicket.queue_status.in_(['WAITING', 'CALLED', 'IN_PROGRESS']),
            models.QueueTicket.deleted_at.is_(None)
        )
    ).order_by(
        case(
            (models.QueueTicket.queue_status == 'IN_PROGRESS', 1),
            (models.QueueTicket.queue_status == 'CALLED', 2),
            else_=3,
        ),
        models.QueueTicket.queue_position
    ).all()
    
    # Format response
    queue_list = []
    for ticket in tickets:
        # Calculate age
        age = None
        if ticket.date_of_birth:
            age = (date.today() - ticket.date_of_birth).days // 365
        
        queue_list.append(QueueTicketClinician(
            ticket_id=ticket.ticket_id,
            visit_id=ticket.visit_id,
            patient_id=ticket.patient_id,
            queue_position=ticket.queue_position,
            queue_status=ticket.queue_status,
            estimated_wait_time=ticket.estimated_wait_time,
            patient_name=f"{ticket.first_name} {ticket.last_name}",
            patient_age=age,
            check_in_time=ticket.check_in_datetime.isoformat() if ticket.check_in_datetime else None,
            called_at=ticket.called_at.isoformat() if ticket.called_at else None,
            started_at=ticket.started_at.isoformat() if ticket.started_at else None
        ))
    
    # Count by status
    waiting = sum(1 for t in queue_list if t.queue_status == 'WAITING')
    called = sum(1 for t in queue_list if t.queue_status == 'CALLED')
    in_progress = sum(1 for t in queue_list if t.queue_status == 'IN_PROGRESS')
    
    return ClinicianStateResponse(
        success=True,
        clinician_id=clinician_id,
        timestamp=datetime.utcnow().isoformat(),
        summary=QueueSummary(
            total=len(queue_list),
            waiting=waiting,
            called=called,
            in_progress=in_progress
        ),
        queue=queue_list
    )


# ============================================================================
# ADMIN DASHBOARD ENDPOINT
# ============================================================================

@router.get("/admin", response_model=AdminStateResponse)
async def get_admin_queue_state(db: Session = Depends(get_db)):
    """
    Get complete queue state for admin dashboard
    Returns all active tickets with full details
    
    Use this endpoint when the admin dashboard first loads
    to show the complete current state, then rely on WebSocket for real-time updates.
    """
    today = date.today()
    
    # Get all active queue tickets with full details
    tickets = db.query(
        models.QueueTicket.ticket_id,
        models.QueueTicket.queue_position,
        models.QueueTicket.queue_status,
        models.QueueTicket.estimated_wait_time,
        models.QueueTicket.created_at,
        models.QueueTicket.started_at,
        models.QueueTicket.called_at,
        models.Visit.visit_id,
        models.Visit.check_in_datetime,
        models.Visit.check_in_method,
        models.Patient.patient_id,
        models.Patient.first_name,
        models.Patient.last_name,
        models.Patient.phone_number,
        models.Doctor.doctor_id,
        models.Doctor.first_name.label('doctor_first'),
        models.Doctor.last_name.label('doctor_last'),
        models.Department.department_id,
        models.Department.department_name
    ).join(
        models.Visit, models.QueueTicket.visit_id == models.Visit.visit_id
    ).join(
        models.Patient, models.Visit.patient_id == models.Patient.patient_id
    ).outerjoin(
        models.Doctor, models.Visit.doctor_id == models.Doctor.doctor_id
    ).outerjoin(
        models.Department, models.Visit.department_id == models.Department.department_id
    ).filter(
        and_(
            models.QueueTicket.queue_date == today,
            # models.QueueTicket.queue_status.in_(['WAITING', 'CALLED', 'IN_PROGRESS']),
            models.QueueTicket.deleted_at.is_(None)
        )
    ).order_by(
        models.QueueTicket.queue_position
    ).all()
    
    # Format response
    queue_list = []
    total_wait_time = 0
    wait_time_count = 0
    
    for ticket in tickets:
        # Calculate actual wait time
        wait_time_minutes = None
        if ticket.check_in_datetime:
            if ticket.queue_status == 'IN_PROGRESS' and ticket.started_at:
                wait_time_minutes = calculate_wait_time(ticket.check_in_datetime, ticket.started_at)
                total_wait_time += wait_time_minutes
                wait_time_count += 1
            elif ticket.queue_status in ['WAITING', 'CALLED']:
                wait_time_minutes = calculate_wait_time(ticket.check_in_datetime, None)
        
        queue_list.append(QueueTicketAdmin(
            ticket_id=ticket.ticket_id,
            visit_id=ticket.visit_id,
            patient_id=ticket.patient_id,
            queue_position=ticket.queue_position,
            queue_status=ticket.queue_status,
            estimated_wait_time=ticket.estimated_wait_time,
            actual_wait_time=wait_time_minutes,
            patient_name=f"{ticket.first_name} {ticket.last_name}",
            patient_phone=ticket.phone_number,
            doctor_id=ticket.doctor_id,
            doctor_name=format_doctor_name(ticket.doctor_first, ticket.doctor_last),
            department_id=ticket.department_id,
            department_name=ticket.department_name or "Unassigned",
            check_in_time=ticket.check_in_datetime.isoformat() if ticket.check_in_datetime else None,
            check_in_method=ticket.check_in_method,
            called_at=ticket.called_at.isoformat() if ticket.called_at else None,
            started_at=ticket.started_at.isoformat() if ticket.started_at else None,
            created_at=ticket.created_at.isoformat() if ticket.created_at else None
        ))
    
    # Count by status
    waiting = sum(1 for t in queue_list if t.queue_status == 'WAITING')
    called = sum(1 for t in queue_list if t.queue_status == 'CALLED')
    in_progress = sum(1 for t in queue_list if t.queue_status == 'IN_PROGRESS')
    
    # Average wait time
    avg_wait_time = round(total_wait_time / wait_time_count, 1) if wait_time_count > 0 else 0.0
    
    # Completed today
    completed_today = db.query(func.count(models.QueueTicket.ticket_id)).filter(
        and_(
            models.QueueTicket.queue_date == today,
            models.QueueTicket.queue_status == 'COMPLETED'
        )
    ).scalar() or 0
    
    return AdminStateResponse(
        success=True,
        timestamp=datetime.utcnow().isoformat(),
        summary=QueueSummary(
            total=len(queue_list),
            waiting=waiting,
            called=called,
            in_progress=in_progress,
            completed_today=completed_today,
            average_wait_time=avg_wait_time
        ),
        queue=queue_list
    )


# ============================================================================
# QUICK STATUS ENDPOINT
# ============================================================================

@router.get("/status", tags=["Queue State"])
async def get_queue_status(db: Session = Depends(get_db)):
    """
    Quick endpoint to get queue status summary
    Useful for health checks or quick stats
    """
    today = date.today()
    
    # Get counts by status
    counts = db.query(
        models.QueueTicket.queue_status,
        func.count(models.QueueTicket.ticket_id).label('count')
    ).filter(
        and_(
            models.QueueTicket.queue_date == today,
            models.QueueTicket.deleted_at.is_(None)
        )
    ).group_by(
        models.QueueTicket.queue_status
    ).all()
    
    # Build summary
    status_counts = {
        "WAITING": 0,
        "CALLED": 0,
        "IN_PROGRESS": 0,
        "COMPLETED": 0,
        "CANCELLED": 0,
        "NO_SHOW": 0
    }
    
    for status, count in counts:
        if status in status_counts:
            status_counts[status] = count
    
    return {
        "success": True,
        "date": today.isoformat(),
        "timestamp": datetime.utcnow().isoformat(),
        "current_queue": status_counts['WAITING'] + status_counts['CALLED'] + status_counts['IN_PROGRESS'],
        "status_breakdown": status_counts
    }