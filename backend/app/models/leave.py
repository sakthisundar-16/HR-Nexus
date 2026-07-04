"""
HR Nexus — Leave Request Model

Tracks employee leave requests through a status workflow:
PENDING → APPROVED / REJECTED
PENDING → CANCELLED (by employee only)
"""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import LeaveStatus, LeaveType
from app.db.base import Base, TimestampMixin, UUIDMixin


class LeaveRequest(Base, UUIDMixin, TimestampMixin):
    """
    Leave request entity.

    Business rules enforced at the service layer:
    - Overlap detection across approved/pending leaves
    - Balance validation per leave type
    - Business day calculation (exclude weekends)
    - Status workflow enforcement
    """

    __tablename__ = "leave_requests"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    leave_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    total_days: Mapped[int] = mapped_column(Integer, nullable=False)

    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20),
        default=LeaveStatus.PENDING.value,
        nullable=False,
        index=True,
    )

    admin_remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    employee = relationship("Employee", back_populates="leave_requests", lazy="selectin")
    reviewer = relationship("User", foreign_keys=[approved_by], lazy="selectin")

    def __repr__(self) -> str:
        return (
            f"<LeaveRequest(employee_id={self.employee_id}, "
            f"type={self.leave_type}, status={self.status})>"
        )
