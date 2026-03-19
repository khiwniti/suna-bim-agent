#!/bin/bash
# ============================================================================
# GitHub Secrets Verification Script
# ============================================================================
# This script helps verify that all required GitHub Secrets are configured
# for production deployment.
#
# Usage:
#   ./scripts/verify-github-secrets.sh
#
# Requirements:
#   - GitHub CLI (gh) installed and authenticated
#   - Repository access with secrets:read permission
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Required secrets for deployment
REQUIRED_SECRETS=(
    "DATABASE_URL"
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "SUPABASE_ANON_KEY"
    "ENCRYPTION_KEY"
)

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}GitHub Secrets Verification${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo ""
    echo "Install instructions:"
    echo "  macOS:   brew install gh"
    echo "  Ubuntu:  sudo apt install gh"
    echo "  Windows: winget install GitHub.cli"
    echo ""
    echo "Then authenticate with: gh auth login"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
    echo ""
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✓ GitHub CLI authenticated${NC}"
echo ""

# Get list of configured secrets
echo "Fetching repository secrets..."
SECRET_LIST=$(gh secret list --json name -q '.[].name' 2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to fetch secrets${NC}"
    echo "Error: $SECRET_LIST"
    echo ""
    echo "Make sure you have 'secrets:read' permission for this repository"
    exit 1
fi

echo ""
echo -e "${BLUE}Checking required secrets:${NC}"
echo ""

MISSING_SECRETS=()
FOUND_SECRETS=()

# Check each required secret
for SECRET in "${REQUIRED_SECRETS[@]}"; do
    if echo "$SECRET_LIST" | grep -q "^${SECRET}$"; then
        echo -e "${GREEN}✓ ${SECRET}${NC}"
        FOUND_SECRETS+=("$SECRET")
    else
        echo -e "${RED}✗ ${SECRET} - MISSING${NC}"
        MISSING_SECRETS+=("$SECRET")
    fi
done

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

echo "Found: ${#FOUND_SECRETS[@]}/${#REQUIRED_SECRETS[@]} secrets"
echo ""

if [ ${#MISSING_SECRETS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All required secrets are configured!${NC}"
    echo ""
    echo "Your deployment is ready. The workflow will inject these secrets into:"
    echo "  - Backend: backend/.env (runtime)"
    echo "  - Frontend: Docker build args (build-time)"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Missing ${#MISSING_SECRETS[@]} required secret(s):${NC}"
    for SECRET in "${MISSING_SECRETS[@]}"; do
        echo "  - $SECRET"
    done
    echo ""
    echo -e "${YELLOW}Action Required:${NC}"
    echo "Add missing secrets to GitHub repository:"
    echo ""
    echo "1. Go to: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/settings/secrets/actions"
    echo "2. Click 'New repository secret'"
    echo "3. Add each missing secret with the correct value"
    echo ""
    echo -e "${YELLOW}Expected Values:${NC}"
    echo ""

    for SECRET in "${MISSING_SECRETS[@]}"; do
        case $SECRET in
            DATABASE_URL)
                echo "  ${SECRET}:"
                echo "    postgresql+psycopg://postgres.vplbjxijbrgwskgxiukd:sb_secret_hzFXV3SOTHtuo10uM2zJZw_tX3EFsx3@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
                echo ""
                ;;
            SUPABASE_URL)
                echo "  ${SECRET}:"
                echo "    https://vplbjxijbrgwskgxiukd.supabase.co"
                echo ""
                ;;
            SUPABASE_SERVICE_ROLE_KEY)
                echo "  ${SECRET}:"
                echo "    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGJqeGlqYnJnd3NrZ3hpdWtkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjcyNzYyNCwiZXhwIjoyMDg4MzAzNjI0fQ.8ii8WltJe8jX690CyeS2h_UcBYVptYMTK4X0ymDliPs"
                echo ""
                ;;
            SUPABASE_ANON_KEY)
                echo "  ${SECRET}:"
                echo "    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGJqeGlqYnJnd3NrZ3hpdWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mjc2MjQsImV4cCI6MjA4ODMwMzYyNH0.l35Qo5-A1yqi4xS044TLQc_WhT3-vwFZu7wOEwErMGU"
                echo ""
                ;;
            ENCRYPTION_KEY)
                echo "  ${SECRET}:"
                echo "    D1OsjL9VsBHW24ymsqd-qiRXJP6r8W026HvywVBvI_o="
                echo ""
                ;;
        esac
    done

    echo "After adding secrets, run this script again to verify."
    echo ""
    exit 1
fi
