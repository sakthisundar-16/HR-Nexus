"""
HR Nexus — Business Constants & Enumerations

All enums used across the application are defined here.
This avoids scattered string literals and ensures type safety.
"""

from enum import Enum


class UserRole(str, Enum):
    """User roles for RBAC."""

    ADMIN = "admin"
    HR_MANAGER = "hr_manager"
    EMPLOYEE = "employee"


class EmploymentStatus(str, Enum):
    """Employee lifecycle states."""

    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"
    PROBATION = "probation"


class Gender(str, Enum):
    """Gender options for employee profiles."""

    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class AttendanceStatus(str, Enum):
    """Auto-determined attendance statuses."""

    PRESENT = "present"
    ABSENT = "absent"
    HALF_DAY = "half_day"
    LATE = "late"
    ON_LEAVE = "on_leave"


class LeaveType(str, Enum):
    """Supported leave categories."""

    ANNUAL = "annual"
    SICK = "sick"
    PERSONAL = "personal"
    MATERNITY = "maternity"
    PATERNITY = "paternity"
    UNPAID = "unpaid"


class LeaveStatus(str, Enum):
    """Leave request workflow states."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class PayrollStatus(str, Enum):
    """Payroll processing states."""

    DRAFT = "draft"
    PROCESSED = "processed"
    PAID = "paid"


class NotificationType(str, Enum):
    """Notification categories."""

    LEAVE_STATUS = "leave_status"
    ATTENDANCE = "attendance"
    PAYROLL = "payroll"
    SYSTEM = "system"
    ANNOUNCEMENT = "announcement"


# ============================================================
# Business Constants
# ============================================================

# Default leave balances per year (overridable via config)
DEFAULT_LEAVE_BALANCES: dict[LeaveType, int] = {
    LeaveType.ANNUAL: 12,
    LeaveType.SICK: 6,
    LeaveType.PERSONAL: 3,
    LeaveType.MATERNITY: 90,
    LeaveType.PATERNITY: 15,
    LeaveType.UNPAID: 365,  # No hard limit on unpaid
}

# Profile fields used for completion percentage calculation
PROFILE_OPTIONAL_FIELDS: list[str] = [
    "phone",
    "date_of_birth",
    "gender",
    "address",
    "city",
    "state",
    "emergency_contact_name",
    "emergency_contact_phone",
    "job_title",
    "profile_picture_url",
]

# Pagination defaults
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
