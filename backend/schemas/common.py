"""
Common Enterprise Schemas for FedSentinel-Health
Generic pagination, metadata containers, and response models.
"""

from __future__ import annotations
from typing import Generic, TypeVar, List
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standardized enterprise paginated response container."""
    items: List[T] = Field(..., description="Array of entities on the current page")
    total: int = Field(..., description="Total count of records matching criteria")
    page: int = Field(default=1, ge=1, description="Current 1-indexed page number")
    page_size: int = Field(default=50, ge=1, le=500, description="Page size limit")
    pages: int = Field(default=1, ge=1, description="Total number of available pages")
