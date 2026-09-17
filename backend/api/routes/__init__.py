"""
FedSentinel-Health API Routers Export
"""

from backend.api.routes.auth_routes import router as auth_router
from backend.api.routes.client_routes import router as client_router
from backend.api.routes.training_routes import router as training_router
from backend.api.routes.federation_routes import router as federation_router
from backend.api.routes.incident_routes import router as incident_router
from backend.api.routes.audit_routes import router as audit_router
from backend.api.routes.model_routes import router as model_router

__all__ = [
    "auth_router",
    "client_router",
    "training_router",
    "federation_router",
    "incident_router",
    "audit_router",
    "model_router",
]
