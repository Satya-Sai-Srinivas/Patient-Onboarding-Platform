from sqlalchemy.orm import Session
from sqlalchemy import and_, func, text, case, extract
from models import *
from schemas import *
from datetime import datetime, date
from typing import Tuple, Dict, Any, List, Optional
import random
import string
import models

def start_appointment(
    db: Session,
    request: AppointmentStartRequest
) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Start an appointment by updating queue ticket status
    """
    try:
        # print(f"Ticket ID: {request.ticket_id}")
        # Step 1: Find queue ticket
        ticket = db.query(QueueTicket).filter(
            QueueTicket.ticket_id == request.ticket_id
        ).first()
        
        if not ticket:
            # print(f"Ticket #{request.ticket_id} not found")
            return False, "Queue ticket not found", {}
        
        # print(f"Found ticket #{ticket.ticket_id}")
        # print(f"   Current status: {ticket.queue_status}")
        
        # Step 2: Validate current status
        if ticket.queue_status not in ['WAITING', 'CALLED']:
            # print(f"Invalid status: {ticket.queue_status}")
            return False, f"Cannot start appointment. Current status: {ticket.queue_status}", {}
        
        # Step 3: Get visit details
        visit = db.query(Visit).filter(
            Visit.visit_id == ticket.visit_id
        ).first()
        
        if not visit:
            # print(f"Visit #{ticket.visit_id} not found")
            return False, "Visit not found", {}
        
        # print(f"Found visit #{visit.visit_id}")
        
        # Step 4: Get patient details
        patient = db.query(Patient).filter(
            Patient.patient_id == visit.patient_id
        ).first()
        
        if not patient:
            # print(f"Patient #{visit.patient_id} not found")
            return False, "Patient not found", {}
        
        patient_name = f"{patient.first_name} {patient.last_name}"
        # print(f"Found patient: {patient_name}")
        
        # Step 5: Update queue ticket
        old_status = ticket.queue_status
        ticket.queue_status = 'IN_PROGRESS'
        ticket.started_at = datetime.utcnow()
        ticket.updated_at = datetime.utcnow()
        
        # Step 6: Update visit status
        visit.visit_status = 'IN_PROGRESS'
        visit.updated_at = datetime.utcnow()
        
        # Step 7: Commit changes
        db.commit()
        
        # print(f"Status updated: {old_status} → IN_PROGRESS")
        # print(f"Started at: {ticket.started_at}")
        
        return True, "Appointment started successfully", {
            "ticket_id": ticket.ticket_id,
            "visit_id": visit.visit_id,
            "patient_name": patient_name,
            "queue_status": ticket.queue_status,
            "started_at": ticket.started_at
        }
        
    except Exception as e:
        db.rollback()
        print(f"Error: {str(e)}")
        return False, f"Error starting appointment: {str(e)}", {}


def verify_otp_and_checkin(
    db: Session,
    request: OTPVerifyRequest
) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Verify OTP and complete check-in process
    """
    try:
        # print(f"Phone: {request.phone_number}")
        # print(f"Code: {request.otp_code}")
        
        # Step 1: Find valid OTP
        otp_record = db.query(OTPVerification).filter(
            and_(
                OTPVerification.phone_number == request.phone_number,
                OTPVerification.otp_code == request.otp_code,
                OTPVerification.is_verified == False,
                OTPVerification.is_expired == False,
                OTPVerification.expires_at > func.now()
            )
        ).first()
        
        if not otp_record:
            return False, "Invalid or expired OTP", {}
        
        print(f"Found valid OTP: {otp_record.otp_id}")
        
        # Step 2: Check retry attempts
        if otp_record.retry_count >= otp_record.max_attempts:
            otp_record.is_expired = True
            db.commit()
            return False, "Maximum OTP verification attempts exceeded", {}
        
        # Step 3: Verify patient exists
        patient = db.query(Patient).filter(
            Patient.patient_id == otp_record.patient_id
        ).first()
        
        if not patient:
            return False, "Patient not found", {}
        
        # print(f"Patient: {patient.first_name} {patient.last_name}")
        
        # Step 4: Mark OTP as verified
        otp_record.is_verified = True
        otp_record.verified_at = datetime.utcnow()
        otp_record.updated_at = datetime.utcnow()
        
        # Step 5: Check if patient already checked in today
        today = datetime.utcnow().date()
        existing_visit = db.query(Visit).filter(
            and_(
                Visit.patient_id == patient.patient_id,
                Visit.visit_date == today,
                Visit.visit_status.in_(['ACTIVE', 'WAITING', 'IN_PROGRESS'])
            )
        ).first()
        
        if existing_visit:
            queue_ticket = db.query(QueueTicket).filter(
                QueueTicket.visit_id == existing_visit.visit_id
            ).first()
            
            db.commit()
            
            return True, "Already checked in for today", {
                "patient_id": patient.patient_id,
                "visit_id": existing_visit.visit_id,
                "ticket_id": queue_ticket.ticket_id if queue_ticket else None,
                "queue_position": queue_ticket.queue_position if queue_ticket else None,
                "estimated_wait_time": queue_ticket.estimated_wait_time if queue_ticket else None
            }
        
        # Step 6: Create new visit
        new_visit = Visit(
            patient_id=patient.patient_id,
            department_id=request.department_id,
            doctor_id=request.doctor_id,
            visit_date=today,
            check_in_datetime=datetime.utcnow(),
            check_in_method=request.check_in_method,
            visit_status='ACTIVE'
        )
        db.add(new_visit)
        db.flush()
        
        # print(f"Created visit #{new_visit.visit_id}")
        
        # Step 7: Calculate queue position
        max_position = db.query(func.max(QueueTicket.queue_position)).filter(
            and_(
                QueueTicket.queue_date == today,
                QueueTicket.queue_status.in_(['WAITING', 'CALLED', 'IN_PROGRESS'])
            )
        ).scalar() or 0
        
        new_position = max_position + 1
        
        # Step 8: Get department info for wait time
        department = db.query(Department).filter(
            Department.department_id == request.department_id
        ).first()
        
        average_service_time = department.average_service_time if department else 30
        estimated_wait = (new_position - 1) * average_service_time
        
        # print(f"Queue position: {new_position}")
        # print(f"Estimated wait: {estimated_wait} minutes")
        
        # Step 9: Create queue ticket
        queue_ticket = QueueTicket(
            visit_id=new_visit.visit_id,
            queue_date=today,
            queue_status='WAITING',
            queue_position=new_position,
            estimated_wait_time=estimated_wait
        )
        db.add(queue_ticket)
        db.flush()
        
        # print(f"Created ticket #{queue_ticket.ticket_id}")
        
        # Commit all changes
        db.commit()
        
        return True, "Check-in successful", {
            "patient_id": patient.patient_id,
            "visit_id": new_visit.visit_id,
            "ticket_id": queue_ticket.ticket_id,
            "queue_position": new_position,
            "estimated_wait_time": estimated_wait
        }
        
    except Exception as e:
        db.rollback()
        # print(f"Error: {str(e)}")
        import traceback
        # print(traceback.format_exc())
        return False, f"Error during check-in: {str(e)}", {}
    
