"""Tests for BIM analysis tools — validates tool interface and mock data."""
import pytest


def test_bim_tools_importable():
    from core.tools.bim import (
        IFCParserTool,
        CarbonCalculationTool,
        ClashDetectionTool,
        CodeComplianceTool,
        MEPAnalysisTool,
    )
    assert IFCParserTool is not None
    assert CarbonCalculationTool is not None
    assert ClashDetectionTool is not None
    assert CodeComplianceTool is not None
    assert MEPAnalysisTool is not None


def test_carbon_tool_has_expected_method():
    from core.tools.bim.carbon_tool import CarbonCalculationTool
    assert hasattr(CarbonCalculationTool, "calculate_carbon")


def test_clash_tool_has_expected_method():
    from core.tools.bim.clash_detection_tool import ClashDetectionTool
    assert hasattr(ClashDetectionTool, "detect_clashes")


def test_compliance_tool_has_expected_method():
    from core.tools.bim.compliance_tool import CodeComplianceTool
    assert hasattr(CodeComplianceTool, "check_compliance")


@pytest.mark.asyncio
async def test_carbon_tool_mock_response(mocker):
    from core.tools.bim.carbon_tool import CarbonCalculationTool
    tool = CarbonCalculationTool(project_id="test-project")
    # Prevent real sandbox lookup; load_ifc_content returns empty bytes → triggers mock path
    mocker.patch.object(tool, "load_ifc_content", return_value=b"")
    result = await tool.calculate_carbon(file_path="/nonexistent/model.ifc")
    assert result is not None
    assert hasattr(result, "output") or hasattr(result, "error")


@pytest.mark.asyncio
async def test_clash_tool_mock_response(mocker):
    from core.tools.bim.clash_detection_tool import ClashDetectionTool
    tool = ClashDetectionTool(project_id="test-project")
    mocker.patch.object(tool, "load_ifc_content", return_value=b"")
    result = await tool.detect_clashes(file_path="/nonexistent/model.ifc")
    assert result is not None
    assert hasattr(result, "output") or hasattr(result, "error")


@pytest.mark.asyncio
async def test_compliance_tool_mock_response(mocker):
    from core.tools.bim.compliance_tool import CodeComplianceTool
    tool = CodeComplianceTool(project_id="test-project")
    mocker.patch.object(tool, "load_ifc_content", return_value=b"")
    result = await tool.check_compliance(file_path="/nonexistent/model.ifc")
    assert result is not None
    assert hasattr(result, "output") or hasattr(result, "error")


def test_bim_router_importable():
    from core.bim.api import router
    assert router is not None
    routes = [r.path for r in router.routes]
    assert "/bim/upload" in routes
    assert "/bim/health" in routes
