"""Clash detection tool — geometric AABB clash detection between building elements."""
import asyncio
from typing import Optional

from core.agentpress.tool import ToolResult, openapi_schema, tool_metadata
from core.utils.logger import logger
from .base import BIMToolBase, HAS_IFC

# Default half-extents (m) per element type for AABB estimation
DEFAULT_HALF_EXTENTS = {
    'IfcWall':   (0.15, 2.0, 3.0),
    'IfcSlab':   (3.0,  0.2, 3.0),
    'IfcBeam':   (0.15, 0.3, 2.0),
    'IfcColumn': (0.3,  3.0, 0.3),
    'IfcDoor':   (0.05, 1.0, 0.45),
    'IfcWindow': (0.05, 0.75, 0.6),
    'IfcPipeSegment': (0.05, 1.0, 0.05),
    'IfcDuctSegment': (0.2,  1.0, 0.2),
}
DEFAULT_HALF_EXTENT = (0.5, 0.5, 0.5)

CHECK_TYPES = list(DEFAULT_HALF_EXTENTS.keys())


def _get_location(element) -> Optional[tuple]:
    """Return (x, y, z) from element placement, or None."""
    try:
        placement = element.ObjectPlacement
        if placement and placement.RelativePlacement:
            loc = placement.RelativePlacement.Location
            if loc and hasattr(loc, 'Coordinates'):
                coords = loc.Coordinates
                return (coords[0], coords[1], coords[2] if len(coords) > 2 else 0.0)
    except Exception:
        pass
    return None


def _aabb_overlap(c1: tuple, h1: tuple, c2: tuple, h2: tuple) -> bool:
    """Return True when two AABBs overlap."""
    for i in range(3):
        if abs(c1[i] - c2[i]) > h1[i] + h2[i]:
            return False
    return True


def _overlap_volume(c1, h1, c2, h2) -> float:
    """Compute overlap volume for severity classification."""
    vol = 1.0
    for i in range(3):
        overlap = min(c1[i] + h1[i], c2[i] + h2[i]) - max(c1[i] - h1[i], c2[i] - h2[i])
        vol *= max(overlap, 0.0)
    return vol


def _severity(overlap_vol: float) -> str:
    if overlap_vol > 0.1:
        return 'critical'
    if overlap_vol > 0.01:
        return 'major'
    return 'minor'


@tool_metadata(
    display_name="Clash Detection",
    description="Detect geometric clashes between building elements",
    icon="AlertTriangle",
    color="bg-red-100 dark:bg-red-800/50",
    weight=65,
    visible=True,
    usage_guide="""
## Clash Detection — Find Geometric Conflicts

Uses axis-aligned bounding box (AABB) intersection to detect hard clashes between structural, architectural, and MEP elements.

### Available Tools
- **detect_clashes**: Run clash detection and return a list of conflicts with severity ratings

### Severity Levels
- **critical**: Overlap volume > 0.1 m³ — must fix before construction
- **major**: Overlap volume 0.01–0.1 m³ — should fix
- **minor**: Overlap volume < 0.01 m³ — review recommended

### Example
```
detect_clashes(file_path="/workspace/model.ifc", tolerance=0.01)
```
""",
)
class ClashDetectionTool(BIMToolBase):

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "detect_clashes",
            "description": "Detect geometric clashes between building elements using bounding-box intersection.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "**REQUIRED** Path to the IFC file in the sandbox",
                    },
                    "tolerance": {
                        "type": "number",
                        "description": "**OPTIONAL** Minimum overlap distance (m) to report as a clash (default 0.01)",
                        "default": 0.01,
                    },
                },
                "required": ["file_path"],
                "additionalProperties": False,
            },
        },
    })
    async def detect_clashes(self, file_path: str, tolerance: float = 0.01) -> ToolResult:
        try:
            if not HAS_IFC:
                return self.success_response(self._mock_clash_result())

            content = await self.load_ifc_content(file_path)
            ifc_model = await self.open_ifc_model(content)

            # Build list of (element_info, center, half_extents)
            candidates = []
            for ifc_type in CHECK_TYPES:
                half = DEFAULT_HALF_EXTENTS.get(ifc_type, DEFAULT_HALF_EXTENT)
                for el in ifc_model.by_type(ifc_type):
                    loc = _get_location(el)
                    if loc is None:
                        continue
                    candidates.append({
                        'info': {
                            'express_id': el.id(),
                            'type': ifc_type,
                            'name': getattr(el, 'Name', None),
                        },
                        'center': loc,
                        'half': half,
                    })

            # Run the O(n²) AABB loop in a thread so it doesn't block the event loop
            def _run_clash_detection():
                clashes = []
                severity_summary = {'critical': 0, 'major': 0, 'minor': 0}
                clash_id = 0

                for i in range(len(candidates)):
                    for j in range(i + 1, len(candidates)):
                        a, b = candidates[i], candidates[j]
                        if _aabb_overlap(a['center'], a['half'], b['center'], b['half']):
                            ovol = _overlap_volume(a['center'], a['half'], b['center'], b['half'])
                            if ovol < tolerance:
                                continue
                            sev = _severity(ovol)
                            severity_summary[sev] += 1
                            clash_id += 1
                            clashes.append({
                                'id': f'clash_{clash_id}',
                                'element1': a['info'],
                                'element2': b['info'],
                                'type': 'hard',
                                'severity': sev,
                                'overlap_volume_m3': round(ovol, 4),
                            })
                return clashes, severity_summary

            clashes, severity_summary = await asyncio.to_thread(_run_clash_detection)

            return self.success_response({
                'clash_count': len(clashes),
                'severity_summary': severity_summary,
                'clashes': clashes[:200],  # cap output
                'total_elements_checked': len(candidates),
            })
        except Exception as e:
            logger.error(f"detect_clashes error: {e}")
            return self.fail_response(f"Clash detection failed: {e}")

    def _mock_clash_result(self) -> dict:
        return {
            'note': 'ifcopenshell not installed — returning mock data',
            'clash_count': 3,
            'severity_summary': {'critical': 1, 'major': 2, 'minor': 0},
            'clashes': [
                {
                    'id': 'clash_1',
                    'element1': {'express_id': 101, 'type': 'IfcBeam',        'name': 'Beam-01'},
                    'element2': {'express_id': 202, 'type': 'IfcPipeSegment', 'name': 'Pipe-01'},
                    'type': 'hard',
                    'severity': 'critical',
                    'overlap_volume_m3': 0.25,
                },
                {
                    'id': 'clash_2',
                    'element1': {'express_id': 103, 'type': 'IfcColumn',      'name': 'Col-01'},
                    'element2': {'express_id': 205, 'type': 'IfcDuctSegment', 'name': 'Duct-02'},
                    'type': 'hard',
                    'severity': 'major',
                    'overlap_volume_m3': 0.05,
                },
                {
                    'id': 'clash_3',
                    'element1': {'express_id': 150, 'type': 'IfcWall',        'name': 'Wall-05'},
                    'element2': {'express_id': 210, 'type': 'IfcPipeSegment', 'name': 'Pipe-03'},
                    'type': 'hard',
                    'severity': 'major',
                    'overlap_volume_m3': 0.02,
                },
            ],
            'total_elements_checked': 45,
        }
