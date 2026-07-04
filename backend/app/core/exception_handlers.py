"""
HR Nexus — Global Exception Handlers

Registers exception handlers on the FastAPI app instance to ensure
every error returns a consistent JSON response format.
"""

import logging
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import AppException

logger = logging.getLogger("hr_nexus")


def _error_response(
    status_code: int,
    message: str,
    error_code: str = "ERROR",
    details: dict | None = None,
) -> dict:
    """Build a consistent error response dict."""
    response = {
        "success": False,
        "message": message,
        "error_code": error_code,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if details:
        response["details"] = details
    return response


def register_exception_handlers(app: FastAPI) -> None:
    """Register all global exception handlers on the app."""

    @app.exception_handler(AppException)
    async def app_exception_handler(_request: Request, exc: AppException):
        """Handle all custom application exceptions."""
        from fastapi.responses import JSONResponse

        return JSONResponse(
            status_code=exc.status_code,
            content=_error_response(
                status_code=exc.status_code,
                message=exc.message,
                error_code=exc.error_code,
                details=exc.details if exc.details else None,
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_request: Request, exc: RequestValidationError):
        """Handle Pydantic validation errors with readable messages."""
        from fastapi.responses import JSONResponse

        errors = []
        for error in exc.errors():
            loc = " → ".join(str(l) for l in error["loc"])
            errors.append({
                "field": loc,
                "message": error["msg"],
                "type": error["type"],
            })

        return JSONResponse(
            status_code=422,
            content=_error_response(
                status_code=422,
                message="Validation error — please check your request data",
                error_code="VALIDATION_ERROR",
                details={"errors": errors},
            ),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(_request: Request, exc: StarletteHTTPException):
        """Handle standard HTTP exceptions (404, 405, etc.)."""
        from fastapi.responses import JSONResponse

        return JSONResponse(
            status_code=exc.status_code,
            content=_error_response(
                status_code=exc.status_code,
                message=str(exc.detail),
                error_code="HTTP_ERROR",
            ),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_request: Request, exc: Exception):
        """Catch-all for unexpected errors — log the full traceback."""
        from fastapi.responses import JSONResponse

        logger.error("Unhandled exception: %s", exc, exc_info=True)
        return JSONResponse(
            status_code=500,
            content=_error_response(
                status_code=500,
                message="An unexpected internal error occurred. Our team has been notified.",
                error_code="INTERNAL_SERVER_ERROR",
            ),
        )
