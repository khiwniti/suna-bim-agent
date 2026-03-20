# Technical Concerns & Improvement Areas

## Critical Issues

### 1. Sunset Dependencies

**Issue**: Using deprecated Vercel storage packages

**Current State**:
- `@vercel/postgres` - SUNSET (use `@neondatabase/serverless`)
- `@vercel/kv` - SUNSET (use `@upstash/redis`)

**Impact**: HIGH
- Dependencies will stop receiving updates
- Security vulnerabilities won't be patched
- May break in future Vercel platform updates

**Recommended Action**:
```bash
# Replace @vercel/postgres
pnpm remove @vercel/postgres
pnpm add @neondatabase/serverless
# Use @neondatabase/vercel-postgres-compat for drop-in replacement

# Replace @vercel/kv  
pnpm remove @vercel/kv
pnpm add @upstash/redis
```

**Files to Update**:
- All database clients using `@vercel/postgres`
- All Redis clients using `@vercel/kv`
- Update imports in `backend/core/services/`

---

### 2. Missing BIM Dependencies

**Issue**: BIM tools require ifcopenshell but installation is optional

**Current State**:
- `make install-bim` required before BIM features work
- ifcopenshell not in default dependencies
- No clear documentation for users

**Impact**: MEDIUM
- BIM features silently fail without ifcopenshell
- Poor developer experience
- Confusing error messages

**Recommended Action**:
Add to pyproject.toml dependencies or make optional extra

---

### 3. Environment Variable Management

**Issue**: Multiple environment files, unclear configuration

**Current State**:
- Multiple `.env` files
- Inconsistent documentation
- Risk of committing secrets

**Impact**: MEDIUM
- Developer onboarding confusion
- Security risks
- Configuration errors

---

## Security Concerns

### 1. Missing Rate Limiting

**Issue**: No rate limiting on expensive operations

**Impact**: HIGH - DoS vulnerability, API cost explosion

**Recommended Action**: Add rate limiting to IFC upload, carbon calculation, LLM endpoints

---

### 2. CORS Configuration

**Issue**: Potentially permissive CORS settings

**Impact**: MEDIUM - CSRF vulnerabilities, unauthorized access

---

### 3. Hardcoded Secrets Risk

**Issue**: No automated secrets scanning

**Impact**: HIGH - Risk of API keys in commits

**Recommended Action**: Add pre-commit hooks and CI secrets scanning

---

## Performance Concerns

### 1. Synchronous IFC Parsing

**Issue**: Large IFC files block event loop

**Impact**: HIGH - API unresponsive, poor UX for large files

**Recommended Action**: Use thread pool for CPU-bound IFC parsing work

---

### 2. Missing Caching

**Issue**: No caching for expensive computations

**Impact**: MEDIUM - Slow responses, wasted computation, high costs

**Recommended Action**: Implement Redis caching for carbon calculations and IFC parsing results

---

### 3. N+1 Query Issues

**Issue**: Potential N+1 queries in data fetching

**Impact**: MEDIUM - Slow API responses, database load

---

## Architecture Concerns

### 1. Monolithic API File

**Issue**: `api.py` handles too many responsibilities

**Impact**: MEDIUM - Hard to navigate, merge conflicts

**Recommended Action**: Split into app factory, middleware, routes modules

---

### 2. Missing API Versioning

**Issue**: No version in API URLs

**Impact**: LOW now, HIGH future - Breaking changes impact all clients

**Recommended Action**: Add `/api/v1` prefix to all routes

---

### 3. ThreadManager Complexity

**Issue**: ThreadManager class is very large

**Impact**: MEDIUM - Hard to test and modify

**Note**: Partially addressed with subfolder structure

---

## Testing Gaps

### 1. No Integration Tests

**Current State**: Only unit and E2E tests

**Impact**: MEDIUM - Miss interaction bugs

**Recommended Action**: Add integration tests for agent→tools→DB flows

---

### 2. Limited Frontend Tests

**Current State**: Only Playwright E2E tests

**Impact**: MEDIUM - Slow feedback, hard to debug

**Recommended Action**: Add Vitest for component and hook unit tests

---

### 3. No Load Testing

**Current State**: Unknown performance limits

**Impact**: HIGH for production - Risk of crashes

**Recommended Action**: Add Locust for load testing

---

## Documentation Gaps

### 1. Missing API Documentation

**Impact**: MEDIUM - Poor developer experience

**Recommended Action**: Create user-facing API docs with examples

---

### 2. No Architecture Diagrams

**Impact**: LOW - Harder to onboard developers

**Recommended Action**: Add Mermaid diagrams to documentation

---

### 3. Missing Deployment Guide

**Impact**: MEDIUM - Deployment errors, no standardized process

**Recommended Action**: Document Azure ACA, Docker Compose, CI/CD setup

---

## Code Quality Issues

### 1. Inconsistent Error Handling

**Issue**: Mixed error handling patterns

**Impact**: MEDIUM - Inconsistent API responses

**Recommended Action**: Standardize on HTTPException with structured details

---

### 2. Magic Numbers and Strings

**Issue**: Hardcoded values throughout codebase

**Impact**: LOW - Hard to maintain

**Recommended Action**: Extract to constants and enums

---

### 3. Commented-Out Code

**Issue**: Dead code still in repository

**Impact**: LOW - Code clutter

**Recommended Action**: Remove via pre-commit hooks

---

## Infrastructure Concerns

### 1. No Monitoring

**Current State**: Only Langfuse for LLM tracking

**Impact**: HIGH for production - No visibility

**Recommended Action**: Add Sentry for error tracking, APM for performance

---

### 2. No Backup Strategy

**Current State**: Supabase backups only

**Impact**: HIGH - Data loss risk

**Recommended Action**: Add custom backup process and test recovery

---

### 3. Basic Health Checks

**Current State**: Simple /health endpoint

**Impact**: MEDIUM - Can't detect partial failures

**Recommended Action**: Add dependency health checks (DB, Redis, storage)

---

## Priority Matrix

| Priority | Issue | Impact | Effort | Timeline |
|----------|-------|--------|--------|----------|
| 🔴 P0 | Sunset dependencies | HIGH | LOW | This sprint |
| 🔴 P0 | Missing rate limiting | HIGH | LOW | This sprint |
| 🔴 P0 | Synchronous IFC parsing | HIGH | MEDIUM | Next sprint |
| 🟡 P1 | Missing BIM dependencies | MEDIUM | LOW | This sprint |
| 🟡 P1 | Environment variables | MEDIUM | LOW | This sprint |
| 🟡 P1 | Secrets scanning | HIGH | LOW | Next sprint |
| 🟡 P1 | Missing caching | MEDIUM | MEDIUM | Next sprint |
| 🟡 P1 | No monitoring | HIGH | MEDIUM | Before production |
| 🟢 P2 | CORS configuration | MEDIUM | LOW | Before production |
| 🟢 P2 | API versioning | HIGH | LOW | Before public API |
| 🟢 P3 | Code quality improvements | LOW-MEDIUM | LOW-MEDIUM | Ongoing |

