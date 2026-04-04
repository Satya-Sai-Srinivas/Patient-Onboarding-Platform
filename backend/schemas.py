from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List
from datetime import datetime, date


class AppointmentStartRequest(BaseModel):
    """Request schema for starting an appointment"""
    ticket_id: int = Field(..., description="Queue ticket ID")
    doctor_id: Optional[int] = Field(None, description="Doctor ID")

    model_config = ConfigDict(
        json_schema_extra={"example": {"ticket_id": 3, "doctor_id": 5}}
    )


class AppointmentStartResponse(BaseModel):
    """Response schema for appointment start"""
    success: bool
    message: str
    ticket_id: int
    visit_id: int
    patient_name: str
    queue_status: str
    started_at: str

    model_config = ConfigDict(from_attributes=True)


# OTP Verify Schemas
class OTPVerifyRequest(BaseModel):
    """Request schema for OTP verification"""
    phone_number: str = Field(..., description="Patient's phone number")
    otp_code: str = Field(..., description="6-digit OTP code")
    department_id: Optional[int] = Field(None, description="Department ID")
    doctor_id: Optional[int] = Field(None, description="Doctor ID")
    check_in_method: str = Field(default="OTP", description="Check-in method")

    @field_validator("otp_code")
    @classmethod
    def validate_otp_code(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("OTP code must be exactly 6 digits")
        return v

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        if not v or len(v) < 10:
            raise ValueError("Invalid phone number")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "phone_number": "+1-555-1011",
                "otp_code": "123456",
                "department_id": 5,
                "doctor_id": 9,
                "check_in_method": "OTP",
            }
        }
    )


class OTPVerifyResponse(BaseModel):
    """Response schema for OTP verification"""
    success: bool
    message: str
    patient_id: Optional[int] = None
    visit_id: Optional[int] = None
    ticket_id: Optional[int] = None
    queue_position: Optional[int] = None
    estimated_wait_time: Optional[int] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "success": True,
                "message": "Check-in successful",
                "patient_id": 6,
                "visit_id": 16,
                "ticket_id": 16,
                "queue_position": 2,
                "estimated_wait_time": 30,
            }
        },
    )


# Request/Response Models
class QRCheckInRequest(BaseModel):
    phone_number: str
    qr_code_value: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "phone_number": "1234567890",
                "qr_code_value": "345678",
                "first_name": "Jane",
                "last_name": "Doe",
                "date_of_birth": "1990-05-20",
            }
        },
    )


class QRCheckInResponse(BaseModel):
    success: bool
    message: str
    patient_id: int
    visit_id: int
    ticket_id: int
    queue_position: int


class StatusUpdate(BaseModel):
    status: str


# Patient search response model
class PatientSearchResponse(BaseModel):
    patient_id: int
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    rfid_tag: Optional[str] = None
    preferred_language: Optional[str] = None
    doctor_id: Optional[int] = None
    patient_type: Optional[str] = None
    is_active: bool
    emergency_contact_name: Optional[str] = None
    emergency_contact_number: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Request model
class OTPSendRequest(BaseModel):
    phone_number: str


# Response model
class OTPSendResponse(BaseModel):
    message: str
    otp_id: int
    otp_code: str
    expires_at: str


# Request/Response Models
class SMSCheckinRequest(BaseModel):
    phone_number: str
    message_body: str


class SMSCheckinResponse(BaseModel):
    success: bool
    message: str
    otp_required: bool = False
    visit_id: Optional[int] = None
    queue_position: Optional[int] = None


# Response Models
class QueuePatient(BaseModel):
    ticket_id: int
    patient_name: str
    queue_position: int
    queue_status: str
    estimated_wait_time: int
    check_in_time: str

    model_config = ConfigDict(from_attributes=True)


class ClinicianQueueResponse(BaseModel):
    doctor_id: int
    doctor_name: str
    department_name: str
    total_patients: int
    queue_tickets: List[QueuePatient]


# Response Model
class AppointmentStatusResponse(BaseModel):
    visit_id: int
    patient_name: str
    doctor_name: str
    department_name: str
    visit_date: str
    visit_status: str
    check_in_datetime: Optional[str] = None
    queue_status: Optional[str] = None
    queue_position: Optional[int] = None
    estimated_wait_time: Optional[int] = None
    called_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CompleteAppointmentRequest(BaseModel):
    ticket_id: int


class CompleteAppointmentResponse(BaseModel):
    success: bool
    message: str
    ticket_id: int
    visit_id: int
    completed_at: datetime


# --- Visit/Appointment Schemas ---
class VisitCreate(BaseModel):
    patient_id: int
    doctor_id: int
    department_id: int


class VisitResponse(BaseModel):
    visit_id: int
    visit_date: date
    visit_status: str
    check_in_datetime: datetime


# --- Queue Schemas ---
class QueueTicketResponse(BaseModel):
    ticket_id: int
    queue_position: int
    estimated_wait_time: int
    queue_status: str


class QueueOverrideRequest(BaseModel):
    """Schema for Admin overriding a queue position"""
    new_position: int = Field(..., gt=0, description="The new target position for the patient")

    model_config = ConfigDict(
        json_schema_extra={"example": {"new_position": 1}}
    )


class DashboardMetrics(BaseModel):
    throughput_today: int
    average_wait_time_mins: int
    current_queue_count: int
    no_show_rate: float

    model_config = ConfigDict(from_attributes=True)
