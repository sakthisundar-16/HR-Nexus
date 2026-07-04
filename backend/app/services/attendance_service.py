"""
HR Nexus — Attendance Service

Enforces daily attendance workflows:
- Prevents duplicate check-ins
- Requires check-in before check-out
- Automatically computes working hours
- Automatically assigns status (PRESENT, LATE, HALF_DAY)
"""

from datetime import date, datetime, timezone
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.constants import AttendanceStatus
from app.core.exceptions import (
    AlreadyCheckedOutException,
    CheckOutBeforeCheckInException,
    DuplicateCheckInException,
    NotFoundException,
)
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.attendance import AttendanceSummaryResponse, CheckInRequest, CheckOutRequest

settings = get_settings()


class AttendanceService:
    """Service layer for Attendance workflows."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AttendanceRepository(db)
        self.emp_repo = EmployeeRepository(db)

    async def check_in(
        self, employee: Employee, request: CheckInRequest, ip_address: str | None = None
    ) -> Attendance:
        """
        Record employee check-in for today.
        Raises DuplicateCheckInException if already checked in today.
        """
        today = date.today()
        existing = await self.repo.get_by_employee_and_date(employee.id, today)
        if existing and existing.check_in:
            raise DuplicateCheckInException()

        now = datetime.now(timezone.utc)

        # Determine if check-in is late (after configured WORK_START_HOUR:WORK_START_MINUTE)
        # Convert now to local time equivalent or use UTC hour comparison
        status = AttendanceStatus.PRESENT.value
        if now.hour > settings.WORK_START_HOUR or (
            now.hour == settings.WORK_START_HOUR and now.minute > settings.WORK_START_MINUTE
        ):
            status = AttendanceStatus.LATE.value

        if existing:
            existing.check_in = now
            existing.status = status
            existing.notes = request.notes
            existing.check_in_ip = ip_address
            return await self.repo.update(existing, {})

        new_att = await self.repo.create({
            "employee_id": employee.id,
            "date": today,
            "check_in": now,
            "status": status,
            "notes": request.notes,
            "check_in_ip": ip_address,
        })
        return new_att

    async def check_out(self, employee: Employee, request: CheckOutRequest) -> Attendance:
        """
        Record employee check-out for today.
        Automatically calculates total working hours and updates status to HALF_DAY if < 4 hours.
        """
        today = date.today()
        record = await self.repo.get_by_employee_and_date(employee.id, today)

        if not record or not record.check_in:
            raise CheckOutBeforeCheckInException()
        if record.check_out:
            raise AlreadyCheckedOutException()

        now = datetime.now(timezone.utc)
        record.check_out = now

        # Calculate working hours
        duration_sec = (now - record.check_in).total_seconds()
        hours = round(duration_sec / 3600.0, 2)
        record.total_hours = max(0.0, hours)

        # Adjust status if hours < half day threshold
        if record.total_hours < settings.HALF_DAY_HOURS:
            record.status = AttendanceStatus.HALF_DAY.value

        if request.notes:
            record.notes = f"{record.notes or ''} | Check-out: {request.notes}".strip(" |")

        return await self.repo.update(record, {})

    async def get_today_status(self, employee: Employee) -> Attendance | None:
        """Fetch today's attendance record for an employee."""
        return await self.repo.get_by_employee_and_date(employee.id, date.today())

    async def get_history(
        self,
        employee_id: uuid.UUID | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        status: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Attendance], int]:
        """Fetch paginated attendance history."""
        return await self.repo.get_history(
            employee_id=employee_id,
            start_date=start_date,
            end_date=end_date,
            status=status,
            skip=skip,
            limit=limit,
        )

    async def get_daily_report(self, report_date: date) -> list[Attendance]:
        """Fetch daily attendance report for all employees."""
        return await self.repo.get_daily_report(report_date)

    async def get_summary(
        self, employee_id: uuid.UUID, month: int, year: int
    ) -> AttendanceSummaryResponse:
        """Calculate monthly attendance summary and percentage for an employee."""
        from app.utils.datetime_utils import count_working_days_in_month, get_month_date_range
        start_date, end_date = get_month_date_range(year, month)

        records, _ = await self.repo.get_history(
            employee_id=employee_id, start_date=start_date, end_date=end_date, limit=100
        )

        working_days = count_working_days_in_month(year, month)
        present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT.value)
        late = sum(1 for r in records if r.status == AttendanceStatus.LATE.value)
        half_day = sum(1 for r in records if r.status == AttendanceStatus.HALF_DAY.value)
        on_leave = sum(1 for r in records if r.status == AttendanceStatus.ON_LEAVE.value)
        total_hours = sum(r.total_hours or 0.0 for r in records)

        # Late counts as present for percentage
        effective_present = present + late + (half_day * 0.5) + on_leave
        pct = round((effective_present / max(1, working_days)) * 100.0, 2)
        avg_hours = round(total_hours / max(1, len(records)), 2)

        return AttendanceSummaryResponse(
            total_days_recorded=len(records),
            days_present=present,
            days_absent=max(0, working_days - int(effective_present)),
            days_half_day=half_day,
            days_late=late,
            days_on_leave=on_leave,
            total_working_hours=round(total_hours, 2),
            average_working_hours=avg_hours,
            attendance_percentage=min(100.0, pct),
        )
