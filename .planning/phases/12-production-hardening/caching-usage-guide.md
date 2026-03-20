# Redis Caching Usage Guide

## Overview

Task 7 created the caching infrastructure. This guide shows how to apply caching to specific tools.

---

## How to Add Caching to Carbon Tool

### Step 1: Import Caching Utilities

Add to `backend/core/tools/bim/carbon_tool.py`:

```python
from core.utils.caching import cache_result, hash_file
```

### Step 2: Create Cacheable Wrapper

Add this method to `CarbonCalculationTool` class:

```python
@cache_result(ttl=3600, key_prefix="carbon")
async def _compute_carbon_cached(
    self,
    file_hash: str,  # Use file hash instead of path
    include_breakdown: bool,
    lifecycle_stage: str,
) -> dict:
    """Internal method that performs the actual computation (cacheable)."""
    # Move all computation logic here from calculate_carbon()
    # This method returns a plain dict (JSON-serializable)

    content = await self.load_ifc_content(file_path)  # Note: need file_path
    ifc_model = await self.open_ifc_model(content)

    # ... rest of calculation logic ...

    return result  # Return dict, not ToolResult
```

### Step 3: Update calculate_carbon Method

```python
async def calculate_carbon(
    self,
    file_path: str,
    include_breakdown: bool = True,
    lifecycle_stage: str = "a1_a3",
) -> ToolResult:
    try:
        if not HAS_IFC:
            return self.success_response(self._mock_carbon_result())

        # Generate file hash for cache key
        file_hash = await hash_file(file_path)

        # Call cached computation
        result = await self._compute_carbon_cached(
            file_hash=file_hash,
            file_path=file_path,  # Still need path for loading
            include_breakdown=include_breakdown,
            lifecycle_stage=lifecycle_stage,
        )

        return self.success_response(result)
    except Exception as e:
        logger.error(f"calculate_carbon error: {e}")
        return self.fail_response(f"Carbon calculation failed: {e}")
```

### Alternative: Simple Cache Key from Arguments

If file hashing is too slow, use argument-based caching:

```python
@cache_result(ttl=3600, key_prefix="carbon")
async def calculate_carbon(
    self,
    file_path: str,
    include_breakdown: bool = True,
    lifecycle_stage: str = "a1_a3",
) -> dict:  # Note: return dict, not ToolResult
    # Computation logic here
    return result
```

Then wrap the cached method:

```python
async def calculate_carbon_tool(self, file_path: str, ...) -> ToolResult:
    result = await self.calculate_carbon(file_path, ...)
    return self.success_response(result)
```

---

## How to Add Caching to IFC Parser

### For async_ifc_parser.py

```python
from core.utils.caching import cache_result, hash_file
import json

@cache_result(ttl=86400, key_prefix="ifc_model")
async def parse_ifc_cached(file_path: str) -> dict:
    """
    Parse IFC file and return serializable model data.

    Returns:
        dict with parsed model structure (elements, properties, relationships)
    """
    file_hash = await hash_file(file_path)

    # Perform actual IFC parsing
    ifc_file = ifcopenshell.open(file_path)

    # Extract model data into JSON-serializable format
    model_data = {
        "elements": [],
        "properties": {},
        "relationships": [],
    }

    for element in ifc_file.by_type("IfcProduct"):
        model_data["elements"].append({
            "id": element.id(),
            "type": element.is_a(),
            # ... other properties
        })

    return model_data
```

### Considerations for IFC Caching

**Size**: IFC models can be large. Consider:
- Only caching essential data (not entire model)
- Compress data before caching (`gzip` module)
- Skip caching for files >10MB

```python
import gzip
import json

@cache_result(ttl=86400, key_prefix="ifc_model")
async def parse_ifc_cached(file_path: str) -> str:
    # Parse IFC
    model_data = extract_model_data(ifc_file)

    # Compress for caching
    json_str = json.dumps(model_data)
    compressed = gzip.compress(json_str.encode())

    # Redis will store compressed data
    return compressed.decode('latin1')  # Store as string

# When retrieving:
def decompress_cached_model(cached_data: str) -> dict:
    compressed = cached_data.encode('latin1')
    json_str = gzip.decompress(compressed).decode()
    return json.loads(json_str)
```

---

## Cache Invalidation

### Manual Invalidation

```python
from core.utils.caching import invalidate_cache

# Invalidate all carbon calculations
await invalidate_cache("carbon:*")

# Invalidate specific file
file_hash = await hash_file(file_path)
await invalidate_cache(f"carbon:*{file_hash}*")
```

### Auto-Invalidation on File Update

```python
async def update_ifc_file(file_path: str, new_content: bytes):
    # Save new content
    with open(file_path, 'wb') as f:
        f.write(new_content)

    # Invalidate cache for this file
    file_hash = await hash_file(file_path)
    await invalidate_cache(f"ifc_model:*{file_hash}*")
    await invalidate_cache(f"carbon:*{file_hash}*")
```

---

## Cache Monitoring

### Get Cache Statistics

```python
from core.utils.caching import get_cache_stats

stats = get_cache_stats()
# Returns:
# {
#     "hits": 85,
#     "misses": 15,
#     "errors": 0,
#     "total_requests": 100,
#     "hit_rate_percent": 85.0,
#     "uptime_seconds": 3600.0
# }
```

### Add to Health Check

In `backend/core/api/health.py`:

