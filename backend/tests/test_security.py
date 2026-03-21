"""
Security infrastructure tests.

Validates that secrets scanning and security policies are properly configured.
"""

import json
import subprocess
from pathlib import Path

import pytest


def test_secrets_baseline_exists():
    """Verify .secrets.baseline file exists in repository root."""
    baseline_path = Path(__file__).parent.parent.parent / ".secrets.baseline"
    assert baseline_path.exists(), ".secrets.baseline file not found"

    # Verify it's valid JSON
    with open(baseline_path) as f:
        baseline = json.load(f)

    assert "version" in baseline, "Baseline missing version field"
    assert "results" in baseline, "Baseline missing results field"


def test_secrets_scan_passes():
    """Run detect-secrets scan and verify no secrets detected."""
    baseline_path = Path(__file__).parent.parent.parent / ".secrets.baseline"

    # Run detect-secrets scan
    result = subprocess.run(
        ["detect-secrets", "scan", "--baseline", str(baseline_path)],
        cwd=Path(__file__).parent.parent.parent,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, f"Secrets detected! Output:\n{result.stdout}\n{result.stderr}"


def test_precommit_config_exists():
    """Verify pre-commit configuration includes detect-secrets hook."""
    config_path = Path(__file__).parent.parent.parent / ".pre-commit-config.yaml"
    assert config_path.exists(), ".pre-commit-config.yaml not found"

    # Read and verify content
    content = config_path.read_text()
    assert "detect-secrets" in content, "detect-secrets hook not configured"
    assert ".secrets.baseline" in content, "Baseline not referenced in config"


def test_security_policy_exists():
    """Verify SECURITY.md exists with required sections."""
    security_path = Path(__file__).parent.parent.parent / "SECURITY.md"
    assert security_path.exists(), "SECURITY.md not found"

    content = security_path.read_text()

    # Verify required sections
    required_sections = [
        "Secrets Management",
        "Local Development",
        "CI/CD Secrets",
        "Incident Response",
        "Reporting Security Issues",
    ]

    for section in required_sections:
        assert section in content, f"Missing required section: {section}"

    # Verify pre-commit installation instructions present
    assert "pre-commit install" in content, "Missing pre-commit setup instructions"


def test_env_example_has_no_real_secrets():
    """Verify .env.example contains only template values."""
    env_example_path = Path(__file__).parent.parent / ".env.example"

    if not env_example_path.exists():
        pytest.skip(".env.example not found")

    content = env_example_path.read_text()

    # These patterns indicate real secrets (high-entropy or actual keys)
    forbidden_patterns = [
        "sk-",  # OpenAI/Anthropic API keys
        "AIza",  # Google API keys
        "AKIA",  # AWS access keys
        "ghp_",  # GitHub personal access tokens
        "xoxb-",  # Slack bot tokens
    ]

    for pattern in forbidden_patterns:
        assert pattern not in content, (
            f"Found potential real secret pattern '{pattern}' in .env.example"
        )

    # Verify template placeholders are used
    assert any(
        placeholder in content
        for placeholder in [
            "your-",
            "YOUR_",
            "example-",
            "EXAMPLE_",
            "changeme",
            "CHANGE_ME",
            "<your-",
            "sk-ant-...",  # Explicit placeholder format
        ]
    ), ".env.example should use placeholder values, not real keys"


def test_gitignore_protects_secrets():
    """Verify .gitignore properly excludes secret files."""
    gitignore_path = Path(__file__).parent.parent.parent / ".gitignore"
    assert gitignore_path.exists(), ".gitignore not found"

    content = gitignore_path.read_text()

    # Required patterns to protect secrets
    required_patterns = [
        ".env",
        "*.pem",
        "*.key",
    ]

    for pattern in required_patterns:
        assert pattern in content, f"Missing gitignore pattern: {pattern}"


@pytest.mark.slow
def test_detect_secrets_installed():
    """Verify detect-secrets is installed and accessible."""
    result = subprocess.run(
        ["detect-secrets", "--version"],
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, "detect-secrets not installed"
    # Version output is just "1.5.0\n", not "detect-secrets 1.5.0"
    assert result.stdout.strip(), "No version output"
