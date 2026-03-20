# Testing Strategy

## Test Frameworks

### Backend (Python)
- **pytest** - Main test framework
- **pytest-asyncio** - Async test support
- **httpx** - HTTP client for API testing
- **pytest-mock** - Mocking utilities

### Frontend (TypeScript)
- **Playwright** - E2E testing
- **Vitest** (future) - Unit testing
- **@testing-library/react** (future) - Component testing

## Test Structure

### Backend Tests

```
backend/tests/
├── conftest.py              # Shared fixtures
├── e2e/                     # End-to-end tests
│   └── test_full_flow.py   # Complete user journey
├── integration/             # Integration tests
│   ├── test_api_endpoints.py
│   └── test_database.py
├── unit/                    # Unit tests
│   ├── tools/
│   │   ├── test_carbon_tool.py
│   │   └── test_ifc_parser_tool.py
│   └── services/
│       └── test_supabase_service.py
└── test_bim_tools.py       # BIM-specific tests
```

### Frontend Tests

```
apps/frontend/
├── e2e/                    # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── agents.spec.ts
│   └── bim.spec.ts
└── __tests__/             # Unit tests (future)
    └── components/
```

## Test Markers (Backend)

```python
import pytest

# End-to-end tests (full system integration)
@pytest.mark.e2e
def test_full_agent_flow():
    pass

# Slow tests (>30 seconds)
@pytest.mark.slow
def test_large_ifc_processing():
    pass

# Tests requiring billing/credits
@pytest.mark.billing
def test_credit_consumption():
    pass

# Tests with large context (>200K tokens)
@pytest.mark.large_context
def test_massive_prompt():
    pass
```

**Run Specific Markers**:
```bash
# Run only E2E tests
uv run pytest tests/ -m e2e -v

# Skip slow tests
uv run pytest tests/ -m "not slow" -v

# Run specific test
uv run pytest tests/ -k "test_carbon_calculation" -v
```

## Fixtures (Backend)

### Common Fixtures (`conftest.py`)

```python
import pytest
from httpx import AsyncClient
from core.config.settings import settings

@pytest.fixture
async def client():
    """HTTP client for API testing."""
    from api import app
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def mock_supabase(mocker):
    """Mock Supabase client."""
    mock = mocker.patch("core.services.supabase_service.supabase_client")
    mock.auth.get_user.return_value = {"id": "user_123"}
    return mock

@pytest.fixture
def sample_ifc_file(tmp_path):
    """Create sample IFC file for testing."""
    ifc_content = """ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');
...
ENDSEC;
DATA;
...
ENDSEC;
END-ISO-10303-21;"""

    file_path = tmp_path / "sample.ifc"
    file_path.write_text(ifc_content)
    return str(file_path)

@pytest.fixture
def mock_carbon_factors():
    """Mock emission factors database."""
    return {
        "concrete": 0.15,  # kgCO2e/kg
        "steel": 1.85,
        "timber": 0.45,
    }
```

## Test Patterns

### API Endpoint Testing

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_agent(client: AsyncClient, mock_supabase):
    """Test agent creation endpoint."""
    # Arrange
    payload = {
        "name": "Test Agent",
        "system_prompt": "You are a helpful assistant",
        "tools": ["web_search", "calculator"]
    }

    # Act
    response = await client.post("/api/v1/agents", json=payload)

    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Agent"
    assert "id" in data
    assert "created_at" in data
```

### Tool Testing

```python
import pytest
from core.tools.bim.carbon_tool import CarbonCalculationTool

@pytest.mark.asyncio
async def test_carbon_calculation(sample_ifc_file, mock_carbon_factors):
    """Test carbon calculation for IFC model."""
    # Arrange
    tool = CarbonCalculationTool()

    # Act
    result = await tool.calculate_carbon(
        file_path=sample_ifc_file,
        lifecycle_stage="A1-A3"
    )

    # Assert
    assert result.success is True
    assert "total_co2" in result.data
    assert result.data["total_co2"] > 0
    assert result.data["unit"] == "kgCO2e"
