# Phase 11: Migrate theme and styles from src.zip to project — Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Move the UI theme, CSS variables, and component styles packaged in `src.zip` into the project's proper design‑system files, updating imports and ensuring visual parity.
</domain>

<decisions>
## Implementation Decisions

- Use Tailwind config for theme tokens.
- Migrate component styles to `apps/frontend/src/components`.
- Update `tailwind.config.js` with new colour palette.
</decisions>

<code_context>
## Existing Code Insights

- Current theme resides in `src.zip` under `theme/`.
- Tailwind config at `apps/frontend/tailwind.config.js`.
- Component library uses `className` utilities.
</code_context>

<specifics>
## Specific Ideas

- Preserve existing dark mode support.
- Add documentation for new design tokens.
</specifics>

<deferred>
## Deferred Ideas

- Full design‑system audit after migration.
</deferred>
