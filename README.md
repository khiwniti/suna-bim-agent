<div align="center">

# Carbon BIM

**AI Agent Platform for Building Information Modeling**

Specialized platform for BIM analysis with IFC model processing, carbon calculation, clash detection, and Thai building code compliance.

[![Discord Follow](https://dcbadge.limes.pink/api/server/RvFhXUdZ9H?style=flat)](https://discord.com/invite/RvFhXUdZ9H)
[![GitHub Repo stars](https://img.shields.io/github/stars/khiwniti/suna-bim-agent)](https://github.com/khiwniti/suna-bim-agent)
[![Issues](https://img.shields.io/github/issues/khiwniti/suna-bim-agent)](https://github.com/khiwniti/suna-bim-agent/labels/bug)

![Carbon BIM Banner](apps/frontend/public/banner.png)
</div>

## BIM Features

- **IFC Upload**: Upload IFC files via chat for analysis
- **3D Viewer**: Interactive BIM model viewer in the workspace
- **Carbon Analysis**: Thai emission factor (TGO/TREES) carbon calculation
- **Clash Detection**: Automated MEP/structural clash detection
- **Code Compliance**: Thai building codes (มยผ.) compliance checking
- **Thai Language**: Full Thai interface and analysis results

## What's Included

### 🤖 Carbon BIM Super Worker
Flagship AI worker that demonstrates full platform capabilities through natural conversation.

### 🏗️ Platform Architecture

Carbon BIM consists of four main components:

| Component | Technology | Description |
|-----------|------------|-------------|
| **Backend API** | Python/FastAPI | REST endpoints, thread management, agent orchestration, LiteLLM integration |
| **Frontend Dashboard** | Next.js 15 | Agent management interface, chat, configuration, deployment controls |
| **Agent Runtime** | Docker | Isolated execution environments with browser automation, code interpreter |
| **Database & Storage** | Supabase | Auth, user management, conversation history, file storage |

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- pnpm
- Docker & Docker Compose (for containerized deployment)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/khiwniti/suna-bim-agent.git
cd suna-bim-agent
```

### 2️⃣ Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Install Python dependencies (in backend directory)
cd backend
uv sync
```

### 3️⃣ Configure Environment

Copy the example environment file and configure:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local
```

### 4️⃣ Start Development Server

```bash
# From root directory
pnpm dev:frontend
```

The frontend will be available at `http://localhost:3000`

### Production Deployment

See [Self-Hosting Guide](./docs/SELF-HOSTING.md) for production deployment options.

## Project Structure

```
suna-bim-agent/
├── apps/
│   ├── frontend/          # Next.js 15 dashboard
│   └── mobile/            # React Native mobile app
├── backend/
│   ├── api.py             # FastAPI entry point
│   └── core/
│       ├── agentpress/    # Agent runtime framework
│       ├── agents/        # Agent APIs
│       ├── bim/           # BIM-specific endpoints
│       └── tools/         # Tool implementations
├── packages/
│   └── shared/            # Shared TypeScript types
└── docs/                 # Documentation
```

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key |
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port |
| `ANTHROPIC_API_KEY` | Anthropic API key for LLM |
| `OPENAI_API_KEY` | OpenAI API key (optional) |

### Frontend (.env.local)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL |

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Questions?** [Join Discord](https://discord.com/invite/RvFhXUdZ9H) • [Report Issue](https://github.com/khiwniti/suna-bim-agent/issues)

</div>