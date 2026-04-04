"""Main entry point for the Healthcare Queue Management API."""
import logging
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from config import settings
from core.router_loader import RouterLoader

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app() -> FastAPI:
    """
    Factory function to create and configure the FastAPI application
    
    Returns:
        FastAPI: Configured application instance
    """
    docs_url    = "/docs"   if settings.docs_enabled else None
    redoc_url   = "/redoc"  if settings.docs_enabled else None
    openapi_url = "/openapi.json" if settings.docs_enabled else None

    app = FastAPI(
        title=settings.app_name,
        description=settings.app_description,
        version=settings.app_version,
        docs_url=docs_url,
        redoc_url=redoc_url,
        openapi_url=openapi_url,
        contact={
            "name": "Patient Onboarding Team",
        },
        license_info={"name": "Private"},
    )
    
    # Configure middleware
    setup_middleware(app)
    
    # Include all routers
    setup_routers(app)
    
    # Setup event handlers
    setup_events(app)
    
    return app


def setup_middleware(app: FastAPI) -> None:
    """Configure application middleware"""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_credentials,
        allow_methods=settings.cors_methods,
        allow_headers=settings.cors_headers,
        expose_headers=["*"],
    )
    logger.info(f"CORS configured for origins: {settings.cors_origins}")


def setup_routers(app: FastAPI) -> dict:
    """Register all available routers using RouterLoader"""
    stats = RouterLoader.register_all_routers(app)
    logger.info(f"Registered {stats['total']} routers successfully")
    
    # Store stats in app state for access in routes
    app.state.router_stats = stats
    return stats


def setup_events(app: FastAPI) -> None:
    """Setup startup and shutdown event handlers"""
    
    @app.on_event("startup")
    async def startup():
        """Initialize services on startup"""
        logger.info(f"{settings.app_name} v{settings.app_version} starting...")
        
        # Start heartbeat monitor if available
        if settings.enable_realtime:
            try:
                from realtime.services.heartbeat_monitor import start_heartbeat_monitor
                start_heartbeat_monitor()
                logger.info("Heartbeat monitor started")
            except ImportError:
                logger.info("Heartbeat monitor not available")
            except Exception as e:
                logger.error(f"Failed to start heartbeat monitor: {e}")
        
        logger.info("Application startup complete!")
    
    @app.on_event("shutdown")
    async def shutdown():
        """Cleanup on shutdown"""
        logger.info("Application shutting down...")
    
    # Root endpoint
    @app.get("/", tags=["Root"])
    async def root():
        """Root endpoint with service information"""
        ws_routes = [
            route.path for route in app.routes 
            if hasattr(route, "path") and "/ws/" in route.path
        ]
        
        return {
            "service": settings.app_name,
            "status": "running",
            "version": settings.app_version,
            "docs": "/docs",
            "redoc": "/redoc",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "websocket_endpoints": ws_routes
        }
    
    # Health check endpoint — used by Docker, Compose, and load balancers
    @app.get("/health", tags=["Health"])
    async def health():
        """
        Liveness + readiness probe.

        Returns HTTP 200 when the app is running. The `db` field reports
        whether a round-trip to the database succeeded.
        """
        from database import engine
        db_ok = False
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            db_ok = True
        except Exception:
            logger.warning("Health check: database probe failed")

        return {
            "status":    "healthy" if db_ok else "degraded",
            "service":   settings.app_name,
            "version":   settings.app_version,
            "db":        "ok" if db_ok else "unreachable",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    
    # Info endpoint
    @app.get("/info", tags=["Root"])
    async def info():
        """Application information and configuration"""
        stats = getattr(app.state, 'router_stats', {})
        return {
            "service": settings.app_name,
            "version": settings.app_version,
            "features": {
                "realtime": settings.enable_realtime,
                "websockets": settings.enable_websockets,
                "events": settings.enable_events
            },
            "endpoints": {
                "docs": "/docs",
                "redoc": "/redoc",
                "openapi": "/openapi.json"
            },
            "stats": {
                "routers_loaded": stats.get('total', 0),
                "standard_routers": stats.get('standard', 0),
                "websocket_routers": stats.get('websocket', 0),
                "event_routers": stats.get('events', 0),
                "failed_routers": stats.get('failed', 0)
            }
        }
        
# Create the application
app = create_app()


# USE MAIN FOR TESTING NOT FOR PRODUCTION CODE, COMMENT BEFORE PUSHING, USE THIS command TO RUN MAIN
# uvicorn main:app --reload

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(
#         "main:app",
#         host="0.0.0.0",
#         port=8000,
#         reload=True,
#         log_level="info"
#     )
