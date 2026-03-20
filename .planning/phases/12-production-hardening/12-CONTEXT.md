# Phase 12: Production Hardening — Context

## Goal

Make Carbon BIM production-ready by addressing all critical technical debt, security vulnerabilities, and performance issues identified in CONCERNS.md.

## Background

The codebase mapping revealed several high-priority issues that must be resolved before production deployment:

### Critical Issues (P0)
1. **Sunset Dependencies**: Using deprecated `@vercel/postgres` and `@vercel/kv`
2. **Missing Rate Limiting**: Expensive operations unprotected (DoS risk)
3. **Synchronous IFC Parsing**: Blocks event loop, poor UX for large files

### Important Issues (P1)
4. **Missing BIM Dependencies**: ifcopenshell optional, causes silent failures
5. **Environment Variable Chaos**: Multiple env files, unclear setup
6. **Hardcoded Secrets Risk**: No automated scanning in CI
7. **Missing Caching**: No Redis caching for expensive computations
8. **No Monitoring**: No production observability beyond Langfuse

## Dependencies

- **Milestone 1** (Production-Ready Deployment): ✅ Complete
- **Milestone 2** (BIM 3D Viewer): ✅ Complete
- **Codebase Documentation**: ✅ Complete

## Success Criteria

### P0 Issues Resolved
- [ ] All sunset dependencies replaced with current alternatives
- [ ] Rate limiting implemented on all expensive endpoints
- [ ] IFC parsing moved to background workers (non-blocking)

### P1 Issues Resolved
- [ ] BIM dependencies properly declared in pyproject.toml
- [ ] Single `.env.example` template, clear documentation
- [ ] Secrets scanning in pre-commit hooks and CI
- [ ] Redis caching for carbon calculations and IFC parsing
- [ ] Sentry error tracking and basic APM configured

### Production-Ready Checklist
- [ ] No security vulnerabilities in dependencies
- [ ] All endpoints protected from abuse
- [ ] Async operations don't block event loop
- [ ] Clear developer onboarding documentation
- [ ] Error tracking and alerting configured
- [ ] Performance monitoring in place

## Implementation Approach

Execute in priority order (P0 → P1) with verification after each task:

1. **Replace sunset dependencies** (quick wins)
2. **Add rate limiting** (security critical)
3. **Fix async IFC parsing** (performance critical)
4. **Fix BIM dependencies** (developer experience)
5. **Standardize env vars** (developer experience)
6. **Add secrets scanning** (security)
7. **Implement caching** (performance)
8. **Add monitoring** (observability)

## Timeline

**Estimated**: 2-3 days
- P0 issues: 1 day
- P1 issues: 1-2 days
- Testing and verification: 0.5 day

## Risks

1. **Breaking changes** in dependency replacement → Mitigation: Test thoroughly
2. **Rate limiting too strict** → Mitigation: Start permissive, tighten based on usage
3. **Worker setup complexity** → Mitigation: Use ThreadPoolExecutor (simple)
4. **Cache invalidation bugs** → Mitigation: Conservative TTLs, hash-based keys

## Rollback Plan

- Git worktree for isolated development
- Each task committed separately
- Can revert individual changes if issues arise
- No deployment until all P0 + P1 complete and tested
