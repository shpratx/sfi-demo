from sqlalchemy import Column, ForeignKey, UniqueConstraint, Uuid
from sqlalchemy.orm import relationship

from app.domain.models.base import BaseEntity


class UserOrganization(BaseEntity):
    __tablename__ = "user_organizations"
    __table_args__ = (
        UniqueConstraint("user_id", "org_id", name="uq_user_org_active"),
        {"schema": "hive_core"},
    )

    user_id = Column(Uuid, ForeignKey("hive_core.users.id"), nullable=False)
    org_id = Column(Uuid, ForeignKey("hive_core.organizations.id"), nullable=False)

    user = relationship("User", back_populates="user_organizations")
    organization = relationship("Organization", back_populates="user_organizations")
