/**
 * Redis Rate Limit Backend
 *
 * Provides distributed rate limiting using Redis sorted sets for sliding window.
 * Falls back to in-memory rate limiting when Redis is unavailable.
 */

// Note: ioredis should be installed as a dependency
// pnpm add ioredis @types/ioredis

type RedisClient = {
  pipeline: () => {
    zremrangebyscore: (key: string, min: number, max: number) => unknown;
    zcard: (key: string) => unknown;
    zadd: (key: string, score: number, member: string) => unknown;
    pexpire: (key: string, ms: number) => unknown;
    exec: () => Promise<[Error | null, unknown][] | null>;
  };
  quit: () => Promise<void>;
};

let redis: RedisClient | null = null;
let redisInitialized = false;

/**
 * Get or create Redis client instance
 * Returns null if REDIS_URL is not configured
 */
async function getRedisClient(): Promise<RedisClient | null> {
  if (redisInitialized) return redis;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('[rate-limit] REDIS_URL not set, using in-memory rate limiting');
    redisInitialized = true;
    return null;
  }

  try {
    // Dynamic import to avoid issues when ioredis is not installed
    const ioredisModule = await import(/* webpackIgnore: true */ 'ioredis').catch(() => null);
    if (!ioredisModule) {
      console.warn('[rate-limit] ioredis not available, using in-memory rate limiting');
      redisInitialized = true;
      return null;
    }
    const Redis = ioredisModule.default;
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
    }) as unknown as RedisClient;
    redisInitialized = true;
    return redis;
  } catch (error) {
    console.warn('[rate-limit] Failed to initialize Redis client:', error);
    redisInitialized = true;
    return null;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

/**
 * Redis-based sliding window rate limiting
 *
 * Uses sorted sets to implement a sliding window algorithm:
 * 1. Remove entries outside the current window
 * 2. Count entries in the current window
 * 3. Add the current request
 * 4. Set expiry on the key
 */
export async function redisRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const client = await getRedisClient();
  if (!client) {
    return inMemoryRateLimit(key, limit, windowMs);
  }

  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `ratelimit:${key}`;

  try {
    // Use Redis sorted set for sliding window
    const pipeline = client.pipeline();
    pipeline.zremrangebyscore(redisKey, 0, windowStart); // Remove old entries
    pipeline.zcard(redisKey); // Count current window
    pipeline.zadd(redisKey, now, `${now}-${Math.random()}`); // Add current request
    pipeline.pexpire(redisKey, windowMs); // Set expiry

    const results = await pipeline.exec();
    // Redis pipeline returns [Error | null, result] tuples - check for errors
    const zcardResult = results?.[1];
    if (zcardResult?.[0]) {
      throw zcardResult[0]; // Propagate Redis error to trigger fallback
    }
    const currentCount = (zcardResult?.[1] as number) || 0;

    const allowed = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount - 1);
    const resetTime = now + windowMs;

    return { allowed, remaining, resetTime, limit };
  } catch (error) {
    console.warn('[rate-limit] Redis error, falling back to in-memory:', error);
    return inMemoryRateLimit(key, limit, windowMs);
  }
}

// ============================================
// In-Memory Fallback
// ============================================

interface MemoryEntry {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, MemoryEntry>();

// Periodic cleanup of expired entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.resetTime < now) {
        memoryStore.delete(key);
      }
    }
  }, 60 * 1000); // Cleanup every minute
}

/**
 * In-memory rate limiting fallback
 * Uses fixed window algorithm for simplicity
 */
export function inMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let entry = memoryStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = { count: 1, resetTime: now + windowMs };
    memoryStore.set(key, entry);
    return { allowed: true, remaining: limit - 1, resetTime: entry.resetTime, limit };
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime, limit };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
    limit,
  };
}

/**
 * Clear all rate limit entries (for testing)
 */
export function clearMemoryStore(): void {
  memoryStore.clear();
}

/**
 * Get current entry count (for testing)
 */
export function getMemoryStoreSize(): number {
  return memoryStore.size;
}

/**
 * Reset Redis client state (for testing)
 */
export function resetRedisClient(): void {
  redis = null;
  redisInitialized = false;
}
