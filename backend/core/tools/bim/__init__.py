"""BIM analysis tools for IFC model processing."""
import sys

# Runtime check for BIM dependencies
try:
    import ifcopenshell
    import numpy
    import networkx
    HAS_BIM_DEPENDENCIES = True
except ImportError as e:
    HAS_BIM_DEPENDENCIES = False
    _missing_dependency = str(e).split("'")[1] if "'" in str(e) else "unknown"

    # Provide clear installation instructions
    _install_msg = (
        f"\n{'='*70}\n"
        f"BIM Analysis Tools Not Available\n"
        f"{'='*70}\n"
        f"Missing dependency: {_missing_dependency}\n\n"
        f"BIM analysis features require optional dependencies.\n"
        f"Install them with:\n\n"
        f"  cd backend\n"
        f"  uv sync --extra bim\n\n"
        f"Or use the convenience command:\n\n"
        f"  make install-bim\n"
        f"{'='*70}\n"
    )

    # Log warning but don't fail import (allow graceful degradation)
    import warnings
    warnings.warn(_install_msg, UserWarning, stacklevel=2)

from .ifc_parser_tool import IFCParserTool
from .carbon_tool import CarbonCalculationTool
from .clash_detection_tool import ClashDetectionTool
from .compliance_tool import CodeComplianceTool
from .mep_tool import MEPAnalysisTool
from .knowledge_graph_tool import KnowledgeGraphTool

__all__ = [
    'IFCParserTool',
    'CarbonCalculationTool',
    'ClashDetectionTool',
    'CodeComplianceTool',
    'MEPAnalysisTool',
    'KnowledgeGraphTool',
]
