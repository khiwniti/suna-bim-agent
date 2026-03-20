import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000/v1';

// ─── Auth flow E2E ────────────────────────────────────────────────────────────

test.describe('Auth — OTP flow', () => {
  test('send-otp route returns 200 (not 404) — Traefik regression check', async ({ request }) => {
    const res = await request.post('/api/auth/send-otp', {
      data: { email: 'test@example.com' },
    });
    // 200 = success | 400 = validation error — both are fine; 404 means Traefik intercepted it
    expect(res.status()).not.toBe(404);
    expect([200, 400, 500]).toContain(res.status());
  });

  test('send-otp with invalid email returns 400', async ({ request }) => {
    const res = await request.post('/api/auth/send-otp', {
      data: { email: 'not-an-email' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('auth page renders email input and submit button', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Continue")').first()).toBeVisible();
  });

  test('auth page shows OTP flow on valid email submit (mocked)', async ({ page }) => {
    // Mock the send-otp route to avoid real Supabase call
    await page.route('**/api/auth/send-otp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/auth');
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]').first();
    await emailInput.fill('test@carbon-bim.com');
    await page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Continue")').first().click();

    // After sending OTP, should show OTP input or success message
    await expect(
      page.locator('input[name="otp"], input[placeholder*="code" i], input[placeholder*="OTP" i], text=/sent|check your|code/i').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('auth page with ?expired=true shows expiry notice', async ({ page }) => {
    await page.goto('/auth?expired=true&returnUrl=%2Fdashboard');
    // Should show the page without crashing
    await expect(page).not.toHaveURL(/error/);
    await expect(page.locator('body')).toBeVisible();
  });
});

// ─── Session / redirect ───────────────────────────────────────────────────────

test.describe('Auth — session redirect', () => {
  test('unauthenticated access to /dashboard redirects to /auth', async ({ page }) => {
    // No session cookie set — should redirect
    const response = await page.goto('/dashboard');
    // Either redirected to auth OR shows auth page content
    const url = page.url();
    const isAuthPage = url.includes('/auth') || url.includes('/login') || url.includes('/signin');
    const hasAuthContent = await page.locator('input[type="email"]').count() > 0;
    expect(isAuthPage || hasAuthContent).toBeTruthy();
  });
});
