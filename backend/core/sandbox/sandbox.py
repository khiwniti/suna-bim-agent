"""E2B sandbox provider (replaces Daytona)."""

from e2b import AsyncSandbox
from core.utils.logger import logger
from core.utils.config import config

E2B_TEMPLATE = "base"
SANDBOX_TIMEOUT = 3600  # 1 hour


def _api_key() -> str:
    key = config.E2B_API_KEY
    if not key:
        raise RuntimeError("E2B_API_KEY is not configured")
    return key


async def get_or_start_sandbox(sandbox_id: str) -> AsyncSandbox:
    """Connect to an existing E2B sandbox by ID."""
    logger.info(f"Connecting to E2B sandbox: {sandbox_id}")
    try:
        sandbox = await AsyncSandbox.connect(sandbox_id, api_key=_api_key())
        logger.info(f"Connected to sandbox {sandbox_id}")
        return sandbox
    except Exception as e:
        logger.error(f"Failed to connect to sandbox {sandbox_id}: {e}")
        raise


async def create_sandbox(password: str, project_id: str = None) -> AsyncSandbox:
    """Create a new E2B sandbox."""
    logger.info("Creating new E2B sandbox")
    metadata = {"project_id": project_id or "", "vnc_password": password}
    sandbox = await AsyncSandbox.create(
        api_key=_api_key(),
        template=E2B_TEMPLATE,
        timeout=SANDBOX_TIMEOUT,
        metadata=metadata,
    )
    logger.info(f"Created sandbox: {sandbox.sandbox_id}")
    return sandbox


async def delete_sandbox(sandbox_id: str) -> bool:
    """Delete a sandbox by its ID."""
    logger.info(f"Deleting sandbox: {sandbox_id}")
    try:
        sandbox = await get_or_start_sandbox(sandbox_id)
        killed = await sandbox.kill()
        logger.info(f"Deleted sandbox {sandbox_id}")
        return killed
    except Exception as e:
        logger.error(f"Error deleting sandbox {sandbox_id}: {e}")
        raise


# Compatibility alias (was `daytona = AsyncDaytona(...)` before migration)
daytona = None
