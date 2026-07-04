"""
HR Nexus — Department Service
"""

import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, ConflictException, NotFoundException
from app.models.department import Department
from app.repositories.department_repository import DepartmentRepository
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentWithStatsResponse


class DepartmentService:
    """Service layer for Department management and statistics."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = DepartmentRepository(db)

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[DepartmentWithStatsResponse]:
        """Fetch all departments enriched with headcount and average salary statistics."""
        depts = await self.repo.get_all(skip=skip, limit=limit)
        enriched = []
        for d in depts:
            emp_count = await self.repo.get_employee_count(d.id)
            active_count = await self.repo.get_active_employee_count(d.id)
            avg_salary = await self.repo.get_average_salary(d.id)

            item = DepartmentWithStatsResponse.model_validate(d)
            item.employee_count = emp_count
            item.active_employee_count = active_count
            item.average_salary = round(avg_salary, 2)
            enriched.append(item)
        return enriched

    async def get_by_id(self, dept_id: uuid.UUID) -> DepartmentWithStatsResponse:
        """Fetch a single department by ID with enriched stats."""
        d = await self.repo.get_by_id(dept_id)
        if not d:
            raise NotFoundException("Department", str(dept_id))

        emp_count = await self.repo.get_employee_count(d.id)
        active_count = await self.repo.get_active_employee_count(d.id)
        avg_salary = await self.repo.get_average_salary(d.id)

        item = DepartmentWithStatsResponse.model_validate(d)
        item.employee_count = emp_count
        item.active_employee_count = active_count
        item.average_salary = round(avg_salary, 2)
        return item

    async def create(self, data: DepartmentCreate) -> Department:
        """Create a new department, enforcing unique code and name."""
        if await self.repo.get_by_code(data.code):
            raise ConflictException(f"Department with code '{data.code}' already exists")
        if await self.repo.get_by_name(data.name):
            raise ConflictException(f"Department with name '{data.name}' already exists")

        return await self.repo.create(data)

    async def update(self, dept_id: uuid.UUID, data: DepartmentUpdate) -> Department:
        """Update department properties."""
        dept = await self.repo.get_by_id(dept_id)
        if not dept:
            raise NotFoundException("Department", str(dept_id))

        if data.code and data.code.upper() != dept.code:
            if await self.repo.get_by_code(data.code):
                raise ConflictException(f"Department code '{data.code}' is already in use")
        if data.name and data.name != dept.name:
            if await self.repo.get_by_name(data.name):
                raise ConflictException(f"Department name '{data.name}' is already in use")

        return await self.repo.update(dept, data)

    async def delete(self, dept_id: uuid.UUID) -> bool:
        """
        Delete a department.
        Business Rule: Cannot delete a department that still has active employees!
        """
        dept = await self.repo.get_by_id(dept_id)
        if not dept:
            raise NotFoundException("Department", str(dept_id))

        active_count = await self.repo.get_active_employee_count(dept_id)
        if active_count > 0:
            raise BusinessRuleException(
                f"Cannot delete department '{dept.name}' because it contains {active_count} active employee(s). Please reassign them first.",
                error_code="DEPARTMENT_NOT_EMPTY",
            )

        return await self.repo.delete(dept_id)
