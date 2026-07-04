"""
HR Nexus — Department Model
"""

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class Department(Base, UUIDMixin, TimestampMixin):
    """
    Department entity.

    Departments group employees and are used for:
    - Organizational reporting
    - Department-level analytics
    - Filtering and search
    """

    __tablename__ = "departments"

    name: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    employees = relationship("Employee", back_populates="department", lazy="noload")

    def __repr__(self) -> str:
        return f"<Department(id={self.id}, name={self.name}, code={self.code})>"
