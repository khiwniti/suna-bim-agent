import asyncio
import sys
import os
import uuid
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from core.utils.logger import logger
from core.services.supabase import DBConnection
from core.sandbox.resolver import resolve_sandbox, get_resolver


@pytest.mark.asyncio
async def test_resolver_consistency():
    if not os.getenv("SUPABASE_URL") or not os.getenv("DATABASE_URL"):
        pytest.skip("Supabase credentials not configured")

    try:
        db = DBConnection()
        await db.initialize()
        client = await db.client

        result = (
            await client.table("projects")
            .select("project_id, account_id")
            .limit(1)
            .execute()
        )
    except Exception as e:
        pytest.skip(f"Database connection failed: {e}")

    if not result.data:
        pytest.skip("No projects found in database")

    project_id = result.data[0]["project_id"]
    account_id = str(result.data[0]["account_id"])

    print(f"Using project: {project_id}")
    print(f"Account: {account_id}\n")

    print("[TEST 1] First resolve call...")
    sandbox_info_1 = await resolve_sandbox(
        project_id=project_id, account_id=account_id, db_client=client
    )

    assert sandbox_info_1 is not None, "Failed to resolve sandbox on first call"
    print(f" Sandbox ID: {sandbox_info_1.sandbox_id}")

    print("\n[TEST 2] Second resolve call (should return SAME sandbox)...")
    sandbox_info_2 = await resolve_sandbox(
        project_id=project_id, account_id=account_id, db_client=client
    )

    assert sandbox_info_2 is not None, "Failed to resolve sandbox on second call"
    print(f" Sandbox ID: {sandbox_info_2.sandbox_id}")

    print("\n[TEST 3] Parallel resolve calls (should all return SAME sandbox)...")
    tasks = [
        resolve_sandbox(project_id=project_id, account_id=account_id, db_client=client)
        for _ in range(5)
    ]
    results = await asyncio.gather(*tasks)

    sandbox_ids = [r.sandbox_id for r in results if r]
    print(f" Sandbox IDs: {sandbox_ids}")

    all_same = (
        len(set(sandbox_ids + [sandbox_info_1.sandbox_id, sandbox_info_2.sandbox_id]))
        == 1
    )

    assert all_same, (
        f"Different sandbox IDs: {sandbox_info_1.sandbox_id}, {sandbox_info_2.sandbox_id}, {sandbox_ids}"
    )
    print(
        f"All resolve calls returned the SAME sandbox ID: {sandbox_info_1.sandbox_id}"
    )

    await db.disconnect()


@pytest.mark.asyncio
async def test_resolver_vs_upload_handler():
    if not os.getenv("SUPABASE_URL") or not os.getenv("DATABASE_URL"):
        pytest.skip("Supabase credentials not configured")

    try:
        db = DBConnection()
        await db.initialize()
        client = await db.client

        result = (
            await client.table("projects")
            .select("project_id, account_id")
            .limit(1)
            .execute()
        )
    except Exception as e:
        pytest.skip(f"Database connection failed: {e}")

    if not result.data:
        pytest.skip("No projects found in database")

    project_id = result.data[0]["project_id"]
    account_id = str(result.data[0]["account_id"])

    print(f"Project: {project_id}")
    print(f"Account: {account_id}\n")

    print("[STEP 1] Simulating upload_handler resolve...")
    from core.files.upload_handler import ensure_sandbox_for_thread

    sandbox_upload, sandbox_id_upload = await ensure_sandbox_for_thread(
        client=client,
        project_id=project_id,
        files=[("test.txt", b"test content", "text/plain", None)],
    )

    if sandbox_upload:
        print(f" Upload handler sandbox: {sandbox_id_upload}")
    else:
        print(" Upload handler: No sandbox (no files or error)")

    print("\n[STEP 2] Simulating tool_base resolve...")
    sandbox_info_tool = await resolve_sandbox(
        project_id=project_id, account_id=account_id, db_client=client
    )

    if sandbox_info_tool:
        print(f" Tool base sandbox: {sandbox_info_tool.sandbox_id}")
    else:
        print(" Tool base: Failed to resolve")

    if sandbox_upload and sandbox_info_tool:
        assert sandbox_id_upload == sandbox_info_tool.sandbox_id, (
            f"Upload and tool use different sandboxes: {sandbox_id_upload} vs {sandbox_info_tool.sandbox_id}"
        )
        print("Upload handler and tool base use the SAME sandbox (correct)")

    await db.disconnect()


async def main():
    if "--upload-test" in sys.argv:
        await test_resolver_vs_upload_handler()
    else:
        await test_resolver_consistency()


if __name__ == "__main__":
    asyncio.run(main())
