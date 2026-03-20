# Task 7: Implement Redis Caching — Implementation Spec

## Overview

Add Redis-based caching for expensive computations (carbon calculations, IFC parsing) to improve API performance and reduce redundant processing.

**Priority**: P1 (MEDIUM impact, MEDIUM effort)
**Estimated Time**: 60 minutes

---

## Problem Statement

Current issues:
- **No caching**: Every carbon calculation reprocesses the same IFC file
- **Repeated parsing**: Same IFC files parsed multiple times
- **Slow responses**: Users wait for expensive calculations every time
- **High CPU usage**: Redundant computation wastes resources

**Impact**:
- Poor user experience (slow response times)
- Increased server costs (unnecessary CPU cycles)
- Scalability limitations (can't handle concurrent requests efficiently)

---

## Solution Design

### Architecture

```
Request → Cache Check → [HIT] → Return cached result
                      ↓ [MISS]
                      Compute → Cache result → Return result
```

### Caching Strategy

**Cache Keys**:
- Carbon: `carbon:{file_hash}:{lifecycle_stage}:{options_hash}`
- IFC Model: `ifc_model:{file_hash}`
- General: `{prefix}:{key_hash}`

**TTL Configuration**:
- Carbon calculations: 1 hour (3600s) - Results stable but may change with emission factor updates
- IFC parsing: 24 hours (86400s) - Models rarely change
- Configurable via environment variables

**Cache Invalidation**:
- Time-based expiration (automatic via TTL)
- Manual invalidation on file update
- Admin endpoint for force invalidation

---

## Implementation Steps

### Step 1: Create Caching Utility (15 minutes)

**File**: `backend/core/utils/caching.py`

**Components**:
1. `CacheManager` class:
   - Initialize Redis client
   - Handle connection errors gracefully
   - Provide get/set/delete operations
   - Track metrics (hits, misses)

2. `@cache_result` decorator:
   - Function-level caching
   - Automatic key generation from function name + args
   - Hash-based cache keys for large inputs
   - Configurable TTL per decorator

3. Helper functions:
   - `generate_cache_key()` - Hash function args to create stable keys
   - `invalidate_cache()` - Delete specific cache entries
   - `get_cache_stats()` - Return hit/miss metrics

**Configuration** (`backend/core/config/suna_config.py`):
```python
# Cache settings
CACHE_ENABLED: bool = True
CACHE_DEFAULT_TTL: int = 3600  # 1 hour
CACHE_CARBON_TTL: int = 3600
CACHE_IFC_TTL: int = 86400  # 24 hours
```

**Example Usage**:
```python
@cache_result(ttl=3600, key_prefix="carbon")
async def calculate_carbon(file_path: str, lifecycle_stage: str):
    # Expensive computation here
    return result
```

### Step 2: Add Caching to Carbon Tool (15 minutes)

**File**: `backend/core/tools/bim/carbon_tool.py`

**Changes**:
1. Import caching decorator
2. Wrap `calculate_carbon()` method with `@cache_result`
3. Generate cache key from file hash + parameters
4. Log cache hits/misses for monitoring

**Cache Key Structure**:
```python
key = f"carbon:{file_hash}:{lifecycle_stage}:{options_hash}"
```

**Considerations**:
- File hash ensures different files get different cache entries
- Options hash handles different calculation parameters
- TTL of 1 hour balances freshness vs performance

### Step 3: Add Caching to IFC Parser (15 minutes)

**File**: `backend/core/bim/async_ifc_parser.py` (or wrapper)

**Changes**:
1. Import caching decorator
2. Wrap IFC parsing function with `@cache_result`
3. Cache parsed model structure (serialized)
4. Handle large cached values efficiently

**Cache Key Structure**:
```python
key = f"ifc_model:{file_hash}"
```

**Considerations**:
- Parsed IFC models can be large (compress before caching?)
- TTL of 24 hours (models rarely change)
- Consider memory limits (Redis maxmemory policy)

### Step 4: Add Cache Invalidation (10 minutes)

**File**: `backend/core/api/admin.py` (or separate cache admin)

**Endpoints**:
1. `POST /admin/cache/invalidate` - Invalidate specific key pattern
2. `DELETE /admin/cache/clear` - Clear all cache (dangerous, require confirmation)
3. `GET /admin/cache/stats` - Get cache metrics

**Authorization**:
- Admin/superuser only
- Validate user permissions before cache operations

**Example**:
```python
@router.post("/admin/cache/invalidate")
async def invalidate_cache(pattern: str):
    count = await cache_manager.invalidate_pattern(pattern)
    return {"invalidated_keys": count}
```

### Step 5: Add Cache Monitoring (5 minutes)

**File**: `backend/core/utils/caching.py`

**Metrics**:
- `cache_hits`: Counter for cache hits
- `cache_misses`: Counter for cache misses
- `cache_hit_rate`: Calculated percentage
- `cache_size`: Estimated cached data size

**Logging**:
```python
logger.info("Cache hit", extra={
    "key": cache_key,
    "ttl_remaining": ttl,
    "hit_rate": hit_rate
})
```

**Dashboard Integration**:
- Expose metrics via `/admin/cache/stats`
- Include in health check endpoint
- Optional: Prometheus metrics export

---

## Testing Strategy

### Unit Tests (`backend/tests/test_caching.py`)

1. **test_cache_decorator_caches_result**
   - Call cached function twice
   - Assert second call returns cached value
   - Assert computation only happened once

2. **test_cache_miss_computes_value**
   - Call cached function with unique args
   - Assert cache miss occurs
   - Assert value computed and cached

3. **test_cache_expiration**
   - Cache a value with short TTL (1 second)
   - Wait for expiration
   - Assert cache miss after expiration

4. **test_cache_key_generation**
   - Generate keys for same args → same key
   - Generate keys for different args → different keys
   - Test key stability across function calls

5. **test_cache_invalidation**
   - Cache a value
   - Invalidate the key
   - Assert cache miss on next call

6. **test_redis_unavailable_graceful_degradation**
   - Mock Redis connection failure
   - Assert function still works (no cache)
   - Assert no exceptions raised

### Integration Tests (`backend/tests/test_carbon_caching.py`)

1. **test_carbon_calculation_cached**
   - Upload IFC file
   - Calculate carbon (cache miss)
   - Calculate again (cache hit)
   - Assert second call is faster
   - Assert results identical

2. **test_ifc_parsing_cached**
   - Parse IFC file (cache miss)
   - Parse same file (cache hit)
   - Assert parsing time improved
   - Assert model data identical

3. **test_different_files_different_cache**
   - Parse file A
   - Parse file B
   - Assert both cached separately
   - Assert no cache collision

### Performance Tests

1. **test_cache_improves_response_time**
   - Measure response time without cache
   - Measure response time with cache
   - Assert >50% improvement on cache hit

2. **test_concurrent_cache_access**
   - Simulate 10 concurrent requests for same calculation
   - Assert only 1 computation happens
   - Assert all requests get result

---

## Configuration

### Environment Variables

Add to `backend/.env.example`:
```bash
# Cache Configuration
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=3600           # Default TTL in seconds (1 hour)
CACHE_CARBON_TTL=3600            # Carbon calculation cache TTL
CACHE_IFC_TTL=86400              # IFC parsing cache TTL (24 hours)
CACHE_MAX_SIZE_MB=1024           # Max Redis memory for cache (1GB)
```

### Redis Configuration

**Memory Policy** (if not already set):
```bash
# In Redis config or environment
REDIS_MAXMEMORY=1gb
REDIS_MAXMEMORY_POLICY=allkeys-lru  # Evict least recently used keys
```

---

## Success Criteria

- ✅ `CacheManager` class implemented with error handling
- ✅ `@cache_result` decorator working on test functions
- ✅ Carbon calculations cached with appropriate TTL
- ✅ IFC parsing cached with appropriate TTL
- ✅ Cache invalidation endpoints functional (admin only)
- ✅ Cache metrics tracked and exposed
- ✅ All unit tests pass (6 tests minimum)
- ✅ All integration tests pass (3 tests minimum)
- ✅ Performance tests show >50% improvement on cache hits
- ✅ Graceful degradation when Redis unavailable
- ✅ Documentation updated with caching behavior

---

## Performance Expectations

**Before Caching**:
- Carbon calculation: ~2-5 seconds per request
- IFC parsing: ~1-3 seconds per file
- Repeated requests: Same processing time

**After Caching**:
- Cache hit: <50ms
- Cache miss: Same as before (but cached for next time)
- Repeated requests: ~95% faster
- Expected cache hit rate: >70% in production

---

## Rollback Plan

If caching causes issues:

1. **Disable via environment variable**:
   ```bash
   CACHE_ENABLED=false
   ```

2. **Clear all cache**:
   ```bash
   curl -X DELETE http://localhost:8000/v1/admin/cache/clear
   ```

3. **Revert code changes**:
   ```bash
   git revert <commit-hash>
   ```

**Monitoring during rollout**:
- Watch cache hit rate (expect >50% after 1 hour)
- Monitor Redis memory usage
- Check for cache-related errors in logs
- Verify response time improvements

---

## Edge Cases & Considerations

1. **Large IFC files**: Compress cached data or skip caching for >10MB files
2. **Cache stampede**: Use lock to prevent multiple concurrent computations for same key
3. **Memory pressure**: Configure Redis maxmemory and eviction policy
4. **Stale data**: Short TTLs or manual invalidation on data updates
5. **Redis downtime**: Graceful degradation (log warning, continue without cache)

---

## Dependencies

**Required**:
- `redis` package (already installed via `redis-service.py`)
- Redis server running (already configured)

**Optional**:
- `msgpack` or `ujson` for faster serialization
- Compression library for large cached values

---

## Documentation Updates

1. **CLAUDE.md**: Add caching behavior notes
2. **README.md**: Document cache configuration
3. **API docs**: Note which endpoints are cached
4. **Operations guide**: Cache invalidation procedures

---

## Estimated Time Breakdown

- Step 1 (Caching utility): 15 min
- Step 2 (Carbon tool): 15 min
- Step 3 (IFC parser): 15 min
- Step 4 (Invalidation): 10 min
- Step 5 (Monitoring): 5 min
- Testing: 10 min (run existing + new tests)
- Documentation: 5 min

**Total**: 60 minutes
