# Phase 6: IFC model loading & performance — Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Improve BIMViewer IFC model loading: streaming fetch with % progress bar, better error states, English UI text. No changes to element selection or analysis tools (those are Phase 7+).

</domain>

<decisions>
## Implementation Decisions

### Loading Progress
- Show % progress bar during IFC loading (replacing spinner-only)
- Track download progress via ReadableStream + Content-Length header
- Progress bar covers download phase; spinner remains for parse/init phase

### Streaming Approach
- Replace `response.arrayBuffer()` with ReadableStream reader
- Track bytes read vs `Content-Length` for download %
- Fallback to indeterminate progress if `Content-Length` missing (CORS/chunked)

### Language
- Change all Thai text to English
- "Loading IFC model..." for loading state
- "Failed to load model" for error state (already partially English)

### Claude's Discretion
- Progress bar component style (use existing Tailwind classes; no new UI library)
- Whether to split download % from parse % (implementation detail)
- Mounting guards strategy (preserve existing Fix 3 pattern)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BIMViewer.tsx` — 164 lines; uses `@thatopen/components` + `@thatopen/components-front`
- `BIMPanel.tsx` — lazy-loads BIMViewer; has `BIMViewerSkeleton` component
- `carbon-bim-computer-store.ts` — Zustand store with `loadedModel`, `selectedElements`
- Tailwind CSS classes available; `bg-primary`, `border-primary` for progress bar

### Established Patterns
- `useRef` for mounted guard (`Fix 3` pattern — already in BIMViewer)
- `useRef` for callback refs (Fix 1 pattern)
- Dynamic imports for `@thatopen` (avoids SSR issues)
- `animate-spin` spinner pattern used elsewhere

### Integration Points
- `BIMPanel.tsx` passes `modelUrl={loadedModel.filePath}` to BIMViewer
- Error state renders in `<div className="flex items-center justify-center h-full">`
- Loading overlay uses `absolute inset-0` positioning

</code_context>

<specifics>
## Specific Ideas

- Progress bar: `<div className="w-full bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full transition-all" style={{width: `${progress}%`}} /></div>`
- Two-phase display: "Downloading... 72%" then "Processing model..." (spinner only)
- ReadableStream reader accumulates chunks into Uint8Array for fragmentIfcLoader

</specifics>

<deferred>
## Deferred Ideas

- Web Worker offload for IFC parsing (thatopen supports it but requires worker file setup — defer to future phase)
- LOD (Level of Detail) streaming for very large models — defer
- Cancel loading on unmount already handled by `mounted` flag — no streaming abort controller needed for MVP

</deferred>
