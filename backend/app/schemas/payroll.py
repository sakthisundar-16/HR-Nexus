"""
HR Nexus — Payroll Schemas

Pydantic models for payroll generation, processing, and payslip responses.
"""

import uuid
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator

from app.core.constants import PayrollStatus


class PayrollGenerateRequest(BaseModel):
    """Schema for Admin generating payroll for an employee or period."""

    employee_id: uuid.UUID
    payroll_period: str = Field(pattern=r"^\d{4}-\d{2}$", description="Format: YYYY-MM e.g. 2026-07")
    allowances: float = Field(default=0.0, ge=0.0, description="Additional allowances")
    deductions: float = Field(default=0.0, ge=0.0, description="Manual deductions (excluding auto attendance deductions)")
    overtime_pay: float = Field(default=0.0, ge=0.0, description="Overtime compensation")


class PayrollProcessRequest(BaseModel):
    """Schema for Admin transitioning payroll status (PROCESSED or PAID)."""

    status: PayrollStatus = Field(description="Target status (PROCESSED or PAID)")
    payment_date: date | None = Field(default_factory=date.today)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: PayrollStatus) -> PayrollStatus:
        if v not in (PayrollStatus.PROCESSED, PayrollStatus.PAID):
            raise ValueError("Target status must be PROCESSED or PAID")
        return v


class PayrollResponse(BaseModel):
    """Full payroll / payslip response schema."""

    id: uuid.UUID
    employee_id: uuid.UUID
    payroll_period: str
    base_salary: float
    allowances: float
    deductions: float
    overtime_pay: float
    gross_salary: float
    tax: float
    net_salary: float
    working_days: int
    days_present: int
    days_absent: int
    status: str
    payment_date: date | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
