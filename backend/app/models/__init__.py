"""
HR Nexus — Models Package

Imports all models so SQLAlchemy registers them with Base.metadata.
This is required for create_tables() and Alembic auto-generation.
"""

from app.models.user import User  # noqa: F401
from app.models.department import Department  # noqa: F401
from app.models.employee import Employee  # noqa: F401
from app.models.attendance import Attendance  # noqa: F401
from app.models.leave import LeaveRequest  # noqa: F401
from app.models.payroll import Payroll  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401

__all__ = [
    "User",
    "Department",
    "Employee",
    "Attendance",
    "LeaveRequest",
    "Payroll",
    "Notification",
    "AuditLog",
]
