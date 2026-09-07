"""
WebSocket Event Schemas for FedSentinel-Health
Pydantic models for live SOC telemetry broadcast.
"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime


class WebSocketEvent(BaseModel):
    event_type: str = Field(..., description="WSEventType string")
    round_id: int = 0
    client_id: Optional[str] = None
    severity: str = "INFO"
    payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = ""
