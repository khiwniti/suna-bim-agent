# Carbon BIM Backend — Deep Analysis

**Analysis Date:** 2026-03-19  
**Scope:** `backend/` — Python/FastAPI service for Building Information Modeling (BIM) analysis

---

## 1. Architecture Overview

### 1.1 Entry Point: `backend/api.py`

The application is a FastAPI app with a single `APIRouter` mounted under `/v1`. Startup is managed via the `@asynccontextmanager lifespan()` hook.

**Registered Routers (in `api.py` lines 415–506):**

| Router | Mount Prefix | Notes |
|--------|-------------|-------|
| `versioning_router` | (default) | API versioning |
| `agent_runs_router` | (default) | Run start/stop/stream |
| `agent_crud_router` | (default) | Agent CRUD |
| `agent_tools_router` | (default) | Tool enumeration |
| `threads_router` | (default) | Thread/message management |
| `billing_router` | (default) | Stripe billing |
| `sandbox_api.router` | (default) | Sandbox lifecycle |
| `bim_router` | `/v1/bim` | **BIM-specific endpoints** |
| 20+ other routers | various | Admin, auth, notifications, etc. |

**BIM Router Registration (line 504–506):**
```python
from core.bim.api import router as bim_router
api_router.include_router(bim_router)
```
The BIM router is conditionally registered last, after all other routers.

**Startup Logic (lifespan):**
1. `DBConnection().initialize()` — PostgreSQL connection pool
2. `init_db()` — Prisma init
3. `warm_up_tools_cache()` — Pre-loads tool schemas to avoid first-request delay
4. `load_static_suna_config()` — Caches agent config
5. Redis initialization + tier cache invalidation
6. `cleanup_orphaned_agent_runs()` — Marks stuck runs as failed
7. Worker metrics, memory watchdog, and stream cleanup background tasks

**Middleware:**
- CORS: `allow_origin_regex = r"https://([a-z0-9-]+\.)?carbon-bim\.com|..."` — explicitly scoped to Carbon BIM domains
- IP rate limiter: Max 25 concurrent IPs (`MAX_CONCURRENT_IPS = 25`)
- Request ID injection

---

### 1.2 `core/` Directory Structure

```
core/
├── agentpress/              # Agent execution engine
│   ├── tool.py              # Tool base class, ToolResult, decorators
│   ├── tool_registry.py     # Per-thread tool registry with caching
│   ├── context_manager.py   # Context window compression
│   ├── thread_manager/      # Main orchestration layer
│   │   ├── manager.py       # ThreadManager — top-level API
│   │   └── services/
│   │       ├── execution/
│   │       │   ├── llm_executor.py       # Validates, compresses, calls LLM
│   │       │   └── orchestrator.py       # ExecutionOrchestrator pipeline
│   │       ├── messages/
│   │       │   ├── fetcher.py            # Fetch+cache thread messages
│   │       │   └── preparer.py           # Build LLM message array
│   │       └── state/
│   │           ├── auto_continue.py      # Loop control (max 25 turns)
│   │           └── thread_state.py       # Image presence detection
├── agents/
│   ├── api.py               # HTTP routes for runs
│   ├── runner/
│   │   ├── executor.py      # execute_agent_run() — async task entry
│   │   └── tool_manager.py  # ToolManager — registers tools per run
│   └── pipeline/stateless/  # StatelessCoordinator + resilience
├── bim/
│   ├── api.py               # /bim/upload and /bim/health
│   └── __init__.py
├── tools/
│   ├── tool_registry.py     # Static tool manifest + loader
│   ├── bim/                 # BIM tool implementations (see §2)
│   │   ├── base.py
│   │   ├── ifc_parser_tool.py
│   │   ├── carbon_tool.py
│   │   ├── clash_detection_tool.py
│   │   ├── compliance_tool.py
│   │   ├── mep_tool.py
│   │   └── knowledge_graph_tool.py
│   └── sb_*.py              # Sandbox tools
└── ai_models/registry.py    # Model catalog with pricing
```

---

### 1.3 Agent Execution Pipeline

