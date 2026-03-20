# Carbon BIM — Project State

## Current Status

- **Active Milestone:** Milestone 1 — Production-Ready Deployment
- **Current Phase:** Phase 4 — End-to-end testing (not planned yet)
- **Last completed:** Phase 3 — Routing Audit & Bug Fixes

## Accumulated Context

### Roadmap Evolution

- Phase 1 added: Azure ACA Deployment ✅
- Phase 2 added: CI/CD Pipeline ✅
- Phase 3 added: Routing Audit & Bug Fixes ✅
- Phase 4 added: End-to-end testing
- Phase 5 added: Auth flow hardening

### Key Decisions

- ACR name derived from subscription ID: `carbonbimbc6740962ecd`
- ACA env domain: `bluesand-d188d0a3.southeastasia.azurecontainerapps.io`
- VM prod site: `carbon-bim.ensimu.space` (Traefik + docker-compose.prod.yaml)
- CI/CD uses `coder-vm` managed identity (`az login --identity`) — no service principal needed
- `NEXT_PUBLIC_BACKEND_URL` baked into frontend image at build time

### Pending Todos

- 0 pending todos (all routing audit fixes committed)
