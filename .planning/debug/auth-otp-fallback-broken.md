---
status: investigating
trigger: "auth-otp-fallback-broken — Send verification code button does nothing on /auth?expired=true"
created: 2025-01-31T00:00:00Z
updated: 2025-01-31T00:00:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED — Three compounding failures prevent the OTP flow from working
test: n/a — root cause confirmed through code analysis
expecting: n/a
next_action: Apply fix — replace backendApi calls with Supabase client signInWithOtp, update verifyOtp type, use local state for loading

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: User lands on /auth?expired=true, types email, clicks "Send verification code", receives 6-digit OTP in email, enters OTP, logs in
actual: Clicking "Send verification code" does nothing — no network request, no spinner, no toast, no redirect
errors: |
  - "Uncaught (in promise) Error: A listener indicated an asynchronous response..."
  - WebSocket connection to ws://localhost:8081/ failed (extension noise)
  - Resource preload warning
reproduction: Visit https://carbon-bim.ensimu.space/auth?expired=true&returnUrl=%2Fdashboard, type any email, click "Send verification code"
started: Never worked since deployment
environment: Production only (https://carbon-bim.ensimu.space)

## Eliminated
<!-- APPEND only - prevents re-investigating -->

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2025-01-31T00:01:00Z
  checked: apps/frontend/src/app/auth/page.tsx lines 101-128 and 274-309
  found: handleSendOtpCode and the auto-send useEffect both call `backendApi.post('/auth/send-otp', { email })`
  implication: These calls depend on NEXT_PUBLIC_BACKEND_URL being set

- timestamp: 2025-01-31T00:02:00Z
  checked: .env and .env.dokploy
  found: NEXT_PUBLIC_BACKEND_URL= (empty string) in BOTH production config files
  implication: API_URL = '' so all backendApi calls go to relative /auth/send-otp on the frontend server, which is a 404 (frontend has no such route)

- timestamp: 2025-01-31T00:03:00Z
  checked: apps/frontend/src/lib/toast.ts
  found: toast.error() and toast.success() are BOTH intentionally no-ops ("suppress success/error notifications to reduce UI noise")
  implication: ALL error and success feedback from the OTP flow is silently swallowed — no toast ever shows even if the call fails

- timestamp: 2025-01-31T00:04:00Z
  checked: apps/frontend/src/app/auth/actions.ts lines 306-342
  found: verifyOtp server action uses type: 'magiclink' for Supabase OTP verification
  implication: If we switch OTP sending to client-side signInWithOtp (which sends email-type OTP), verifyOtp needs type: 'email'

- timestamp: 2025-01-31T00:05:00Z
  checked: apps/frontend/src/components/ui/submit-button.tsx
  found: SubmitButton uses useActionState(formAction) + useFormStatus for pending state. With client-side async function and no-op toast, there's no visible feedback at all.
  implication: The spinner never shows because the network call fails fast (404 to frontend server) and toast.error is a no-op

- timestamp: 2025-01-31T00:06:00Z
  checked: backend/auth/api.py and backend/api.py
  found: Auth router IS registered at /v1/auth/send-otp, but NEXT_PUBLIC_BACKEND_URL being empty means it never reaches this endpoint
  implication: The backend endpoint is correct; the problem is 100% on the frontend configuration and toast suppression

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: |
  Three compounding failures:
  1. NEXT_PUBLIC_BACKEND_URL='' (empty) in both .env and .env.dokploy — backendApi.post('/auth/send-otp', ...) 
     builds URL as '' + '/auth/send-otp' = '/auth/send-otp', hitting the Next.js frontend server which returns 404
  2. apps/frontend/src/lib/toast.ts: toast.error() and toast.success() are intentionally no-ops — 
     ALL error/success feedback is silently swallowed, so even the 404 failure produces no visible feedback
  3. verifyOtp server action uses type:'magiclink' but client-side signInWithOtp sends email-type OTP

fix: |
  1. Replace backendApi.post('/auth/send-otp') with direct Supabase client signInWithOtp call (no backend needed)
  2. Use local React state (isSending + otpSendError) for loading/error display instead of toast + SubmitButton
  3. Update verifyOtp action to use type:'email' to match client-side signInWithOtp token type

verification: pending
files_changed:
  - apps/frontend/src/app/auth/page.tsx
  - apps/frontend/src/app/auth/actions.ts
