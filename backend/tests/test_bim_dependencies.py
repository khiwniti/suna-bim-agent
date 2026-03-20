"""Tests for BIM dependencies configuration and runtime checks."""

import importlib
import subprocess
import sys
from pathlib import Path

import pytest


class TestBIMDependenciesConfiguration:
    """Test BIM dependencies are properly configured as optional extras."""

    def test_pyproject_declares_bim_extra(self):
        """Verify pyproject.toml declares [project.optional-dependencies.bim]."""
        import tomllib

        pyproject_path = Path(__file__).parent.parent / "pyproject.toml"
        assert pyproject_path.exists(), "pyproject.toml not found"

        with open(pyproject_path, "rb") as f:
            pyproject = tomllib.load(f)

        # Verify optional-dependencies.bim exists
        assert "project" in pyproject, "Missing [project] section"
        assert "optional-dependencies" in pyproject["project"], (
            "Missing [project.optional-dependencies] section"
        )
        assert "bim" in pyproject["project"]["optional-dependencies"], (
            "Missing [project.optional-dependencies.bim] section"
        )

        # Verify required BIM packages are declared
        bim_deps = pyproject["project"]["optional-dependencies"]["bim"]
        assert any("ifcopenshell" in dep for dep in bim_deps), (
            "ifcopenshell not in BIM dependencies"
        )
        assert any("numpy" in dep for dep in bim_deps), (
            "numpy not in BIM dependencies"
        )
        assert any("networkx" in dep for dep in bim_deps), (
            "networkx not in BIM dependencies"
        )

    def test_bim_not_in_main_dependencies(self):
        """Verify BIM packages are NOT in main dependencies (only in extras)."""
        import tomllib

        pyproject_path = Path(__file__).parent.parent / "pyproject.toml"
        with open(pyproject_path, "rb") as f:
            pyproject = tomllib.load(f)

        main_deps = pyproject["project"]["dependencies"]

        # BIM packages should NOT be in main dependencies
        assert not any("ifcopenshell" in dep for dep in main_deps), (
            "ifcopenshell should be in optional-dependencies.bim, not dependencies"
        )

    def test_makefile_uses_uv_sync_extra(self):
        """Verify Makefile install-bim uses 'uv sync --extra bim'."""
        makefile_path = Path(__file__).parent.parent / "Makefile"
        assert makefile_path.exists(), "Makefile not found"

        content = makefile_path.read_text()

        # Verify install-bim target exists and uses correct command
        assert "install-bim:" in content, "Missing install-bim target in Makefile"
        assert "uv sync --extra bim" in content, (
            "install-bim should use 'uv sync --extra bim'"
        )
        assert "uv pip install" not in content.split("install-bim:")[1].split("\n")[0:2], (
            "install-bim should NOT use 'uv pip install' (use uv sync instead)"
        )

    def test_dockerfile_installs_bim_extras(self):
        """Verify Dockerfile installs BIM extras for production."""
        dockerfile_path = Path(__file__).parent.parent / "Dockerfile"
        assert dockerfile_path.exists(), "Dockerfile not found"

        content = dockerfile_path.read_text()

        # Verify uv sync includes --extra bim
        assert "uv sync" in content, "Dockerfile should use 'uv sync'"
        assert "--extra bim" in content, (
            "Dockerfile should install BIM extras with 'uv sync --extra bim'"
        )

    def test_readme_documents_bim_installation(self):
        """Verify README documents BIM dependencies installation."""
        readme_path = Path(__file__).parent.parent.parent / "README.md"
        assert readme_path.exists(), "README.md not found"

        content = readme_path.read_text()

        # Verify BIM installation is documented
        assert "--extra bim" in content or "install-bim" in content, (
            "README should document BIM installation (uv sync --extra bim or make install-bim)"
        )


