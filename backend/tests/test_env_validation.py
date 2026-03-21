"""Tests for environment variable configuration and validation."""

import os
import subprocess
import sys
from pathlib import Path

import pytest


class TestEnvironmentConfiguration:
    """Test environment variable configuration."""

    def test_env_example_exists(self):
        """Verify .env.example file exists."""
        env_example = Path(__file__).parent.parent / ".env.example"
        assert env_example.exists(), ".env.example file not found"

    def test_env_example_has_required_vars(self):
        """Verify .env.example documents all required variables."""
        env_example = Path(__file__).parent.parent / ".env.example"
        content = env_example.read_text()

        required_vars = [
            "ENV_MODE",
            "SUPABASE_URL",
            "SUPABASE_ANON_KEY",
            "SUPABASE_SERVICE_ROLE_KEY",
            "SUPABASE_JWT_SECRET",
            "REDIS_HOST",
            "REDIS_PORT",
        ]

        for var in required_vars:
            assert var in content, (
                f"Required variable {var} not documented in .env.example"
            )

    def test_env_example_has_llm_providers(self):
        """Verify .env.example documents LLM provider keys."""
        env_example = Path(__file__).parent.parent / ".env.example"
        content = env_example.read_text()

        llm_vars = [
            "ANTHROPIC_API_KEY",
            "OPENAI_API_KEY",
            "GEMINI_API_KEY",
        ]

        for var in llm_vars:
            assert var in content, f"LLM variable {var} not documented in .env.example"

    def test_env_example_has_bim_config(self):
        """Verify .env.example documents BIM configuration."""
        env_example = Path(__file__).parent.parent / ".env.example"
        content = env_example.read_text()

        bim_vars = [
            "BIM_MAX_FILE_SIZE_MB",
        ]

        for var in bim_vars:
            assert var in content, f"BIM variable {var} not documented in .env.example"

    def test_env_example_has_sections(self):
        """Verify .env.example is organized into clear sections."""
        env_example = Path(__file__).parent.parent / ".env.example"
        content = env_example.read_text()

        sections = [
            "Environment Mode",
            "Supabase Configuration",
            "Redis Configuration",
            "LLM Provider Configuration",
            "BIM Configuration",
            "Security & Encryption",
        ]

        for section in sections:
            assert section in content, f"Section '{section}' not found in .env.example"

    def test_env_example_has_comments(self):
        """Verify .env.example has explanatory comments."""
        env_example = Path(__file__).parent.parent / ".env.example"
        content = env_example.read_text()

        # Check for comment lines (should have many)
        comment_lines = [
            line for line in content.split("\n") if line.strip().startswith("#")
        ]
        assert len(comment_lines) > 50, (
            f"Expected >50 comment lines in .env.example, found {len(comment_lines)}"
        )

    def test_env_example_marks_required_vars(self):
        """Verify required variables are clearly marked."""
        env_example = Path(__file__).parent.parent / ".env.example"
        content = env_example.read_text()

        # Should have [REQUIRED] markers or similar
        assert "[REQUIRED]" in content or "Required" in content, (
            ".env.example should mark required variables"
        )


