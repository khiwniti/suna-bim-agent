# AGENTS.md

Guide for agentic coding agents working in this repository.

## Project Overview

**Carbon BIM** is an AI agent platform for Building Information Modeling (BIM) analysis. It provides IFC model processing, carbon calculation, clash detection, and Thai building code compliance checking.

**Stack**: Python/FastAPI backend, Next.js 15 frontend, React Native/Expo mobile, Supabase, Redis.

---

## Build, Lint & Test Commands

### Backend (Python/FastAPI)

```bash
cd backend

# Run API server
uv run api.py

# Linting (ruff)
make lint          # Check with ruff
make lint-fix      # Auto-fix with ruff

# Build verification
make verify        # Check imports, syntax, undefined names

# Tests
uv run pytest tests/ -v                           # All tests
uv run pytest tests/ -k "test_name" -v           # Single test by name
uv run pytest tests/path/to/test_file.py -v      # Single test file
uv run pytest tests/ -m e2e -v                   # E2E tests only
uv run pytest tests/e2e/test_full_flow.py -v     # Full API flow test

# BIM-specific
make install-bim    # Install ifcopenshell, numpy, networkx, ladybug-core
make test-bim       # Run BIM tool tests
```

### Frontend (Next.js 15 + Turbopack)

```bash
cd apps/frontend

pnpm install
pnpm dev            # Start dev server with Turbopack
pnpm build          # Production build
pnpm lint           # ESLint
pnpm format         # Prettier
pnpm test:e2e       # Playwright E2E tests
pnpm test:e2e:bim   # BIM-specific E2E tests
```

### Monorepo Commands (from root)

```bash
pnpm dev:frontend   # Start frontend
pnpm dev:mobile     # Start mobile app
pnpm build:frontend # Build frontend
```

### Docker

```bash
docker compose up -d              # Start all services
docker compose logs -f backend    # View backend logs
docker compose down               # Stop all
```

---

## Code Style Guidelines

### Python (Backend)

**Imports**: Group imports: stdlib → third-party → local. Use absolute imports from `core/`.

```python
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

from fastapi import HTTPException
from supabase import Client

from core.agentpress.tool import Tool, ToolResult, openapi_schema, tool_metadata
from core.utils.logger import logger
```

**Types**: Use `typing` module. Prefer `Optional[T]` over `T | None` for compatibility.

**Naming**: `snake_case` for functions/variables, `PascalCase` for classes.

**Error Handling**: Use `HTTPException` for API errors. Use `logger.error()` for logging.

```python
from fastapi import HTTPException

if not resource:
    raise HTTPException(status_code=404, detail="Resource not found")

logger.error(f"Operation failed: {error}")
```

**Tool Pattern**: Tools inherit from `Tool` base class with decorators:

```python
@tool_metadata(
    display_name="Carbon Analysis",
    description="Calculate embodied carbon from IFC models",
    icon="Leaf",
    weight=60,
    visible=True,
)
class CarbonCalculationTool(Tool):
    @openapi_schema({
        "type": "function",
        "function": {"name": "calculate_carbon", "parameters": {...}}
    })
    async def calculate_carbon(self, file_path: str) -> ToolResult:
        return self.success_response({"total_co2": 12500})
```

**Test Markers**:

```python
@pytest.mark.e2e           # Full end-to-end tests
@pytest.mark.slow          # Tests taking >30s
@pytest.mark.billing       # Tests requiring billing/credits
@pytest.mark.large_context # Tests with 200k+ tokens
```

---

### TypeScript (Frontend/Mobile)

**Imports**: Use `@/` path alias. Group: UI components → feature components → hooks → external → React → types.

```typescript
import { Text } from '@/components/ui/text';
import { useAgentStreamCore } from '@agentpress/shared/streaming';
import * as React from 'react';
import type { UnifiedMessage } from './types';
```

**Types**: Use `interface` for objects, `type` for unions. Explicit types, avoid `any`.

**Naming**: `camelCase` for functions/variables, `PascalCase` for components/types.

**Formatting**: Prettier with semicolons, single quotes, trailing commas, 80 print width.

---

### Mobile App (React Native/Expo) - Strict Rules

From `.cursorrules`:

1. **Font**: Roobert family only (`font-roobert-*`)
2. **Icons**: Lucide React Native exclusively
3. **Colors**: Always use design tokens (`bg-background`, `text-foreground`) - **NEVER hardcode**
4. **Animation**: React Native Reanimated with spring config `{ damping: 15, stiffness: 400 }`
5. **Hooks**: Extract all logic to custom hooks, keep components presentational
6. **Spacing**: Use Tailwind scale only (`gap-3`, `p-4`), never custom pixel values

```tsx
// ✅ GOOD
<View className="bg-background gap-3 p-4">
  <Text className="text-foreground font-roobert-medium">Title</Text>
</View>

// ❌ BAD
<View style={{ backgroundColor: '#F8F8F8', padding: 15 }}>
  <Text style={{ color: '#121215' }}>Title</Text>
</View>
```

---

## Project Structure

```
├── apps/
│   ├── frontend/     # Next.js 15 dashboard (Turbopack)
│   └── mobile/       # React Native/Expo app (NativeWind)
├── backend/
│   ├── api.py        # Main API entry point
│   └── core/
│       ├── agentpress/  # Agent runtime framework
│       ├── agents/      # Agent CRUD, runs, tools APIs
│       ├── bim/         # BIM-specific API endpoints
│       ├── tools/       # Agent tool implementations
│       │   └── bim/     # BIM tools (IFC, carbon, clash, compliance)
│       ├── sandbox/     # Isolated execution environments
│       └── services/    # Supabase, Redis, transcription
├── packages/
│   └── shared/      # @agentpress/shared (types, streaming, utils)
└── infra/           # Pulumi infrastructure
```

---

## Key Patterns

### Agent Tools

Registered in `backend/core/tools/tool_registry.py` with categories:
- **CORE_TOOLS**: message_tool, task_list_tool, expand_msg_tool
- **SANDBOX_TOOLS**: shell, files, vision, git, spreadsheet, presentation
- **SEARCH_TOOLS**: web, image, people, company, paper search
- **BIM_TOOLS**: IFC parser, carbon, clash, compliance, MEP, knowledge graph
- **UTILITY_TOOLS**: browser, voice, apify

### Shared Package (`@agentpress/shared`)

Cross-platform utilities:

```typescript
import { UnifiedMessage } from '@agentpress/shared/types';
import { useAgentStreamCore } from '@agentpress/shared/streaming';
import { parseToolCall } from '@agentpress/shared/tools';
import { parseJson } from '@agentpress/shared/utils';
```

---

## Git Workflow

- **NEVER commit without explicit user request**
- Commit format: `feat:`, `fix:`, `refactor:`, `docs:`
- Branch strategy: `main` → DEV, `staging` → STAGING, `production` → Production

---

## Environment

- Backend: `backend/.env` (SUPABASE_URL, SUPABASE_KEY, REDIS_HOST, ANTHROPIC_API_KEY)
- Frontend: `apps/frontend/.env.local` (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_BACKEND_URL)

---

## Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/v1 |
| Redis | localhost:6379 |
| Health Check | http://localhost:8000/v1/health |
