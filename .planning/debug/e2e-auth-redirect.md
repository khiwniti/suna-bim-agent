---
status: root_cause_found
trigger: "8 Playwright E2E tests in auth-flow.spec.ts failing - auth page elements not found and session redirect not happening"
created: 2026-03-21T14:00:00Z
updated: 2026-03-21T14:15:00Z
---

## Current Focus
hypothesis: CONFIRMED — Middleware has authentication DISABLED, bypassing all auth checks
test: n/a — root cause confirmed through code analysis
expecting: n/a
next_action: Remove or fix the auth-disabled block in middleware.ts

## Symptoms
expected:
- Auth page renders email input and submit button
- Auth page shows OTP flow on valid email submit
- Unauthenticated access to /dashboard redirects to /auth

actual:
- Tests timeout waiting for elements that never appear
- URL stays at http://localhost:3000/dashboard instead of redirecting to /auth
- Auth page elements not found within timeout

errors:
- Test timeouts (7.3s, 16.2s, 17.4s)
- "Current URL after /dashboard: http://localhost:3000/dashboard" - no redirect happening

reproduction:
- Run: pnpm test:e2e --project=chromium
- Tests 8-17 in auth-flow.spec.ts fail
- Environment: CI (GitHub Actions)

timeline:
- Started: First CI run after pushing lint fixes
- Environment: CI only (tests pass locally because localMode bypasses auth)

## Root Cause

**CRITICAL**: In `apps/frontend/src/middleware.ts`, lines 81-89:

```typescript
// 🔓 AUTH DISABLED — allow all routes without authentication
// Remove or comment this block to re-enable auth
if (
  !pathname.startsWith('/_next') &&
  !pathname.startsWith('/favicon') &&
  !pathname.includes('.')
) {
  return NextResponse.next();
}
```

This block **DISABLES ALL AUTHENTICATION** by immediately returning `NextResponse.next()` for any route that isn't a static file. This bypasses:
1. Session checks
2. Redirects to /auth for unauthenticated users
3. All protected route logic

**Why tests fail:**
1. Test "unauthenticated access to /dashboard redirects to /auth" expects redirect
2. Middleware returns `NextResponse.next()` (allows access)
3. Dashboard loads without redirect → test waits for redirect → timeout

**Why auth page tests fail:**
The auth page shows a loader when `isLoading || user` is true (line 278-283). If there's any delay in Supabase initialization, the test may timeout waiting for the form elements.

## Evidence
- timestamp: 2026-03-21T14:01:00Z
  checked: apps/frontend/src/middleware.ts lines 81-89
  found: Auth-disabled block that returns NextResponse.next() for all non-static routes
  implication: All auth checks are bypassed

- timestamp: 2026-03-21T14:02:00Z
  checked: apps/frontend/src/app/auth/page.tsx lines 277-284
  found: Auth page returns loader when isLoading or user is truthy
  implication: If Supabase is slow to initialize, tests may timeout

- timestamp: 2026-03-21T14:03:00Z
  checked: Test output "Current URL after /dashboard: http://localhost:3000/dashboard"
  found: No redirect happening, user stays on dashboard
  implication: Middleware is not enforcing auth

## Fix Options

### Option 1: Remove the auth-disabled block (RECOMMENDED)
Remove lines 81-89 in middleware.ts to re-enable authentication.

### Option 2: Conditionally disable auth only for local development
Wrap the auth-disabled block in `isLocalMode` check, similar to AuthProvider.

### Option 3: Update tests to mock authentication state
Use Playwright's storageState to mock an authenticated session.

## Recommended Fix
**Option 1** - Remove the auth-disabled block. The comment says "Remove or comment this block to re-enable auth" which suggests this was intentionally temporary but never removed.
