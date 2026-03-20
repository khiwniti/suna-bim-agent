---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 04
status: unknown
last_updated: "2026-03-20T04:06:45.279Z"
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 2
  completed_plans: 0
---

# Carbon BIM — Project State

## Current Status

- **Active Milestone:** Milestone 1 — Production-Ready Deployment
- **Current Phase:** 04
- **Last completed:** Phase 3 — Routing Audit & Bug Fixes

## Accumulated Context

### Roadmap Evolution

- Phase 1 added: Azure ACA Deployment ✅
- Phase 2 added: CI/CD Pipeline ✅
- Phase 3 added: Routing Audit & Bug Fixes ✅
- Phase 4 added: End-to-end testing ✅
- Phase 5 added: Auth flow hardening ✅
- Phase 6 added: IFC model loading & performance ✅
- Phase 7 added: Element selection & property panel
- Phase 8 added: Carbon data overlay in viewer
- Phase 9 added: Clash & compliance highlighting
- Phase 10 added: bim-agent-service

### Key Decisions

- ACR name derived from subscription ID: `carbonbimbc6740962ecd`
- ACA env domain: `bluesand-d188d0a3.southeastasia.azurecontainerapps.io`
- VM prod site: `carbon-bim.ensimu.space` (Traefik + docker-compose.prod.yaml)
- CI/CD uses `coder-vm` managed identity (`az login --identity`) — no service principal needed
- `NEXT_PUBLIC_BACKEND_URL` baked into frontend image at build time

### Pending Todos

- 0 pending todos (all routing audit fixes committed)
