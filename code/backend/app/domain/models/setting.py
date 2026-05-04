from sqlalchemy import Boolean, Column, ForeignKey, Index, Integer, String, Uuid
from sqlalchemy.orm import relationship

from app.domain.models.base import BaseEntity


class DriverCheckinSetting(BaseEntity):
    __tablename__ = "driver_checkin_settings"
    __table_args__ = (
        Index("ix_driver_checkin_settings_org_id", "org_id"),
        {"schema": "hive_checkin"},
    )

    org_id = Column(Uuid, ForeignKey("hive_core.organizations.id"), nullable=False)
    setting_name = Column(String(100), nullable=False)
    toggle_state = Column(Boolean, default=False, nullable=False)
    toggle_locked = Column(Boolean, default=False, nullable=False)
    input_value = Column(String(2000), nullable=True)
    input_type = Column(String(20), nullable=True)
    display_order = Column(Integer, nullable=False)

    organization = relationship("Organization", back_populates="settings")
