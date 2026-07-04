"""
HR Nexus — Employee Repository
"""

from datetime import date, datetime, timedelta, timezone
import uuid
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import EmploymentStatus
from app.models.employee import Employee
from app.repositories.base import BaseRepository


class EmployeeRepository(BaseRepository[Employee]):
    """Repository for Employee entity data access."""

    def __init__(self, db: AsyncSession):
        super().__init__(Employee, db)

    async def get_by_employee_id(self, employee_id: str) -> Employee | None:
        """Fetch employee by human-readable ID (e.g. EMP-0001)."""
        result = await self.db.execute(
            select(Employee).where(Employee.employee_id == employee_id.upper().strip())
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: uuid.UUID) -> Employee | None:
        """Fetch employee profile by linked User ID."""
        result = await self.db.execute(
            select(Employee).where(Employee.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_next_employee_id(self) -> str:
        """Generate the next sequential employee ID (EMP-XXXX)."""
        query = select(func.max(Employee.employee_id))
        result = await self.db.execute(query)
        max_id = result.scalar()
        if not max_id or not max_id.startswith("EMP-"):
            return "EMP-0001"
        try:
            num = int(max_id.split("-")[1]) + 1
            return f"EMP-{num:04d}"
        except (IndexError, ValueError):
            return "EMP-0001"

    async def search(
        self,
        query: str | None = None,
        department_id: uuid.UUID | None = None,
        status: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Employee], int]:
        """Search and filter employees with pagination."""
        stmt = select(Employee).options(selectinload(Employee.department), selectinload(Employee.user))
        count_stmt = select(func.count()).select_from(Employee)

        filters = []
        if query:
            q_str = f"%{query.strip()}%"
            filters.append(
                or_(
                    Employee.first_name.ilike(q_str),
                    Employee.last_name.ilike(q_str),
                    Employee.employee_id.ilike(q_str),
                    Employee.job_title.ilike(q_str),
                )
            )
        if department_id:
            filters.append(Employee.department_id == department_id)
        if status:
            filters.append(Employee.employment_status == status)

        if filters:
            for f in filters:
                stmt = stmt.where(f)
                count_stmt = count_stmt.where(f)

        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(Employee.employee_id.asc()).offset(skip).limit(limit)
        items_res = await self.db.execute(stmt)
        items = items_res.scalars().all()

        return list(items), total

    async def get_upcoming_birthdays(self, days: int = 30) -> list[Employee]:
        """Fetch employees whose birthday occurs in the next N days."""
        all_emp = await self.get_all(skip=0, limit=1000)
        today = date.today()
        upcoming = []
        for emp in all_emp:
            if not emp.date_of_birth:
                continue
            # Check if birthday in current year or next year is within range
            bday_this_year = emp.date_of_birth.replace(year=today.year)
            if bday_this_year < today:
                bday_next_year = emp.date_of_birth.replace(year=today.year + 1)
                diff = (bday_next_year - today).days
            else:
                diff = (bday_this_year - today).days

            if 0 <= diff <= days:
                upcoming.append(emp)
        return upcoming
