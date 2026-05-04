from typing import Generic, TypeVar

from pydantic import BaseModel
from pydantic.alias_generators import to_camel

T = TypeVar("T")


class CamelModel(BaseModel):
    model_config = {"alias_generator": to_camel, "populate_by_name": True}


class PaginationMeta(CamelModel):
    page: int
    page_size: int
    total_count: int
    total_pages: int


class PaginatedResponse(CamelModel, Generic[T]):
    model_config = {"from_attributes": True}
    data: list[T]
    meta: PaginationMeta


class ErrorResponse(CamelModel):
    type: str = "about:blank"
    title: str
    status: int
    detail: str
    instance: str | None = None
    correlation_id: str | None = None
    errors: list[dict] | None = None
