"""
WebSocket Telemetry Hub for FedSentinel-Health
Manages active browser connections and broadcasts real-time security telemetry.
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
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

    async def broadcast(self, event_type: str, data: Dict[str, Any]):
        message = json.dumps({"type": event_type, "event_type": event_type, **data})
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
