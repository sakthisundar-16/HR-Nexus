"""
HR Nexus — Notification Schemas
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.constants import NotificationType


class NotificationCreate(BaseModel):
    """Internal schema used by services to emit notifications."""

    user_id: uuid.UUID
    title: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1)
    type: NotificationType = Field(default=NotificationType.SYSTEM)
    metadata_json: dict | None = None


class NotificationResponse(BaseModel):
    """Notification response schema for frontend."""

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    type: str
    is_read: bool
    metadata_json: dict | None = Field(default=None)
    created_at: datetime

    model_config = {"from_attributes": True}


class UnreadCountResponse(BaseModel):
    """Response schema for unread badge count."""

    unread_count: int = 0