```
HTTP POST /v1/runs
    │
    ▼
core/agents/api.py          → validates auth, creates DB run record
    │
    ▼
core/agents/runner/executor.py → execute_agent_run()
    │                           (async background task)
    ├── ToolManager._register_bim_tools()   ← registers BIM tools
    │
    ▼
StatelessCoordinator.execute(ctx)
    │
    ▼
ThreadManager.run_thread()
    │
    ├── AutoContinueManager.run_generator()   (loop up to 25 iterations)
    │       │
    │       ▼
    │   _execute_run()
    │       │
    │       ▼
    │   ExecutionOrchestrator.execute_pipeline()
    │       │
    │       ├── MessagePreparer.prepare()       → build message array
    │       ├── LLMExecutor.validate_and_repair_tool_calls()  → fix orphaned pairs
    │       ├── LLMExecutor.check_and_apply_late_compression() → token budget
    │       └── LLMExecutor.execute()           → make_llm_api_call()
    │
    ▼
Response stream → Redis stream → SSE to client
```

**Key Pipeline Characteristics:**
- All LLM messages validated for tool call pairing before each send
- Late compression fires if token count exceeds context window safety threshold
- Stop signals polled from Redis every `STOP_CHECK_INTERVAL` seconds
- Timing events (`⏱️ [TIMING]`) logged throughout for performance tracing

---

### 1.4 Tool Registry System

Two distinct registry layers:

**Static manifest** (`core/tools/tool_registry.py`):
- Declares `BIM_TOOLS`, `CORE_TOOLS`, `SANDBOX_TOOLS`, etc. as tuples of `(name, module_path, class_name)`
- `get_all_tools()` uses `importlib.import_module` with silent `ImportError` suppression
- `ALL_TOOLS` concatenates all categories — but `get_tools_by_category()` **omits `BIM_TOOLS`** (see §3)

**Runtime registry** (`core/agentpress/tool_registry.py`):
- `ToolRegistry` holds a dict of `{func_name: {instance, schema}}`
- Caches tool instances and schemas via `tool_discovery.py` for warm-path efficiency
- Schema cache is invalidated on each `register_tool()` call

**BIM Tool Registration Path:**
```python
# core/agents/runner/tool_manager.py
def _register_bim_tools(self):
    for tool_name in ['bim_ifc_parser_tool', 'bim_carbon_tool', ...]:
        tool_class = get_tool_class(module_path, class_name)
        self.thread_manager.add_tool(
            tool_class,
            project_id=self.project_id,
            thread_manager=self.thread_manager,
        )
```
BIM tools always register (no config guard), receive `project_id` and `thread_manager` for sandbox access.

---

## 2. BIM-Specific Tools Deep Dive

All BIM tools live in `core/tools/bim/`. They inherit `BIMToolBase → SandboxToolsBase → Tool`.

### 2.1 IFCParserTool (`ifc_parser_tool.py`)

**Purpose:** Parse IFC files and extract element metadata.

**Methods:**

| Method | Signature | Returns |
|--------|-----------|---------|
| `parse_ifc` | `(file_path: str) → ToolResult` | Project info, element counts by type, storey list |
| `query_elements` | `(file_path: str, ifc_type: str, limit: int = 50) → ToolResult` | List of elements with properties |

**Data Flow:**
```
file_path → load_ifc_content() → sandbox.files.read(bytes)
          → _open_ifc_from_bytes() → tempfile → ifcopenshell.open()
          → ifc_model.by_type(entity) → get_element_properties()
          → JSON response
```

**Covered IFC Types (parse_ifc):**
`IfcWall, IfcSlab, IfcBeam, IfcColumn, IfcDoor, IfcWindow, IfcRoof, IfcStair, IfcRailing, IfcPipeSegment, IfcDuctSegment, IfcSpace`

**Limitations:**
- No `IfcCurtainWall`, `IfcOpeningElement`, `IfcFoundation`, `IfcFurnishingElement`, `IfcSite`
- `query_elements` has no pagination beyond `limit` — returns `elements[:limit]` but full `len(elements)` count, so the caller cannot page through large sets
- `_open_ifc_from_bytes()` is **synchronous** and called directly in an `async def` (blocks the event loop for large IFC files; see §3.1)
- `_open_ifc_from_bytes()` is **duplicated** in every tool class — should be on `BIMToolBase` (see §3.5)

**Error Handling:** Bare `except Exception as e` with `logger.error` and `fail_response` — catches everything but provides no structured error classification.

---

### 2.2 CarbonCalculationTool (`carbon_tool.py`)

**Purpose:** Calculate embodied carbon (kgCO2e) using static material factors.

**Method:**

