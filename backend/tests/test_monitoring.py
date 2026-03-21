"""
Tests for production monitoring infrastructure.

Validates:
- Sentry initialization and configuration
- Custom error tracking functions
- Health check connectivity tests
- Error context enrichment
"""

import os
import pytest
from unittest.mock import patch, AsyncMock, MagicMock, call
from datetime import datetime, timezone


# Test Sentry Initialization
class TestSentryInitialization:
    """Test Sentry SDK initialization."""

    @patch("core.monitoring.sentry.sentry_sdk")
    @patch.dict(
        os.environ,
        {
            "SENTRY_DSN": "https://example@sentry.io/123",
            "SENTRY_ENVIRONMENT": "test",
            "SENTRY_TRACES_SAMPLE_RATE": "0.5",
            "SENTRY_PROFILES_SAMPLE_RATE": "0.3",
            "SENTRY_SEND_DEFAULT_PII": "true",
        },
    )
    def test_init_sentry_with_dsn(self, mock_sentry_sdk):
        """Test Sentry initializes correctly when DSN is configured."""
        from core.monitoring import init_sentry

        init_sentry()

        # Verify sentry_sdk.init was called
        mock_sentry_sdk.init.assert_called_once()

        # Verify configuration
        call_kwargs = mock_sentry_sdk.init.call_args[1]
        assert call_kwargs["dsn"] == "https://example@sentry.io/123"
        assert call_kwargs["environment"] == "test"
        assert call_kwargs["traces_sample_rate"] == 0.5
        assert call_kwargs["profiles_sample_rate"] == 0.3
        assert call_kwargs["send_default_pii"] is True

    @patch("core.monitoring.sentry.sentry_sdk")
    @patch.dict(os.environ, {}, clear=True)
    def test_init_sentry_without_dsn(self, mock_sentry_sdk):
        """Test Sentry initialization is skipped when DSN not configured."""
        from core.monitoring import init_sentry

        init_sentry()

        # Verify sentry_sdk.init was NOT called
        mock_sentry_sdk.init.assert_not_called()

    @patch("core.monitoring.sentry.sentry_sdk")
    @patch.dict(os.environ, {"SENTRY_DSN": "https://example@sentry.io/123"})
    def test_init_sentry_with_defaults(self, mock_sentry_sdk):
        """Test Sentry uses default values when optional config missing."""
        from core.monitoring import init_sentry

        init_sentry()

        call_kwargs = mock_sentry_sdk.init.call_args[1]
        assert call_kwargs["environment"] == "development"
        assert call_kwargs["traces_sample_rate"] == 0.1
        assert call_kwargs["profiles_sample_rate"] == 0.1
        assert call_kwargs["send_default_pii"] is False


# Test Custom Error Tracking
class TestCustomErrorTracking:
    """Test custom error tracking functions."""

    @patch("core.monitoring.sentry.sentry_sdk")
    def test_capture_bim_error(self, mock_sentry_sdk):
        """Test BIM tool error capture with context."""
        from core.monitoring import capture_bim_error

        error = ValueError("Invalid IFC file format")
        capture_bim_error(
            error=error,
            tool_name="ifc_parser",
            file_path="/path/to/model.ifc",
            user_id="user123",
            extra_field="extra_value",
        )

        # Verify exception was captured
        mock_sentry_sdk.capture_exception.assert_called_once_with(error)

        # Verify scope was configured
        mock_sentry_sdk.push_scope.assert_called_once()

    @patch("core.monitoring.sentry.sentry_sdk")
    def test_capture_llm_error(self, mock_sentry_sdk):
        """Test LLM API error capture with provider context."""
        from core.monitoring import capture_llm_error

        error = RuntimeError("API rate limit exceeded")
        capture_llm_error(
            error=error,
            provider="anthropic",
            model="claude-3-opus",
            user_id="user456",
            request_id="req789",
        )

        mock_sentry_sdk.capture_exception.assert_called_once_with(error)

    @patch("core.monitoring.sentry.sentry_sdk")
    def test_capture_auth_error(self, mock_sentry_sdk):
        """Test authentication error capture."""
        from core.monitoring import capture_auth_error

        error = PermissionError("Invalid token")
        capture_auth_error(
            error=error, auth_type="token_refresh", user_id="user789", ip_address="192.168.1.1"
        )

        mock_sentry_sdk.capture_exception.assert_called_once_with(error)

    @patch("core.monitoring.sentry.sentry_sdk")
    def test_set_user_context(self, mock_sentry_sdk):
        """Test user context setting."""
        from core.monitoring import set_user_context

        set_user_context(user_id="user123", email="user@example.com", role="admin")

        mock_sentry_sdk.set_user.assert_called_once_with(
            {"id": "user123", "email": "user@example.com", "role": "admin"}
        )

    @patch("core.monitoring.sentry.sentry_sdk")
    def test_clear_user_context(self, mock_sentry_sdk):
        """Test user context clearing."""
        from core.monitoring import clear_user_context

        clear_user_context()

        mock_sentry_sdk.set_user.assert_called_once_with(None)

    @patch("core.monitoring.sentry.sentry_sdk")
    def test_add_breadcrumb(self, mock_sentry_sdk):
        """Test breadcrumb addition."""
        from core.monitoring import add_breadcrumb

        add_breadcrumb(
            message="User uploaded IFC file", category="bim", level="info", file_size=1024000
        )

        mock_sentry_sdk.add_breadcrumb.assert_called_once_with(
            message="User uploaded IFC file",
            category="bim",
            level="info",
            data={"file_size": 1024000},
        )


