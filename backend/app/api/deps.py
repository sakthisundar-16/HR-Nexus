"""
HR Nexus — API Dependencies

Provides reusable FastAPI dependencies for:
- Database session injection
- Current authenticated user extraction
- Current employee profile extraction
- Role-based authorization checkers (RBAC)
"""

from typing import Annotated, Callable
import uuid

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import UserRole
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.employee import Employee
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_token_from_header(
    authorization: Annotated[str | None, Header()] = None,
    oauth_token: Annotated[str | None, Depends(oauth2_scheme)] = None,
) -> str:
    """Extract JWT token from Authorization header or OAuth2 scheme."""
    token = oauth_token
    if not token and authorization:
        if authorization.lower().startswith("bearer "):
            token = authorization[7:].strip()
        else:
            token = authorization.strip()

    if not token:
        raise UnauthorizedException("Missing authentication token")
    return token


async def get_current_user(
    token: Annotated[str, Depends(get_token_from_header)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Decode JWT access token and fetch the corresponding active User from database.
    """
    payload = decode_access_token(token)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException("Invalid token subject")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise UnauthorizedException("Invalid user identifier in token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedException("User account not found")
    if not user.is_active:
        raise ForbiddenException("User account has been deactivated")

    return user


async def get_current_employee(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Employee:
    """
    Fetch the Employee profile associated with the current authenticated User.
    """
    result = await db.execute(select(Employee).where(Employee.user_id == user.id))
    employee = result.scalar_one_or_none()

    if not employee:
        raise ForbiddenException("No employee profile associated with this account")

    return employee


class RoleChecker:
    """
    Dependency class for Role-Based Access Control (RBAC).

    Usage:
        @router.get("/admin/only", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
    """

    def __init__(self, allowed_roles: list[UserRole | str]):
        self.allowed_roles = [r.value if isinstance(r, UserRole) else r for r in allowed_roles]

    def __call__(self, user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in self.allowed_roles:
            raise ForbiddenException(
                f"Access denied. Requires one of roles: {', '.join(self.allowed_roles)}"
            )
        return user


# Convenient pre-built role dependency checkers
require_admin = RoleChecker([UserRole.ADMIN])
require_hr = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER])
require_employee = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE])
