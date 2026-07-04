"""
HR Nexus — Employee Service

Enforces profile completion calculation, protected field rules,
and search/birthday queries.
"""

import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PROFILE_OPTIONAL_FIELDS, EmploymentStatus
from app.core.exceptions import NotFoundException, ProtectedFieldException
from app.models.employee import Employee
from app.repositories.department_repository import DepartmentRepository
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.employee import EmployeeAdminUpdate, EmployeeSelfUpdate


class EmployeeService:
    """Service layer for Employee profiles and HR management."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = EmployeeRepository(db)
        self.dept_repo = DepartmentRepository(db)

    def _compute_profile_completion(self, emp: Employee) -> int:
        """Calculate percentage of filled optional profile fields."""
        filled = sum(1 for f in PROFILE_OPTIONAL_FIELDS if getattr(emp, f, None) is not None and getattr(emp, f) != "")
        return int((filled / len(PROFILE_OPTIONAL_FIELDS)) * 100)

    async def get_by_id(self, emp_id: uuid.UUID) -> Employee:
        """Fetch employee profile by ID."""
        emp = await self.repo.get_by_id(emp_id)
        if not emp:
            raise NotFoundException("Employee", str(emp_id))
        return emp

    async def get_all_paginated(
        self,
        query: str | None = None,
        department_id: uuid.UUID | None = None,
        status: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Employee], int]:
        """Search and filter employees with pagination."""
        return await self.repo.search(
            query=query, department_id=department_id, status=status, skip=skip, limit=limit
        )

    async def admin_update(self, emp_id: uuid.UUID, data: EmployeeAdminUpdate) -> Employee:
        """
        Admin update — can modify all fields including protected HR data
        (salary, department, employment status, hire date).
        """
        emp = await self.get_by_id(emp_id)

        if data.department_id and data.department_id != emp.department_id:
            dept = await self.dept_repo.get_by_id(data.department_id)
            if not dept:
                raise NotFoundException("Department", str(data.department_id))

        update_dict = data.model_dump(exclude_unset=True)
        if "employment_status" in update_dict and isinstance(update_dict["employment_status"], EmploymentStatus):
            update_dict["employment_status"] = update_dict["employment_status"].value
        if "gender" in update_dict and update_dict["gender"] is not None:
            update_dict["gender"] = update_dict["gender"].value if hasattr(update_dict["gender"], "value") else update_dict["gender"]

        # Apply updates
        for k, v in update_dict.items():
            setattr(emp, k, v)

        # Recompute completion %
        emp.profile_completion_pct = self._compute_profile_completion(emp)
        return await self.repo.update(emp, {})

    async def self_update(self, emp_id: uuid.UUID, data: EmployeeSelfUpdate) -> Employee:
        """
        Self-service update — restricted to safe contact/personal fields.
        Raises ProtectedFieldException if any protected field is submitted.
        """
        emp = await self.get_by_id(emp_id)

        # Ensure no protected fields were bypassed
        update_dict = data.model_dump(exclude_unset=True)
        protected_fields = {"base_salary", "department_id", "hire_date", "employment_status", "employee_id", "role"}
        attempted_protected = [f for f in update_dict.keys() if f in protected_fields]
        if attempted_protected:
            raise ProtectedFieldException(attempted_protected)

        if "gender" in update_dict and update_dict["gender"] is not None:
            update_dict["gender"] = update_dict["gender"].value if hasattr(update_dict["gender"], "value") else update_dict["gender"]

        for k, v in update_dict.items():
            setattr(emp, k, v)

        emp.profile_completion_pct = self._compute_profile_completion(emp)
        return await self.repo.update(emp, {})

    async def get_upcoming_birthdays(self, days: int = 30) -> list[Employee]:
        """Get employees with birthdays in the next N days."""
        return await self.repo.get_upcoming_birthdays(days=days)
