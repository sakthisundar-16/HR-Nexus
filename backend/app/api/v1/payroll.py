"""
HR Nexus — Payroll Router
"""

from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_employee, get_current_user, get_db, require_admin
from app.core.response import paginated_response, success_response
from app.models.employee import Employee
from app.models.user import User
from app.schemas.payroll import PayrollGenerateRequest, PayrollProcessRequest, PayrollResponse
from app.services.payroll_service import PayrollService

router = APIRouter()


@router.post("/generate", response_model=dict, status_code=status.HTTP_201_CREATED)
async def generate_payroll(
    request: PayrollGenerateRequest,
    admin_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Generate monthly payroll for an employee (Admin only).
    Automatically links with attendance records to compute present/absent days
    and applies pro-rata salary deductions for unauthorized absences.
    """
    service = PayrollService(db)
    pay = await service.generate_payroll(request)
    return success_response(
        data=PayrollResponse.model_validate(pay),
        message=f"Payroll generated for period {request.payroll_period}",
    )


@router.get("", response_model=dict)
async def list_all_payrolls(
    admin_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    period: str | None = Query(None, pattern=r"^\d{4}-\d{2}$", description="Filter by YYYY-MM"),
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Fetch paginated payroll records across all employees (Admin only)."""
    service = PayrollService(db)
    skip = (page - 1) * per_page
    items, total = await service.get_all_paginated(
        period=period, status=status_filter, skip=skip, limit=per_page
    )
    return paginated_response(
        items=[PayrollResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        per_page=per_page,
        message="Payroll records retrieved successfully",
    )


@router.get("/my-payslips", response_model=dict)
async def get_my_payslips(
    current_emp: Annotated[Employee, Depends(get_current_employee)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Fetch paginated payslip history for current employee."""
    service = PayrollService(db)
    skip = (page - 1) * per_page
    items, total = await service.get_employee_payslips(
        current_emp.id, skip=skip, limit=per_page
    )
    return paginated_response(
        items=[PayrollResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        per_page=per_page,
        message="Payslips retrieved successfully",
    )


@router.get("/{payroll_id}", response_model=dict)
async def get_payslip_detail(
    payroll_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Fetch detail of a specific payslip."""
    service = PayrollService(db)
    pay = await service.get_by_id(payroll_id)
    return success_response(
        data=PayrollResponse.model_validate(pay),
        message="Payslip detail retrieved",
    )


@router.put("/{payroll_id}/process", response_model=dict)
async def process_payroll(
    payroll_id: uuid.UUID,
    request: PayrollProcessRequest,
    admin_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Transition payroll status: DRAFT → PROCESSED → PAID (Admin only).
    When PAID, automatically emits in-app notification to the employee.
    """
    service = PayrollService(db)
    pay = await service.process_payroll(payroll_id, request)
    return success_response(
        data=PayrollResponse.model_validate(pay),
        message=f"Payroll status transitioned to {request.status.value}",
    )
