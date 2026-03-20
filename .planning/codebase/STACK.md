# Technology Stack

## Languages & Runtimes

### Backend
- **Python 3.11+** - Primary backend language
- **FastAPI** - Async web framework
- **uvicorn** - ASGI server
- **uv** - Package manager (replaces pip/poetry)

### Frontend
- **TypeScript** - Type-safe JavaScript
- **Next.js 15** - React framework with App Router
- **Turbopack** - Next.js bundler (replaces webpack)
- **React 19** - UI library

### Mobile
- **React Native** - Mobile framework
- **Expo** - Development toolchain
- **NativeWind** - Tailwind for React Native

## Core Frameworks

### Backend Framework
```
FastAPI 0.115.12 + uvicorn 0.27.1
├── Async request handling
├── OpenAPI auto-generation
├── Pydantic validation
└── WebSocket support
```

### Frontend Framework
```
Next.js 15 + Turbopack
├── App Router architecture
├── React Server Components
├── Streaming SSR
└── Edge runtime support
```

## Key Dependencies

### Backend - Agent Runtime
- **LiteLLM 1.80.11+** - Multi-provider LLM abstraction (Anthropic, OpenAI)
- **anthropic 0.69.0+** - Claude API client
- **openai 1.99.5+** - OpenAI API client
- **mcp 1.9.4** - Model Context Protocol

### Backend - Data & Storage
- **supabase 2.17.0** - Auth, Postgres, storage
- **prisma 0.15.0** - Database ORM
- **redis 5.2.1** - Caching, pub/sub
- **upstash-redis 1.3.0** - Serverless Redis
- **sqlalchemy 2.0.45+** - SQL toolkit
- **psycopg[binary] 3.3.2+** - PostgreSQL adapter

### Backend - BIM Analysis
- **ifcopenshell 0.7.0+** - IFC file parsing
- **numpy 1.24.0+** - Numerical computing
- **networkx 3.0+** - Graph analysis
- **ladybug-core** - Environmental analysis

### Backend - Sandbox & Execution
- **e2b-code-interpreter 1.2.0** - Isolated code execution
- **daytona-sdk 0.115.0+** - Development environments
- **paramiko 3.4.0+** - SSH client

### Backend - Observability
- **langfuse 2.60.5** - LLM observability
- **prometheus-client 0.21.1** - Metrics
- **structlog 25.4.0** - Structured logging
- **watchtower 3.0.0+** - CloudWatch Logs

### Backend - Integrations
- **stripe 11.6.0** - Payments
- **tavily-python 0.5.4** - Search API
- **replicate 0.25.0+** - Model hosting
- **composio 0.8.0+** - Tool integrations
- **apify-client 2.3.0** - Web scraping
- **huggingface-hub 0.34.4+** - Model hub
- **google-api-python-client 2.120.0+** - Google APIs
- **braintrust 0.3.15+** - LLM evaluation

### Frontend - UI & Styling
- **Tailwind CSS 4** - Utility-first CSS
- **Radix UI** - Accessible components
- **Lucide React** - Icons
- **@thatopen/components** - BIM 3D viewer

### Frontend - State & Data
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **@agentpress/shared** - Shared types & utilities

## Build Tools

### Backend
- **uv** - Fast Python package manager
- **ruff** - Linter & formatter
- **pytest** - Testing framework
- **Make** - Build automation

### Frontend
- **pnpm** - Package manager (monorepo support)
- **Turbopack** - Next.js bundler
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Playwright** - E2E testing

## Infrastructure

### Deployment Platforms
- **Azure Container Apps** - Staging environment
- **Docker Compose** - Local & production
- **Cloudflare Tunnels** - Reverse proxy
- **Traefik** - Load balancer

### CI/CD
- **GitHub Actions** - Automation workflows
- **Azure Container Registry** - Container images
- **GitHub Container Registry** - Public images

### Monitoring & Logging
- **Langfuse** - LLM observability
- **Prometheus** - Metrics collection
- **CloudWatch Logs** - Log aggregation
- **Sentry** (planned) - Error tracking

## Development Tools

### Package Managers
- Backend: `uv` (Python)
- Frontend: `pnpm` (Node.js)
- System: `apt` (Debian/Ubuntu)

### Version Requirements
- Python: >=3.11
- Node.js: >=18 (implied by Next.js 15)
- pnpm: >=8

### Runtime Configuration
- Python ASGI: uvicorn with workers
- Node.js: Next.js standalone server
- Redis: 6.x compatible
