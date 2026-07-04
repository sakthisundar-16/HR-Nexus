"""
HR Nexus — Department Schemas
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class DepartmentBase(BaseModel):
    """Base department properties."""

    name: str = Field(min_length=2, max_length=100)
    code: str = Field(min_length=2, max_length=20, pattern="^[A-Z0-9_-]+$")
    description: str | None = Field(default=None, max_length=500)
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    """Schema for creating a department."""

    pass


class DepartmentUpdate(BaseModel):
    """Schema for updating a department (partial)."""

    name: str | None = Field(default=None, min_length=2, max_length=100)
    code: str | None = Field(default=None, min_length=2, max_length=20, pattern="^[A-Z0-9_-]+$")
    description: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None


class DepartmentResponse(DepartmentBase):
    """Department response schema with metadata."""

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DepartmentWithStatsResponse(DepartmentResponse):
    """Department response including employee headcount and statistics."""

    employee_count: int = Field(default=0)
    active_employee_count: int = Field(default=0)
    average_salary: float = Field(default=0.0)
