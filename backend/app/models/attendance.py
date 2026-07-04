"""
HR Nexus — Attendance Model

Tracks daily check-in/check-out with automatic status determination.
"""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import AttendanceStatus
from app.db.base import Base, TimestampMixin, UUIDMixin


class Attendance(Base, UUIDMixin, TimestampMixin):
    """
    Attendance entity — one record per employee per day.

    Business rules enforced at the service layer:
    - UniqueConstraint on (employee_id, date) prevents duplicate check-ins
    - total_hours computed on check-out
    - status auto-determined based on check-in time and total hours
    """

    __tablename__ = "attendance"

    # Unique constraint: one attendance record per employee per day
    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uq_attendance_employee_date"),
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    check_in: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    check_out: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Computed on check-out
    total_hours: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)

    # Auto-determined: PRESENT, LATE, HALF_DAY, ABSENT, ON_LEAVE
    status: Mapped[str] = mapped_column(
        String(20),
        default=AttendanceStatus.ABSENT.value,
        nullable=False,
        index=True,
    )

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    check_in_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)

    # Relationships
    employee = relationship("Employee", back_populates="attendance_records", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Attendance(employee_id={self.employee_id}, date={self.date}, status={self.status})>"
