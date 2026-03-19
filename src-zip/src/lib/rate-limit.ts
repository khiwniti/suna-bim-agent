/**
 * Rate Limiting Middleware
 *
 * In-memory rate limiter for API protection
 * For production, consider using Redis-based rate limiting
 */

import { RateLimitError } from './errors';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (identifier: string) => string;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
};

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Cleanup every minute

export function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetTime: number } {
  const { windowMs, maxRequests, keyGenerator } = { ...defaultConfig, ...config };

  const key = keyGenerator ? keyGenerator(identifier) : identifier;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

export function rateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): void {
  const result = checkRateLimit(identifier, config);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    throw new RateLimitError(retryAfter);
  }
}

// ============================================
// Specialized Rate Limiters
// ============================================

export const rateLimitConfigs = {
  // General API
  api: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },

  // Authentication
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },

  // Chat/Agent
  chat: {
    windowMs: 60 * 1000,
    maxRequests: 20, // 20 messages per minute
  },

  // File uploads
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 uploads per hour
  },

  // Analysis
  analysis: {
    windowMs: 60 * 1000,
    maxRequests: 5, // 5 analyses per minute
  },
};

export function rateLimitAuth(identifier: string): void {
  rateLimit(`auth:${identifier}`, rateLimitConfigs.auth);
}

export function rateLimitChat(identifier: string): void {
  rateLimit(`chat:${identifier}`, rateLimitConfigs.chat);
}

export function rateLimitUpload(identifier: string): void {
  rateLimit(`upload:${identifier}`, rateLimitConfigs.upload);
}

export function rateLimitAnalysis(identifier: string): void {
  rateLimit(`analysis:${identifier}`, rateLimitConfigs.analysis);
}

// ============================================
// Rate Limit Headers
// ============================================

export function getRateLimitHeaders(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Record<string, string> {
  const result = checkRateLimit(identifier, config);

  return {
    'X-RateLimit-Limit': String(config.maxRequests ?? defaultConfig.maxRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
  };
}

// ============================================
// Re-export Tiered Rate Limiting
// ============================================

export {
  // Tiered rate limiting
  checkTieredRateLimit,
  rateLimitByTenant,
  rateLimitByUser,
  rateLimitAnonymous,
  getTierRateLimit,
  getEffectiveRateLimit,
  getRateLimitInfo,
  formatRateLimit,
  tierRateLimits,
  endpointMultipliers,
  // Redis backend
  redisRateLimit,
  inMemoryRateLimit,
  clearMemoryStore,
  // Types
  type TieredRateLimitOptions,
  type RateLimitByTenantResult,
  type RateLimitResult,
} from './rate-limit/index';
