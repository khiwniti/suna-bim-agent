"""
Tests for Redis-based caching utility.

Validates caching decorator, key generation, TTL, invalidation, and graceful degradation.
"""

import asyncio
import json
import pytest
import time
from unittest.mock import AsyncMock, MagicMock, patch

from core.utils.caching import (
    CacheManager,
    cache_result,
    generate_cache_key,
    get_cache_manager,
    invalidate_cache,
    get_cache_stats,
    hash_file,
)


# Test fixtures
@pytest.fixture
async def cache_manager():
    """Create a cache manager for testing."""
    # Cache manager will use the redis module which we'll mock in tests
    manager = CacheManager()
    return manager


# Unit Tests
class TestCacheKeyGeneration:
    """Test cache key generation from function arguments."""

    def test_same_args_same_key(self):
        """Same arguments should generate same cache key."""
        key1 = generate_cache_key("test", "arg1", "arg2", foo="bar")
        key2 = generate_cache_key("test", "arg1", "arg2", foo="bar")
        assert key1 == key2

    def test_different_args_different_keys(self):
        """Different arguments should generate different keys."""
        key1 = generate_cache_key("test", "arg1")
        key2 = generate_cache_key("test", "arg2")
        assert key1 != key2

    def test_kwargs_order_stable(self):
        """Kwargs in different order should produce same key."""
        key1 = generate_cache_key("test", foo="bar", baz="qux")
        key2 = generate_cache_key("test", baz="qux", foo="bar")
        assert key1 == key2

    def test_prefix_in_key(self):
        """Cache key should include prefix."""
        key = generate_cache_key("carbon", "file.ifc")
        assert key.startswith("carbon:")


class TestCacheManager:
    """Test CacheManager operations."""

    @pytest.mark.asyncio
    async def test_cache_get_hit(self, cache_manager):
        """Test cache hit returns cached value."""
        with patch("core.utils.caching.redis_module.get", new=AsyncMock(return_value=b'"cached_value"')):
            result = await cache_manager.get("test_key")

            assert result == '"cached_value"'
            assert cache_manager._hits == 1
            assert cache_manager._misses == 0

    @pytest.mark.asyncio
    async def test_cache_get_miss(self, cache_manager):
        """Test cache miss returns None."""
        with patch("core.utils.caching.redis_module.get", new=AsyncMock(return_value=None)):
            result = await cache_manager.get("test_key")

            assert result is None
            assert cache_manager._hits == 0
            assert cache_manager._misses == 1

    @pytest.mark.asyncio
    async def test_cache_set_with_ttl(self, cache_manager):
        """Test setting cache value with TTL."""
        with patch("core.utils.caching.redis_module.setex", new=AsyncMock()) as mock_setex:
            await cache_manager.set("test_key", "test_value", ttl=3600)

            mock_setex.assert_called_once_with("test_key", 3600, "test_value")

    @pytest.mark.asyncio
    async def test_cache_set_without_ttl(self, cache_manager):
        """Test setting cache value without TTL."""
        with patch("core.utils.caching.redis_module.set", new=AsyncMock()) as mock_set:
            await cache_manager.set("test_key", "test_value")

            mock_set.assert_called_once_with("test_key", "test_value")

    @pytest.mark.asyncio
    async def test_cache_delete(self, cache_manager):
        """Test deleting cache entry."""
        with patch("core.utils.caching.redis_module.delete", new=AsyncMock(return_value=1)):
            result = await cache_manager.delete("test_key")

            assert result is True

    @pytest.mark.asyncio
    async def test_cache_graceful_degradation_on_error(self, cache_manager):
        """Test graceful handling of Redis errors."""
        with patch("core.utils.caching.redis_module.get", new=AsyncMock(side_effect=Exception("Redis down"))):
            result = await cache_manager.get("test_key")

            assert result is None
            assert cache_manager._errors == 1

    def test_cache_stats(self, cache_manager):
        """Test cache statistics tracking."""
        cache_manager._hits = 8
        cache_manager._misses = 2
        cache_manager._errors = 1

        stats = cache_manager.get_stats()

        assert stats["hits"] == 8
        assert stats["misses"] == 2
        assert stats["errors"] == 1
        assert stats["total_requests"] == 10
        assert stats["hit_rate_percent"] == 80.0


