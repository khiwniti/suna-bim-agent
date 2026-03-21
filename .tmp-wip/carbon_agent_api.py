"""Carbon Agent API — REST endpoints for the Embodied Carbon Analyst agent service.

Endpoints:
  POST /bim/carbon-agent/analyze   — full lifecycle analysis
  POST /bim/carbon-agent/optimize  — design optimization roadmap
  POST /bim/carbon-agent/benchmark — TREES + ASEAN benchmarks
  GET  /bim/carbon-agent/factors   — list Thai TGO emission factors
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from core.utils.logger import logger
from core.tools.bim.embodied_carbon_service import (
    EmbodiedCarbonServiceTool,
    TREES_BENCHMARKS,
    ASEAN_BENCHMARKS,
)
from core.tools.bim.carbon_tool import (
    TGO_EMISSION_FACTORS,
    MATERIAL_DENSITY,
    LIFECYCLE_STAGE_FACTORS,
)

router = APIRouter(prefix="/bim/carbon-agent", tags=["BIM Carbon Agent"])


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    file_path: str = Field(..., description="Path to IFC file in the sandbox")
    gfa_m2: Optional[float] = Field(None, description="Gross floor area in m² (required for TREES rating)")
    building_type: str = Field("office", description="Building occupancy type")
    sandbox_id: Optional[str] = Field(None, description="Sandbox ID for file access")


class OptimizeRequest(BaseModel):
    file_path: str = Field(..., description="Path to IFC file in the sandbox")
    target_reduction_pct: float = Field(20.0, ge=0, le=100, description="Target carbon reduction %")
    sandbox_id: Optional[str] = Field(None)


class BenchmarkRequest(BaseModel):
    total_co2: float = Field(..., gt=0, description="Total embodied carbon in kgCO2e")
    gfa_m2: float = Field(..., gt=0, description="Gross floor area in m²")
    building_type: str = Field("office", description="Building occupancy type")


# ---------------------------------------------------------------------------
# Helper: get a service tool instance with the given sandbox
# ---------------------------------------------------------------------------

async def _get_tool(sandbox_id: Optional[str]) -> EmbodiedCarbonServiceTool:
    """Return a configured EmbodiedCarbonServiceTool, optionally bound to a sandbox."""
    tool = EmbodiedCarbonServiceTool()
    if sandbox_id:
        try:
            tool._sandbox_id = sandbox_id  # injected pre-init for SandboxToolsBase
        except Exception:
            pass
    return tool


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/analyze")
async def analyze_embodied_carbon(req: AnalyzeRequest):
    """Run a full EN 15978 embodied carbon analysis on an IFC model.

    Returns lifecycle stage breakdown (A1-A3, A4-A5, B1, C1-C4, D),
    TREES certification rating (if GFA provided), top carbon hotspots,
    and substitution opportunities.
    """
    try:
        tool = await _get_tool(req.sandbox_id)
        result = await tool.run_embodied_carbon_analysis(
            file_path=req.file_path,
            gfa_m2=req.gfa_m2,
            building_type=req.building_type,
        )
        if not result.success:
            raise HTTPException(status_code=422, detail=result.output)
        return {"status": "success", "data": result.output}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"POST /bim/carbon-agent/analyze error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize")
async def optimize_carbon(req: OptimizeRequest):
    """Generate a prioritised low-carbon material substitution roadmap.

    Returns a list of substitution steps in order of carbon saving,
    with cumulative savings tracked against the target reduction percentage.
    """
    try:
        tool = await _get_tool(req.sandbox_id)
        result = await tool.suggest_design_optimizations(
            file_path=req.file_path,
            target_reduction_pct=req.target_reduction_pct,
        )
        if not result.success:
            raise HTTPException(status_code=422, detail=result.output)
        return {"status": "success", "data": result.output}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"POST /bim/carbon-agent/optimize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/benchmark")
async def benchmark_carbon(req: BenchmarkRequest):
    """Compare a building's embodied carbon against Thai TREES and ASEAN benchmarks.

    Does not require an IFC file — accepts pre-calculated total CO2 and GFA.
    """
    try:
        tool = EmbodiedCarbonServiceTool()
        result = await tool.get_carbon_benchmarks(
            total_co2=req.total_co2,
            gfa_m2=req.gfa_m2,
            building_type=req.building_type,
        )
        if not result.success:
            raise HTTPException(status_code=422, detail=result.output)
        return {"status": "success", "data": result.output}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"POST /bim/carbon-agent/benchmark error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/factors")
async def get_emission_factors():
    """Return the full Thai TGO emission factor database used by the Carbon Analyst.

    Includes: emission factors (kgCO2e/kg), material densities (kg/m³),
    implied volumetric coefficients (kgCO2e/m³), EN 15978 lifecycle stage
    multipliers, and TREES building type benchmarks.
    """
    factors = []
    for mat_key, ef in TGO_EMISSION_FACTORS.items():
        density = MATERIAL_DENSITY.get(mat_key, 2000.0)
        factors.append({
            "material_key": mat_key,
            "emission_factor_kgco2e_per_kg": ef,
            "density_kg_m3": density,
            "volumetric_kgco2e_per_m3": round(ef * density, 2),
        })

    return {
        "status": "success",
        "data": {
            "emission_factors": factors,
            "lifecycle_stage_multipliers": LIFECYCLE_STAGE_FACTORS,
            "trees_benchmarks": TREES_BENCHMARKS,
            "asean_benchmarks": ASEAN_BENCHMARKS,
            "source": "Thai TGO National Carbon Footprint Database, 2023 revision",
            "framework": "EN 15978 lifecycle accounting",
        },
    }