| Method | Signature | Returns |
|--------|-----------|---------|
| `calculate_carbon` | `(file_path: str, include_breakdown: bool = True) → ToolResult` | `total_co2`, `breakdown`, `element_highlights` |

**Carbon Coefficients (kgCO2e/m³):**
```python
CARBON_COEFFICIENTS = {
    'concrete': 350,    # reinforced concrete
    'steel': 11461,     # density 7850 kg/m³ × 1.46 kgCO2e/kg
    'timber': -500,     # sequestered carbon
    'glass': 62.5,
    'aluminum': 22248,
    'default': 300,
}
```

**Element → Material Mapping (hardcoded):**
```python
ELEMENT_MATERIAL_MAP = {
    'IfcWall': ('concrete', 0.8),
    'IfcSlab': ('concrete', 1.5),
    'IfcBeam': ('steel', 0.3),
    'IfcColumn': ('concrete', 0.5),
    'IfcRoof': ('concrete', 1.2),
}
```

**Critical Limitations:**
1. **Material never read from IFC data.** The tool maps `IfcWall → concrete` unconditionally. A timber-framed wall or steel-framed wall would still get `350 kgCO2e/m³`. The IFC standard provides `IfcMaterial`, `IfcMaterialLayer`, `IfcMaterialLayerSetUsage` for precise material info.
2. **5 element types only.** `IfcWindow`, `IfcDoor`, `IfcFurnishingElement`, `IfcFoundation`, `IfcCurtainWall` are all zero-carbon in this model, which is incorrect.
3. **Default volumes are arbitrary.** When `_get_element_volume()` returns `None`, the tool uses `default_vol` (e.g., 0.8 m³ for all walls regardless of size). A 30m wall and a 1m wall get the same volume.
4. **`_model_cache` defined on `BIMToolBase` but never populated.** Declared as `_model_cache: dict = {}` with no write path — dead code.
5. `_open_ifc_from_bytes()` duplicated (identical to ifc_parser_tool.py, compliance_tool.py, mep_tool.py, clash_detection_tool.py).

**Color classification thresholds** (`< 100`, `100–500`, `> 500 kgCO2e`) are hard-coded with no way for callers to adjust.

---

### 2.3 ClashDetectionTool (`clash_detection_tool.py`)

**Purpose:** AABB (axis-aligned bounding box) intersection test between building elements.

**Method:**

| Method | Signature | Returns |
|--------|-----------|---------|
| `detect_clashes` | `(file_path: str, tolerance: float = 0.01) → ToolResult` | `clash_count`, `severity_summary`, `clashes[:200]` |

**Algorithm:**
```
O(n²) brute-force nested loop over all candidates of different types
```

**Severity Classification:**
- `critical`: overlap_volume > 0.1 m³
- `major`: 0.01–0.1 m³
- `minor`: < 0.01 m³

**Critical Limitations:**

1. **Placement extraction is fragile.** `_get_location()` traverses `element.ObjectPlacement.RelativePlacement.Location` with a bare `except Exception: pass`. In IFC, placements can be relative to a grid or another element — this code only reads the immediate `Location` coordinates, ignoring parent placement hierarchies. Result: most elements return `loc = None` and are silently skipped.

2. **Same-type pairs skipped entirely:**
   ```python
   if a['info']['type'] == b['info']['type']:
       continue
   ```
   This misses `IfcPipeSegment` vs `IfcPipeSegment` and `IfcDuctSegment` vs `IfcDuctSegment` clashes — both are real, common scenarios.

3. **O(n²) complexity.** For a 200-element model: 200×199/2 = 19,900 pairs. For a 1000-element model: ~500,000 pairs. No spatial indexing (e.g., octree, BVH) is used.

4. **Output capped at 200 clashes** (`clashes[:200]`) with no indication of how many were truncated.

5. **Half-extents are type-level constants**, not per-element. A 10m beam gets the same AABB as a 1m beam.

---

### 2.4 CodeComplianceTool (`compliance_tool.py`)

**Purpose:** Check against Thai building codes (มยผ.) — door widths, stair widths.

**Method:**

| Method | Signature | Returns |
|--------|-----------|---------|
| `check_compliance` | `(file_path: str, standards: list = None, locale: str = "th") → ToolResult` | `overall_status`, `findings`, `element_highlights` |

**Checks Implemented:**

