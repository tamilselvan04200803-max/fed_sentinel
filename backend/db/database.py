"""
Database Connection and Session Management for FedSentinel-Health
SQLAlchemy engine supporting SQLite (local development) and PostgreSQL (production).
"""

from __future__ import annotations
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.core.config import settings

# SQLite connection args for multi-threaded FastAPI access
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db():
    """Initializes all database tables from ORM metadata."""
    from backend.db import models  # Ensure models are imported
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency for yielding transactional DB sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
