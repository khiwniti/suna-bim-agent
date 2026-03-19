/**
 * Environment Configuration
 *
 * Validates and exports typed environment variables
 * Throws at startup if required variables are missing
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // AI/LLM
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // Custom LLM endpoint (for Anthropic-compatible APIs)
  LLM_BASE_URL: z.string().url().optional(),

  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Optional: Rate limiting
  REDIS_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

// Public environment schema type for client-side usage
type PublicEnvSchema = z.ZodObject<{
  NEXT_PUBLIC_SUPABASE_URL: z.ZodString;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.ZodString;
  NEXT_PUBLIC_APP_URL: z.ZodOptional<z.ZodString>;
}>;
export type PublicEnv = z.infer<PublicEnvSchema>;

/**
 * Validates environment variables at startup
 * Call this in instrumentation.ts or app initialization
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    const formatted = result.error.format();

    Object.entries(formatted).forEach(([key, value]) => {
      if (key !== '_errors' && typeof value === 'object' && '_errors' in value) {
        const errors = value._errors;
        if (errors.length > 0) {
          console.error(`  ${key}: ${errors.join(', ')}`);
        }
      }
    });

    throw new Error('Missing or invalid environment variables');
  }

  return result.data;
}

/**
 * Get validated environment variable
 * Use this for type-safe access to env vars
 */
export function getEnv(): Env {
  // In production, validate strictly
  if (process.env.NODE_ENV === 'production') {
    return validateEnv();
  }

  // In development, be more lenient but still validate what's available
  const result = envSchema.safeParse(process.env);
  if (result.success) {
    return result.data;
  }

  // Return partial env with defaults for development
  return {
    DATABASE_URL: process.env.DATABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    LLM_BASE_URL: process.env.LLM_BASE_URL,
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    REDIS_URL: process.env.REDIS_URL,
  };
}

/**
 * Check if a feature is enabled based on env vars
 */
export function isFeatureEnabled(feature: 'redis' | 'anthropic' | 'openai'): boolean {
  const env = getEnv();

  switch (feature) {
    case 'redis':
      return !!env.REDIS_URL;
    case 'anthropic':
      return !!env.ANTHROPIC_API_KEY;
    case 'openai':
      return !!env.OPENAI_API_KEY;
    default:
      return false;
  }
}

/**
 * Get the LLM configuration
 */
export function getLLMConfig(): { apiKey: string; baseUrl?: string } | null {
  const env = getEnv();

  if (env.ANTHROPIC_API_KEY) {
    return {
      apiKey: env.ANTHROPIC_API_KEY,
      baseUrl: env.LLM_BASE_URL,
    };
  }

  if (env.OPENAI_API_KEY) {
    return {
      apiKey: env.OPENAI_API_KEY,
    };
  }

  return null;
}
