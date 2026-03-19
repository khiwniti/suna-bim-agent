/**
 * Minimal type declarations for ioredis
 *
 * This provides basic types for the rate limiting module.
 * When ioredis is installed, the actual @types/ioredis types will be used instead.
 */

declare module 'ioredis' {
  interface RedisOptions {
    maxRetriesPerRequest?: number;
    retryDelayOnFailover?: number;
    enableReadyCheck?: boolean;
    lazyConnect?: boolean;
  }

  interface Pipeline {
    zremrangebyscore(key: string, min: number, max: number): Pipeline;
    zcard(key: string): Pipeline;
    zadd(key: string, score: number, member: string): Pipeline;
    pexpire(key: string, ms: number): Pipeline;
    exec(): Promise<[Error | null, unknown][] | null>;
  }

  class Redis {
    constructor(url: string, options?: RedisOptions);
    pipeline(): Pipeline;
    quit(): Promise<void>;
  }

  export default Redis;
}
