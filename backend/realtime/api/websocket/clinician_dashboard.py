from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from realtime.services.connection_manager import manager
from realtime.schemas.message import WebSocketMessage
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws/clinician/{clinician_id}")
async def clinician_ws(websocket: WebSocket, clinician_id: int):
    logger.info(f"WebSocket connection attempt to clinician-dashboard (ID: {clinician_id})...")
    info = None
    try:
        await websocket.accept()
        logger.info(f"WebSocket connection accepted for clinician {clinician_id}!")

        info = await manager.connect(websocket, "clinician_dashboard", clinician_id=clinician_id)
        logger.info(f"Registered with ID: {info.connection_id}")
        
        # Send welcome message
        try:
            await websocket.send_json({
                "event_type": "connected",
                "message": f"Connected to clinician dashboard",
                "clinician_id": clinician_id,
                "connection_id": info.connection_id
            })
            logger.info(f"Welcome message sent to clinician {clinician_id}")
        except Exception as e:
            logger.error(f"Error sending welcome: {e}")
        
        # Listen for messages
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received from clinician {clinician_id}: {data}")
            
            try:
                msg = json.loads(data)
                
                if msg.get("event_type") == "heartbeat":
                    logger.info(f"Heartbeat received from clinician {clinician_id}")
                    await manager.update_heartbeat(info.connection_id)
                    
                    await manager.send_personal_message(
                        info, 
                        WebSocketMessage(
                            event_type="pong", 
                            channel="clinician_dashboard", 
                            data={"timestamp": msg.get("timestamp")}
                        )
                    )
                    logger.info(f"Pong sent to clinician {clinician_id}")
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON from clinician {clinician_id}: {e}")
                
    except WebSocketDisconnect:
        if info:
            logger.info(f"Clinician {clinician_id} disconnected normally")
            await manager.disconnect(info.connection_id)

    except Exception as e:
        logger.error(f"WebSocket error for clinician {clinician_id}: {e}", exc_info=True)
        if info:
            try:
                await manager.disconnect(info.connection_id)
            except Exception:
                pass