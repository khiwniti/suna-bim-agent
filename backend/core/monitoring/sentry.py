"""
Sentry error tracking and performance monitoring integration.

Provides centralized error tracking, performance monitoring, and custom context
for production debugging.
"""

import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.integrations.asyncio import AsyncioIntegration
from core.utils.logger import logger


def init_sentry() -> None:
    """
    Initialize Sentry SDK for error tracking and performance monitoring.

    Configuration via environment variables:
    - SENTRY_DSN: Sentry project DSN (required)
    - SENTRY_ENVIRONMENT: Environment name (dev/staging/production)
    - SENTRY_TRACES_SAMPLE_RATE: Performance monitoring sample rate (0.0-1.0)
    - SENTRY_PROFILES_SAMPLE_RATE: Profiling sample rate (0.0-1.0)
    - SENTRY_SEND_DEFAULT_PII: Whether to send personally identifiable information
    """
    dsn = os.getenv("SENTRY_DSN")

    # Skip initialization if DSN not configured
    if not dsn:
        logger.info("Sentry DSN not configured, error tracking disabled")
        return

    environment = os.getenv("SENTRY_ENVIRONMENT", "development")
    traces_sample_rate = float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1"))
    profiles_sample_rate = float(os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "0.1"))
    send_default_pii = os.getenv("SENTRY_SEND_DEFAULT_PII", "false").lower() == "true"

    try:
        sentry_sdk.init(
            dsn=dsn,
            environment=environment,
            traces_sample_rate=traces_sample_rate,
            profiles_sample_rate=profiles_sample_rate,
            send_default_pii=send_default_pii,
            integrations=[
                FastApiIntegration(transaction_style="url"),
                StarletteIntegration(transaction_style="url"),
                AsyncioIntegration(),
            ],
            # Set release from VERSION environment variable if available
            release=os.getenv("VERSION"),
            # Attach server name for distributed deployments
            server_name=os.getenv("HOSTNAME", "carbon-bim-api"),
            # Enable breadcrumbs for better debugging context
            max_breadcrumbs=50,
            # Set debug mode based on environment
            debug=environment == "development",
        )

        logger.info(
            f"Sentry initialized: environment={environment}, "
            f"traces_sample_rate={traces_sample_rate}, "
            f"profiles_sample_rate={profiles_sample_rate}"
        )

    except Exception as e:
        logger.error(f"Failed to initialize Sentry: {e}")


def capture_bim_error(
    error: Exception,
    tool_name: str,
    file_path: str | None = None,
    user_id: str | None = None,
    **extra_context,
) -> None:
    """
    Capture BIM tool-specific errors with rich context.

    Args:
        error: The exception that occurred
        tool_name: Name of the BIM tool (e.g., "carbon_calculator", "ifc_parser")
        file_path: Path to IFC file being processed
        user_id: User identifier for debugging
        **extra_context: Additional context key-value pairs
    """
    with sentry_sdk.push_scope() as scope:
        scope.set_context(
            "bim_tool", {"tool_name": tool_name, "file_path": file_path, **extra_context}
        )

        if user_id:
            scope.set_user({"id": user_id})

        scope.set_tag("tool_category", "bim")
        scope.set_tag("tool_name", tool_name)

        sentry_sdk.capture_exception(error)


def capture_llm_error(
    error: Exception, provider: str, model: str, user_id: str | None = None, **extra_context
) -> None:
    """
    Capture LLM API errors with provider and model context.

    Args:
        error: The exception that occurred
        provider: LLM provider (e.g., "openai", "anthropic")
        model: Model identifier (e.g., "gpt-4", "claude-3-opus")
        user_id: User identifier for debugging
        **extra_context: Additional context key-value pairs
    """
    with sentry_sdk.push_scope() as scope:
        scope.set_context("llm", {"provider": provider, "model": model, **extra_context})

        if user_id:
            scope.set_user({"id": user_id})

        scope.set_tag("error_category", "llm")
        scope.set_tag("llm_provider", provider)
        scope.set_tag("llm_model", model)

        sentry_sdk.capture_exception(error)


def capture_auth_error(
    error: Exception, auth_type: str, user_id: str | None = None, **extra_context
) -> None:
    """
    Capture authentication and authorization errors.

    Args:
        error: The exception that occurred
        auth_type: Type of auth operation (e.g., "login", "token_refresh", "permission_check")
        user_id: User identifier for debugging
        **extra_context: Additional context key-value pairs
    """
    with sentry_sdk.push_scope() as scope:
        scope.set_context("authentication", {"auth_type": auth_type, **extra_context})

        if user_id:
            scope.set_user({"id": user_id})

        scope.set_tag("error_category", "auth")
        scope.set_tag("auth_type", auth_type)

        sentry_sdk.capture_exception(error)


def set_user_context(user_id: str, email: str | None = None, **user_data) -> None:
    """
    Set user context for error tracking.

    Args:
        user_id: User identifier
        email: User email (optional)
        **user_data: Additional user context key-value pairs
    """
    sentry_sdk.set_user({"id": user_id, "email": email, **user_data})


def clear_user_context() -> None:
    """Clear user context (e.g., on logout)."""
    sentry_sdk.set_user(None)


def add_breadcrumb(message: str, category: str, level: str = "info", **data) -> None:
    """
    Add a breadcrumb for debugging context.

    Args:
        message: Breadcrumb message
        category: Category (e.g., "http", "db", "cache", "bim")
        level: Severity level ("debug", "info", "warning", "error", "fatal")
        **data: Additional breadcrumb data
    """
    sentry_sdk.add_breadcrumb(message=message, category=category, level=level, data=data)
