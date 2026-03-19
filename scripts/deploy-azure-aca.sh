#!/usr/bin/env bash
# =============================================================================
# deploy-azure-aca.sh  —  Deploy Carbon BIM to Azure Container Apps
# =============================================================================
#
# Prerequisites:
#   1. az cli installed and logged in   (az login)
#   2. docker installed and running
#   3. backend/.env populated with required secrets
#
# Usage:
#   bash scripts/deploy-azure-aca.sh [OPTIONS]
#
# Options (all can also be set as env vars):
#   --resource-group  <name>   Resource group  (default: carbon-bim-rg)
#   --location        <name>   Azure region    (default: southeastasia)
#   --acr-name        <name>   ACR name        (default: auto-derived from subscription)
#   --env-name        <name>   ACA Env name    (default: carbon-bim-env)
#   --tag             <tag>    Image tag       (default: latest)
#   --update                   Update existing apps instead of create
#
# Examples:
#   # First deploy
#   bash scripts/deploy-azure-aca.sh
#
#   # Re-deploy with a new image tag
#   bash scripts/deploy-azure-aca.sh --tag v1.2.3 --update
#
#   # Override resource group and location
#   RESOURCE_GROUP=my-rg LOCATION=eastus bash scripts/deploy-azure-aca.sh
# =============================================================================

set -euo pipefail

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${BLUE}ℹ  $*${NC}"; }
success() { echo -e "${GREEN}✅ $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $*${NC}"; }
error()   { echo -e "${RED}❌ $*${NC}"; exit 1; }
header()  { echo -e "\n${BOLD}${BLUE}═══ $* ═══${NC}\n"; }

# ─── Defaults ────────────────────────────────────────────────────────────────
RESOURCE_GROUP="${RESOURCE_GROUP:-carbon-bim-rg}"
LOCATION="${LOCATION:-southeastasia}"
ENV_NAME="${ENV_NAME:-carbon-bim-env}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
UPDATE_MODE=false

# ─── Parse Args ──────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --resource-group) RESOURCE_GROUP="$2"; shift 2 ;;
    --location)       LOCATION="$2"; shift 2 ;;
    --acr-name)       ACR_NAME_OVERRIDE="$2"; shift 2 ;;
    --env-name)       ENV_NAME="$2"; shift 2 ;;
    --tag)            IMAGE_TAG="$2"; shift 2 ;;
    --update)         UPDATE_MODE=true; shift ;;
    *) error "Unknown option: $1" ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ─── Load backend/.env ───────────────────────────────────────────────────────
header "Loading Environment"
ENV_FILE="$REPO_ROOT/backend/.env"
[[ -f "$ENV_FILE" ]] || error "backend/.env not found. Run: cp backend/.env.example backend/.env and fill in secrets."

set -o allexport
# shellcheck disable=SC1090
source "$ENV_FILE"
set +o allexport
success "Secrets loaded from backend/.env"

# ─── Verify required secrets ─────────────────────────────────────────────────
REQUIRED_VARS=(SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY ENCRYPTION_KEY)
for v in "${REQUIRED_VARS[@]}"; do
  [[ -n "${!v:-}" ]] || error "Required variable $v is not set in backend/.env"
done

# ─── Verify az cli ───────────────────────────────────────────────────────────
command -v az &>/dev/null || error "Azure CLI not found. Install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
command -v docker &>/dev/null || error "Docker not found or not running."

SUBSCRIPTION_ID="$(az account show --query id -o tsv)"
SUBSCRIPTION_NAME="$(az account show --query name -o tsv)"
info "Azure Subscription: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)"

# ─── Derive ACR name (5-50 chars, alphanumeric only, globally unique) ─────────
if [[ -n "${ACR_NAME_OVERRIDE:-}" ]]; then
  ACR_NAME="$ACR_NAME_OVERRIDE"
else
  ACR_SUFFIX="${SUBSCRIPTION_ID//[-]/}"
  ACR_NAME="carbonbim${ACR_SUFFIX:0:12}"
fi
ACR_NAME="${ACR_NAME:0:30}"
info "ACR name: $ACR_NAME"

BACKEND_IMAGE="$ACR_NAME.azurecr.io/carbon-bim-backend:$IMAGE_TAG"
FRONTEND_IMAGE="$ACR_NAME.azurecr.io/carbon-bim-frontend:$IMAGE_TAG"

