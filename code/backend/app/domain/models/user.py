from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.domain.models.base import BaseEntity


class User(BaseEntity):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('ADMIN', 'STANDARD')", name="ck_users_role"),
        {"schema": "ims_core"},
    )

    email = Column(String(200), unique=True, nullable=False)
    password_hash = Column(String(500), nullable=False)
    full_name = Column(String(200), nullable=False)
    role = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    failed_login_count = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)

    user_organizations = relationship("UserOrganization", back_populates="user", lazy="selectin")
