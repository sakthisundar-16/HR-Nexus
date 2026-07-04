"""
HR Nexus — Department Router
"""

from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_hr
from app.core.response import success_response
from app.models.user import User
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentWithStatsResponse
from app.services.department_service import DepartmentService

router = APIRouter()


@router.get("", response_model=dict)
async def list_departments(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """Fetch all departments enriched with headcount and average salary statistics."""
    service = DepartmentService(db)
    depts = await service.get_all(skip=skip, limit=limit)
    return success_response(data=depts, message="Departments retrieved successfully")


@router.get("/{department_id}", response_model=dict)
async def get_department(
    department_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Fetch department detail by ID with headcount stats."""
    service = DepartmentService(db)
    dept = await service.get_by_id(department_id)
    return success_response(data=dept, message="Department retrieved successfully")


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_department(
    data: DepartmentCreate,
    admin_user: Annotated[User, Depends(require_hr)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new department (Admin and HR Manager)."""
    service = DepartmentService(db)
    dept = await service.create(data)
    return success_response(
        data=DepartmentWithStatsResponse.model_validate(dept),
        message="Department created successfully",
    )


@router.put("/{department_id}", response_model=dict)
async def update_department(
    department_id: uuid.UUID,
    data: DepartmentUpdate,
    admin_user: Annotated[User, Depends(require_hr)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update department properties (Admin and HR Manager)."""
    service = DepartmentService(db)
    dept = await service.update(department_id, data)
    return success_response(
        data=DepartmentWithStatsResponse.model_validate(dept),
        message="Department updated successfully",
    )


@router.delete("/{department_id}", response_model=dict)
async def delete_department(
    department_id: uuid.UUID,
    admin_user: Annotated[User, Depends(require_hr)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Delete a department (Admin and HR Manager).
    Fails safely if the department still contains active employees.
    """
    service = DepartmentService(db)
    await service.delete(department_id)
    return success_response(message="Department deleted successfully")
