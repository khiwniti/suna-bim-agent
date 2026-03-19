/**
 * Auth Provider Configuration
 *
 * OAuth providers and authentication configuration for Supabase Auth
 */

import { createClient } from '@/lib/supabase/client';
import type { Provider } from '@supabase/supabase-js';

// ============================================
// Provider Configuration
// ============================================

export interface OAuthProvider {
  id: Provider;
  name: string;
  icon: string;
  enabled: boolean;
}

export const oauthProviders: OAuthProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: '🔵',
    enabled: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '⚫',
    enabled: true,
  },
  {
    id: 'azure',
    name: 'Microsoft',
    icon: '🟦',
    enabled: false, // Enable when configured
  },
];

// ============================================
// Auth Functions
// ============================================

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { name?: string }
) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${getBaseUrl()}/api/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signInWithOAuth(provider: Provider) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${getBaseUrl()}/api/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signOut() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function resetPassword(email: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getBaseUrl()}/auth/update-password`,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getSession() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

export async function getUser() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

export async function refreshSession() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// ============================================
// Auth State Listener
// ============================================

export function onAuthStateChange(
  callback: (event: string, session: unknown) => void
) {
  const supabase = createClient();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    }
  );

  return subscription;
}

// ============================================
// Helpers
// ============================================

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Server-side
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

// ============================================
// User Profile Management
// ============================================

export async function updateUserProfile(updates: {
  name?: string;
  avatarUrl?: string;
}) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.updateUser({
    data: {
      name: updates.name,
      avatar_url: updates.avatarUrl,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteAccount() {
  // Note: This requires server-side implementation with service role key
  // For now, just sign out the user
  await signOut();
}

// ============================================
// Session Validation
// ============================================

export function isSessionValid(session: { expires_at?: number } | null): boolean {
  if (!session?.expires_at) {
    return false;
  }

  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  const bufferMs = 60 * 1000; // 1 minute buffer

  return expiresAt.getTime() - bufferMs > now.getTime();
}

export function getSessionTimeRemaining(session: { expires_at?: number } | null): number {
  if (!session?.expires_at) {
    return 0;
  }

  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();

  return Math.max(0, expiresAt.getTime() - now.getTime());
}
