/**
 * Rate Limiting using Sliding Window Algorithm
 *
 * ★ Insight ─────────────────────────────────────
 * The sliding window algorithm provides smooth rate limiting:
 * - Tracks requests in current and previous time windows
 * - Interpolates to calculate effective rate
 * - More forgiving than fixed windows at boundary edges
 *
 * For production with multiple instances, replace the
 * in-memory store with Redis using MULTI/EXEC transactions.
 * ─────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limit configurations for different endpoint types
export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSizeSeconds: number;
  /** Optional: identify by custom key instead of IP */
  keyGenerator?: (request: NextRequest) => string;
}

// Predefined rate limit presets
export const RATE_LIMIT_PRESETS = {
  /** Strict limit for auth endpoints - 5 requests per minute */
  auth: {
    maxRequests: 5,
    windowSizeSeconds: 60,
  },
  /** Standard API limit - 60 requests per minute */
  standard: {
    maxRequests: 60,
    windowSizeSeconds: 60,
  },
  /** Lenient limit for read operations - 120 requests per minute */
  lenient: {
    maxRequests: 120,
    windowSizeSeconds: 60,
  },
  /** Very strict for expensive operations - 10 per 5 minutes */
  expensive: {
    maxRequests: 10,
    windowSizeSeconds: 300,
  },
  /** File upload limit - 20 uploads per hour */
  upload: {
    maxRequests: 20,
    windowSizeSeconds: 3600,
  },
} as const;

// In-memory store for rate limiting
// For production with multiple instances, use Redis
interface RateLimitEntry {
  currentCount: number;
  currentWindowStart: number;
  previousCount: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // Remove entries older than 10 minutes

    for (const [key, entry] of rateLimitStore.entries()) {
      if (now - entry.currentWindowStart > maxAge) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  // Allow Node.js to exit even if timer is running
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

// Start cleanup on module load
startCleanup();

/**
 * Get client identifier for rate limiting
 * Uses IP address by default, can be customized via keyGenerator
 */
function getClientKey(request: NextRequest, config?: RateLimitConfig): string {
  if (config?.keyGenerator) {
    return config.keyGenerator(request);
  }

  // Get IP from various headers (handles proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Calculate rate using sliding window algorithm
 */
function calculateRate(entry: RateLimitEntry, windowSizeMs: number): number {
  const now = Date.now();
  const windowProgress = (now - entry.currentWindowStart) / windowSizeMs;

  // Interpolate between previous and current window
  const previousWeight = Math.max(0, 1 - windowProgress);
  const effectiveCount =
    entry.currentCount + entry.previousCount * previousWeight;

  return effectiveCount;
}

/**
 * Check and apply rate limit
 * Returns error response if rate limited, null if allowed
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const key = getClientKey(request, config);
  const windowSizeMs = config.windowSizeSeconds * 1000;
  const now = Date.now();

  // Get or create entry
  let entry = rateLimitStore.get(key);

  if (!entry) {
    entry = {
      currentCount: 0,
      currentWindowStart: now,
      previousCount: 0,
    };
    rateLimitStore.set(key, entry);
  }

  // Check if we need to roll over to a new window
  const windowAge = now - entry.currentWindowStart;
  if (windowAge >= windowSizeMs) {
    // Roll over: current becomes previous
    entry.previousCount = entry.currentCount;
    entry.currentCount = 0;
    entry.currentWindowStart = now;
  }

  // Calculate effective rate
  const effectiveRate = calculateRate(entry, windowSizeMs);

  // Check if rate limit exceeded
  if (effectiveRate >= config.maxRequests) {
    const retryAfter = Math.ceil(
      (windowSizeMs - (now - entry.currentWindowStart)) / 1000
    );

    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(
            Math.ceil((entry.currentWindowStart + windowSizeMs) / 1000)
          ),
        },
      }
    );
  }

  // Increment counter
  entry.currentCount++;

  return null; // Request allowed
}

/**
 * Wrapper to apply rate limiting to an API route handler
 *
 * Usage:
 * ```ts
 * export const POST = withRateLimit(
 *   async (request) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true });
 *   },
 *   RATE_LIMIT_PRESETS.standard
 * );
 * ```
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitError = await checkRateLimit(request, config);
    if (rateLimitError) {
      return rateLimitError;
    }
    return handler(request);
  };
}

/**
 * Helper to add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  request: NextRequest,
  config: RateLimitConfig
): NextResponse {
  const key = getClientKey(request, config);
  const entry = rateLimitStore.get(key);

  if (entry) {
    const windowSizeMs = config.windowSizeSeconds * 1000;
    const remaining = Math.max(
      0,
      config.maxRequests - calculateRate(entry, windowSizeMs)
    );

    response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(Math.floor(remaining)));
    response.headers.set(
      'X-RateLimit-Reset',
      String(Math.ceil((entry.currentWindowStart + windowSizeMs) / 1000))
    );
  }

  return response;
}

/**
 * Create a rate limiter for a specific route or use case
 */
export function createRateLimiter(config: RateLimitConfig) {
  return {
    check: (request: NextRequest) => checkRateLimit(request, config),
    wrap: (handler: (request: NextRequest) => Promise<NextResponse>) =>
      withRateLimit(handler, config),
    addHeaders: (response: NextResponse, request: NextRequest) =>
      addRateLimitHeaders(response, request, config),
  };
}

// Export preset-based rate limiters for common use cases
export const authRateLimiter = createRateLimiter(RATE_LIMIT_PRESETS.auth);
export const standardRateLimiter = createRateLimiter(RATE_LIMIT_PRESETS.standard);
export const uploadRateLimiter = createRateLimiter(RATE_LIMIT_PRESETS.upload);
export const expensiveRateLimiter = createRateLimiter(RATE_LIMIT_PRESETS.expensive);
