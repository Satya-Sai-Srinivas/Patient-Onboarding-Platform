"""Notification Events"""
from fastapi import APIRouter, status
from realtime.schemas.event import DashboardStatsEvent
from realtime.services.event_broadcaster import broadcast_dashboard_stats

router = APIRouter()

@router.post("/dashboard-stats", status_code=status.HTTP_200_OK)
async def trigger_dashboard_stats(event: DashboardStatsEvent):
    await broadcast_dashboard_stats(event)
    return {"status": "broadcasted", "event": "dashboard_stats"}
