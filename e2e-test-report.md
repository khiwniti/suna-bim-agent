# E2E Test Report — Carbon BIM

**Date:** 2026-03-20
**Environment:** Local development (localhost:3000)
**Backend Status:** Not running (expected for frontend-only E2E)

---

## Summary

| Metric | Value |
|--------|-------|
| **Journeys Tested** | 4 |
| **Screenshots Captured** | 7 |
| **Issues Found** | 4 runtime + 5 code analysis |
| **Test Duration** | ~15 minutes |

---

## Test Results

### Journey 1: Landing Page Hero Section & Navigation

**Status:** ✅ Passed

**Steps Executed:**
1. Navigated to `http://localhost:3000`
2. Verified page loads without critical JS errors
3. Clicked "Calculate embodied carbon for my building" suggestion button
4. Confirmed navigation to `/auth` page

**Findings:**
- Landing page renders correctly
- Hero chat input and suggestion buttons functional
- Navigation to auth works as expected

**Screenshots:**
- `e2e-screenshots/00-initial-load.png`

---

### Journey 2: Auth Flow — Magic Link Sign Up

**Status:** ⚠️ Partial (backend required)

**Steps Executed:**
1. Navigated to `/auth` (via landing page)
2. Filled email input: `test-e2e@example.com`
3. Checked GDPR consent checkbox
4. Verified "Send magic link" button becomes enabled
5. Clicked submit button

**Findings:**
- Email input accepts valid email
- GDPR checkbox enables submit button correctly
- Cannot complete full flow without backend (Supabase)
- Button shows disabled state during submission

**Screenshots:**
- `e2e-screenshots/01-auth-page.png`
- `e2e-screenshots/02-after-magic-link.png`

**Console Output:**
```
[error] Failed to load resource: net::ERR_CONNECTION_REFUSED
[warning] Failed to fetch system status: TypeError: Failed to fetch
```

---

### Journey 3: Pricing Page & Plan Selection

**Status:** ⚠️ Issues Found

**Steps Executed:**
1. Navigated to `/pricing`
2. Verified page structure
3. Checked for console errors