class TestGitIgnoreConfiguration:
    """Test .gitignore configuration for environment files."""

    def test_gitignore_excludes_env_local(self):
        """Verify .gitignore excludes .env.local files."""
        gitignore = Path(__file__).parent.parent / ".gitignore"
        assert gitignore.exists(), ".gitignore not found"

        content = gitignore.read_text()

        patterns = [
            ".env.local",
            ".env.*.local",
        ]

        for pattern in patterns:
            assert pattern in content, f"Pattern '{pattern}' not in .gitignore"

    def test_env_local_not_tracked(self):
        """Verify .env.local is not tracked in git."""
        result = subprocess.run(
            ["git", "ls-files", "backend/.env.local"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent,
        )

        assert result.stdout.strip() == "", ".env.local should not be tracked in git"

    def test_env_example_is_tracked(self):
        """Verify .env.example IS tracked in git."""
        result = subprocess.run(
            ["git", "ls-files", "backend/.env.example"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent,
        )

        assert "backend/.env.example" in result.stdout, (
            ".env.example should be tracked in git"
        )


class TestEnvValidationScript:
    """Test the environment validation script."""

    def test_validation_script_exists(self):
        """Verify validation script exists."""
        script = (
            Path(__file__).parent.parent
            / "core"
            / "utils"
            / "scripts"
            / "validate_env.py"
        )
        assert script.exists(), "validate_env.py script not found"

    def test_validation_script_is_executable(self):
        """Verify validation script can be run."""
        script = (
            Path(__file__).parent.parent
            / "core"
            / "utils"
            / "scripts"
            / "validate_env.py"
        )

        # Try to run the script (it may fail validation, but should execute)
        result = subprocess.run(
            [sys.executable, str(script)],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent,
            env={**os.environ, "ENV_MODE": "local"},  # Minimal env for testing
        )

        # Script should execute (exit code 0 or 1, not crash)
        assert result.returncode in (0, 1), (
            f"Validation script crashed with exit code {result.returncode}\n"
            f"Stdout: {result.stdout}\nStderr: {result.stderr}"
        )

        # Should produce output
        assert len(result.stdout) > 0 or len(result.stderr) > 0, (
            "Validation script produced no output"
        )


class TestConfigurationLoading:
    """Test configuration loading from environment."""

    def test_config_loads_from_env(self):
        """Verify Configuration class can load from environment."""
        from core.utils.config import Configuration

        # Should not crash even with minimal environment
        try:
            # This may fail validation, but shouldn't crash during init
            config = Configuration()
        except ValueError as e:
            # Expected if required vars are missing
            assert "Missing required configuration fields" in str(e)
        except Exception as e:
            pytest.fail(f"Configuration loading crashed unexpectedly: {e}")

    def test_config_has_env_mode(self):
        """Verify Configuration has ENV_MODE."""
        from core.utils.config import Configuration, EnvMode

        # Set ENV_MODE for test
        os.environ["ENV_MODE"] = "local"

        try:
            config = Configuration()
            assert hasattr(config, "ENV_MODE")
            assert config.ENV_MODE in [
                EnvMode.LOCAL,
                EnvMode.STAGING,
                EnvMode.PRODUCTION,
            ]
        except ValueError:
            # Expected if other required vars are missing
            pass


class TestDocumentation:
    """Test that environment setup is documented."""

    def test_claude_md_documents_env_setup(self):
        """Verify CLAUDE.md or AGENTS.md documents environment setup."""
        repo_root = Path(__file__).parent.parent.parent
        claude_md = repo_root / "CLAUDE.md"
        agents_md = repo_root / "AGENTS.md"

        # CLAUDE.md is in .gitignore for local dev, so check AGENTS.md in CI
        doc_file = claude_md if claude_md.exists() else agents_md
        assert doc_file.exists(), "Neither CLAUDE.md nor AGENTS.md found"

        content = doc_file.read_text()

        # Should mention environment setup
        assert "Environment Setup" in content or "environment" in content.lower(), (
            "Documentation should mention environment setup"
        )

        # Should mention .env or .env.local
        assert ".env" in content, "Documentation should mention .env files"

    def test_readme_mentions_env_setup(self):
        """Verify README mentions environment configuration."""
        readme = Path(__file__).parent.parent.parent / "README.md"
        assert readme.exists(), "README.md not found"

        content = readme.read_text()

        # Should mention environment configuration
        assert ".env" in content, "README should mention .env files"


class TestRateLimitingEnvVars:
    """Test rate limiting environment variables are documented."""

    def test_env_example_has_rate_limits(self):
        """Verify .env.example documents rate limiting variables."""
        env_example = Path(__file__).parent.parent / ".env.example"
        content = env_example.read_text()

        # Rate limiting section and variables
        rate_limit_indicators = [
            "Rate Limiting",
            "RATE_LIMIT_BIM_UPLOAD",
            "RATE_LIMIT_BIM_ANALYSIS",
            "RATE_LIMIT_AGENT_START",
        ]

        for indicator in rate_limit_indicators:
            assert indicator in content, (
                f"Rate limiting indicator '{indicator}' not in .env.example"
            )
