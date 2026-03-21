"""Environment variable validation script.

Validates that all required environment variables are set with appropriate values.
Run this during development or as part of CI/CD to catch configuration issues early.

Usage:
    python core/utils/scripts/validate_env.py

Exit codes:
    0: All required variables are set
    1: Missing or invalid required variables
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Add parent directory to path to import from core
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from dotenv import load_dotenv


# Required environment variables (must be set)
REQUIRED_VARS = [
    "ENV_MODE",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "REDIS_HOST",
    "REDIS_PORT",
]

# Conditionally required (based on ENV_MODE)
PRODUCTION_REQUIRED = [
    "SUPABASE_JWT_SECRET",
]

# Recommended variables (warn if missing)
RECOMMENDED_VARS = [
    "ANTHROPIC_API_KEY",  # or OPENAI_API_KEY
    "OPENAI_API_KEY",
    "E2B_API_KEY",
    "LANGFUSE_PUBLIC_KEY",
]

# Optional but commonly used
OPTIONAL_VARS = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "TAVILY_API_KEY",
    "REPLICATE_API_TOKEN",
    "BIM_MAX_FILE_SIZE_MB",
]


def validate_url(url: str) -> bool:
    """Validate that a string looks like a URL."""
    return url.startswith("http://") or url.startswith("https://")


def validate_env_mode(mode: str) -> bool:
    """Validate ENV_MODE value."""
    return mode.lower() in ["local", "staging", "production"]


def validate_redis_port(port: str) -> bool:
    """Validate REDIS_PORT is a valid port number."""
    try:
        port_num = int(port)
        return 1 <= port_num <= 65535
    except ValueError:
        return False


def check_required_vars() -> Tuple[List[str], Dict[str, str]]:
    """Check all required environment variables.

    Returns:
        Tuple of (missing_vars, invalid_vars)
    """
    missing = []
    invalid = {}

    for var in REQUIRED_VARS:
        value = os.getenv(var)
        if not value:
            missing.append(var)
        else:
            # Validate specific variables
            if var == "SUPABASE_URL" and not validate_url(value):
                invalid[var] = f"Invalid URL format: {value}"
            elif var == "ENV_MODE" and not validate_env_mode(value):
                invalid[var] = f"Invalid mode (must be local/staging/production): {value}"
            elif var == "REDIS_PORT" and not validate_redis_port(value):
                invalid[var] = f"Invalid port number: {value}"

    # Check production-specific requirements
    env_mode = os.getenv("ENV_MODE", "").lower()
    if env_mode == "production":
        for var in PRODUCTION_REQUIRED:
            value = os.getenv(var)
            if not value:
                missing.append(f"{var} (required in production)")

    return missing, invalid


def check_recommended_vars() -> List[str]:
    """Check recommended environment variables.

    Returns:
        List of missing recommended variables
    """
    missing = []

    # Check if at least one LLM provider key is set
    has_llm_key = any(
        os.getenv(key) for key in ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY"]
    )
    if not has_llm_key:
        missing.append(
            "At least one LLM API key (ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY)"
        )

    # Check other recommended vars
    for var in RECOMMENDED_VARS:
        if var not in ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"] and not os.getenv(var):
            missing.append(var)

    return missing


def print_summary(missing: List[str], invalid: Dict[str, str], recommended_missing: List[str]):
    """Print validation summary."""
    print("\n" + "=" * 70)
    print("Environment Variable Validation Summary")
    print("=" * 70 + "\n")

    # Required variables
    if missing or invalid:
        print("❌ ERRORS - Missing or invalid required variables:\n")
        for var in missing:
            print(f"  ❌ {var}: NOT SET")
        for var, reason in invalid.items():
            print(f"  ❌ {var}: {reason}")
        print()
    else:
        print("✅ All required variables are set\n")

    # Recommended variables
    if recommended_missing:
        print("⚠️  WARNINGS - Missing recommended variables:\n")
        for var in recommended_missing:
            print(f"  ⚠️  {var}: Not set (recommended for full functionality)")
        print()

    # Summary
    env_mode = os.getenv("ENV_MODE", "not set")
    env_file = os.path.join(Path(__file__).parent.parent.parent.parent, ".env")
    env_local = os.path.join(Path(__file__).parent.parent.parent.parent, ".env.local")

    print(f"Environment Mode: {env_mode}")
    print(f".env file: {'✅ exists' if os.path.exists(env_file) else '❌ not found'}")
    print(
        f".env.local file: {'✅ exists' if os.path.exists(env_local) else '⚠️  not found (recommended)'}"
    )
    print("\n" + "=" * 70 + "\n")


def main():
    """Run environment validation."""
    # Try to load .env.local first, then .env
    backend_dir = Path(__file__).parent.parent.parent.parent
    env_local = backend_dir / ".env.local"
    env_file = backend_dir / ".env"

    if env_local.exists():
        load_dotenv(env_local)
        print(f"Loaded environment from {env_local}")
    elif env_file.exists():
        load_dotenv(env_file)
        print(f"Loaded environment from {env_file}")
    else:
        print("⚠️  No .env or .env.local file found - using system environment only")

    # Run validation
    missing, invalid = check_required_vars()
    recommended_missing = check_recommended_vars()

    # Print summary
    print_summary(missing, invalid, recommended_missing)

    # Exit with appropriate code
    if missing or invalid:
        print("Setup Instructions:")
        print("  1. Copy backend/.env.example to backend/.env.local")
        print("  2. Fill in all required values (marked as [REQUIRED])")
        print("  3. Get Supabase credentials from your project settings")
        print("  4. Get LLM API keys from provider websites")
        print("  5. Run this script again to verify\n")
        sys.exit(1)
    elif recommended_missing:
        print("✅ Validation passed (with warnings)")
        print("   Consider setting recommended variables for full functionality\n")
        sys.exit(0)
    else:
        print("✅ Validation passed - all variables configured\n")
        sys.exit(0)


if __name__ == "__main__":
    main()
