# Phase 4: End-to-end testing - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Comprehensive E2E test suite covering auth flow (OTP login + session), BIM workflow (file upload + dashboard load), and API routing smoke tests — all running in CI on every push to main/staging, gating deployment.

</domain>

<decisions>
## Implementation Decisions

### Test Scope
- Cover: auth OTP flow, BIM upload, dashboard load
- Include backend API smoke tests: `/v1/health`, `/v1/threads` (auth required), `/bim/health`
- Specifically test the OTP fix: verify `POST /api/auth/send-otp` returns 200 (not 404)
- Frontend web only — no mobile app tests this phase

### Test Environment
- Tests run against `localhost:3000` — CI workflow spins up Next.js dev server
- Backend API routes mocked in Playwright (no live backend required in CI)
- Auth mocked via Supabase route interception — no real OTP emails sent
- Test credentials stored as GitHub secrets: `E2E_TEST_EMAIL`, bypass token if needed

### CI Integration
- Tests run on every push to `main` and `staging` — after build job, before deploy job
- Deploy is blocked if E2E tests fail
- Chromium only in CI (fast); local runs can use all browsers
- Upload Playwright HTML report as GitHub Actions artifact on failure

### Claude's Discretion
- Test file organization (single spec vs multiple per feature)
- Exact mock payloads for Supabase auth
- Playwright fixture structure

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/frontend/playwright.config.ts` — already configured with webServer for CI, retry logic, HTML reporter
- `apps/frontend/e2e/bim-features.spec.ts` — extensive BIM mock pattern (SSE helpers, route mocking) to follow
- `apps/frontend/src/app/api/auth/send-otp/route.ts` — the OTP route we need to verify works

### Established Patterns
- Playwright route mocking: `page.route('/api/...', handler)` — used throughout bim-features.spec.ts
- SSE mock helpers already defined in bim-features.spec.ts — reuse for agent stream tests
- `BASE_URL` env var controls test target — already in playwright.config.ts

### Integration Points
- CI workflow: add `test` job between `build` and `deploy` in `.github/workflows/deploy-azure-aca.yml`
- New spec files go in `apps/frontend/e2e/`
- Must add `E2E_TEST_EMAIL` secret to GitHub repo

</code_context>

<specifics>
## Specific Ideas

- Verify the Traefik routing fix: `/api/auth/send-otp` must return 200/400 (not 404) — this was the key prod bug
- Mock Supabase `signInWithOtp` to return success without sending real email
- Auth page spec: type email → click send → verify success state (no network needed)
- Dashboard smoke: visit `/dashboard` while mocking auth session → page loads without JS errors

</specifics>

<deferred>
## Deferred Ideas

- Mobile E2E tests (Expo/Detox) — out of scope for this phase
- Load testing / performance benchmarks
- Visual regression testing

</deferred>
