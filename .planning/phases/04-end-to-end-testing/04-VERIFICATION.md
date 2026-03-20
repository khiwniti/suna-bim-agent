status: passed

# Phase 4: End-to-end testing — Verification

**Date:** 2026-03-20
**Phase:** 04

## Must-haves Verified

- [x] `e2e/auth-flow.spec.ts` created — covers OTP route 200/400 (not 404), email input, mocked submit, expired param
- [x] `e2e/dashboard-smoke.spec.ts` created — covers JS errors, 404 assets, duplicate font preload warning
- [x] `e2e/api-smoke.spec.ts` created — regression tests for Traefik fix, composio route, backend health
- [x] CI workflow updated — `test` job added between `build` and `deploy`
- [x] Deploy blocked on test failure (`needs: [build, test]`)
- [x] Playwright HTML report uploaded as artifact on failure
- [x] Chromium-only in CI (fast); full browser suite available locally

## Human Verification Required

The following require a browser to fully validate after next deploy:

1. Visit `https://carbon-bim.ensimu.space/auth` → enter email → confirm OTP email arrives (or mock works)
2. Confirm no font preload warning in browser console
3. Confirm `/api/auth/send-otp` returns 200 in Network tab (not 404)

## Notes

- Tests use Playwright route mocking — no real Supabase/backend calls needed in CI
- `NEXT_PUBLIC_BACKEND_URL` is set in test env to ACA backend URL
- `skipIfNoBackend()` guard in api-smoke.spec.ts skips backend tests when `NEXT_PUBLIC_BACKEND_URL` is not set
