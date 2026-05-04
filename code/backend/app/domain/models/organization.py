from sqlalchemy import Boolean, Column, String
from sqlalchemy.orm import relationship

from app.domain.models.base import BaseEntity


class Organization(BaseEntity):
    __tablename__ = "organizations"
    __table_args__ = {"schema": "hive_core"}

    name = Column(String(200), nullable=False)
    address = Column(String(500), nullable=True)
    phone = Column(String(30), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    user_organizations = relationship("UserOrganization", back_populates="organization", lazy="selectin")
    settings = relationship("DriverCheckinSetting", back_populates="organization", lazy="selectin")
