# Phase 12: Production Hardening — Implementation Plan

## Overview

Address all P0 and P1 issues from CONCERNS.md to make Carbon BIM production-ready.

---

## Task 1: Replace Sunset Dependencies

**Priority**: P0 (HIGH impact, LOW effort)

**Problem**: Using deprecated `@vercel/postgres` and `@vercel/kv` packages

**Implementation**:

1. **Replace @vercel/postgres with @neondatabase/serverless**
   - Remove `@vercel/postgres` from package.json
   - Add `@neondatabase/serverless` and `@neondatabase/serverless-postgres-compat`
   - Update imports in `backend/core/services/` (if any frontend usage)
   - Use compatibility wrapper for drop-in replacement
   - Test database connections

2. **Replace @vercel/kv with @upstash/redis**
   - Remove `@vercel/kv` from package.json
   - Add `@upstash/redis`
   - Update `backend/core/services/redis_service.py` imports
   - Update environment variable references (if needed)
   - Test Redis operations (get, set, delete)

**Files**:
- `backend/pyproject.toml` (if Python dependencies affected)
- `apps/frontend/package.json` (frontend dependencies)
- `backend/core/services/redis_service.py`
- Any database client files

**Tests**:
- Database connection test
- Redis operations test
- Integration test with Supabase
- Integration test with Upstash Redis

**Success Criteria**:
- No deprecated packages in package.json or pyproject.toml
- All database and Redis operations work identically
- No breaking changes to existing functionality
- Tests pass

---

## Task 2: Add Rate Limiting to Expensive Endpoints

**Priority**: P0 (HIGH impact, LOW effort)

**Problem**: No rate limiting on IFC upload, carbon calculation, LLM API calls (DoS vulnerability, cost explosion)

**Implementation**:

1. **Install slowapi**
   ```bash
   cd backend
   uv add slowapi
   ```

2. **Create rate limiter utility**
   - File: `backend/core/middleware/rate_limiter.py`
   - Initialize Limiter with Redis backend
   - Export limiter instance and decorators

3. **Apply rate limits to endpoints**
   - `/bim/upload`: 10 uploads per hour per user
   - `/bim/carbon`: 50 calculations per hour per user
   - `/bim/clash`: 50 detections per hour per user
   - `/bim/compliance`: 50 checks per hour per user
   - `/agent-run/start`: 100 starts per hour per user
   - Custom limits for other expensive endpoints

4. **Add rate limit error handling**
   - Return 429 Too Many Requests
   - Include Retry-After header
   - Clear error message to user

5. **Configure rate limit storage**
   - Use existing Redis connection
   - Set appropriate TTLs
   - Handle Redis unavailability gracefully

**Files**:
- `backend/pyproject.toml` (add slowapi)
- `backend/core/middleware/rate_limiter.py` (new)
- `backend/core/api/bim.py` (add rate limits)
- `backend/core/api/agent.py` (add rate limits)
- `backend/core/config/settings.py` (rate limit config)

**Tests**:
- Test rate limit enforcement (exceed limit → 429)
- Test rate limit reset after TTL
- Test different limits for different endpoints
- Test graceful degradation if Redis down

**Success Criteria**:
- All expensive endpoints protected
- Clear error messages when limit exceeded
- Configurable limits via environment variables
- Tests pass

---

## Task 3: Fix Synchronous IFC Parsing

**Priority**: P0 (HIGH impact, MEDIUM effort)

**Problem**: `ifcopenshell.open()` blocks event loop, causing API unresponsiveness during large file parsing

**Implementation**:

1. **Create async IFC parser wrapper**
   - File: `backend/core/bim/async_ifc_parser.py`
   - Use `ThreadPoolExecutor` for CPU-bound work
   - Wrapper function: `async def parse_ifc_async(file_path: str)`

2. **Update IFC parser tool**
   - File: `backend/core/tools/bim/ifc_parser_tool.py`
   - Replace synchronous `ifcopenshell.open()` with async wrapper
   - Keep existing API surface unchanged

3. **Update carbon calculation tool**
   - File: `backend/core/tools/bim/carbon_tool.py`
   - Use async IFC parsing
   - Ensure calculations remain correct

4. **Update other BIM tools**
   - `clash_detection_tool.py`
   - `compliance_tool.py`
   - `mep_coordination_tool.py`
   - Any other tools that parse IFC files

5. **Configure thread pool**
   - File: `backend/core/config/settings.py`
   - Add `IFC_WORKER_THREADS` setting (default: 4)
   - Create global executor instance

**Files**:
- `backend/core/bim/async_ifc_parser.py` (new)
- `backend/core/tools/bim/ifc_parser_tool.py`
- `backend/core/tools/bim/carbon_tool.py`
- `backend/core/tools/bim/clash_detection_tool.py`
- `backend/core/tools/bim/compliance_tool.py`
- `backend/core/config/settings.py`

