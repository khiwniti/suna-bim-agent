# Production Deployment Guide - Supabase Configuration

## 🎯 Overview

This document explains the complete Supabase configuration setup for production deployment on Azure VM.

## 📋 Prerequisites

Before deploying to production, you **MUST** verify that all GitHub Secrets are configured correctly.

### Required GitHub Secrets

Navigate to: `Repository Settings → Secrets and variables → Actions`

Add the following 5 secrets:

| Secret Name | Value Source | Description |
|------------|--------------|-------------|
| `DATABASE_URL` | From backend/.env | PostgreSQL connection string with pooler (port 6543) |
| `SUPABASE_URL` | From backend/.env | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | From backend/.env | Service role JWT token (backend only) |
| `SUPABASE_ANON_KEY` | From backend/.env | Anonymous key (frontend + backend) |
| `ENCRYPTION_KEY` | From backend/.env | MCP credentials encryption key |

### Automated Verification

Run the verification script to check if all secrets are configured:

```bash
./scripts/verify-github-secrets.sh
```

Expected output:
```
✅ All required secrets are configured!
```

If any secrets are missing, the script will show:
- Which secrets are missing
- Expected values for each secret
- Direct link to add secrets in GitHub

## 🔄 Deployment Flow

### 1. Environment Variable Injection Chain

```
GitHub Secrets (Repository Settings)
  ↓
GitHub Actions Workflow (deploy-azure-vm.yml)
  ↓
SSH to Azure VM + Export as Environment Variables
  ↓
Create backend/.env from GitHub Secrets
  ↓
Export NEXT_PUBLIC_* for frontend Docker build
  ↓
Docker Compose build with build args
  ↓
Backend: Mount .env as read-only file
Frontend: Baked into Next.js build
```

### 2. Backend Configuration

**File**: `backend/.env` (generated during deployment)

The workflow automatically creates this file from GitHub Secrets:

```bash
cat > backend/.env << EOF
ENCRYPTION_KEY="${ENCRYPTION_KEY}"
NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
SUPABASE_URL="${SUPABASE_URL}"
DATABASE_URL="${DATABASE_URL}"
EOF
```

**Why regenerate .env?**
- `git reset --hard` in the workflow **destroys local .env files**
- Ensures production secrets always come from GitHub Secrets (single source of truth)
- Prevents accidental staging credentials in production

### 3. Frontend Configuration

**File**: `docker-compose.yaml` + `apps/frontend/Dockerfile`

Frontend Supabase configuration requires **build-time** environment variables (Next.js requirement).

**docker-compose.yaml** passes build args:
```yaml
frontend:
  build:
    args:
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:-}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}
```

**Deployment workflow** exports before build:
```bash
export NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
```

**Dockerfile** accepts and bakes into build:
```dockerfile
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
```

## 🚀 Deployment Process

### Step 1: Verify GitHub Secrets

```bash
./scripts/verify-github-secrets.sh
```

If any secrets are missing, add them via GitHub UI or CLI:

```bash
# Using GitHub CLI
gh secret set DATABASE_URL -b "postgresql+psycopg://postgres.vplbjxijbrgwskgxiukd:sb_secret_hzFXV3SOTHtuo10uM2zJZw_tX3EFsx3@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
gh secret set SUPABASE_URL -b "https://vplbjxijbrgwskgxiukd.supabase.co"
gh secret set SUPABASE_SERVICE_ROLE_KEY -b "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
gh secret set SUPABASE_ANON_KEY -b "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
gh secret set ENCRYPTION_KEY -b "D1OsjL9VsBHW24ymsqd-qiRXJP6r8W026HvywVBvI_o="
```

### Step 2: Push to Trigger Deployment

The workflow auto-deploys on push to these branches:
- `main` → Production environment
- `staging` → Staging environment

```bash
git push origin main
```

### Step 3: Monitor Deployment

Watch GitHub Actions workflow:
```
https://github.com/YOUR_ORG/suna-bim-agent/actions
```

Look for successful deployment messages:
```
✅ Deployment to Azure VM succeeded!
🌐 URL: http://your-vm-host/
```

### Step 4: Verify Production

SSH into Azure VM and verify:

```bash
# Check backend .env was created with production secrets
docker exec suna-bim-agent-backend-1 cat /app/.env | grep SUPABASE_URL

# Expected output:
# SUPABASE_URL="https://vplbjxijbrgwskgxiukd.supabase.co"

# Check backend logs for Supabase connection
docker logs suna-bim-agent-backend-1 | grep -i supabase

# Test backend health endpoint
curl http://localhost:8000/v1/health

# Expected output:
# {"status":"healthy"}

# Test frontend loads
curl -I http://localhost:3000

# Expected output:
# HTTP/1.1 200 OK
```

**Browser Verification**:
1. Open frontend in browser: `http://your-vm-host:3000`
2. Open DevTools → Network tab
3. Check Supabase API calls go to: `https://vplbjxijbrgwskgxiukd.supabase.co`
4. ✅ If correct: Production Supabase
5. ❌ If wrong URL: Rebuild frontend with correct env vars

