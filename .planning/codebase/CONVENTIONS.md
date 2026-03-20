# Code Conventions

## Naming Conventions

### Backend (Python)
```python
# Modules and packages
snake_case.py
my_module/

# Classes
class UserAccount:
class CarbonCalculationTool:

# Functions and methods
def calculate_carbon():
def get_user_by_id():

# Constants
UPPER_SNAKE_CASE
MAX_FILE_SIZE_MB = 500
DEFAULT_TIMEOUT = 30

# Private/internal
_private_function()
_InternalClass

# Type hints
from typing import Optional, List, Dict
def process_data(items: List[str]) -> Dict[str, Any]:
```

### Frontend (TypeScript)
```typescript
// Files
kebab-case.tsx
user-profile.tsx
agent-card.tsx

// Components (files can be PascalCase.tsx)
PascalCase
UserProfile
AgentCard

// Functions
camelCase()
getUserData()
handleSubmit()

// Constants
UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = "...";

// Types and Interfaces
PascalCase
type User = {...}
interface AgentConfig {...}

// Hooks
use prefix
useAgentStream()
useAuth()
```

### File Naming Patterns

**Backend**:
- Tools: `{domain}_{name}_tool.py` (e.g., `carbon_tool.py`)
- Services: `{name}_service.py` (e.g., `supabase_service.py`)
- Tests: `test_{module}.py` (e.g., `test_carbon_tool.py`)
- Config: `{name}_config.py` or `settings.py`

**Frontend**:
- Components: `kebab-case.tsx` or `PascalCase.tsx`
- Pages: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- API routes: `route.ts`
- Utilities: `kebab-case.ts` (e.g., `json-utils.ts`)
- Hooks: `use-{name}.ts` (e.g., `use-agent-stream.ts`)

## Import Organization

### Backend (Python)
```python
# 1. Standard library
import asyncio
import json
from typing import Optional, List

# 2. Third-party packages
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import ifcopenshell

# 3. Local imports (absolute from project root)
from core.agentpress.tool import Tool
from core.services.supabase_service import supabase_client
from core.config.settings import settings
```

### Frontend (TypeScript)
```typescript
// 1. React and Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

// 3. Internal packages
import { Message } from '@agentpress/shared/types';

// 4. Local imports (absolute from src)
import { Button } from '@/components/ui/button';
import { useAgentStream } from '@/hooks/use-agent-stream';
import { cn } from '@/lib/utils';
```

## Code Style

### Backend (Python)

**Linter/Formatter**: Ruff (configured in `pyproject.toml`)

```python
# Line length: 100 characters
# Indentation: 4 spaces
# String quotes: Double quotes preferred

# Type hints required for public functions
def calculate_carbon(
    elements: List[IFCElement],
    emission_factors: Dict[str, float],
) -> CarbonResult:
    """Calculate embodied carbon from IFC elements.

    Args:
        elements: List of IFC elements to analyze
        emission_factors: Material emission factors (kgCO2e/kg)

    Returns:
        CarbonResult with total and per-element breakdown
    """
    pass

# Docstrings: Google style
# Function docstrings for public APIs
# Class docstrings for all classes

# Async preferred for I/O operations
async def fetch_user(user_id: str) -> User:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"/users/{user_id}")
        return User(**response.json())
```

**PEP 8 Compliance**:
- Maximum line length: 100 characters
- 4-space indentation (no tabs)
- Blank lines: 2 between top-level definitions, 1 between methods
- Imports: Standard → Third-party → Local

### Frontend (TypeScript)

**Linter**: ESLint (Next.js config)
**Formatter**: Prettier

```typescript
// Indentation: 2 spaces
// Semicolons: Required
// String quotes: Single quotes (Prettier default)
// Trailing commas: Always (Prettier default)

// Component structure
export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Effect logic
  }, [userId]);

  return (
    <div className="space-y-4">
      {user ? <UserCard user={user} /> : <Skeleton />}
    </div>
  );
}

// Props types inline for simple components
// Separate interface for complex props
interface AgentCardProps {
  agent: Agent;
  onSelect?: (agent: Agent) => void;
  variant?: 'default' | 'compact';
}

export function AgentCard({ agent, onSelect, variant = 'default' }: AgentCardProps) {
  // Component logic
}
```

**Key Patterns**:
- Use `function` declarations for components (not `const`)
- Props destructuring in function signature
- Default values in destructuring
- Client components: `'use client'` directive at top
- Server actions: `'use server'` directive at top

## Error Handling

### Backend (Python)

```python
# Use specific exceptions
from fastapi import HTTPException

# HTTP errors
raise HTTPException(status_code=404, detail="Agent not found")
raise HTTPException(status_code=400, detail="Invalid IFC file format")

# Custom exceptions
class ToolExecutionError(Exception):
    """Raised when tool execution fails."""
    pass

# Try/except for expected failures
try:
    result = await tool.execute(params)
except ToolExecutionError as e:
    logger.error(f"Tool execution failed: {e}")
    return error_response(str(e))

# Let unexpected errors propagate (FastAPI handles them)
```