```python
from core.utils.caching import get_cache_stats

@router.get("/health")
async def health_check():
    cache_stats = get_cache_stats()

    return {
        "status": "healthy",
        "cache": {
            "enabled": True,
            "hit_rate": cache_stats["hit_rate_percent"],
            "total_requests": cache_stats["total_requests"],
        },
        # ... other health checks
    }
```

---

## Admin Endpoints (To Be Implemented)

### Recommended Admin Routes

In `backend/core/api/admin.py`:

```python
from core.utils.caching import invalidate_cache, get_cache_stats
from core.utils.auth import require_admin  # Your auth decorator

@router.post("/admin/cache/invalidate")
@require_admin
async def invalidate_cache_pattern(pattern: str):
    """Invalidate cache entries matching pattern."""
    count = await invalidate_cache(pattern)
    return {"invalidated_keys": count, "pattern": pattern}

@router.get("/admin/cache/stats")
@require_admin
async def cache_stats():
    """Get cache performance statistics."""
    return get_cache_stats()

@router.delete("/admin/cache/clear")
@require_admin
async def clear_all_cache():
    """Clear all cache (use with caution)."""
    count = await invalidate_cache("*")
    return {"message": f"Cleared {count} cache entries"}
```

---

## Environment Variables

Add to `backend/.env.example`:

```bash
# Cache Configuration
CACHE_ENABLED=true                    # Enable/disable caching
CACHE_DEFAULT_TTL=3600                # Default TTL (1 hour)
CACHE_CARBON_TTL=3600                 # Carbon calculation TTL
CACHE_IFC_TTL=86400                   # IFC parsing TTL (24 hours)
CACHE_MAX_SIZE_MB=1024                # Max Redis memory (1GB)
```

---

## Testing Cached Functions

### Unit Test Example

```python
import pytest
from unittest.mock import patch, AsyncMock
from core.utils.caching import cache_result

@pytest.mark.asyncio
async def test_cached_function():
    call_count = 0

    @cache_result(ttl=3600, key_prefix="test")
    async def expensive_function(arg):
        nonlocal call_count
        call_count += 1
        return {"result": arg * 2}

    # Mock cache manager
    with patch("core.utils.caching.get_cache_manager") as mock_manager:
        mock_manager.return_value.get.return_value = None  # Cache miss
        mock_manager.return_value.set.return_value = True

        # First call
        result1 = await expensive_function(5)
        assert result1 == {"result": 10}
        assert call_count == 1
```

### Integration Test Example

```python
@pytest.mark.slow
@pytest.mark.asyncio
async def test_carbon_caching_e2e():
    """Test carbon calculation caching end-to-end."""
    from core.tools.bim.carbon_tool import CarbonCalculationTool

    tool = CarbonCalculationTool()

    # First calculation (cache miss)
    start = time.time()
    result1 = await tool.calculate_carbon("test.ifc")
    time1 = time.time() - start

    # Second calculation (cache hit)
    start = time.time()
    result2 = await tool.calculate_carbon("test.ifc")
    time2 = time.time() - start

    # Verify results identical
    assert result1 == result2

    # Verify cache hit is faster (>50% improvement)
    assert time2 < time1 * 0.5
```

---

## Performance Monitoring

### Log Cache Performance

```python
import time
from core.utils.logger import logger

@cache_result(ttl=3600, key_prefix="carbon")
async def calculate_carbon_with_logging(file_path: str):
    start = time.time()
    result = await _actual_calculation(file_path)
    duration = time.time() - start

    logger.info(
        "Carbon calculation completed",
        extra={
            "duration_ms": int(duration * 1000),
            "file_path": file_path,
            "total_co2": result.get("total_co2"),
        }
    )

    return result
```

### Expected Performance

| Operation | Before Cache | After Cache (Hit) | Improvement |
|-----------|-------------|-------------------|-------------|
| Carbon calculation | 2-5s | <50ms | >95% |
| IFC parsing | 1-3s | <50ms | >95% |
| Repeated requests | Same | <50ms | >95% |

### Cache Hit Rate Targets

- **Development**: >50% (developers repeatedly testing same files)
- **Production**: >70% (users analyzing same buildings multiple times)
- **Optimal**: >85% (indicates effective caching strategy)

---

## Troubleshooting

### Cache Not Working

1. **Check Redis connection**:
   ```bash
   redis-cli ping  # Should return PONG
   ```

2. **Check cache enabled**:
   ```python
   from core.config.suna_config import CACHE_CONFIG
   print(CACHE_CONFIG["enabled"])  # Should be True
   ```

3. **Check logs for errors**:
   ```bash
   grep "Cache" logs/backend.log
   ```

### Cache Hit Rate Low

Possible causes:
- TTL too short (increase TTL)
- Files changing frequently (expected)
- Cache keys not stable (check key generation)
- Redis memory full (check `maxmemory` policy)

### Memory Issues

If Redis memory grows too large:

1. **Check memory usage**:
   ```bash
   redis-cli info memory
   ```

2. **Adjust TTLs** (shorter TTLs for less critical data)

3. **Configure maxmemory policy**:
   ```bash
   redis-cli CONFIG SET maxmemory-policy allkeys-lru
   redis-cli CONFIG SET maxmemory 1gb
   ```

---

## Next Steps

1. **Apply caching to carbon tool** (15 minutes)
2. **Apply caching to IFC parser** (15 minutes)
3. **Add admin endpoints** (10 minutes)
4. **Monitor cache hit rate** in production
5. **Adjust TTLs** based on actual usage patterns
