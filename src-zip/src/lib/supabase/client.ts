/**
 * Supabase Client Configuration
 *
 * Provides client instances for both server and browser environments
 */

import { createBrowserClient } from '@supabase/ssr';

// Placeholder type - will be replaced with generated types after DB setup
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Database = {};

// Environment variables with fallbacks for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

/**
 * Create a Supabase client for browser usage
 * Uses placeholder values during build to avoid SSG errors
 * Real values are injected at runtime via environment variables
 */
export function createClient() {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}

export type SupabaseClient = ReturnType<typeof createClient>;
