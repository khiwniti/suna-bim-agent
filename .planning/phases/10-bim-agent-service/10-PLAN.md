---
phase: "10"
name: "Bim‑agent service"
created: 2026-03-20
---

# Phase 10: Bim‑agent service — Plan

## Wave 1: Service scaffolding
- [ ] Add FastAPI router `bim/carbon-agent`.
- [ ] Implement endpoint `/analyze`.
- [ ] Implement endpoint `/optimize`.
- [ ] Implement endpoint `/benchmark`.
- [ ] Implement endpoint `/factors`.

## Wave 2: Tool implementation
- [ ] Create `EmbodiedCarbonServiceTool` in `backend/core/tools/bim/embodied_carbon_service.py`.
- [ ] Add sub‑tools for calculation, optimisation, benchmarking, factor lookup.

## Wave 3: Integration & testing
- [ ] Register tool in `tool_registry.py`.
- [ ] Write unit tests for each sub‑tool.
- [ ] Add integration tests for API endpoints.
