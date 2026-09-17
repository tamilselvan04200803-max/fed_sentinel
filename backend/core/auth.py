"""
Identity, Authentication, and Scoped RBAC Security Engine for FedSentinel-Health
Implements HMAC-SHA256 signed bearer token authentication, password hashing with salt,
UserContext scoping, and role-based access control (RBAC) dependencies.
"""

from __future__ import annotations
import base64
import hmac
import hashlib
import json
import time
from typing import List, Optional, Set
from fastapi import Depends, HTTPException, Header, status
from pydantic import BaseModel, EmailStr
from backend.core.config import settings


# ── Supported Enterprise Roles & Clearances ──────────────────────────────

class Roles:
    SUPER_ADMIN = "SUPER_ADMIN"
    ORG_ADMIN = "ORG_ADMIN"
    FEDERATION_ADMIN = "FEDERATION_ADMIN"
    SOC_ANALYST = "SOC_ANALYST"
    HOSPITAL_OPERATOR = "HOSPITAL_OPERATOR"
    AUDITOR = "AUDITOR"
    READ_ONLY = "READ_ONLY"

    ALL = {SUPER_ADMIN, ORG_ADMIN, FEDERATION_ADMIN, SOC_ANALYST, HOSPITAL_OPERATOR, AUDITOR, READ_ONLY}


class UserContext(BaseModel):
    user_id: str
    email: str
    full_name: str
    role: str
    organization_id: str
    facility_id: Optional[str] = None
    clearance_level: str = "LEVEL_3_ANALYST"


# ── Password Hashing & HMAC Tokens ─────────────────────────────────────

SECRET_KEY = getattr(settings, "JWT_SECRET", "fedsentinel_secops_hmac_secret_key_2026_healthcare_ai")


def hash_password(password: str, salt: str = "fedsentinel_salt_v1") -> str:
    """Generates PBKDF2-HMAC-SHA256 derived hash (100,000 iterations) of plaintext password."""
    salted_key = f"{salt}:{SECRET_KEY}".encode("utf-8")
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salted_key, 100000)
    return derived.hex()


def verify_password(password: str, hashed: str, salt: str = "fedsentinel_salt_v1") -> bool:
    """Verifies plaintext password against PBKDF2-HMAC-SHA256 or legacy salted hash."""
    # Check PBKDF2 match
    current_hash = hash_password(password, salt)
    if hmac.compare_digest(current_hash, hashed):
        return True
    # Legacy SHA-256 backwards-compatibility fallback
    legacy_salted = f"{salt}:{password}:{SECRET_KEY}".encode("utf-8")
    legacy_hash = hashlib.sha256(legacy_salted).hexdigest()
    return hmac.compare_digest(legacy_hash, hashed)


def create_access_token(user_ctx: UserContext, expires_in_seconds: int = 86400) -> str:
    """Creates a signed HMAC-SHA256 bearer token carrying user context."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_ctx.user_id,
        "email": user_ctx.email,
        "name": user_ctx.full_name,
        "role": user_ctx.role,
        "org_id": user_ctx.organization_id,
        "facility_id": user_ctx.facility_id,
        "clearance": user_ctx.clearance_level,
        "exp": int(time.time()) + expires_in_seconds,
        "iat": int(time.time()),
    }
    
    b64_header = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    b64_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    
    signing_input = f"{b64_header}.{b64_payload}".encode("utf-8")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    b64_sig = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{b64_header}.{b64_payload}.{b64_sig}"


def decode_access_token(token_str: str) -> Optional[UserContext]:
    """Validates signature and expiration of HMAC token, returning UserContext if valid."""
    try:
        parts = token_str.replace("Bearer ", "").strip().split(".")
        if len(parts) != 3:
            return None
        
        b64_header, b64_payload, b64_sig = parts
        
        # Verify signature
        signing_input = f"{b64_header}.{b64_payload}".encode("utf-8")
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
        
        # Re-pad base64
        rem = len(b64_sig) % 4
        padded_sig = b64_sig + "=" * (4 - rem) if rem else b64_sig
        actual_sig = base64.urlsafe_b64encode(expected_sig).decode().rstrip("=")
        
        if not hmac.compare_digest(b64_sig, actual_sig):
            return None
        
        # Re-pad payload
        rem_p = len(b64_payload) % 4
        padded_payload = b64_payload + "=" * (4 - rem_p) if rem_p else b64_payload
        payload_data = json.loads(base64.urlsafe_b64decode(padded_payload).decode())
        
        # Check expiry
        if payload_data.get("exp", 0) < int(time.time()):
            return None
        
        return UserContext(
            user_id=payload_data["sub"],
            email=payload_data.get("email", "operator@hospital.gov.in"),
            full_name=payload_data.get("name", "SecOps Lead Analyst"),
            role=payload_data.get("role", Roles.SOC_ANALYST),
            organization_id=payload_data.get("org_id", "ORG-NATIONAL-HEALTH-01"),
            facility_id=payload_data.get("facility_id"),
            clearance_level=payload_data.get("clearance", "LEVEL_3_ANALYST"),
        )
    except Exception:
        return None


# ── Default Fallback Identity (Demo Mode) ──────────────────────────────

DEMO_USER_CONTEXT = UserContext(
    user_id="usr_demo_secops",
    email="analyst@fedsentinel.health.gov.in",
    full_name="National SecOps Lead Analyst",
    role=Roles.SOC_ANALYST,
    organization_id="ORG-NATIONAL-HEALTH-01",
    facility_id="FAC-H1",
    clearance_level="LEVEL_3_ANALYST",
)


# ── Security Dependencies ──────────────────────────────────────────────

async def get_current_user(authorization: Optional[str] = Header(None)) -> UserContext:
    """FastAPI dependency for authenticating user from Bearer header."""
    if not authorization:
        if getattr(settings, "ENABLE_DEMO_MODE", True):
            return DEMO_USER_CONTEXT
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Bearer token missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_ctx = decode_access_token(authorization)
    if not user_ctx:
        if getattr(settings, "ENABLE_DEMO_MODE", True):
            return DEMO_USER_CONTEXT
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_ctx


class RBACPermissionChecker:
    """Dependency checker enforcing role-based access control."""

    def __init__(self, allowed_roles: Set[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user_ctx: UserContext = Depends(get_current_user)) -> UserContext:
        if user_ctx.role not in self.allowed_roles and user_ctx.role != Roles.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {list(self.allowed_roles)}. User role: {user_ctx.role}",
            )
        return user_ctx


def require_roles(*roles: str):
    """Returns RBAC dependency enforcing that user has at least one of the specified roles."""
    return Depends(RBACPermissionChecker(set(roles)))


class TenantAccessChecker:
    """Dependency checker enforcing organization / facility tenant boundary scoping."""

    def __init__(self, org_param_name: str = "organization_id", facility_param_name: Optional[str] = None):
        self.org_param_name = org_param_name
        self.facility_param_name = facility_param_name

    def check_tenant(self, target_org_id: str, target_facility_id: Optional[str], user_ctx: UserContext) -> bool:
        if user_ctx.role == Roles.SUPER_ADMIN:
            return True
        if user_ctx.organization_id != target_org_id:
            return False
        if target_facility_id and user_ctx.facility_id and user_ctx.facility_id != target_facility_id:
            if user_ctx.role in {Roles.ORG_ADMIN, Roles.FEDERATION_ADMIN}:
                return True
            return False
        return True


tenant_checker = TenantAccessChecker()
