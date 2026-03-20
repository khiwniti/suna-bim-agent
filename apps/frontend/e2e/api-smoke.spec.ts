import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000/v1';

// Skip all backend API tests if BACKEND_URL points to localhost and no backend is running.
// In CI without a backend sidecar, these tests are skipped gracefully.
const skipIfNoBackend = async () => {
  if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
    test.skip();
  }
};

test.describe('Backend API smoke tests', () => {
  test('GET /v1/health returns 200', async ({ request }) => {
    await skipIfNoBackend();
    const res = await request.get(`${BACKEND_URL}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status');
  });

  test('GET /bim/health returns 200 or 503 (degraded OK)', async ({ request }) => {
    await skipIfNoBackend();
    const res = await request.get(`${BACKEND_URL}/bim/health`);
    expect([200, 503]).toContain(res.status());
  });

  test('POST /api/auth/send-otp — never returns 404', async ({ request }) => {
    // This is the key regression test for the Traefik routing fix.
    // Before fix: Traefik intercepted /api/* → routed to FastAPI → 404
    // After fix:  /api/auth/* goes to Next.js correctly
    const res = await request.post('/api/auth/send-otp', {
      data: { email: 'smoke-test@carbon-bim.com' },
    });
    expect(res.status()).not.toBe(404);
    // 200 = OTP sent | 400 = invalid | 500 = Supabase config issue — all acceptable, 404 is NOT
    expect([200, 400, 500]).toContain(res.status());
  });

  test('POST /api/auth/send-otp — invalid email returns 400 with error', async ({ request }) => {
    const res = await request.post('/api/auth/send-otp', {
      data: { email: '' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error?.message).toBeTruthy();
  });

  test('GET /api/composio/triggers/schema/test-slug — returns non-404', async ({ request }) => {
    // Regression test: this route was missing, causing 404 for trigger config UI
    const res = await request.get('/api/composio/triggers/schema/test-slug');
    // Without backend: may be 502/500 (proxy fails) — that's OK. 404 means route still missing.
    expect(res.status()).not.toBe(404);
  });
});