**Tests**:
- Test async IFC parsing completes successfully
- Test parsing doesn't block event loop (concurrent requests)
- Test parsing results match synchronous version
- Test error handling (corrupted IFC, missing file)
- Load test: concurrent IFC parsing requests

**Success Criteria**:
- IFC parsing doesn't block event loop
- API remains responsive during large file parsing
- Parsing results identical to sync version
- Configurable worker thread count
- Tests pass

---

## Task 4: Fix BIM Dependencies Declaration

**Priority**: P1 (MEDIUM impact, LOW effort)

**Problem**: ifcopenshell is optional (`make install-bim`), causing silent failures

**Implementation**:

1. **Add BIM dependencies to pyproject.toml**
   ```toml
   [project.optional-dependencies]
   bim = [
       "ifcopenshell>=0.7.0",
       "numpy>=1.24.0",
       "networkx>=3.0",
       "ladybug-core"
   ]
   ```

2. **Update installation documentation**
   - File: `README.md`
   - Document: `uv sync --extra bim` for BIM features
   - Or: `uv sync --all-extras` for everything

3. **Add runtime checks**
   - File: `backend/core/tools/bim/__init__.py`
   - Check if ifcopenshell available
   - Raise clear error message if missing

4. **Update Makefile**
   - Keep `make install-bim` for convenience
   - Update to use `uv sync --extra bim`

5. **Update CI/CD**
   - File: `.github/workflows/deploy-azure-aca-direct.yml`
   - Ensure BIM extras installed in builds

**Files**:
- `backend/pyproject.toml`
- `backend/README.md` or root `README.md`
- `backend/core/tools/bim/__init__.py` (runtime check)
- `backend/Makefile`
- `.github/workflows/deploy-azure-aca-direct.yml`

**Tests**:
- Test BIM tools work with extras installed
- Test clear error message if extras missing
- Test CI/CD builds include BIM dependencies

**Success Criteria**:
- BIM dependencies properly declared as optional extra
- Clear installation instructions
- Runtime check prevents silent failures
- CI/CD includes BIM extras
- Tests pass

---

## Task 5: Standardize Environment Variables

**Priority**: P1 (MEDIUM impact, LOW effort)

**Problem**: Multiple `.env` files, unclear setup, risk of committing secrets

**Implementation**:

1. **Clean up environment files**
   - Keep only `.env.example` (committed template)
   - Remove redundant `.env` (if committed)
   - Update `.gitignore` to exclude `.env*.local`

2. **Create comprehensive .env.example**
   - File: `backend/.env.example`
   - Document all required variables
   - Document all optional variables
   - Add comments explaining each variable
   - Separate sections: Database, Redis, LLM, BIM, etc.

3. **Update developer documentation**
   - File: `CLAUDE.md` or `backend/README.md`
   - Clear setup instructions:
     1. Copy `.env.example` to `.env.local`
     2. Fill in required values
     3. Optional: override defaults

4. **Add environment variable validation**
   - File: `backend/core/config/settings.py`
   - Use pydantic-settings validation
   - Fail fast with clear errors if required vars missing

**Files**:
- `backend/.env.example` (update/create)
- `backend/.env` (remove if committed)
- `backend/.gitignore` (add `.env*.local`)
- `CLAUDE.md` (update env setup instructions)
- `backend/core/config/settings.py` (validation)

**Tests**:
- Test app startup with minimal .env
- Test validation catches missing required vars
- Test optional vars have sensible defaults

**Success Criteria**:
- Single source of truth: `.env.example`
- Clear developer onboarding
- Validation prevents runtime errors
- `.env*.local` in `.gitignore`
- No secrets in git history

---

## Task 6: Add Secrets Scanning

**Priority**: P1 (HIGH impact, LOW effort)

**Problem**: No automated secrets detection, relies on developer vigilance

**Implementation**:

1. **Install detect-secrets**
   ```bash
   pip install detect-secrets
   detect-secrets scan --all-files > .secrets.baseline
   ```

2. **Add pre-commit hook**
   - File: `.pre-commit-config.yaml`
   - Add detect-secrets hook
   - Runs before every commit

3. **Add CI check**
   - File: `.github/workflows/test.yml`
   - Add secrets scanning step
   - Fail build if secrets detected

4. **Create secrets baseline**
   - File: `.secrets.baseline`
   - Audit false positives
   - Commit baseline

5. **Document secrets policy**
   - File: `SECURITY.md` or `CONTRIBUTING.md`
   - Never commit secrets
   - Use `.env.local` for local secrets
   - Use GitHub secrets for CI/CD

**Files**:
- `.pre-commit-config.yaml` (new or update)
- `.secrets.baseline` (new)
- `.github/workflows/test.yml` (add secrets check)
- `SECURITY.md` or `CONTRIBUTING.md` (policy)

**Tests**:
- Test pre-commit hook blocks secret commit (simulate)
- Test CI fails if secret detected
- Test baseline allows known false positives

