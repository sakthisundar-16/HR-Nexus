"""
HR Nexus — Authentication Router

Endpoints for login, token refresh, password changes, and user onboarding.
"""

from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_admin
from app.core.response import success_response
from app.models.user import User
from app.schemas.auth import ChangePasswordRequest, LoginRequest, RefreshTokenRequest, TokenResponse
from app.schemas.user import UserResponse
from app.schemas.employee import EmployeeCreate, EmployeeResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/login", response_model=dict)
async def login(
    credentials: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Authenticate credentials and issue JWT access/refresh token pair.
    Rate limited: Account locks for 15 minutes after 5 consecutive failed attempts.
    """
    service = AuthService(db)
    tokens = await service.login(credentials)
    return success_response(data=tokens, message="Authentication successful")


@router.post("/refresh", response_model=dict)
async def refresh_token(
    request: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Rotate refresh token and issue a new JWT access/refresh token pair."""
    service = AuthService(db)
    tokens = await service.refresh_token(request.refresh_token)
    return success_response(data=tokens, message="Token refreshed successfully")


@router.post("/change-password", response_model=dict)
async def change_password(
    request: ChangePasswordRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Change authenticated user's password."""
    service = AuthService(db)
    await service.change_password(current_user, request)
    return success_response(message="Password changed successfully")


@router.get("/me", response_model=dict)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Fetch current authenticated user profile and permissions."""
    return success_response(
        data=UserResponse.model_validate(current_user),
        message="User profile retrieved successfully",
    )


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_employee(
    data: EmployeeCreate,
    admin_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Onboard a new employee (Admin only).
    Automatically creates User auth account and linked Employee HR profile.
    """
    service = AuthService(db)
    emp = await service.register_employee(data)
    return success_response(
        data=EmployeeResponse.model_validate(emp),
        message="Employee onboarded successfully",
    )
