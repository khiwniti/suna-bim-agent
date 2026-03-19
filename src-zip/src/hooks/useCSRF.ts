'use client';

/**
 * React Hook for CSRF-Protected Fetch
 *
 * ★ Insight ─────────────────────────────────────
 * This hook provides a drop-in replacement for fetch that
 * automatically includes CSRF tokens in state-changing requests.
 * It reads the token from the csrf-token cookie and includes
 * it in the X-CSRF-Token header.
 * ─────────────────────────────────────────────────
 */

import { useCallback, useEffect, useState } from 'react';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Get CSRF token from cookies
 */
function getCSRFToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find((c) =>
    c.trim().startsWith(`${CSRF_COOKIE_NAME}=`)
  );
  return csrfCookie?.split('=')[1]?.trim() || null;
}

/**
 * Hook that returns CSRF headers for use in fetch requests
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const csrfHeaders = useCSRFHeaders();
 *
 *   const handleSubmit = async () => {
 *     await fetch('/api/endpoint', {
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *         ...csrfHeaders,
 *       },
 *       body: JSON.stringify(data),
 *     });
 *   };
 * }
 * ```
 */
export function useCSRFHeaders(): Record<string, string> {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize synchronously to avoid flicker
    if (typeof document !== 'undefined') {
      return getCSRFToken();
    }
    return null;
  });

  useEffect(() => {
    // Check for token immediately on mount (in case it was set after initial render)
    const currentToken = getCSRFToken();
    if (currentToken && currentToken !== token) {
      setToken(currentToken);
    }

    // Re-check on visibility change (token might have been refreshed)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const refreshedToken = getCSRFToken();
        if (refreshedToken !== token) {
          setToken(refreshedToken);
        }
      }
    };

    // Also re-check periodically for the first few seconds (handles async token initialization)
    let attempts = 0;
    const maxAttempts = 10;
    const checkInterval = setInterval(() => {
      attempts++;
      const refreshedToken = getCSRFToken();
      if (refreshedToken && refreshedToken !== token) {
        setToken(refreshedToken);
        clearInterval(checkInterval);
      }
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
      }
    }, 200);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(checkInterval);
    };
  }, [token]);

  return token ? { [CSRF_HEADER_NAME]: token } : {};
}

/**
 * Hook that returns a CSRF-protected fetch function
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const csrfFetch = useCSRFFetch();
 *
 *   const handleSubmit = async () => {
 *     const response = await csrfFetch('/api/endpoint', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     });
 *   };
 * }
 * ```
 */
export function useCSRFFetch() {
  const csrfFetch = useCallback(
    async (
      url: string | URL | Request,
      options: RequestInit = {}
    ): Promise<Response> => {
      const method = options.method?.toUpperCase() || 'GET';

      // Only add CSRF header for state-changing methods
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        const headers = new Headers(options.headers);

        // Add CSRF token
        const token = getCSRFToken();
        if (token) {
          headers.set(CSRF_HEADER_NAME, token);
        }

        // Ensure JSON content type for non-FormData bodies
        if (options.body && !(options.body instanceof FormData)) {
          if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
          }
        }

        return fetch(url, {
          ...options,
          headers,
        });
      }

      return fetch(url, options);
    },
    []
  );

  return csrfFetch;
}

/**
 * Ensure CSRF token exists by making a request to initialize it
 * Call this once when the app loads
 */
export async function ensureCSRFToken(): Promise<void> {
  // The token will be set by any API response
  // We can make a lightweight request to /api/health to initialize it
  if (!getCSRFToken()) {
    try {
      await fetch('/api/health');
    } catch {
      // Ignore errors - token will be set on next successful request
    }
  }
}

export { getCSRFToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
