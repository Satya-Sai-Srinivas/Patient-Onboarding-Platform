"""Visit Events"""
from fastapi import APIRouter, status
from realtime.schemas.event import VisitCreatedEvent
from realtime.services.event_broadcaster import broadcast_visit_created

router = APIRouter()

@router.post("/visit-created", status_code=status.HTTP_200_OK)
async def trigger_visit_created(event: VisitCreatedEvent):
    await broadcast_visit_created(event)
    return {
        "status": "broadcasted", 
        "visit_id": event.visit_id,
        "patient_id": event.patient_id,
        "patient_name": event.patient_name
    }