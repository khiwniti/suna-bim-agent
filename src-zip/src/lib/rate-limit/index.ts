/**
 * Rate Limit Module
 *
 * Provides both Redis-backed and in-memory rate limiting
 * with tiered support for multi-tenant subscriptions.
 */

// Redis backend
export {
  redisRateLimit,
  inMemoryRateLimit,
  clearMemoryStore,
  getMemoryStoreSize,
  resetRedisClient,
  type RateLimitResult,
} from './redis';

// Tiered rate limiting
export {
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
  type TieredRateLimitOptions,
  type RateLimitByTenantResult,
} from './tiered';
