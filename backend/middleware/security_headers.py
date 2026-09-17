"""
Enterprise Security Headers Middleware for FedSentinel-Health
Protects against clickjacking, MIME-sniffing, XSS injection, and protocol downgrade.
"""

from __future__ import annotations
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforces enterprise security headers on all HTTP responses."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # Standard OWASP / enterprise headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

        # Content-Security-Policy tailored for modern React + WebSocket dashboards
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: https:; "
            "connect-src 'self' ws: wss: http: https:;"
        )

        return response
