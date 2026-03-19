/**
 * Tiered Rate Limiting
 *
 * Provides subscription-tier-aware rate limiting with endpoint-specific multipliers.
 * Integrates with the multi-tenant system to apply appropriate limits.
 */

import type { SubscriptionTier } from '@prisma/client';
import { redisRateLimit, type RateLimitResult } from './redis';

// ============================================
// Rate Limit Configuration
// ============================================

/**
 * Base rate limits per subscription tier (requests per minute)
 */
export const tierRateLimits: Record<SubscriptionTier, number> = {
  STARTER: 60, // Free tier - basic limits
  PROFESSIONAL: 300, // Paid - 5x starter
  ENTERPRISE: 1000, // Enterprise - high volume
  UNLIMITED: -1, // Internal/partner - no limit
};

/**
 * Endpoint-specific multipliers applied to base tier limits
 * Lower multiplier = more restrictive (expensive operations)
 */
export const endpointMultipliers: Record<string, number> = {
  api: 1.0, // Base rate
  chat: 0.5, // Half of base (AI operations are expensive)
  analysis: 0.2, // 20% of base (very expensive BIM analysis)
  upload: 0.1, // 10% of base (file uploads limited)
  carbon: 0.3, // 30% of base (carbon calculations)
  clash: 0.2, // 20% of base (clash detection)
  compliance: 0.3, // 30% of base (code compliance checks)
  mcp: 0.5, // 50% of base (MCP tool calls)
  export: 0.2, // 20% of base (report exports)
  bcf: 0.5, // 50% of base (BCF operations)
};

/**
 * Get the base rate limit for a subscription tier
 */
export function getTierRateLimit(tier: SubscriptionTier): number {
  return tierRateLimits[tier];
}

/**
 * Get the effective rate limit for a tier and endpoint
 */
export function getEffectiveRateLimit(tier: SubscriptionTier, endpoint: string): number {
  const baseLimit = tierRateLimits[tier];

  // Unlimited tier bypasses all limits
  if (baseLimit === -1) {
    return -1;
  }

  const multiplier = endpointMultipliers[endpoint] ?? 1.0;
  return Math.floor(baseLimit * multiplier);
}

// ============================================
// Tiered Rate Limiting
// ============================================

export interface TieredRateLimitOptions {
  /** Tenant ID or user ID for rate limit tracking */
  identifier: string;
  /** Subscription tier determining base limits */
  tier: SubscriptionTier;
  /** Endpoint type for multiplier application */
  endpoint: string;
  /** Optional custom limit override (bypasses tier defaults) */
  customLimit?: number;
  /** Optional custom window in milliseconds (default: 60000ms = 1 minute) */
  windowMs?: number;
}

/**
 * Check rate limit based on subscription tier and endpoint
 *
 * @param options - Rate limit check options
 * @returns Rate limit result with allowed status and remaining quota
 */
export async function checkTieredRateLimit(
  options: TieredRateLimitOptions
): Promise<RateLimitResult> {
  const { identifier, tier, endpoint, customLimit, windowMs = 60 * 1000 } = options;

  let limit = customLimit ?? tierRateLimits[tier];

  // Unlimited tier bypasses rate limiting entirely
  if (limit === -1) {
    return {
      allowed: true,
      remaining: Number.MAX_SAFE_INTEGER,
      resetTime: Date.now() + windowMs,
      limit: -1,
    };
  }

  // Apply endpoint multiplier (only if no custom limit)
  if (customLimit === undefined) {
    const multiplier = endpointMultipliers[endpoint] ?? 1.0;
    limit = Math.floor(limit * multiplier);
  }

  // Ensure minimum limit of 1
  limit = Math.max(1, limit);

  const key = `${identifier}:${endpoint}`;

  return redisRateLimit(key, limit, windowMs);
}

// ============================================
// Middleware Helpers
// ============================================

export interface RateLimitByTenantResult {
  /** Headers to include in the response */
  headers: Record<string, string>;
  /** Error response if rate limit exceeded (undefined if allowed) */
  error?: Response;
}

/**
 * Middleware helper for rate limiting by tenant
 *
 * Returns headers to add to the response and an error Response if rate limit exceeded.
 *
 * @example
 * ```ts
 * const { headers, error } = await rateLimitByTenant(
 *   tenant.id,
 *   tenant.subscriptionTier,
 *   'chat'
 * );
 *
 * if (error) return error;
 *
 * // Add headers to successful response
 * return new Response(data, { headers });
 * ```
 */
export async function rateLimitByTenant(
  tenantId: string,
  tier: SubscriptionTier,
  endpoint: string,
  customLimit?: number
): Promise<RateLimitByTenantResult> {
  const result = await checkTieredRateLimit({
    identifier: tenantId,
    tier,
    endpoint,
    customLimit,
  });

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
  };

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    return {
      headers: { ...headers, 'Retry-After': String(retryAfter) },
      error: new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Please retry after ${retryAfter} seconds.`,
          retryAfter,
          limit: result.limit,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
            'Retry-After': String(retryAfter),
          },
        }
      ),
    };
  }

  return { headers };
}

/**
 * Middleware helper for rate limiting by user ID
 *
 * Uses a default PROFESSIONAL tier for authenticated users.
 * For anonymous users, use STARTER tier.
 */
export async function rateLimitByUser(
  userId: string,
  endpoint: string,
  tier: SubscriptionTier = 'PROFESSIONAL'
): Promise<RateLimitByTenantResult> {
  return rateLimitByTenant(`user:${userId}`, tier, endpoint);
}

/**
 * Middleware helper for rate limiting anonymous users
 *
 * Uses IP address or session ID as identifier with STARTER tier.
 */
export async function rateLimitAnonymous(
  ipOrSessionId: string,
  endpoint: string
): Promise<RateLimitByTenantResult> {
  return rateLimitByTenant(`anon:${ipOrSessionId}`, 'STARTER', endpoint);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get rate limit info without consuming a request
 * Useful for displaying quota information to users
 */
export function getRateLimitInfo(tier: SubscriptionTier, endpoint: string): {
  limit: number;
  isUnlimited: boolean;
  tierName: string;
  endpointMultiplier: number;
} {
  const baseLimit = tierRateLimits[tier];
  const multiplier = endpointMultipliers[endpoint] ?? 1.0;
  const effectiveLimit = baseLimit === -1 ? -1 : Math.floor(baseLimit * multiplier);

  return {
    limit: effectiveLimit,
    isUnlimited: effectiveLimit === -1,
    tierName: tier,
    endpointMultiplier: multiplier,
  };
}

/**
 * Format rate limit for display
 */
export function formatRateLimit(limit: number, windowSeconds: number = 60): string {
  if (limit === -1) {
    return 'Unlimited';
  }

  const perMinute = Math.round(limit * (60 / windowSeconds));
  if (perMinute >= 1000) {
    return `${(perMinute / 1000).toFixed(1)}K/min`;
  }
  return `${perMinute}/min`;
}