### Frontend (TypeScript)

```typescript
// Use try/catch for async operations
try {
  const response = await fetch('/api/agent/start', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
} catch (error) {
  console.error('Failed to start agent:', error);
  throw error; // Re-throw for caller to handle
}

// Error boundaries for UI errors
// See app/error.tsx for Next.js error boundary
```

## React Patterns

### Component Organization

```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Component
export function MyComponent({ prop }: Props) {
  // 4. Hooks (in order: React, custom, third-party)
  const [state, setState] = useState();
  const { data } = useCustomHook();
  const query = useQuery();

  // 5. Event handlers
  const handleClick = () => {
    // ...
  };

  // 6. Effects (after event handlers)
  useEffect(() => {
    // ...
  }, []);

  // 7. Derived state
  const derived = useMemo(() => {
    return compute(state);
  }, [state]);

  // 8. Early returns (loading, error states)
  if (isLoading) return <Spinner />;
  if (error) return <Error error={error} />;

  // 9. Main render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Server vs Client Components

```typescript
// Server Component (default in Next.js 15+)
// No 'use client' directive
// Can use async/await directly
export default async function Page() {
  const data = await fetchData(); // Direct async
  return <div>{data}</div>;
}

// Client Component (interactivity, browser APIs)
'use client';

export function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### State Management

```typescript
// Local state: useState
const [value, setValue] = useState(initial);

// Server state: TanStack Query
const { data, isLoading, error } = useQuery({
  queryKey: ['agents'],
  queryFn: fetchAgents,
});

// Global client state: Zustand
// See stores/*.ts
import { useAgentStore } from '@/stores/agent-store';
const { agents, setAgents } = useAgentStore();
```

## Tool System (Backend)

### Tool Structure

```python
from core.agentpress.tool import Tool, tool_metadata, openapi_schema, ToolResult

@tool_metadata(
    display_name="Carbon Calculation",
    description="Calculate embodied carbon from IFC models using Thai TGO emission factors",
    icon="Leaf",
    weight=60,  # Sort order (lower = higher priority in UI)
    visible=True,  # Show in frontend tool list
    usage_guide="""
    # Carbon Calculation Tool

    Analyzes IFC files to calculate embodied carbon...
    """
)
class CarbonCalculationTool(Tool):

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "calculate_carbon",
            "description": "Calculate embodied carbon for IFC model",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to IFC file"
                    },
                    "lifecycle_stage": {
                        "type": "string",
                        "enum": ["A1-A3", "A4", "A5", "B1-B5", "C1-C4"],
                        "description": "EN 15978 lifecycle stage"
                    }
                },
                "required": ["file_path"]
            }
        }
    })
    async def calculate_carbon(
        self,
        file_path: str,
        lifecycle_stage: str = "A1-A3"
    ) -> ToolResult:
        """Calculate embodied carbon."""
        try:
            # Tool implementation
            result = await self._perform_calculation(file_path, lifecycle_stage)

            return self.success_response({
                "total_co2": result.total,
                "breakdown": result.breakdown,
                "unit": "kgCO2e"
            })
        except Exception as e:
            return self.error_response(str(e))

    async def _perform_calculation(self, file_path: str, stage: str):
        # Private helper method
        pass
```

### Tool Registration

```python
# In core/tools/tool_registry.py
from core.tools.bim.carbon_tool import CarbonCalculationTool

BIM_TOOLS = [
    CarbonCalculationTool(),
    # Other BIM tools...
]

# Tool categories
TOOL_CATEGORIES = {
    "core": CORE_TOOLS,
    "sandbox": SANDBOX_TOOLS,
    "search": SEARCH_TOOLS,
    "bim": BIM_TOOLS,
    "utility": UTILITY_TOOLS,
}
```

## Configuration Management

### Backend Environment Variables

```python
# Use pydantic-settings for type-safe config
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    supabase_url: str
    supabase_key: str

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379

    # LLM
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None

    # BIM
    bim_carbon_database_path: str = "/data/carbon_factors.json"
    bim_max_file_size_mb: int = 500

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

### Frontend Environment Variables

```typescript
// Next.js automatically exposes NEXT_PUBLIC_* to browser
// Use process.env for server-side, env vars in client components

// Server-side (API routes, Server Components)
const apiKey = process.env.API_SECRET_KEY;

// Client-side (must be NEXT_PUBLIC_*)
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

// Type-safe env vars
// Create env.d.ts:
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_BACKEND_URL: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
  }
}
```

## Logging

### Backend (Python)

```python
import structlog

logger = structlog.get_logger(__name__)

# Structured logging with context
logger.info("agent_run_started", agent_id=agent_id, user_id=user_id)
logger.error("tool_execution_failed", tool=tool_name, error=str(e))

# Different log levels
logger.debug("detailed_info")  # Development only
logger.info("normal_operation")  # Standard logging
logger.warning("potential_issue")  # Warnings
logger.error("error_occurred", exc_info=True)  # Errors with traceback
```

### Frontend (TypeScript)

```typescript
// Console logging (development)
console.log('Info message');
console.warn('Warning message');
console.error('Error message', error);

