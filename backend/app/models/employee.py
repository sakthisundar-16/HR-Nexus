"""
HR Nexus — Employee Model

Core HR entity containing all employee data.
Linked to User (1:1) for authentication.
Linked to Department (M:1) for organizational structure.
"""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import EmploymentStatus, Gender
from app.db.base import Base, TimestampMixin, UUIDMixin


class Employee(Base, UUIDMixin, TimestampMixin):
    """
    Employee entity — all HR-related data.

    Design decisions:
    - Separated from User (auth vs HR data — SRP)
    - employee_id is a human-readable sequential ID (EMP-0001)
    - profile_completion_pct is stored, not computed on-the-fly (performance)
    - base_salary stored as Numeric(12,2) for precision
    """

    __tablename__ = "employees"

    # Foreign Keys
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Human-readable employee ID
    employee_id: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )

    # Personal Information
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Emergency Contact
    emergency_contact_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Employment Information
    hire_date: Mapped[date] = mapped_column(Date, nullable=False)
    employment_status: Mapped[str] = mapped_column(
        String(20), default=EmploymentStatus.ACTIVE.value, nullable=False, index=True
    )
    job_title: Mapped[str | None] = mapped_column(String(100), nullable=True)
    base_salary: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)

    # Profile
    profile_picture_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    profile_completion_pct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    user = relationship("User", back_populates="employee", lazy="selectin")
    department = relationship("Department", back_populates="employees", lazy="selectin")
    attendance_records = relationship("Attendance", back_populates="employee", lazy="noload")
    leave_requests = relationship("LeaveRequest", back_populates="employee", lazy="noload")
    payroll_records = relationship("Payroll", back_populates="employee", lazy="noload")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        return f"<Employee(id={self.id}, employee_id={self.employee_id}, name={self.full_name})>"
