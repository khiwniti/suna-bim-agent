/**
 * CSRF Protection using Double Submit Cookie Pattern
 *
 * ★ Insight ─────────────────────────────────────
 * The Double Submit Cookie pattern works by:
 * 1. Setting a random CSRF token in a cookie (HttpOnly=false so JS can read)
 * 2. Requiring the same token in a custom header (X-CSRF-Token)
 * 3. Validating both match on state-changing requests (POST, PUT, DELETE, PATCH)
 *
 * This works because:
 * - Attackers can't read cookies from other domains (Same-Origin Policy)
 * - Attackers can't set custom headers in cross-origin requests without CORS
 * ─────────────────────────────────────────────────
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create CSRF token
 * Call this in GET requests to ensure token exists
 */
export async function getOrCreateCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (existingToken) {
    return existingToken;
  }

  const newToken = generateToken();
  cookieStore.set(CSRF_COOKIE_NAME, newToken, {
    httpOnly: false, // Must be readable by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return newToken;
}

/**
 * Validate CSRF token from request
 * Returns error response if invalid, null if valid
 */
export async function validateCSRFToken(
  request: NextRequest
): Promise<NextResponse | null> {
  // Only validate for state-changing methods
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return null; // No validation needed for GET, HEAD, OPTIONS
  }

  // Skip validation for specific safe endpoints
  const pathname = request.nextUrl.pathname;
  const skipPaths = [
    '/api/auth/callback', // OAuth callbacks
    '/api/health', // Health checks
    '/api/mcp/health', // MCP health checks
  ];

  if (skipPaths.some((path) => pathname.startsWith(path))) {
    return null;
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // Validate tokens exist and match
  if (!cookieToken || !headerToken) {
    return NextResponse.json(
      {
        error: 'CSRF validation failed',
        message: 'Missing CSRF token. Please refresh the page and try again.',
      },
      { status: 403 }
    );
  }

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(cookieToken, headerToken)) {
    return NextResponse.json(
      {
        error: 'CSRF validation failed',
        message: 'Invalid CSRF token. Please refresh the page and try again.',
      },
      { status: 403 }
    );
  }

  return null; // Valid
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks by always taking the same time regardless of where strings differ
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Helper to set CSRF token in response
 * Use this when sending responses that need a fresh token
 */
export function setCSRFTokenInResponse(
  response: NextResponse,
  token?: string
): NextResponse {
  const csrfToken = token || generateToken();
  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  return response;
}

/**
 * React hook helper - returns fetch options with CSRF token
 * Use in client components to make authenticated requests
 *
 * Usage:
 * ```tsx
 * const response = await fetch('/api/endpoint', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     ...getCSRFHeaders(),
 *   },
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export function getCSRFHeadersClient(): Record<string, string> {
  if (typeof document === 'undefined') {
    return {};
  }

  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find((c) => c.trim().startsWith(`${CSRF_COOKIE_NAME}=`));
  const token = csrfCookie?.split('=')[1]?.trim();

  return token ? { [CSRF_HEADER_NAME]: token } : {};
}

// Export constants for use in client code
export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
