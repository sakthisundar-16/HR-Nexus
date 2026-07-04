"""
HR Nexus — Employee Schemas

Pydantic models for Employee creation, admin updates, self-service profile updates,
and detailed responses.
"""

import uuid
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.constants import EmploymentStatus, Gender, UserRole
from app.schemas.department import DepartmentResponse
from app.schemas.user import UserResponse
from app.utils.validators import validate_password_strength, validate_phone_number


class EmployeeBase(BaseModel):
    """Shared employee personal and contact properties."""

    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    date_of_birth: date | None = None
    gender: Gender | None = None
    address: str | None = Field(default=None, max_length=500)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    emergency_contact_name: str | None = Field(default=None, max_length=100)
    emergency_contact_phone: str | None = Field(default=None, max_length=20)
    job_title: str | None = Field(default=None, max_length=100)
    profile_picture_url: str | None = Field(default=None, max_length=500)

    @field_validator("phone", "emergency_contact_phone", mode="before")
    @classmethod
    def validate_phones(cls, v: str | None) -> str | None:
        if v:
            return validate_phone_number(v)
        return v


class EmployeeCreate(EmployeeBase):
    """
    Schema for onboarding a new employee (Admin only).
    Creates both the User auth record and Employee HR record.
    """

    email: EmailStr
    password: str = Field(min_length=8)
    role: UserRole = Field(default=UserRole.EMPLOYEE)
    department_id: uuid.UUID | None = None
    hire_date: date = Field(default_factory=date.today)
    employment_status: EmploymentStatus = Field(default=EmploymentStatus.ACTIVE)
    base_salary: float = Field(default=0.0, ge=0.0)

    @field_validator("password")
    @classmethod
    def validate_pwd(cls, v: str) -> str:
        return validate_password_strength(v)


class EmployeeAdminUpdate(BaseModel):
    """
    Full update schema for Admins. Can edit protected HR fields.
    """

    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = None
    date_of_birth: date | None = None
    gender: Gender | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    job_title: str | None = None
    profile_picture_url: str | None = None

    # Protected HR fields
    department_id: uuid.UUID | None = None
    hire_date: date | None = None
    employment_status: EmploymentStatus | None = None
    base_salary: float | None = Field(default=None, ge=0.0)

    @field_validator("phone", "emergency_contact_phone", mode="before")
    @classmethod
    def validate_phones(cls, v: str | None) -> str | None:
        if v:
            return validate_phone_number(v)
        return v


class EmployeeSelfUpdate(BaseModel):
    """
    Self-service profile update schema for Employees.
    Cannot modify protected HR fields (salary, status, hire_date, department).
    """

    phone: str | None = None
    date_of_birth: date | None = None
    gender: Gender | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    profile_picture_url: str | None = None

    @field_validator("phone", "emergency_contact_phone", mode="before")
    @classmethod
    def validate_phones(cls, v: str | None) -> str | None:
        if v:
            return validate_phone_number(v)
        return v


class EmployeeResponse(EmployeeBase):
    """Full employee response schema."""

    id: uuid.UUID
    user_id: uuid.UUID
    department_id: uuid.UUID | None = None
    employee_id: str
    hire_date: date
    employment_status: str
    base_salary: float
    profile_completion_pct: int
    created_at: datetime
    updated_at: datetime

    # Nested summaries
    department: DepartmentResponse | None = None
    user: UserResponse | None = None

    model_config = {"from_attributes": True}