# ─── 1. Register Required Providers ─────────────────────────────────────────
header "Registering Azure Providers"
info "Registering providers (may take 1-3 min on first use)..."
for ns in Microsoft.ContainerRegistry Microsoft.App Microsoft.OperationalInsights; do
  state="$(az provider show --namespace "$ns" --query registrationState -o tsv 2>/dev/null || echo NotRegistered)"
  if [[ "$state" != "Registered" ]]; then
    info "Registering $ns..."
    az provider register --namespace "$ns" --output none
  else
    info "$ns already registered."
  fi
done
# Wait for all to reach Registered state (poll instead of --wait which can hang)
for ns in Microsoft.ContainerRegistry Microsoft.App Microsoft.OperationalInsights; do
  for i in $(seq 1 20); do
    state="$(az provider show --namespace "$ns" --query registrationState -o tsv 2>/dev/null)"
    [[ "$state" == "Registered" ]] && break
    info "  $ns: $state (attempt $i/20)..."
    sleep 10
  done
done
success "All providers registered."

# ─── 2. Resource Group ───────────────────────────────────────────────────────
header "Resource Group"
info "Creating resource group: $RESOURCE_GROUP in $LOCATION..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none
success "Resource group: $RESOURCE_GROUP"

# ─── 3. Azure Container Registry ─────────────────────────────────────────────
header "Azure Container Registry"
if az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  info "ACR $ACR_NAME already exists — skipping creation."
else
  info "Creating ACR: $ACR_NAME..."
  az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" \
    --sku Basic \
    --admin-enabled true \
    --output none
fi
success "ACR: $ACR_NAME"

ACR_LOGIN_SERVER="$ACR_NAME.azurecr.io"
ACR_USERNAME="$(az acr credential show --name "$ACR_NAME" --query username -o tsv)"
ACR_PASSWORD="$(az acr credential show --name "$ACR_NAME" --query 'passwords[0].value' -o tsv)"

info "Logging in to ACR..."
echo "$ACR_PASSWORD" | docker login "$ACR_LOGIN_SERVER" -u "$ACR_USERNAME" --password-stdin 2>/dev/null
success "Logged in to ACR"

# ─── 4. Build & Push Backend ─────────────────────────────────────────────────
header "Backend Image"
if [[ "$UPDATE_MODE" == "true" ]] && az acr repository show --name "$ACR_NAME" --image "carbon-bim-backend:$IMAGE_TAG" &>/dev/null; then
  info "Backend image already in ACR for tag $IMAGE_TAG — skipping build."
else
  info "Building backend image (linux/amd64)..."
  docker build \
    --platform linux/amd64 \
    -f "$REPO_ROOT/backend/Dockerfile" \
    -t "$BACKEND_IMAGE" \
    "$REPO_ROOT/backend"

  info "Pushing backend image → $BACKEND_IMAGE"
  docker push "$BACKEND_IMAGE"
fi
success "Backend image: $BACKEND_IMAGE"

# ─── 4. Container Apps Environment ───────────────────────────────────────────
header "Container Apps Environment"

info "Installing/updating containerapp extension..."
az extension add --name containerapp --upgrade --only-show-errors 2>/dev/null || true

# Idempotent: only create if it doesn't exist
if az containerapp env show --name "$ENV_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  info "Environment $ENV_NAME already exists — skipping creation."
else
  info "Creating Container Apps Environment: $ENV_NAME..."
  az containerapp env create \
    --name "$ENV_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none
fi
success "Environment: $ENV_NAME"

# Get the environment's default domain to predict app FQDNs
ENV_DEFAULT_DOMAIN="$(az containerapp env show \
  --name "$ENV_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query 'properties.defaultDomain' -o tsv)"
info "Environment default domain: $ENV_DEFAULT_DOMAIN"

EXPECTED_BACKEND_URL="https://carbon-bim-backend.${ENV_DEFAULT_DOMAIN}"
info "Predicted backend URL: $EXPECTED_BACKEND_URL"

# ─── 5. Build & Push Frontend (with backend URL baked in) ────────────────────
header "Frontend Image"
if [[ "$UPDATE_MODE" == "true" ]] && az acr repository show --name "$ACR_NAME" --image "carbon-bim-frontend:$IMAGE_TAG" &>/dev/null; then
  info "Frontend image already in ACR for tag $IMAGE_TAG — skipping build."
