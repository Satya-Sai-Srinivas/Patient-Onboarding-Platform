"""Event schemas for real-time updates"""
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Any, Dict, List
from datetime import datetime, timezone
from enum import Enum

class EventType(str, Enum):
    """Event type enumeration"""
    VISIT_CREATED = "visit_created"
    VISIT_UPDATED = "visit_updated"
    VISIT_COMPLETED = "visit_completed"
    VISIT_CANCELLED = "visit_cancelled"
    PATIENT_CALLED = "patient_called"
    QUEUE_UPDATED = "queue_updated"
    QUEUE_POSITION_CHANGED = "queue_position_changed"
    DASHBOARD_STATS = "dashboard_stats"
    DASHBOARD_REFRESH = "dashboard_refresh"
    NOTIFICATION = "notification"
    ALERT = "alert"
    STATUS_CHANGED = "status_changed"
    PUBLIC_DISPLAY_UPDATE = "public_display_update"
    CLINICIAN_DASHBOARD_UPDATE = "clinician_dashboard_update"
    ADMIN_DASHBOARD_UPDATE = "admin_dashboard_update"

class BaseEvent(BaseModel):
    """Base event schema"""
    event_type: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    data: Optional[Dict[str, Any]] = None

    # Pydantic v2: datetime → ISO string is handled automatically in
    # model_dump(mode='json') — no custom json_encoders needed.
    model_config = ConfigDict()

# Dashboard Events
class DashboardStatsEvent(BaseEvent):
    """Dashboard statistics event"""
    event_type: str = EventType.DASHBOARD_STATS
    total_patients: int = 0
    waiting_patients: int = 0
    in_service_patients: int = 0
    completed_today: int = 0
    average_wait_time: float = 0.0
    active_clinicians: int = 0

class DashboardRefreshEvent(BaseEvent):
    """Dashboard data refresh event"""
    event_type: str = EventType.DASHBOARD_REFRESH
    dashboard_type: str  # admin, clinician, public
    stats: Optional[Dict[str, Any]] = None
    refresh_reason: Optional[str] = None

# Queue Events
class QueueUpdateEvent(BaseEvent):
    """Queue update event"""
    event_type: str = EventType.QUEUE_UPDATED
    queue_length: int
    position: Optional[int] = None
    estimated_wait: Optional[int] = None
    priority: str = "normal"

class QueuePositionChangedEvent(BaseEvent):
    """Queue position changed event"""
    event_type: str = EventType.QUEUE_POSITION_CHANGED
    visit_id: int
    patient_id: int
    patient_name: str
    old_position: int
    new_position: int
    estimated_wait: Optional[int] = None

# Visit Events
class VisitCreatedEvent(BaseEvent):
    """Visit created event"""
    event_type: str = EventType.VISIT_CREATED
    visit_id: int
    patient_id: int
    patient_name: str
    priority: str = "normal"
    check_in_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    queue_position: Optional[int] = None
    reason_for_visit: Optional[str] = None
    doctor_id: Optional[int] = None  # Added for broadcaster compatibility

class VisitUpdatedEvent(BaseEvent):
    """Visit updated event"""
    event_type: str = EventType.VISIT_UPDATED
    visit_id: int
    patient_id: int
    patient_name: Optional[str] = None
    status: str
    previous_status: Optional[str] = None
    room_number: Optional[str] = None
    updated_by: Optional[int] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VisitStatusEvent(BaseEvent):
    """Visit status change event (alias for VisitUpdatedEvent)"""
    event_type: str = EventType.VISIT_UPDATED
    visit_id: int
    patient_id: int
    status: str
    room_number: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VisitCompletedEvent(BaseEvent):
    """Visit completed event"""
    event_type: str = EventType.VISIT_COMPLETED
    visit_id: int
    patient_id: int
    patient_name: str
    check_out_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_duration: int  # in minutes
    services_provided: Optional[List[str]] = None
    notes: Optional[str] = None

class VisitCancelledEvent(BaseEvent):
    """Visit cancelled event"""
    event_type: str = EventType.VISIT_CANCELLED
    visit_id: int
    patient_id: int
    patient_name: str
    cancelled_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    cancelled_by: Optional[int] = None
    cancellation_reason: Optional[str] = None

class PatientCalledEvent(BaseEvent):
    """Patient called to room event"""
    event_type: str = EventType.PATIENT_CALLED
    visit_id: int
    patient_id: int
    patient_name: str
    room_number: str
    clinician_id: Optional[int] = None
    clinician_name: Optional[str] = None
    called_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusChangedEvent(BaseEvent):
    """Generic status change event"""
    entity_type: str  # visit, patient, queue, etc.
    entity_id: int
    old_status: str
    new_status: str
    changed_by: Optional[int] = None
    changed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    doctor_id: Optional[int] = None  # Added for broadcaster compatibility

class PublicDisplayUpdateEvent(BaseEvent):
    """Public display update event"""
    event_type: str = "public_display_update"
    current_queue: List[Dict[str, Any]] = []
    now_serving: Optional[Dict[str, Any]] = None
    average_wait_time: Optional[int] = None
    total_waiting: int = 0
    announcements: Optional[List[str]] = None

class ClinicianDashboardUpdateEvent(BaseEvent):
    """Clinician dashboard update event"""
    event_type: str = "clinician_dashboard_update"
    clinician_id: int
    assigned_patients: List[Dict[str, Any]] = []
    upcoming_patients: List[Dict[str, Any]] = []
    completed_today: int = 0
    current_patient: Optional[Dict[str, Any]] = None
    stats: Optional[Dict[str, Any]] = None

class AdminDashboardUpdateEvent(BaseEvent):
    """Admin dashboard update event"""
    event_type: str = "admin_dashboard_update"
    total_patients: int = 0
    waiting_patients: int = 0
    in_service_patients: int = 0
    completed_today: int = 0
    active_clinicians: int = 0
    average_wait_time: float = 0.0
    queue_by_priority: Optional[Dict[str, int]] = None
    hourly_stats: Optional[List[Dict[str, Any]]] = None
    alerts: Optional[List[str]] = None

# Notification Events
class NotificationEvent(BaseEvent):
    """General notification event"""
    event_type: str = EventType.NOTIFICATION
    title: str
    message: str
    severity: str = "info"  # info, warning, error, success
    target_user: Optional[int] = None
    target_role: Optional[str] = None
    action_url: Optional[str] = None
    dismissible: bool = True

class AlertEvent(BaseEvent):
    """Alert event for urgent notifications"""
    event_type: str = EventType.ALERT
    alert_type: str  # critical, warning, info
    title: str
    message: str
    priority: int = 1  # 1-5, 5 being highest
    target_users: Optional[List[int]] = None
    target_roles: Optional[List[str]] = None
    requires_acknowledgment: bool = False

# Export all event types
__all__ = [
    'EventType',
    'BaseEvent',
    'DashboardStatsEvent',
    'DashboardRefreshEvent',
    'QueueUpdateEvent',
    'QueuePositionChangedEvent',
    'VisitCreatedEvent',
    'VisitUpdatedEvent',
    'VisitStatusEvent',
    'VisitCompletedEvent',
    'VisitCancelledEvent',
    'PatientCalledEvent',
    'StatusChangedEvent',
    'PublicDisplayUpdateEvent',
    'ClinicianDashboardUpdateEvent',
    'AdminDashboardUpdateEvent',
    'NotificationEvent',
    'AlertEvent',
]