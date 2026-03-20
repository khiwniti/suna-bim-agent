# External Integrations

## Authentication & Database

### Supabase
**Purpose**: Auth, Postgres database, file storage

**Configuration**:
```env
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_JWT_SECRET=...
```

**Services Used**:
- Auth: Email/password, magic links, OAuth providers
- Postgres: User data, projects, threads, agent runs
- Storage: IFC files, uploaded documents, generated reports

**Files**:
- `backend/core/services/supabase_service.py` - Client wrapper
- `apps/frontend/src/lib/supabase/` - Frontend client

## Caching & Pub/Sub

### Redis
**Purpose**: Caching, streaming, rate limiting

**Configuration**:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=... (optional)
```

**Use Cases**:
- SSE streaming for agent runs
- Rate limiting (OTP endpoints)
- Session caching
- Tool result caching

**Files**:
- `backend/core/services/redis_service.py` - Redis client

### Upstash Redis
**Purpose**: Serverless Redis for edge deployments

**Configuration**:
```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

**Use Cases**:
- Edge function caching
- Distributed rate limiting

## LLM Providers

### Anthropic (Claude)
**Purpose**: Primary LLM provider

**Configuration**:
```env
ANTHROPIC_API_KEY=...
```

**Models Used**:
- claude-opus-4 - Complex analysis
- claude-sonnet-4 - Balanced performance
- claude-haiku-4 - Fast responses

**Files**:
- `backend/core/agentpress/thread_manager/llm_executor.py` - Via LiteLLM

### OpenAI
**Purpose**: Alternative LLM provider, embeddings

**Configuration**:
```env
OPENAI_API_KEY=...
```

**Models Used**:
- gpt-4-turbo - Analysis tasks
- text-embedding-3-large - Document embeddings

**Files**:
- `backend/core/agentpress/thread_manager/llm_executor.py` - Via LiteLLM

### LiteLLM
**Purpose**: Unified interface for multiple LLM providers

**Supported Providers**:
- Anthropic (Claude)
- OpenAI (GPT)
- Azure OpenAI
- Replicate
- HuggingFace

**Features**:
- Provider fallback
- Rate limiting
- Cost tracking
- Streaming support

## Search & Web

### Tavily
**Purpose**: Web search API for research tools

**Configuration**:
```env
TAVILY_API_KEY=...
```

**Use Cases**:
- Web search tool
- Research agent
- Fact checking

**Files**:
- `backend/core/tools/search/web_search_tool.py`

### Apify
**Purpose**: Web scraping and browser automation

**Configuration**:
```env
APIFY_API_TOKEN=...
```

**Use Cases**:
- Web scraping tool
- Content extraction
- Structured data collection

**Files**:
- `backend/core/tools/utility/apify_tool.py`

## Sandbox Environments

### E2B Code Interpreter
**Purpose**: Isolated Python code execution

**Configuration**:
```env
E2B_API_KEY=...
```

**Use Cases**:
- Safe code execution
- Data analysis
- File operations

**Files**:
- `backend/core/sandbox/e2b_sandbox.py`

### Daytona
**Purpose**: Remote development environments

**Configuration**:
```env
DAYTONA_API_KEY=...
DAYTONA_SERVER_URL=...
```

**Use Cases**:
- Long-running tasks
- Complex builds
- Isolated workspaces

**Files**:
- `backend/core/sandbox/daytona_sandbox.py`

## Payments

### Stripe
**Purpose**: Subscription billing, credits

