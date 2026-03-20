# Phase 6: IFC model loading & performance — Plan

## Tasks

### PLAN-06-01: Streaming fetch with % progress in BIMViewer

**File:** `apps/frontend/src/components/thread/carbon-bim-computer/BIMViewer.tsx`

Replace `response.arrayBuffer()` with a ReadableStream reader:
1. Add `progress` state (`number`, 0–100) and `loadPhase` state (`'download' | 'process'`)
2. After `fetch()`, read `Content-Length` header → `totalBytes`
3. Use `response.body!.getReader()` to read chunks; accumulate into `Uint8Array`; update `progress = loaded/total * 100`
4. If no `Content-Length`, keep progress indeterminate (show spinner, not %)
5. After all chunks collected, set `loadPhase = 'process'` → fragmentIfcLoader.load()
6. Change all Thai text to English: "Loading IFC model..." / "Processing model..." / "Failed to load model"

**UI:**
- Download phase: progress bar + "Downloading... 72%"
- Process phase: spinner + "Processing model..."
- Error: existing error box, English text

### PLAN-06-02: Improve error state presentation

**File:** `apps/frontend/src/components/thread/carbon-bim-computer/BIMViewer.tsx`

Current error state is minimal. Improve:
- Show error icon (Lucide `AlertTriangle`) before message
- Show "Retry" button that resets error state and re-triggers `initViewer` (via a `retryKey` state counter added to `useEffect` deps)
- Keep same layout (`flex items-center justify-center h-full`)

### PLAN-06-03: Commit and verify

After both tasks pass TypeScript check, commit:
`feat(06): streaming IFC loader with progress bar and English UI`