| Check | Elements | Standard |
|-------|----------|----------|
| Door width (fire egress) | `IfcDoor` | มยผ. 1301-54, ≥ 0.9 m |
| Door width (accessibility) | `IfcDoor` | กฎกระทรวง 2548, ≥ 0.9 m |
| Stair width | `IfcStair` | มยผ. 1301-54, ≥ 1.2 m |

**Checks in Documentation but NOT Implemented:**

The usage guide and `THAI_BUILDING_CODES` dict list `structural` as a standard:
```python
'structural': {
    'code': 'มยผ. 1311-50',
    'name': 'มาตรฐานโครงสร้าง',
    'description': 'Thai Structural Design Standard',
},
```
But there is **no code path** for `if 'structural' in standards:` in the implementation. Requesting `standards=["structural"]` will always return `pass_count=0, fail_count=0, overall_status='PASS'` — silently returning a passing result for an unchecked standard.

**Other Limitations:**
- `locale` parameter is accepted but **never used** — output is always English field names regardless of `locale="th"`.
- Corridor width (`MIN_CORRIDOR_WIDTH = 1.5 m`) is defined as a constant but there is no check against `IfcSpace` or `IfcCorridor`.
- Door fire/accessibility check has a logic bug: `elif` on accessibility check means if `fire_egress` fails, accessibility is never evaluated for the same door.
- Elements without measurable widths (`_extract_width()` returns `None`) are silently skipped — not counted as pass or fail, not reported.

---

### 2.5 MEPAnalysisTool (`mep_tool.py`)

**Purpose:** Count and summarise MEP (mechanical, electrical, plumbing) elements.

**Method:**

| Method | Signature | Returns |
|--------|-----------|---------|
| `analyze_mep` | `(file_path: str) → ToolResult` | `total_mep_elements`, `systems` dict with counts + estimated lengths |

**Systems Detected:**
- Plumbing: `IfcPipeSegment, IfcPipeFitting, IfcValve, IfcSanitaryTerminal`
- HVAC: `IfcDuctSegment, IfcDuctFitting, IfcAirTerminal, IfcUnitaryEquipment`
- Electrical: `IfcCableCarrierSegment, IfcCableSegment, IfcElectricDistributionBoard, IfcLightFixture`
- Fire Protection: `IfcFireSuppressionTerminal, IfcFlowInstrument`

**Limitations:**
- Length estimation falls back to `TYPICAL_LENGTHS` (e.g., 3.0 m per pipe segment) when no quantities exist — leads to systematically wrong totals.
- No pressure drop, sizing, or capacity analysis.
- No system connectivity (which pipes connect to which equipment) — only counts.
- Missing common types: `IfcBoiler`, `IfcChiller`, `IfcPump`, `IfcFan`, `IfcSensor`, `IfcActuator`.
- `_open_ifc_from_bytes()` duplicated (4th copy across tools).

---

### 2.6 KnowledgeGraphTool (`knowledge_graph_tool.py`)

**Purpose:** GraphDB/SPARQL integration for semantic BIM queries.

**Status: Stub — always returns error.**

```python
async def query_knowledge_graph(self, query: str) -> ToolResult:
    return self.fail_response(
        "Knowledge graph integration not yet configured. "
        "Please set up a GraphDB connection and configure GRAPHDB_URL in environment variables."
    )
```

The tool is registered and exposed to the LLM despite being fully non-functional. It's marked `visible=False` in metadata but still appears in OpenAPI schemas sent to the model. The tool will always fail and potentially confuse the agent.

---

## 3. Quality & Enhancement Opportunities

### 3.1 Performance: Blocking I/O in Async Handlers

**Severity: HIGH**

`_open_ifc_from_bytes()` calls `ifcopenshell.open()` synchronously inside an `async def` method. For large IFC files (50–500 MB, which is the configured limit), this blocks the entire asyncio event loop for seconds.

**All five affected tools:**
```python
# carbon_tool.py:161, clash_detection_tool.py:186, compliance_tool.py:220,
# ifc_parser_tool.py:181, mep_tool.py:165

def _open_ifc_from_bytes(self, content: bytes):          # ← sync, called from async
    with tempfile.NamedTemporaryFile(suffix=".ifc", ...) as tmp:
        tmp.write(content)
    model = ifcopenshell.open(tmp_path)                  # ← blocks event loop
    return model
```

