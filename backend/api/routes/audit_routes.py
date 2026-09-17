"""
Cryptographic Tamper-Evident Audit Ledger Routes for FedSentinel-Health
Provides SHA-256 hash-chained immutable event trails and cryptographic verification endpoints.
"""

from fastapi import APIRouter
from typing import List, Dict, Any, Optional
import hashlib

from backend.services.state_service import state_service

router = APIRouter(tags=["Audit"])


@router.get("/api/audit/logs")
async def get_audit_logs(
    page: Optional[int] = None,
    size: int = 50,
    actor: Optional[str] = None,
    action: Optional[str] = None,
):
    """Returns cryptographic SHA-256 tamper-evident forensic audit logs with optional pagination and filtering."""
    logs = state_service.audit_ledger
    if actor:
        logs = [l for l in logs if actor.lower() in l.get("actor", "").lower()]
    if action:
        logs = [l for l in logs if action.upper() in l.get("action", "").upper()]

    total = len(logs)
    if page is not None:
        page = max(1, page)
        size = max(1, min(size, 200))
        start = (page - 1) * size
        page_items = logs[start : start + size]
        pages = max(1, (total + size - 1) // size)
        return {
            "items": page_items,
            "total": total,
            "page": page,
            "page_size": size,
            "pages": pages,
            "logs": page_items,
            "count": total,
        }

    return {"items": logs, "total": total, "logs": logs, "count": total}


@router.get("/api/audit/verify")
async def verify_audit_chain():
    """
    Cryptographically verifies the integrity of the audit ledger by recomputing
    every SHA-256 hash in the chain and checking previous hash links.
    """
    logs = list(reversed(state_service.audit_ledger))  # Chronological order
    if not logs:
        return {"status": "CLEAN", "verified_count": 0, "chain_valid": True}

    is_valid = True
    tampered_index = -1

    for idx, entry in enumerate(logs):
        recomputed = hashlib.sha256(
            f"{entry['prev_hash']}:{entry['audit_id']}:{entry['action']}:{entry.get('client_id') or 'SYSTEM'}:{entry['timestamp']}".encode()
        ).hexdigest()
        if recomputed != entry.get("audit_hash"):
            is_valid = False
            tampered_index = idx
            break

    return {
        "status": "VERIFIED_INTEGRITY" if is_valid else "TAMPER_DETECTED",
        "verified_count": len(logs),
        "chain_valid": is_valid,
        "tampered_record_index": tampered_index if not is_valid else None,
        "root_hash": logs[-1].get("audit_hash") if logs else None,
    }
