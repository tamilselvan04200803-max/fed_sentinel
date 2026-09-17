"""
Incident Response and Forensic Triage Routes for FedSentinel-Health
Manages security incidents, blast radius calculations, forensic evidence packages, and remediation actions.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import hashlib

from backend.schemas.incidents import Incident
from backend.services.state_service import state_service
from backend.api.websocket import ws_hub
from backend.core.auth import get_current_user, UserContext

router = APIRouter(tags=["Incidents"])


class IncidentActionPayload(BaseModel):
    action: str  # CONFIRM_QUARANTINE | OVERRIDE_REINSTATE | REQUEST_EVIDENCE
    reason: str
    actor: Optional[str] = "SecOps Lead Analyst"


@router.get("/api/incidents")
async def get_incidents(
    page: Optional[int] = None,
    size: int = 50,
    severity: Optional[str] = None,
    status: Optional[str] = None,
):
    """Returns all open and resolved security incidents with optional pagination and filtering."""
    incidents = state_service.incidents
    if severity:
        incidents = [i for i in incidents if i.severity.upper() == severity.strip().upper()]
    if status:
        incidents = [i for i in incidents if getattr(i, "status", "OPEN").upper() == status.strip().upper()]

    if page is not None:
        total = len(incidents)
        page = max(1, page)
        size = max(1, min(size, 200))
        start = (page - 1) * size
        items = [i.model_dump() for i in incidents[start : start + size]]
        pages = max(1, (total + size - 1) // size)
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": size,
            "pages": pages,
        }

    return [i.model_dump() for i in incidents]


@router.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: str):
    """Returns full forensic evidence package and blast radius for a specific incident."""
    target_id = incident_id.strip().upper()
    for inc in state_service.incidents:
        if inc.incident_id.upper() == target_id:
            return {"incident": inc.model_dump(), **inc.model_dump()}
    raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")


@router.post("/api/incidents/{incident_id}/action")
async def take_incident_action(incident_id: str, req: IncidentActionPayload, user_ctx: UserContext = Depends(get_current_user)):
    """Logs an auditable analyst triage action (CONFIRM_QUARANTINE, OVERRIDE_REINSTATE, REQUEST_EVIDENCE)."""
    target_id = incident_id.strip().upper()
    inc = next((i for i in state_service.incidents if i.incident_id.upper() == target_id), None)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")

    actor = req.actor or user_ctx.full_name
    action_record = state_service.append_audit_event(
        action=f"INCIDENT_ACTION_{req.action}",
        actor=actor,
        client_id=inc.client_id,
        reason=req.reason,
        incident_id=inc.incident_id,
    )

    if req.action == "CONFIRM_QUARANTINE":
        inc.action_taken = "QUARANTINED"
        target_client = state_service.get_client(inc.client_id)
        if target_client:
            target_client.status = "QUARANTINED"
            state_service._persist_client(target_client)
    elif req.action == "OVERRIDE_REINSTATE":
        inc.action_taken = "REINSTATED"
        target_client = state_service.get_client(inc.client_id)
        if target_client:
            target_client.status = "TRUSTED"
            target_client.trust_score = max(80.0, target_client.trust_score)
            state_service._persist_client(target_client)

    state_service.update_incident(inc)

    await ws_hub.broadcast(
        event_type="INCIDENT_ACTION_LOGGED",
        round_id=inc.round_id,
        client_id="AUDIT",
        payload=action_record,
    )

    return {"status": "ACTION_LOGGED", "record": action_record}