**Fix:** Wrap in `asyncio.to_thread()`:
```python
import asyncio, functools
ifc_model = await asyncio.to_thread(ifcopenshell.open, tmp_path)
```

---

### 3.2 Performance: No IFC Model Caching

**Severity: HIGH for multi-tool workflows**

`BIMToolBase` declares:
```python
_model_cache: dict = {}  # Simple in-memory cache keyed by file_path
```
But the cache is **never written to or read from** in any tool. Every `calculate_carbon`, `detect_clashes`, `check_compliance`, `analyze_mep` call for the same file:
1. Downloads the IFC file from the sandbox (network I/O)
2. Writes a temp file (disk I/O)
3. Calls `ifcopenshell.open()` (CPU-bound parse, potentially seconds)
4. Deletes the temp file

A typical Carbon BIM session runs all 5 tools on the same model file — that's 5× redundant parse operations.

**Fix:** Implement the declared cache:
```python
async def _get_ifc_model(self, file_path: str):
    if file_path not in BIMToolBase._model_cache:
        content = await self.load_ifc_content(file_path)
        model = await asyncio.to_thread(self._open_from_bytes_sync, content)
        BIMToolBase._model_cache[file_path] = model
    return BIMToolBase._model_cache[file_path]
```
Note: add TTL/LRU eviction to prevent unbounded memory growth.

---

### 3.3 Performance: O(n²) Clash Detection

**Severity: MEDIUM**

`detect_clashes` uses a brute-force nested loop with no spatial partitioning:
```python
for i in range(len(candidates)):
    for j in range(i + 1, len(candidates)):
        ...
```
For a 500-element model: ~125,000 comparisons. For a 2000-element model: ~2,000,000 comparisons — likely 10+ seconds of CPU in the async event loop.

**Fix options:**
1. Wrap in `asyncio.to_thread()` immediately
2. Add spatial grid partitioning (divide bounding space into cells, only check same/adjacent cells)
3. Use `numpy` vectorized AABB intersection for bulk comparison

---

### 3.4 Reliability: Carbon Tool Ignores Actual Material Data

**Severity: HIGH for correctness**

The carbon calculation hardcodes `IfcWall → concrete` regardless of what materials are assigned in the IFC model. This produces incorrect results for timber, CLT, steel-frame, or masonry walls.

```python
ELEMENT_MATERIAL_MAP = {
    'IfcWall': ('concrete', 0.8),   # ← always concrete, always 0.8 m³
    'IfcBeam': ('steel', 0.3),      # ← always steel, always 0.3 m³
    ...
}
```

**Fix:** Read `IfcMaterialLayerSetUsage` or `IfcMaterial` associations:
```python
def _get_element_material(self, element) -> str:
    for rel in element.HasAssociations:
        if rel.is_a('IfcRelAssociatesMaterial'):
            mat = rel.RelatingMaterial
            if mat.is_a('IfcMaterial'):
                name = mat.Name.lower()
                if 'timber' in name or 'wood' in name: return 'timber'
                if 'steel' in name: return 'steel'
                if 'glass' in name: return 'glass'
    return 'concrete'  # fallback
```

---

### 3.5 Code Smell: `_open_ifc_from_bytes()` Duplicated 5× 

**Severity: MEDIUM — maintenance burden**

Identical 8-line function exists in:
- `carbon_tool.py:161`
- `clash_detection_tool.py:186`
- `compliance_tool.py:220`
- `ifc_parser_tool.py:181`
- `mep_tool.py:165`

The base class `BIMToolBase` is the correct home. Removing the duplication also enables a single fix point for the blocking I/O issue (§3.1) and the caching issue (§3.2).

---

### 3.6 Reliability: `structural` Standard is a Silent No-Op

**Severity: HIGH for correctness**

`check_compliance(standards=["structural"])` accepts the parameter, returns `overall_status: "PASS"`, and never checks anything. The LLM or user would believe the structural check passed when no check ran.

```python
# THAI_BUILDING_CODES defines 'structural' ✓
# But in check_compliance():
if 'fire_egress' in standards or 'accessibility' in standards:
    ...
if 'fire_egress' in standards:  # stair check
    ...
# No: if 'structural' in standards: ...
```

**Fix:** Either implement or raise an explicit `ToolResult` error:
```python
if 'structural' in standards:
    findings.append({
        'standard': 'มยผ. 1311-50',
        'check': 'Structural design',
        'status': 'NOT_IMPLEMENTED',
        'note': 'Structural checks require section properties — coming soon',
    })
```

