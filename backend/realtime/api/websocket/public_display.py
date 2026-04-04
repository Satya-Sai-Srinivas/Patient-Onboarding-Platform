from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from realtime.services.connection_manager import manager
from realtime.schemas.message import WebSocketMessage
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws/public-display")
async def public_ws(websocket: WebSocket):
    logger.info("WebSocket connection attempt to public-display...")
    info = None
    try:
        await websocket.accept()
        logger.info("WebSocket connection accepted!")

        info = await manager.connect(websocket, "public_display")
        logger.info(f"Registered with ID: {info.connection_id}")
        
        # Send welcome message
        try:
            await websocket.send_json({
                "event_type": "connected",
                "message": "Connected to public display",
                "connection_id": info.connection_id
            })
            logger.info("Welcome message sent")
        except Exception as e:
            logger.error(f"Error sending welcome: {e}")
        
        # Listen for messages
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received from {info.connection_id}: {data}")
            
            try:
                msg = json.loads(data)
                
                if msg.get("event_type") == "heartbeat":
                    logger.info(f"Heartbeat received from {info.connection_id}")
                    await manager.update_heartbeat(info.connection_id)
                    
                    await manager.send_personal_message(
                        info, 
                        WebSocketMessage(
                            event_type="pong", 
                            channel="public_display", 
                            data={"timestamp": msg.get("timestamp")}
                        )
                    )
                    logger.info(f"Pong sent to {info.connection_id}")
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON from {info.connection_id}: {e}")
                
    except WebSocketDisconnect:
        if info:
            logger.info(f"Client {info.connection_id} disconnected normally")
            await manager.disconnect(info.connection_id)

    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        if info:
            try:
                await manager.disconnect(info.connection_id)
            except Exception:
                pass