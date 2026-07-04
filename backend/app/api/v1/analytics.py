"""
HR Nexus — Analytics & Dashboard Router

Endpoints providing pre-formatted JSON structures optimized for
frontend charting libraries (Recharts / Chart.js / Nivo).
"""

from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.core.response import success_response
from app.models.user import User
from app.services.analytics_service import AnalyticsService
from app.services.audit_service import AuditService

router = APIRouter()


@router.get("/dashboard", response_model=dict)
async def get_admin_dashboard_stats(
    admin_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Fetch executive dashboard statistics:
    - Total / Active employees
    - Today's attendance percentage & breakdown
    - On-leave headcount
    - Latest monthly payroll cost
    - Pending leave applications awaiting review
    """
    service = AnalyticsService(db)
    stats = await service.get_dashboard_stats()
    return success_response(data=stats.model_dump(), message="Dashboard statistics retrieved")


@router.get("/department-distribution", response_model=dict)
async def get_department_distribution_chart(
    admin_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Fetch headcount distribution across departments formatted for Pie / Bar charts."""
    service = AnalyticsService(db)
    items = await service.get_department_distribution()
    return success_response(
        data=[i.model_dump() for i in items],
        message="Department distribution chart data retrieved",
    )


@router.get("/leave-statistics", response_model=dict)
async def get_leave_statistics_chart(
    admin_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Fetch leave request distribution by category formatted for Bar charts."""
    service = AnalyticsService(db)
    items = await service.get_leave_statistics()
    return success_response(
        data=[i.model_dump() for i in items],
        message="Leave statistics chart data retrieved",
    )


@router.get("/monthly-trends", response_model=dict)
async def get_monthly_trends_chart(
    admin_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Fetch multi-metric monthly trends (attendance %, payroll cost, headcount) for Area / Line charts."""
    service = AnalyticsService(db)
    items = await service.get_monthly_trends()
    return success_response(
        data=[i.model_dump() for i in items],
        message="Monthly trend chart data retrieved",
    )


@router.get("/employee-growth", response_model=dict)
async def get_employee_growth_chart(
    admin_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Fetch quarterly employee growth curve."""
    service = AnalyticsService(db)
    items = await service.get_employee_growth()
    return success_response(
        data=[i.model_dump() for i in items],
        message="Employee growth curve retrieved",
    )


@router.get("/recent-activities", response_model=dict)
async def get_recent_activities_feed(
    admin_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Fetch system-wide activity timeline and audit events for dashboard feed."""
    audit_service = AuditService(db)
    items = await audit_service.get_recent_activities(limit=20)
    return success_response(
        data=[i.model_dump() for i in items],
        message="Recent activities feed retrieved",
    )
