"""Event Broadcaster"""
import logging
from realtime.services.connection_manager import manager
from realtime.models.websocket import ChannelType
from realtime.schemas.message import WebSocketMessage
from realtime.schemas.event import *

logger = logging.getLogger("realtime")

async def broadcast_visit_created(event: VisitCreatedEvent):
    message = WebSocketMessage(
        event_type="visit_created",
        channel="all",
        data=event.model_dump(mode="json"),
    )
    await manager.broadcast_to_channel("public_display", message)
    await manager.broadcast_to_channel("admin_dashboard", message)
    if event.doctor_id:
        await manager.broadcast_to_clinician(event.doctor_id, message)

async def broadcast_status_changed(event: StatusChangedEvent):
    message = WebSocketMessage(
        event_type="status_changed",
        channel="all",
        data=event.model_dump(mode="json"),
    )
    await manager.broadcast_to_channel(ChannelType.PUBLIC_DISPLAY.value, message)
    await manager.broadcast_to_channel("admin_dashboard", message)
    if event.doctor_id:
        await manager.broadcast_to_clinician(event.doctor_id, message)

async def broadcast_public_display_update(event: PublicDisplayUpdateEvent):
    message = WebSocketMessage(
        event_type="public_display_update",
        channel="public_display",
        data=event.model_dump(mode="json"),
    )
    await manager.broadcast_to_channel("public_display", message)

async def broadcast_clinician_dashboard_update(event: ClinicianDashboardUpdateEvent):
    message = WebSocketMessage(
        event_type="clinician_dashboard_update",
        channel="clinician",
        data=event.model_dump(mode="json"),
    )
    await manager.broadcast_to_clinician(event.clinician_id, message)

async def broadcast_admin_dashboard_update(event: AdminDashboardUpdateEvent):
    message = WebSocketMessage(
        event_type="admin_dashboard_update",
        channel="admin",
        data=event.model_dump(mode="json"),
    )
    await manager.broadcast_to_channel("admin_dashboard", message)

async def broadcast_dashboard_stats(event: DashboardStatsEvent):
    """Broadcast dashboard statistics"""
    message = WebSocketMessage(
        event_type="dashboard_stats",
        channel="admin",
        data=event.model_dump(mode="json"),
    )
    await manager.broadcast_to_channel("admin_dashboard", message)
    logger.info(f"Broadcasted dashboard_stats: {event.total_patients} patients")