"""
Redis-based caching utility for expensive computations.

Provides decorator-based caching with automatic key generation,
TTL management, and graceful degradation when Redis is unavailable.
"""

import asyncio
import functools
import hashlib
import json
import time
from pathlib import Path
from typing import Any, Callable, Optional, TypeVar, ParamSpec

from core.services import redis as redis_module
from core.utils.logger import logger

# Type hints for generic decorator
P = ParamSpec("P")
R = TypeVar("R")


class CacheManager:
    """Manages Redis caching operations with metrics tracking."""

    def __init__(self):
        self._hits = 0
        self._misses = 0
        self._errors = 0
        self._start_time = time.time()

    async def get(self, key: str) -> Optional[str]:
        """Get cached value by key."""
        try:
            value = await redis_module.get(key)
            if value:
                self._hits += 1
                logger.debug(f"Cache hit: {key}")
                return value.decode("utf-8") if isinstance(value, bytes) else value
            else:
                self._misses += 1
                logger.debug(f"Cache miss: {key}")
                return None
        except Exception as e:
            self._errors += 1
            logger.warning(f"Cache get error for key '{key}': {e}")
            return None

    async def set(
        self, key: str, value: str, ttl: Optional[int] = None
    ) -> bool:
        """Set cached value with optional TTL."""
        try:
            if ttl:
                await redis_module.setex(key, ttl, value)
            else:
                await redis_module.set(key, value)
            logger.debug(f"Cache set: {key} (TTL: {ttl}s)")
            return True
        except Exception as e:
            self._errors += 1
            logger.warning(f"Cache set error for key '{key}': {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete cached value by key."""
        try:
            result = await redis_module.delete(key)
            logger.debug(f"Cache delete: {key} (deleted: {result})")
            return bool(result)
        except Exception as e:
            self._errors += 1
            logger.warning(f"Cache delete error for key '{key}': {e}")
            return False

    async def invalidate_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern (e.g., 'carbon:*')."""
        try:
            # Use scan_keys from redis module
            keys = await redis_module.scan_keys(pattern)

            if keys:
                deleted = await redis_module.delete_multiple(keys)
                logger.info(f"Cache invalidated pattern '{pattern}': {deleted} keys")
                return deleted
            return 0
        except Exception as e:
            self._errors += 1
            logger.warning(f"Cache invalidate pattern error for '{pattern}': {e}")
            return 0

    def get_stats(self) -> dict:
        """Get cache statistics."""
        total_requests = self._hits + self._misses
        hit_rate = (self._hits / total_requests * 100) if total_requests > 0 else 0
        uptime = time.time() - self._start_time

        return {
            "hits": self._hits,
            "misses": self._misses,
            "errors": self._errors,
            "total_requests": total_requests,
            "hit_rate_percent": round(hit_rate, 2),
            "uptime_seconds": round(uptime, 2),
        }

    def reset_stats(self):
        """Reset cache statistics."""
        self._hits = 0
        self._misses = 0
        self._errors = 0
        self._start_time = time.time()


# Global cache manager instance
_cache_manager: Optional[CacheManager] = None


def get_cache_manager() -> CacheManager:
    """Get or create global cache manager instance."""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = CacheManager()
    return _cache_manager


def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """
    Generate stable cache key from function arguments.

    Args:
        prefix: Cache key prefix (e.g., 'carbon', 'ifc_model')
        *args: Positional arguments
        **kwargs: Keyword arguments

    Returns:
        Cache key like 'prefix:hash'
    """
    # Create stable representation of arguments
    key_parts = [str(arg) for arg in args]

    # Sort kwargs for stable key generation
    for k in sorted(kwargs.keys()):
        key_parts.append(f"{k}={kwargs[k]}")

    # Hash the arguments
    key_data = "|".join(key_parts)
    key_hash = hashlib.sha256(key_data.encode()).hexdigest()[:16]

    return f"{prefix}:{key_hash}"


def cache_result(
    ttl: int = 3600,
    key_prefix: str = "cache",
    enabled: bool = True,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """
    Decorator to cache function results in Redis.

    Args:
        ttl: Time-to-live in seconds (default: 1 hour)
        key_prefix: Cache key prefix for organization
        enabled: Enable/disable caching (useful for testing)

    Example:
        @cache_result(ttl=3600, key_prefix="carbon")
        async def calculate_carbon(file_path: str):
            # Expensive computation
            return result
    """
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            # Skip caching if disabled
            if not enabled:
                return await func(*args, **kwargs)

            cache_manager = get_cache_manager()

            # Generate cache key from function name and arguments
            cache_key = generate_cache_key(
                f"{key_prefix}:{func.__name__}",
                *args,
                **kwargs,
            )

            # Try to get cached result
            cached_value = await cache_manager.get(cache_key)
            if cached_value is not None:
                try:
                    # Deserialize cached result
                    result = json.loads(cached_value)
                    logger.info(
                        f"Cache hit for {func.__name__}",
                        extra={
                            "cache_key": cache_key,
                            "function": func.__name__,
                        },
                    )
                    return result
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to deserialize cached value: {e}")

            # Cache miss - compute result
            logger.info(
                f"Cache miss for {func.__name__}, computing...",
                extra={
                    "cache_key": cache_key,
                    "function": func.__name__,
                },
            )

            result = await func(*args, **kwargs)

            # Cache the result
            try:
                serialized = json.dumps(result)
                await cache_manager.set(cache_key, serialized, ttl=ttl)
                logger.info(
                    f"Cached result for {func.__name__}",
                    extra={
                        "cache_key": cache_key,
                        "ttl": ttl,
                        "size_bytes": len(serialized),
                    },
                )
            except (TypeError, json.JSONEncoder) as e:
                logger.warning(f"Failed to cache result: {e}")

            return result

        return wrapper
    return decorator


async def invalidate_cache(pattern: str) -> int:
    """
    Invalidate cache entries matching pattern.

    Args:
        pattern: Redis key pattern (e.g., 'carbon:*', 'ifc_model:abc123*')

    Returns:
        Number of keys deleted
    """
    cache_manager = get_cache_manager()
    return await cache_manager.invalidate_pattern(pattern)


def get_cache_stats() -> dict:
    """Get cache performance statistics."""
    cache_manager = get_cache_manager()
    return cache_manager.get_stats()


async def hash_file(file_path: str | Path, chunk_size: int = 8192) -> str:
    """
    Generate SHA256 hash of file content.

    Args:
        file_path: Path to file
        chunk_size: Bytes to read at a time (default 8KB)

    Returns:
        Hex digest of file content hash
    """
    hasher = hashlib.sha256()
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    # Read file in chunks for memory efficiency
    with open(path, "rb") as f:
        while chunk := f.read(chunk_size):
            hasher.update(chunk)

    return hasher.hexdigest()
