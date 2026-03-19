/**
 * API Client for BIM Agent
 *
 * Routes API requests to the appropriate backend:
 * - Local development: Uses Next.js API routes
 * - Cloudflare Pages: Proxies to Vercel API backend
 */

// API base URL - uses Vercel backend when on Cloudflare Pages
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Enhanced fetch with timeout and error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// API methods
export const api = {
  // Health check
  health: () => apiFetch<{ status: string }>('/api/health'),

  // Chat
  chat: (message: string, sessionId?: string) =>
    apiFetch<{ response: string }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    }),

  // Projects
  projects: {
    list: () => apiFetch<{ projects: unknown[] }>('/api/projects'),
    get: (id: string) => apiFetch<{ project: unknown }>(`/api/projects/${id}`),
    create: (data: unknown) =>
      apiFetch<{ project: unknown }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Models
  models: {
    list: () => apiFetch<{ models: unknown[] }>('/api/models'),
    upload: (formData: FormData) =>
      fetch(`${API_BASE_URL}/api/models/upload`, {
        method: 'POST',
        body: formData,
      }).then((res) => res.json()),
  },

  // Floor Plan Analysis
  floorPlan: {
    analyze: (formData: FormData) =>
      fetch(`${API_BASE_URL}/api/floor-plan/analyze`, {
        method: 'POST',
        body: formData,
      }).then((res) => res.json()),
  },

  // Anonymous session
  anonymous: {
    register: () =>
      apiFetch<{ sessionId: string }>('/api/anonymous/register', {
        method: 'POST',
      }),
    usage: (sessionId: string) =>
      apiFetch<{ usage: unknown }>(`/api/anonymous/usage?sessionId=${sessionId}`),
  },
};

export default api;
