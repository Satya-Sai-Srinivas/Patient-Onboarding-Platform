"""
Connection Manager Service
Handles WebSocket connections and message broadcasting
"""

from typing import Dict, List, Optional
from fastapi import WebSocket
from realtime.models.connection import ConnectionInfo
from realtime.schemas.message import WebSocketMessage
import uuid
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)


def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        # Store all active connections
        self.active_connections: Dict[str, ConnectionInfo] = {}
        
        # Index connections by channel for efficient broadcasting
        self.connections_by_channel: Dict[str, List[str]] = {}
        
        # Index connections by user/clinician ID
        self.connections_by_user: Dict[int, List[str]] = {}
        self.connections_by_clinician: Dict[int, List[str]] = {}
    
    async def connect(
        self,
        websocket: WebSocket,
        channel: str,
        user_id: Optional[int] = None,
        clinician_id: Optional[int] = None
    ) -> ConnectionInfo:
        """
        Register a new WebSocket connection
        Note: websocket.accept() should be called BEFORE this method
        """
        # Generate unique connection ID
        connection_id = str(uuid.uuid4())
        
        # Create connection info
        info = ConnectionInfo(
            connection_id=connection_id,
            websocket=websocket,
            channel=channel,
            user_id=user_id,
            clinician_id=clinician_id
        )
        
        # Store connection
        self.active_connections[connection_id] = info
        
        # Index by channel
        if channel not in self.connections_by_channel:
            self.connections_by_channel[channel] = []
        self.connections_by_channel[channel].append(connection_id)
        
        # Index by user_id if provided
        if user_id is not None:
            if user_id not in self.connections_by_user:
                self.connections_by_user[user_id] = []
            self.connections_by_user[user_id].append(connection_id)
        
        # Index by clinician_id if provided
        if clinician_id is not None:
            if clinician_id not in self.connections_by_clinician:
                self.connections_by_clinician[clinician_id] = []
            self.connections_by_clinician[clinician_id].append(connection_id)
        
        logger.info(f"Connection {connection_id} registered - Channel: {channel}, User: {user_id}, Clinician: {clinician_id}")
        logger.info(f"Total connections: {len(self.active_connections)}")
        
        return info
    
    async def disconnect(self, connection_id: str):
        """Remove a connection"""
        if connection_id not in self.active_connections:
            logger.warning(f"Connection {connection_id} not found")
            return
        
        info = self.active_connections[connection_id]
        
        # Remove from channel index
        if info.channel in self.connections_by_channel:
            if connection_id in self.connections_by_channel[info.channel]:
                self.connections_by_channel[info.channel].remove(connection_id)
            
            # Clean up empty channel list
            if not self.connections_by_channel[info.channel]:
                del self.connections_by_channel[info.channel]
        
        # Remove from user index
        if info.user_id is not None:
            if info.user_id in self.connections_by_user:
                if connection_id in self.connections_by_user[info.user_id]:
                    self.connections_by_user[info.user_id].remove(connection_id)
                
                # Clean up empty user list
                if not self.connections_by_user[info.user_id]:
                    del self.connections_by_user[info.user_id]
        
        # Remove from clinician index
        if info.clinician_id is not None:
            if info.clinician_id in self.connections_by_clinician:
                if connection_id in self.connections_by_clinician[info.clinician_id]:
                    self.connections_by_clinician[info.clinician_id].remove(connection_id)
                
                # Clean up empty clinician list
                if not self.connections_by_clinician[info.clinician_id]:
                    del self.connections_by_clinician[info.clinician_id]
        
        # Remove from main dictionary
        del self.active_connections[connection_id]
        
        logger.info(f"🔌 Connection {connection_id} disconnected")
        logger.info(f"Total connections: {len(self.active_connections)}")
    
    async def update_heartbeat(self, connection_id: str):
        """Update the last heartbeat timestamp for a connection"""
        if connection_id in self.active_connections:
            self.active_connections[connection_id].update_heartbeat()
    
    async def send_personal_message(self, info: ConnectionInfo, message: WebSocketMessage):
        """Send a message to a specific connection"""
        try:
            # Convert to dict with datetime serialization
            message_dict = json.loads(json.dumps(message.model_dump(), default=json_serial))
            await info.websocket.send_json(message_dict)
        except Exception as e:
            logger.error(f"Error sending message to {info.connection_id}: {e}")
            await self.disconnect(info.connection_id)
    
    async def broadcast_to_channel(self, channel: str, message: WebSocketMessage):
        """Broadcast a message to all connections in a channel"""
        if channel not in self.connections_by_channel:
            logger.warning(f"No connections in channel: {channel}")
            return
        
        connection_ids = self.connections_by_channel[channel].copy()
        logger.info(f"Broadcasting to {len(connection_ids)} connections in channel: {channel}")
        
        disconnected = []
        
        # Serialize message once
        try:
            message_dict = json.loads(json.dumps(message.model_dump(), default=json_serial))
        except Exception as e:
            logger.error(f"Error serializing message: {e}")
            return
        
        for connection_id in connection_ids:
            if connection_id in self.active_connections:
                info = self.active_connections[connection_id]
                try:
                    await info.websocket.send_json(message_dict)
                except Exception as e:
                    logger.error(f"Error broadcasting to {connection_id}: {e}")
                    disconnected.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected:
            await self.disconnect(connection_id)
    
    async def broadcast_to_user(self, user_id: int, message: WebSocketMessage):
        """Broadcast a message to all connections for a specific user"""
        if user_id not in self.connections_by_user:
            logger.warning(f"No connections for user: {user_id}")
            return
        
        connection_ids = self.connections_by_user[user_id].copy()
        logger.info(f"Broadcasting to {len(connection_ids)} connections for user: {user_id}")
        
        disconnected = []
        
        # Serialize message once
        try:
            message_dict = json.loads(json.dumps(message.model_dump(), default=json_serial))
        except Exception as e:
            logger.error(f"Error serializing message: {e}")
            return
        
        for connection_id in connection_ids:
            if connection_id in self.active_connections:
                info = self.active_connections[connection_id]
                try:
                    await info.websocket.send_json(message_dict)
                except Exception as e:
                    logger.error(f"Error broadcasting to {connection_id}: {e}")
                    disconnected.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected:
            await self.disconnect(connection_id)
    
    async def broadcast_to_clinician(self, clinician_id: int, message: WebSocketMessage):
        """Broadcast a message to all connections for a specific clinician"""
        if clinician_id not in self.connections_by_clinician:
            logger.warning(f"No connections for clinician: {clinician_id}")
            logger.info(f"Available clinicians: {list(self.connections_by_clinician.keys())}")
            return
        
        connection_ids = self.connections_by_clinician[clinician_id].copy()
        logger.info(f"Broadcasting to {len(connection_ids)} connections for clinician: {clinician_id}")
        
        disconnected = []
        sent_count = 0
        
        # Serialize message once
        try:
            message_dict = json.loads(json.dumps(message.model_dump(), default=json_serial))
            logger.info(f"Message to send: {message_dict.get('event_type', 'unknown')}")
        except Exception as e:
            logger.error(f"Error serializing message: {e}")
            return
        
        for connection_id in connection_ids:
            if connection_id in self.active_connections:
                info = self.active_connections[connection_id]
                try:
                    await info.websocket.send_json(message_dict)
                    sent_count += 1
                    logger.info(f"Sent to connection {connection_id[:8]}... (clinician {clinician_id})")
                except Exception as e:
                    logger.error(f"Error broadcasting to {connection_id}: {e}")
                    disconnected.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected:
            await self.disconnect(connection_id)
        
        logger.info(f"Broadcast complete: {sent_count}/{len(connection_ids)} messages sent to clinician {clinician_id}")
    
    def get_connection_stats(self) -> dict:
        """Get statistics about current connections"""
        return {
            "total_connections": len(self.active_connections),
            "channels": {
                channel: len(conn_ids) 
                for channel, conn_ids in self.connections_by_channel.items()
            },
            "users": len(self.connections_by_user),
            "clinicians": len(self.connections_by_clinician)
        }
    
    def get_stale_connections(self, timeout_seconds: int = 60) -> List[str]:
        """Get list of connection IDs that haven't sent heartbeat recently"""
        stale = []
        for connection_id, info in self.active_connections.items():
            if info.is_stale(timeout_seconds):
                stale.append(connection_id)
        return stale


# Global manager instance
manager = ConnectionManager()