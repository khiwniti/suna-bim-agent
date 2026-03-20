# Directory Structure

## Monorepo Layout

```
suna-bim-agent/
├── apps/               # Application workspaces
│   ├── frontend/      # Next.js 15 dashboard
│   ├── mobile/        # React Native/Expo app
│   └── desktop/       # Desktop app (future)
├── backend/           # Python FastAPI service
├── packages/          # Shared packages
│   └── shared/       # @agentpress/shared
├── infra/            # Infrastructure as code
├── scripts/          # Automation scripts
├── .planning/        # GSD workflow artifacts
└── docs/             # Documentation
```

## Backend Structure

```
backend/
├── api.py                    # FastAPI app entry point
├── pyproject.toml           # Python dependencies (uv)
├── Makefile                 # Build commands
├── Dockerfile               # Container image
├── .env.example             # Environment template
│
├── core/                    # Core business logic
│   ├── agentpress/         # Agent runtime framework
│   │   ├── tool.py         # Base Tool class
│   │   ├── agent.py        # Agent definition
│   │   └── thread_manager/ # Agent execution orchestration
│   │       ├── thread_manager.py         # Main coordinator
│   │       ├── message_fetcher.py        # Fetch messages
│   │       ├── message_validator.py      # Validate messages
│   │       ├── message_preparer.py       # Format for LLM
│   │       ├── execution_orchestrator.py # Execute turns
│   │       ├── llm_executor.py           # LLM calls
│   │       ├── auto_continue_manager.py  # Auto-continue logic
│   │       └── billing_handler.py        # Credit tracking
│   │
│   ├── agents/             # Agent implementations
│   │   ├── default_agent.py          # Default assistant
│   │   └── embodied_carbon_prompt.py # BIM carbon specialist
│   │
│   ├── api/                # API route handlers
│   │   ├── agent.py        # Agent CRUD
│   │   ├── thread.py       # Thread management
│   │   ├── run.py          # Agent run endpoints
│   │   ├── tools.py        # Tool listing
│   │   └── billing.py      # Billing/credits
│   │
│   ├── bim/                # BIM domain logic
│   │   ├── ifc_parser.py           # IFC file parsing
│   │   ├── carbon_calculator.py    # Carbon calculations
│   │   ├── clash_detector.py       # Clash detection
│   │   ├── compliance_checker.py   # Code compliance
│   │   └── carbon_agent_api.py     # BIM agent endpoints
│   │
│   ├── config/             # Configuration
│   │   ├── settings.py     # App settings
│   │   └── suna_config.py  # Suna-specific config
│   │
│   ├── middleware/         # HTTP middleware
│   │   ├── auth.py         # Authentication
│   │   ├── cors.py         # CORS handling
│   │   └── logging.py      # Request logging
│   │
│   ├── monitoring/         # Observability
│   │   ├── metrics.py      # Prometheus metrics
│   │   └── logging.py      # Structured logging
│   │
│   ├── sandbox/            # Isolated execution
│   │   ├── e2b_sandbox.py     # E2B code interpreter
│   │   ├── daytona_sandbox.py # Daytona environments
│   │   └── local_sandbox.py   # Local process isolation
│   │
│   ├── services/           # External service clients
│   │   ├── supabase_service.py     # Auth, DB, storage
│   │   ├── redis_service.py        # Caching, pub/sub
│   │   ├── billing_service.py      # Stripe integration
│   │   ├── email_service.py        # Email delivery
│   │   ├── notification_service.py # Notifications
│   │   └── langfuse_service.py     # LLM observability
│   │
│   ├── tools/              # Tool implementations
│   │   ├── tool_registry.py # Central registry
│   │   ├── core/           # Core tools (message, task)
│   │   ├── sandbox/        # Shell, files, git
│   │   ├── search/         # Web, image search
│   │   ├── bim/            # BIM-specific tools
│   │   │   ├── ifc_parser_tool.py
│   │   │   ├── carbon_tool.py
│   │   │   ├── clash_detection_tool.py
│   │   │   ├── compliance_tool.py
│   │   │   ├── embodied_carbon_service.py
│   │   │   ├── mep_coordination_tool.py
│   │   │   └── knowledge_graph_tool.py
│   │   └── utility/        # Browser, voice, apify
│   │
│   └── utils/              # Shared utilities
│       ├── json_utils.py   # JSON parsing
│       ├── file_utils.py   # File operations
│       └── validation.py   # Input validation
│
├── data/                   # Static data files
│   ├── carbon_factors.json    # Thai TGO emission factors
│   └── thai_building_codes.json # Building codes
│
├── tests/                  # Test suite
│   ├── conftest.py         # Pytest fixtures
│   ├── e2e/                # End-to-end tests
│   │   └── test_full_flow.py
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
│
└── prisma/                 # Database ORM
    └── schema.prisma       # Database schema
```