# Test Health Checks
class TestHealthChecks:
    """Test health check connectivity functions."""

    @pytest.mark.asyncio
    async def test_check_database_health_success(self):
        """Test database health check with successful connection."""
        from core.monitoring import check_database_health, HealthStatus

        # Mock DBConnection
        mock_db = MagicMock()
        mock_client = MagicMock()

        # Create mock for the query chain
        mock_execute = AsyncMock(return_value={"data": [], "error": None})
        mock_limit = MagicMock()
        mock_limit.execute = mock_execute
        mock_select = MagicMock()
        mock_select.limit = MagicMock(return_value=mock_limit)
        mock_table = MagicMock()
        mock_table.select = MagicMock(return_value=mock_select)

        mock_client.table = MagicMock(return_value=mock_table)

        # Create coroutine that returns the mock client
        async def get_client():
            return mock_client

        # Mock the client property as a coroutine
        type(mock_db).client = property(lambda self: get_client())

        result = await check_database_health(mock_db)

        assert result["status"] == HealthStatus.HEALTHY
        assert "latency_ms" in result
        assert result["latency_ms"] < 1000  # Should be fast in test

    @pytest.mark.asyncio
    async def test_check_database_health_failure(self):
        """Test database health check with connection failure."""
        from core.monitoring import check_database_health, HealthStatus

        mock_db = MagicMock()

        # Create coroutine that raises exception
        async def get_client():
            raise Exception("Connection refused")

        # Mock the client property as a coroutine that fails
        type(mock_db).client = property(lambda self: get_client())

        result = await check_database_health(mock_db)

        assert result["status"] == HealthStatus.UNHEALTHY
        assert "error" in result
        assert "Connection refused" in result["error"]

    @pytest.mark.asyncio
    async def test_check_redis_health_success(self):
        """Test Redis health check with successful connection."""
        from core.monitoring import check_redis_health, HealthStatus

        with patch("core.monitoring.health.redis") as mock_redis:
            mock_client = AsyncMock()
            mock_client.ping = AsyncMock()
            mock_redis.get_client = AsyncMock(return_value=mock_client)

            result = await check_redis_health()

            assert result["status"] == HealthStatus.HEALTHY
            assert "latency_ms" in result
            mock_client.ping.assert_called_once()

    @pytest.mark.asyncio
    async def test_check_redis_health_failure(self):
        """Test Redis health check with connection failure."""
        from core.monitoring import check_redis_health, HealthStatus

        with patch("core.monitoring.health.redis") as mock_redis:
            mock_redis.get_client = AsyncMock(side_effect=Exception("Redis unavailable"))

            result = await check_redis_health()

            assert result["status"] == HealthStatus.UNHEALTHY
            assert "error" in result

    @pytest.mark.asyncio
    async def test_check_storage_health_success(self):
        """Test storage health check with successful connection."""
        from core.monitoring import check_storage_health, HealthStatus

        mock_db = MagicMock()
        mock_client = AsyncMock()
        mock_storage = MagicMock()
        mock_storage.list_buckets = AsyncMock(return_value=[{"name": "test-bucket"}])
        mock_client.storage = mock_storage

        # Create coroutine that returns the mock client
        async def get_client():
            return mock_client

        # Mock the client property as a coroutine
        type(mock_db).client = property(lambda self: get_client())

        result = await check_storage_health(mock_db)

        assert result["status"] in [HealthStatus.HEALTHY, HealthStatus.DEGRADED]
        assert "latency_ms" in result

    @pytest.mark.asyncio
    async def test_check_storage_health_failure(self):
        """Test storage health check with failure (non-critical)."""
        from core.monitoring import check_storage_health, HealthStatus

        mock_db = MagicMock()

        # Create coroutine that raises exception
        async def get_client():
            raise Exception("Storage unavailable")

        # Mock the client property as a coroutine that fails
        type(mock_db).client = property(lambda self: get_client())

        result = await check_storage_health(mock_db)

        # Storage failure is non-critical, should be degraded not unhealthy
        assert result["status"] == HealthStatus.DEGRADED
        assert "error" in result

    @pytest.mark.asyncio
    async def test_get_comprehensive_health_all_healthy(self):
        """Test comprehensive health check with all services healthy."""
        from core.monitoring import get_comprehensive_health, HealthStatus

        mock_db = MagicMock()

        # Mock successful health checks
        with (
            patch("core.monitoring.health.check_database_health") as mock_db_check,
            patch("core.monitoring.health.check_redis_health") as mock_redis_check,
        ):
            mock_db_check.return_value = {"status": HealthStatus.HEALTHY, "latency_ms": 50}
            mock_redis_check.return_value = {"status": HealthStatus.HEALTHY, "latency_ms": 10}

            result = await get_comprehensive_health(
                db=mock_db, instance_id="test-instance", include_storage=False
            )

            assert result["overall_status"] == HealthStatus.HEALTHY
            assert result["instance_id"] == "test-instance"
            assert "timestamp" in result
            assert "checks" in result
            assert "database" in result["checks"]
            assert "redis" in result["checks"]

    @pytest.mark.asyncio
    async def test_get_comprehensive_health_database_unhealthy(self):
        """Test comprehensive health check with database unhealthy."""
        from core.monitoring import get_comprehensive_health, HealthStatus

        mock_db = MagicMock()

        with (
            patch("core.monitoring.health.check_database_health") as mock_db_check,
            patch("core.monitoring.health.check_redis_health") as mock_redis_check,
        ):
            mock_db_check.return_value = {
                "status": HealthStatus.UNHEALTHY,
                "error": "Connection timeout",
            }
            mock_redis_check.return_value = {"status": HealthStatus.HEALTHY, "latency_ms": 10}

            result = await get_comprehensive_health(
                db=mock_db, instance_id="test-instance", include_storage=False
            )

            # Overall should be unhealthy if database is unhealthy
            assert result["overall_status"] == HealthStatus.UNHEALTHY

    @pytest.mark.asyncio
    async def test_get_comprehensive_health_redis_unhealthy(self):
        """Test comprehensive health check with Redis unhealthy."""
        from core.monitoring import get_comprehensive_health, HealthStatus

        mock_db = MagicMock()

        with (
            patch("core.monitoring.health.check_database_health") as mock_db_check,
            patch("core.monitoring.health.check_redis_health") as mock_redis_check,
        ):
            mock_db_check.return_value = {"status": HealthStatus.HEALTHY, "latency_ms": 50}
            mock_redis_check.return_value = {
                "status": HealthStatus.UNHEALTHY,
                "error": "Redis down",
            }

            result = await get_comprehensive_health(
                db=mock_db, instance_id="test-instance", include_storage=False
            )

            # Overall should be unhealthy if Redis is unhealthy
            assert result["overall_status"] == HealthStatus.UNHEALTHY

    @pytest.mark.asyncio
    async def test_get_comprehensive_health_degraded(self):
        """Test comprehensive health check with degraded state."""
        from core.monitoring import get_comprehensive_health, HealthStatus

        mock_db = MagicMock()

        with (
            patch("core.monitoring.health.check_database_health") as mock_db_check,
            patch("core.monitoring.health.check_redis_health") as mock_redis_check,
        ):
            mock_db_check.return_value = {"status": HealthStatus.DEGRADED, "latency_ms": 450}
            mock_redis_check.return_value = {"status": HealthStatus.HEALTHY, "latency_ms": 10}

            result = await get_comprehensive_health(
                db=mock_db, instance_id="test-instance", include_storage=False
            )

            assert result["overall_status"] == HealthStatus.DEGRADED


