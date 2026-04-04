from enum import Enum
class ChannelType(str, Enum):
    PUBLIC_DISPLAY = "public_display"
    CLINICIAN_DASHBOARD = "clinician_dashboard"
    ADMIN_DASHBOARD = "admin_dashboard"
class EventType(str, Enum):
    HEARTBEAT = "heartbeat"
    PONG = "pong"
    CONNECTED = "connected"
