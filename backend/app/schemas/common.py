"""
HR Nexus — Common Schemas

Shared Pydantic models for API responses, pagination metadata,
and generic wrappers.
"""

from typing import Any, Generic, TypeVar
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    """Metadata for paginated responses."""

    page: int = Field(description="Current page number")
    per_page: int = Field(description="Items per page")
    total: int = Field(description="Total number of items")
    total_pages: int = Field(description="Total number of pages")
    has_next: bool = Field(description="Whether there is a next page")
    has_prev: bool = Field(description="Whether there is a previous page")


class ApiResponse(BaseModel, Generic[T]):
    """Standardized API response wrapper."""

    success: bool = Field(default=True, description="Indicates if request was successful")
    message: str = Field(default="Success", description="Human-readable response message")
    data: T | None = Field(default=None, description="Response payload")
    meta: PaginationMeta | dict[str, Any] | None = Field(default=None, description="Optional metadata (e.g. pagination)")
    timestamp: str = Field(description="ISO timestamp of response")

    model_config = ConfigDict(from_attributes=True)


class ErrorDetail(BaseModel):
    """Structure for individual validation errors."""

    field: str
    message: str
    type: str


class ErrorResponse(BaseModel):
    """Standardized error response structure."""

    success: bool = Field(default=False)
    message: str
    error_code: str
    details: dict[str, Any] | None = None
    timestamp: str