**Configuration**:
```env
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

**Features**:
- Subscription management
- Credit purchases
- Usage-based billing
- Webhook handling

**Files**:
- `backend/core/services/billing_service.py`
- `backend/core/api/billing.py`

## Communication

### Mailtrap
**Purpose**: Email delivery (transactional)

**Configuration**:
```env
MAILTRAP_API_TOKEN=...
```

**Use Cases**:
- OTP emails
- Notifications
- Reports

**Files**:
- `backend/core/services/email_service.py`

### Novu
**Purpose**: Multi-channel notifications

**Configuration**:
```env
NOVU_API_KEY=...
```

**Channels**:
- In-app notifications
- Email (backup)
- Push notifications (mobile)

**Files**:
- `backend/core/services/notification_service.py`

## AI Model Hosting

### Replicate
**Purpose**: Custom model hosting

**Configuration**:
```env
REPLICATE_API_TOKEN=...
```

**Use Cases**:
- Image generation
- Custom fine-tuned models
- Vision models

**Files**:
- `backend/core/tools/vision/vision_tool.py`

### HuggingFace
**Purpose**: Open-source model hub

**Configuration**:
```env
HUGGINGFACE_TOKEN=...
```

**Use Cases**:
- Model inference
- Dataset access
- Fine-tuning

**Files**:
- `backend/core/services/huggingface_service.py`

## Observability

### Langfuse
**Purpose**: LLM observability and analytics

**Configuration**:
```env
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_SECRET_KEY=...
LANGFUSE_HOST=...
```

**Tracked Metrics**:
- Token usage
- Latency
- Cost per request
- Error rates
- User feedback

**Files**:
- `backend/core/services/langfuse_service.py`
- `backend/core/agentpress/thread_manager/llm_executor.py`

### Prometheus
**Purpose**: Metrics collection

**Configuration**:
```env
PROMETHEUS_MULTIPROC_DIR=/tmp/prometheus
```

**Metrics**:
- Request rates
- Response times
- Tool execution times
- Queue depths

**Files**:
- `backend/core/monitoring/metrics.py`

### CloudWatch Logs
**Purpose**: Centralized logging (AWS)

**Configuration**:
```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
```

**Log Groups**:
- `/carbon-bim/backend` - API logs
- `/carbon-bim/agent-runs` - Agent execution logs
- `/carbon-bim/tools` - Tool execution logs

**Files**:
- `backend/core/monitoring/logging.py`

## Tool Integrations

### Composio
**Purpose**: Pre-built tool integrations

**Configuration**:
```env
COMPOSIO_API_KEY=...
```

**Available Tools**:
- GitHub operations
- Google Drive
- Slack messaging
- Calendar management

**Files**:
- `backend/core/tools/integration/composio_tool.py`

### Google APIs
**Purpose**: Google services integration

**Configuration**:
```env
GOOGLE_APPLICATION_CREDENTIALS=...
```

**Services Used**:
- Google Drive API
- Google Sheets API
- Google Calendar API
- Google Analytics Data API

**Files**:
- `backend/core/services/google_service.py`

## BIM-Specific Integrations

### Thai TGO Emission Factors
**Purpose**: Carbon calculation database

**Configuration**:
```env
BIM_CARBON_DATABASE_PATH=/data/carbon_factors.json
```

**Data Source**: Thailand Greenhouse Gas Management Organization (TGO)

**Files**:
- `backend/core/tools/bim/carbon_tool.py`
- `apps/frontend/src/lib/carbon/emission-factors.ts`

### Thai Building Codes
**Purpose**: Compliance checking database

**Configuration**:
```env
BIM_THAI_CODES_PATH=/data/thai_building_codes.json
```

**Codes Covered**:
- Building Control Act
- Fire safety codes
- Accessibility standards

**Files**:
- `backend/core/tools/bim/compliance_tool.py`

## Infrastructure Integrations

### Azure Container Registry
**Purpose**: Container image storage

**Configuration**:
```env
AZURE_CLIENT_ID=...
AZURE_TENANT_ID=...
AZURE_SUBSCRIPTION_ID=...
```

**Registry**: `carbonbimbc6740962ecd.azurecr.io`

**Images**:
- `carbon-bim/backend`
- `carbon-bim/frontend`
- `carbon-bim/redis`

### Cloudflare Tunnels
**Purpose**: Secure reverse proxy

**Configuration**:
```env
CLOUDFLARE_TUNNEL_TOKEN=...
```

**Tunnels**:
- `carbon-bim.ensimu.space` → VM production
- ACA staging → direct ACA ingress

**Files**:
- `scripts/cloudflare-tunnel.sh`

## Security

### RealityDefender
**Purpose**: AI-generated content detection

**Configuration**:
```env
REALITYDEFENDER_API_KEY=...
```

**Use Cases**:
- Deepfake detection
- Generated text validation
- Image authenticity checks

**Files**:
- `backend/core/services/security_service.py`
