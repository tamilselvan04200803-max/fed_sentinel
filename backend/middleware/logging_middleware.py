"""
Structured Request Logging and Prometheus Metric Collection Middleware
Tracks API request latency, status codes, endpoints, and error frequencies.
"""

from __future__ import annotations
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response
from prometheus_client import Counter, Histogram, Gauge

logger = logging.getLogger("fedsentinel.access")

# Prometheus Metrics Definitions
REQUESTS_TOTAL = Counter(
    "fedsentinel_requests_total",
    "Total count of HTTP requests processed by FedSentinel Gateway",
    ["method", "path", "status_code"],
)

REQUEST_DURATION_SECONDS = Histogram(
    "fedsentinel_request_duration_seconds",
    "HTTP request execution latency in seconds",
    ["method", "path"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
)

ACTIVE_REQUESTS = Gauge(
    "fedsentinel_active_requests",
    "Number of currently executing HTTP requests in the gateway",
)


class LoggingAndMetricsMiddleware(BaseHTTPMiddleware):
    """Logs incoming HTTP calls with latency and feeds real Prometheus metric series."""

    async def dispatch(self, request: Request, call_next):
        # Ignore noisy polling or health probes if needed, or track everything
        path = request.url.path
        method = request.method
        start_time = time.perf_counter()

        ACTIVE_REQUESTS.inc()
        status_code = 500
        try:
            response: Response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception as e:
            status_code = 500
            raise e
        finally:
            ACTIVE_REQUESTS.dec()
            duration = time.perf_counter() - start_time
            duration_ms = duration * 1000.0

            # Simplify path to prevent high cardinality metric explosion
            clean_path = path
            if path.startswith("/api/clients/") and len(path.split("/")) == 4:
                clean_path = "/api/clients/{client_id}"
            elif path.startswith("/api/incidents/") and len(path.split("/")) == 4:
                clean_path = "/api/incidents/{incident_id}"
            elif path.startswith("/api/trust/"):
                clean_path = "/api/trust/{client_id}"

            REQUESTS_TOTAL.labels(method=method, path=clean_path, status_code=str(status_code)).inc()
            REQUEST_DURATION_SECONDS.labels(method=method, path=clean_path).observe(duration)

            # Structured console log
            if clean_path not in ("/health", "/ready", "/metrics"):
                client_ip = request.client.host if request.client else "unknown"
                logger.info(f"{method} {path} - {status_code} ({duration_ms:.1f}ms) [{client_ip}]")
