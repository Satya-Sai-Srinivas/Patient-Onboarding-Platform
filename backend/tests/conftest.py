"""
Shared pytest fixtures for the backend test suite.

Strategy
--------
* Use an **in-memory SQLite** database so tests run without a live Postgres
  instance and are fully isolated from one another.
* Patch `database.engine` and `database.SessionLocal` *before* any app module
  is imported, so the ORM and all routers bind to the test DB automatically.
* Override the `get_db` FastAPI dependency for every request.
* Drop and recreate all tables between test modules for a clean slate.
"""

import os
import sys

# ── 1. Set environment variables before any app code is imported ──────────────
#    config.py does a fail-fast check for DB_PASSWORD; supply a dummy value so
#    it does not exit during tests.  Also tell the app it is in debug mode so
#    the validator runs in its relaxed mode.
os.environ.setdefault("DB_HOST",     "localhost")
os.environ.setdefault("DB_NAME",     "test_db")
os.environ.setdefault("DB_USER",     "test")
os.environ.setdefault("DB_PASSWORD", "test")          # satisfies validator
os.environ.setdefault("SECRET_KEY",  "test-secret")   # satisfies validator
os.environ.setdefault("DEBUG",       "true")           # skip prod-only checks

# ── 2. Patch database module to use SQLite before importing the app ───────────
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

SQLITE_URL = "sqlite:///./test_patient.db"
test_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

import database as _db_module  # noqa: E402  (import after env setup)
_db_module.engine = test_engine
_db_module.SessionLocal = TestSessionLocal

# ── 3. Create all tables using the test engine ────────────────────────────────
import models  # noqa: E402
models.Base.metadata.create_all(bind=test_engine)

# ── 4. Now safe to import the FastAPI app ─────────────────────────────────────
import pytest                                          # noqa: E402
from fastapi.testclient import TestClient             # noqa: E402
from main import app                                  # noqa: E402
from database import get_db                           # noqa: E402


def _get_test_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def client():
    """
    A TestClient bound to the FastAPI app with the `get_db` dependency
    overridden to use the in-memory SQLite session.
    """
    app.dependency_overrides[get_db] = _get_test_db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture(autouse=True, scope="module")
def _clean_tables():
    """Drop and recreate all tables before each test module."""
    models.Base.metadata.drop_all(bind=test_engine)
    models.Base.metadata.create_all(bind=test_engine)
    yield
    # Leave tables in place for post-mortem inspection; cleaned on next run.
