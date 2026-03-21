"""Embodied Carbon Service — specialized, high-level orchestration tool.

Combines IFC parsing, carbon calculation, Thai TREES/TGO benchmarking, and
EN 15978 lifecycle analysis into a single agent-facing interface. This is the
primary tool for the "Embodied Carbon Analyst" agent preset.
"""
from typing import Optional

from core.agentpress.tool import ToolResult, openapi_schema, tool_metadata
from core.utils.logger import logger

from .base import BIMToolBase, HAS_IFC
from .carbon_tool import (
    CARBON_COEFFICIENTS,
    ELEMENT_MATERIAL_MAP,
    LIFECYCLE_STAGE_FACTORS,
    SUBSTITUTION_MAP,
    TGO_EMISSION_FACTORS,
    MATERIAL_DENSITY,
    _co2_color,
    _kgco2e_per_m3,
    _material_to_coefficient,
)

# ---------------------------------------------------------------------------
# Thai TREES carbon intensity benchmarks (kgCO2e/m² gross floor area)
# Source: TREES-NC v1.1 (Thailand Green Building Institute, 2022)
# ---------------------------------------------------------------------------
TREES_BENCHMARKS: dict[str, dict] = {
    'residential_low_rise': {
        'label': 'Residential — Low-rise (≤4 floors)',
        'baseline_kgco2e_m2': 400,
        'certified_kgco2e_m2': 340,    # Silver
        'gold_kgco2e_m2': 280,
        'platinum_kgco2e_m2': 220,
    },
    'residential_high_rise': {
        'label': 'Residential — High-rise (>4 floors)',
        'baseline_kgco2e_m2': 550,
        'certified_kgco2e_m2': 467,
        'gold_kgco2e_m2': 385,
        'platinum_kgco2e_m2': 302,
    },
    'office': {
        'label': 'Office / Commercial',
        'baseline_kgco2e_m2': 620,
        'certified_kgco2e_m2': 527,
        'gold_kgco2e_m2': 434,
        'platinum_kgco2e_m2': 341,
    },
    'retail': {
        'label': 'Retail / Mixed-use',
        'baseline_kgco2e_m2': 680,
        'certified_kgco2e_m2': 578,
        'gold_kgco2e_m2': 476,
        'platinum_kgco2e_m2': 374,
    },
    'industrial': {
        'label': 'Industrial / Warehouse',
        'baseline_kgco2e_m2': 300,
        'certified_kgco2e_m2': 255,
        'gold_kgco2e_m2': 210,
        'platinum_kgco2e_m2': 165,
    },
    'hospital': {
        'label': 'Healthcare / Hospital',
        'baseline_kgco2e_m2': 750,
        'certified_kgco2e_m2': 637,
        'gold_kgco2e_m2': 525,
        'platinum_kgco2e_m2': 412,
    },
    'education': {
        'label': 'Education / University',
        'baseline_kgco2e_m2': 480,
        'certified_kgco2e_m2': 408,
        'gold_kgco2e_m2': 336,
        'platinum_kgco2e_m2': 264,
    },
}

# ASEAN regional benchmarks for cross-border comparisons (kgCO2e/m² GFA)
ASEAN_BENCHMARKS: dict[str, float] = {
    'Thailand':    550,
    'Singapore':   480,
    'Malaysia':    600,
    'Indonesia':   640,
    'Vietnam':     520,
    'Philippines': 580,
    'Regional avg': 562,
}


def _trees_rating(carbon_intensity: float, building_type: str) -> dict:
    """Return TREES certification rating for given carbon intensity (kgCO2e/m²)."""
    b = TREES_BENCHMARKS.get(building_type, TREES_BENCHMARKS['office'])
    if carbon_intensity <= b['platinum_kgco2e_m2']:
        rating, label = 'Platinum', '🏆 TREES Platinum'
    elif carbon_intensity <= b['gold_kgco2e_m2']:
        rating, label = 'Gold', '🥇 TREES Gold'
    elif carbon_intensity <= b['certified_kgco2e_m2']:
        rating, label = 'Certified', '🥈 TREES Certified'
    elif carbon_intensity <= b['baseline_kgco2e_m2']:
        rating, label = 'Below baseline', '⚠️ Below TREES threshold'
    else:
        rating, label = 'Non-compliant', '❌ Exceeds TREES baseline'
    return {
        'rating': rating,
        'label': label,
        'carbon_intensity': round(carbon_intensity, 2),
        'benchmarks': b,
    }


