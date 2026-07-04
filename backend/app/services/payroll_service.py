"""
HR Nexus — Payroll Service

Automated payroll calculation engine:
- Computes gross salary (base + allowances + overtime)
- Computes tax and deductions
- Links with attendance records for pro-rata absence deductions
- Enforces status workflow (DRAFT → PROCESSED → PAID)
- Enforces no negative salary rule
"""

from datetime import date
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.constants import AttendanceStatus, NotificationType, PayrollStatus
from app.core.exceptions import ConflictException, InvalidPayrollTransition, NotFoundException
from app.models.employee import Employee
from app.models.payroll import Payroll
from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.payroll_repository import PayrollRepository
from app.schemas.payroll import PayrollGenerateRequest, PayrollProcessRequest
from app.utils.datetime_utils import count_working_days_in_month, get_month_date_range

settings = get_settings()


class PayrollService:
    """Service layer for Payroll calculations and processing."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PayrollRepository(db)
        self.emp_repo = EmployeeRepository(db)
        self.att_repo = AttendanceRepository(db)

    async def generate_payroll(self, request: PayrollGenerateRequest) -> Payroll:
        """
        Generate monthly payroll for an employee.
        Automatically links with attendance records to calculate present/absent days
        and applies pro-rata deductions for unauthorized absences.
        """
        emp = await self.emp_repo.get_by_id(request.employee_id)
        if not emp:
            raise NotFoundException("Employee", str(request.employee_id))

        # Check if payroll already generated for this period
        existing = await self.repo.get_by_employee_and_period(emp.id, request.payroll_period)
        if existing:
            raise ConflictException(
                f"Payroll record for employee '{emp.employee_id}' in period '{request.payroll_period}' already exists."
            )

        # Parse year and month from period (e.g. "2026-07")
        try:
            year, month = map(int, request.payroll_period.split("-"))
        except ValueError:
            year, month = date.today().year, date.today().month

        working_days = count_working_days_in_month(year, month)
        start_date, end_date = get_month_date_range(year, month)

        # Fetch attendance records for period
        records, _ = await self.att_repo.get_history(
            employee_id=emp.id, start_date=start_date, end_date=end_date, limit=100
        )

        present = sum(1 for r in records if r.status in (AttendanceStatus.PRESENT.value, AttendanceStatus.LATE.value))
        half_day = sum(1 for r in records if r.status == AttendanceStatus.HALF_DAY.value)
        on_leave = sum(1 for r in records if r.status == AttendanceStatus.ON_LEAVE.value)

        effective_present = present + (half_day * 0.5) + on_leave
        days_absent = max(0, working_days - int(effective_present))

        # Base monthly salary
        base_monthly = float(emp.base_salary) / 12.0

        # Pro-rata deduction for unauthorized absences
        absence_deduction = (base_monthly / max(1, working_days)) * days_absent
        total_deductions = round(request.deductions + absence_deduction, 2)

        gross = round(base_monthly + request.allowances + request.overtime_pay, 2)
        tax = round(gross * settings.TAX_RATE, 2)
        net = max(0.0, round(gross - total_deductions - tax, 2))  # Enforce no negative salary!

        new_payroll = await self.repo.create({
            "employee_id": emp.id,
            "payroll_period": request.payroll_period,
            "base_salary": round(base_monthly, 2),
            "allowances": round(request.allowances, 2),
            "deductions": total_deductions,
            "overtime_pay": round(request.overtime_pay, 2),
            "gross_salary": gross,
            "tax": tax,
            "net_salary": net,
            "working_days": working_days,
            "days_present": int(effective_present),
            "days_absent": days_absent,
            "status": PayrollStatus.DRAFT.value,
        })
        return new_payroll

    async def process_payroll(self, payroll_id: uuid.UUID, request: PayrollProcessRequest) -> Payroll:
        """
        Transition payroll status: DRAFT → PROCESSED → PAID.
        Enforces forward-only transitions.
        """
        pay = await self.repo.get_by_id(payroll_id)
        if not pay:
            raise NotFoundException("Payroll", str(payroll_id))

        current = pay.status
        target = request.status.value

        # Enforce valid transitions
        if current == PayrollStatus.PAID.value:
            raise InvalidPayrollTransition(current, target)
        if current == PayrollStatus.DRAFT.value and target == PayrollStatus.PAID.value:
            # Must process before paying
            raise InvalidPayrollTransition(current, target)

        pay.status = target
        if target == PayrollStatus.PAID.value:
            pay.payment_date = request.payment_date or date.today()

            # Emit notification to employee
            from app.models.notification import Notification
            notif = Notification(
                user_id=pay.employee.user_id if pay.employee else pay.employee_id,
                title="Payslip Available",
                message=f"Your salary for period {pay.payroll_period} (${pay.net_salary:,.2f}) has been processed and paid.",
                type=NotificationType.PAYROLL.value,
                metadata_json={"payroll_id": str(pay.id), "period": pay.payroll_period, "net_salary": pay.net_salary},
            )
            self.db.add(notif)
            await self.db.flush()

        return await self.repo.update(pay, {})

    async def get_by_id(self, payroll_id: uuid.UUID) -> Payroll:
        """Fetch payslip detail by ID."""
        pay = await self.repo.get_by_id(payroll_id)
        if not pay:
            raise NotFoundException("Payroll", str(payroll_id))
        return pay

    async def get_all_paginated(
        self, period: str | None = None, status: str | None = None, skip: int = 0, limit: int = 20
    ) -> tuple[list[Payroll], int]:
        """Fetch all payroll records with filtering."""
        return await self.repo.get_by_period(period=period, status=status, skip=skip, limit=limit)

    async def get_employee_payslips(
        self, employee_id: uuid.UUID, skip: int = 0, limit: int = 20
    ) -> tuple[list[Payroll], int]:
        """Fetch own payslips."""
        return await self.repo.get_employee_payslips(employee_id, skip=skip, limit=limit)
