"""
HR Nexus — Payroll Repository
"""

import uuid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.payroll import Payroll
from app.repositories.base import BaseRepository


class PayrollRepository(BaseRepository[Payroll]):
    """Repository for Payroll entity data access."""

    def __init__(self, db: AsyncSession):
        super().__init__(Payroll, db)

    async def get_by_employee_and_period(
        self, employee_id: uuid.UUID, period: str
    ) -> Payroll | None:
        """Fetch payroll record for an employee in a specific period (e.g. 2026-07)."""
        result = await self.db.execute(
            select(Payroll).where(
                Payroll.employee_id == employee_id,
                Payroll.payroll_period == period,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_period(
        self,
        period: str | None = None,
        status: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Payroll], int]:
        """Fetch paginated payroll records filtered by period or status."""
        stmt = select(Payroll).options(selectinload(Payroll.employee))
        count_stmt = select(func.count()).select_from(Payroll)

        if period:
            stmt = stmt.where(Payroll.payroll_period == period)
            count_stmt = count_stmt.where(Payroll.payroll_period == period)
        if status:
            stmt = stmt.where(Payroll.status == status)
            count_stmt = count_stmt.where(Payroll.status == status)

        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(Payroll.payroll_period.desc(), Payroll.created_at.desc()).offset(skip).limit(limit)
        items_res = await self.db.execute(stmt)
        items = items_res.scalars().all()

        return list(items), total

    async def get_employee_payslips(
        self,
        employee_id: uuid.UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Payroll], int]:
        """Fetch paginated payslip history for an employee."""
        stmt = (
            select(Payroll)
            .options(selectinload(Payroll.employee))
            .where(Payroll.employee_id == employee_id)
        )
        count_stmt = select(func.count()).select_from(Payroll).where(
            Payroll.employee_id == employee_id
        )

        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(Payroll.payroll_period.desc()).offset(skip).limit(limit)
        items_res = await self.db.execute(stmt)
        items = items_res.scalars().all()

        return list(items), total
