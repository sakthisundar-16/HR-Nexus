"""
HR Nexus — Notification Model

In-app notification system for leave status updates,
attendance alerts, payroll notifications, and system announcements.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import NotificationType
from app.db.base import Base, UUIDMixin


class Notification(Base, UUIDMixin):
    """
    Notification entity — in-app notifications for users.

    Supports metadata (JSON) for rich notification data
    (e.g., leave request ID, payroll period, etc.)
    """

    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(
        String(30),
        default=NotificationType.SYSTEM.value,
        nullable=False,
        index=True,
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: __import__("datetime").datetime.now(__import__("datetime").timezone.utc),
        nullable=False,
        index=True,
    )

    # Relationships
    user = relationship("User", back_populates="notifications", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Notification(user_id={self.user_id}, title={self.title}, read={self.is_read})>"
