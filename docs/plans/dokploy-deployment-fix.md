# Dokploy Deployment Fix Plan

## Problem Statement

Carbon BIM application deployments are failing on Dokploy due to Docker Swarm not being initialized on the server.

**Error:** `(HTTP code 503) unexpected - This node is not a swarm manager. Use "docker swarm init" or "docker swarm join" to connect this node to swarm and try again.`

**Affected Applications:**
- Frontend (Next.js) - Build succeeds but deployment fails
- Backend (FastAPI) - Build succeeds but deployment fails

**Root Cause:** Dokploy server at `20.55.21.69` is configured to use Docker Swarm orchestration, but Docker Swarm was never initialized.

---

## Success Criteria

1. Both frontend and backend applications deploy successfully
2. Applications are accessible via their configured domains
3. Health checks pass for both services
4. Deployment process is documented for future reference

---

## Task Breakdown

### Task 1: Investigate Dokploy Configuration Options
**Objective:** Determine if Dokploy can be configured to use standalone Docker instead of Swarm mode.

**Steps:**
1. Check Dokploy API for server configuration endpoints
2. Look for deployment mode settings (Swarm vs Compose)
3. Check if `replicas=0` truly disables Swarm mode or if there's another setting
4. Investigate if there's a server-level setting to change deployment mode

**Expected Output:**
- Documentation of available configuration options
- Decision on whether to pursue Swarm initialization or Compose mode

**Context:**
- Dokploy API endpoint: `http://20.55.21.69:3000/api/trpc`
- API Key: `lDSmcancqZOdeMwsSqILlSkcmhuWtdYFhbjQzoDLlelGObWecaJuVXaEweBLbNcD`
- Current setting: `replicas=0` for both apps (but Swarm still required)

---

### Task 2: Attempt Docker Compose Mode Configuration
**Objective:** Configure applications to use Docker Compose mode instead of Swarm.

**Steps:**
1. Check if Dokploy supports Docker Compose deployments
2. Look for `composeId` or similar fields in application configuration
3. Try to create or update applications with Compose deployment type
4. Test deployment after configuration change

**Expected Output:**
- Configuration changes applied (if possible)
- Deployment status after attempting Compose mode

**Context:**
- Current build types: Frontend=`dockerfile`, Backend=`nixpacks`
- Both have `composeId: null` in their configuration
- Dokploy documentation mentions "Docker Compose" as an alternative to "Stack"

---

### Task 3: Document SSH Access Requirements
**Objective:** If Swarm mode is required, document the SSH access process.

**Steps:**
1. Verify SSH key file exists and is valid
2. Document the SSH connection process
3. Create command reference for Docker Swarm initialization
4. Document verification steps after Swarm init

**Expected Output:**
- SSH connection guide
- Docker Swarm initialization commands
- Verification checklist

**Context:**
- SSH Key file: `/teamspace/studios/this_studio/suna-bim-agent/Dokploy id_rsa (1).txt`
- Server IP: `20.55.21.69`
- Key comment suggests user: `dokploy`
- Previous SSH attempts failed with "Permission denied (publickey)"

---

### Task 4: Verify Application Builds
**Objective:** Ensure application builds are working correctly before deployment.

**Steps:**
1. Verify frontend Dockerfile has NODE_OPTIONS fix
2. Check that all required environment variables are configured
3. Verify backend Nixpacks configuration
4. Confirm builds succeed in Dokploy build environment

**Expected Output:**
- Build status confirmation for both applications
- List of any build-time issues to address

**Context:**
- Frontend: Already has `NODE_OPTIONS="--max-old-space-size=4096"` fix
- Backend: Uses Nixpacks, Python/FastAPI
- Environment variables configured in Dokploy dashboard

---

### Task 5: Configure Health Checks and Monitoring
**Objective:** Set up health checks to verify application status after deployment.

**Steps:**
1. Configure health check endpoints for frontend
2. Configure health check endpoints for backend
3. Set up monitoring/alerting for deployment failures
4. Document troubleshooting steps

**Expected Output:**
- Health check configuration
- Monitoring setup
- Troubleshooting guide

**Context:**
- Backend has `/v1/health` endpoint available
- Frontend should respond on root path `/`
- Dokploy provides deployment status via API

---

## Implementation Order

1. **Task 1** → **Task 2** (investigate and attempt Compose mode)
2. If Compose mode fails → **Task 3** (document SSH requirements)
3. Parallel: **Task 4** (verify builds)
4. After successful deployment → **Task 5** (health checks)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SSH key not authorized | High | High | Contact server admin to add public key |
| Dokploy requires Swarm mode | Medium | High | Initialize Swarm via SSH |
| Build issues after deployment fix | Low | Medium | Verify builds in Task 4 |
| Configuration lost during changes | Low | High | Document current settings before changes |

---

## Notes

- The frontend build was previously succeeding with the NODE_OPTIONS fix
- Both applications have `replicas=0` set but Dokploy still requires Swarm
- The Dokploy dashboard is accessible at `http://20.55.21.69:3000`
- API documentation may be available at `http://20.55.21.69:3000/docs` or similar

---

## References

- Dokploy Documentation: https://docs.dokploy.com/
- Docker Swarm Docs: https://docs.docker.com/engine/swarm/
- Current API Key: `lDSmcancqZOdeMwsSqILlSkcmhuWtdYFhbjQzoDLlelGObWecaJuVXaEweBLbNcD`
- Frontend App ID: `DVlE_zkqJ7jTAVoOUend8`
- Backend App ID: `xBWL65quh1vYFixzgAuVy`
