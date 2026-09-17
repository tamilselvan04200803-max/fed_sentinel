"""
Standardized Enterprise API Error Response Contract for FedSentinel-Health
Ensures uniform JSON error schema across all HTTP 4xx/5xx responses.
"""

from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

logger = logging.getLogger("fedsentinel.errors")


class ErrorResponse(BaseModel):
    """Standardized enterprise error schema."""
    error: str = Field(..., description="Machine-readable uppercase error code")
    message: str = Field(..., description="Human-readable safe explanation of the failure")
    status: int = Field(..., description="HTTP status code")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    details: Optional[Any] = Field(default=None, description="Optional safe debug or validation details")


class FedSentinelException(HTTPException):
    """Custom application exception with structured error code."""
    def __init__(
        self,
        status_code: int,
        error_code: str,
        message: str,
        details: Optional[Any] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__(status_code=status_code, detail=message, headers=headers)
        self.error_code = error_code
        self.message = message
        self.details = details


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Catches all standard FastAPI HTTPExceptions and wraps in ErrorResponse."""
    error_code = getattr(exc, "error_code", None)
    if not error_code:
        # Map common status codes to standard error codes
        status_map = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            409: "CONFLICT",
            422: "UNPROCESSABLE_ENTITY",
            429: "RATE_LIMIT_EXCEEDED",
            500: "INTERNAL_SERVER_ERROR",
            502: "BAD_GATEWAY",
            503: "SERVICE_UNAVAILABLE",
        }
        error_code = status_map.get(exc.status_code, "API_ERROR")

    content = ErrorResponse(
        error=error_code,
        message=str(exc.detail) if exc.detail else "An error occurred while processing the request",
        status=exc.status_code,
        details=getattr(exc, "details", None),
    ).model_dump()

    return JSONResponse(status_code=exc.status_code, content=content, headers=exc.headers)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Formats Pydantic request validation errors cleanly into ErrorResponse."""
    errors = exc.errors()
    # Build clean details list
    formatted_errors = []
    for err in errors:
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        formatted_errors.append({"field": loc, "issue": err.get("msg"), "type": err.get("type")})

    content = ErrorResponse(
        error="VALIDATION_ERROR",
        message="Request body or parameters failed schema validation",
        status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        details=formatted_errors,
    ).model_dump()

    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=content)


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Unhandled internal server error fallback."""
    logger.error(f"Unhandled exception during {request.method} {request.url.path}: {exc}", exc_info=True)
    content = ErrorResponse(
        error="INTERNAL_SERVER_ERROR",
        message="An unexpected system error occurred. The SecOps audit ledger has logged this event.",
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    ).model_dump()

    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=content)
