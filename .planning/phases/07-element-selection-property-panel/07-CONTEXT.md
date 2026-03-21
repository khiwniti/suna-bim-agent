# Phase 7: Element selection & property panel - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Implements click-to-select element interaction in the BIM 3D viewer, with a side panel showing IFC metadata, material, quantities, and property sets for the selected element. Selection is driven by OBC 2.x Highlighter click events and fragment maps. Property data is extracted via OBC IfcPropertiesManager and IfcRelationsIndexer APIs.

</domain>

<decisions>
## Implementation Decisions

### Element Selection
- Single click on 3D element triggers selection (OBC Highlighter "select" event)
- Clicking selected element again deselects (toggle behavior via expressId comparison)
- Clicking empty space deselects current element
- Multiple selection not supported — single element at a time

### Property Panel UI
- Panel rendered inside BIMViewer as an overlay (absolute positioned, right side)
- Panel shows: element type, name, globalId, storey/level, material, quantities (area, volume, length), property sets
- Collapsible sections for quantities and each property set
- X button to dismiss the panel (clears selection)
- Panel only visible when an element is selected

### Data Extraction
- Uses OBC IfcPropertiesManager via `comps.get(OBC.IfcPropertiesManager)` (optional chain — graceful if missing)
- entityAttributes map: `propsManager.entityAttributes.get(model.uuid)?.get(expressId)`
- Relations via `indexer.getEntityRelations(model, expressId, 'IsDefinedBy')` for property sets
- ContainedInStructure for storey information
- Async extraction wrapped in try/catch with fallback to minimal props

### Claude's Discretion
- Property display order and formatting within each section
- Error display when property extraction fails (shows partial data)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ElementPropertyPanel` component at `apps/frontend/src/components/thread/carbon-bim-computer/components/ElementPropertyPanel.tsx`
- `CollapsibleSection` sub-component for property sets
- `PropertyRow` sub-component for key/value display
- OBC highlighter already initialized in BIMViewer for Phase 6 (model loading) and Phase 9 (clash highlighting)

### Established Patterns
- OBC components accessed via `comps.get(ComponentClass)` with null-safe optional chaining
- Fragment map obtained via `model.getFragmentMap(expressIds[])` 
- React state for selected element: `useState<ElementProps | null>(selectedProps)`
- Async property extraction with React refs to avoid stale closure issues

### Integration Points
- `BIMViewer.tsx` — click handler + property extraction + panel render
- `BIMPanel.tsx` — passes `onElementSelect` callback prop (optional)
- `ElementPropertyPanel` accepts `ElementProps` interface from the same file

</code_context>

<specifics>
## Specific Ideas

- Panel should not block the 3D view on small screens — overlay pinned to right edge with max-width
- Property sets are collapsed by default to keep panel compact
- Quantities section is open by default (most useful at a glance)

</specifics>

<deferred>
## Deferred Ideas

- Multi-element selection for batch operations
- Cost breakdown tab within property panel (Phase 8 carbon data likely covers element-level costs)
- Pan/zoom to selected element feature

</deferred>
