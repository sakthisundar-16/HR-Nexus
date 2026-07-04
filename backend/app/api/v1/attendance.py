"""
HR Nexus — Attendance Router
"""

from datetime import date
from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_employee, get_current_user, get_db, require_admin
from app.core.response import paginated_response, success_response
from app.models.employee import Employee
from app.models.user import User
from app.schemas.attendance import AttendanceResponse, CheckInRequest, CheckOutRequest
from app.services.attendance_service import AttendanceService

router = APIRouter()


@router.post("/check-in", response_model=dict, status_code=status.HTTP_201_CREATED)
async def check_in(
    request_data: CheckInRequest,
    req: Request,
    current_emp: Annotated[Employee, Depends(get_current_employee)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Record employee daily check-in.
    Enforces duplicate check-in prevention and auto-computes LATE status after 09:30 AM.
    """
    service = AttendanceService(db)
    ip_addr = req.client.host if req.client else None
    att = await service.check_in(current_emp, request_data, ip_address=ip_addr)
    return success_response(
        data=AttendanceResponse.model_validate(att),
        message="Check-in recorded successfully",
    )


@router.post("/check-out", response_model=dict)
async def check_out(
    request_data: CheckOutRequest,
    current_emp: Annotated[Employee, Depends(get_current_employee)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Record employee check-out.
    Enforces check-in verification, computes total hours, and assigns HALF_DAY status if < 4 hours.
    """
    service = AttendanceService(db)
    att = await service.check_out(current_emp, request_data)
    return success_response(
        data=AttendanceResponse.model_validate(att),
        message="Check-out recorded successfully",
    )


@router.get("/today", response_model=dict)
async def get_today_status(
    current_emp: Annotated[Employee, Depends(get_current_employee)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Fetch today's attendance record for current employee."""
    service = AttendanceService(db)
    att = await service.get_today_status(current_emp)
    return success_response(
        data=AttendanceResponse.model_validate(att) if att else None,
        message="Today's attendance status retrieved",
    )


@router.get("/history", response_model=dict)
async def get_attendance_history(
    current_emp: Annotated[Employee, Depends(get_current_employee)],
    db: Annotated[AsyncSession, Depends(get_db)],
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Fetch paginated attendance history for current employee."""
    service = AttendanceService(db)
    skip = (page - 1) * per_page
    items, total = await service.get_history(
        employee_id=current_emp.id,
        start_date=start_date,
        end_date=end_date,
        status=status_filter,
        skip=skip,
        limit=per_page,
    )
    return paginated_response(
        items=[AttendanceResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        per_page=per_page,
        message="Attendance history retrieved successfully",
    )


@router.get("/employee/{employee_id}", response_model=dict)
async def get_employee_attendance(
    employee_id: uuid.UUID,
    admin_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Fetch attendance history for any employee (Admin only)."""
    service = AttendanceService(db)
    skip = (page - 1) * per_page
    items, total = await service.get_history(
        employee_id=employee_id, start_date=start_date, end_date=end_date, skip=skip, limit=per_page
    )
    return paginated_response(
        items=[AttendanceResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        per_page=per_page,
        message="Employee attendance retrieved successfully",
    )


@router.get("/daily-report", response_model=dict)
async def get_daily_report(
    admin_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    report_date: date = Query(default_factory=date.today),
):
    """Fetch system-wide attendance report for a specific date (Admin only)."""
    service = AttendanceService(db)
    items = await service.get_daily_report(report_date)
    return success_response(
        data=[AttendanceResponse.model_validate(i) for i in items],
        message=f"Daily attendance report for {report_date} retrieved",
    )


@router.get("/summary", response_model=dict)
async def get_attendance_summary(
    current_emp: Annotated[Employee, Depends(get_current_employee)],
    db: Annotated[AsyncSession, Depends(get_db)],
    month: int = Query(default_factory=lambda: date.today().month, ge=1, le=12),
    year: int = Query(default_factory=lambda: date.today().year, ge=2020, le=2030),
):
    """Calculate monthly attendance percentage, working hours, and absence breakdown."""
    service = AttendanceService(db)
    summary = await service.get_summary(current_emp.id, month, year)
    return success_response(data=summary, message="Monthly attendance summary retrieved")
