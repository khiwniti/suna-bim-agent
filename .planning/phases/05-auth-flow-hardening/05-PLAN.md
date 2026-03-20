# Phase 5: Auth flow hardening — Plan

## Tasks

### PLAN-05-01: Rate-limit `/api/auth/send-otp`

**File:** `apps/frontend/src/app/api/auth/send-otp/route.ts`

Add in-memory rate limiter:
- `Map<email, { count: number; resetAt: number }>`
- 3 attempts per 60 seconds per email (module-level singleton)
- Return `429` with `Retry-After` header when exceeded
- Case-insensitive email key (already lowercased in current code)

### PLAN-05-02: Validate `returnUrl` — prevent open redirect

**File:** `apps/frontend/src/app/auth/page.tsx`

Add `sanitizeReturnUrl(url: string | null): string` helper:
- Returns `/dashboard` if url is null/empty
- Returns `/dashboard` if url doesn't start with `/` (blocks `https://evil.com`)
- Returns url as-is if it starts with `/`

Apply to all three places returnUrl is used:
1. `router.replace(returnUrl || '/dashboard')` on already-authed redirect
2. `formData.append('returnUrl', finalReturnUrl)` in magic-link handler
3. `formData.set('returnUrl', returnUrl || '/dashboard')` in OTP handler

### PLAN-05-03: Improve expired-session error feedback

**File:** `apps/frontend/src/app/auth/page.tsx`

When auto-resend OTP fails (catch block in the `isExpired` useEffect):
- Currently: `setError('...')` — OK but no visual distinction
- Add: `setAutoSendError(true)` state flag → show a yellow banner "Session expired. We tried to send a new code but failed — please enter your email below."
- Clear banner on any user email input

### PLAN-05-04: Update E2E tests to cover hardening

**File:** `apps/frontend/e2e/auth-flow.spec.ts`

Add:
1. Test that 4th OTP request in 60s returns 429 (mock the rate limiter header)
2. Test that `returnUrl=https://evil.com` redirects to `/dashboard` (not evil.com)
3. Test expired+auto-send-fail shows error banner

Status: done when all three assertions pass.
