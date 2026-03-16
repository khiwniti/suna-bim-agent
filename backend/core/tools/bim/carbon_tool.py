"""Carbon calculation tool — embodied carbon footprint from IFC models."""
import tempfile
import os
from typing import Optional

from core.agentpress.tool import ToolResult, openapi_schema, tool_metadata
from core.utils.logger import logger
from .base import BIMToolBase

try:
    import ifcopenshell
    HAS_IFC = True
except ImportError:
    HAS_IFC = False

# kgCO2e per m³ (volumetric coefficients for structural materials)
CARBON_COEFFICIENTS = {
    'concrete': 350,    # reinforced concrete
    'steel': 11461,     # density 7850 kg/m³ × 1.46 kgCO2e/kg
    'timber': -500,     # sequestered carbon
    'glass': 62.5,      # ~25 kgCO2e/m² × 2.5 cm avg
    'aluminum': 22248,  # density 2700 × 8.24 kgCO2e/kg
    'default': 300,
}

# Map IFC element types to material categories and typical volumes (m³)
ELEMENT_MATERIAL_MAP = {
    'IfcWall': ('concrete', 0.8),
    'IfcSlab': ('concrete', 1.5),
    'IfcBeam': ('steel', 0.3),
    'IfcColumn': ('concrete', 0.5),
    'IfcRoof': ('concrete', 1.2),
}

ELEMENT_COLORS = {
    'low':    '#22c55e',   # green  < 100 kgCO2e
    'medium': '#f59e0b',   # amber  100–500
    'high':   '#ef4444',   # red    > 500
}


def _co2_color(co2: float) -> str:
    if co2 < 100:
        return ELEMENT_COLORS['low']
    if co2 < 500:
        return ELEMENT_COLORS['medium']
    return ELEMENT_COLORS['high']


@tool_metadata(
    display_name="Carbon Analysis",
    description="Calculate embodied carbon footprint from IFC/BIM models",
    icon="Leaf",
    color="bg-green-100 dark:bg-green-800/50",
    weight=60,
    visible=True,
    usage_guide="""
## Carbon Analysis — Embodied Carbon Footprint

Calculates the embodied carbon (kgCO2e) of building elements in an IFC model using material emission factors aligned with Thai TGO/TREES standards.

### Available Tools
- **calculate_carbon**: Analyse the full model and return total CO2, breakdown by category, and per-element highlights

### When to Use
- Sustainability reporting
- Comparing design alternatives
- Identifying high-carbon elements

### Example
```
calculate_carbon(file_path="/workspace/model.ifc", include_breakdown=true)
```
""",
)
class CarbonCalculationTool(BIMToolBase):

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "calculate_carbon",
            "description": "Calculate the embodied carbon footprint (kgCO2e) of a BIM/IFC model.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "**REQUIRED** Path to the IFC file in the sandbox",
                    },
                    "include_breakdown": {
                        "type": "boolean",
                        "description": "**OPTIONAL** Include per-category breakdown and element highlights (default true)",
                        "default": True,
                    },
                },
                "required": ["file_path"],
                "additionalProperties": False,
            },
        },
    })
    async def calculate_carbon(self, file_path: str, include_breakdown: bool = True) -> ToolResult:
        try:
            if not HAS_IFC:
                return self.success_response(self._mock_carbon_result())

            content = await self.load_ifc_content(file_path)
            ifc_model = self._open_ifc_from_bytes(content)

            category_totals: dict[str, float] = {}
            element_highlights = []
            total_co2 = 0.0

            for ifc_type, (material, default_vol) in ELEMENT_MATERIAL_MAP.items():
                coefficient = CARBON_COEFFICIENTS.get(material, CARBON_COEFFICIENTS['default'])
                category_co2 = 0.0

                for element in ifc_model.by_type(ifc_type):
                    volume = self._get_element_volume(element) or default_vol
                    co2 = volume * coefficient
                    category_co2 += co2

                    if include_breakdown:
                        element_highlights.append({
                            'express_id': element.id(),
                            'carbon': round(co2, 2),
                            'color': _co2_color(co2),
                        })

                if category_co2 > 0:
                    label = ifc_type.replace('Ifc', '') + 's'
                    category_totals[label] = round(category_co2, 2)
                    total_co2 += category_co2

            total_co2 = round(total_co2, 2)

            breakdown = [
                {
                    'category': cat,
                    'value': val,
                    'percentage': round(val / total_co2 * 100, 1) if total_co2 else 0,
                }
                for cat, val in sorted(category_totals.items(), key=lambda x: -x[1])
            ]

            result = {
                'total_co2': total_co2,
                'unit': 'kgCO2e',
                'summary': f"Total embodied carbon: {total_co2:,.0f} kgCO2e",
            }
            if include_breakdown:
                result['breakdown'] = breakdown
                result['element_highlights'] = element_highlights

            return self.success_response(result)
        except Exception as e:
            logger.error(f"calculate_carbon error: {e}")
            return self.fail_response(f"Carbon calculation failed: {e}")

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

    def _mock_carbon_result(self) -> dict:
        return {
            'note': 'ifcopenshell not installed — returning mock data',
            'total_co2': 12500.5,
            'unit': 'kgCO2e',
            'summary': 'Total embodied carbon: 12,501 kgCO2e',
            'breakdown': [
                {'category': 'Walls',   'value': 5000.0, 'percentage': 40.0},
                {'category': 'Slabs',   'value': 4000.0, 'percentage': 32.0},
                {'category': 'Columns', 'value': 2000.0, 'percentage': 16.0},
                {'category': 'Beams',   'value': 1500.5, 'percentage': 12.0},
            ],
            'element_highlights': [
                {'express_id': 101, 'carbon': 500.0, 'color': '#ef4444'},
                {'express_id': 102, 'carbon': 80.0,  'color': '#22c55e'},
            ],
        }