---

### 3.7 Reliability: `locale` Parameter is Ignored

**Severity: LOW — misleading API contract**

`check_compliance(locale="th")` is documented and accepted but the field has no effect on output. All response field names and strings are always English regardless of locale.

---

### 3.8 API Design: Upload Endpoint Orphans Files

**Severity: HIGH — broken end-to-end flow**

`POST /v1/bim/upload` saves the uploaded IFC to a temp file, then **immediately deletes it via `BackgroundTask(os.unlink, tmp_path)`**, and returns a `file_id` UUID:

```python
# core/bim/api.py:36–49
with tempfile.NamedTemporaryFile(suffix=".ifc", delete=False) as tmp:
    tmp.write(content)
    tmp_path = tmp.name

file_id = str(uuid.uuid4())
return JSONResponse(
    content={"status": "success", "file_id": file_id, ...},
    background=BackgroundTask(os.unlink, tmp_path),  # ← deletes the file immediately
)
```

The comment even says: `# Save to temp file (real impl would upload to sandbox storage)`. The returned `file_id` is never stored and has **no relationship** to the IFC tools' `file_path` parameter (which reads from sandbox filesystem via `sandbox.files.read()`). There is **no end-to-end path** from upload → BIM tool analysis.

---

### 3.9 API Design: `get_tools_by_category()` Omits BIM Tools

**Severity: LOW — hidden from tooling**

`core/tools/tool_registry.py:87`:
```python
def get_tools_by_category() -> Dict[str, List[Tuple[str, str, str]]]:
    return {
        'core': CORE_TOOLS,
        'sandbox': SANDBOX_TOOLS,
        'search': SEARCH_TOOLS,
        'utility': UTILITY_TOOLS,
        'agent_builder': AGENT_BUILDER_TOOLS,
        # 'bim': BIM_TOOLS  ← missing
    }
```
BIM tools are in `ALL_TOOLS` and `get_all_tools()` but absent from `get_tools_by_category()`. Any UI or admin code that uses category-based discovery won't see BIM tools.

---

### 3.10 Reliability: Clash Detection Same-Type Skip is Wrong

**Severity: MEDIUM**

```python
if a['info']['type'] == b['info']['type']:
    continue  # "Same discipline unlikely to clash with itself"
```

This skips `IfcPipeSegment ↔ IfcPipeSegment` — but two pipes occupying the same space is a common real-world clash scenario, especially at branch joints. Similarly, `IfcDuctSegment ↔ IfcDuctSegment`.

---

### 3.11 Reliability: `ifcopenshell` Not in Production Dependencies

**Severity: CRITICAL for production**

`backend/pyproject.toml` does **not** list `ifcopenshell` as a dependency. The `Dockerfile` explicitly comments it out:
```dockerfile
# Optional: Install ifcopenshell for full IFC parsing (heavy, skip for minimal builds)
# RUN uv pip install ifcopenshell numpy networkx
```

All BIM tools check `HAS_IFC` and fall back to mock data when the library is absent:
```python
try:
    import ifcopenshell
    HAS_IFC = True
except ImportError:
    HAS_IFC = False
```

In production Docker builds, `HAS_IFC = False` and all tools return hardcoded mock responses. Users receive mock data silently — there is no warning in the API response that the library is missing beyond the `note` field in mock data which the LLM may or may not surface.

---

### 3.12 Reliability: Test Logic Flaw in Mock Test

**Severity: MEDIUM — false test confidence**

`tests/test_bim_tools.py:34–41`:
```python
async def test_carbon_tool_mock_response(mocker):
    tool = CarbonCalculationTool(project_id="test-project")
    mocker.patch.object(tool, "load_ifc_content", return_value=b"")
    result = await tool.calculate_carbon(file_path="/nonexistent/model.ifc")
    assert result.success is True  # ← comment says "triggers mock path"
```

When `HAS_IFC = True` (i.e., ifcopenshell is installed), the code path is:
```python
content = await self.load_ifc_content(...)   # returns b"" (mocked)
ifc_model = self._open_ifc_from_bytes(b"")   # tries ifcopenshell.open(empty_file)
```
`ifcopenshell.open()` on an empty temp file **raises an exception**, which is caught by the outer `except Exception` and returns `fail_response(...)` with `success=False`. The assertion `result.success is True` would **fail** when ifcopenshell is present. The test only passes when `HAS_IFC = False` (mock data path).

