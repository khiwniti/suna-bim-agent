# System Architecture

## Overview

Carbon BIM is a monorepo containing a **Python FastAPI backend** for AI agent execution and BIM analysis, a **Next.js 15 frontend** dashboard, a **React Native mobile app**, and shared TypeScript packages. The system follows a modular, tool-based architecture where agents orchestrate tools to analyze IFC models and provide BIM insights.

## Architectural Layers

### 1. Presentation Layer
**Apps**: `apps/frontend/`, `apps/mobile/`, `apps/desktop/`

**Responsibilities**:
- User interface rendering
- Agent interaction (chat, streaming)
- BIM 3D viewer (@thatopen/components)
- Authentication flows
- Real-time updates via SSE

**Key Patterns**:
- React Server Components (Next.js 15)
- Client-side state (Zustand)
- Server state (TanStack Query)
- Streaming responses
- WebSocket connections (future)

### 2. API Gateway Layer
**Entry Point**: `backend/api.py`

**Responsibilities**:
- HTTP request routing
- Authentication middleware
- CORS handling
- Rate limiting
- Request/response validation

**Key Files**:
- `backend/api.py` - FastAPI app initialization
- `backend/core/middleware/` - Auth, CORS, logging
- `backend/core/api/` - Route handlers

**Endpoints**:
```
POST   /agent/start           - Create agent run
GET    /agent-run/{id}/stream - SSE streaming
POST   /agent-run/{id}/stop   - Stop execution
GET    /tools                 - List available tools
POST   /bim/carbon-agent/*    - BIM analysis endpoints
```

### 3. Agent Execution Layer
**Core**: `backend/core/agentpress/thread_manager/`

**Responsibilities**:
- Agent run orchestration
- Message pipeline (fetch, validate, prepare)
- LLM interaction (via LiteLLM)
- Tool execution coordination
- Auto-continue logic
- Billing/credit tracking

**Key Components**:

**ThreadManager** (`thread_manager.py`)
- Coordinates entire agent run lifecycle
- Manages state transitions
- Handles errors and interruptions

**MessageFetcher** (`message_fetcher.py`)
- Retrieves messages from database
- Handles pagination and limits
- Applies filters

**MessageValidator** (`message_validator.py`)
- Validates message structure
- Checks for required fields
- Enforces business rules

**MessagePreparer** (`message_preparer.py`)
- Formats messages for LLM
- Injects system prompts
- Adds tool definitions

**ExecutionOrchestrator** (`execution_orchestrator.py`)
- Executes agent turns
- Coordinates tool calls
- Manages parallel execution

**LLMExecutor** (`llm_executor.py`)
- Calls LLM via LiteLLM
- Handles streaming
- Tracks usage/costs
- Logs to Langfuse

**AutoContinueManager** (`auto_continue_manager.py`)
- Determines if agent should continue
- Checks turn limits
- Handles auto-stop conditions

**BillingHandler** (`billing_handler.py`)
- Tracks credit usage
- Enforces credit limits
- Records billing events

**Data Flow**:
```
1. POST /agent/start
   → ThreadManager.create_run()
   → MessageFetcher.fetch()
   → MessageValidator.validate()
   → MessagePreparer.prepare()

2. GET /agent-run/{id}/stream
   → ThreadManager.stream_run()
   → ExecutionOrchestrator.execute_turn()
   → LLMExecutor.call_llm()
   → [Tool execution loop]
   → AutoContinueManager.should_continue()

3. Tool execution
   → ToolRegistry.get_tool()
   → Tool.execute()
   → SandboxManager.run_in_sandbox() (if needed)
   → Result returned to LLM
```

### 4. Tool Layer
**Core**: `backend/core/tools/`

**Responsibilities**:
- Tool implementation
- Tool registration
- Tool metadata management
- OpenAPI schema generation

**Tool Base Class** (`core/agentpress/tool.py`):
```python
@tool_metadata(
    display_name="Tool Name",
    description="What the tool does",
    icon="IconName",
    weight=50,
    visible=True
)
class MyTool(Tool):
    @openapi_schema({...})
    async def my_function(self, param: str) -> ToolResult:
        return self.success_response({"result": "..."})
```

