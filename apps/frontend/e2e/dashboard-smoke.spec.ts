import { test, expect } from '@playwright/test';

// ─── Dashboard smoke tests ────────────────────────────────────────────────────
// These tests mock the auth session so they don't require a real login flow.

test.describe('Dashboard — smoke tests (mocked auth)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Supabase session endpoint so middleware thinks user is logged in
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-id',
          email: 'test@carbon-bim.com',
          role: 'authenticated',
          app_metadata: { provider: 'email' },
          user_metadata: {},
          aud: 'authenticated',
        }),
      });
    });

    // Mock Supabase token endpoint
    await page.route('**/auth/v1/token**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          token_type: 'bearer',
          expires_in: 3600,
          user: { id: 'test-user-id', email: 'test@carbon-bim.com' },
        }),
      });
    });

    // Mock backend health so page doesn't hang waiting for backend
    await page.route('**/v1/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' }),
      });
    });
  });

  test('no critical JS errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      // Ignore SES extension errors (from browser extensions like MetaMask)
      if (!err.message.includes('SES') && !err.message.includes('Removing unpermitted')) {
        errors.push(err.message);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no 404 errors on critical static assets', async ({ page }) => {
    const notFound: string[] = [];
    page.on('response', (response) => {
      if (response.status() === 404 && (
        response.url().includes('/fonts/') ||
        response.url().includes('/_next/static/') ||
        response.url().includes('/favicon')
      )) {
        notFound.push(response.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(notFound).toHaveLength(0);
  });

  test('font preload warning absent — no duplicate preload', async ({ page }) => {
    const consoleWarnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning' && msg.text().includes('preloaded using link preload but not used')) {
        consoleWarnings.push(msg.text());
      }
    });

    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    expect(consoleWarnings).toHaveLength(0);
  });
});
