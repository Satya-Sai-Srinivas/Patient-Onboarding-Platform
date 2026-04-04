"""
Dashboard Endpoints with Real Database Integration
Fetches actual data from PostgreSQL tables

File: routers/dashboards.py
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, case, desc
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel
import logging
import crud, schemas

# Database imports (adjust based on your project structure)
# Assuming you have these models defined
from database import get_db  # Database session dependency
from models import (
    Visit,
    QueueTicket,
    Patient,
    Doctor,
    Department
    # UserDetails
)

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class QueueItemPublicDisplay(BaseModel):
    """Queue item for public waiting room display"""
    appointment_number: str
    patient_name: str
    doctor_name: str
    status: str
    estimated_wait_time: Optional[str] = None
    visit_id: int
    queue_position: int


class PublicDisplayResponse(BaseModel):
    """Public display response - Image 1"""
    current_time: str
    current_date: str
    in_progress_count: int
    waiting_count: int
    ready_count: int
    in_progress: List[QueueItemPublicDisplay]
    waiting: List[QueueItemPublicDisplay]
    ready: List[QueueItemPublicDisplay]


class ClinicianQueueItem(BaseModel):
    """Queue item for clinician dashboard"""
    appointment_id: int
    appointment_number: str
    patient_name: str
    patient_id: str
    status: str
    checked_in_time: str
    started_time: Optional[str] = None
    estimated_wait_time: Optional[str] = None


class ClinicianDashboardResponse(BaseModel):
    """Clinician dashboard response - Image 2"""
    clinician_name: str
    specialty: str
    queued_count: int
    in_progress_count: int
    queue_items: List[ClinicianQueueItem]


class KPICard(BaseModel):
    """KPI card for admin dashboard"""
    label: str
    value: str


class ClinicianStatsCard(BaseModel):
    """Clinician statistics card"""
    name: str
    specialty: str
    completed: int
    in_progress: int
    queued: int


class RecentAppointmentRow(BaseModel):
    """Recent appointment table row"""
    appointment_number: str
    patient_name: str
    status: str
    clinician_name: str
    check_in_time: str
    wait_time: str


class AdminDashboardResponse(BaseModel):
    """Admin dashboard response - Image 3"""
    clinician_overview: List[ClinicianStatsCard]
    recent_appointments: List[RecentAppointmentRow]
    current_date: str


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def map_queue_status_to_display(queue_status: str) -> tuple:
    """Map database queue_status to display format"""
    mapping = {
        "WAITING": ("Queued"),
        "CALLED": ("Ready"),
        "IN_PROGRESS": ("In Progress"),
        "COMPLETED": ("Completed"),
        "NO_SHOW": ("No Show")
    }
    return mapping.get(queue_status, ("Unknown"))


def format_patient_name(first_name: str, last_name: str) -> str:
    """Format as 'J. Smith'"""
    if not first_name or not last_name:
        return "Unknown Patient"
    return f"{first_name[0]}. {last_name}"


def format_doctor_name(first_name: str, last_name: str) -> str:
    """Format as 'Dr. Sarah Chen'"""
    if not first_name or not last_name:
        return "Unassigned"
    return f"Dr. {first_name} {last_name}"


def format_wait_time(minutes: Optional[int]) -> Optional[str]:
    """Format wait time as '~15 min wait'"""
    if minutes is None or minutes <= 0:
        return None
    return f"~{minutes} min wait"


def calculate_actual_wait_time(check_in: datetime, started: Optional[datetime]) -> int:
    """Calculate actual wait time in minutes"""
    if started:
        delta = started - check_in
    else:
        delta = datetime.now() - check_in
    return int(delta.total_seconds() / 60)


# ============================================================================
# CLINICIAN DASHBOARD ENDPOINT - IMAGE 2
# ============================================================================

@router.get(
    "/clinician/{clinician_id}",
    response_model=ClinicianDashboardResponse,
    summary="Get clinician's personal queue",
    description="Returns queue filtered by specific doctor/clinician"
)
async def get_clinician_dashboard(
    clinician_id: int,
    db: Session = Depends(get_db)
):
    """
    Fetches clinician's queue from database
    Shows only patients assigned to this doctor
    """
    
    # Get doctor info
    doctor = db.query(Doctor).filter(
        Doctor.doctor_id == clinician_id,
        Doctor.is_active == True
    ).first()
    
    if not doctor:
        raise HTTPException(status_code=404, detail="Clinician not found")
    
    # Get department info
    department = None
    if doctor.department_id:
        department = db.query(Department).filter(
            Department.department_id == doctor.department_id
        ).first()
    
    today = date.today()
    
    # Query clinician's queue tickets
    query = db.query(
        QueueTicket.ticket_id,
        QueueTicket.queue_position,
        QueueTicket.queue_status,
        QueueTicket.estimated_wait_time,
        QueueTicket.started_at,
        Visit.visit_id,
        Visit.check_in_datetime,
        Patient.patient_id,
        Patient.first_name,
        Patient.last_name
    ).join(
        Visit, QueueTicket.visit_id == Visit.visit_id
    ).join(
        Patient, Visit.patient_id == Patient.patient_id
    ).filter(
        and_(
            Visit.doctor_id == clinician_id,
            QueueTicket.queue_date == today,
            QueueTicket.queue_status.in_(['WAITING', 'CALLED', 'IN_PROGRESS']),
            QueueTicket.deleted_at.is_(None)
        )
    ).order_by(
        # Show IN_PROGRESS first, then CALLED, then WAITING
        case(
            (QueueTicket.queue_status == 'IN_PROGRESS', 1),
            (QueueTicket.queue_status == 'CALLED', 2),
            (QueueTicket.queue_status == 'WAITING', 3)
        ),
        QueueTicket.queue_position
    ).all()
    
    # Build queue items
    queue_items = []
    queued_count = 0
    in_progress_count = 0
    
    for row in query:
        # Count by status
        if row.queue_status == 'WAITING':
            queued_count += 1
        elif row.queue_status == 'IN_PROGRESS':
            in_progress_count += 1
        
        # Map status
        display_status = map_queue_status_to_display(row.queue_status)
        
        # Format times
        check_in_time = row.check_in_datetime.strftime("%I:%M %p")
        started_time = row.started_at.strftime("%I:%M %p") if row.started_at else None
        
        # Calculate estimated wait for ready/queued patients
        est_wait = None
        if row.queue_status in ['WAITING', 'CALLED'] and row.estimated_wait_time:
            est_wait = f"{row.estimated_wait_time} minutes"
        
        # Create item
        item = ClinicianQueueItem(
            appointment_id=row.visit_id,
            appointment_number=f"{row.queue_position:04d}",
            patient_name=f"{row.first_name} {row.last_name}",
            patient_id=f"#{row.queue_position:04d}",  # or use patient_id
            status=display_status,
            checked_in_time=check_in_time,
            started_time=started_time,
            estimated_wait_time=est_wait
        )
        
        queue_items.append(item)
    
    return ClinicianDashboardResponse(
        clinician_name=f"Dr. {doctor.first_name} {doctor.last_name}",
        specialty=doctor.specialization or department.department_name if department else "General Practice",
        queued_count=queued_count,
        in_progress_count=in_progress_count,
        queue_items=queue_items
    )


# ============================================================================
# ADMIN DASHBOARD ENDPOINT - IMAGE 3
# ============================================================================

@router.get("/dashboard", response_model=schemas.DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Get core metrics for the Admin Dashboard:
    - Throughput (completed visits)
    - Wait Time (created_at vs started_at)
    - Queue Count (currently waiting)
    - No Show Rate (%)
    """
    try:
        metrics = crud.get_dashboard_metrics(db)
        return metrics
    except Exception as e:
        print(f"Error fetching dashboard metrics: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    

    

@router.get(
    "/admin",
    response_model=AdminDashboardResponse,
    summary="Get admin dashboard with system analytics",
    description="Returns system-wide statistics and metrics from database"
)
async def get_admin_dashboard(db: Session = Depends(get_db)):
    """
    Fetches complete admin dashboard data from database
    Includes KPIs, clinician stats, and recent appointments
    """
    
    today = date.today()
    
    # ========== KPI CALCULATIONS ==========
    
    # KPI 1: Current Queue Count (WAITING + CALLED + IN_PROGRESS)
    current_queue_count = db.query(func.count(QueueTicket.ticket_id)).filter(
        and_(
            QueueTicket.queue_date == today,
            QueueTicket.queue_status.in_(['WAITING', 'CALLED', 'IN_PROGRESS']),
            QueueTicket.deleted_at.is_(None)
        )
    ).scalar() or 0
    
    # KPI 2: Average Wait Time (for completed appointments today)
    avg_wait_subquery = db.query(
        func.avg(
            func.extract('epoch', QueueTicket.started_at - Visit.check_in_datetime) / 60
        ).label('avg_wait')
    ).join(
        Visit, QueueTicket.visit_id == Visit.visit_id
    ).filter(
        and_(
            QueueTicket.queue_date == today,
            QueueTicket.queue_status == 'COMPLETED',
            QueueTicket.started_at.isnot(None)
        )
    ).scalar()
    
    avg_wait_time = int(avg_wait_subquery) if avg_wait_subquery else 0
    
    # KPI 3: Throughput Today (completed appointments)
    throughput_today = db.query(func.count(QueueTicket.ticket_id)).filter(
        and_(
            QueueTicket.queue_date == today,
            QueueTicket.queue_status == 'COMPLETED'
        )
    ).scalar() or 0
    
    # KPI 4: No-Show Count and Rate
    no_show_today = db.query(func.count(QueueTicket.ticket_id)).filter(
        and_(
            QueueTicket.queue_date == today,
            QueueTicket.queue_status == 'NO_SHOW'
        )
    ).scalar() or 0
    
    total_today = db.query(func.count(QueueTicket.ticket_id)).filter(
        QueueTicket.queue_date == today
    ).scalar() or 1  # Avoid division by zero
    
    no_show_rate = (no_show_today / total_today * 100) if total_today > 0 else 0
    
    # Yesterday's throughput for trend calculation
    from datetime import timedelta
    yesterday = today - timedelta(days=1)
    throughput_yesterday = db.query(func.count(QueueTicket.ticket_id)).filter(
        and_(
            QueueTicket.queue_date == yesterday,
            QueueTicket.queue_status == 'COMPLETED'
        )
    ).scalar() or 1
    
    # Calculate trend
    throughput_change = ((throughput_today - throughput_yesterday) / throughput_yesterday * 100) if throughput_yesterday > 0 else 0
    trend_text = f"{'+' if throughput_change > 0 else ''}{throughput_change:.0f}% vs yesterday" if throughput_change != 0 else None
    
    # Build KPI cards
    kpi_cards = [
        KPICard(
            label="Current Queue",
            value=str(current_queue_count)
        ),
        KPICard(
            label="Avg Wait Time",
            value=str(avg_wait_time)
        ),
        KPICard(
            label="Throughput Today",
            value=str(throughput_today)
        ),
        KPICard(
            label="No-Show Rate",
            value=f"{no_show_rate:.1f}%",
            subtitle=f"{no_show_today} today"
        )
    ]
    

     
    # ========== CLINICIAN OVERVIEW ==========
    
    clinician_stats_query = db.query(
        Doctor.doctor_id,
        Doctor.first_name,
        Doctor.last_name,
        Doctor.specialization,
        Department.department_name,
        func.count(
            case((QueueTicket.queue_status == 'COMPLETED', QueueTicket.ticket_id))
        ).label('completed'),
        func.count(
            case((QueueTicket.queue_status == 'IN_PROGRESS', QueueTicket.ticket_id))
        ).label('in_progress'),
        func.count(
            case((QueueTicket.queue_status.in_(['WAITING', 'CALLED']), QueueTicket.ticket_id))
        ).label('queued')
    ).outerjoin(
        Department, Doctor.department_id == Department.department_id
    ).outerjoin(
        Visit, Visit.doctor_id == Doctor.doctor_id
    ).outerjoin(
        QueueTicket, 
        and_(
            QueueTicket.visit_id == Visit.visit_id,
            QueueTicket.queue_date == today
        )
    ).filter(
        Doctor.is_active == True
    ).group_by(
        Doctor.doctor_id,
        Doctor.first_name,
        Doctor.last_name,
        Doctor.specialization,
        Department.department_name
    ).all()
    
    clinician_overview = []
    for row in clinician_stats_query:
        clinician_overview.append(ClinicianStatsCard(
            name=f"Dr. {row.first_name} {row.last_name}",
            specialty=row.specialization or row.department_name or "General Practice",
            completed=row.completed or 0,
            in_progress=row.in_progress or 0,
            queued=row.queued or 0
        ))
    
    # ========== RECENT APPOINTMENTS ==========
    
    recent_query = db.query(
        QueueTicket.queue_position,
        QueueTicket.queue_status,
        QueueTicket.started_at,
        Visit.visit_id,
        Visit.check_in_datetime,
        Patient.first_name.label('patient_first'),
        Patient.last_name.label('patient_last'),
        Doctor.first_name.label('doctor_first'),
        Doctor.last_name.label('doctor_last')
    ).join(
        Visit, QueueTicket.visit_id == Visit.visit_id
    ).join(
        Patient, Visit.patient_id == Patient.patient_id
    ).outerjoin(
        Doctor, Visit.doctor_id == Doctor.doctor_id
    ).filter(
        QueueTicket.queue_date == today
    ).order_by(
        desc(Visit.check_in_datetime)
    ).limit(20).all()
    
    recent_appointments = []
    for row in recent_query:
        display_status = map_queue_status_to_display(row.queue_status)
        
        # Calculate wait time
        if row.queue_status == 'COMPLETED' and row.started_at:
            wait_mins = calculate_actual_wait_time(row.check_in_datetime, row.started_at)
            wait_time = f"{wait_mins} min"
        elif row.queue_status == 'IN_PROGRESS' and row.started_at:
            wait_mins = calculate_actual_wait_time(row.check_in_datetime, row.started_at)
            wait_time = f"{wait_mins} min"
        elif row.queue_status in ['CALLED', 'WAITING']:
            wait_time = "—"
        else:
            wait_time = "—"
        
        appointment_number = f"{row.queue_position:04d}"
        patient_name = f"{row.patient_first} {row.patient_last} #{appointment_number}"
        
        recent_appointments.append(RecentAppointmentRow(
            appointment_number=appointment_number,
            patient_name=patient_name,
            status=display_status,
            clinician_name=format_doctor_name(row.doctor_first, row.doctor_last),
            check_in_time=row.check_in_datetime.strftime("%I:%M %p"),
            wait_time=wait_time
        ))
    
    return AdminDashboardResponse(
        kpi_cards=kpi_cards,
        clinician_overview=clinician_overview,
        recent_appointments=recent_appointments,
        current_date=datetime.now().strftime("%B %d, %Y")
    )



@router.get("/clinicians/overview")
def clinicians_overview(db=Depends(get_db)):
    try:
        return {"clinicians": crud.get_clinicians_overview(db)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    



@router.get(
    "/queue/all",
    summary="Get complete queue list",
    description="Returns all queue tickets for today (for debugging)"
)
async def get_all_queue_tickets(db: Session = Depends(get_db)):
    """
    Debug endpoint - returns all queue tickets with full details
    Useful for verifying database data
    """
    
    today = date.today()
    
    results = db.query(
        QueueTicket.ticket_id,
        QueueTicket.queue_position,
        QueueTicket.queue_status,
        QueueTicket.estimated_wait_time,
        Visit.visit_id,
        Patient.first_name,
        Patient.last_name,
        Doctor.first_name.label('doc_first'),
        Doctor.last_name.label('doc_last')
    ).join(
        Visit, QueueTicket.visit_id == Visit.visit_id
    ).join(
        Patient, Visit.patient_id == Patient.patient_id
    ).outerjoin(
        Doctor, Visit.doctor_id == Doctor.doctor_id
    ).filter(
        QueueTicket.queue_date == today
    ).order_by(
        QueueTicket.queue_position
    ).all()
    
    queue_list = []
    for row in results:
        queue_list.append({
            "ticket_id": row.ticket_id,
            "visit_id": row.visit_id,
            "position": row.queue_position,
            "number": f"{row.queue_position:04d}",
            "patient": f"{row.first_name} {row.last_name}",
            "doctor": f"Dr. {row.doc_first} {row.doc_last}" if row.doc_first else "Unassigned",
            "status": row.queue_status,
            "estimated_wait": row.estimated_wait_time
        })
    
    return {
        "date": today.isoformat(),
        "total": len(queue_list),
        "queue": queue_list
    }

