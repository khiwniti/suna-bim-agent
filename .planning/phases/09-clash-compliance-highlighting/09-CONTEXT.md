# Phase 9: Clash & compliance highlighting - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Add visual highlights in the 3D viewer: red for clashing elements, yellow for non‑compliant elements, based on backend analysis tools.
</domain>

<decisions>
## Implementation Decisions

### Highlight Rendering
- Reuse existing viewer overlay layer.
- Use red colour for clash, yellow for compliance.
</decisions>

<code_context>
## Existing Code Insights

- Clash tool in `backend/core/tools/bim/clash_tool.py`.
- Compliance tool in `backend/core/tools/bim/compliance_tool.py`.
</code_context>

<specifics>
## Specific Ideas

- Show tooltip with clash details on hover.
</specifics>

<deferred>
## Deferred Ideas

- Real‑time clash detection during editing (future).
</deferred>
