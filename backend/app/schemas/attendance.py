"""
HR Nexus — Attendance Schemas

Pydantic models for check-in/check-out requests, daily status,
and attendance reports.
"""

import uuid
from datetime import date, datetime
from pydantic import BaseModel, Field

from app.core.constants import AttendanceStatus


class CheckInRequest(BaseModel):
    """Request schema for employee check-in."""

    notes: str | None = Field(default=None, max_length=255)


class CheckOutRequest(BaseModel):
    """Request schema for employee check-out."""

    notes: str | None = Field(default=None, max_length=255)


class AttendanceResponse(BaseModel):
    """Single attendance record response schema."""

    id: uuid.UUID
    employee_id: uuid.UUID
    date: date
    check_in: datetime | None = None
    check_out: datetime | None = None
    total_hours: float | None = None
    status: str
    notes: str | None = None
    check_in_ip: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AttendanceSummaryResponse(BaseModel):
    """Monthly attendance summary statistics for an employee or department."""

    total_days_recorded: int = 0
    days_present: int = 0
    days_absent: int = 0
    days_half_day: int = 0
    days_late: int = 0
    days_on_leave: int = 0
    total_working_hours: float = 0.0
    average_working_hours: float = 0.0
    attendance_percentage: float = 0.0
