from pydantic import BaseModel, Field
from typing import Dict, Any
from datetime import datetime, timezone
import uuid
import json


def serialize_for_json(obj: Any) -> Any:
    """Recursively convert non-JSON-serializable objects to serializable form."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: serialize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [serialize_for_json(item) for item in obj]
    return obj


class WebSocketMessage(BaseModel):
    event_type: str
    channel: str
    data: Dict[str, Any]
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    def model_dump(self, **kwargs) -> Dict[str, Any]:
        """Ensure all datetime values nested inside `data` are serialized."""
        d = super().model_dump(**kwargs)
        d["data"] = serialize_for_json(d["data"])
        return d

    def to_json(self) -> str:
        return json.dumps(self.model_dump())