// Production: Consider log aggregation service
// e.g., Sentry, LogRocket, Datadog
```

## Comments and Documentation

### When to Comment

**DO Comment**:
- Complex algorithms or business logic
- Non-obvious workarounds or hacks
- Performance optimizations
- Integration quirks or API limitations
- TODOs with context

```python
# HACK: ifcopenshell v0.7 has a bug with nested properties
# Using workaround until v0.8 is released
# See: https://github.com/ifcopenshell/ifcopenshell/issues/1234
```

**DON'T Comment**:
- Self-explanatory code
- Redundant descriptions
- Dead code (delete it instead)
- Change history (use git)

### Docstrings

**Backend (Python)**: Google style

```python
def calculate_carbon(
    elements: List[IFCElement],
    factors: Dict[str, float]
) -> CarbonResult:
    """Calculate embodied carbon from IFC elements.

    Uses Thai TGO emission factors for material carbon intensity.
    Supports EN 15978 lifecycle stages.

    Args:
        elements: List of IFC elements to analyze
        factors: Material emission factors (kgCO2e/kg)

    Returns:
        CarbonResult with total and per-element breakdown

    Raises:
        ValueError: If emission factor not found for material

    Example:
        >>> elements = parse_ifc("model.ifc")
        >>> factors = load_emission_factors()
        >>> result = calculate_carbon(elements, factors)
        >>> print(f"Total: {result.total} kgCO2e")
    """
```

**Frontend (TypeScript)**: JSDoc

```typescript
/**
 * Stream agent responses using Server-Sent Events
 *
 * @param runId - Agent run ID to stream
 * @param onMessage - Callback for each message chunk
 * @param onError - Callback for errors
 * @returns Cleanup function to close stream
 *
 * @example
 * const cleanup = streamAgentRun(
 *   'run_123',
 *   (message) => console.log(message),
 *   (error) => console.error(error)
 * );
 *
 * // Later: cleanup();
 */
export function streamAgentRun(
  runId: string,
  onMessage: (message: Message) => void,
  onError: (error: Error) => void
): () => void {
  // Implementation
}
```

## API Design

### REST Endpoints (Backend)

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/agents", tags=["agents"])

# Request/response models
class CreateAgentRequest(BaseModel):
    name: str
    system_prompt: str
    tools: List[str]

class AgentResponse(BaseModel):
    id: str
    name: str
    created_at: str

# Endpoints
@router.post("/", response_model=AgentResponse)
async def create_agent(
    request: CreateAgentRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new agent."""
    # Implementation
    pass

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str):
    """Get agent by ID."""
    # Implementation
    pass
```

**URL Patterns**:
- Collections: `/agents`, `/threads`
- Resources: `/agents/{id}`, `/threads/{id}`
- Actions: `/agents/{id}/start`, `/runs/{id}/stop`
- Nested: `/threads/{id}/messages`

**HTTP Methods**:
- GET: Retrieve (idempotent)
- POST: Create or action
- PUT: Replace (idempotent)
- PATCH: Update (partial)
- DELETE: Remove (idempotent)

### API Response Format

```python
# Success response
{
  "id": "agent_123",
  "name": "Carbon Analyst",
  "created_at": "2024-01-15T10:30:00Z"
}

# Error response
{
  "detail": "Agent not found",
  "code": "AGENT_NOT_FOUND"
}

# List response (with pagination)
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

## Git Workflow

### Commit Messages

```bash
# Format: <type>(<scope>): <subject>

# Types:
feat: New feature
fix: Bug fix
docs: Documentation
style: Formatting, no code change
refactor: Code restructuring
test: Adding tests
chore: Maintenance tasks

# Examples:
feat(bim): add MEP coordination tool
fix(carbon): correct Thai TGO emission factors
docs(api): update agent API documentation
refactor(tools): extract common tool utilities
test(bim): add clash detection tests
chore(deps): update ifcopenshell to v0.7.1
```

### Branch Strategy

```bash
# Main branches
main          # Production (protected)
staging       # Staging environment
develop       # Development (not used, work directly on feature branches)

# Feature branches (from main)
feature/carbon-calculation
feature/clash-detection
fix/ifc-parser-bug
docs/api-documentation

# Merge to main via PR
```

## Code Review Standards

### Checklist

- [ ] Code follows naming conventions
- [ ] Imports properly organized
- [ ] Type hints added (Python) / TypeScript types (Frontend)
- [ ] Error handling appropriate
- [ ] Tests added for new functionality
- [ ] Docstrings/JSDoc for public APIs
- [ ] No hardcoded secrets or API keys
- [ ] Logging added for important operations
- [ ] Performance considerations addressed
- [ ] Security implications reviewed

### Review Focus Areas

1. **Correctness**: Does it work as intended?
2. **Readability**: Is it easy to understand?
3. **Maintainability**: Easy to modify later?
4. **Performance**: Any obvious bottlenecks?
5. **Security**: Any vulnerabilities introduced?
6. **Testing**: Adequate test coverage?
