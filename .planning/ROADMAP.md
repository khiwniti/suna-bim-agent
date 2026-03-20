# Carbon BIM — Project Roadmap

## Milestone 1: Production-Ready Deployment

Goal: Stable, fully automated deployment with seamless frontend-backend connectivity on Azure.

**Progress:**
- [x] Phase 1: Azure ACA Deployment (completed 2026-03-17)
- [x] Phase 2: CI/CD Pipeline (completed 2026-03-17)
- [x] Phase 3: Routing Audit & Bug Fixes (completed 2026-03-20)
- [x] Phase 4: End-to-end testing (completed 2026-03-20)
- [x] Phase 5: Auth flow hardening (completed 2026-03-20)
- [x] Phase 10: bim-agent-service (completed 2026-03-20)
- [x] Phase 11: Migrate theme and styles (completed 2026-03-20)

### Phase 1: Azure ACA Deployment

**Goal:** Deploy full stack (frontend, backend, Redis) to Azure Container Apps
**Status:** ✅ Complete
**Depends on:** —
**Plans:** 0/0 plans complete

Plans:
- [x] Create idempotent ACA deployment script
- [x] Register Azure providers and create ACR
- [x] Deploy Redis, backend, frontend container apps

### Phase 2: CI/CD Pipeline

**Goal:** GitHub Actions auto-deploy on every push to main/staging; push to ACR + GHCR; SSH deploy to ACA and VM prod stack
**Status:** ✅ Complete
**Depends on:** Phase 1
**Plans:** 0/0 plans complete

Plans:
- [x] Build and push images to ACR and GHCR
- [x] SSH into Azure VM using managed identity
- [x] Deploy to ACA and restart VM prod stack

### Phase 3: Routing Audit & Bug Fixes

**Goal:** Ensure all frontend ↔ backend routes are seamlessly connected; fix Traefik rules, env vars, and missing API routes
**Status:** ✅ Complete
**Depends on:** Phase 2
**Plans:** 0/0 plans complete

Plans:
- [x] Tighten Traefik PathPrefix rule
- [x] Fix BACKEND_URL env var in route handlers
- [x] Create missing /api/composio and /api/boq proxy routes
- [x] Add POST /bim/boq/analyze backend endpoint
- [x] Remove duplicate font preload

### Phase 4: End-to-end testing

**Goal:** Playwright E2E test suite covering auth flow, dashboard smoke, and API routing regressions; CI gate blocks deploy on failure
**Status:** ✅ Complete
**Depends on:** Phase 3
**Plans:** 0/1 plans

**Status:** ✅ Complete

Plans:
- [x] TBD (run /gsd-plan-phase 4 to break down) (completed 2026-03-20)

### Phase 5: Auth flow hardening

**Goal:** Rate-limit OTP endpoint (3/60s → 429), block open-redirect in returnUrl, add E2E coverage for hardening
**Status:** ✅ Complete
**Depends on:** Phase 4
**Plans:** 0/1 plans

**Status:** ✅ Complete

Plans:
- [x] TBD (run /gsd-plan-phase 5 to break down) (completed 2026-03-20)

### Phase 10: bim-agent-service

**Goal:** Specialized Embodied Carbon Analyst agent — Thai TGO emission factors, EN 15978 lifecycle accounting, TREES certification rating, and design optimization roadmap.
**Requirements**: Enhanced `carbon_tool.py` + new `EmbodiedCarbonServiceTool` + specialized agent system prompt + REST API endpoints
**Depends on:** Phase 6
**Status:** ✅ Complete
**Plans:** 1/1 plans complete

Plans:
- [x] Implement embodied carbon specialist service (completed 2026-03-20)
  - Enhanced `backend/core/tools/bim/carbon_tool.py`: TGO factors, EN 15978 stages, `optimize_carbon`, `calculate_carbon_lifecycle`
  - Created `backend/core/tools/bim/embodied_carbon_service.py`: `EmbodiedCarbonServiceTool` with 4 tools
  - Created `backend/core/agents/embodied_carbon_prompt.py`: Embodied Carbon Analyst system prompt
  - Created `backend/core/bim/carbon_agent_api.py`: REST API `/bim/carbon-agent/{analyze,optimize,benchmark,factors}`
  - Registered `bim_embodied_carbon_service_tool` in `tool_registry.py`
  - Registered router in `api.py`

### Phase 11: Migrate theme and styles from src.zip to project

**Goal:** Full theme migration from src.zip to project
**Requirements**: globals.css update + TypeScript theme tokens
**Depends on:** Phase 10
**Status:** ✅ Complete
**Plans:** 1/1 plans complete

Plans:
- [x] Migrate hex color system + utility classes + TypeScript tokens (completed 2026-03-20)

---

## Milestone 2: BIM 3D Viewer Improvements

Goal: Deliver a polished, interactive BIM 3D viewer with element selection, carbon data overlay, clash highlighting, and smooth UX.

**Progress:**
- [x] Phase 6: IFC model loading & performance (completed 2026-03-20)
- [x] Phase 7: Element selection & property panel (completed 2026-03-20)
- [x] Phase 8: Carbon data overlay in viewer (completed 2026-03-20)
- [x] Phase 9: Clash & compliance highlighting (completed 2026-03-20)

### Phase 6: IFC model loading & performance

**Goal:** Robust IFC loading in BIMViewer with progress feedback, error states, and performance optimisation (streaming, LOD, worker offload)
**Depends on:** —
**Status:** ✅ Complete
**Plans:** 1/1 plans complete

Plans:
- [x] IFC model loading with progress feedback, error states, retry (completed 2026-03-20)

### Phase 7: Element selection & property panel

**Goal:** Click/hover element selection in 3D view triggers a property panel showing IFC metadata, material, and cost breakdown
**Depends on:** Phase 6
**Status:** ✅ Complete
**Plans:** 1/1 plans complete

Plans:
- [x] Element click selection + ElementPropertyPanel overlay (completed 2026-03-20)

### Phase 8: Carbon data overlay in viewer

**Goal:** Colour-code 3D elements by embodied-carbon intensity; legend panel with total/element-level CO₂ values from backend carbon tool
**Depends on:** Phase 7
**Status:** ✅ Complete
**Plans:** 1/1 plans complete

Plans:
- [x] Carbon intensity heat-map coloring + legend panel (completed 2026-03-20)

### Phase 9: Clash & compliance highlighting

**Goal:** Highlight clashing elements (red) and non-compliant elements (yellow) from backend clash/compliance tools directly in the 3D viewer
**Depends on:** Phase 8
**Status:** ✅ Complete
**Plans:** 1/1 plans complete

Plans:
- [x] Clash & compliance 3D element highlighting (completed 2026-03-20)