### Backend File Purposes

**Entry Points**:
- `api.py` - FastAPI app initialization, middleware, route registration
- `Makefile` - Build, lint, test commands

**Core Modules**:
- `core/agentpress/` - Agent runtime framework (tool system, thread management)
- `core/tools/` - Tool implementations organized by category
- `core/bim/` - BIM domain logic (IFC, carbon, clash, compliance)
- `core/services/` - External API clients and integrations

**API Layer**:
- `core/api/` - Route handlers for REST endpoints
- `core/middleware/` - HTTP middleware (auth, CORS, logging)

**Testing**:
- `tests/` - Test suite with pytest markers (e2e, slow, large_context)

## Frontend Structure

```
apps/frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # Auth routes (login, signup)
│   │   ├── (dashboard)/    # Protected dashboard routes
│   │   │   ├── agents/    # Agent management
│   │   │   ├── threads/   # Thread list/detail
│   │   │   └── settings/  # User settings
│   │   ├── api/           # API route handlers (proxies)
│   │   │   ├── auth/      # Auth endpoints
│   │   │   ├── composio/  # Composio proxy
│   │   │   └── boq/       # BOQ analysis proxy
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   │
│   ├── components/         # React components
│   │   ├── ui/            # Radix UI primitives
│   │   ├── agents/        # Agent UI components
│   │   │   ├── agent-creation-modal.tsx
│   │   │   └── agent-card.tsx
│   │   ├── thread/        # Thread/chat components
│   │   │   ├── message-list.tsx
│   │   │   ├── message-item.tsx
│   │   │   ├── tool-call-renderer.tsx
│   │   │   └── carbon-bim-computer/ # BIM viewer
│   │   │       ├── BIMViewer.tsx
│   │   │       ├── BIMPanel.tsx
│   │   │       └── components/
│   │   │           └── ElementPropertyPanel.tsx
│   │   └── shared/        # Shared components
│   │       ├── header.tsx
│   │       └── sidebar.tsx
│   │
│   ├── lib/                # Utilities and helpers
│   │   ├── supabase/      # Supabase client
│   │   │   ├── client.ts  # Browser client
│   │   │   └── server.ts  # Server client
│   │   ├── carbon/        # Carbon calculation
│   │   │   ├── calculator.ts
│   │   │   ├── emission-factors.ts
│   │   │   ├── thai-materials.ts
│   │   │   ├── trees-certification.ts
│   │   │   └── ifc-calculator-integration.ts
│   │   ├── theme/         # Theme system
│   │   │   ├── colors.ts
│   │   │   └── tokens.ts
│   │   └── utils.ts       # General utilities
│   │
│   ├── hooks/             # Custom React hooks
│   │   ├── use-agent-stream.ts
│   │   ├── use-auth.ts
│   │   └── use-bim-viewer.ts
│   │
│   ├── stores/            # Zustand state stores
│   │   ├── agent-store.ts
│   │   └── thread-store.ts
│   │
│   ├── types/             # TypeScript types
│   │   ├── bim.ts         # BIM-specific types
│   │   └── agent.ts       # Agent types
│   │
│   └── styles/            # Global styles
│       └── globals.css    # Tailwind + custom styles
│
├── public/                # Static assets
├── e2e/                   # Playwright E2E tests
│   ├── auth.spec.ts
│   └── bim.spec.ts
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

### Frontend File Purposes

**App Router**:
- `app/(auth)/` - Authentication flows (login, magic link, callback)
- `app/(dashboard)/` - Protected routes requiring auth
- `app/api/` - API route handlers (proxies to backend)

**Components**:
- `components/ui/` - Radix UI primitives (button, dialog, input)
- `components/agents/` - Agent creation, listing, configuration
- `components/thread/` - Chat interface, message rendering, tool calls
- `components/thread/carbon-bim-computer/` - BIM 3D viewer (@thatopen/components)

**Library Code**:
- `lib/supabase/` - Supabase auth and database clients
- `lib/carbon/` - Frontend carbon calculation logic (Thai TGO factors)
- `lib/theme/` - Theme tokens and color system

**State Management**:
- `stores/` - Zustand stores for client state
- `hooks/` - Custom hooks for server state (TanStack Query)

## Mobile Structure

```
apps/mobile/
├── app/                   # Expo Router
│   ├── (auth)/           # Auth screens
│   ├── (tabs)/           # Tab navigation
│   └── _layout.tsx       # Root layout
│
├── components/           # React Native components
│   ├── agents/          # Agent UI
│   └── thread/          # Chat UI
│
├── hooks/               # Custom hooks
├── stores/              # Zustand stores
└── package.json         # Dependencies
```

## Shared Package Structure

```
packages/shared/
├── src/
│   ├── types/           # TypeScript types
│   │   ├── message.ts
│   │   ├── tool.ts
│   │   └── agent.ts
│   │
│   ├── streaming/       # SSE streaming utilities
│   │   ├── useAgentStreamCore.ts
│   │   └── messageHandler.ts
│   │
│   ├── tools/           # Tool utilities
│   │   ├── parser.ts
│   │   └── formatter.ts
│   │
│   ├── utils/           # General utilities
│   │   ├── json.ts
│   │   └── normalizer.ts
│   │
│   └── animations/      # Animation hooks
│       ├── useSmoothText.ts
│       └── useSmoothAnimation.ts
│
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## Infrastructure Structure

