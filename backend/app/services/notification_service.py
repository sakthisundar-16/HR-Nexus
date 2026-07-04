"""
HR Nexus — Notification Service
"""

import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import NotificationType
from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationCreate


class NotificationService:
    """Service layer for in-app notification management."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NotificationRepository(db)

    async def emit_notification(self, data: NotificationCreate) -> Notification:
        """Create and emit an in-app notification to a user."""
        return await self.repo.create({
            "user_id": data.user_id,
            "title": data.title.strip(),
            "message": data.message.strip(),
            "type": data.type.value if isinstance(data.type, NotificationType) else data.type,
            "is_read": False,
            "metadata_json": data.metadata_json,
        })

    async def get_user_notifications(
        self, user_id: uuid.UUID, unread_only: bool = False, skip: int = 0, limit: int = 20
    ) -> tuple[list[Notification], int]:
        """Fetch paginated notifications for a user."""
        return await self.repo.get_user_notifications(
            user_id=user_id, unread_only=unread_only, skip=skip, limit=limit
        )

    async def get_unread_count(self, user_id: uuid.UUID) -> int:
        """Count unread notifications."""
        return await self.repo.get_unread_count(user_id)

    async def mark_as_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Mark a notification as read."""
        return await self.repo.mark_as_read(notification_id, user_id)

    async def mark_all_as_read(self, user_id: uuid.UUID) -> int:
        """Mark all notifications as read."""
        return await self.repo.mark_all_as_read(user_id)
