"""
HR Nexus — Employee Router
"""

from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_employee, get_current_user, get_db, require_admin
from app.core.response import paginated_response, success_response
from app.models.employee import Employee
from app.models.user import User
from app.schemas.employee import EmployeeAdminUpdate, EmployeeResponse, EmployeeSelfUpdate
from app.services.audit_service import AuditService
from app.services.employee_service import EmployeeService

router = APIRouter()


@router.get("", response_model=dict)
async def list_employees(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    query: str | None = Query(None, description="Search by name, ID, or title"),
    department_id: uuid.UUID | None = Query(None, description="Filter by department"),
    status: str | None = Query(None, description="Filter by employment status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Fetch paginated list of employees with search and filtering."""
    service = EmployeeService(db)
    skip = (page - 1) * per_page
    items, total = await service.get_all_paginated(
        query=query, department_id=department_id, status=status, skip=skip, limit=per_page
    )
    return paginated_response(
        items=[EmployeeResponse.model_validate(e) for e in items],
        total=total,
        page=page,
        per_page=per_page,
        message="Employees retrieved successfully",
    )


@router.get("/upcoming-birthdays", response_model=dict)
async def get_upcoming_birthdays(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    days: int = Query(30, ge=1, le=90, description="Number of days ahead to check"),
):
    """Fetch employees whose birthday occurs in the next N days."""
    service = EmployeeService(db)
    emps = await service.get_upcoming_birthdays(days=days)
    return success_response(
        data=[EmployeeResponse.model_validate(e) for e in emps],
        message="Upcoming birthdays retrieved successfully",
    )


@router.get("/{employee_id}", response_model=dict)
async def get_employee(
    employee_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Fetch employee profile detail by ID."""
    service = EmployeeService(db)
    emp = await service.get_by_id(employee_id)
    return success_response(
        data=EmployeeResponse.model_validate(emp),
        message="Employee profile retrieved successfully",
    )


@router.put("/{employee_id}", response_model=dict)
async def admin_update_employee(
    employee_id: uuid.UUID,
    data: EmployeeAdminUpdate,
    admin_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Admin update — modify any employee attribute including protected HR data
    (salary, department, employment status, job title).
    """
    service = EmployeeService(db)
    emp = await service.admin_update(employee_id, data)

    # Log audit trail
    audit = AuditService(db)
    await audit.log_action(
        action="ADMIN_UPDATE_PROFILE",
        entity_type="Employee",
        entity_id=emp.id,
        user_id=admin_user.id,
        new_values=data.model_dump(exclude_unset=True),
    )

    return success_response(
        data=EmployeeResponse.model_validate(emp),
        message="Employee profile updated successfully by Admin",
    )


@router.patch("/{employee_id}/profile", response_model=dict)
async def self_update_employee(
    employee_id: uuid.UUID,
    data: EmployeeSelfUpdate,
    current_emp: Annotated[Employee, Depends(get_current_employee)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Self-service profile update — restricted to personal contact fields
    (phone, address, emergency contact, profile pic).
    Raises 403 Forbidden if attempting to modify protected HR fields!
    """
    service = EmployeeService(db)
    emp = await service.self_update(employee_id, data)

    # Log audit trail
    audit = AuditService(db)
    await audit.log_action(
        action="SELF_UPDATE_PROFILE",
        entity_type="Employee",
        entity_id=emp.id,
        user_id=current_emp.user_id,
        new_values=data.model_dump(exclude_unset=True),
    )

    return success_response(
        data=EmployeeResponse.model_validate(emp),
        message="Your profile was updated successfully",
    )


@router.get("/{employee_id}/activity-timeline", response_model=dict)
async def get_employee_activity_timeline(
    employee_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Fetch chronological activity and change history for an employee."""
    audit_service = AuditService(db)
    timeline = await audit_service.get_employee_timeline(employee_id)
    return success_response(
        data=timeline,
        message="Employee activity timeline retrieved successfully",
    )
