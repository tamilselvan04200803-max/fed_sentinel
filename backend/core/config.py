"""
FedSentinel-Health Core Configuration
Pydantic Settings with environment variable support.
"""

from __future__ import annotations

import os
from pydantic_settings import BaseSettings
from typing import ClassVar


class Settings(BaseSettings):
    """Application-wide settings loaded from environment variables or .env file."""

    # ── Application ──────────────────────────────────────────────────
    APP_NAME: str = "FedSentinel-Health"
    APP_VERSION: str = "3.0.0"
    DEBUG: bool = False

    # ── Database ─────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./fedsentinel.db"

    # ── Security Thresholds ──────────────────────────────────────────
    ANOMALY_THRESHOLD_AMBER: float = 0.4
    ANOMALY_THRESHOLD_RED: float = 0.7
    TRUST_QUARANTINE_THRESHOLD: float = 0.3
    TRUST_SUSPICIOUS_THRESHOLD: float = 0.7
    MAX_UPDATE_NORM: float = 100.0
    MAX_UPDATE_SIZE_MB: int = 50
    GRADIENT_CLIP_NORM: float = 10.0

    # ── Anomaly Scoring Weights ──────────────────────────────────────
    ANOMALY_WEIGHT_DIRECTION: float = 0.35
    ANOMALY_WEIGHT_MAGNITUDE: float = 0.25
    ANOMALY_WEIGHT_PEER: float = 0.25
    ANOMALY_WEIGHT_LABEL: float = 0.15

    # ── Federation ───────────────────────────────────────────────────
    DEFAULT_NUM_CLIENTS: int = 5
    DEFAULT_LOCAL_EPOCHS: int = 3
    DEFAULT_BATCH_SIZE: int = 32
    DEFAULT_LEARNING_RATE: float = 0.01
    MIN_QUORUM: int = 3
    DEFAULT_NUM_ROUNDS: int = 20

    # ── ML Model ─────────────────────────────────────────────────────
    MODEL_TASK: str = "pneumonia"  # pneumonia | tumor | skin_lesion
    MODEL_NUM_CLASSES: int = 2
    MODEL_IN_CHANNELS: int = 1
    MODEL_IMAGE_SIZE: int = 28
    ROOT_VALIDATION_SIZE: int = 500
    RANDOM_SEED: int = 42

    # ── Trust Computation Weights ────────────────────────────────────
    TRUST_WEIGHT_ANOMALY: float = 0.35
    TRUST_WEIGHT_INFLUENCE: float = 0.25
    TRUST_WEIGHT_HISTORY: float = 0.20
    TRUST_WEIGHT_ROBUSTNESS: float = 0.10
    TRUST_WEIGHT_CONTRIBUTION: float = 0.10
    TRUST_HISTORY_DECAY: float = 0.85

    # ── Server ───────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3002",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3002",
    ]
    LOG_LEVEL: str = "INFO"
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # ── Data Paths ───────────────────────────────────────────────────
    DATA_DIR: str = "./data"
    MODEL_STORE_DIR: str = "./models"

    model_config: ClassVar[dict] = {"env_file": ".env", "env_file_encoding": "utf-8"}


# Singleton settings instance
settings = Settings()
