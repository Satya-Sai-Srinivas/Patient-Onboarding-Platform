from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import List
import logging
import sys

logger = logging.getLogger(__name__)

_SENTINEL_PASSWORD = ""
_SENTINEL_SECRET   = "changeme"


class Settings(BaseSettings):
    """Centralized application configuration"""

    # --- App Info ---
    app_name: str = "Healthcare Queue Management API"
    app_version: str = "1.0.0"
    app_description: str = (
        "Unified REST + WebSocket API for patient check-in, queue management, "
        "and real-time clinical dashboards."
    )

    # --- Server Config ---
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = False
    debug: bool = False

    # --- Security ---
    secret_key: str = _SENTINEL_SECRET

    # --- Database Config ---
    db_host: str = "localhost"
    db_port: str = "5432"
    db_name: str = "patient_db"
    db_user: str = "postgres"
    db_password: str = _SENTINEL_PASSWORD

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    # --- CORS ---
    # List specific origins for dev; override via CORS_ORIGINS env var in production.
    # Wildcards ("*") are incompatible with allow_credentials=True in browsers.
    cors_origins: List[str] = [
        "http://localhost:5173",   # Vite web app (dev)
        "http://localhost:4173",   # Vite preview
        "http://localhost:8081",   # Expo web (Metro)
        "http://localhost:19006",  # Expo web (legacy port)
        "http://localhost:19000",  # Expo dev tools
    ]
    cors_credentials: bool = True
    cors_methods: List[str] = ["*"]
    cors_headers: List[str] = ["*"]

    # --- Logging ---
    log_level: str = "INFO"

    # --- Feature Flags ---
    enable_realtime: bool = True
    enable_websockets: bool = True
    enable_events: bool = True

    # --- Docs ---
    # Set DOCS_ENABLED=false in production to disable /docs and /redoc
    docs_enabled: bool = True

    @model_validator(mode="after")
    def _validate_production_secrets(self) -> "Settings":
        """Crash early if required secrets are missing in non-debug mode."""
        errors: List[str] = []

        if not self.debug:
            if self.db_password == _SENTINEL_PASSWORD:
                errors.append(
                    "DB_PASSWORD is not set. "
                    "Add it to your .env file or environment."
                )
            if self.secret_key == _SENTINEL_SECRET:
                errors.append(
                    "SECRET_KEY is still the default 'changeme'. "
                    "Set a strong random value in .env (e.g. `openssl rand -hex 32`)."
                )

        if errors:
            for msg in errors:
                logger.error("Configuration error: %s", msg)
            # Hard exit so the container never starts in a broken state
            sys.exit(
                "\n[CONFIG ERROR] Application cannot start:\n  - "
                + "\n  - ".join(errors)
            )

        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",
    )


# Global settings instance — validates on first import
settings = Settings()