```

### Mocking External Services

```python
import pytest
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_llm_call_with_mock(mocker):
    """Test LLM interaction with mocked response."""
    # Mock LiteLLM
    mock_completion = mocker.patch("litellm.acompletion")
    mock_completion.return_value = AsyncMock(
        choices=[{"message": {"content": "Test response"}}],
        usage={"total_tokens": 100}
    )

    # Test code that calls LLM
    from core.agentpress.thread_manager.llm_executor import LLMExecutor
    executor = LLMExecutor()
    response = await executor.call_llm(messages=[{"role": "user", "content": "Hello"}])

    # Assert
    assert response.content == "Test response"
    mock_completion.assert_called_once()
```

### Database Testing

```python
import pytest

@pytest.mark.asyncio
async def test_create_project(mock_supabase):
    """Test project creation in database."""
    # Arrange
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "proj_123", "name": "Test Project"}
    ]

    # Act
    from core.services.supabase_service import create_project
    project = await create_project(
        user_id="user_123",
        name="Test Project"
    )

    # Assert
    assert project["id"] == "proj_123"
    mock_supabase.table.assert_called_with("projects")
```

### E2E Test Example

```python
import pytest
from httpx import AsyncClient

@pytest.mark.e2e
@pytest.mark.asyncio
async def test_full_agent_run_flow(client: AsyncClient):
    """Test complete agent run lifecycle."""
    # 1. Create agent
    agent_response = await client.post("/api/v1/agents", json={
        "name": "Test Agent",
        "system_prompt": "You are a test assistant"
    })
    agent_id = agent_response.json()["id"]

    # 2. Create thread
    thread_response = await client.post("/api/v1/threads", json={
        "agent_id": agent_id
    })
    thread_id = thread_response.json()["id"]

    # 3. Add message
    message_response = await client.post(
        f"/api/v1/threads/{thread_id}/messages",
        json={"content": "Hello, agent!"}
    )
    assert message_response.status_code == 201

    # 4. Start agent run
    run_response = await client.post(f"/api/v1/agent-runs", json={
        "thread_id": thread_id
    })
    run_id = run_response.json()["id"]

    # 5. Wait for completion (polling)
    import asyncio
    for _ in range(10):
        status_response = await client.get(f"/api/v1/agent-runs/{run_id}")
        status = status_response.json()["status"]
        if status in ["completed", "failed"]:
            break
        await asyncio.sleep(1)

    # 6. Verify completion
    assert status == "completed"

    # 7. Get messages
    messages_response = await client.get(f"/api/v1/threads/{thread_id}/messages")
    messages = messages_response.json()["items"]
    assert len(messages) >= 2  # User message + agent response
```

## Frontend E2E Tests (Playwright)

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login with magic link', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Enter email
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Send Magic Link")');

    // Verify success message
    await expect(page.locator('text=Check your email')).toBeVisible();
  });

  test('should protect dashboard routes', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('BIM Viewer', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    // ... perform login
  });

  test('should load IFC model', async ({ page }) => {
    await page.goto('/dashboard/threads/thread_123');

    // Upload IFC file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample.ifc');

    // Wait for viewer to load
    await expect(page.locator('canvas')).toBeVisible();

    // Verify model loaded
    const elementCount = await page.locator('[data-testid="element-count"]').textContent();
    expect(parseInt(elementCount || '0')).toBeGreaterThan(0);
  });

  test('should display carbon analysis results', async ({ page }) => {
    await page.goto('/dashboard/threads/thread_123');

    // Trigger carbon analysis
    await page.click('button:has-text("Analyze Carbon")');

    // Wait for results
    await expect(page.locator('[data-testid="carbon-total"]')).toBeVisible();

    // Verify results displayed
    const total = await page.locator('[data-testid="carbon-total"]').textContent();
    expect(total).toMatch(/\d+\.\d+ kgCO2e/);
  });
});
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Data

### Mock Constants

```python
# backend/tests/conftest.py or test files

MOCK_CARBON_RESULT = {
    "total_co2": 12500.5,
    "breakdown": {
        "concrete": 8000.0,
        "steel": 3500.0,
        "timber": 1000.5
    },
    "unit": "kgCO2e"
}

MOCK_CLASH_RESULT = {
    "total_clashes": 15,
    "clashes": [
        {
            "id": "clash_1",
            "element_a": "Wall-001",
            "element_b": "Beam-023",
            "distance": 0.05,
            "severity": "high"
        }
    ]
}

