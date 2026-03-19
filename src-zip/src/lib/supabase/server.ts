/**
 * Supabase Server Client
 *
 * For use in Server Components, Route Handlers, and Server Actions
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Environment variables with fallbacks for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

/**
 * Create a Supabase client for server-side usage
 * Properly handles cookie management for auth
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Handle cookies in Server Components (read-only)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Handle cookies in Server Components (read-only)
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase admin client (bypasses RLS)
 * Use with caution - only for server-side operations
 */
export function createAdminClient() {
  return createServerClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      cookies: {
        get() { return undefined; },
        set() {},
        remove() {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Get the current authenticated user (server-side)
 */
export async function getUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const user = await getUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}