**Tool Categories** (`core/tools/tool_registry.py`):
- **CORE_TOOLS**: Message, task, expansion
- **SANDBOX_TOOLS**: Shell, files, git, vision
- **SEARCH_TOOLS**: Web, image, academic search
- **BIM_TOOLS**: IFC parser, carbon, clash, compliance
- **UTILITY_TOOLS**: Browser, voice, integrations
- **AGENT_BUILDER_TOOLS**: Config, triggers, MCP search

**BIM Tools** (`core/tools/bim/`):
- `ifc_parser_tool.py` - IFC file parsing
- `carbon_tool.py` - Embodied carbon calculation
- `clash_detection_tool.py` - Clash detection
- `compliance_tool.py` - Code compliance checking
- `embodied_carbon_service.py` - Advanced carbon analysis
- `mep_coordination_tool.py` - MEP systems analysis
- `knowledge_graph_tool.py` - BIM knowledge graphs

### 5. Sandbox Layer
**Core**: `backend/core/sandbox/`

**Responsibilities**:
- Isolated code execution
- File system sandboxing
- Network isolation
- Resource limits

**Sandbox Types**:

**E2B Sandbox** (`e2b_sandbox.py`)
- Python code interpreter
- File operations
- Package installation
- Fast startup (<2s)

**Daytona Sandbox** (`daytona_sandbox.py`)
- Full dev environments
- Long-running tasks
- Complex builds
- Multi-language support

**Local Sandbox** (`local_sandbox.py`)
- Process isolation
- File system restrictions
- Timeout enforcement
- For development/testing

### 6. BIM Domain Layer
**Core**: `backend/core/bim/`

**Responsibilities**:
- IFC model processing
- Carbon calculations
- Clash detection algorithms
- Thai building code compliance
- BIM knowledge graphs

**Key Services**:

**IFC Parser** (`ifc_parser.py`)
- Parse IFC files via ifcopenshell
- Extract elements, properties, relationships
- Build element hierarchy
- Extract geometry

**Carbon Calculator** (`carbon_calculator.py`)
- Thai TGO emission factors
- EN 15978 lifecycle stages
- Material carbon intensity
- TREES certification scoring

**Clash Detector** (`clash_detector.py`)
- Spatial intersection detection
- Tolerance-based proximity
- Clash type classification
- Conflict resolution suggestions

**Compliance Checker** (`compliance_checker.py`)
- Thai Building Control Act
- Fire safety codes
- Accessibility standards
- Code violation reporting

### 7. Service Layer
**Core**: `backend/core/services/`

**Responsibilities**:
- External API clients
- Database operations
- Caching strategies
- Notification delivery

**Key Services**:
- `supabase_service.py` - Auth, DB, storage
- `redis_service.py` - Caching, pub/sub
- `billing_service.py` - Stripe integration
- `email_service.py` - Mailtrap delivery
- `notification_service.py` - Novu multi-channel
- `langfuse_service.py` - LLM observability

### 8. Data Access Layer
**Database**: Supabase Postgres

**Key Tables**:
- `users` - User accounts
- `projects` - User projects
- `threads` - Conversation threads
- `messages` - Chat messages
- `agent_runs` - Agent execution records
- `tool_calls` - Tool execution logs
- `billing_events` - Credit transactions

**ORM**: Prisma (`backend/prisma/schema.prisma`)

**Caching**: Redis for hot data
- Agent run state
- Tool results
- Session data

### 9. Shared Package Layer
**Package**: `packages/shared/` (`@agentpress/shared`)

**Exports**:
- `types/` - TypeScript types (Message, Tool, Agent)
- `streaming/` - SSE streaming utilities
- `tools/` - Tool parsers and formatters
- `utils/` - JSON parsing, normalization
- `animations/` - Smooth text, transitions

**Cross-Platform Usage**:
- Frontend (Next.js)
- Mobile (React Native)
- Desktop (Electron, future)

## Key Design Patterns

### 1. Tool Pattern
Tools are self-contained, composable units:
- Decorator-based metadata
- OpenAPI schema generation
- Type-safe parameters
- Success/error responses

