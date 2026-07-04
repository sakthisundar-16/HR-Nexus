"""
HR Nexus — SQLAlchemy Declarative Base

Provides the base class for all ORM models with:
- Consistent naming conventions for constraints (prevents Alembic issues)
- Timestamp mixin for created_at/updated_at columns
- UUID primary key mixin for all entities
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import MetaData, String, Uuid, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# Naming conventions ensure Alembic can autogenerate migration names
# and prevents ambiguous constraint names across databases.
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    metadata = MetaData(naming_convention=convention)

    # Use Uuid for UUID storage (automatically coerces to string for SQLite)
    # Use DateTime(timezone=True) for all datetime columns (fixes asyncpg offset errors)
    type_annotation_map = {
        uuid.UUID: Uuid(as_uuid=True),
        datetime: DateTime(timezone=True),
    }


class TimestampMixin:
    """Adds created_at and updated_at columns to any model."""

    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class UUIDMixin:
    """Adds a UUID primary key to any model."""

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
