"""
HR Nexus — Audit Service
"""

from typing import Any
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.analytics import ActivityTimelineItem


class AuditService:
    """Service layer for immutable audit trail recording and timeline retrieval."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AuditLogRepository(db)

    async def log_action(
        self,
        action: str,
        entity_type: str,
        entity_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
        old_values: dict[str, Any] | None = None,
        new_values: dict[str, Any] | None = None,
        ip_address: str | None = None,
    ) -> AuditLog:
        """Record an immutable audit log entry."""
        return await self.repo.create({
            "user_id": user_id,
            "action": action.upper().strip(),
            "entity_type": entity_type.strip(),
            "entity_id": entity_id,
            "old_values": old_values,
            "new_values": new_values,
            "ip_address": ip_address,
        })

    async def get_recent_activities(self, limit: int = 20) -> list[ActivityTimelineItem]:
        """Fetch recent system activities formatted for frontend feed."""
        logs = await self.repo.get_recent(limit=limit)
        items = []
        for l in logs:
            desc = f"{l.action} on {l.entity_type} ({l.entity_id or 'System'})"
            if l.new_values and "name" in l.new_values:
                desc = f"{l.action}: {l.new_values['name']}"
            elif l.new_values and "first_name" in l.new_values:
                desc = f"{l.action}: {l.new_values.get('first_name')} {l.new_values.get('last_name', '')}"

            items.append(
                ActivityTimelineItem(
                    id=str(l.id),
                    timestamp=l.created_at.isoformat(),
                    action=l.action,
                    entity_type=l.entity_type,
                    description=desc,
                    user_email=l.user.email if l.user else "System / Automated",
                    metadata={"old": l.old_values, "new": l.new_values},
                )
            )
        return items

    async def get_employee_timeline(self, employee_id: uuid.UUID) -> list[ActivityTimelineItem]:
        """Fetch activity timeline for a specific employee."""
        logs = await self.repo.get_by_entity("Employee", employee_id)
        items = []
        for l in logs:
            items.append(
                ActivityTimelineItem(
                    id=str(l.id),
                    timestamp=l.created_at.isoformat(),
                    action=l.action,
                    entity_type=l.entity_type,
                    description=f"{l.action} performed on profile",
                    user_email=l.user.email if l.user else "Self / System",
                    metadata={"changes": l.new_values},
                )
            )
        return items
