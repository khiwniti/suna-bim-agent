#!/usr/bin/env python3
"""
Script to clean up orphaned Redis keys with TTL -1 (no expiration).
Run this to fix keys that were created before TTL was properly set.
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from core.services import redis

TTL_TO_SET = 3600


async def cleanup():
    print("🔌 Connecting to Redis...")
    await redis.initialize_async()
    print("✅ Connected!")

    patterns = [
        "agent_run:*:stream",
        "agent_run:*:pubsub",
        "agent_run:*:control*",
        "active_run:*",
        "agent_run_lock:*",
    ]

    total_fixed = 0
    total_scanned = 0

    for pattern in patterns:
        print(f"\n🔍 Scanning: {pattern}")
        keys = await redis.scan_keys(pattern)
        print(f"   Found {len(keys)} keys")

        for key in keys:
            total_scanned += 1
            try:
                ttl = await redis.ttl(key)
                if ttl == -1:
                    await redis.expire(key, TTL_TO_SET)
                    print(f"   ✅ Set TTL on: {key}")
                    total_fixed += 1
                elif ttl == -2:
                    pass
            except Exception as e:
                print(f"   ❌ Error on {key}: {e}")

    print(f"\n🎉 Done! Scanned {total_scanned} keys, fixed {total_fixed} with missing TTL")
    print(f"   Keys will expire in {TTL_TO_SET} seconds ({TTL_TO_SET // 60} minutes)")


if __name__ == "__main__":
    asyncio.run(cleanup())
