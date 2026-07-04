"""
HR Nexus — Leave Schemas

Pydantic models for submitting leave requests, reviewing (approve/reject),
leave balances, and responses.
"""

import uuid
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator

from app.core.constants import LeaveStatus, LeaveType


class LeaveRequestCreate(BaseModel):
    """Schema for employee leave application."""

    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str = Field(min_length=5, max_length=1000)

    @field_validator("end_date")
    @classmethod
    def validate_dates(cls, v: date, info) -> date:
        start = info.data.get("start_date")
        if start and v < start:
            raise ValueError("end_date cannot be earlier than start_date")
        return v


class LeaveReviewRequest(BaseModel):
    """Schema for Admin reviewing a leave request."""

    status: LeaveStatus = Field(description="Must be APPROVED or REJECTED")
    admin_remarks: str | None = Field(default=None, max_length=500)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: LeaveStatus) -> LeaveStatus:
        if v not in (LeaveStatus.APPROVED, LeaveStatus.REJECTED):
            raise ValueError("Review status must be either APPROVED or REJECTED")
        return v


class LeaveRequestResponse(BaseModel):
    """Leave request response schema."""

    id: uuid.UUID
    employee_id: uuid.UUID
    approved_by: uuid.UUID | None = None
    leave_type: str
    start_date: date
    end_date: date
    total_days: int
    reason: str
    status: str
    admin_remarks: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LeaveBalanceResponse(BaseModel):
    """Remaining leave balance summary for an employee."""

    leave_type: str
    total_allowed: int
    used_days: int
    pending_days: int
    remaining_days: int