## ⚠️ Common Issues

### Issue 1: Frontend connects to staging Supabase

**Symptoms**:
- Browser Network tab shows wrong Supabase URL
- Authentication errors in production
- Data appearing in staging database

**Root Cause**:
- Frontend build didn't receive `NEXT_PUBLIC_SUPABASE_URL` build arg

**Fix**:
```bash
# SSH to Azure VM
docker compose down
docker compose build --no-cache frontend
docker compose up -d
```

### Issue 2: Backend database connection fails

**Symptoms**:
- Backend logs show: `could not connect to server`
- Health endpoint returns 500

**Root Cause**:
- `DATABASE_URL` secret missing or incorrect in GitHub

**Fix**:
1. Verify GitHub Secret: `gh secret list | grep DATABASE_URL`
2. Update if needed: `gh secret set DATABASE_URL -b "..."`
3. Re-deploy: `git commit --allow-empty -m "trigger deploy" && git push`

### Issue 3: Empty environment variables in production

**Symptoms**:
- Backend .env has empty values: `SUPABASE_URL=""`
- Frontend fails to load

**Root Cause**:
- GitHub Secrets not configured before deployment

**Fix**:
1. Add all 5 required secrets to GitHub
2. Re-run deployment

## 🔒 Security Best Practices

### ✅ DO:
- Store all secrets in GitHub Secrets (never commit to git)
- Use service role key only in backend (never expose to frontend)
- Use anonymous key in frontend (public, rate-limited)
- Regenerate keys if accidentally exposed

### ❌ DON'T:
- Commit `.env` files with production secrets
- Use development credentials in production
- Expose service role key to browser/frontend
- Hardcode secrets in Dockerfiles or workflows

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ GitHub Repository                                               │
│ ┌─────────────────┐                                             │
│ │ GitHub Secrets  │ (Single Source of Truth)                    │
│ │ - DATABASE_URL  │                                             │
│ │ - SUPABASE_*    │                                             │
│ │ - ENCRYPTION_*  │                                             │
│ └────────┬────────┘                                             │
└──────────┼──────────────────────────────────────────────────────┘
           │
           │ Push to main/staging
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ GitHub Actions Workflow                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 1. SSH to Azure VM                                          │ │
│ │ 2. git reset --hard (destroys local .env)                   │ │
│ │ 3. Regenerate backend/.env from GitHub Secrets              │ │
│ │ 4. Export NEXT_PUBLIC_* for frontend build                  │ │
│ │ 5. pnpm install + pnpm build                                │ │
│ │ 6. docker compose up -d --force-recreate                    │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Azure VM - Docker Compose                                       │
│ ┌──────────────────────┐  ┌─────────────────────────────────┐  │
│ │ Backend Container    │  │ Frontend Container              │  │
│ │                      │  │                                 │  │
│ │ Mount:               │  │ Build Args (baked in):          │  │
│ │ ./backend/.env:      │  │ - NEXT_PUBLIC_SUPABASE_URL      │  │
│ │   /app/.env:ro       │  │ - NEXT_PUBLIC_SUPABASE_ANON_KEY │  │
│ │                      │  │                                 │  │
│ │ Runtime:             │  │ Runtime:                        │  │
│ │ load_dotenv()        │  │ Next.js server serves           │  │
│ │   ↓                  │  │ pre-built static files          │  │
│ │ Supabase client      │  │                                 │  │
│ │ (service_role_key)   │  │                                 │  │
│ └──────────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔍 Troubleshooting Checklist

- [ ] GitHub Secrets all configured (run `./scripts/verify-github-secrets.sh`)
- [ ] Workflow changes committed and pushed
- [ ] Deployment workflow completed successfully
- [ ] Backend .env file created with production values
- [ ] Frontend built with correct `NEXT_PUBLIC_*` env vars
- [ ] Backend health endpoint returns 200
- [ ] Frontend loads in browser
- [ ] Browser DevTools shows correct Supabase URL in Network tab
- [ ] Can authenticate users successfully
- [ ] Database queries work correctly

## 📚 Additional Resources

- [Supabase Database Connection Pooler](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Docker Compose Build Args](https://docs.docker.com/compose/compose-file/build/#args)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## 🎓 Key Learnings

1. **Backend vs Frontend Environment Variables**:
   - Backend: Runtime env vars (loaded via dotenv)
   - Frontend: Build-time env vars (baked into Next.js build)

2. **git reset --hard Behavior**:
   - Intentionally destroys local .env files
   - Forces secrets to come from GitHub (single source of truth)
   - Prevents config drift between local/production

3. **Docker Compose Build Args**:
   - Required for Next.js `NEXT_PUBLIC_*` variables
   - Must be exported before `docker compose build`
   - Cannot be injected at runtime (too late for Next.js)

4. **Supabase Connection Pooler**:
   - Use port 6543 (pooler) instead of 5432 (direct)
   - Avoids IPv6 connectivity issues
   - Better connection reliability in Docker/cloud environments
