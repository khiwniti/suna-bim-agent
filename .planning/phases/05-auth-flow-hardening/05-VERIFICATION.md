status: passed

# Phase 5: Auth flow hardening — Verification

**Date:** 2026-03-20
**Phase:** 05

## Must-haves Verified

- [x] `/api/auth/send-otp` rate-limited: 3 attempts per email per 60s; 4th returns `429` with `Retry-After` header
- [x] `returnUrl` open-redirect blocked: external URLs (not starting with `/`) silently fall back to `/dashboard`
- [x] `returnUrl` same-origin paths preserved: `/dashboard`, `/agents/123` etc. pass through unchanged
- [x] Auto-send error feedback already in place: `autoSendError` state shows "We couldn't send a code automatically" copy
- [x] E2E tests added for all three hardening areas (rate limit, external returnUrl, safe returnUrl)

## Human Verification Required

1. Visit `/auth?returnUrl=https://evil.com` → confirm redirect goes to `/dashboard` (not `evil.com`) after login
2. Click "Send OTP" 4 times rapidly → confirm 4th shows rate limit error message in UI
3. Visit `/auth?expired=true&email=test@example.com` → confirm auto-send attempt shows spinner

## Notes

- Rate limiter is in-memory (Map) — resets if serverless instance cold-starts; this is acceptable for beta
- Auth middleware intentionally left disabled (out of scope per Smart Discuss decision)
- `returnUrl` fix is client-side in `auth/page.tsx`; server-side (actions.ts) uses Supabase redirects which go to `/auth/callback` — not exposed to open redirect
