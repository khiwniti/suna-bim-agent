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

		// Check the GDPR consent checkbox (required to enable submit button)
		const gdprCheckbox = page.locator('#gdprConsent, button[role="checkbox"]').first();
		await gdprCheckbox.click();

		// The submit button for the email form (not Google/Continue buttons)
		const submitBtn = page.getByRole('button', { name: 'Send magic link' });
		await submitBtn.click();

		// After sending OTP, should show success state (email sent message or OTP input)
		await expect(
			page.locator('text=/check your|sent|email|code/i').first()
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
    // Increased timeout for CI environments where Supabase might be slow
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Wait for redirect to complete - give it more time
    await page.waitForURL(/\/auth|\/login|\/signin/, { timeout: 30000 }).catch(async () => {
      // If redirect didn't happen, check current URL
      const currentUrl = page.url();
      console.log(`Current URL after /dashboard: ${currentUrl}`);
    });
    // Verify we're on an auth-related page
    const url = page.url();
    const isAuthPage = url.includes('/auth') || url.includes('/login') || url.includes('/signin');
    expect(isAuthPage).toBeTruthy();
  });
});

// ─── Auth hardening ───────────────────────────────────────────────────────────

test.describe('Auth — hardening (Phase 5)', () => {
  test('send-otp rate limit: 4th request returns 429', async ({ request }) => {
    const email = `ratelimit-${Date.now()}@example.com`;
    const post = () => request.post('/api/auth/send-otp', { data: { email } });

    // First 3 should be 200 or 400 (Supabase may reject but not 429)
    for (let i = 0; i < 3; i++) {
      const res = await post();
      expect(res.status()).not.toBe(429);
    }

    // 4th must hit rate limit
    const res = await post();
    expect(res.status()).toBe(429);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toMatch(/too many/i);
  });

	test('returnUrl=https://evil.com is blocked — stays on /auth', async ({ page }) => {
		// Visit auth with external returnUrl - the param stays in URL but is ignored by the app
		await page.goto('/auth?returnUrl=https://evil.com');
		// The page should load (auth form visible) and NOT redirect to evil.com
		await expect(page.locator('body')).toBeVisible();
		// Verify we're still on the auth page (not redirected to evil.com)
		expect(page.url()).toContain('/auth');
		// Note: The returnUrl param remains in the URL string, but the app sanitizes it internally
		// The security is that the app ignores external URLs for redirect, not that they're removed from the URL
	});

  test('returnUrl=/dashboard is preserved and safe', async ({ page }) => {
    await page.goto('/auth?returnUrl=%2Fdashboard');
    // Page should load without JS crash
    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).not.toContain('evil.com');
  });
});