### 2. Agent Pattern
Agents orchestrate tools:
- System prompt defines behavior
- Tool access control
- Multi-turn conversations
- Context retention

### 3. Streaming Pattern
Real-time updates via SSE:
- Partial message streaming
- Tool execution status
- Progress indicators
- Error propagation

### 4. Sandbox Pattern
Isolated execution:
- Security boundaries
- Resource limits
- Timeout enforcement
- Error recovery

### 5. Registry Pattern
Centralized tool management:
- Dynamic discovery
- Category organization
- Visibility control
- Weight-based sorting

## Data Flow Diagrams

### Agent Run Flow
```
User → Frontend → Backend API
                    ↓
              ThreadManager
                    ↓
         [Message Pipeline]
              Fetch → Validate → Prepare
                    ↓
              LLM Executor (LiteLLM)
                    ↓
              [Tool Execution]
              ToolRegistry → Tool
                    ↓
         Sandbox (if needed)
                    ↓
              Result → LLM
                    ↓
          Auto-Continue Check
                    ↓
         SSE Stream → Frontend
```

### BIM Analysis Flow
```
User uploads IFC → Frontend
                    ↓
              POST /bim/upload
                    ↓
        Supabase Storage
                    ↓
        IFC Parser Tool
                    ↓
     [Extract Elements]
     Elements → Properties → Relationships
                    ↓
        [Parallel Analysis]
        ├─ Carbon Tool
        ├─ Clash Tool
        └─ Compliance Tool
                    ↓
        Results → Frontend
                    ↓
        BIM Viewer Rendering
```

## Security Architecture

### Authentication
- Supabase Auth (JWT)
- Row-level security (Postgres)
- API key validation
- Rate limiting

### Sandbox Security
- Process isolation
- File system restrictions
- Network isolation
- Timeout enforcement
- Resource limits

### Data Protection
- Encrypted storage (Supabase)
- Encrypted transit (TLS)
- Secrets management (env vars)
- PII handling (GDPR)

## Scalability Patterns

### Horizontal Scaling
- Stateless API servers
- Shared Redis cache
- Database connection pooling
- Load balancing (Traefik)

### Vertical Scaling
- Worker processes (uvicorn)
- Async I/O (FastAPI)
- Connection pooling
- Query optimization

### Caching Strategy
- L1: In-memory (process)
- L2: Redis (shared)
- L3: Database (Postgres)
- TTL-based invalidation

## Error Handling

### Error Boundaries
- API level: HTTP error codes
- Agent level: Tool errors, LLM failures
- Tool level: Execution exceptions
- Sandbox level: Timeout, resource limits

### Error Recovery
- Automatic retries (LLM calls)
- Graceful degradation
- Error state persistence
- User notifications

## Observability

### Logging
- Structured logging (structlog)
- CloudWatch Logs
- Log levels: DEBUG, INFO, WARNING, ERROR
- Request tracing

### Metrics
- Prometheus metrics
- Token usage
- Latency percentiles
- Error rates
- Tool execution times

### Tracing
- Langfuse LLM tracing
- Request ID propagation
- Distributed tracing (future)

## Deployment Architecture

### Local Development
```
Docker Compose
├─ Redis (port 6379)
├─ Backend (port 8000)
└─ Frontend (port 3000)
```

### Staging (Azure Container Apps)
```
Azure ACA Environment
├─ Redis Container App
├─ Backend Container App (HTTP ingress)
└─ Frontend Container App (HTTP ingress)
```

### Production (VM + Docker Compose)
```
Azure VM (coder-vm)
├─ Traefik (reverse proxy)
├─ Docker Compose
   ├─ Redis
   ├─ Backend
   └─ Frontend
└─ Cloudflare Tunnel
   → carbon-bim.ensimu.space
```

## Future Architecture Considerations

### Planned Improvements
- [ ] WebSocket support (replace SSE)
- [ ] Agent-to-agent communication
- [ ] Multi-tenant isolation
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Event sourcing for audit trail
- [ ] GraphQL API (alternative to REST)
- [ ] Desktop app (Electron)
- [ ] CLI tool (Python SDK)
