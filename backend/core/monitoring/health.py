"""
Enhanced health check endpoint with connectivity verification.

Provides detailed health status for all critical dependencies:
- Database (Supabase Postgres)
- Redis cache
- Supabase storage (optional)
"""

from datetime import datetime, timezone
from typing import Dict, Any
from core.utils.logger import logger
from core.services import redis
from core.services.supabase import DBConnection


class HealthStatus:
    """Health status constants."""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


async def check_database_health(db: DBConnection) -> Dict[str, Any]:
    """
    Check database connectivity and responsiveness.

    Args:
        db: Database connection instance

    Returns:
        Health status dictionary with:
        - status: healthy/degraded/unhealthy
        - latency_ms: Query latency in milliseconds
        - error: Error message if unhealthy
    """
    try:
        import time

        start = time.time()

        # Execute simple query to verify connectivity
        client = await db.client
        await client.table("threads").select("thread_id").limit(1).execute()

        latency_ms = (time.time() - start) * 1000

        # Determine health status based on latency
        if latency_ms < 100:
            status = HealthStatus.HEALTHY
        elif latency_ms < 500:
            status = HealthStatus.DEGRADED
        else:
            status = HealthStatus.UNHEALTHY

        return {
            "status": status,
            "latency_ms": round(latency_ms, 2),
        }

    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": HealthStatus.UNHEALTHY,
            "error": str(e),
        }


async def check_redis_health() -> Dict[str, Any]:
    """
    Check Redis connectivity and responsiveness.

    Returns:
        Health status dictionary with:
        - status: healthy/degraded/unhealthy
        - latency_ms: Ping latency in milliseconds
        - error: Error message if unhealthy
    """
    try:
        import time

        start = time.time()

        # Ping Redis to verify connectivity
        client = await redis.get_client()
        await client.ping()

        latency_ms = (time.time() - start) * 1000

        # Determine health status based on latency
        if latency_ms < 50:
            status = HealthStatus.HEALTHY
        elif latency_ms < 200:
            status = HealthStatus.DEGRADED
        else:
            status = HealthStatus.UNHEALTHY

        return {
            "status": status,
            "latency_ms": round(latency_ms, 2),
        }

    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        return {
            "status": HealthStatus.UNHEALTHY,
            "error": str(e),
        }


async def check_storage_health(db: DBConnection) -> Dict[str, Any]:
    """
    Check Supabase storage connectivity (optional).

    Args:
        db: Database connection instance

    Returns:
        Health status dictionary with:
        - status: healthy/degraded/unhealthy
        - error: Error message if unhealthy
    """
    try:
        import time

        start = time.time()

        # List buckets to verify storage connectivity
        client = await db.client
        buckets = await client.storage.list_buckets()

        latency_ms = (time.time() - start) * 1000

        # Storage check is optional - degraded if slow, healthy otherwise
        if latency_ms < 200:
            status = HealthStatus.HEALTHY
        elif latency_ms < 1000:
            status = HealthStatus.DEGRADED
        else:
            status = HealthStatus.UNHEALTHY

        return {
            "status": status,
            "latency_ms": round(latency_ms, 2),
            "buckets_count": len(buckets) if buckets else 0,
        }

    except Exception as e:
        logger.warning(f"Storage health check failed (non-critical): {e}")
        # Storage failure is non-critical
        return {
            "status": HealthStatus.DEGRADED,
            "error": str(e),
        }


async def get_comprehensive_health(
    db: DBConnection,
    instance_id: str,
    include_storage: bool = False,
) -> Dict[str, Any]:
    """
    Get comprehensive health status for all dependencies.

    Args:
        db: Database connection instance
        instance_id: Instance identifier
        include_storage: Whether to check storage health (optional, slower)

    Returns:
        Complete health status with:
        - overall_status: healthy/degraded/unhealthy
        - timestamp: ISO 8601 timestamp
        - instance_id: Instance identifier
        - checks: Detailed check results for each dependency
    """
    # Run all health checks in parallel
    import asyncio

    tasks = {
        "database": check_database_health(db),
        "redis": check_redis_health(),
    }

    if include_storage:
        tasks["storage"] = check_storage_health(db)

    results = await asyncio.gather(*tasks.values(), return_exceptions=True)

    # Map results back to check names
    checks = {}
    for (check_name, _), result in zip(tasks.items(), results):
        if isinstance(result, Exception):
            checks[check_name] = {
                "status": HealthStatus.UNHEALTHY,
                "error": str(result),
            }
        else:
            checks[check_name] = result

    # Determine overall status
    statuses = [check.get("status") for check in checks.values()]

    if all(s == HealthStatus.HEALTHY for s in statuses):
        overall_status = HealthStatus.HEALTHY
    elif any(s == HealthStatus.UNHEALTHY for s in statuses):
        # Critical checks (database, redis) unhealthy = overall unhealthy
        if checks.get("database", {}).get("status") == HealthStatus.UNHEALTHY:
            overall_status = HealthStatus.UNHEALTHY
        elif checks.get("redis", {}).get("status") == HealthStatus.UNHEALTHY:
            overall_status = HealthStatus.UNHEALTHY
        else:
            # Only non-critical checks unhealthy = degraded
            overall_status = HealthStatus.DEGRADED
    else:
        overall_status = HealthStatus.DEGRADED

    return {
        "overall_status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "instance_id": instance_id,
        "checks": checks,
    }