---

## 4. Missing Features

### 4.1 Explicitly Stubbed / Commented Out

| Feature | Location | Status |
|---------|----------|--------|
| GraphDB / SPARQL knowledge graph | `core/tools/bim/knowledge_graph_tool.py:37` | Always fails — `GRAPHDB_URL` env var referenced but no integration code |
| Structural compliance checks (มยผ. 1311-50) | `compliance_tool.py` | Defined in constants, not in logic |
| IFC upload → sandbox path | `core/bim/api.py:36` comment | `# real impl would upload to sandbox storage` |
| `ifcopenshell` in Docker | `Dockerfile:30` | Commented out as optional |

### 4.2 Implied by Project Description but Absent

| Gap | Notes |
|-----|-------|
| **Material-aware carbon** | Carbon BIM's core value is sustainability analysis; without reading IFC material data, results are estimates at best |
| **Thai TGO/TREES compliance** | Usage guide claims "aligned with Thai TGO/TREES standards" but no TGO/TREES factor table exists in code |
| **Energy simulation** | Common BIM analysis capability; no tool exists |
| **Quantity takeoff / Bill of Materials** | Architects use BIM for cost estimation; no BoQ tool |
| **Storey-level breakdown in carbon** | Carbon results don't break down by floor/storey |
| **PDF/Excel report generation** | Results are JSON only; no export functionality |
| **IFC model comparison (before/after)** | Common use case for design iteration analysis |
| **Clash grouping by zone/storey** | Clash results don't indicate which floor/zone they occur in |

### 4.3 Gaps Between Tool Metadata and Capability

| Tool | Documented Capability | Actual Capability |
|------|-----------------------|-------------------|
| `CarbonCalculationTool` | "material emission factors aligned with Thai TGO/TREES standards" | Static type→material hardcoding, no TGO/TREES database |
| `CodeComplianceTool` | Checks `structural`, `fire_egress`, `accessibility` standards | Only `fire_egress` (doors + stairs) and `accessibility` (doors) |
| `CodeComplianceTool` | `locale` parameter for Thai/English output | Locale ignored |
| `ClashDetectionTool` | Detects clashes "between structural, architectural, and MEP elements" | Skips same-type pairs (misses pipe-pipe, duct-duct) |
| `KnowledgeGraphTool` | "Query BIM knowledge graph using SPARQL or natural language" | Always returns error |

---

## 5. Test Coverage

### 5.1 Existing Tests

| Test File | Coverage |
|-----------|----------|
| `tests/test_bim_tools.py` | Import check + 3 mock-path async tests |
| `tests/api/test_accounts.py` | Account API (not BIM) |
| `tests/core/agentpress/test_context_manager_compression.py` | Context compression |
| `tests/core/test_execution_engine_compression.py` | Execution engine compression |
| `tests/e2e/test_full_flow.py` | End-to-end agent flow |

**BIM test coverage summary:** ~3 meaningful tests exist for BIM. They test:
- Import success
- Method existence
- Mock data path (only when `HAS_IFC = False`)

### 5.2 Critical Areas With No Tests

**BIM Logic:**
- `calculate_carbon()` with real IFC bytes (actual calculation correctness)
- Carbon calculation when `_get_element_volume()` returns `None` (uses default_vol)
- Carbon breakdown percentages (division by zero when `total_co2 = 0`)
- `detect_clashes()` AABB algorithm correctness (same-type skip, tolerance edge case)
- `_get_location()` returning `None` → element skipped silently
- `check_compliance()` with `standards=["structural"]` (should note unimplemented, not pass)
- `_extract_width()` returning `None` → element silently skipped
- Door checking `elif` logic (fire then accessibility, never both)

**API:**
- `POST /bim/upload` — file size limit enforcement (>500MB)
- `POST /bim/upload` — non-IFC file rejection
- `GET /bim/health` — when `ifcopenshell` is not installed

**Integration:**
- BIM tools registered in `ToolManager._register_bim_tools()` — no test that BIM tools appear in the tool registry for an agent run
- `load_ifc_content()` sandbox fallback path (Daytona `fs.download_file`)

### 5.3 Specific Test Cases That Would Catch Real Bugs

