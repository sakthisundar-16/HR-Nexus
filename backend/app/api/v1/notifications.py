"""
HR Nexus — Notification Router
"""

from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.response import paginated_response, success_response
from app.models.user import User
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("", response_model=dict)
async def list_notifications(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Fetch paginated in-app notifications for current user."""
    service = NotificationService(db)
    skip = (page - 1) * per_page
    items, total = await service.get_user_notifications(
        user_id=current_user.id, unread_only=unread_only, skip=skip, limit=per_page
    )
    return paginated_response(
        items=[NotificationResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        per_page=per_page,
        message="Notifications retrieved successfully",
    )


@router.get("/unread-count", response_model=dict)
async def get_unread_badge_count(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Fetch unread badge count for frontend navbar."""
    service = NotificationService(db)
    cnt = await service.get_unread_count(current_user.id)
    return success_response(
        data=UnreadCountResponse(unread_count=cnt).model_dump(),
        message="Unread count retrieved",
    )


@router.put("/{notification_id}/read", response_model=dict)
async def mark_notification_as_read(
    notification_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Mark a specific notification as read."""
    service = NotificationService(db)
    await service.mark_as_read(notification_id, current_user.id)
    return success_response(message="Notification marked as read")


@router.put("/read-all", response_model=dict)
async def mark_all_notifications_as_read(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Mark all notifications for current user as read."""
    service = NotificationService(db)
    cnt = await service.mark_all_as_read(current_user.id)
    return success_response(message=f"{cnt} notifications marked as read")
