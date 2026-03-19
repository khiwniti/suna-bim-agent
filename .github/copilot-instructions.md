# Carbon BIM — Copilot Instructions

AI agent platform for Building Information Modeling (BIM) analysis: IFC parsing, carbon calculation, clash detection, and Thai building code compliance.

**Stack**: Python/FastAPI backend · Next.js 15 frontend · React Native/Expo mobile · Supabase · Redis · LiteLLM (multi-provider LLM)

---

## Build, Test & Lint

### Root (from project root)

```bash
make install          # Install all deps (pnpm + uv)
make env-backend      # Scaffold backend/.env
make env-frontend     # Scaffold apps/frontend/.env.local
make dev              # Run frontend + backend concurrently
make docker-up        # Start full stack (Redis + backend + frontend)
make lint             # ESLint + Ruff
make lint-fix         # Auto-fix all lint issues
make check            # verify + lint + format-check + typecheck
make test             # All tests (backend + E2E)
make test-backend     # pytest only
make test-e2e         # Playwright E2E
```

### Backend (`cd backend`)

```bash
uv run api.py                                       # Start API server
uv run uvicorn api:app --reload --host 0.0.0.0 --port 8000
uv run pytest tests/ -v                             # All tests
uv run pytest tests/ -k "test_name" -v             # Single test
uv run pytest tests/ -m e2e -v                      # E2E only
uv run pytest tests/e2e/test_full_flow.py -v        # Full flow

make lint             # ruff check core/
make lint-fix         # ruff check --fix core/
make verify           # Check imports, syntax, undefined names
make install-bim      # Install ifcopenshell, numpy, networkx, ladybug-core (optional BIM packages)
make test-bim         # Run BIM tool tests
```

### Frontend (`cd apps/frontend`)

```bash
pnpm dev              # Dev server with Turbopack (:3000)
pnpm build
pnpm lint
pnpm format
pnpm test:e2e                              # All Playwright tests
pnpm test:e2e:bim                          # BIM-specific E2E tests
```

### Mobile (`cd apps/mobile`)

```bash
npx expo start --clear   # Dev server
npm run android          # Android emulator
npm run ios              # iOS simulator
```

---

## Architecture

### Monorepo Layout

```
apps/frontend/        # Next.js 15 dashboard (Turbopack)
apps/mobile/          # React Native/Expo (NativeWind)
backend/              # Python FastAPI service
  api.py              # Entry point — registers all routers
  core/agentpress/    # Agent runtime framework
  core/agents/        # Agent CRUD, runs, tools APIs
  core/bim/           # BIM-specific API endpoints
  core/tools/         # Tool implementations
    bim/              # BIM tools (IFC, carbon, clash, compliance)
  core/sandbox/       # Isolated execution environments
  core/services/      # Supabase, Redis, transcription
packages/shared/      # @agentpress/shared — cross-platform types/utils
infra/                # Pulumi (dev/staging/prod)
```

### Agent Execution Flow

1. `POST /agent/start` → creates project + thread + agent run
2. `GET /agent-run/{id}/stream` → SSE streaming of agent output
3. Tools execute in sandbox environments (`core/sandbox/`)
4. `POST /agent-run/{id}/stop` → stop agent run

The **ThreadManager** (`core/agentpress/thread_manager/`) is the main orchestrator. It runs a message pipeline: `MessageFetcher → MessageValidator → MessagePreparer → ExecutionOrchestrator → LLMExecutor`, with billing handled by `BillingHandler` and multi-turn managed by `AutoContinueManager`.

### BIM Workflow

1. IFC file uploaded via chat
2. `IFCParserTool` extracts elements, properties, relationships
3. Analysis tools run (carbon, clash, compliance)
4. Results rendered in 3D viewer (`@thatopen/components`) and chat

### Tool Registry

Tools are organized into categories in `core/tools/tool_registry.py`:

| Category | Key Tools |
|---|---|
| `CORE_TOOLS` | `message_tool`, `task_list_tool`, `expand_msg_tool` |
| `SANDBOX_TOOLS` | shell, files, vision, git, spreadsheet, presentation |
| `SEARCH_TOOLS` | web, image, people, company, paper |
| `BIM_TOOLS` | `bim_ifc_parser_tool`, `bim_carbon_tool`, `bim_clash_tool`, `bim_compliance_tool`, `bim_mep_tool`, `bim_knowledge_graph_tool` |
| `UTILITY_TOOLS` | browser, voice, apify |
| `AGENT_BUILDER_TOOLS` | agent config, MCP search, triggers |

### Shared Package (`@agentpress/shared`)

Used by both frontend and mobile:

