"""Router loading and registration module"""
from fastapi import FastAPI, APIRouter
import logging
from typing import List, Tuple, Optional

logger = logging.getLogger(__name__)

class RouterConfig:
    """Configuration for a router to be loaded"""
    def __init__(
        self,
        module_path: str,
        router_name: str = "router",
        prefix: str = "",
        tags: Optional[List[str]] = None
    ):
        self.module_path = module_path
        self.router_name = router_name
        self.prefix = prefix
        self.tags = tags or []


class RouterLoader:
    """Manages loading and registration of routers"""
    
    # Define all routers to load
    STANDARD_ROUTERS = [
        RouterConfig("routers.apiRouter", prefix="", tags=["API"]),
        RouterConfig("routers.dashboards", prefix="", tags=["Dashboards"]),
        RouterConfig("routers.queue_state", prefix="", tags=["Queue State"]), 
    ]
    
    WEBSOCKET_ROUTERS = [
        RouterConfig("realtime.api.websocket.admin_dashboard", prefix="", tags=["WebSocket - Admin"]),
        RouterConfig("realtime.api.websocket.clinician_dashboard", prefix="", tags=["WebSocket - Clinician"]),
        RouterConfig("realtime.api.websocket.public_display", prefix="", tags=["WebSocket - Public"]),
    ]
    
    EVENT_ROUTERS = [
        RouterConfig("realtime.api.events.dashboard_events", prefix="/api/events", tags=["Events - Dashboard"]),
        RouterConfig("realtime.api.events.notification_events", prefix="/api/events", tags=["Events - Notifications"]),
        RouterConfig("realtime.api.events.queue_events", prefix="/api/events", tags=["Events - Queue"]),
        RouterConfig("realtime.api.events.visit_events", prefix="/api/events", tags=["Events - Visits"]),
    ]
    
    @staticmethod
    def load_router(config: RouterConfig) -> Tuple[Optional[object], bool]:
        """
        Load a single router module
        
        Args:
            config: RouterConfig with module details
            
        Returns:
            Tuple of (router object, success boolean)
        """
        try:
            module = __import__(config.module_path, fromlist=[config.router_name])
            router = getattr(module, config.router_name)
            return router, True
        except (ImportError, AttributeError) as e:
            logger.warning(f"Failed to load {config.module_path}: {e}")
            return None, False
    
    @staticmethod
    def register_router(app: FastAPI, config: RouterConfig) -> bool:
        """
        Load and register a router with the app
        
        Args:
            app: FastAPI application instance
            config: RouterConfig with module details
            
        Returns:
            bool: Success status
        """
        router, success = RouterLoader.load_router(config)
        if success and router:
            app.include_router(router, prefix=config.prefix, tags=config.tags)
            logger.info(f"Registered: {config.module_path} at {config.prefix or '/'}")
            return True
        return False
    
    @staticmethod
    def register_all_routers(app: FastAPI) -> dict:
        """
        Register all available routers
        
        Args:
            app: FastAPI application instance
            
        Returns:
            dict: Statistics about loaded routers
        """
        stats = {
            "standard": 0,
            "websocket": 0,
            "events": 0,
            "total": 0,
            "failed": 0
        }
        
        # Load standard routers
        for config in RouterLoader.STANDARD_ROUTERS:
            if RouterLoader.register_router(app, config):
                stats["standard"] += 1
                stats["total"] += 1
            else:
                stats["failed"] += 1
        
        # Load WebSocket routers
        for config in RouterLoader.WEBSOCKET_ROUTERS:
            if RouterLoader.register_router(app, config):
                stats["websocket"] += 1
                stats["total"] += 1
            else:
                stats["failed"] += 1
        
        # Load event routers
        for config in RouterLoader.EVENT_ROUTERS:
            if RouterLoader.register_router(app, config):
                stats["events"] += 1
                stats["total"] += 1
            else:
                stats["failed"] += 1
        
        logger.info(
            f"Router Stats - Total: {stats['total']}, "
            f"Standard: {stats['standard']}, "
            f"WebSocket: {stats['websocket']}, "
            f"Events: {stats['events']}, "
            f"Failed: {stats['failed']}"
        )
        
        return stats