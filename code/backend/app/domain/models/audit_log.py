import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String, Uuid

from app.infrastructure.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = {"schema": "hive_checkin"}

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("hive_core.users.id"), nullable=False)
    org_id = Column(Uuid, ForeignKey("hive_core.organizations.id"), nullable=False)
    setting_id = Column(Uuid, ForeignKey("hive_checkin.driver_checkin_settings.id"), nullable=True)
    action = Column(String(50), nullable=False)
    old_value = Column(String(2000), nullable=True)
    new_value = Column(String(2000), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    correlation_id = Column(String(100), nullable=True)
