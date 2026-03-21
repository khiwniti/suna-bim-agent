---
status: resolved
trigger: "supabase-test-ci: Backend test tests/sandbox_resolver_test.py::test_resolver_consistency fails in CI with httpx.ConnectError"
created: 2026-03-21T07:00:00Z
updated: 2026-03-21T07:05:00Z
---

## Current Focus

hypothesis: Test makes real database calls to Supabase but CI has no database available
test: Compare with test_monitoring.py integration tests which skip when services unavailable
expecting: Add pytest skip marker for tests requiring database connection
next_action: Fix test to skip when Supabase not available

## Symptoms

expected: Test should pass (or be skipped) when running in CI without Supabase
actual: Test fails with httpx.ConnectError - tries to connect to Supabase but CI has no database
errors: |
  httpx.ConnectError: All connection attempts failed
  Test tries: `result = await client.table('projects').select('project_id, account_id').limit(1).execute()`
reproduction: uv run pytest tests/ -v --maxfail=1 in CI (GitHub Actions)
timeline: Test was added to verify sandbox resolver consistency but requires real DB

## Evidence

- timestamp: 2026-03-21T07:00:00Z
  checked: backend/tests/test_monitoring.py (lines 401-458)
  found: |
    Integration tests use two patterns:
    1. `if not os.getenv("SENTRY_DSN"): pytest.skip("SENTRY_DSN not configured")` (line 410-411)
    2. `except Exception: pytest.skip("Required services not available")` (line 457-458)
  implication: Tests that require live services should skip when unavailable

- timestamp: 2026-03-21T07:01:00Z
  checked: backend/tests/sandbox_resolver_test.py
  found: |
    - Test imports DBConnection and makes real database calls
    - No skip marker or exception handling
    - Test is not marked as integration/e2e test
  implication: Test will always fail in CI without database

## Resolution

root_cause: Test `test_resolver_consistency` makes real database calls without any fallback for CI environment where database is unavailable

fix: Add skip logic similar to test_monitoring.py:
1. Check for required environment variables (SUPABASE_URL, DATABASE_URL)
2. Skip test if not configured
3. Wrap in try/except to skip on connection failures

files_changed:
- backend/tests/sandbox_resolver_test.py