# Helper functions
def generate_otp(length=6):
    """Generate random OTP"""
    return ''.join(random.choices(string.digits, k=length))


def send_sms(phone_number: str, message: str):
    """
    TODO: Implement with Twilio
    For now, just print to console
    """
    # print(f"📱 SMS to {phone_number}: {message}")
    return True



def create_visit_and_queue(db: Session, visit_data):
    """Creates a visit and assigns a queue slot."""
    
    # 1. Create Visit
    new_visit = models.Visit(
        patient_id=visit_data.patient_id,
        doctor_id=visit_data.doctor_id,
        department_id=visit_data.department_id,
        visit_status="QUEUED",
        check_in_method="MANUAL",
        

        visit_date=date.today(),           
        check_in_datetime=datetime.now()   
    )
    
    db.add(new_visit)
    db.flush() # Get visit_id before commit

    # 2. Calculate Queue Slot
    # Get department config
    dept = db.query(models.Department).filter(models.Department.department_id == visit_data.department_id).first()
    service_time = dept.average_service_time if dept else 15
    buffer_time = dept.buffer_time_minutes if dept else 5
    slot_duration = service_time + buffer_time

    # Get last ticket for this doctor today
    last_ticket = db.query(models.QueueTicket)\
        .join(models.Visit)\
        .filter(
            models.Visit.doctor_id == visit_data.doctor_id,
            models.QueueTicket.queue_date == date.today() 
        )\
        .order_by(models.QueueTicket.queue_position.desc())\
        .first()

    if last_ticket:
        new_position = last_ticket.queue_position + 1
        # Simple wait time calculation: Position * Slot Duration
        wait_time = new_position * slot_duration
    else:
        new_position = 1
        wait_time = 0 # Next up

    # 3. Create Ticket
    new_ticket = models.QueueTicket(
        visit_id=new_visit.visit_id,
        queue_date=date.today(), 
        queue_position=new_position,
        estimated_wait_time=wait_time,
        queue_status="WAITING"
    )
    db.add(new_ticket)
    db.commit()
    return new_visit



def get_all_table_names(db: Session) -> List[str]:
    result = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public';"))
    return [row[0] for row in result]

def get_column_data_types(db: Session, table: str) -> List[Dict[str, str]]:
    col_query = f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}' AND data_type IN ('date','timestamp without time zone','timestamp with time zone');"
    cols_result = db.execute(text(col_query))
    return [dict(row._mapping) for row in cols_result]

