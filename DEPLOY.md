# Deploying Suna BIM Agent with Dokploy

Dokploy is a self-hosted PaaS built on Docker Compose + Traefik. This guide walks you through deploying the full Suna BIM Agent stack (Frontend, Backend, Redis) to a Dokploy server.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Dokploy server | VPS with ≥ 2 CPU, 4 GB RAM (8 GB recommended for IFC processing) |
| Docker ≥ 24 | Installed by the Dokploy installer |
| Domain name | DNS A record pointing to your server IP |
| Supabase project | Cloud-hosted; get credentials from the Supabase dashboard |
| API keys | Anthropic and/or OpenAI (see `.env.dokploy`) |

---

## 1. Install Dokploy

SSH into your server and run the official installer:

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

Open `http://<server-ip>:3000` and complete the initial setup wizard (admin account, domain).

---

## 2. Connect Your GitHub Repository

1. In the Dokploy dashboard, go to **Projects → New Project**.
2. Choose **Docker Compose** as the deployment type.
3. Connect your GitHub account and select the `autonomous-bim-agent` repository.
4. Set the **Compose File Path** to:
   ```
   suna/docker-compose.dokploy.yml
   ```
5. Set the **Build Context** (working directory) to:
   ```
   suna/
   ```

---

## 3. Configure Environment Variables

In the Dokploy project settings, open **Environment Variables** and paste in each value from `.env.dokploy`.

### Getting the Supabase JWT Secret

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Project Settings → API**.
3. Scroll to **JWT Settings** — copy the **JWT Secret** field.
4. Paste it as `SUPABASE_JWT_SECRET` in Dokploy.

### Minimum required variables before first deploy

| Variable | Where to get it |
|---|---|
| `SUPABASE_JWT_SECRET` | Supabase Dashboard → Project Settings → API → JWT Settings |
| `ANTHROPIC_API_KEY` | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `NEXT_PUBLIC_BACKEND_URL` | `https://<your-domain>/api/v1` |
| `NEXT_PUBLIC_URL` | `https://<your-domain>` |

All other variables have safe defaults pre-filled in `.env.dokploy`.

---

## 4. Set Up Reverse Proxy (Traefik Labels)

Dokploy runs Traefik automatically. To route your domain to the correct services, add Traefik labels to each service in `docker-compose.dokploy.yml`, or configure them in the Dokploy **Domains** tab:

| Service | Path prefix | Target port |
|---|---|---|
| `frontend` | `/` (catch-all) | 3000 |
| `backend` | `/api/v1` | 8000 |

In the Dokploy dashboard → your project → **Domains**:
- Add `suna-bim.yourdomain.com` → service `frontend`, port `3000`
- Add `suna-bim.yourdomain.com/api` → service `backend`, port `8000` (path strip `/api`)

Dokploy will automatically provision a Let's Encrypt TLS certificate.

---

## 5. Deploy

Click **Deploy** in the Dokploy dashboard, or push to your configured branch (e.g. `main`). Dokploy will:

1. Pull the latest code from GitHub.
2. Build Docker images (`docker compose build`).
3. Start services in dependency order: `redis` → `backend` → `frontend`.
4. Run healthchecks — the backend must pass `GET /health` before the frontend starts.

Monitor progress in **Deployments → Logs**.

---

## 6. Verify the Deployment

```bash
# Backend health
curl https://suna-bim.yourdomain.com/api/v1/health

# Frontend
curl -I https://suna-bim.yourdomain.com
```

---

## Makefile Quick Reference

These targets work for both local validation and CI:

```bash
make dokploy-setup   # Copy .env.dokploy → .env for local testing
make dokploy-build   # Build production images locally
make dokploy-up      # Start the production stack locally
make dokploy-down    # Stop the production stack
make dokploy-logs    # Tail all service logs
```

---

## Deploy via Dokploy CLI (Alternative)

If you prefer automating deployment from your terminal instead of using the dashboard, use the [`@dokploy/cli`](https://www.npmjs.com/package/@dokploy/cli).

### 1. Install the CLI

```bash
make dokploy-cli-install
# or: npm install -g @dokploy/cli
```

### 2. Set your server URL and token

Edit `.env.dokploy` and fill in `DOKPLOY_SERVER_URL`:

```bash
DOKPLOY_SERVER_URL=https://your-panel-domain.com   # ← your Dokploy panel URL
DOKPLOY_TOKEN=aDYMjp...  # already set
```

Then load them into your shell:

```bash
export $(grep -v '^#' .env.dokploy | xargs)
```

### 3. Authenticate

```bash
make dokploy-cli-auth
# or: dokploy authenticate --url="$DOKPLOY_SERVER_URL" --token="$DOKPLOY_TOKEN"
```

### 4. Find your Application ID

```bash
make dokploy-cli-projects    # list projects and app IDs
# or: dokploy app list
```

Copy the `applicationId` from the output.

### 5. Push environment variables

```bash
make dokploy-cli-env-push APP_ID=<applicationId>
```

### 6. Deploy

```bash
make dokploy-cli-deploy APP_ID=<applicationId>
```

The CLI will trigger a new deployment and stream the progress. Your app will be live at `NEXT_PUBLIC_URL` once the healthcheck passes.

---

## BIM-Specific Notes

### IFC File Storage

The backend processes IFC files in-memory by default. For persistent storage across deployments, mount a volume:

```yaml
# Add to the backend service in docker-compose.dokploy.yml
volumes:
  - ifc_storage:/app/ifc_storage
```

And add the named volume at the top level:

```yaml
volumes:
  ifc_storage:
    driver: local
```

### Carbon & Building Code Data

The backend expects JSON databases at:

- `/data/carbon_factors.json` — Thai emission factors (TGO/TREES)
- `/data/thai_building_codes.json` — Thai building code reference

These paths are controlled by `BIM_CARBON_DATABASE_PATH` and `BIM_THAI_CODES_PATH`. If you need to supply custom data files, mount them via a Docker volume or bake them into the backend Docker image.

### File Upload Size

Default maximum IFC upload is 500 MB (`BIM_MAX_FILE_SIZE_MB=500`). Increase this env var and ensure your reverse proxy (Traefik) also allows large bodies:

```yaml
# Traefik middleware — add to your dynamic config or via Dokploy labels
traefik.http.middlewares.upload-limit.buffering.maxRequestBodyBytes: 524288000
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Backend container exits immediately | Check `SUPABASE_JWT_SECRET` and `ANTHROPIC_API_KEY` are set |
| Frontend shows "Cannot connect to backend" | Verify `NEXT_PUBLIC_BACKEND_URL` matches your actual domain + `/api/v1` |
| Redis connection refused | Confirm `REDIS_HOST=redis` (the Docker service name, not `localhost`) |
| IFC upload fails with 413 | Increase `BIM_MAX_FILE_SIZE_MB` and Traefik body size limit |
| TLS certificate not issued | Ensure DNS A record is live and port 80/443 are open on the server firewall |
