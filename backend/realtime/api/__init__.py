from fastapi import APIRouter
from realtime.api.websocket.public_display import router as pub
from realtime.api.websocket.clinician_dashboard import router as cli
from realtime.api.websocket.admin_dashboard import router as adm
websocket_router = APIRouter()
websocket_router.include_router(pub)
websocket_router.include_router(cli)
websocket_router.include_router(adm)
events_router = APIRouter()