def count_table_rows(db: Session, table: str, condition: Optional[str] = None) -> int:
    query = f"SELECT COUNT(*) FROM {table}"
    if condition:
        query += f" WHERE {condition}"
    return db.execute(text(query)).scalar()

def get_clinicians_overview(db: Session):
    """
    Fetches a comprehensive statistical overview for all active clinicians.
    Includes: Profile info, Department Name, Total Patients, Total Visits.
    """
    results = (
        db.query(
            models.Doctor.doctor_id,
            models.Doctor.first_name,
            models.Doctor.last_name,
            models.Doctor.specialization,
            models.Doctor.email,
            models.Doctor.phone_number,
            models.Doctor.is_available,
            models.Doctor.is_active,
            models.Doctor.created_at,
            models.Department.department_name.label("department_name"),
            # Count unique patients assigned to this doctor
            func.count(func.distinct(models.Patient.patient_id)).label("patient_count"),
            # Count unique visits assigned to this doctor
            func.count(func.distinct(models.Visit.visit_id)).label("visit_count")
        )
        .outerjoin(models.Department, models.Doctor.department_id == models.Department.department_id)
        .outerjoin(models.Patient, models.Doctor.doctor_id == models.Patient.doctor_id)
        .outerjoin(models.Visit, models.Doctor.doctor_id == models.Visit.doctor_id)
        .filter(models.Doctor.deleted_at.is_(None))
        .group_by(models.Doctor.doctor_id, models.Department.department_id, models.Department.department_name)
        .order_by(models.Doctor.doctor_id)
        .all()
    )

    clinician_stats = []
    for row in results:
        clinician_stats.append({
            "id": row.doctor_id,
            "profile": {
                "name": f"{row.first_name} {row.last_name}",
                "specialization": row.specialization,
                "department": row.department_name or "Unassigned",
                "joined_date": row.created_at
            },
            "contact": {
                "email": row.email,
                "phone": row.phone_number
            },
            "status": {
                "is_active": row.is_active,
                "is_available": row.is_available
            },
            "performance_metrics": {
                "total_assigned_patients": row.patient_count,
                "total_completed_visits": row.visit_count,
                "workload_status": "High" if row.patient_count > 50 else "Normal"
            }
        })
    
    return clinician_stats

def get_paginated_visits(db: Session, page: int, page_size: int, patient_id: Optional[int], doctor_id: Optional[int]) -> Dict[str, Any]:
    filters = []
    params = {}
    if patient_id:
        filters.append("patient_id = :patient_id")
        params["patient_id"] = patient_id
    if doctor_id:
        filters.append("doctor_id = :doctor_id")
        params["doctor_id"] = doctor_id
    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
    
    count_query = f"SELECT COUNT(*) FROM visits {where_clause};"
    total = db.execute(text(count_query), params).scalar()
    
    offset = (page - 1) * page_size
    query = f"SELECT * FROM visits {where_clause} ORDER BY visit_id DESC LIMIT :limit OFFSET :offset;"
    params["limit"] = page_size
    params["offset"] = offset
    
    result = db.execute(text(query), params).fetchall()
    appointments = [dict(row._mapping) for row in result]
    return {"total": total, "appointments": appointments}


