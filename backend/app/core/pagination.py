"""
HR Nexus — Pagination Utilities

Provides reusable pagination parameters as a FastAPI dependency.
"""

from dataclasses import dataclass

from fastapi import Query

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE


@dataclass
class PaginationParams:
    """Pagination parameters extracted from query strings."""

    page: int
    per_page: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page

    @property
    def limit(self) -> int:
        return self.per_page


def get_pagination(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    per_page: int = Query(
        default=DEFAULT_PAGE_SIZE,
        ge=1,
        le=MAX_PAGE_SIZE,
        description=f"Items per page (max {MAX_PAGE_SIZE})",
    ),
) -> PaginationParams:
    """FastAPI dependency for pagination parameters."""
    return PaginationParams(page=page, per_page=per_page)