class TestCacheDecorator:
    """Test @cache_result decorator."""

    @pytest.mark.asyncio
    async def test_decorator_caches_result(self):
        """Test decorator caches function result on first call."""
        call_count = 0

        @cache_result(ttl=3600, key_prefix="test", enabled=True)
        async def expensive_function(arg):
            nonlocal call_count
            call_count += 1
            return {"result": arg * 2}

        # Mock the cache manager
        with patch("core.utils.caching.get_cache_manager") as mock_get_manager:
            mock_manager = AsyncMock()
            mock_manager.get.return_value = None  # Cache miss
            mock_manager.set.return_value = True
            mock_get_manager.return_value = mock_manager

            result = await expensive_function(5)

            assert result == {"result": 10}
            assert call_count == 1
            # Verify cache was set
            mock_manager.set.assert_called_once()

    @pytest.mark.asyncio
    async def test_decorator_returns_cached_value(self):
        """Test decorator returns cached value on second call."""
        call_count = 0

        @cache_result(ttl=3600, key_prefix="test")
        async def expensive_function(arg):
            nonlocal call_count
            call_count += 1
            return {"result": arg * 2}

        # Mock the cache manager
        with patch("core.utils.caching.get_cache_manager") as mock_get_manager:
            mock_manager = AsyncMock()
            # First call: cache miss
            # Second call: cache hit
            mock_manager.get.side_effect = [
                None,  # First call: miss
                json.dumps({"result": 10}),  # Second call: hit
            ]
            mock_manager.set.return_value = True
            mock_get_manager.return_value = mock_manager

            # First call
            result1 = await expensive_function(5)
            assert result1 == {"result": 10}
            assert call_count == 1

            # Second call (should use cache)
            result2 = await expensive_function(5)
            assert result2 == {"result": 10}
            assert call_count == 1  # Function not called again

    @pytest.mark.asyncio
    async def test_decorator_disabled(self):
        """Test decorator bypasses cache when disabled."""
        call_count = 0

        @cache_result(ttl=3600, key_prefix="test", enabled=False)
        async def expensive_function(arg):
            nonlocal call_count
            call_count += 1
            return {"result": arg * 2}

        result1 = await expensive_function(5)
        result2 = await expensive_function(5)

        assert result1 == {"result": 10}
        assert result2 == {"result": 10}
        assert call_count == 2  # Function called both times


class TestCacheInvalidation:
    """Test cache invalidation."""

    @pytest.mark.asyncio
    async def test_invalidate_pattern(self):
        """Test invalidating cache entries by pattern."""
        with patch("core.utils.caching.get_cache_manager") as mock_get_manager:
            mock_manager = AsyncMock()
            mock_manager.invalidate_pattern.return_value = 2
            mock_get_manager.return_value = mock_manager

            count = await invalidate_cache("carbon:*")

            assert count == 2
            mock_manager.invalidate_pattern.assert_called_once_with("carbon:*")


class TestFileHashing:
    """Test file content hashing."""

    @pytest.mark.asyncio
    async def test_hash_file_same_content_same_hash(self, tmp_path):
        """Same file content produces same hash."""
        file1 = tmp_path / "test1.txt"
        file2 = tmp_path / "test2.txt"

        content = "test content"
        file1.write_text(content)
        file2.write_text(content)

        hash1 = await hash_file(file1)
        hash2 = await hash_file(file2)

        assert hash1 == hash2

    @pytest.mark.asyncio
    async def test_hash_file_different_content_different_hash(self, tmp_path):
        """Different file content produces different hash."""
        file1 = tmp_path / "test1.txt"
        file2 = tmp_path / "test2.txt"

        file1.write_text("content A")
        file2.write_text("content B")

        hash1 = await hash_file(file1)
        hash2 = await hash_file(file2)

        assert hash1 != hash2

    @pytest.mark.asyncio
    async def test_hash_file_not_found(self):
        """Test hashing non-existent file raises error."""
        with pytest.raises(FileNotFoundError):
            await hash_file("/nonexistent/file.txt")


# Integration Tests
@pytest.mark.slow
class TestCachingIntegration:
    """Integration tests requiring actual Redis (slow tests)."""

    @pytest.mark.asyncio
    async def test_full_cache_workflow(self):
        """Test complete cache workflow with real Redis."""
        # This test requires Redis to be running
        # Skip if Redis not available
        try:
            from core.services import redis as redis_module

            await redis_module.get_client()  # Test connection
        except Exception:
            pytest.skip("Redis not available")

        # Create a cacheable function
        call_count = 0

        @cache_result(ttl=2, key_prefix="integration_test")
        async def test_function(value):
            nonlocal call_count
            call_count += 1
            return {"computed": value * 2}

        # First call - cache miss
        result1 = await test_function(5)
        assert result1 == {"computed": 10}
        assert call_count == 1

        # Second call - cache hit
        result2 = await test_function(5)
        assert result2 == {"computed": 10}
        assert call_count == 1  # Not computed again

        # Wait for TTL expiration
        await asyncio.sleep(3)

        # Third call - cache expired, recompute
        result3 = await test_function(5)
        assert result3 == {"computed": 10}
        assert call_count == 2  # Computed again

        # Clean up
        await invalidate_cache("integration_test:*")
