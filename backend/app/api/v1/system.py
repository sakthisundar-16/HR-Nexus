"""
HR Nexus — System & Health Check Router

Provides public and administrative endpoints for monitoring
application uptime, database connectivity, and environment metadata.
"""

import platform
import sys
from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.config import get_settings
from app.core.response import success_response
from app.models.user import User

router = APIRouter()
settings = get_settings()


@router.get("/health", response_model=dict, status_code=status.HTTP_200_OK)
async def health_check(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Public health check endpoint.
    Verifies API server status and executes a test query against the database engine.
    """
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return success_response(
        data={
            "status": "online",
            "database": db_status,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        },
        message="System health check completed",
    )


@router.get("/info", response_model=dict)
async def system_info(
    admin_user: Annotated[User, Depends(require_admin)],
):
    """
    Administrative system metadata endpoint.
    Returns runtime environment, Python version, OS platform, and configuration flags.
    """
    return success_response(
        data={
            "application_name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "debug_mode": settings.DEBUG,
            "python_version": sys.version.split(" ")[0],
            "platform": platform.platform(),
            "database_url": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "sqlite",
            "token_expiration_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        },
        message="System information retrieved successfully",
    )
