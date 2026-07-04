"""
HR Nexus — User Schemas

Pydantic models for User entity representation and admin management.
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

from app.core.constants import UserRole


class UserCreate(BaseModel):
    """Schema for creating a new user account (Admin only or during onboarding)."""

    email: EmailStr
    password: str = Field(min_length=8)
    role: UserRole = Field(default=UserRole.EMPLOYEE)
    is_active: bool = True


class UserUpdate(BaseModel):
    """Schema for updating a user account."""

    email: EmailStr | None = None
    role: UserRole | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    """Full user response schema."""

    id: uuid.UUID
    email: str
    role: str
    is_active: bool
    last_login: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