@tool_metadata(
    display_name="Embodied Carbon Service",
    description="Specialized embodied carbon analysis: lifecycle (EN 15978), Thai TGO/TREES benchmarking, and design optimization",
    icon="BarChart3",
    color="bg-emerald-100 dark:bg-emerald-800/50",
    weight=55,
    visible=True,
    usage_guide="""
## Embodied Carbon Service — Specialist Carbon Analyst

The primary tool for in-depth embodied carbon assessment of BIM/IFC models. Uses Thai TGO emission factors, EN 15978 lifecycle accounting (A1–D), and TREES green building benchmarks.

### Tools Available

| Tool | Purpose |
|------|---------|
| `run_embodied_carbon_analysis` | Complete analysis: lifecycle stages + TREES rating |
| `check_trees_certification` | TREES certification eligibility check |
| `get_carbon_benchmarks` | Compare vs Thai TREES + ASEAN regional benchmarks |
| `suggest_design_optimizations` | Low-carbon substitution roadmap |

### Lifecycle Stages (EN 15978)
- **A1–A3** Product (manufacturing)
- **A4–A5** Construction
- **B1** In-use embodied
- **C1–C4** End of life
- **D** Recycling credit (beyond system boundary)

### Thai TREES Ratings
Platinum → Gold → Certified → Below baseline → Non-compliant

### Usage
```
run_embodied_carbon_analysis(file_path="/workspace/model.ifc", gfa_m2=3500, building_type="office")
check_trees_certification(file_path="/workspace/model.ifc", gfa_m2=3500, building_type="office")
get_carbon_benchmarks(total_co2=2150000, gfa_m2=3500, building_type="office")
suggest_design_optimizations(file_path="/workspace/model.ifc")
```
""",
)
class EmbodiedCarbonServiceTool(BIMToolBase):

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "run_embodied_carbon_analysis",
            "description": (
                "Run a comprehensive embodied carbon analysis on an IFC/BIM model. "
                "Returns: full EN 15978 lifecycle breakdown, TREES certification status, "
                "top carbon hotspots, and recommended material substitutions."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the IFC file in the sandbox (e.g. /workspace/model.ifc)",
                    },
                    "gfa_m2": {
                        "type": "number",
                        "description": "Gross floor area in m² — required for carbon intensity (kgCO2e/m²) and TREES rating",
                    },
                    "building_type": {
                        "type": "string",
                        "enum": list(TREES_BENCHMARKS.keys()),
                        "description": "Building occupancy type for TREES benchmarking (default: office)",
                        "default": "office",
                    },
                },
                "required": ["file_path"],
                "additionalProperties": False,
            },
        },
    })
    async def run_embodied_carbon_analysis(
        self,
        file_path: str,
        gfa_m2: Optional[float] = None,
        building_type: str = "office",
    ) -> ToolResult:
        """Full embodied carbon report: lifecycle + TREES + hotspots + suggestions."""
        try:
            if not HAS_IFC:
                return self.success_response(self._mock_full_report(gfa_m2, building_type))

            content = await self.load_ifc_content(file_path)
            ifc_model = await self.open_ifc_model(content)

            # 1. Collect element data
            elements = []
            for ifc_type, (default_material, default_vol) in ELEMENT_MATERIAL_MAP.items():
                for element in ifc_model.by_type(ifc_type):
                    volume = self._get_element_volume(element) or default_vol
                    mat = self.get_element_material(element)
                    coeff = _material_to_coefficient(mat) if mat else CARBON_COEFFICIENTS.get(default_material, CARBON_COEFFICIENTS['default'])
                    elements.append({
                        'express_id': element.id(),
                        'ifc_type': ifc_type,
                        'material': mat or default_material,
                        'volume_m3': round(volume, 4),
                        'carbon_a1_a3': round(volume * coeff, 2),
                        'color': _co2_color(volume * coeff),
                    })

            a1_a3 = sum(e['carbon_a1_a3'] for e in elements)

            # 2. Lifecycle stage breakdown (EN 15978)
            lifecycle = {
                stage: round(a1_a3 * factor, 2)
                for stage, factor in LIFECYCLE_STAGE_FACTORS.items()
                if stage != 'full'
            }
            total_a1_c4 = round(a1_a3 * LIFECYCLE_STAGE_FACTORS['full'], 2)
            net_total = round(total_a1_c4 + lifecycle['d'], 2)

            # 3. Category breakdown
            category_totals: dict[str, float] = {}
            for e in elements:
                cat = e['ifc_type'].replace('Ifc', '') + 's'
                category_totals[cat] = category_totals.get(cat, 0) + e['carbon_a1_a3']
            breakdown = sorted(
                [{'category': k, 'value': round(v, 2), 'percentage': round(v / a1_a3 * 100, 1) if a1_a3 else 0}
                 for k, v in category_totals.items()],
                key=lambda x: -x['value'],
            )

            # 4. TREES rating
            trees_result = None
            if gfa_m2 and gfa_m2 > 0:
                intensity = net_total / gfa_m2
                trees_result = _trees_rating(intensity, building_type)

            # 5. Top hotspots
            hotspots = sorted(elements, key=lambda e: -e['carbon_a1_a3'])[:10]

            # 6. Quick substitution summary
            suggestions = _quick_suggestions(elements)

            return self.success_response({
                'total_a1_a3_co2': round(a1_a3, 2),
                'lifecycle_stages': lifecycle,
                'total_a1_c4_co2': total_a1_c4,
                'net_total_co2': net_total,
                'unit': 'kgCO2e',
                'framework': 'EN 15978 / Thai TGO',
                'element_count': len(elements),
                'category_breakdown': breakdown,
                'top_hotspots': hotspots,
                'trees_certification': trees_result,
                'substitution_opportunities': suggestions,
                'summary': _build_summary(net_total, gfa_m2, trees_result),
            })
        except Exception as e:
            logger.error(f"run_embodied_carbon_analysis error: {e}")
            return self.fail_response(f"Embodied carbon analysis failed: {e}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "check_trees_certification",
            "description": "Check TREES (Thai Rating of Energy and Environmental Sustainability) certification eligibility based on embodied carbon intensity.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the IFC file in the sandbox",
                    },
                    "gfa_m2": {
                        "type": "number",
                        "description": "Gross floor area in m²",
                    },
                    "building_type": {
                        "type": "string",
                        "enum": list(TREES_BENCHMARKS.keys()),
                        "description": "Building occupancy type",
                        "default": "office",
                    },
                },
                "required": ["file_path", "gfa_m2"],
                "additionalProperties": False,
            },
        },
    })
    async def check_trees_certification(
        self,
        file_path: str,
        gfa_m2: float,
        building_type: str = "office",
    ) -> ToolResult:
        """Assess TREES green building certification eligibility."""
        try:
            if not HAS_IFC:
                total_co2 = 2150000.0
            else:
                content = await self.load_ifc_content(file_path)
                ifc_model = await self.open_ifc_model(content)
                total_co2 = sum(
                    (self._get_element_volume(el) or default_vol)
                    * (_material_to_coefficient(self.get_element_material(el)) if self.get_element_material(el)
                       else CARBON_COEFFICIENTS.get(dm, CARBON_COEFFICIENTS['default']))
                    for ifc_type, (dm, default_vol) in ELEMENT_MATERIAL_MAP.items()
                    for el in ifc_model.by_type(ifc_type)
                )

            intensity = total_co2 / gfa_m2
            result = _trees_rating(intensity, building_type)
            bench = result['benchmarks']

            gaps = {}
            for level in ('certified', 'gold', 'platinum'):
                target = bench[f'{level}_kgco2e_m2']
                if intensity > target:
                    gap_co2 = (intensity - target) * gfa_m2
                    gaps[level] = {
                        'target_intensity': target,
                        'gap_kgco2e_m2': round(intensity - target, 2),
                        'required_reduction_kgco2e': round(gap_co2, 2),
                        'required_reduction_pct': round((gap_co2 / total_co2) * 100, 1),
                    }

            return self.success_response({
                **result,
                'total_co2': round(total_co2, 2),
                'gfa_m2': gfa_m2,
                'building_type': building_type,
                'gaps_to_next_levels': gaps,
                'summary': (
                    f"Carbon intensity: {intensity:.1f} kgCO2e/m². "
                    f"Current TREES rating: {result['label']}. "
                    f"{'Gap to Certified: ' + str(gaps['certified']['gap_kgco2e_m2']) + ' kgCO2e/m²' if 'certified' in gaps else 'Meets TREES Certified threshold.'}"
                ),
            })
        except Exception as e:
            logger.error(f"check_trees_certification error: {e}")
            return self.fail_response(f"TREES certification check failed: {e}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "get_carbon_benchmarks",
            "description": "Compare a building's total embodied carbon against Thai TREES and ASEAN regional benchmarks.",
            "parameters": {
                "type": "object",
                "properties": {
                    "total_co2": {
                        "type": "number",
                        "description": "Total embodied carbon in kgCO2e",
                    },
                    "gfa_m2": {
                        "type": "number",
                        "description": "Gross floor area in m²",
                    },
                    "building_type": {
                        "type": "string",
                        "enum": list(TREES_BENCHMARKS.keys()),
                        "description": "Building occupancy type",
                        "default": "office",
                    },
                },
                "required": ["total_co2", "gfa_m2"],
                "additionalProperties": False,
            },
        },
    })
    async def get_carbon_benchmarks(
        self,
        total_co2: float,
        gfa_m2: float,
        building_type: str = "office",
    ) -> ToolResult:
        """Compare carbon intensity vs TREES and ASEAN benchmarks."""
        try:
            intensity = total_co2 / gfa_m2
            trees = TREES_BENCHMARKS.get(building_type, TREES_BENCHMARKS['office'])
            rating = _trees_rating(intensity, building_type)

            asean_comparisons = [
                {
                    'country': country,
                    'benchmark_kgco2e_m2': bench,
                    'vs_project': round(intensity - bench, 2),
                    'better': intensity < bench,
                }
                for country, bench in ASEAN_BENCHMARKS.items()
            ]
            asean_better_than = sum(1 for c in asean_comparisons if c['better'])

            return self.success_response({
                'carbon_intensity_kgco2e_m2': round(intensity, 2),
                'trees_rating': rating['rating'],
                'trees_label': rating['label'],
                'trees_thresholds': trees,
                'asean_benchmarks': asean_comparisons,
                'asean_ranking': f"Better than {asean_better_than}/{len(ASEAN_BENCHMARKS)} ASEAN benchmarks",
                'summary': (
                    f"{round(intensity, 1)} kgCO2e/m² GFA. {rating['label']}. "
                    f"Better than {asean_better_than}/{len(ASEAN_BENCHMARKS)} ASEAN country benchmarks."
                ),
            })
        except Exception as e:
            logger.error(f"get_carbon_benchmarks error: {e}")
            return self.fail_response(f"Benchmark comparison failed: {e}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "suggest_design_optimizations",
            "description": "Identify the highest embodied-carbon materials in an IFC model and provide a prioritised low-carbon material substitution roadmap.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the IFC file in the sandbox",
                    },
                    "target_reduction_pct": {
                        "type": "number",
                        "description": "Target carbon reduction as a percentage (0–100). Suggestions will be ordered to achieve this target.",
                        "default": 20,
                    },
                },
                "required": ["file_path"],
                "additionalProperties": False,
            },
        },
    })
    async def suggest_design_optimizations(
        self,
        file_path: str,
        target_reduction_pct: float = 20,
    ) -> ToolResult:
        """Build a prioritised substitution roadmap toward a carbon reduction target."""
        try:
            if not HAS_IFC:
                return self.success_response(self._mock_optimization_roadmap())

            content = await self.load_ifc_content(file_path)
            ifc_model = await self.open_ifc_model(content)

            elements = []
            for ifc_type, (default_material, default_vol) in ELEMENT_MATERIAL_MAP.items():
                for element in ifc_model.by_type(ifc_type):
                    volume = self._get_element_volume(element) or default_vol
                    mat = self.get_element_material(element)
                    coeff = _material_to_coefficient(mat) if mat else CARBON_COEFFICIENTS.get(default_material, CARBON_COEFFICIENTS['default'])
                    elements.append({
                        'express_id': element.id(),
                        'ifc_type': ifc_type,
                        'material': mat or default_material,
                        'volume_m3': round(volume, 4),
                        'co2': round(volume * coeff, 2),
                    })

            total = sum(e['co2'] for e in elements)
            target_reduction_abs = total * (target_reduction_pct / 100)

            suggestions = _quick_suggestions(elements)
            cumulative = 0.0
            roadmap = []
            for s in sorted(suggestions, key=lambda x: -x.get('estimated_saving_kgco2e', 0)):
                roadmap.append(s)
                cumulative += s.get('estimated_saving_kgco2e', 0)
                s['cumulative_saving_kgco2e'] = round(cumulative, 2)
                s['target_achieved'] = cumulative >= target_reduction_abs

            achieved = any(r['target_achieved'] for r in roadmap)
            return self.success_response({
                'total_co2': round(total, 2),
                'target_reduction_pct': target_reduction_pct,
                'target_reduction_kgco2e': round(target_reduction_abs, 2),
                'target_achievable': achieved,
                'optimization_roadmap': roadmap,
                'unit': 'kgCO2e',
                'summary': (
                    f"Target: {target_reduction_pct}% reduction ({round(target_reduction_abs):,.0f} kgCO2e). "
                    f"{'✅ Achievable' if achieved else '⚠️ Partially achievable'} with {len(roadmap)} substitution step(s)."
                ),
            })
        except Exception as e:
            logger.error(f"suggest_design_optimizations error: {e}")
            return self.fail_response(f"Design optimization failed: {e}")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _mock_full_report(self, gfa_m2, building_type) -> dict:
        base = 2150000.0
        gfa = gfa_m2 or 3500
        intensity = base / gfa
        trees = _trees_rating(intensity, building_type or 'office')
        return {
            'note': 'Mock data — ifcopenshell not installed',
            'total_a1_a3_co2': base,
            'lifecycle_stages': {
                'a1_a3': base,
                'a4': round(base * 0.05, 2),
                'a5': round(base * 0.03, 2),
                'b1': round(base * 0.01, 2),
                'c1_c4': round(base * 0.08, 2),
                'd': round(base * -0.12, 2),
            },
            'total_a1_c4_co2': round(base * 1.17, 2),
            'net_total_co2': round(base * 1.05, 2),
            'unit': 'kgCO2e',
            'framework': 'EN 15978 / Thai TGO',
            'element_count': 142,
            'category_breakdown': [
                {'category': 'Slabs',   'value': 860000, 'percentage': 40.0},
                {'category': 'Walls',   'value': 645000, 'percentage': 30.0},
                {'category': 'Columns', 'value': 430000, 'percentage': 20.0},
                {'category': 'Beams',   'value': 215000, 'percentage': 10.0},
            ],
            'top_hotspots': [
                {'express_id': 201, 'ifc_type': 'IfcSlab',   'material': 'concrete', 'volume_m3': 2.4, 'carbon_a1_a3': 89700.6},
                {'express_id': 202, 'ifc_type': 'IfcColumn', 'material': 'steel',    'volume_m3': 0.3, 'carbon_a1_a3': 46866.0},
            ],
            'trees_certification': trees,
            'substitution_opportunities': [
                {
                    'current_material': 'concrete',
                    'substitute': 'Blended cement concrete (30% fly-ash/slag)',
                    'saving_pct': 31,
                    'estimated_saving_kgco2e': 416850,
                    'note': 'Substituting OPC with 30% fly-ash/GGBS blend achieves ~31% A1-A3 reduction.',
                },
            ],
            'summary': _build_summary(round(base * 1.05, 2), gfa, trees),
        }

    def _mock_optimization_roadmap(self) -> dict:
        return {
            'note': 'Mock data — ifcopenshell not installed',
            'total_co2': 2150000.0,
            'target_reduction_pct': 20,
            'target_reduction_kgco2e': 430000.0,
            'target_achievable': True,
            'unit': 'kgCO2e',
            'optimization_roadmap': [
                {
                    'current_material': 'concrete',
                    'substitute': 'Blended cement concrete (30% fly-ash/slag)',
                    'saving_pct': 31,
                    'estimated_saving_kgco2e': 416850,
                    'cumulative_saving_kgco2e': 416850,
                    'target_achieved': True,
                    'note': 'Primary win: switch structural concrete mix to 30% fly-ash/GGBS blend.',
                },
                {
                    'current_material': 'steel',
                    'substitute': 'EAF recycled steel',
                    'saving_pct': 81,
                    'estimated_saving_kgco2e': 125000,
                    'cumulative_saving_kgco2e': 541850,
                    'target_achieved': True,
                    'note': 'Specify recycled EAF steel for all structural members.',
                },
            ],
            'summary': '✅ Achievable: 20% reduction target met with 2 substitution step(s).',
        }


