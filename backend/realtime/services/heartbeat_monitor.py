"""
Heartbeat Monitor Service
Monitors WebSocket connections and disconnects stale ones
"""

import asyncio
import logging
from realtime.services.connection_manager import manager

logger = logging.getLogger(__name__)

async def heartbeat_monitor():
    """
    Background task that monitors connection health
    Disconnects connections that haven't sent heartbeat in 60 seconds
    """
    logger.info("Heartbeat monitor started")
    
    while True:
        try:
            # Wait 30 seconds between checks
            await asyncio.sleep(30)
            
            # Get stale connections (no heartbeat for 60 seconds)
            stale = manager.get_stale_connections(timeout_seconds=60)
            
            if stale:
                logger.warning(f"Found {len(stale)} stale connections")
                
                # Disconnect stale connections
                for connection_id in stale:
                    logger.warning(f"Disconnecting stale connection: {connection_id}")
                    await manager.disconnect(connection_id)
            else:
                # Log stats periodically
                stats = manager.get_connection_stats()
                logger.info(f"Heartbeat check - Active connections: {stats['total_connections']}")
                
        except Exception as e:
            logger.error(f"Error in heartbeat monitor: {e}")
            import traceback
            logger.error(traceback.format_exc())


def start_heartbeat_monitor():
    """
    Start the heartbeat monitor as a background task
    Called from app.py on startup
    """
    asyncio.create_task(heartbeat_monitor())
    logger.info("Heartbeat monitor task created")