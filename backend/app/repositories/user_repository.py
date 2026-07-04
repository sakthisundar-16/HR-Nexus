"""
HR Nexus — User Repository

Data access layer for User entities.
"""

from datetime import datetime, timedelta, timezone
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.user import User
from app.repositories.base import BaseRepository

settings = get_settings()


class UserRepository(BaseRepository[User]):
    """Repository for User entity data access."""

    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> User | None:
        """Fetch user by email address (case-insensitive)."""
        result = await self.db.execute(
            select(User).where(User.email == email.lower().strip())
        )
        return result.scalar_one_or_none()

    async def record_login_success(self, user: User) -> User:
        """Update last_login timestamp and reset failed login attempts."""
        user.last_login = datetime.now(timezone.utc)
        user.failed_login_attempts = 0
        user.locked_until = None
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def record_login_failure(self, user: User) -> User:
        """Increment failed login attempts and lock account if threshold reached."""
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.LOGIN_RATE_LIMIT_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(
                minutes=settings.LOGIN_RATE_LIMIT_MINUTES
            )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user
