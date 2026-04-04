from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import WebSocket
@dataclass
class ConnectionInfo:
    connection_id: str
    websocket: WebSocket
    channel: str
    user_id: Optional[int] = None
    clinician_id: Optional[int] = None
    connected_at: datetime = field(default_factory=datetime.utcnow)
    last_heartbeat: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)
    def update_heartbeat(self):
        self.last_heartbeat = datetime.utcnow()
    def is_stale(self, timeout_seconds: int = 60) -> bool:
        return (datetime.utcnow() - self.last_heartbeat).total_seconds() > timeout_seconds