**Findings:**
- Pricing cards and CTAs render
- React hydration error detected (error #418)
- Multiple font preload warnings

**Screenshots:**
- `e2e-screenshots/03-pricing-page.png`

**Issues:**
- **React Hydration Error:** Minified React error #418 — likely caused by language selector rendering different content on server vs client
- **Font Preload Warnings:** CSS files preloaded but not used (known issue from Phase 04)

---

### Journey 4: Responsive Design Testing

**Status:** ✅ Passed

**Viewports Tested:**
| Viewport | Dimensions | Status |
|----------|------------|--------|
| Mobile | 375 × 812 | ✅ Rendered |
| Tablet | 768 × 1024 | ✅ Rendered |
| Desktop | 1440 × 900 | ✅ Rendered |

**Findings:**
- Responsive layouts working correctly
- No console errors specific to viewport changes
- Hydration error persists across all viewports

**Screenshots:**
- `e2e-screenshots/04-mobile-landing.png`
- `e2e-screenshots/05-tablet-landing.png`
- `e2e-screenshots/06-desktop-landing.png`

---

## Issues Found

### Runtime Issues (E2E Testing)

#### Issue 1: React Hydration Error #418
- **Severity:** Medium
- **Location:** Landing page, Pricing page
- **Description:** Minified React error #418 indicates hydration mismatch between server and client rendering
- **Likely Cause:** Language selector component rendering different content on server vs client
- **Status:** Unresolved
- **Recommendation:** Investigate `next-intl` locale detection and ensure consistent rendering

#### Issue 2: Font Preload Warnings
- **Severity:** Low
- **Location:** All pages
- **Description:** CSS files preloaded using `<link rel="preload">` but not used within threshold
- **Files Affected:**
  - `/_next/static/css/8ed7fd7f0bc9cf18.css`
  - `/_next/static/css/911e6a603adbdfb3.css`
- **Status:** Known (tracked in Phase 04 E2E tests)
- **Recommendation:** Review font preload strategy in `_document.tsx` or layout

#### Issue 3: Backend Connection Refused
- **Severity:** N/A (Expected)
- **Description:** Backend not running during E2E test
- **Impact:** Auth flow cannot complete, system status fetch fails
- **Recommendation:** For full E2E, start backend with `uv run api.py`

#### Issue 4: System Status Fetch Failure
- **Severity:** N/A (Expected)
- **Description:** `Failed to fetch system status` due to missing backend
- **Impact:** Status indicator not displayed
- **Recommendation:** Add graceful fallback UI for status fetch failures

---

### Code Analysis Issues (Bug Hunt)

#### Issue 5: IndexError on Empty Supabase Query Results
- **Severity:** Critical
- **Location:**
  - `backend/core/utils/suna_default_agent_service.py:87`
  - `backend/core/utils/auth_utils.py:354`
  - `backend/core/tools/agent_creation_tool.py:502,914,1458`
  - `backend/core/tools/sb_kb_tool.py:597,960,992,1078,1094`
- **Description:** Direct array indexing `result.data[0]` without null/empty checks
- **Impact:** 500 errors if query returns empty
- **Fix Required:** Add validation before array access
  ```python
  if not result.data:
      raise HTTPException(status_code=404, detail="Resource not found")
  data = result.data[0]
  ```

#### Issue 6: Missing Cascade Deletes — Orphaned Records Risk
- **Severity:** High
- **Location:** `backend/core/threads/api.py:366-380`
- **Description:** Sequential delete operations without transaction
- **Impact:** If mid-operation fails, orphaned records remain
- **Fix Required:** Use database transactions or ON DELETE CASCADE constraints

#### Issue 7: Open Redirect Vulnerability
- **Severity:** High
- **Location:** `apps/frontend/src/app/auth/page.tsx:47-49`
- **Description:** Current check `returnUrlRaw.startsWith('/')` can be bypassed with `//evil.com`
- **Impact:** Phishing/redirect attacks
- **Fix Required:**
  ```typescript
  const returnUrl = returnUrlRaw && /^\/[^/]/.test(returnUrlRaw) ? returnUrlRaw : null;
  ```

#### Issue 8: XSS via dangerouslySetInnerHTML
- **Severity:** High
- **Location:**
  - `apps/frontend/src/components/ui/mermaid-renderer.tsx:611,715`
  - `apps/frontend/src/components/thread/tool-views/apify-tool/ToolView.tsx:577,692`
  - `apps/frontend/src/components/thread/content/ShowToolStream.tsx:955,968,977,984`
- **Description:** User/external content rendered without sanitization
- **Impact:** XSS attacks if malicious content injected
- **Fix Required:** Use DOMPurify or similar sanitization library

#### Issue 9: Silent Exception Swallowing
- **Severity:** Medium
- **Location:**
  - `apps/frontend/src/app/layout.tsx:144`
  - `apps/frontend/src/components/thread/ThreadComponent.tsx:206`
- **Description:** Empty catch blocks `catch (e) {}` hide errors
- **Impact:** Debugging impossible, real errors hidden from E2E tests
- **Fix Required:** Log errors or rethrow

---

## Screenshots Inventory

| File | Description | Viewport |
|------|-------------|----------|
| `00-initial-load.png` | Landing page initial state | Desktop |
| `01-auth-page.png` | Auth page after clicking suggestion | Desktop |
| `02-after-magic-link.png` | Auth after sending magic link | Desktop |
| `03-pricing-page.png` | Pricing page | Desktop |
| `04-mobile-landing.png` | Landing page | Mobile (375×812) |
| `05-tablet-landing.png` | Landing page | Tablet (768×1024) |
| `06-desktop-landing.png` | Landing page | Desktop (1440×900) |

---

## Recommendations

### Immediate Actions (P0)
1. Add null/empty checks before `result.data[0]` array access across all backend files
2. Implement database transactions for cascade delete operations
3. Fix open redirect vulnerability with proper URL validation

### Short-term Actions (P1)
4. Sanitize all HTML content before using with `dangerouslySetInnerHTML`
5. Replace empty catch blocks with proper error logging
6. Investigate and fix React hydration error on landing/pricing pages

### Long-term Actions (P2)
7. Review font preload strategy to eliminate warnings
8. Add graceful fallback UI for system status fetch failures
9. Implement proper loading states in auth flows

---

## Test Environment

```
Platform: Linux
Frontend: http://localhost:3000 (Next.js 15)
Backend: Not running
Playwright: Chromium
agent-browser: v0.15.1
```

---

## Appendix: Database Schema Reference

Key tables verified for E2E testing:

| Table | Purpose |
|-------|---------|
| `auth.users` | Supabase authentication |
| `basejump.accounts` | Multi-tenant accounts |
| `threads` | Conversation threads |
| `messages` | Thread messages |
| `agents` | Agent configurations |
| `credit_accounts` | User credit balances |

---

*Report generated by E2E Test Workflow*
