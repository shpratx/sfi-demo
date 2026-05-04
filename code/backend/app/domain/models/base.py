import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Uuid

from app.infrastructure.database import Base


class AuditMixin:
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = Column(String(100), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    updated_by = Column(String(100), nullable=False)


class BaseEntity(AuditMixin, Base):
    __abstract__ = True

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    is_deleted = Column(Boolean, default=False, nullable=False)
    version_num = Column(Integer, default=1, nullable=False)
