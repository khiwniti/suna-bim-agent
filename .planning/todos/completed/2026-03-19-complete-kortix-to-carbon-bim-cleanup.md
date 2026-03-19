---
created: 2026-03-19T09:06:36.647Z
title: Complete kortix to Carbon BIM cleanup
area: general
files:
  - .github/workflows/e2e-api-tests.yml
  - .github/workflows/e2e-benchmark.yml
  - .github/workflows/mobile-eas-update.yml
  - apps/frontend/src/app/layout.tsx
  - backend/docker-compose.yml
  - apps/frontend/src/components/thread/kortix-computer/
---

## Problem

620+ "kortix" references remain in the codebase after the initial migration. Critical files still reference kortix-ai API URLs and kortix.com domains.

## Solution

Replace remaining references:

### Critical - GitHub Workflows
- `.github/workflows/e2e-api-tests.yml` - replace kortix-ai API URLs
- `.github/workflows/e2e-benchmark*.yml` - replace kortix-ai API URLs  
- `.github/workflows/mobile-eas-update.yml` - replace kortix-ai backend references

### Critical - Frontend Metadata
- `apps/frontend/src/app/layout.tsx` - og:url, og:image, twitter links to kortix.com

### Optional
- `backend/docker-compose.yml` - commented line with kortix image
- Consider renaming `kortix-computer/` directory to `bim-computer/`
- Clean up `copilot-session-*.md` files