```typescript
import { UnifiedMessage } from '@agentpress/shared/types';
import { useAgentStreamCore } from '@agentpress/shared/streaming';
import { parseToolCall } from '@agentpress/shared/tools';
import { parseJson } from '@agentpress/shared/utils';
```

---

## Key Conventions

### Backend: Tool Pattern

All tools inherit from `Tool` (in `core/agentpress/tool.py`) and use two decorators:

```python
from core.agentpress.tool import Tool, ToolResult, openapi_schema, tool_metadata

@tool_metadata(
    display_name="Carbon Analysis",
    description="Calculate embodied carbon from IFC models",
    icon="Leaf",
    weight=60,        # lower = higher priority in UI
    visible=True,     # show in frontend tool picker
    usage_guide="..."
)
class CarbonCalculationTool(Tool):

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "calculate_carbon",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {"type": "string"}
                },
                "required": ["file_path"]
            }
        }
    })
    async def calculate_carbon(self, file_path: str) -> ToolResult:
        return self.success_response({"total_co2": 12500})
        # or: return self.fail_response("Error message")
```

Register new tools in `core/tools/tool_registry.py` by adding a tuple `(key, module_path, class_name)` to the appropriate category list.

### Backend: Imports & Error Handling

```python
# Import groups: stdlib → third-party → local (core/)
from typing import Dict, Any, Optional, List

from fastapi import HTTPException
from supabase import Client

from core.agentpress.tool import Tool, ToolResult
from core.utils.logger import logger

# Errors
raise HTTPException(status_code=404, detail="Resource not found")
logger.error(f"Operation failed: {error}")
```

### Backend: Test Markers

```python
@pytest.mark.e2e           # Full end-to-end
@pytest.mark.slow          # >30s tests
@pytest.mark.billing       # Requires billing/credits
@pytest.mark.large_context # 200k+ token context
```

### Frontend: TypeScript Conventions

- Use `interface` for objects, `type` for unions
- `@/` path alias for all local imports
- Import order: UI components → feature components → hooks → external → React → types

```typescript
import { Button } from '@/components/ui/button';
import { useAgentStream } from '@/hooks/use-agent-stream';
import { useState } from 'react';
import type { Message } from '@/lib/types';
```

### Mobile: Strict Rules (from `apps/mobile/.cursorrules`)

These are hard requirements, not preferences:

1. **Font**: `font-roobert-*` only — never system fonts
   ```tsx
   <Text className="text-base font-roobert-medium">Text</Text>
   ```

2. **Colors**: Design tokens only — never hardcode
   ```tsx
   // ✅ bg-background, text-foreground, bg-card, border-border, bg-primary/10
   // ❌ bg-[#F8F8F8], style={{ color: '#121215' }}
   ```

3. **Icons**: Lucide React Native exclusively
   ```tsx
   import { Menu } from 'lucide-react-native';
   import { Icon } from '@/components/ui/icon';
   <Icon as={Menu} size={24} className="text-foreground" />
   ```

4. **Animations**: React Native Reanimated with spring config `{ damping: 15, stiffness: 400 }`

5. **Spacing**: Tailwind scale only — never custom pixel values
   ```tsx
   // ✅ className="gap-3 p-4 mx-6"
   // ❌ style={{ gap: 11.25, padding: 15.5 }}
   ```

6. **Hooks**: Extract all logic to custom hooks; keep components presentational

7. **Console logging**: Always log user interactions with emoji prefix
   ```tsx
   console.log('🎯 Action:', 'Button pressed');
   console.log('❌ Error:', error);
   ```

### Git Workflow

- **Never commit without explicit user request**
- Commit format: `feat:`, `fix:`, `refactor:`, `docs:`
- Branch strategy: `main` → DEV · `staging` → STAGING · `production` → Production (requires approval)

---

## Environment Setup

**Backend** (`backend/.env`):
```
SUPABASE_URL=...
SUPABASE_KEY=...
REDIS_HOST=localhost
REDIS_PORT=6379
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
BIM_CARBON_DATABASE_PATH=/data/carbon_factors.json
BIM_THAI_CODES_PATH=/data/thai_building_codes.json
BIM_MAX_FILE_SIZE_MB=500
```

**Frontend** (`apps/frontend/.env.local`):
```
NEXT_PUBLIC_ENV_MODE="staging"
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000/v1"
NEXT_PUBLIC_URL="http://localhost:3000"
```

The backend requires valid Supabase keys in `backend/.env` before it will become healthy; without them the API startup fails regardless of Docker container state.

---

## Access Points

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/v1 |
| Health check | http://localhost:8000/v1/health |
| Redis | localhost:6379 |
