"""
Verification Tests for Security Headers, Standardized Error Responses, and Prometheus Telemetry
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_security_headers_present():
    """Ensure all responses include strict enterprise security headers."""
    resp = client.get("/health")
    assert resp.status_code == 200
    headers = resp.headers
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert "default-src 'self'" in headers.get("content-security-policy", "")
    assert "max-age=" in headers.get("strict-transport-security", "")


def test_standardized_error_response_404():
    """Ensure 404 responses conform to the ErrorResponse contract."""
    resp = client.get("/api/non_existent_endpoint_12345")
    assert resp.status_code == 404
    data = resp.json()
    assert "error" in data
    assert "message" in data
    assert data["status"] == 404
    assert "timestamp" in data
    assert data["error"] == "NOT_FOUND"


def test_standardized_validation_error_422():
    """Ensure Pydantic 422 errors conform to the ErrorResponse contract with details."""
    resp = client.post("/api/clients", json={"invalid_field": True})
    assert resp.status_code == 422
    data = resp.json()
    assert data["error"] == "VALIDATION_ERROR"
    assert data["status"] == 422
    assert "timestamp" in data
    assert "details" in data
    assert isinstance(data["details"], list)


def test_prometheus_metrics_endpoint():
    """Ensure /metrics returns valid Prometheus scraped telemetry with active counters."""
    # Hit an endpoint to generate request metric
    client.get("/health")
    
    resp = client.get("/metrics")
    assert resp.status_code == 200
    text = resp.text
    assert "fedsentinel_active_facilities_total" in text
    assert "fedsentinel_requests_total" in text
    assert "fedsentinel_request_duration_seconds" in text