**Success Criteria**:
- Pre-commit hook installed and active
- CI blocks secret commits
- Baseline documented and audited
- Clear policy documented
- Tests pass

---

## Task 7: Implement Redis Caching

**Priority**: P1 (MEDIUM impact, MEDIUM effort)

**Problem**: No caching for expensive computations (carbon, IFC parsing)

**Implementation**:

1. **Create caching decorator**
   - File: `backend/core/utils/caching.py`
   - Decorator: `@cache_result(ttl=3600, key_prefix="carbon")`
   - Uses Redis for storage
   - Hash-based cache keys (file content hash)

2. **Add caching to carbon calculations**
   - File: `backend/core/tools/bim/carbon_tool.py`
   - Cache `calculate_carbon()` results
   - Key: `carbon:{file_hash}:{lifecycle_stage}`
   - TTL: 1 hour

3. **Add caching to IFC parsing**
   - File: `backend/core/bim/async_ifc_parser.py`
   - Cache parsed IFC models
   - Key: `ifc_model:{file_hash}`
   - TTL: 24 hours

4. **Add cache invalidation**
   - Invalidate on file update
   - Manual invalidation endpoint (admin only)

5. **Add cache monitoring**
   - Hit/miss metrics
   - Cache size tracking

**Files**:
- `backend/core/utils/caching.py` (new)
- `backend/core/tools/bim/carbon_tool.py` (add caching)
- `backend/core/bim/async_ifc_parser.py` (add caching)
- `backend/core/api/admin.py` (cache admin endpoints)

**Tests**:
- Test cache hit returns cached result
- Test cache miss computes and caches
- Test cache expiration after TTL
- Test cache invalidation works
- Test performance improvement (cached vs uncached)

**Success Criteria**:
- Carbon calculations cached
- IFC parsing results cached
- Measurable performance improvement
- Cache hit/miss metrics available
- Tests pass

---

## Task 8: Add Production Monitoring

**Priority**: P1 (HIGH impact, MEDIUM effort)

**Problem**: No error tracking or APM beyond Langfuse for LLM

**Implementation**:

1. **Install Sentry**
   ```bash
   cd backend
   uv add sentry-sdk[fastapi]
   ```

2. **Configure Sentry**
   - File: `backend/core/monitoring/sentry.py`
   - Initialize Sentry SDK
   - FastAPI integration
   - Environment-specific DSN

3. **Add Sentry to FastAPI app**
   - File: `backend/api.py`
   - Import and initialize Sentry
   - Configure error sampling
   - Configure performance monitoring

4. **Add custom error tracking**
   - Track BIM tool errors
   - Track LLM errors
   - Track authentication errors
   - Add user context to errors

5. **Configure environment**
   - Add `SENTRY_DSN` to `.env.example`
   - Add `SENTRY_ENVIRONMENT` (dev/staging/prod)
   - Add `SENTRY_TRACES_SAMPLE_RATE`

6. **Add health check improvements**
   - File: `backend/core/api/health.py`
   - Check database connectivity
   - Check Redis connectivity
   - Check Supabase storage
   - Return detailed status

**Files**:
- `backend/pyproject.toml` (add sentry-sdk)
- `backend/core/monitoring/sentry.py` (new)
- `backend/api.py` (initialize Sentry)
- `backend/core/api/health.py` (enhanced health checks)
- `backend/.env.example` (Sentry config)

**Tests**:
- Test Sentry captures errors
- Test error context includes user info
- Test performance traces recorded
- Test health check returns all statuses

**Success Criteria**:
- Sentry error tracking active
- Performance monitoring configured
- Enhanced health checks deployed
- Environment-specific configuration
- Tests pass

---

## Execution Order

1. Task 1: Replace Sunset Dependencies (30 min)
2. Task 2: Add Rate Limiting (45 min)
3. Task 3: Fix Synchronous IFC Parsing (2 hours)
4. Task 4: Fix BIM Dependencies (30 min)
5. Task 5: Standardize Environment Variables (45 min)
6. Task 6: Add Secrets Scanning (30 min)
7. Task 7: Implement Redis Caching (2 hours)
8. Task 8: Add Production Monitoring (1.5 hours)

**Total Estimated Time**: ~8.5 hours

---

## Verification Steps

After each task:
1. Run relevant tests
2. Manual verification
3. Update documentation
4. Commit with clear message

After all tasks:
1. Full test suite
2. Security audit
3. Performance benchmarks
4. Deploy to staging
5. Smoke tests on staging
6. Document production deployment checklist

---

## Success Metrics

- [ ] All P0 issues resolved
- [ ] All P1 issues resolved
- [ ] Zero security vulnerabilities in dependencies
- [ ] API response times improved (caching)
- [ ] Rate limiting prevents abuse
- [ ] Error tracking captures production issues
- [ ] Developer onboarding takes <15 minutes
- [ ] All tests pass
- [ ] Ready for production deployment
