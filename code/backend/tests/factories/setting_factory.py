"""Factory for DriverCheckinSetting model."""

import uuid

import factory

from app.domain.models.setting import DriverCheckinSetting


class SettingFactory(factory.Factory):
    class Meta:
        model = DriverCheckinSetting

    id = factory.LazyFunction(uuid.uuid4)
    org_id = factory.LazyFunction(uuid.uuid4)
    setting_name = "DRIVER_NAME"
    toggle_state = False
    toggle_locked = False
    input_value = None
    input_type = "ALPHANUMERIC"
    display_order = factory.Sequence(lambda n: n + 1)
    is_deleted = False
    version_num = 1
