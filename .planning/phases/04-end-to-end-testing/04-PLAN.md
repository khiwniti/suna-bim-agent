# Phase 4: End-to-end testing — Plan

**Created:** 2026-03-20
**Phase:** 04 — End-to-end testing
**Context:** 04-CONTEXT.md

## Goal
Comprehensive E2E test suite covering auth OTP flow, BIM workflow, API routing smoke tests. CI gates deploy on test pass.

## Tasks

### PLAN-04-01: Auth flow E2E spec
**File:** `apps/frontend/e2e/auth-flow.spec.ts`
- Mock Supabase `POST /api/auth/send-otp` → return `{success: true}` (no real email)
- Test: visit `/auth` → type email → click "Send code" → assert success state shown
- Test: verify `/api/auth/send-otp` returns 200 (Traefik fix regression check)
- Test: mock session → visit `/dashboard` → assert no redirect to `/auth`
- Test: visit `/auth?expired=true` → assert expired banner shown

### PLAN-04-02: BIM upload + dashboard smoke spec
**File:** `apps/frontend/e2e/dashboard-smoke.spec.ts`
- Mock auth session cookie so tests don't need real login
- Test: `/dashboard` loads without console errors
- Test: BIM upload area renders (file input present)
- Test: sidebar/navigation renders (all main links accessible)
- Reuse SSE mock patterns from existing `bim-features.spec.ts`

### PLAN-04-03: Backend API smoke spec
**File:** `apps/frontend/e2e/api-smoke.spec.ts`
- Direct fetch tests (no browser UI): `GET /v1/health` → 200
- `GET /bim/health` → 200 or 503 (degraded is OK)
- `POST /api/auth/send-otp` with valid email → 200 or 400 (never 404)
- `POST /api/auth/send-otp` with invalid email → 400
- Skip if `BACKEND_URL` not set (CI without backend)

### PLAN-04-04: CI workflow — add test job
**File:** `.github/workflows/deploy-azure-aca.yml`
- Add `test` job after `build`, before `deploy`
- `needs: build` — uses built image tag from build job
- Install Playwright browsers: `npx playwright install --with-deps chromium`
- Run: `pnpm test:e2e` with `BASE_URL=http://localhost:3000`
- Upload HTML report as artifact on failure
- `deploy` job adds `needs: [build, test]`
- Add `E2E_TEST_EMAIL` secret usage note in workflow comment