# ---------------------------------------------------------------------------
# Module-level helper functions
# ---------------------------------------------------------------------------

def _quick_suggestions(elements: list[dict]) -> list[dict]:
    """Generate substitution suggestions from element list."""
    mat_totals: dict[str, tuple[float, float]] = {}  # mat → (co2, volume)
    for e in elements:
        mat = e['material']
        co2 = e.get('co2', e.get('carbon_a1_a3', 0))
        vol = e.get('volume_m3', 0)
        existing = mat_totals.get(mat, (0.0, 0.0))
        mat_totals[mat] = (existing[0] + co2, existing[1] + vol)

    suggestions = []
    for mat, (total_co2, total_vol) in sorted(mat_totals.items(), key=lambda x: -x[1][0]):
        sub = SUBSTITUTION_MAP.get(mat)
        if not sub:
            continue
        original_ef = TGO_EMISSION_FACTORS.get(mat, 0.159)
        sub_key = sub['substitute']
        new_ef = TGO_EMISSION_FACTORS.get(sub_key, original_ef)
        density = MATERIAL_DENSITY.get(mat, 2000.0)
        saving = round((original_ef - new_ef) * density * total_vol, 2)
        suggestions.append({
            'current_material': mat,
            'substitute': sub['label'],
            'saving_pct': sub['saving_pct'],
            'estimated_saving_kgco2e': saving,
            'note': sub['note'],
        })
    return suggestions


def _build_summary(net_total: float, gfa_m2: Optional[float], trees_result: Optional[dict]) -> str:
    parts = [f"Net embodied carbon: {net_total:,.0f} kgCO2e (A1–D)."]
    if gfa_m2 and gfa_m2 > 0:
        intensity = net_total / gfa_m2
        parts.append(f"Carbon intensity: {intensity:.1f} kgCO2e/m² GFA.")
    if trees_result:
        parts.append(f"TREES rating: {trees_result['label']}.")
    return ' '.join(parts)
