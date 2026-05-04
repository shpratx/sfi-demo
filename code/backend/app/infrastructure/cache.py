"""Redis cache utilities."""

from typing import Any

import redis

from app.core.config import settings

_redis: redis.Redis[bytes] = redis.from_url(settings.redis_url, decode_responses=False)


def cache_get(key: str) -> bytes | None:
    return _redis.get(key)


def cache_set(key: str, value: str | bytes, ttl: int = 30) -> None:
    _redis.set(key, value, ex=ttl)


def cache_delete(key: str) -> None:
    _redis.delete(key)


def cache_delete_pattern(pattern: str) -> None:
    cursor: Any = "0"
    while cursor:
        cursor, keys = _redis.scan(cursor=int(cursor), match=pattern, count=100)
        if keys:
            _redis.delete(*keys)