else
  info "Building frontend image with backend URL: $EXPECTED_BACKEND_URL"

  # Derive frontend URL (predicted, same pattern)
  EXPECTED_FRONTEND_URL="https://carbon-bim-frontend.${ENV_DEFAULT_DOMAIN}"

  docker build \
    --platform linux/amd64 \
    -f "$REPO_ROOT/apps/frontend/Dockerfile" \
    --build-arg NEXT_PUBLIC_ENV_MODE=production \
    --build-arg NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}" \
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}" \
    --build-arg NEXT_PUBLIC_BACKEND_URL="${EXPECTED_BACKEND_URL}/v1" \
    --build-arg NEXT_PUBLIC_URL="${EXPECTED_FRONTEND_URL}" \
    -t "$FRONTEND_IMAGE" \
    "$REPO_ROOT"

  info "Pushing frontend image → $FRONTEND_IMAGE"
  docker push "$FRONTEND_IMAGE"
fi
success "Frontend image: $FRONTEND_IMAGE"

# ─── Helper: create or update a container app ────────────────────────────────
aca_deploy() {
  local action="$1"; shift
  if [[ "$UPDATE_MODE" == "true" ]]; then
    local app_name
    # Extract --name value from remaining args
    local args=("$@")
    for i in "${!args[@]}"; do
      [[ "${args[$i]}" == "--name" ]] && app_name="${args[$((i+1))]}" && break
    done
    # Check if app exists
    if az containerapp show --name "$app_name" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
      info "Updating existing app: $app_name..."
      az containerapp update "$@" --output none
      return
    fi
  fi
  info "Creating app..."
  az containerapp create "$@" --output none
}


# ─── 6. Deploy Redis (internal TCP) ──────────────────────────────────────────
header "Redis"
if az containerapp show --name redis --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  info "Redis already deployed — skipping."
else
  info "Deploying Redis (internal, TCP port 6379)..."
  az containerapp create \
    --name redis \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENV_NAME" \
    --image redis:7-alpine \
    --ingress internal \
    --target-port 6379 \
    --transport tcp \
    --min-replicas 1 \
    --max-replicas 1 \
    --cpu 0.25 \
    --memory 0.5Gi \
    --output none
fi
success "Redis deployed (internal)"

# ─── 7. Deploy Backend ───────────────────────────────────────────────────────
header "Backend"
if [[ "$UPDATE_MODE" == "true" ]] && az containerapp show --name carbon-bim-backend --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  info "Updating existing backend image..."
  az containerapp update \
    --name carbon-bim-backend \
    --resource-group "$RESOURCE_GROUP" \
    --image "$BACKEND_IMAGE" \
    --output none
else
  info "Creating backend container app..."
  az containerapp create \
    --name carbon-bim-backend \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENV_NAME" \
    --image "$BACKEND_IMAGE" \
    --registry-server "$ACR_LOGIN_SERVER" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD" \
    --ingress external \
    --target-port 8000 \
    --transport http \
    --min-replicas 1 \
    --max-replicas 3 \
    --cpu 1.0 \
    --memory 2.0Gi \
    --env-vars \
      "SUPABASE_URL=${SUPABASE_URL}" \
      "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}" \
      "SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}" \
      "SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET:-}" \
      "DATABASE_URL=${DATABASE_URL:-}" \
      "ENCRYPTION_KEY=${ENCRYPTION_KEY}" \
      "MCP_CREDENTIAL_ENCRYPTION_KEY=${MCP_CREDENTIAL_ENCRYPTION_KEY:-}" \
      "ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}" \
      "OPENAI_API_KEY=${OPENAI_API_KEY:-}" \
      "GH_MODELS_TOKEN=${GH_MODELS_TOKEN:-}" \
      "TAVILY_API_KEY=${TAVILY_API_KEY:-}" \
      "FIRECRAWL_API_KEY=${FIRECRAWL_API_KEY:-}" \
      "REDIS_HOST=redis" \
      "REDIS_PORT=6379" \
      "REDIS_SSL=False" \
      "ENV_MODE=production" \
      "BIM_CARBON_DATABASE_PATH=/data/carbon_factors.json" \
      "BIM_THAI_CODES_PATH=/data/thai_building_codes.json" \
      "BIM_MAX_FILE_SIZE_MB=500" \
    --output none
fi

BACKEND_FQDN="$(az containerapp show \
  --name carbon-bim-backend \
  --resource-group "$RESOURCE_GROUP" \
  --query 'properties.configuration.ingress.fqdn' -o tsv)"