class TestBIMRuntimeChecks:
    """Test runtime checks for missing BIM dependencies."""

    def test_bim_init_has_runtime_check(self):
        """Verify core/tools/bim/__init__.py has runtime dependency check."""
        init_path = Path(__file__).parent.parent / "core" / "tools" / "bim" / "__init__.py"
        content = init_path.read_text()

        # Verify runtime check exists
        assert "HAS_BIM_DEPENDENCIES" in content, (
            "Missing HAS_BIM_DEPENDENCIES check in bim/__init__.py"
        )
        assert "import ifcopenshell" in content, (
            "Missing ifcopenshell import check"
        )
        assert "except ImportError" in content, (
            "Missing ImportError handling for BIM dependencies"
        )

    def test_bim_init_shows_clear_error_message(self):
        """Verify runtime check provides clear installation instructions."""
        init_path = Path(__file__).parent.parent / "core" / "tools" / "bim" / "__init__.py"
        content = init_path.read_text()

        # Verify installation instructions are included
        assert "uv sync --extra bim" in content, (
            "Missing 'uv sync --extra bim' installation instruction"
        )
        assert "make install-bim" in content or "install-bim" in content, (
            "Missing alternative installation instruction"
        )

    def test_bim_tools_handle_missing_dependencies_gracefully(self):
        """Verify BIM tools can be imported even if ifcopenshell is missing."""
        # This test verifies graceful degradation
        # Import should succeed even if ifcopenshell is not installed
        try:
            from core.tools.bim import IFCParserTool, CarbonCalculationTool
            # Import should succeed
            assert True
        except ImportError as e:
            pytest.fail(f"BIM tool imports should not fail: {e}")


class TestBIMDependenciesInstalled:
    """Test BIM dependencies are actually installed (if extras were synced)."""

    def test_ifcopenshell_importable(self):
        """Verify ifcopenshell can be imported if BIM extras are installed."""
        try:
            import ifcopenshell
            # If this succeeds, BIM extras are installed
            assert hasattr(ifcopenshell, "open"), "ifcopenshell.open not available"
        except ImportError:
            pytest.skip("BIM extras not installed (run: uv sync --extra bim)")

    def test_numpy_importable(self):
        """Verify numpy can be imported if BIM extras are installed."""
        try:
            import numpy
            assert hasattr(numpy, "array"), "numpy.array not available"
        except ImportError:
            pytest.skip("BIM extras not installed (run: uv sync --extra bim)")

    def test_networkx_importable(self):
        """Verify networkx can be imported if BIM extras are installed."""
        try:
            import networkx
            assert hasattr(networkx, "Graph"), "networkx.Graph not available"
        except ImportError:
            pytest.skip("BIM extras not installed (run: uv sync --extra bim)")

    def test_bim_tools_work_with_extras_installed(self):
        """Verify BIM tools work correctly when extras are installed."""
        try:
            import ifcopenshell
        except ImportError:
            pytest.skip("BIM extras not installed (run: uv sync --extra bim)")

        from core.tools.bim import IFCParserTool, CarbonCalculationTool
        from core.tools.bim.base import HAS_IFC

        # Verify HAS_IFC flag is True when ifcopenshell is available
        assert HAS_IFC is True, (
            "HAS_IFC should be True when ifcopenshell is installed"
        )

        # Verify tool classes are importable (instantiation requires project_id)
        assert IFCParserTool is not None, "IFCParserTool should be importable"
        assert CarbonCalculationTool is not None, "CarbonCalculationTool should be importable"

        # Verify tool classes have expected methods
        assert hasattr(IFCParserTool, 'parse_ifc'), "IFCParserTool missing parse_ifc method"
        assert hasattr(CarbonCalculationTool, 'calculate_carbon'), (
            "CarbonCalculationTool missing calculate_carbon method"
        )


class TestInstallationWorkflow:
    """Test the complete installation workflow."""

    def test_uv_sync_extra_bim_command_structure(self):
        """Verify the 'uv sync --extra bim' command is well-formed."""
        # This is a static verification that the command is valid
        # Actual execution would be in CI/CD or manual testing

        import shutil
        uv_path = shutil.which("uv")
        if not uv_path:
            pytest.skip("uv not found in PATH")

        # Verify uv supports --extra flag (uv >= 0.1.0)
        result = subprocess.run(
            ["uv", "sync", "--help"],
            capture_output=True,
            text=True,
            timeout=5
        )

        assert "--extra" in result.stdout, (
            "uv sync doesn't support --extra flag (upgrade uv)"
        )

    @pytest.mark.slow
    def test_documentation_examples_are_valid(self):
        """Verify installation examples in README are syntactically correct."""
        readme_path = Path(__file__).parent.parent.parent / "README.md"
        content = readme_path.read_text()

        # Extract bash code blocks
        import re
        bash_blocks = re.findall(r"```bash\n(.*?)\n```", content, re.DOTALL)

        for block in bash_blocks:
            if "uv sync" in block or "make install-bim" in block:
                # Verify no obvious syntax errors
                assert not block.strip().endswith("\\"), (
                    f"Incomplete command in README: {block}"
                )
                assert block.count('"') % 2 == 0, (
                    f"Unmatched quotes in README: {block}"
                )
