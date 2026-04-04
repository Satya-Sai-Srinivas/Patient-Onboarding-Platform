"""Queue Events"""
from fastapi import APIRouter, status
from realtime.schemas.event import StatusChangedEvent
from realtime.services.event_broadcaster import broadcast_status_changed

router = APIRouter()

@router.post("/status-changed", status_code=status.HTTP_200_OK)
async def trigger_status_changed(event: StatusChangedEvent):
    await broadcast_status_changed(event)
    return {"status": "broadcasted"}
