"""
HR Nexus — Attendance Repository
"""

from datetime import date, datetime
import uuid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.attendance import Attendance
from app.repositories.base import BaseRepository


class AttendanceRepository(BaseRepository[Attendance]):
    """Repository for Attendance entity data access."""

    def __init__(self, db: AsyncSession):
        super().__init__(Attendance, db)

    async def get_by_employee_and_date(
        self, employee_id: uuid.UUID, record_date: date
    ) -> Attendance | None:
        """Fetch attendance record for an employee on a specific date."""
        result = await self.db.execute(
            select(Attendance).where(
                Attendance.employee_id == employee_id,
                Attendance.date == record_date,
            )
        )
        return result.scalar_one_or_none()

    async def get_history(
        self,
        employee_id: uuid.UUID | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        status: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Attendance], int]:
        """Fetch paginated attendance history with filters."""
        stmt = select(Attendance).options(selectinload(Attendance.employee))
        count_stmt = select(func.count()).select_from(Attendance)

        if employee_id:
            stmt = stmt.where(Attendance.employee_id == employee_id)
            count_stmt = count_stmt.where(Attendance.employee_id == employee_id)
        if start_date:
            stmt = stmt.where(Attendance.date >= start_date)
            count_stmt = count_stmt.where(Attendance.date >= start_date)
        if end_date:
            stmt = stmt.where(Attendance.date <= end_date)
            count_stmt = count_stmt.where(Attendance.date <= end_date)
        if status:
            stmt = stmt.where(Attendance.status == status)
            count_stmt = count_stmt.where(Attendance.status == status)

        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(Attendance.date.desc()).offset(skip).limit(limit)
        items_res = await self.db.execute(stmt)
        items = items_res.scalars().all()

        return list(items), total

    async def get_daily_report(self, report_date: date) -> list[Attendance]:
        """Fetch all attendance records for a given date."""
        stmt = (
            select(Attendance)
            .options(selectinload(Attendance.employee))
            .where(Attendance.date == report_date)
            .order_by(Attendance.created_at.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
