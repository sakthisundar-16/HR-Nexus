"""
HR Nexus — Authentication Service

Handles user registration, login with rate limiting & lockout,
token refresh, and password management.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.constants import EmploymentStatus, UserRole
from app.core.exceptions import (
    AccountLockedException,
    ConflictException,
    InvalidCredentialsException,
    NotFoundException,
    UnauthorizedException,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.models.employee import Employee
from app.models.user import User
from app.repositories.department_repository import DepartmentRepository
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import ChangePasswordRequest, LoginRequest, TokenResponse
from app.schemas.employee import EmployeeCreate

settings = get_settings()


class AuthService:
    """Service layer for authentication workflows."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.emp_repo = EmployeeRepository(db)
        self.dept_repo = DepartmentRepository(db)

    async def login(self, credentials: LoginRequest) -> TokenResponse:
        """
        Authenticate user credentials and issue JWT token pair.
        Enforces account lockout after 5 consecutive failed attempts.
        """
        user = await self.user_repo.get_by_email(credentials.email)
        if not user:
            # Avoid timing attacks by running a dummy verify
            verify_password("dummy", "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW")
            raise InvalidCredentialsException()

        # Check if account is currently locked
        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            raise AccountLockedException(locked_until=user.locked_until.isoformat())

        if not verify_password(credentials.password, user.hashed_password):
            await self.user_repo.record_login_failure(user)
            raise InvalidCredentialsException()

        if not user.is_active:
            raise UnauthorizedException("Account has been deactivated")

        # Record successful login
        await self.user_repo.record_login_success(user)

        # Issue token pair
        access_token = create_access_token(
            subject=str(user.id),
            role=user.role,
        )
        refresh_token = create_refresh_token(subject=str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def refresh_token(self, refresh_token_str: str) -> TokenResponse:
        """Validate refresh token and issue a new access/refresh token pair (rotation)."""
        payload = decode_refresh_token(refresh_token_str)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise UnauthorizedException("Invalid token subject")

        user = await self.user_repo.get_by_id(user_id_str)
        if not user or not user.is_active:
            raise UnauthorizedException("User account not active or found")

        # Issue new token pair
        access_token = create_access_token(subject=str(user.id), role=user.role)
        new_refresh_token = create_refresh_token(subject=str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def change_password(self, user: User, request: ChangePasswordRequest) -> bool:
        """Change authenticated user's password."""
        if not verify_password(request.current_password, user.hashed_password):
            raise UnauthorizedException("Current password is incorrect")

        user.hashed_password = hash_password(request.new_password)
        await self.user_repo.update(user, {"hashed_password": user.hashed_password})
        return True

    async def register_employee(self, data: EmployeeCreate) -> Employee:
        """
        Onboard a new employee (Admin operation).
        Creates both User auth entity and Employee HR entity.
        """
        existing_user = await self.user_repo.get_by_email(data.email)
        if existing_user:
            raise ConflictException(f"User with email '{data.email}' already exists")

        if data.department_id:
            dept = await self.dept_repo.get_by_id(data.department_id)
            if not dept:
                raise NotFoundException("Department", str(data.department_id))

        # Create User
        new_user = await self.user_repo.create({
            "email": data.email.lower().strip(),
            "hashed_password": hash_password(data.password),
            "role": data.role.value if isinstance(data.role, UserRole) else data.role,
            "is_active": True,
        })

        # Generate sequential EMP-XXXX ID
        next_id = await self.emp_repo.get_next_employee_id()

        # Calculate initial profile completion
        from app.core.constants import PROFILE_OPTIONAL_FIELDS
        filled = sum(1 for f in PROFILE_OPTIONAL_FIELDS if getattr(data, f, None) is not None)
        pct = int((filled / len(PROFILE_OPTIONAL_FIELDS)) * 100)

        # Create Employee profile
        new_emp = await self.emp_repo.create({
            "user_id": new_user.id,
            "department_id": data.department_id,
            "employee_id": next_id,
            "first_name": data.first_name.strip(),
            "last_name": data.last_name.strip(),
            "phone": data.phone,
            "date_of_birth": data.date_of_birth,
            "gender": data.gender.value if data.gender else None,
            "address": data.address,
            "city": data.city,
            "state": data.state,
            "emergency_contact_name": data.emergency_contact_name,
            "emergency_contact_phone": data.emergency_contact_phone,
            "hire_date": data.hire_date,
            "employment_status": data.employment_status.value if isinstance(data.employment_status, EmploymentStatus) else data.employment_status,
            "job_title": data.job_title,
            "base_salary": data.base_salary,
            "profile_picture_url": data.profile_picture_url,
            "profile_completion_pct": pct,
        })

        return new_emp
