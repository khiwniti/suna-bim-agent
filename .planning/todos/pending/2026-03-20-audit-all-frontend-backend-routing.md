---
created: 2026-03-20T02:27:31.737Z
title: Audit all frontend-backend routing
area: api
files:
  - docker-compose.prod.yaml:65-73
  - apps/frontend/src/app/api/auth/send-otp/route.ts
  - apps/frontend/src/app/auth/page.tsx:28
  - apps/frontend/src/app/layout.tsx
  - .github/workflows/deploy-azure-aca.yml
---

## Problem

Several routing issues were found in production (`carbon-bim.ensimu.space`):

1. **Traefik rule too broad** — `PathPrefix('/api', '/v1')` intercepted ALL `/api/*` requests (including Next.js API routes like `/api/auth/send-otp`) and sent them to FastAPI, causing 404s. Fixed to `PathPrefix('/api/v1', '/v1')` but needs a full audit to catch similar misroutes.

2. **Font preload duplicate** — Manual `<link rel="preload">` in `layout.tsx` conflicted with Next.js `localFont` auto-preload, causing browser warnings.

3. **CI/CD deploy step missing** — The `deploy` job in `.github/workflows/deploy-azure-aca.yml` had an empty `steps:` block — no actual `az containerapp update` SSH step was ever added. ACA was never being updated on push.

4. **Image registry mismatch** — `docker-compose.prod.yaml` references `ghcr.io/...` images, but CI/CD only pushed to ACR. Images on the VM were never updated by the pipeline.

A full routing audit is needed to ensure:
- All Next.js API routes (`/api/auth/*`, `/api/...`) are NOT intercepted by Traefik
- All backend API calls go through `/api/v1/*` or `/v1/*` correctly
- ACA container apps receive traffic on correct ports
- The CI/CD pipeline actually deploys all environments end-to-end

## Solution

1. Map every route in `apps/frontend/src/app/api/` and verify Traefik lets them through
2. Map every backend endpoint under `backend/core/` and verify they're reachable via `/api/v1/` from the frontend
3. Verify Traefik middleware chain: `strip-api` only strips `/api` from `/api/v1/*`, not from `/api/auth/*`
4. Complete the ACA workflow: add the missing SSH+`az containerapp update` step
5. Fix GHCR push in CI/CD so docker-compose.prod.yaml images stay current
6. Add an end-to-end smoke test: login → send OTP → dashboard load
