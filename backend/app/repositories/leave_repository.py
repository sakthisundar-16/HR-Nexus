"""
HR Nexus — Leave Repository
"""

from datetime import date
import uuid
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import LeaveStatus
from app.models.leave import LeaveRequest
from app.repositories.base import BaseRepository


class LeaveRepository(BaseRepository[LeaveRequest]):
    """Repository for LeaveRequest entity data access."""

    def __init__(self, db: AsyncSession):
        super().__init__(LeaveRequest, db)

    async def check_overlap(
        self,
        employee_id: uuid.UUID,
        start_date: date,
        end_date: date,
        exclude_leave_id: uuid.UUID | None = None,
    ) -> LeaveRequest | None:
        """
        Check if an employee already has an APPROVED or PENDING leave request
        that overlaps with the specified date range.

        Overlap condition: existing.start <= new.end AND existing.end >= new.start
        """
        stmt = select(LeaveRequest).where(
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.status.in_([LeaveStatus.APPROVED.value, LeaveStatus.PENDING.value]),
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date,
        )
        if exclude_leave_id:
            stmt = stmt.where(LeaveRequest.id != exclude_leave_id)

        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_employee(
        self,
        employee_id: uuid.UUID,
        status: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[LeaveRequest], int]:
        """Fetch paginated leave requests for an employee."""
        stmt = (
            select(LeaveRequest)
            .options(selectinload(LeaveRequest.employee), selectinload(LeaveRequest.reviewer))
            .where(LeaveRequest.employee_id == employee_id)
        )
        count_stmt = select(func.count()).select_from(LeaveRequest).where(
            LeaveRequest.employee_id == employee_id
        )

        if status:
            stmt = stmt.where(LeaveRequest.status == status)
            count_stmt = count_stmt.where(LeaveRequest.status == status)

        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(LeaveRequest.created_at.desc()).offset(skip).limit(limit)
        items_res = await self.db.execute(stmt)
        items = items_res.scalars().all()

        return list(items), total

    async def get_pending_requests(
        self, skip: int = 0, limit: int = 20
    ) -> tuple[list[LeaveRequest], int]:
        """Fetch all PENDING leave requests for admin review."""
        stmt = (
            select(LeaveRequest)
            .options(selectinload(LeaveRequest.employee))
            .where(LeaveRequest.status == LeaveStatus.PENDING.value)
        )
        count_stmt = select(func.count()).select_from(LeaveRequest).where(
            LeaveRequest.status == LeaveStatus.PENDING.value
        )

        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(LeaveRequest.created_at.asc()).offset(skip).limit(limit)
        items_res = await self.db.execute(stmt)
        items = items_res.scalars().all()

        return list(items), total

    async def get_all_leaves(
        self,
        status: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[LeaveRequest], int]:
        """Fetch paginated leave requests across all employees (Admin/HR only)."""
        stmt = (
            select(LeaveRequest)
            .options(selectinload(LeaveRequest.employee), selectinload(LeaveRequest.reviewer))
        )
        count_stmt = select(func.count()).select_from(LeaveRequest)

        if status:
            stmt = stmt.where(LeaveRequest.status == status)
            count_stmt = count_stmt.where(LeaveRequest.status == status)

        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(LeaveRequest.created_at.desc()).offset(skip).limit(limit)
        items_res = await self.db.execute(stmt)
        items = items_res.scalars().all()

        return list(items), total

    async def count_used_days(self, employee_id: uuid.UUID, leave_type: str, year: int) -> int:
        """Count total approved leave days used by an employee for a specific leave type in a year."""
        start_of_year = date(year, 1, 1)
        end_of_year = date(year, 12, 31)

        stmt = select(func.sum(LeaveRequest.total_days)).where(
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.leave_type == leave_type,
            LeaveRequest.status == LeaveStatus.APPROVED.value,
            LeaveRequest.start_date >= start_of_year,
            LeaveRequest.end_date <= end_of_year,
        )
        result = await self.db.execute(stmt)
        val = result.scalar()
        return int(val) if val is not None else 0