MOCK_IFC_ELEMENTS = [
    {
        "id": "elem_1",
        "type": "IfcWall",
        "properties": {
            "material": "concrete",
            "volume": 10.5
        }
    },
    {
        "id": "elem_2",
        "type": "IfcBeam",
        "properties": {
            "material": "steel",
            "volume": 2.3
        }
    }
]
```

## Test Coverage

### Running Coverage

```bash
# Backend
cd backend
uv run pytest tests/ --cov=core --cov-report=html --cov-report=term

# View coverage report
open htmlcov/index.html
```

### Coverage Targets

- **Overall**: >80%
- **Critical paths** (auth, billing, BIM tools): >90%
- **New features**: 100%

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install uv
        run: pip install uv
      - name: Install dependencies
        run: cd backend && uv sync
      - name: Run tests
        run: cd backend && uv run pytest tests/ -v --cov=core
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: pnpm/action-setup@v2
      - name: Install dependencies
        run: pnpm install
      - name: Run E2E tests
        run: cd apps/frontend && pnpm test:e2e
```

## Testing Best Practices

### Unit Tests
- Test one thing at a time
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Mock external dependencies
- Aim for fast execution (<1s per test)

### Integration Tests
- Test component interactions
- Use real database (with cleanup)
- Test error scenarios
- Verify state changes

### E2E Tests
- Test critical user flows
- Keep tests independent
- Use data-testid for stability
- Handle async operations properly
- Clean up test data

### BIM-Specific Testing
- Use small, valid IFC samples
- Test with various IFC schemas (2x3, 4)
- Verify calculations against known values
- Test edge cases (empty models, large models)
- Validate Thai TGO emission factors

## Test Utilities

### BIM Test Helpers

```python
# backend/tests/utils/bim_helpers.py

def create_minimal_ifc(output_path: str) -> str:
    """Create minimal valid IFC file for testing."""
    content = """ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('Test IFC'),'2;1');
FILE_NAME('test.ifc','2024-01-01T00:00:00',('Author'),('Organization'),'IfcOpenShell','','');
FILE_SCHEMA(('IFC2X3'));
ENDSEC;
DATA;
#1=IFCPROJECT('project_guid',$,'Test Project',$,$,$,$,(#2),#3);
#2=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,#4,$);
#3=IFCUNITASSIGNMENT((#5));
#4=IFCAXIS2PLACEMENT3D(#6,$,$);
#5=IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);
#6=IFCCARTESIANPOINT((0.,0.,0.));
ENDSEC;
END-ISO-10303-21;"""

    with open(output_path, 'w') as f:
        f.write(content)
    return output_path

def assert_carbon_result_valid(result: dict):
    """Assert carbon calculation result is valid."""
    assert "total_co2" in result
    assert "breakdown" in result
    assert "unit" in result
    assert result["unit"] == "kgCO2e"
    assert result["total_co2"] >= 0
    assert all(v >= 0 for v in result["breakdown"].values())
```

## Running Tests

### Backend

```bash
# All tests
make test
# or
uv run pytest tests/ -v

# Specific markers
uv run pytest tests/ -m e2e -v
uv run pytest tests/ -m "not slow" -v

# Specific test file
uv run pytest tests/unit/tools/test_carbon_tool.py -v

# Specific test function
uv run pytest tests/ -k "test_carbon_calculation" -v

# With coverage
uv run pytest tests/ --cov=core --cov-report=html

# BIM tools only
make test-bim
# or
uv run pytest tests/test_bim_tools.py -v
```

### Frontend

```bash
cd apps/frontend

# All E2E tests
pnpm test:e2e

# Specific test file
pnpm playwright test e2e/auth.spec.ts

# BIM-specific tests
pnpm test:e2e:bim

# Headed mode (see browser)
pnpm playwright test --headed

# Debug mode
pnpm playwright test --debug

# UI mode (interactive)
pnpm playwright test --ui
```

## Test Maintenance

### Updating Tests After Changes

1. **Breaking API changes**: Update all affected test mocks
2. **New features**: Add tests before implementation (TDD)
3. **Bug fixes**: Add regression test first
4. **Deprecations**: Mark tests for removal, add replacements

### Flaky Test Management

```python
# Mark flaky tests
@pytest.mark.flaky(reruns=3, reruns_delay=1)
def test_sometimes_fails():
    pass

# Skip known issues
@pytest.mark.skip(reason="Known issue #1234")
def test_known_bug():
    pass

# Skip conditionally
@pytest.mark.skipif(sys.platform == "win32", reason="Unix only")
def test_unix_feature():
    pass
```
