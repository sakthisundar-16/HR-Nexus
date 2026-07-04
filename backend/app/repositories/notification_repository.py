"""
HR Nexus — Notification Repository
"""

import uuid
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    """Repository for Notification entity data access."""

    def __init__(self, db: AsyncSession):
        super().__init__(Notification, db)

    async def get_user_notifications(
        self,
        user_id: uuid.UUID,
        unread_only: bool = False,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Notification], int]:
        """Fetch paginated notifications for a user."""
        stmt = select(Notification).where(Notification.user_id == user_id)
        count_stmt = select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id
        )

        if unread_only:
            stmt = stmt.where(Notification.is_read == False)
            count_stmt = count_stmt.where(Notification.is_read == False)

        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
        items_res = await self.db.execute(stmt)
        items = items_res.scalars().all()

        return list(items), total

    async def get_unread_count(self, user_id: uuid.UUID) -> int:
        """Count unread notifications for a user."""
        query = select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def mark_as_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Mark a specific notification as read."""
        stmt = (
            update(Notification)
            .where(Notification.id == notification_id, Notification.user_id == user_id)
            .values(is_read=True)
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount > 0

    async def mark_all_as_read(self, user_id: uuid.UUID) -> int:
        """Mark all notifications for a user as read."""
        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount
