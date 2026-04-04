"""Dashboard Events"""
from fastapi import APIRouter, status
from realtime.schemas.event import PublicDisplayUpdateEvent, ClinicianDashboardUpdateEvent, AdminDashboardUpdateEvent
from realtime.services.event_broadcaster import broadcast_public_display_update, broadcast_clinician_dashboard_update, broadcast_admin_dashboard_update

router = APIRouter()

@router.post("/public-display-update", status_code=status.HTTP_200_OK)
async def trigger_public_display(event: PublicDisplayUpdateEvent):
    await broadcast_public_display_update(event)
    return {"status": "broadcasted"}

@router.post("/clinician-dashboard-update", status_code=status.HTTP_200_OK)
async def trigger_clinician_dashboard(event: ClinicianDashboardUpdateEvent):
    await broadcast_clinician_dashboard_update(event)
    return {"status": "broadcasted"}

@router.post("/admin-dashboard-update", status_code=status.HTTP_200_OK)
async def trigger_admin_dashboard(event: AdminDashboardUpdateEvent):
    await broadcast_admin_dashboard_update(event)
    return {"status": "broadcasted"}