BACKEND_URL="https://${BACKEND_FQDN}"
success "Backend deployed at: $BACKEND_URL"

if [[ "$BACKEND_URL" != "$EXPECTED_BACKEND_URL" ]]; then
  warn "Actual backend URL ($BACKEND_URL) differs from predicted ($EXPECTED_BACKEND_URL)."
  warn "The frontend image was built with the predicted URL. Rebuild without --update if needed."
fi

# ─── 8. Deploy Frontend ───────────────────────────────────────────────────────
header "Frontend"
if [[ "$UPDATE_MODE" == "true" ]] && az containerapp show --name carbon-bim-frontend --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  info "Updating existing frontend image..."
  az containerapp update \
    --name carbon-bim-frontend \
    --resource-group "$RESOURCE_GROUP" \
    --image "$FRONTEND_IMAGE" \
    --output none
else
  info "Creating frontend container app..."
  az containerapp create \
    --name carbon-bim-frontend \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENV_NAME" \
    --image "$FRONTEND_IMAGE" \
    --registry-server "$ACR_LOGIN_SERVER" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD" \
    --ingress external \
    --target-port 3000 \
    --transport http \
    --min-replicas 1 \
    --max-replicas 3 \
    --cpu 0.5 \
    --memory 1.0Gi \
    --output none
fi

FRONTEND_FQDN="$(az containerapp show \
  --name carbon-bim-frontend \
  --resource-group "$RESOURCE_GROUP" \
  --query 'properties.configuration.ingress.fqdn' -o tsv)"
FRONTEND_URL="https://${FRONTEND_FQDN}"
success "Frontend deployed at: $FRONTEND_URL"

# ─── 9. Health Check ─────────────────────────────────────────────────────────
header "Health Check"
info "Waiting 30s for containers to start..."
sleep 30

info "Checking backend health..."
if curl -sf --max-time 15 "${BACKEND_URL}/v1/health" &>/dev/null; then
  success "Backend health: OK"
else
  warn "Backend health check failed — container may still be starting. Check logs with:"
  echo "  az containerapp logs show --name carbon-bim-backend --resource-group $RESOURCE_GROUP --follow"
fi

info "Checking frontend..."
if curl -sf --max-time 15 -I "${FRONTEND_URL}" &>/dev/null; then
  success "Frontend: OK"
else
  warn "Frontend check failed — may still be starting. Check logs with:"
  echo "  az containerapp logs show --name carbon-bim-frontend --resource-group $RESOURCE_GROUP --follow"
fi

# ─── Summary ─────────────────────────────────────────────────────────────────
header "Deployment Complete"
echo -e "${GREEN}${BOLD}"
echo "  ┌──────────────────────────────────────────────────────────────────────┐"
echo "  │  Carbon BIM — Azure Container Apps                                   │"
echo "  ├──────────────────────────────────────────────────────────────────────┤"
printf "  │  %-20s %s\n" "Frontend:" "${FRONTEND_URL}  │"
printf "  │  %-20s %s\n" "Backend API:" "${BACKEND_URL}/v1  │"
printf "  │  %-20s %s\n" "Backend Health:" "${BACKEND_URL}/v1/health  │"
printf "  │  %-20s %s\n" "Resource Group:" "${RESOURCE_GROUP}  │"
printf "  │  %-20s %s\n" "ACR:" "${ACR_LOGIN_SERVER}  │"
echo "  └──────────────────────────────────────────────────────────────────────┘"
echo -e "${NC}"

echo "Useful commands:"
echo "  # View live logs"
echo "  az containerapp logs show --name carbon-bim-backend   --resource-group $RESOURCE_GROUP --follow"
echo "  az containerapp logs show --name carbon-bim-frontend  --resource-group $RESOURCE_GROUP --follow"
echo "  az containerapp logs show --name redis                --resource-group $RESOURCE_GROUP --follow"
echo ""
echo "  # Scale backend replicas"
echo "  az containerapp update --name carbon-bim-backend --resource-group $RESOURCE_GROUP --min-replicas 2 --max-replicas 5"
echo ""
echo "  # Re-deploy with new images"
echo "  bash scripts/deploy-azure-aca.sh --update --tag <new-tag>"
echo ""
echo "  # Tear down everything"
echo "  az group delete --name $RESOURCE_GROUP --yes --no-wait"
