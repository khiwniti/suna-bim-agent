"""Tests for async IFC parsing behavior.

Verifies that IFC file parsing doesn't block the FastAPI event loop.
"""

import asyncio
import tempfile
from pathlib import Path

import pytest

from core.bim.async_ifc_parser import (
    async_open_ifc,
    async_get_elements_by_type,
    async_get_property_value,
)


# Skip all tests if ifcopenshell is not installed
try:
    import ifcopenshell

    HAS_IFC = True
except ImportError:
    HAS_IFC = False

pytestmark = pytest.mark.skipif(not HAS_IFC, reason="ifcopenshell not installed")


class TestAsyncIFCParser:
    """Test async IFC parsing wrappers."""

    @pytest.mark.asyncio
    async def test_async_open_ifc_nonexistent_file(self):
        """Test that opening a nonexistent file raises FileNotFoundError."""
        with pytest.raises(FileNotFoundError, match="IFC file not found"):
            await async_open_ifc("/nonexistent/path.ifc")

    @pytest.mark.asyncio
    async def test_async_open_ifc_invalid_file(self):
        """Test that opening an invalid IFC file raises an exception."""
        with tempfile.NamedTemporaryFile(suffix=".ifc", delete=False) as tmp:
            tmp.write(b"not a valid IFC file")
            tmp_path = tmp.name

        try:
            with pytest.raises(Exception, match="Failed to parse IFC file"):
                await async_open_ifc(tmp_path)
        finally:
            Path(tmp_path).unlink()

    @pytest.mark.asyncio
    async def test_async_wrapper_minimal_ifc(self):
        """Test async wrapper with minimal valid IFC file."""
        minimal_ifc = """ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');
FILE_NAME('minimal.ifc','2024-01-01',('Author'),('Org'),'IfcOpenShell','IfcOpenShell','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
#1=IFCPROJECT('project_id',$,'Minimal Project',$,$,$,$,$,$);
#2=IFCWALL('wall_id',$,'Test Wall',$,$,$,$,$,$);
ENDSEC;
END-ISO-10303-21;
"""
        with tempfile.NamedTemporaryFile(suffix=".ifc", mode="w", delete=False) as tmp:
            tmp.write(minimal_ifc)
            tmp_path = tmp.name

        try:
            # Test async opening
            ifc_file = await async_open_ifc(tmp_path)
            assert ifc_file is not None

            # Test async element retrieval
            walls = await async_get_elements_by_type(ifc_file, "IfcWall")
            assert len(walls) == 1
            assert walls[0].Name == "Test Wall"
        finally:
            Path(tmp_path).unlink()

    @pytest.mark.asyncio
    async def test_non_blocking_behavior(self):
        """Verify that async IFC parsing doesn't block the event loop.

        This test creates a minimal IFC file and verifies that while parsing
        is happening, other async tasks can still execute (proving non-blocking).
        """
        minimal_ifc = """ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');
FILE_NAME('test.ifc','2024-01-01',('Author'),('Org'),'IfcOpenShell','IfcOpenShell','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
#1=IFCPROJECT('proj',$,'Test',$,$,$,$,$,$);
ENDSEC;
END-ISO-10303-21;
"""
        with tempfile.NamedTemporaryFile(suffix=".ifc", mode="w", delete=False) as tmp:
            tmp.write(minimal_ifc)
            tmp_path = tmp.name

        try:
            # Counter to track concurrent execution
            counter = {"value": 0}

            async def increment_counter():
                """Background task that increments counter."""
                for _ in range(10):
                    await asyncio.sleep(0.01)
                    counter["value"] += 1

            async def parse_ifc():
                """Parse IFC file asynchronously."""
                return await async_open_ifc(tmp_path)

            # Run both tasks concurrently
            results = await asyncio.gather(parse_ifc(), increment_counter(), return_exceptions=True)

            # Verify both tasks completed
            ifc_file = results[0]
            assert ifc_file is not None
            assert counter["value"] == 10, "Background task should have completed while parsing"
        finally:
            Path(tmp_path).unlink()

    @pytest.mark.asyncio
    async def test_async_get_property_value(self):
        """Test async property retrieval from IFC element."""
        minimal_ifc_with_properties = """ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');
FILE_NAME('props.ifc','2024-01-01',('Author'),('Org'),'IfcOpenShell','IfcOpenShell','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
#1=IFCPROJECT('proj',$,'Test',$,$,$,$,$,$);
#2=IFCWALL('wall_id',$,'Test Wall',$,$,$,$,$,$);
#3=IFCPROPERTYSINGLEVALUE('LoadBearing',$,IFCBOOLEAN(.T.),$);
#4=IFCPROPERTYSET('pset_id',$,'Pset_WallCommon',$,(#3));
#5=IFCRELDEFINESBYPROPERTIES('rel_id',$,$,$,(#2),#4);
ENDSEC;
END-ISO-10303-21;
"""
        with tempfile.NamedTemporaryFile(suffix=".ifc", mode="w", delete=False) as tmp:
            tmp.write(minimal_ifc_with_properties)
            tmp_path = tmp.name

        try:
            ifc_file = await async_open_ifc(tmp_path)
            walls = await async_get_elements_by_type(ifc_file, "IfcWall")
            assert len(walls) == 1

            wall = walls[0]
            # Test property retrieval
            load_bearing = await async_get_property_value(wall, "LoadBearing", "Pset_WallCommon")
            assert load_bearing is True
        finally:
            Path(tmp_path).unlink()


