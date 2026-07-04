"""
HR Nexus — Payroll Model

Tracks monthly payroll with auto-calculated fields.
Status workflow: DRAFT → PROCESSED → PAID
"""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import PayrollStatus
from app.db.base import Base, TimestampMixin, UUIDMixin


class Payroll(Base, UUIDMixin, TimestampMixin):
    """
    Payroll entity — one record per employee per period.

    Fields like gross_salary, tax, and net_salary are computed
    by the PayrollService when generating payroll.

    Business rules:
    - Unique constraint on (employee_id, payroll_period)
    - net_salary = max(0, gross - deductions - tax)
    - Days present/absent pulled from attendance records
    """

    __tablename__ = "payroll"

    __table_args__ = (
        UniqueConstraint("employee_id", "payroll_period", name="uq_payroll_employee_period"),
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Period format: "2026-07"
    payroll_period: Mapped[str] = mapped_column(String(7), nullable=False, index=True)

    # Salary components
    base_salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    allowances: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    deductions: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    overtime_pay: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    gross_salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    tax: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    net_salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    # Attendance linkage
    working_days: Mapped[int] = mapped_column(Integer, nullable=False)
    days_present: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    days_absent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Status workflow
    status: Mapped[str] = mapped_column(
        String(20),
        default=PayrollStatus.DRAFT.value,
        nullable=False,
        index=True,
    )
    payment_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Relationships
    employee = relationship("Employee", back_populates="payroll_records", lazy="selectin")

    def __repr__(self) -> str:
        return (
            f"<Payroll(employee_id={self.employee_id}, "
            f"period={self.payroll_period}, net={self.net_salary})>"
        )
