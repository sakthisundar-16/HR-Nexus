"""
HR Nexus — Date/Time Utilities

Business-aware date utilities for:
- Working day calculations (excluding weekends)
- Date range operations
- Timezone handling
"""

from datetime import date, timedelta


def count_business_days(start_date: date, end_date: date) -> int:
    """
    Count business days (Mon-Fri) between two dates, inclusive.

    This is used for leave day calculations — weekends are excluded.
    """
    if start_date > end_date:
        return 0

    total_days = 0
    current = start_date
    while current <= end_date:
        if current.weekday() < 5:  # Monday=0, Friday=4
            total_days += 1
        current += timedelta(days=1)

    return total_days


def is_weekend(d: date) -> bool:
    """Check if a date falls on Saturday or Sunday."""
    return d.weekday() >= 5


def get_month_date_range(year: int, month: int) -> tuple[date, date]:
    """Get the first and last day of a given month."""
    first_day = date(year, month, 1)
    if month == 12:
        last_day = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = date(year, month + 1, 1) - timedelta(days=1)
    return first_day, last_day


def count_working_days_in_month(year: int, month: int) -> int:
    """Count total working days (Mon-Fri) in a given month."""
    first_day, last_day = get_month_date_range(year, month)
    return count_business_days(first_day, last_day)
