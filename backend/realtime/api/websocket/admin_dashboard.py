from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from realtime.services.connection_manager import manager
from realtime.schemas.message import WebSocketMessage
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws/admin/{user_id}")
async def admin_ws(websocket: WebSocket, user_id: int):
    logger.info(f"WebSocket connection attempt to admin-dashboard (User ID: {user_id})...")
    info = None
    try:
        await websocket.accept()
        logger.info(f"WebSocket connection accepted for admin user {user_id}!")

        info = await manager.connect(websocket, "admin_dashboard", user_id=user_id)
        logger.info(f"Registered with ID: {info.connection_id}")
        
        # Send welcome message
        try:
            await websocket.send_json({
                "event_type": "connected",
                "message": f"Connected to admin dashboard",
                "user_id": user_id,
                "connection_id": info.connection_id
            })
            logger.info(f"Welcome message sent to admin user {user_id}")
        except Exception as e:
            logger.error(f"Error sending welcome: {e}")
        
        # Listen for messages
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received from admin user {user_id}: {data}")
            
            try:
                msg = json.loads(data)
                
                if msg.get("event_type") == "heartbeat":
                    logger.info(f"Heartbeat received from admin user {user_id}")
                    await manager.update_heartbeat(info.connection_id)
                    
                    await manager.send_personal_message(
                        info, 
                        WebSocketMessage(
                            event_type="pong", 
                            channel="admin_dashboard", 
                            data={"timestamp": msg.get("timestamp")}
                        )
                    )
                    logger.info(f"Pong sent to admin user {user_id}")
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON from admin user {user_id}: {e}")
                
    except WebSocketDisconnect:
        if info:
            logger.info(f"Admin user {user_id} disconnected normally")
            await manager.disconnect(info.connection_id)

    except Exception as e:
        logger.error(f"WebSocket error for admin user {user_id}: {e}", exc_info=True)
        if info:
            try:
                await manager.disconnect(info.connection_id)
            except Exception:
                pass