```python
# Test 1: Carbon zero-division on empty model
async def test_carbon_empty_model():
    # Model with no matching IFC types → total_co2=0.0
    # Should not throw ZeroDivisionError in percentage calc:
    # 'percentage': round(val / total_co2 * 100, 1) if total_co2 else 0
    ...

# Test 2: Structural standard returns unimplemented notice, not silent PASS
async def test_compliance_structural_not_silent():
    result = await tool.check_compliance("/model.ifc", standards=["structural"])
    # Should NOT return overall_status='PASS' with zero findings
    assert result.output.get('overall_status') != 'PASS'

# Test 3: Clash detection same-type pipes
async def test_clash_pipe_to_pipe():
    # Two IfcPipeSegment at same location → should detect clash
    # Currently skipped by: if a['info']['type'] == b['info']['type']: continue

# Test 4: Carbon with real material override
async def test_carbon_material_hardcoding():
    # IFC with timber walls
    # Currently returns concrete coefficients for timber walls
    # → assert result.output['breakdown'] uses timber factor (-500 kgCO2e/m³)

# Test 5: Upload endpoint file not persisted
async def test_upload_file_not_accessible_after_response():
    # File deleted in background task
    # file_id cannot be used to retrieve file
    ...
```

---

## 6. Priority Ranking — Top 10 Enhancements

Ranked by **Impact × Feasibility** (High/Medium/Low).

| # | Enhancement | Impact | Feasibility | Files |
|---|-------------|--------|-------------|-------|
| 1 | **Install ifcopenshell in production Docker** | 🔴 Critical | High | `Dockerfile`, `pyproject.toml` |
| 2 | **Move `_open_ifc_from_bytes()` to `BIMToolBase` + wrap in `asyncio.to_thread()`** | 🔴 High | High | `base.py`, all 5 tool files |
| 3 | **Implement IFC model cache** (populate `_model_cache`) | 🔴 High | High | `base.py` |
| 4 | **Implement material-aware carbon calculation** (read `IfcMaterial`) | 🔴 High | Medium | `carbon_tool.py` |
| 5 | **Fix upload endpoint** to persist file into sandbox for tool use | 🔴 High | Medium | `core/bim/api.py` |
| 6 | **Fix `structural` standard** (either implement or return explicit NOT_IMPLEMENTED) | 🟠 Medium | High | `compliance_tool.py` |
| 7 | **Fix test logic flaw** — mock `HAS_IFC` not just `load_ifc_content` | 🟠 Medium | High | `tests/test_bim_tools.py` |
| 8 | **Add BIM tools to `get_tools_by_category()`** | 🟡 Low | High | `core/tools/tool_registry.py` |
| 9 | **Fix same-type clash skip** + add `asyncio.to_thread` for O(n²) loop | 🟠 Medium | Medium | `clash_detection_tool.py` |
| 10 | **Implement locale support** or remove the parameter from API contract | 🟡 Low | High | `compliance_tool.py` |

---

## Appendix: Key File Paths Reference

| Purpose | Path |
|---------|------|
| FastAPI entry point | `backend/api.py` |
| BIM API router | `backend/core/bim/api.py` |
| BIM tool base class | `backend/core/tools/bim/base.py` |
| IFC parser | `backend/core/tools/bim/ifc_parser_tool.py` |
| Carbon calculator | `backend/core/tools/bim/carbon_tool.py` |
| Clash detection | `backend/core/tools/bim/clash_detection_tool.py` |
| Compliance checker | `backend/core/tools/bim/compliance_tool.py` |
| MEP analyser | `backend/core/tools/bim/mep_tool.py` |
| Knowledge graph stub | `backend/core/tools/bim/knowledge_graph_tool.py` |
| Static tool manifest | `backend/core/tools/tool_registry.py` |
| Runtime tool registry | `backend/core/agentpress/tool_registry.py` |
| Tool registration per-run | `backend/core/agents/runner/tool_manager.py` |
| ThreadManager | `backend/core/agentpress/thread_manager/manager.py` |
| LLM executor | `backend/core/agentpress/thread_manager/services/execution/llm_executor.py` |
| Execution orchestrator | `backend/core/agentpress/thread_manager/services/execution/orchestrator.py` |
| BIM tests | `backend/tests/test_bim_tools.py` |
| AI model registry | `backend/core/ai_models/registry.py` |
| Docker build | `backend/Dockerfile` |

---

*Analysis performed by GSD codebase mapper · 2026-03-19*
