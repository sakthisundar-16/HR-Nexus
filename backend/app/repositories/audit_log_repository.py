"""
HR Nexus — Audit Log Repository
"""

import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    """Repository for AuditLog entity data access."""

    def __init__(self, db: AsyncSession):
        super().__init__(AuditLog, db)

    async def get_recent(self, limit: int = 50) -> list[AuditLog]:
        """Fetch recent system-wide audit logs."""
        stmt = (
            select(AuditLog)
            .options(selectinload(AuditLog.user))
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_entity(
        self, entity_type: str, entity_id: uuid.UUID
    ) -> list[AuditLog]:
        """Fetch audit timeline for a specific entity (e.g., an Employee ID)."""
        stmt = (
            select(AuditLog)
            .options(selectinload(AuditLog.user))
            .where(AuditLog.entity_type == entity_type, AuditLog.entity_id == entity_id)
            .order_by(AuditLog.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_user(self, user_id: uuid.UUID, limit: int = 50) -> list[AuditLog]:
        """Fetch recent actions performed by a specific user."""
        stmt = (
            select(AuditLog)
            .options(selectinload(AuditLog.user))
            .where(AuditLog.user_id == user_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
