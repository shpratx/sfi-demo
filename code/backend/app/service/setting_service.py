"""Setting service with caching and audit logging."""

import json
import re
from uuid import UUID

import structlog
from redis import Redis
from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.domain.enums import AuditAction, InputType
from app.domain.models.audit_log import AuditLog
from app.domain.models.setting import DriverCheckinSetting
from app.domain.schemas.setting import (
    MobileSettingItem,
    SettingResponse,
    UpdateSettingRequest,
    UpdateSettingResponse,
)
from app.infrastructure.cache import cache_delete_pattern, cache_get, cache_set

logger: structlog.stdlib.BoundLogger = structlog.get_logger()

_CACHE_TTL = 30
_ALPHA_RE = re.compile(r"^[a-zA-Z0-9\s\-°/]+$")
_NUMERIC_RE = re.compile(r"^\d+$")


class SettingService:
    def __init__(self, db: Session, redis: Redis) -> None:  # type: ignore[type-arg]
        self.db = db
        self.redis = redis

    def get_settings(self, org_id: UUID) -> list[SettingResponse]:
        cache_key = f"settings:{org_id}"
        cached = cache_get(cache_key)
        if cached:
            return [SettingResponse.model_validate_json(s) for s in json.loads(cached)]

        rows = (
            self.db.query(DriverCheckinSetting)
            .filter(DriverCheckinSetting.org_id == org_id, DriverCheckinSetting.is_deleted.is_(False))
            .order_by(DriverCheckinSetting.display_order)
            .all()
        )
        result = [SettingResponse.model_validate(r) for r in rows]
        cache_set(cache_key, json.dumps([s.model_dump_json() for s in result]), _CACHE_TTL)
        return result

    def update_setting(
        self, setting_id: UUID, org_id: UUID, data: UpdateSettingRequest,
        user_id: str, correlation_id: str | None = None,
    ) -> UpdateSettingResponse:
        setting = self.db.query(DriverCheckinSetting).filter(
            DriverCheckinSetting.id == setting_id,
            DriverCheckinSetting.org_id == org_id,
            DriverCheckinSetting.is_deleted.is_(False),
        ).first()
        if not setting:
            raise NotFoundError("Setting not found")
        if setting.version_num != data.version_num:
            raise ConflictError("Setting was modified by another user")

        # Locked toggle check
        if data.toggle_state is not None and setting.toggle_locked and data.toggle_state != setting.toggle_state:
            raise BusinessRuleError("This toggle is locked and cannot be changed")

        # Input validation
        if data.input_value is not None and setting.input_type:
            self._validate_input(data.input_value, setting.input_type)

        # Toggle-aware validation: enabling toggle requires non-empty input if input_type is set
        if data.toggle_state is True and setting.input_type and not (data.input_value or setting.input_value):
            raise BusinessRuleError("Input value is required when enabling this setting")

        old_toggle = setting.toggle_state
        old_value = setting.input_value

        if data.toggle_state is not None:
            setting.toggle_state = data.toggle_state
        if data.input_value is not None:
            setting.input_value = data.input_value

        setting.version_num += 1
        setting.updated_by = user_id
        self.db.commit()
        self.db.refresh(setting)

        # Invalidate caches
        cache_delete_pattern(f"settings:{org_id}*")
        cache_delete_pattern(f"mobile_settings:{org_id}*")

        # Audit log (non-blocking)
        try:
            actions: list[tuple[str, str | None, str | None]] = []
            if data.toggle_state is not None and data.toggle_state != old_toggle:
                actions.append((AuditAction.TOGGLE_CHANGE.value, str(old_toggle), str(data.toggle_state)))
            if data.input_value is not None and data.input_value != old_value:
                actions.append((AuditAction.VALUE_CHANGE.value, old_value, data.input_value))
            for action, old, new in actions:
                self.db.add(AuditLog(
                    user_id=user_id, org_id=org_id, setting_id=setting_id,
                    action=action, old_value=old, new_value=new,
                    correlation_id=correlation_id,
                ))
            if actions:
                self.db.commit()
        except Exception:
            logger.warning("audit_log_write_failed", setting_id=str(setting_id))

        return UpdateSettingResponse.model_validate(setting)

    def get_mobile_settings(self, org_id: UUID) -> list[MobileSettingItem]:
        cache_key = f"mobile_settings:{org_id}"
        cached = cache_get(cache_key)
        if cached:
            return [MobileSettingItem.model_validate_json(s) for s in json.loads(cached)]

        rows = (
            self.db.query(DriverCheckinSetting)
            .filter(
                DriverCheckinSetting.org_id == org_id,
                DriverCheckinSetting.is_deleted.is_(False),
                DriverCheckinSetting.toggle_state.is_(True),
            )
            .order_by(DriverCheckinSetting.display_order)
            .all()
        )
        result = [MobileSettingItem(setting_name=r.setting_name, input_value=r.input_value) for r in rows]
        cache_set(cache_key, json.dumps([s.model_dump_json() for s in result]), _CACHE_TTL)
        return result

    @staticmethod
    def _validate_input(value: str, input_type: str) -> None:
        if input_type == InputType.ALPHANUMERIC.value:
            if len(value) > 200 or not _ALPHA_RE.match(value):
                raise BusinessRuleError("Invalid alphanumeric input (max 200 chars, allowed: a-z A-Z 0-9 spaces - ° /)")
        elif input_type == InputType.NUMERIC.value:
            if not _NUMERIC_RE.match(value) or int(value) < 1 or int(value) > 999:
                raise BusinessRuleError("Invalid numeric input (integer 1-999)")
        elif input_type in (InputType.TEXT.value, InputType.TEXTAREA.value):
            if len(value) > 2000:
                raise BusinessRuleError("Input too long (max 2000 characters)")
        elif input_type == InputType.COMPOSITE.value:
            try:
                obj = json.loads(value)
                hours = obj.get("hours")
                if not (isinstance(hours, (int, str)) and str(hours).isdigit()):
                    raise ValueError
                instruction = obj.get("instruction")
                if not isinstance(instruction, str):
                    raise ValueError
                if len(instruction) > 2000:
                    raise BusinessRuleError("Instruction too long (max 2000 characters)")
            except BusinessRuleError:
                raise
            except (json.JSONDecodeError, ValueError) as exc:
                raise BusinessRuleError("Composite input must be JSON with {hours: int, instruction: str}") from exc