def override_queue_position(
    db: Session, 
    ticket_id: int, 
    new_position: int
):
    """
    Admin Override: Moves a ticket to a new position and shifts others accordingly.
    Re-ordering (e.g., Move 10 -> 1, shift 1..9 down by +1).
    """
    try:
        # 1. Get the ticket to move
        ticket = db.query(models.QueueTicket).filter(
            models.QueueTicket.ticket_id == ticket_id
        ).first()

        if not ticket:
            return False, "Ticket not found"

        # 2. Get context (Which doctor? Which date?) to scope the reordering
        visit = db.query(models.Visit).filter(
            models.Visit.visit_id == ticket.visit_id
        ).first()

        if not visit:
            return False, "Associated visit not found"

        old_position = ticket.queue_position
        
        # Optimization: If position hasn't changed, do nothing
        if old_position == new_position:
            return True, "Position unchanged"

        # 3. Define the Scope: All tickets for this doctor, on this date, that are active
        department = db.query(models.Department).filter(
            models.Department.department_id == visit.department_id
        ).first()
        avg_time = department.average_service_time if department else 15

        # 4. The Shift Logic
        if new_position < old_position:
            # MOVING UP (e.g., 5 -> 2)
            # Logic: Everyone currently between 2 and 4 needs to move DOWN (+1) to make space
            
            # Find tickets in the range [new_pos, old_pos - 1]
            tickets_to_shift = (
                db.query(models.QueueTicket)
                .join(models.Visit)
                .filter(
                    models.Visit.doctor_id == visit.doctor_id,
                    models.QueueTicket.queue_date == ticket.queue_date,
                    models.QueueTicket.queue_status.in_(['WAITING', 'CALLED']),
                    models.QueueTicket.queue_position >= new_position,
                    models.QueueTicket.queue_position < old_position
                )
                .all()
            )
            
            # Shift them
            for t in tickets_to_shift:
                t.queue_position += 1
                t.estimated_wait_time = (t.queue_position - 1) * avg_time
                
        else:
            # MOVING DOWN (e.g., 2 -> 5)
            # Logic: Everyone currently between 3 and 5 needs to move UP (-1) to fill the gap
            
            # Find tickets in the range [old_pos + 1, new_pos]
            tickets_to_shift = (
                db.query(models.QueueTicket)
                .join(models.Visit)
                .filter(
                    models.Visit.doctor_id == visit.doctor_id,
                    models.QueueTicket.queue_date == ticket.queue_date,
                    models.QueueTicket.queue_status.in_(['WAITING', 'CALLED']),
                    models.QueueTicket.queue_position > old_position,
                    models.QueueTicket.queue_position <= new_position
                )
                .all()
            )
            
            # Shift them
            for t in tickets_to_shift:
                t.queue_position -= 1
                t.estimated_wait_time = (t.queue_position - 1) * avg_time

        # 5. Update the target ticket finally
        ticket.queue_position = new_position
        ticket.estimated_wait_time = (new_position - 1) * avg_time
        ticket.updated_at = datetime.utcnow()

        db.commit()
        return True, f"Successfully moved ticket to position {new_position}"

    except Exception as e:
        db.rollback()
        print(f"Error overriding queue: {str(e)}")
        return False, str(e)
    

def get_dashboard_metrics(db: Session):
    today = date.today()
    
    # --- 1. Throughput Today ---
    # Count tickets where completed_at is today
    throughput = db.query(models.QueueTicket).filter(
        func.date(models.QueueTicket.completed_at) == today
    ).count()

    # --- 2. Current Queue Count ---
    # Count tickets created today that are still 'WAITING'
    # Note: Using ilike to handle 'waiting' vs 'WAITING' case sensitivity
    queue_count = db.query(models.QueueTicket).filter(
        models.QueueTicket.queue_date == today,
        models.QueueTicket.queue_status.ilike("WAITING")
    ).count()

    # --- 3. No Show Rate ---
    # Formula: (No Show Tickets / Total Tickets Today) * 100
    ticket_stats = db.query(
        func.count(models.QueueTicket.ticket_id).label('total'),
        func.sum(
            case(
                (models.QueueTicket.queue_status.ilike('NO_SHOW'), 1), 
                else_=0
            )
        ).label('no_shows')
    ).filter(
        models.QueueTicket.queue_date == today
    ).first()

    total_tickets = ticket_stats.total or 0
    no_show_count = ticket_stats.no_shows or 0
    
    no_show_rate = 0.0
    if total_tickets > 0:
        no_show_rate = round((no_show_count / total_tickets) * 100, 1)

    # --- 4. Average Wait Time ---
    # Logic: Average of (started_at - created_at) for tickets started today
    avg_wait_seconds = db.query(
        func.avg(
            extract('epoch', models.QueueTicket.started_at) - 
            extract('epoch', models.QueueTicket.created_at)
        )
    ).filter(
        models.QueueTicket.queue_date == today,
        models.QueueTicket.started_at.isnot(None)
    ).scalar()

    avg_wait_mins = 0
    if avg_wait_seconds:
        avg_wait_mins = int(avg_wait_seconds / 60)

    return {
        "throughput_today": throughput,
        "current_queue_count": queue_count,
        "no_show_rate": no_show_rate,
        "average_wait_time_mins": avg_wait_mins
    }

def get_analytics_export_data(
    db: Session, 
    start_date: date, 
    end_date: date
):
    """
    Fetches detailed visit/ticket data for CSV export within a date range.
    Joins Ticket -> Visit -> Patient, Doctor, Department.
    """
    # Query to fetch all relevant details
    query = (
        db.query(
            models.QueueTicket,
            models.Visit,
            models.Patient,
            models.Doctor,
            models.Department
        )
        .join(models.Visit, models.QueueTicket.visit_id == models.Visit.visit_id)
        .join(models.Patient, models.Visit.patient_id == models.Patient.patient_id)
        .outerjoin(models.Doctor, models.Visit.doctor_id == models.Doctor.doctor_id)
        .outerjoin(models.Department, models.Visit.department_id == models.Department.department_id)
        # Filter by Date Range on the Queue Ticket
        .filter(
            models.QueueTicket.queue_date >= start_date,
            models.QueueTicket.queue_date <= end_date
        )
        .order_by(models.QueueTicket.queue_date.desc(), models.QueueTicket.queue_position.asc())
    )

    return query.all()