"""
HR Nexus — Leave Service

Enforces leave workflows:
- Overlap detection across date ranges
- Balance validation against annual limits
- Business day calculation (excluding weekends)
- Status workflow (PENDING → APPROVED / REJECTED / CANCELLED)
- Automatic attendance marking as ON_LEAVE when approved
"""

from datetime import date, datetime, timedelta, timezone
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import DEFAULT_LEAVE_BALANCES, AttendanceStatus, LeaveStatus, LeaveType, NotificationType
from app.core.exceptions import (
    BusinessRuleException,
    InsufficientLeaveBalanceException,
    InvalidLeaveStatusTransition,
    LeaveOverlapException,
    NotFoundException,
)
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.leave import LeaveRequest
from app.models.user import User
from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.leave_repository import LeaveRepository
from app.repositories.notification_repository import NotificationRepository
from app.schemas.leave import LeaveBalanceResponse, LeaveRequestCreate, LeaveReviewRequest
from app.utils.datetime_utils import count_business_days


class LeaveService:
    """Service layer for Leave management workflows."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = LeaveRepository(db)
        self.att_repo = AttendanceRepository(db)
        self.notif_repo = NotificationRepository(db)

    async def submit_request(self, employee: Employee, data: LeaveRequestCreate) -> LeaveRequest:
        """
        Submit a new leave application.
        Enforces overlap check and balance validation.
        """
        # 1. Check for overlapping leaves
        overlap = await self.repo.check_overlap(employee.id, data.start_date, data.end_date)
        if overlap:
            conflicting = f"{overlap.start_date} to {overlap.end_date}"
            raise LeaveOverlapException(conflicting)

        # 2. Calculate business days (exclude weekends)
        business_days = count_business_days(data.start_date, data.end_date)
        if business_days <= 0:
            raise BusinessRuleException("Leave request must contain at least one business day (Mon-Fri).")

        # 3. Validate leave balance
        try:
            l_type = LeaveType(data.leave_type)
        except ValueError:
            l_type = LeaveType.ANNUAL

        allowed_days = DEFAULT_LEAVE_BALANCES.get(l_type, 12)
        used_days = await self.repo.count_used_days(employee.id, l_type.value, data.start_date.year)
        remaining = allowed_days - used_days

        if business_days > remaining:
            raise InsufficientLeaveBalanceException(
                leave_type=l_type.value, available=remaining, requested=business_days
            )

        # 4. Create request
        new_leave = await self.repo.create({
            "employee_id": employee.id,
            "leave_type": l_type.value,
            "start_date": data.start_date,
            "end_date": data.end_date,
            "total_days": business_days,
            "reason": data.reason.strip(),
            "status": LeaveStatus.PENDING.value,
        })
        return new_leave

    async def review_request(
        self, leave_id: uuid.UUID, reviewer: User, review: LeaveReviewRequest
    ) -> LeaveRequest:
        """
        Admin review of a leave request (Approve or Reject).
        When APPROVED, automatically marks attendance records as ON_LEAVE for those dates.
        """
        leave = await self.repo.get_by_id(leave_id)
        if not leave:
            raise NotFoundException("LeaveRequest", str(leave_id))

        if leave.status != LeaveStatus.PENDING.value:
            raise InvalidLeaveStatusTransition(leave.status, review.status.value)

        leave.status = review.status.value
        leave.approved_by = reviewer.id
        leave.admin_remarks = review.admin_remarks
        leave.reviewed_at = datetime.now(timezone.utc)

        # If approved, automatically mark attendance records as ON_LEAVE
        if review.status == LeaveStatus.APPROVED:
            current = leave.start_date
            while current <= leave.end_date:
                if current.weekday() < 5:  # Monday=0, Friday=4
                    existing = await self.att_repo.get_by_employee_and_date(leave.employee_id, current)
                    if existing:
                        existing.status = AttendanceStatus.ON_LEAVE.value
                        existing.notes = f"On Leave ({leave.leave_type})"
                        await self.att_repo.update(existing, {})
                    else:
                        await self.att_repo.create({
                            "employee_id": leave.employee_id,
                            "date": current,
                            "status": AttendanceStatus.ON_LEAVE.value,
                            "notes": f"On Leave ({leave.leave_type})",
                        })
                current += timedelta(days=1)

        updated_leave = await self.repo.update(leave, {})

        # Emit in-app notification to employee
        from app.models.notification import Notification
        notif = Notification(
            user_id=leave.employee.user_id if leave.employee else reviewer.id,
            title=f"Leave Request {review.status.value.upper()}",
            message=f"Your {leave.leave_type} leave request from {leave.start_date} to {leave.end_date} has been {review.status.value}.",
            type=NotificationType.LEAVE_STATUS.value,
            metadata_json={"leave_id": str(leave.id), "status": review.status.value},
        )
        self.db.add(notif)
        await self.db.flush()

        return updated_leave

    async def cancel_request(self, leave_id: uuid.UUID, employee: Employee) -> LeaveRequest:
        """
        Employee self-cancellation of a pending leave request.
        Only PENDING requests can be cancelled.
        """
        leave = await self.repo.get_by_id(leave_id)
        if not leave or leave.employee_id != employee.id:
            raise NotFoundException("LeaveRequest", str(leave_id))

        if leave.status != LeaveStatus.PENDING.value:
            raise InvalidLeaveStatusTransition(leave.status, LeaveStatus.CANCELLED.value)

        leave.status = LeaveStatus.CANCELLED.value
        return await self.repo.update(leave, {})

    async def get_balance(self, employee: Employee, year: int | None = None) -> list[LeaveBalanceResponse]:
        """Calculate remaining balances across all leave types for an employee."""
        target_year = year or date.today().year
        balances = []

        for l_type, allowed in DEFAULT_LEAVE_BALANCES.items():
            used = await self.repo.count_used_days(employee.id, l_type.value, target_year)
            
            # Count pending days
            all_reqs, _ = await self.repo.get_by_employee(employee.id, status=LeaveStatus.PENDING.value, limit=100)
            pending = sum(r.total_days for r in all_reqs if r.leave_type == l_type.value and r.start_date.year == target_year)

            remaining = max(0, allowed - used - pending)
            balances.append(
                LeaveBalanceResponse(
                    leave_type=l_type.value,
                    total_allowed=allowed,
                    used_days=used,
                    pending_days=pending,
                    remaining_days=remaining,
                )
            )

        return balances
