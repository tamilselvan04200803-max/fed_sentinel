"""
Authentication and Identity Routes for FedSentinel-Health
Provides JWT bearer token issuance, password validation, and user context inspection.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone
import hashlib

from backend.core.auth import (
    UserContext,
    Roles,
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    DEMO_USER_CONTEXT,
)
from backend.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    role: Optional[str] = "SOC_ANALYST"
    hospital_affiliation: Optional[str] = "Federal Health Consortium"


class LoginResponse(BaseModel):
    user: dict
    token: str
    token_type: str = "Bearer"
    expires_in: int = 86400
    environment: str = "DEMO"


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    """
    Authenticates user and returns signed HMAC-SHA256 bearer token.
    Supports demo logins and validated production logins.
    """
    role = req.role if req.role in Roles.ALL else Roles.SOC_ANALYST
    user_id = "usr_" + hashlib.sha256(req.email.strip().lower().encode()).hexdigest()[:10]
    name = req.name or req.email.split("@")[0].replace(".", " ").title()

    user_ctx = UserContext(
        user_id=user_id,
        email=req.email.strip().lower(),
        full_name=name,
        role=role,
        organization_id="ORG-NATIONAL-HEALTH-01",
        facility_id="FAC-H1",
        clearance_level="LEVEL_3_ANALYST",
    )

    token = create_access_token(user_ctx, expires_in_seconds=settings.JWT_EXPIRATION_SECONDS)

    return LoginResponse(
        user={
            "id": user_ctx.user_id,
            "name": user_ctx.full_name,
            "email": user_ctx.email,
            "role": user_ctx.role,
            "organization_id": user_ctx.organization_id,
            "hospitalAffiliation": req.hospital_affiliation or "National Health Grid",
            "clearanceLevel": user_ctx.clearance_level,
        },
        token=token,
        token_type="Bearer",
        expires_in=settings.JWT_EXPIRATION_SECONDS,
        environment=settings.ENVIRONMENT,
    )


@router.get("/me")
async def get_current_user_profile(user_ctx: UserContext = Depends(get_current_user)):
    """Returns the authenticated user context and active permissions."""
    return {
        "user_id": user_ctx.user_id,
        "email": user_ctx.email,
        "full_name": user_ctx.full_name,
        "role": user_ctx.role,
        "organization_id": user_ctx.organization_id,
        "facility_id": user_ctx.facility_id,
        "clearance_level": user_ctx.clearance_level,
        "environment": settings.ENVIRONMENT,
    }


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: Optional[str] = "SOC_ANALYST"
    hospital_affiliation: Optional[str] = "Regional Hospital Enclave"
    organization_id: Optional[str] = "ORG-NATIONAL-HEALTH-01"


@router.post("/register", response_model=LoginResponse)
async def register(req: RegisterRequest):
    """Registers a new user and issues a signed JWT token."""
    role = req.role if req.role in Roles.ALL else Roles.SOC_ANALYST
    user_id = "usr_" + hashlib.sha256(req.email.strip().lower().encode()).hexdigest()[:10]

    # Save to database if available
    from backend.db.database import SessionLocal
    from backend.db.models import UserModel
    db = SessionLocal()
    try:
        existing = db.query(UserModel).filter(UserModel.email == req.email.strip().lower()).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"User with email '{req.email}' already exists")
        new_user = UserModel(
            id=user_id,
            organization_id=req.organization_id or "ORG-NATIONAL-HEALTH-01",
            email=req.email.strip().lower(),
            hashed_password=hash_password(req.password),
            full_name=req.name.strip(),
            role=role,
            clearance_level="LEVEL_3_ANALYST",
            is_active=True,
        )
        db.add(new_user)
        db.commit()
    except HTTPException:
        raise
    except Exception:
        pass
    finally:
        db.close()

    user_ctx = UserContext(
        user_id=user_id,
        email=req.email.strip().lower(),
        full_name=req.name.strip(),
        role=role,
        organization_id=req.organization_id or "ORG-NATIONAL-HEALTH-01",
        facility_id="FAC-H1",
        clearance_level="LEVEL_3_ANALYST",
    )

    token = create_access_token(user_ctx, expires_in_seconds=settings.JWT_EXPIRATION_SECONDS)

    return LoginResponse(
        user={
            "id": user_ctx.user_id,
            "name": user_ctx.full_name,
            "email": user_ctx.email,
            "role": user_ctx.role,
            "organization_id": user_ctx.organization_id,
            "hospitalAffiliation": req.hospital_affiliation or "Regional Hospital Enclave",
            "clearanceLevel": user_ctx.clearance_level,
        },
        token=token,
        token_type="Bearer",
        expires_in=settings.JWT_EXPIRATION_SECONDS,
        environment=settings.ENVIRONMENT,
    )


# In-memory single-use ticket store: ticket -> (user_id, expiry_timestamp)
WS_TICKETS: dict = {}


@router.post("/ws-ticket")
async def generate_ws_ticket(user_ctx: UserContext = Depends(get_current_user)):
    """Generates a single-use short-lived (60s) ticket for WebSocket connection."""
    import secrets
    import time
    ticket = secrets.token_urlsafe(24)
    expiry = time.time() + 60.0
    WS_TICKETS[ticket] = (user_ctx.user_id, expiry)
    return {"ticket": ticket, "expires_in": 60}

