"""
HR Nexus — Central API Router (v1)

Aggregates all module routers under /api/v1 prefix with proper tags.
"""

from fastapi import APIRouter

from app.api.v1 import (
    analytics,
    attendance,
    auth,
    departments,
    employees,
    leaves,
    notifications,
    payroll,
    system,
)

api_router = APIRouter()

# Register all module routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(employees.router, prefix="/employees", tags=["Employees"])
api_router.include_router(departments.router, prefix="/departments", tags=["Departments"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(leaves.router, prefix="/leaves", tags=["Leave Management"])
api_router.include_router(payroll.router, prefix="/payroll", tags=["Payroll"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Dashboard"])
api_router.include_router(system.router, prefix="/system", tags=["System & Health"])
