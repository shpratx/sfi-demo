"""Organization service."""

import math
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.domain.enums import AuditAction, InputType, SettingName
from app.domain.models.organization import Organization
from app.domain.models.setting import DriverCheckinSetting
from app.domain.models.user import User
from app.domain.models.user_organization import UserOrganization
from app.domain.schemas.common import PaginatedResponse, PaginationMeta
from app.domain.schemas.organization import OrgResponse, OrgSummary


class OrgService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_orgs(self, page: int = 1, page_size: int = 20) -> PaginatedResponse[OrgSummary]:
        user_count_sq = (
            self.db.query(func.count(UserOrganization.id))
            .filter(UserOrganization.org_id == Organization.id, UserOrganization.is_deleted.is_(False))
            .correlate(Organization)
            .scalar_subquery()
        )
        query = (
            self.db.query(Organization, user_count_sq.label("user_count"))
            .filter(Organization.is_deleted.is_(False))
            .order_by(Organization.name)
        )
        total = query.count()
        rows = query.offset((page - 1) * page_size).limit(page_size).all()
        data = [
            OrgSummary(id=org.id, name=org.name, is_active=org.is_active, user_count=cnt or 0)
            for org, cnt in rows
        ]
        return PaginatedResponse(
            data=data,
            meta=PaginationMeta(
                page=page, page_size=page_size, total_count=total,
                total_pages=math.ceil(total / page_size) if page_size else 0,
            ),
        )

    def create_org(self, data: dict, created_by: str) -> OrgResponse:
        org = Organization(name=data["name"], address=data.get("address"), phone=data.get("phone"),
                           created_by=created_by, updated_by=created_by)
        self.db.add(org)
        self.db.flush()
        self._seed_settings(org.id, org.name, created_by)
        self.db.commit()
        self.db.refresh(org)
        return OrgResponse.model_validate(org)

    def update_org(self, org_id: UUID, data: dict, updated_by: str) -> OrgResponse:
        org = self.db.query(Organization).filter(
            Organization.id == org_id, Organization.is_deleted.is_(False)
        ).first()
        if not org:
            raise NotFoundError("Organization not found")
        if org.version_num != data["version_num"]:
            raise ConflictError("Organization was modified by another user")

        name_changed = data.get("name") and data["name"] != org.name
        for field in ("name", "address", "phone"):
            if field in data and data[field] is not None:
                setattr(org, field, data[field])
        org.version_num += 1
        org.updated_by = updated_by

        if name_changed:
            setting = self.db.query(DriverCheckinSetting).filter(
                DriverCheckinSetting.org_id == org_id,
                DriverCheckinSetting.setting_name == SettingName.ORGANIZATION_NAME.value,
                DriverCheckinSetting.is_deleted.is_(False),
            ).first()
            if setting:
                setting.input_value = data["name"]
                setting.updated_by = updated_by

        self.db.commit()
        self.db.refresh(org)
        return OrgResponse.model_validate(org)

    def delete_org(self, org_id: UUID) -> None:
        org = self.db.query(Organization).filter(
            Organization.id == org_id, Organization.is_deleted.is_(False)
        ).first()
        if not org:
            raise NotFoundError("Organization not found")
        org.is_deleted = True
        self.db.query(UserOrganization).filter(
            UserOrganization.org_id == org_id, UserOrganization.is_deleted.is_(False)
        ).update({"is_deleted": True})
        self.db.query(DriverCheckinSetting).filter(
            DriverCheckinSetting.org_id == org_id, DriverCheckinSetting.is_deleted.is_(False)
        ).update({"is_deleted": True})
        self.db.commit()

    def assign_user(self, org_id: UUID, user_id: UUID, created_by: str) -> dict:
        if not self.db.query(Organization).filter(Organization.id == org_id, Organization.is_deleted.is_(False)).first():
            raise NotFoundError("Organization not found")
        if not self.db.query(User).filter(User.id == user_id, User.is_deleted.is_(False)).first():
            raise NotFoundError("User not found")
        existing = self.db.query(UserOrganization).filter(
            UserOrganization.user_id == user_id, UserOrganization.org_id == org_id,
            UserOrganization.is_deleted.is_(False),
        ).first()
        if existing:
            raise ConflictError("User already assigned to organization")
        uo = UserOrganization(user_id=user_id, org_id=org_id, created_by=created_by, updated_by=created_by)
        self.db.add(uo)
        self.db.commit()
        return {"user_id": str(user_id), "org_id": str(org_id)}

    def remove_user(self, org_id: UUID, user_id: UUID) -> None:
        uo = self.db.query(UserOrganization).filter(
            UserOrganization.user_id == user_id, UserOrganization.org_id == org_id,
            UserOrganization.is_deleted.is_(False),
        ).first()
        if not uo:
            raise NotFoundError("User-organization assignment not found")
        uo.is_deleted = True
        self.db.commit()

    def _seed_settings(self, org_id: UUID, org_name: str, created_by: str) -> None:
        defaults = [
            (SettingName.ORGANIZATION_NAME, True, True, org_name, InputType.TEXT, 1),
            (SettingName.QR_CODE_ACCESS, True, False, None, None, 2),
            (SettingName.DRIVER_NAME, True, True, None, None, 3),
            (SettingName.DRIVER_ID, True, False, None, None, 4),
            (SettingName.DRIVER_PHONE_NUMBER, True, True, None, None, 5),
            (SettingName.TRUCK_NUMBER, True, True, None, None, 6),
            (SettingName.CARRIER_APPROVAL_STEP, True, False, None, None, 7),
            (SettingName.TEMPERATURE_ACKNOWLEDGEMENT, False, False, None, InputType.ALPHANUMERIC, 8),
            (SettingName.EARLY_CHECK_IN_STEP, False, False, None, InputType.COMPOSITE, 9),
            (SettingName.CONFIRMATION_STEP, True, False, "Driver Check In is successfully completed! Please wait for the call from Traffic Clerk for Dock assignment and further instructions", InputType.TEXTAREA, 10),
        ]
        for name, toggle, locked, value, input_type, order in defaults:
            self.db.add(DriverCheckinSetting(
                org_id=org_id, setting_name=name.value, toggle_state=toggle,
                toggle_locked=locked, input_value=value,
                input_type=input_type.value if input_type else None,
                display_order=order, created_by=created_by, updated_by=created_by,
            ))
