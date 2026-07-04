"""
HR Nexus — User Model

Handles authentication concerns only.
Employee HR data is in a separate Employee model (SRP).
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import UserRole
from app.db.base import Base, TimestampMixin, UUIDMixin


class User(Base, UUIDMixin, TimestampMixin):
    """
    User entity — handles authentication and authorization.

    Separated from Employee to follow Single Responsibility Principle:
    - User: email, password, role, login tracking
    - Employee: HR data, salary, department, personal info
    """

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(20), default=UserRole.EMPLOYEE.value, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Login tracking
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    employee = relationship("Employee", back_populates="user", uselist=False, lazy="selectin")
    notifications = relationship("Notification", back_populates="user", lazy="noload")
    audit_logs = relationship("AuditLog", back_populates="user", lazy="noload")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
