# Debug: Production Routes 404

**Issue ID:** production-routes-404
**Status:** RESOLVED
**Created:** 2026-03-18
**Resolved:** 2026-03-18

## Symptoms
- Production site at http://20.55.21.69:30/ has multiple 404 errors
- `/auth/login` returns 404 (but route is actually `/auth`)
- `/calculator` returns 404 (route doesn't exist - it's a component)
- `/api/health` returns 404
- `/v1/health` returns 404 (should proxy to backend)
- Only landing page (`/`) works

## Root Cause Analysis

### Primary Issue: WRONG PORT BEING USED

**The user was accessing port 30 directly, bypassing the nginx reverse proxy on port 80.**

#### Evidence:
1. **Port 30** = Direct Docker container access (Next.js only, NO backend proxy)
2. **Port 80** = Nginx reverse proxy with CORRECT routing configured

#### Nginx Configuration (on VM):
```nginx
server {
    listen 80;
    server_name carbon-bim.ensimu.space;

    location / {
        proxy_pass http://127.0.0.1:30;  # Frontend
    }

    location /v1/ {
        proxy_pass http://127.0.0.1:40/v1/;  # Backend API
    }
}
```

#### Port Verification:
| Port | Service | Purpose |
|------|---------|---------|
| 30 | Docker (Next.js) | Direct frontend access - NO API proxy |
| 40 | Docker (FastAPI) | Direct backend access |
| 80 | Nginx | **CORRECT entry point with routing** |

### Test Results:
```bash
# Port 80 (nginx) - WORKS
curl http://20.55.21.69:80/v1/health
# {"status":"ok","timestamp":"2026-03-18T15:50:25.340384+00:00","instance_id":"95351232"}

curl -w "%{http_code}" http://20.55.21.69:80/auth
# 200

curl -w "%{http_code}" http://20.55.21.69:80/dashboard
# 200

# Port 30 (direct) - FAILS for /v1/*
curl http://20.55.21.69:30/v1/health
# Returns Next.js 404 page (HTML)
```

### Secondary Issues (User Expectations):
1. **`/auth/login`** - Incorrect URL. Actual route is `/auth`
2. **`/calculator`** - Not a route! It's a component embedded in the dashboard

## Resolution

### Immediate Fix: Use Port 80 Instead of Port 30

**Correct URL:** `http://20.55.21.69:80/` (or just `http://20.55.21.69/`)

All routes work correctly through port 80:
- `/` - Landing page
- `/auth` - Authentication page
- `/dashboard` - Dashboard
- `/v1/health` - Backend API health check

### Why Port 30 Was Exposed
The `docker-compose.dokploy.yml` exposes ports 30 and 40 for debugging/direct access, but production traffic should go through nginx on port 80.

### Infrastructure Summary
```
Internet
    |
    v
[Azure NSG] --> Port 80 allowed (HTTP rule)
    |
    v
[nginx:80] --> Reverse proxy
    |
    +---> / --> localhost:30 (Next.js frontend)
    |
    +---> /v1/* --> localhost:40 (FastAPI backend)
```

## Verification Commands

```bash
# All containers running
docker ps
# suna-bim-agent-backend-1    Up (healthy)   0.0.0.0:40->8000/tcp
# suna-bim-agent-redis-1      Up (healthy)   6379/tcp
# suna-bim-agent-frontend-1   Up             0.0.0.0:30->3000/tcp

# Nginx running
systemctl status nginx
# Active: active (running)

# Backend health
curl http://localhost:40/v1/health
# {"status":"ok"...}
```

## Recommendations

1. **Update documentation** to use port 80 as the public URL
2. **Consider removing port 30/40 from NSG** to prevent confusion
3. **Add SSL/TLS** via Let's Encrypt for HTTPS on port 443
4. **Set up domain DNS** to point `carbon-bim.ensimu.space` to 20.55.21.69

## Timeline
- 2026-03-18 15:30: Issue reported
- 2026-03-18 15:45: Investigation started via Azure CLI
- 2026-03-18 15:50: Root cause identified (wrong port)
- 2026-03-18 15:51: Resolution confirmed - use port 80