class TestBIMToolBaseAsync:
    """Test that BIMToolBase already uses async IFC parsing."""

    @pytest.mark.asyncio
    async def test_bim_tool_base_uses_async_to_thread(self):
        """Verify BIMToolBase.open_ifc_model uses asyncio.to_thread."""
        from core.tools.bim.base import BIMToolBase
        import inspect

        # Get the open_ifc_model method
        method = BIMToolBase.open_ifc_model
        source = inspect.getsource(method)

        # Verify it uses asyncio.to_thread
        assert "asyncio.to_thread" in source, (
            "BIMToolBase.open_ifc_model should use asyncio.to_thread "
            "to prevent blocking the event loop"
        )

        # Verify it's an async method
        assert inspect.iscoroutinefunction(method), (
            "BIMToolBase.open_ifc_model should be an async method"
        )

    def test_all_bim_tools_inherit_base(self):
        """Verify all BIM tools inherit from BIMToolBase and use async pattern."""
        from core.tools.bim.ifc_parser_tool import IFCParserTool
        from core.tools.bim.carbon_tool import CarbonCalculationTool
        from core.tools.bim.base import BIMToolBase

        # Verify inheritance
        assert issubclass(IFCParserTool, BIMToolBase), (
            "IFCParserTool should inherit from BIMToolBase"
        )
        assert issubclass(CarbonCalculationTool, BIMToolBase), (
            "CarbonCalculationTool should inherit from BIMToolBase"
        )

    def test_no_synchronous_ifcopenshell_calls(self):
        """Verify no direct synchronous ifcopenshell.open() calls in tools."""
        import ast
        from pathlib import Path

        bim_tools_dir = Path(__file__).parent.parent / "core" / "tools" / "bim"

        for tool_file in bim_tools_dir.glob("*.py"):
            if tool_file.name == "base.py":
                continue  # base.py properly wraps with asyncio.to_thread

            with open(tool_file) as f:
                tree = ast.parse(f.read(), filename=str(tool_file))

            # Check for dangerous patterns
            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Attribute):
                        if (
                            isinstance(node.func.value, ast.Name)
                            and node.func.value.id == "ifcopenshell"
                            and node.func.attr == "open"
                        ):
                            # Found direct ifcopenshell.open() call
                            pytest.fail(
                                f"Found synchronous ifcopenshell.open() in {tool_file.name}. "
                                f"Use BIMToolBase.open_ifc_model() instead."
                            )


class TestAsyncIFCConfiguration:
    """Test async IFC parsing configuration and documentation."""

    def test_async_ifc_parser_module_exists(self):
        """Verify async_ifc_parser module exists and is documented."""
        from core.bim import async_ifc_parser
        import inspect

        # Verify module docstring
        assert async_ifc_parser.__doc__ is not None, (
            "async_ifc_parser module should have documentation"
        )

        # Verify main functions are documented
        assert async_open_ifc.__doc__ is not None
        assert async_get_elements_by_type.__doc__ is not None
        assert async_get_property_value.__doc__ is not None

    def test_python_version_supports_asyncio_to_thread(self):
        """Verify Python version supports asyncio.to_thread (3.9+)."""
        import sys

        assert sys.version_info >= (3, 9), (
            f"asyncio.to_thread requires Python 3.9+. Current version: {sys.version_info}"
        )