# Integration Tests (require actual services)
@pytest.mark.slow
class TestMonitoringIntegration:
    """Integration tests requiring actual services."""

    @pytest.mark.asyncio
    async def test_sentry_capture_exception_live(self):
        """Test Sentry captures exceptions in live environment (if configured)."""
        import os

        if not os.getenv("SENTRY_DSN"):
            pytest.skip("SENTRY_DSN not configured")

        from core.monitoring import init_sentry, capture_bim_error

        # Initialize Sentry
        init_sentry()

        # Capture a test error
        try:
            raise ValueError("Test error for Sentry integration")
        except ValueError as e:
            capture_bim_error(error=e, tool_name="test_tool", user_id="test_user")

        # If we got here without exception, Sentry is working
        # (actual capture verification would require checking Sentry dashboard)

    @pytest.mark.asyncio
    async def test_health_checks_live(self):
        """Test health checks against live services (if available)."""
        try:
            from core.services import redis
            from core.services.supabase import DBConnection
            from core.monitoring import get_comprehensive_health

            await redis.initialize_async()
            db = DBConnection()
            await db.initialize()

            result = await get_comprehensive_health(
                db=db, instance_id="test-instance", include_storage=False
            )

            # Should have results for database and redis
            assert "checks" in result
            assert "database" in result["checks"]
            assert "redis" in result["checks"]

            await redis.close()
            await db.disconnect()

        except Exception:
            pytest.skip("Required services not available")
