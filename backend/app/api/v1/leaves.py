"""
HR Nexus — Leave Management Router
"""

from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_employee, get_current_user, get_db, require_admin
from app.core.response import paginated_response, success_response
from app.models.employee import Employee
from app.models.user import User
from app.schemas.leave import LeaveRequestCreate, LeaveRequestResponse, LeaveReviewRequest
from app.services.leave_service import LeaveService

router = APIRouter()


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def submit_leave_request(
    data: LeaveRequestCreate,
    current_emp: Annotated[Employee, Depends(get_current_employee)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Submit a new leave request.
    Enforces overlap prevention across existing requests and checks annual balance limits.
    """
    service = LeaveService(db)
    leave = await service.submit_request(current_emp, data)
    return success_response(
        data=LeaveRequestResponse.model_validate(leave),
        message="Leave application submitted successfully",
    )


@router.get("", response_model=dict)
async def list_my_leaves(
    current_emp: Annotated[Employee, Depends(get_current_employee)],
    db: Annotated[AsyncSession, Depends(get_db)],
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Fetch paginated leave requests for current employee."""
    service = LeaveService(db)
    skip = (page - 1) * per_page
    items, total = await service.repo.get_by_employee(
        current_emp.id, status=status_filter, skip=skip, limit=per_page
    )
    return paginated_response(
        items=[LeaveRequestResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        per_page=per_page,
        message="Leave requests retrieved successfully",
    )


@router.get("/balance", response_model=dict)
async def get_leave_balance(
    current_emp: Annotated[Employee, Depends(get_current_employee)],
    db: Annotated[AsyncSession, Depends(get_db)],
    year: int | None = Query(None, ge=2020, le=2030),
):
    """Calculate remaining leave balances across all categories (Annual, Sick, Casual, Maternity, Unpaid)."""
    service = LeaveService(db)
    balances = await service.get_balance(current_emp, year=year)
    return success_response(data=balances, message="Leave balances retrieved successfully")


@router.get("/pending", response_model=dict)
async def list_pending_leaves(
    admin_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Fetch all PENDING leave requests awaiting review (Admin only)."""
    service = LeaveService(db)
    skip = (page - 1) * per_page
    items, total = await service.repo.get_pending_requests(skip=skip, limit=per_page)
    return paginated_response(
        items=[LeaveRequestResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        per_page=per_page,
        message="Pending leave requests retrieved successfully",
    )


@router.get("/{leave_id}", response_model=dict)
async def get_leave_detail(
    leave_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Fetch detail of a specific leave request."""
    service = LeaveService(db)
    leave = await service.repo.get_by_id(leave_id)
    return success_response(
        data=LeaveRequestResponse.model_validate(leave) if leave else None,
        message="Leave request detail retrieved",
    )


@router.put("/{leave_id}/review", response_model=dict)
async def review_leave_request(
    leave_id: uuid.UUID,
    review_data: LeaveReviewRequest,
    admin_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Admin review of leave request (Approve or Reject).
    When APPROVED, automatically marks employee's attendance records as ON_LEAVE.
    """
    service = LeaveService(db)
    leave = await service.review_request(leave_id, admin_user, review_data)
    return success_response(
        data=LeaveRequestResponse.model_validate(leave),
        message=f"Leave request has been {review_data.status.value.lower()}",
    )


@router.put("/{leave_id}/cancel", response_model=dict)
async def cancel_leave_request(
    leave_id: uuid.UUID,
    current_emp: Annotated[Employee, Depends(get_current_employee)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Employee cancellation of own pending leave request."""
    service = LeaveService(db)
    leave = await service.cancel_request(leave_id, current_emp)
    return success_response(
        data=LeaveRequestResponse.model_validate(leave),
        message="Leave request cancelled successfully",
    )
