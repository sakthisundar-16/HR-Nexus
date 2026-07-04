"""
HR Nexus — Standardized API Response Wrapper

Every API response follows the same structure for consistency.
This module provides the response builder functions.
"""

from datetime import datetime, timezone
from typing import Any


def success_response(
    message: str = "Success",
    data: Any = None,
    status_code: int = 200,
    meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Build a standardized success response.

    Format:
    {
        "success": true,
        "message": "...",
        "data": { ... },
        "meta": { "page": 1, "per_page": 20, "total": 150, "total_pages": 8 },
        "timestamp": "2026-07-04T10:30:00Z"
    }
    """
    response: dict[str, Any] = {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if meta:
        response["meta"] = meta
    return response


def paginated_response(
    message: str,
    total: int,
    page: int,
    per_page: int,
    items: list[Any] | None = None,
    data: list[Any] | None = None,
) -> dict[str, Any]:
    """Build a standardized paginated response."""
    import math

    res_data = items if items is not None else (data if data is not None else [])
    total_pages = math.ceil(total / per_page) if per_page > 0 else 0
    return success_response(
        message=message,
        data=res_data,
        meta={
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
    )
