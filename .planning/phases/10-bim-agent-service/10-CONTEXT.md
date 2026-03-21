# Phase 10: Bim‑agent service — Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement a specialised Embodied Carbon Analyst agent service exposing endpoints for carbon factor lookup, lifecycle accounting, and design‑optimisation recommendations.
</domain>

<decisions>
## Implementation Decisions

- Register new FastAPI router at `/bim/carbon-agent`.
- Add `EmbodiedCarbonServiceTool` with four sub‑tools.
</decisions>

<code_context>
## Existing Code Insights

- Existing BIM tools in `backend/core/tools/bim/`.
- API entry point `backend/api.py`.
</code_context>

<specifics>
## Specific Ideas

- Use Thai TGO emission factors JSON.
- Follow EN 15978 lifecycle stages.
</specifics>

<deferred>
## Deferred Ideas

- Future integration with design‑optimisation UI.
</deferred>
