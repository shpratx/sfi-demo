"""Factory for User model."""

import uuid

import factory

from app.core.security import hash_password
from app.domain.models.user import User


class UserFactory(factory.Factory):
    class Meta:
        model = User

    id = factory.LazyFunction(uuid.uuid4)
    email = factory.Sequence(lambda n: f"user{n}@test.com")
    password_hash = factory.LazyFunction(lambda: hash_password("Test1234!"))
    full_name = factory.Faker("name")
    role = "ADMIN"
    is_active = True
    failed_login_count = 0
    locked_until = None
    is_deleted = False
    version_num = 1