```
infra/
├── environments/        # Pulumi stacks
│   ├── dev/            # Development
│   ├── staging/        # Staging
│   └── prod/           # Production
│
└── scripts/            # Helper scripts
```

## Scripts Structure

```
scripts/
├── deploy-azure-aca.sh      # Azure ACA deployment
├── cloudflare-tunnel.sh     # Cloudflare tunnel setup
└── backup-database.sh       # Database backup
```

## Planning Structure

```
.planning/
├── STATE.md             # Current project state
├── ROADMAP.md           # Milestone roadmap
├── codebase/            # Codebase documentation
│   ├── STACK.md
│   ├── INTEGRATIONS.md
│   ├── ARCHITECTURE.md
│   ├── STRUCTURE.md
│   ├── CONVENTIONS.md
│   ├── TESTING.md
│   └── CONCERNS.md
├── milestones/          # Milestone definitions
├── phases/              # Phase plans
│   └── XX-phase-name/
│       ├── XX-CONTEXT.md
│       ├── XX-PLAN.md
│       ├── XX-VERIFICATION.md
│       └── XX-SUMMARY.md
└── todos/               # Active todos
```

## Naming Conventions

### Backend (Python)
- **Modules**: `snake_case.py`
- **Classes**: `PascalCase`
- **Functions**: `snake_case()`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private**: `_leading_underscore`

### Frontend (TypeScript)
- **Files**: `kebab-case.tsx` or `PascalCase.tsx` (components)
- **Components**: `PascalCase`
- **Functions**: `camelCase()`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types**: `PascalCase`
- **Hooks**: `use` prefix (`useAgentStream`)

### Tests
- **Backend**: `test_*.py` in `tests/`
- **Frontend**: `*.spec.ts` in `e2e/`

## File Organization Principles

1. **Group by feature** - Related files stay together
2. **Separate by layer** - API, service, tool, domain
3. **Test alongside code** - Tests mirror source structure
4. **Shared code in packages** - Cross-platform utilities
5. **Documentation near code** - README in each module

## Adding New Code

### New Tool
1. Create `backend/core/tools/{category}/{tool_name}_tool.py`
2. Inherit from `Tool`, add `@tool_metadata` and `@openapi_schema`
3. Register in `backend/core/tools/tool_registry.py`
4. Add tests in `backend/tests/unit/tools/`

### New API Endpoint
1. Add route handler in `backend/core/api/{module}.py`
2. Register router in `backend/api.py`
3. Add proxy in `apps/frontend/src/app/api/` if needed
4. Add E2E test in `apps/frontend/e2e/`

### New Frontend Component
1. Create `apps/frontend/src/components/{category}/{name}.tsx`
2. Export from category `index.ts` if needed
3. Add Storybook story (future)
4. Add component test (future)

### New BIM Feature
1. Backend logic in `backend/core/bim/{feature}.py`
2. Tool wrapper in `backend/core/tools/bim/{feature}_tool.py`
3. Frontend UI in `apps/frontend/src/components/thread/carbon-bim-computer/`
4. Types in `apps/frontend/src/types/bim.ts`
