"""MEP analysis tool — mechanical, electrical, and plumbing systems."""
import tempfile
import os

from core.agentpress.tool import ToolResult, openapi_schema, tool_metadata
from core.utils.logger import logger
from .base import BIMToolBase

try:
    import ifcopenshell
    HAS_IFC = True
except ImportError:
    HAS_IFC = False

MEP_SYSTEMS = {
    'plumbing': {
        'types': ['IfcPipeSegment', 'IfcPipeFitting', 'IfcValve', 'IfcSanitaryTerminal'],
        'icon': 'droplet',
    },
    'hvac': {
        'types': ['IfcDuctSegment', 'IfcDuctFitting', 'IfcAirTerminal', 'IfcUnitaryEquipment'],
        'icon': 'wind',
    },
    'electrical': {
        'types': ['IfcCableCarrierSegment', 'IfcCableSegment', 'IfcElectricDistributionBoard', 'IfcLightFixture'],
        'icon': 'zap',
    },
    'fire_protection': {
        'types': ['IfcFireSuppressionTerminal', 'IfcFlowInstrument'],
        'icon': 'shield',
    },
}

# Typical element length (m) for estimation when quantities are unavailable
TYPICAL_LENGTHS = {
    'IfcPipeSegment':         3.0,
    'IfcDuctSegment':         3.0,
    'IfcCableCarrierSegment': 3.0,
    'IfcCableSegment':        5.0,
}


def _estimate_length(element) -> float:
    """Return element length from quantities or a sensible default."""
    if hasattr(element, 'IsDefinedBy'):
        for rel in element.IsDefinedBy:
            if rel.is_a('IfcRelDefinesByProperties'):
                pd = rel.RelatingPropertyDefinition
                if pd.is_a('IfcElementQuantity'):
                    for q in pd.Quantities:
                        if q.is_a('IfcQuantityLength') and 'length' in q.Name.lower():
                            return q.LengthValue
    return TYPICAL_LENGTHS.get(element.is_a(), 1.0)


@tool_metadata(
    display_name="MEP Analysis",
    description="Analyze mechanical, electrical, and plumbing systems",
    icon="Zap",
    color="bg-yellow-100 dark:bg-yellow-800/50",
    weight=75,
    visible=True,
    usage_guide="""
## MEP Analysis — Mechanical, Electrical & Plumbing Systems

Counts and summarises MEP distribution systems from an IFC model.

### Available Tools
- **analyze_mep**: Return per-system element counts and estimated total lengths

### Systems Detected
| System | IFC Types |
|--------|-----------|
| Plumbing | IfcPipeSegment, IfcPipeFitting, IfcValve, IfcSanitaryTerminal |
| HVAC | IfcDuctSegment, IfcDuctFitting, IfcAirTerminal, IfcUnitaryEquipment |
| Electrical | IfcCableCarrierSegment, IfcCableSegment, IfcElectricDistributionBoard, IfcLightFixture |
| Fire Protection | IfcFireSuppressionTerminal, IfcFlowInstrument |

### Example
```
analyze_mep(file_path="/workspace/model.ifc")
```
""",
)
class MEPAnalysisTool(BIMToolBase):

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "analyze_mep",
            "description": "Analyse MEP (mechanical, electrical, plumbing) systems in an IFC model, returning element counts and estimated lengths per system.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "**REQUIRED** Path to the IFC file in the sandbox",
                    },
                },
                "required": ["file_path"],
                "additionalProperties": False,
            },
        },
    })
    async def analyze_mep(self, file_path: str) -> ToolResult:
        try:
            if not HAS_IFC:
                return self.success_response(self._mock_mep_result())

            content = await self.load_ifc_content(file_path)
            ifc_model = self._open_ifc_from_bytes(content)

            systems_summary = {}
            total_elements = 0

            for system_name, system_info in MEP_SYSTEMS.items():
                system_counts: dict[str, int] = {}
                estimated_length_m = 0.0

                for ifc_type in system_info['types']:
                    elements = ifc_model.by_type(ifc_type)
                    count = len(elements)
                    if count:
                        system_counts[ifc_type] = count
                        total_elements += count
                        # Estimate lengths for segment types
                        if ifc_type in TYPICAL_LENGTHS:
                            for el in elements:
                                estimated_length_m += _estimate_length(el)

                if system_counts:
                    systems_summary[system_name] = {
                        'icon': system_info['icon'],
                        'element_counts': system_counts,
                        'total_elements': sum(system_counts.values()),
                        'estimated_length_m': round(estimated_length_m, 1) if estimated_length_m else None,
                    }

            # Also count generic IfcDistributionFlowElement not already captured
            flow_els = ifc_model.by_type('IfcDistributionFlowElement')
            unaccounted = [
                e for e in flow_els
                if not any(e.is_a(t) for sys in MEP_SYSTEMS.values() for t in sys['types'])
            ]
            if unaccounted:
                systems_summary['other_distribution'] = {
                    'icon': 'activity',
                    'element_counts': {'IfcDistributionFlowElement': len(unaccounted)},
                    'total_elements': len(unaccounted),
                    'estimated_length_m': None,
                }
                total_elements += len(unaccounted)

            return self.success_response({
                'total_mep_elements': total_elements,
                'systems': systems_summary,
                'summary': f"Found {total_elements} MEP elements across {len(systems_summary)} systems",
            })
        except Exception as e:
            logger.error(f"analyze_mep error: {e}")
            return self.fail_response(f"MEP analysis failed: {e}")

    # ------------------------------------------------------------------

    def _open_ifc_from_bytes(self, content: bytes):
        with tempfile.NamedTemporaryFile(suffix=".ifc", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        try:
            model = ifcopenshell.open(tmp_path)
        finally:
            os.unlink(tmp_path)
        return model

    def _mock_mep_result(self) -> dict:
        return {
            'note': 'ifcopenshell not installed — returning mock data',
            'total_mep_elements': 87,
            'systems': {
                'plumbing': {
                    'icon': 'droplet',
                    'element_counts': {'IfcPipeSegment': 30, 'IfcValve': 8},
                    'total_elements': 38,
                    'estimated_length_m': 90.0,
                },
                'hvac': {
                    'icon': 'wind',
                    'element_counts': {'IfcDuctSegment': 25, 'IfcAirTerminal': 12},
                    'total_elements': 37,
                    'estimated_length_m': 75.0,
                },
                'electrical': {
                    'icon': 'zap',
                    'element_counts': {'IfcCableCarrierSegment': 10, 'IfcLightFixture': 2},
                    'total_elements': 12,
                    'estimated_length_m': 30.0,
                },
            },
            'summary': 'Found 87 MEP elements across 3 systems',
        }
