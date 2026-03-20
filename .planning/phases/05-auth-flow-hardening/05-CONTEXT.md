# Phase 5: Auth flow hardening — Context

## Decision Log (Smart Discuss)

| Question | Decision |
|---|---|
| Re-enable auth middleware? | No — keep disabled; harden OTP/session UX only |
| `returnUrl` open redirect? | Add same-origin validation (block external URLs, allow `/` paths only) |
| Rate limiting strategy? | In-memory Map, 60s window, 3 attempts per email |

## Current State

- `/api/auth/send-otp/route.ts` — no rate limiting, correct OTP dispatch
- `apps/frontend/src/app/auth/page.tsx` — `returnUrl` used without validation
- `middleware.ts` — auth intentionally disabled (beta); untouched this phase
- Session expiry: `?expired=true&email=` → auto-resend OTP — logic exists but has no user feedback when auto-send fails

## Scope

1. Rate-limit OTP endpoint (in-memory, serverless-compatible)
2. Validate `returnUrl` in auth page (client-side + server-side)
3. Improve expired session error feedback in auth page
4. Verify flow end-to-end with Playwright test assertions

## Out of Scope

- Re-enabling auth middleware
- Redis-based distributed rate limiting
- Changing OTP code length or expiry time
