# Carbon BIM — Project Roadmap

## Milestone 1: Production-Ready Deployment

Goal: Stable, fully automated deployment with seamless frontend-backend connectivity on Azure.

### Phase 1: Azure ACA Deployment

**Goal:** Deploy full stack (frontend, backend, Redis) to Azure Container Apps
**Status:** ✅ Complete
**Depends on:** —
**Plans:** scripts/deploy-azure-aca.sh

Plans:
- [x] Create idempotent ACA deployment script
- [x] Register Azure providers and create ACR
- [x] Deploy Redis, backend, frontend container apps

### Phase 2: CI/CD Pipeline

**Goal:** GitHub Actions auto-deploy on every push to main/staging; push to ACR + GHCR; SSH deploy to ACA and VM prod stack
**Status:** ✅ Complete
**Depends on:** Phase 1
**Plans:** .github/workflows/deploy-azure-aca.yml

Plans:
- [x] Build and push images to ACR and GHCR
- [x] SSH into Azure VM using managed identity
- [x] Deploy to ACA and restart VM prod stack

### Phase 3: Routing Audit & Bug Fixes

**Goal:** Ensure all frontend ↔ backend routes are seamlessly connected; fix Traefik rules, env vars, and missing API routes
**Status:** ✅ Complete
**Depends on:** Phase 2
**Plans:** .planning/phases/03-routing-audit/

Plans:
- [x] Tighten Traefik PathPrefix rule
- [x] Fix BACKEND_URL env var in route handlers
- [x] Create missing /api/composio and /api/boq proxy routes
- [x] Add POST /bim/boq/analyze backend endpoint
- [x] Remove duplicate font preload

### Phase 4: End-to-end testing

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 3
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 4 to break down)

### Phase 5: Auth flow hardening

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 4
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 5 to break down)
