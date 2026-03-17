# =============================================================================
# Suna — Makefile
# Package managers: pnpm (frontend)  |  uv (Python backend)
#
# Services
#   frontend  → apps/frontend   Next.js  :3000
#   backend   → backend/        FastAPI  :8000
#   redis     → Docker          Redis    :6379
#
# Quick start (local):   make install && make dev
# Quick start (Docker):  make docker-up
# =============================================================================

.DEFAULT_GOAL := help
.PHONY: help \
        install install-frontend install-backend \
        dev dev-frontend dev-backend \
        start start-frontend start-backend \
        stop restart \
        build build-frontend \
        docker-up docker-down docker-build docker-logs docker-logs-api docker-logs-redis docker-ps \
        dokploy-setup dokploy-build dokploy-up dokploy-down dokploy-logs dokploy-validate \
        dokploy-cli-install dokploy-cli-auth dokploy-cli-verify dokploy-cli-projects dokploy-cli-deploy dokploy-cli-env-push \
        test test-e2e test-frontend test-backend test-backend-cov \
        lint lint-frontend lint-backend lint-fix \
        format format-check typecheck \
        verify check \
        db-migrate db-reset \
        env-frontend env-backend \
        clean clean-frontend clean-backend

# ── Colours ───────────────────────────────────────────────────────────────────
CYAN  := \033[36m
GREEN := \033[32m
BOLD  := \033[1m
RESET := \033[0m

# ── Paths ─────────────────────────────────────────────────────────────────────
FRONTEND := apps/frontend
BACKEND  := backend

# =============================================================================
# HELP
# =============================================================================
help:
	@printf "$(BOLD)Suna$(RESET) — AI Agent Platform\n"
	@printf "$(CYAN)Usage: make <target>$(RESET)\n\n"
	@printf "$(BOLD)━━ Setup ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)\n"
	@printf "  $(GREEN)install$(RESET)            Install all deps (pnpm + uv)\n"
	@printf "  $(GREEN)install-frontend$(RESET)   pnpm install  (Next.js)\n"
	@printf "  $(GREEN)install-backend$(RESET)    uv sync       (FastAPI)\n"
	@printf "  $(GREEN)env-frontend$(RESET)       Create apps/frontend/.env.local from example\n"
	@printf "  $(GREEN)env-backend$(RESET)        Create backend/.env from example\n"
	@printf "\n$(BOLD)━━ Development (local, no Docker) ━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)\n"
	@printf "  $(GREEN)dev$(RESET)                Frontend + backend concurrently\n"
	@printf "  $(GREEN)dev-frontend$(RESET)       Next.js dev server only    :3000\n"
	@printf "  $(GREEN)dev-backend$(RESET)        FastAPI dev server only    :8000\n"
	@printf "\n$(BOLD)━━ Docker (full stack) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)\n"
	@printf "  $(GREEN)docker-up$(RESET)          Start all services (detached)\n"
	@printf "  $(GREEN)docker-down$(RESET)        Stop all services\n"
	@printf "  $(GREEN)docker-build$(RESET)       Rebuild Docker images\n"
	@printf "  $(GREEN)docker-logs$(RESET)        Tail all logs\n"
	@printf "  $(GREEN)docker-logs-api$(RESET)    Tail API logs only\n"
	@printf "  $(GREEN)docker-logs-redis$(RESET)  Tail Redis logs only\n"
	@printf "  $(GREEN)docker-ps$(RESET)          Show running containers\n"
	@printf "  $(GREEN)restart$(RESET)            docker-down + docker-up\n"
	@printf "\n$(BOLD)━━ Dokploy (production) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)\n"
	@printf "  $(GREEN)dokploy-validate$(RESET)      Validate compose file syntax\n"
	@printf "  $(GREEN)dokploy-setup$(RESET)         Copy .env.dokploy → .env for local test\n"
	@printf "  $(GREEN)dokploy-build$(RESET)         Build production images\n"
	@printf "  $(GREEN)dokploy-up$(RESET)            Start production stack (detached)\n"
	@printf "  $(GREEN)dokploy-down$(RESET)          Stop production stack\n"
	@printf "  $(GREEN)dokploy-logs$(RESET)          Tail production logs\n"
	@printf "\n$(BOLD)━━ Dokploy CLI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)\n"
	@printf "  $(GREEN)dokploy-cli-install$(RESET)   Install @dokploy/cli globally\n"
	@printf "  $(GREEN)dokploy-cli-auth$(RESET)      Authenticate CLI (needs DOKPLOY_SERVER_URL)\n"
	@printf "  $(GREEN)dokploy-cli-verify$(RESET)    Verify CLI authentication\n"
	@printf "  $(GREEN)dokploy-cli-deploy$(RESET)    Deploy app via CLI (needs APP_ID)\n"
	@printf "  $(GREEN)dokploy-cli-env-push$(RESET)  Push .env.dokploy to remote app\n"
	@printf "\n$(BOLD)━━ Build ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)\n"
	@printf "  $(GREEN)build$(RESET)              Production build (Next.js)\n"
	@printf "\n$(BOLD)━━ Database ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)\n"
	@printf "  $(GREEN)db-migrate$(RESET)         Apply Supabase migrations\n"
	@printf "  $(GREEN)db-reset$(RESET)           Reset local Supabase DB\n"
	@printf "\n$(BOLD)━━ Quality ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)\n"
	@printf "  $(GREEN)test$(RESET)               Run all tests (backend + E2E)\n"
	@printf "  $(GREEN)test-e2e$(RESET)           Playwright E2E tests (BIM features)\n"
	@printf "  $(GREEN)test-frontend$(RESET)      (placeholder — add vitest when ready)\n"
	@printf "  $(GREEN)test-backend$(RESET)       pytest\n"
	@printf "  $(GREEN)lint$(RESET)               ESLint + Ruff\n"
	@printf "  $(GREEN)typecheck$(RESET)          TypeScript check\n"
	@printf "  $(GREEN)format$(RESET)             Prettier + Ruff format\n"
	@printf "  $(GREEN)verify$(RESET)             Backend build verification\n"
	@printf "\n$(BOLD)━━ Cleanup ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)\n"
	@printf "  $(GREEN)clean$(RESET)              Remove all build artefacts\n"

# =============================================================================
# SETUP
# =============================================================================
env-frontend:
	@if [ ! -f $(FRONTEND)/.env.local ]; then \
		cp $(FRONTEND)/.env.example $(FRONTEND)/.env.local 2>/dev/null || \
		cp $(FRONTEND)/.env.sample  $(FRONTEND)/.env.local 2>/dev/null || \
		{ printf "$(CYAN)No .env.example found — creating blank $(FRONTEND)/.env.local$(RESET)\n"; touch $(FRONTEND)/.env.local; }; \
		printf "$(GREEN)✔ Created $(FRONTEND)/.env.local$(RESET)\n"; \
	else \
		printf "$(CYAN)$(FRONTEND)/.env.local already exists — skipping.$(RESET)\n"; \
	fi

env-backend:
	@if [ ! -f $(BACKEND)/.env ]; then \
		cp $(BACKEND)/.env.example $(BACKEND)/.env 2>/dev/null || \
		{ printf "$(CYAN)No .env.example found — creating blank $(BACKEND)/.env$(RESET)\n"; touch $(BACKEND)/.env; }; \
		printf "$(GREEN)✔ Created $(BACKEND)/.env$(RESET)\n"; \
	else \
		printf "$(CYAN)$(BACKEND)/.env already exists — skipping.$(RESET)\n"; \
	fi

install: install-frontend install-backend
	@printf "$(GREEN)✔ All dependencies installed.$(RESET)\n"

install-frontend:
	@printf "$(CYAN)▶ Installing frontend dependencies (pnpm)…$(RESET)\n"
	pnpm install

install-backend:
	@printf "$(CYAN)▶ Installing backend dependencies (uv)…$(RESET)\n"
	cd $(BACKEND) && uv sync

# =============================================================================
# DEVELOPMENT (local, no Docker)
# =============================================================================
dev: dev-backend dev-frontend
	@printf "$(GREEN)✔ Both servers started.$(RESET)\n"

dev-frontend:
	@printf "$(CYAN)▶ Starting Next.js dev server on :3000…$(RESET)\n"
	pnpm --filter carbon-bim dev

dev-backend:
	@printf "$(CYAN)▶ Starting FastAPI dev server on :8000…$(RESET)\n"
	cd $(BACKEND) && uv run uvicorn api:app --reload --host 0.0.0.0 --port 8000

# =============================================================================
# BUILD
# =============================================================================
build: build-frontend

build-frontend:
	@printf "$(CYAN)▶ Building Next.js for production…$(RESET)\n"
	pnpm --filter carbon-bim build

# =============================================================================
# DOCKER — full stack (api + redis)
# =============================================================================
docker-up:
	@printf "$(CYAN)▶ Starting Suna services via Docker Compose…$(RESET)\n"
	cd $(BACKEND) && docker compose up -d
	@printf "$(GREEN)✔ Services running:$(RESET)\n"
	@printf "   API    → http://localhost:8000\n"
	@printf "   Redis  → localhost:6379\n"
	@printf "$(CYAN)   Start frontend separately: make dev-frontend$(RESET)\n"

docker-down:
	@printf "$(CYAN)▶ Stopping Docker services…$(RESET)\n"
	cd $(BACKEND) && docker compose down

docker-build:
	@printf "$(CYAN)▶ Rebuilding Docker images…$(RESET)\n"
	cd $(BACKEND) && docker compose build --no-cache

docker-logs:
	cd $(BACKEND) && docker compose logs -f

docker-logs-api:
	cd $(BACKEND) && docker compose logs -f api

docker-logs-redis:
	cd $(BACKEND) && docker compose logs -f redis

docker-ps:
	cd $(BACKEND) && docker compose ps

restart: docker-down docker-up

# =============================================================================
# DOKPLOY — production deployment
# =============================================================================
dokploy-setup:
	@if [ ! -f .env ]; then \
		cp .env.dokploy .env; \
		printf "$(GREEN)✔ Copied .env.dokploy → .env$(RESET)\n"; \
		printf "$(CYAN)  Edit .env and fill in REQUIRED values before running dokploy-up.$(RESET)\n"; \
	else \
		printf "$(CYAN).env already exists — skipping. Delete it first to reset.$(RESET)\n"; \
	fi

dokploy-build:
	@printf "$(CYAN)▶ Building Dokploy production images…$(RESET)\n"
	docker compose -f docker-compose.dokploy.yml build

dokploy-up:
	@printf "$(CYAN)▶ Starting Dokploy production stack…$(RESET)\n"
	docker compose -f docker-compose.dokploy.yml up -d
	@printf "$(GREEN)✔ Services running:$(RESET)\n"
	@printf "   Frontend  → http://localhost:3000\n"
	@printf "   Backend   → http://localhost:8000\n"

dokploy-down:
	@printf "$(CYAN)▶ Stopping Dokploy production stack…$(RESET)\n"
	docker compose -f docker-compose.dokploy.yml down

dokploy-logs:
	docker compose -f docker-compose.dokploy.yml logs -f

dokploy-validate:
	@printf "$(CYAN)▶ Validating docker-compose.dokploy.yml syntax…$(RESET)\n"
	docker compose -f docker-compose.dokploy.yml config --quiet && \
		printf "$(GREEN)✔ Compose file is valid$(RESET)\n"

# =============================================================================
# DOKPLOY CLI  — Remote deployment via @dokploy/cli
# Requires: DOKPLOY_SERVER_URL and DOKPLOY_TOKEN set in environment or .env.dokploy
# Usage:
#   export $(grep -v '^#' .env.dokploy | xargs)  # load vars
#   make dokploy-cli-auth
#   make dokploy-cli-deploy APP_ID=<applicationId>
# =============================================================================

# Load .env.dokploy vars into the shell if present
_DOKPLOY_ENV := $(shell test -f .env.dokploy && echo "set -a && . ./.env.dokploy && set +a &&")

dokploy-cli-install:
	@printf "$(CYAN)▶ Installing @dokploy/cli…$(RESET)\n"
	npm install -g @dokploy/cli
	@printf "$(GREEN)✔ dokploy CLI installed: $$(dokploy --version)$(RESET)\n"

dokploy-cli-auth:
	@test -n "$(DOKPLOY_SERVER_URL)" || (printf "$(BOLD)ERROR: DOKPLOY_SERVER_URL is not set.\n  Run: export DOKPLOY_SERVER_URL=https://your-panel-domain.com\n  Or load .env.dokploy first: export \$$(grep -v '^#' .env.dokploy | xargs)$(RESET)\n" && exit 1)
	@printf "$(CYAN)▶ Authenticating Dokploy CLI with $(DOKPLOY_SERVER_URL)…$(RESET)\n"
	dokploy authenticate \
		--url="$(DOKPLOY_SERVER_URL)" \
		--token="$(DOKPLOY_TOKEN)"
	@printf "$(GREEN)✔ Authenticated. Run 'make dokploy-cli-verify' to confirm.$(RESET)\n"

dokploy-cli-verify:
	@printf "$(CYAN)▶ Verifying Dokploy CLI token…$(RESET)\n"
	dokploy verify

dokploy-cli-projects:
	@printf "$(CYAN)▶ Listing Dokploy projects…$(RESET)\n"
	dokploy project list

dokploy-cli-deploy:
	@test -n "$(APP_ID)" || (printf "$(BOLD)ERROR: APP_ID is not set.\n  Usage: make dokploy-cli-deploy APP_ID=<applicationId>$(RESET)\n" && exit 1)
	@printf "$(CYAN)▶ Deploying application $(APP_ID)…$(RESET)\n"
	dokploy app deploy --applicationId="$(APP_ID)" --skipConfirm
	@printf "$(GREEN)✔ Deploy triggered for $(APP_ID)$(RESET)\n"

dokploy-cli-env-push:
	@test -n "$(APP_ID)" || (printf "$(BOLD)ERROR: APP_ID is not set.\n  Usage: make dokploy-cli-env-push APP_ID=<applicationId>$(RESET)\n" && exit 1)
	@printf "$(CYAN)▶ Pushing .env.dokploy to application $(APP_ID)…$(RESET)\n"
	dokploy env push .env.dokploy
	@printf "$(GREEN)✔ Environment variables pushed$(RESET)\n"

# Combined: Docker backend + local frontend dev
start: docker-up dev-frontend

stop: docker-down

# =============================================================================
# DATABASE
# =============================================================================
db-migrate:
	@printf "$(CYAN)▶ Applying Supabase migrations…$(RESET)\n"
	cd $(BACKEND) && uv run supabase db push 2>/dev/null || \
		npx supabase db push

db-reset:
	@printf "$(CYAN)▶ Resetting local Supabase DB…$(RESET)\n"
	cd $(BACKEND) && uv run supabase db reset 2>/dev/null || \
		npx supabase db reset

# =============================================================================
# TESTING
# =============================================================================
test: test-backend test-e2e

test-e2e:
	@printf "$(CYAN)▶ Running Playwright E2E tests (BIM features)…$(RESET)\n"
	cd $(FRONTEND) && ./node_modules/.bin/playwright test e2e/bim-features.spec.ts --project=chromium

test-frontend:
	@printf "$(CYAN)▶ Frontend tests (add vitest config to enable)…$(RESET)\n"
	pnpm --filter carbon-bim test 2>/dev/null || \
		printf "$(CYAN)No test script configured in frontend yet.$(RESET)\n"

test-backend:
	@printf "$(CYAN)▶ Running pytest…$(RESET)\n"
	cd $(BACKEND) && uv run pytest tests/ -v --tb=short

test-backend-cov:
	cd $(BACKEND) && uv run pytest tests/ -v --cov=core --cov-report=term --cov-report=html

# =============================================================================
# CODE QUALITY
# =============================================================================
lint: lint-frontend lint-backend

lint-frontend:
	@printf "$(CYAN)▶ ESLint…$(RESET)\n"
	pnpm --filter carbon-bim lint

lint-backend:
	@printf "$(CYAN)▶ Ruff check…$(RESET)\n"
	cd $(BACKEND) && uv run ruff check core/

lint-fix:
	pnpm --filter carbon-bim lint --fix 2>/dev/null || true
	cd $(BACKEND) && uv run ruff check --fix core/

typecheck:
	@printf "$(CYAN)▶ TypeScript type check…$(RESET)\n"
	pnpm --filter carbon-bim exec tsc --noEmit

format:
	@printf "$(CYAN)▶ Prettier…$(RESET)\n"
	pnpm --filter carbon-bim format
	@printf "$(CYAN)▶ Ruff format…$(RESET)\n"
	cd $(BACKEND) && uv run ruff format core/

format-check:
	pnpm --filter carbon-bim format:check
	cd $(BACKEND) && uv run ruff format --check core/

verify:
	@printf "$(CYAN)▶ Backend build verification…$(RESET)\n"
	cd $(BACKEND) && uv run python core/utils/scripts/verify_build.py

check: verify lint format-check typecheck

# =============================================================================
# CLEANUP
# =============================================================================
clean: clean-frontend clean-backend
	@printf "$(GREEN)✔ Cleaned.$(RESET)\n"

clean-frontend:
	rm -rf $(FRONTEND)/.next $(FRONTEND)/out $(FRONTEND)/dist
	rm -rf $(FRONTEND)/node_modules/.cache

clean-backend:
	cd $(BACKEND) && rm -rf .venv __pycache__ .pytest_cache .ruff_cache .mypy_cache htmlcov .coverage logs/
	find $(BACKEND) -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find $(BACKEND) -type f -name "*.pyc" -delete 2>/dev/null || true
