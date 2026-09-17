"""
WebSocket Telemetry Hub for FedSentinel-Health
Manages active browser connections and broadcasts real-time security telemetry.
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Any, Optional
import logging
import json

logger = logging.getLogger("fedsentinel.ws")


class WebSocketHub:
    """Central WebSocket broadcaster for live SOC updates."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(
        self,
        event_type: str,
        data: Optional[Dict[str, Any]] = None,
        round_id: int = 0,
        client_id: str = "SYSTEM",
        payload: Optional[Dict[str, Any]] = None,
    ):
        body = payload or data or {}
        from datetime import datetime, timezone
        message = json.dumps({
            "type": event_type,
            "event_type": event_type,
            "round_id": round_id,
            "client_id": client_id,
            "payload": body,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **({"data": body} if data is not None else {})
        })
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)


# Global singleton instance
ws_hub = WebSocketHub()
ws_manager = ws_hub  # Alias for main.py compatibility
