# Phase 8: Carbon data overlay in viewer - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement colour‑coded overlay of embodied‑carbon intensity on 3D BIM elements, with legend panel.
</domain>

<decisions>
## Implementation Decisions

### UI Design
- Use existing Viewer overlay component.
- Add legend dropdown.
</decisions>

<code_context>
## Existing Code Insights

- Viewer framework in `apps/frontend/src/components/BIMViewer`.
- Colour utilities in `src/lib/color.ts`.
</code_context>

<specifics>
## Specific Ideas

- Map carbon intensity to a 5‑step color gradient.
</specifics>

<deferred>
## Deferred Ideas

- Real‑time carbon updates (future).
</deferred>
