"""
Authentication and RBAC Unit Test Suite for FedSentinel-Health
Tests PBKDF2 password derivation, HMAC JWT creation/verification, and role permissions.
"""

import pytest
from backend.core.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    UserContext,
    Roles,
    RBACPermissionChecker,
)


def test_pbkdf2_password_hashing():
    """Verifies that password hashing produces valid hex and verifies accurately."""
    pwd = "EnterpriseHospitalSecOps2026!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert len(hashed) == 64  # 256-bit SHA256 hex
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_roundtrip():
    """Verifies that create_access_token and decode_access_token preserve UserContext."""
    user = UserContext(
        user_id="usr_test_ciso",
        email="ciso@apollo.health.in",
        full_name="Chief Information Security Officer",
        role=Roles.SOC_ANALYST,
        organization_id="ORG-APOLLO-01",
        facility_id="FAC-CHENNAI",
        clearance_level="LEVEL_4_EXECUTIVE",
    )
    token = create_access_token(user, expires_in_seconds=3600)
    assert token and len(token.split(".")) == 3

    decoded = decode_access_token(f"Bearer {token}")
    assert decoded is not None
    assert decoded.user_id == user.user_id
    assert decoded.email == user.email
    assert decoded.role == Roles.SOC_ANALYST
    assert decoded.organization_id == user.organization_id


def test_rbac_permission_enforcement():
    """RBAC checker must allow authorized roles and reject unauthorized ones."""
    checker = RBACPermissionChecker({Roles.SUPER_ADMIN, Roles.FEDERATION_ADMIN})
    
    admin_user = UserContext(
        user_id="usr_admin",
        email="admin@gov.in",
        full_name="Super Admin",
        role=Roles.SUPER_ADMIN,
        organization_id="ORG-GOV",
    )
    assert checker(admin_user) == admin_user

    unauth_user = UserContext(
        user_id="usr_guest",
        email="guest@hosp.in",
        full_name="Read Only Guest",
        role=Roles.READ_ONLY,
        organization_id="ORG-GUEST",
    )
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        checker(unauth_user)
    assert exc_info.value.status_code == 403
