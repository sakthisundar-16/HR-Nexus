"""
HR Nexus — Middleware

Custom middleware for:
- Request ID tracking (correlation ID for log tracing)
- Request/response timing
- Request logging
"""

import logging
import time
import uuid

from fastapi import FastAPI, Request

logger = logging.getLogger("hr_nexus")


def register_middleware(app: FastAPI) -> None:
    """Register all custom middleware on the app."""

    @app.middleware("http")
    async def request_middleware(request: Request, call_next):
        """
        Middleware that:
        1. Assigns a unique request ID for log correlation
        2. Measures request processing time
        3. Logs every request with method, path, status, and duration
        """
        # Generate unique request ID
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        # Capture client IP for audit logging
        client_ip = request.client.host if request.client else "unknown"
        request.state.client_ip = client_ip

        # Time the request
        start_time = time.perf_counter()

        response = await call_next(request)

        duration_ms = (time.perf_counter() - start_time) * 1000

        # Add custom headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"

        # Log the request
        logger.info(
            "[%s] %s %s → %d (%.2fms)",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )

        return response
