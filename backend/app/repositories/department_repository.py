"""
HR Nexus — Department Repository
"""

import uuid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.employee import Employee
from app.repositories.base import BaseRepository


class DepartmentRepository(BaseRepository[Department]):
    """Repository for Department entity data access."""

    def __init__(self, db: AsyncSession):
        super().__init__(Department, db)

    async def get_by_code(self, code: str) -> Department | None:
        """Fetch department by its unique code (e.g., ENG, HR)."""
        result = await self.db.execute(
            select(Department).where(Department.code == code.upper().strip())
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Department | None:
        """Fetch department by name."""
        result = await self.db.execute(
            select(Department).where(Department.name == name.strip())
        )
        return result.scalar_one_or_none()

    async def get_employee_count(self, department_id: uuid.UUID) -> int:
        """Count total employees assigned to a department."""
        query = select(func.count()).select_from(Employee).where(
            Employee.department_id == department_id
        )
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def get_active_employee_count(self, department_id: uuid.UUID) -> int:
        """Count active employees in a department."""
        from app.core.constants import EmploymentStatus
        query = select(func.count()).select_from(Employee).where(
            Employee.department_id == department_id,
            Employee.employment_status == EmploymentStatus.ACTIVE.value
        )
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def get_average_salary(self, department_id: uuid.UUID) -> float:
        """Calculate average base salary in a department."""
        query = select(func.avg(Employee.base_salary)).where(
            Employee.department_id == department_id
        )
        result = await self.db.execute(query)
        val = result.scalar()
        return float(val) if val is not None else 0.0
