"""
HR Nexus — Analytics Schemas

Pydantic models optimized for frontend charting libraries (Recharts, Chart.js, etc.).
"""

from typing import Any
from pydantic import BaseModel, Field


class DashboardStatsResponse(BaseModel):
    """High-level summary statistics for the admin dashboard."""

    total_employees: int = Field(default=0)
    active_employees: int = Field(default=0)
    on_leave_today: int = Field(default=0)
    total_departments: int = Field(default=0)
    present_today: int = Field(default=0)
    absent_today: int = Field(default=0)
    late_today: int = Field(default=0)
    attendance_percentage_today: float = Field(default=0.0)
    monthly_payroll_cost: float = Field(default=0.0)
    pending_leave_requests: int = Field(default=0)


class DepartmentDistributionItem(BaseModel):
    """Chart item: Headcount per department."""

    department_name: str
    department_code: str
    employee_count: int
    percentage: float


class LeaveStatisticsItem(BaseModel):
    """Chart item: Distribution of leave requests by type or status."""

    category: str  # e.g., "Annual", "Sick" or "Approved", "Pending"
    count: int
    percentage: float


class MonthlyTrendItem(BaseModel):
    """Chart item: Multi-metric monthly trend (attendance %, payroll cost, headcount)."""

    month: str  # e.g., "Jan", "Feb", "2026-07"
    attendance_rate: float = 0.0
    payroll_cost: float = 0.0
    new_hires: int = 0
    total_employees: int = 0


class EmployeeGrowthItem(BaseModel):
    """Chart item: Employee growth over time."""

    period: str  # e.g., "2026-Q1" or "2026-07"
    count: int


class ActivityTimelineItem(BaseModel):
    """Activity timeline event for recent activities feed."""

    id: str
    timestamp: str
    action: str
    entity_type: str
    description: str
    user_email: str | None = None
    metadata: dict[str, Any] | None = None
