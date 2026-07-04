"""
HR Nexus — Custom Exception Hierarchy

Structured exception classes that map to specific HTTP status codes
and business error codes. Services raise these; global handlers catch them.

This pattern:
- Decouples business logic from HTTP concerns
- Provides consistent error responses
- Makes error handling testable
"""

from typing import Any


class AppException(Exception):
    """Base exception for all application errors."""

    def __init__(
        self,
        message: str,
        status_code: int = 400,
        error_code: str = "BAD_REQUEST",
        details: dict[str, Any] | None = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


# ============================================================
# Authentication & Authorization Exceptions
# ============================================================


class UnauthorizedException(AppException):
    """401 — Missing or invalid authentication."""

    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            status_code=401,
            error_code="UNAUTHORIZED",
        )


class ForbiddenException(AppException):
    """403 — Authenticated but insufficient permissions."""

    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(
            message=message,
            status_code=403,
            error_code="FORBIDDEN",
        )


class AccountLockedException(AppException):
    """423 — Account locked due to too many failed login attempts."""

    def __init__(self, locked_until: str):
        super().__init__(
            message=f"Account is locked due to too many failed attempts. Try again after {locked_until}",
            status_code=423,
            error_code="ACCOUNT_LOCKED",
            details={"locked_until": locked_until},
        )


class InvalidCredentialsException(AppException):
    """401 — Wrong email or password."""

    def __init__(self):
        super().__init__(
            message="Invalid email or password",
            status_code=401,
            error_code="INVALID_CREDENTIALS",
        )


# ============================================================
# Resource Exceptions
# ============================================================


class NotFoundException(AppException):
    """404 — Resource not found."""

    def __init__(self, resource: str, identifier: Any = None):
        msg = f"{resource} not found"
        if identifier:
            msg = f"{resource} with id '{identifier}' not found"
        super().__init__(
            message=msg,
            status_code=404,
            error_code="NOT_FOUND",
            details={"resource": resource},
        )


class ConflictException(AppException):
    """409 — Resource conflict (duplicate, already exists)."""

    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(
            message=message,
            status_code=409,
            error_code="CONFLICT",
            details=details,
        )


class AlreadyExistsException(AppException):
    """409 — Specific case of conflict: resource already exists."""

    def __init__(self, resource: str, field: str, value: str):
        super().__init__(
            message=f"{resource} with {field} '{value}' already exists",
            status_code=409,
            error_code="ALREADY_EXISTS",
            details={"field": field, "value": value},
        )


# ============================================================
# Business Logic Exceptions
# ============================================================


class BusinessRuleException(AppException):
    """422 — Business rule violation."""

    def __init__(self, message: str, error_code: str = "BUSINESS_RULE_VIOLATION", details: dict[str, Any] | None = None):
        super().__init__(
            message=message,
            status_code=422,
            error_code=error_code,
            details=details,
        )


class DuplicateCheckInException(BusinessRuleException):
    """Employee has already checked in today."""

    def __init__(self):
        super().__init__(
            message="You have already checked in today",
            error_code="DUPLICATE_CHECK_IN",
        )


class CheckOutBeforeCheckInException(BusinessRuleException):
    """Employee is trying to check out without checking in."""

    def __init__(self):
        super().__init__(
            message="Cannot check out without checking in first",
            error_code="CHECKOUT_BEFORE_CHECKIN",
        )


class AlreadyCheckedOutException(BusinessRuleException):
    """Employee has already checked out today."""

    def __init__(self):
        super().__init__(
            message="You have already checked out today",
            error_code="ALREADY_CHECKED_OUT",
        )


class LeaveOverlapException(BusinessRuleException):
    """Leave request dates overlap with existing leave."""

    def __init__(self, conflicting_dates: str):
        super().__init__(
            message=f"Leave dates overlap with an existing leave request ({conflicting_dates})",
            error_code="LEAVE_OVERLAP",
            details={"conflicting_dates": conflicting_dates},
        )


class InsufficientLeaveBalanceException(BusinessRuleException):
    """Not enough leave balance remaining."""

    def __init__(self, leave_type: str, available: int, requested: int):
        super().__init__(
            message=f"Insufficient {leave_type} leave balance. Available: {available}, Requested: {requested}",
            error_code="INSUFFICIENT_LEAVE_BALANCE",
            details={
                "leave_type": leave_type,
                "available": available,
                "requested": requested,
            },
        )


class InvalidLeaveStatusTransition(BusinessRuleException):
    """Invalid leave status change attempt."""

    def __init__(self, current: str, target: str):
        super().__init__(
            message=f"Cannot transition leave status from '{current}' to '{target}'",
            error_code="INVALID_STATUS_TRANSITION",
            details={"current_status": current, "target_status": target},
        )


class InvalidPayrollTransition(BusinessRuleException):
    """Invalid payroll status change attempt."""

    def __init__(self, current: str, target: str):
        super().__init__(
            message=f"Cannot transition payroll status from '{current}' to '{target}'",
            error_code="INVALID_PAYROLL_TRANSITION",
            details={"current_status": current, "target_status": target},
        )


class ProtectedFieldException(BusinessRuleException):
    """Employee is trying to modify a protected field."""

    def __init__(self, fields: list[str]):
        super().__init__(
            message=f"You cannot modify protected fields: {', '.join(fields)}",
            error_code="PROTECTED_FIELD",
            details={"protected_fields": fields},
        )
