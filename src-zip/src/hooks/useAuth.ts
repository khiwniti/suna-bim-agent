/**
 * useAuth Hook
 *
 * Authentication hook for Supabase Auth
 *
 * Set NEXT_PUBLIC_DISABLE_AUTH=true to bypass authentication
 */

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient, type SupabaseClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// Check if auth is disabled for development
const AUTH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

// Mock user for development when auth is disabled
const MOCK_USER: User = {
  id: 'dev-user-123',
  email: 'dev@example.com',
  app_metadata: {},
  user_metadata: { name: 'Dev User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

const MOCK_SESSION: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: MOCK_USER,
} as Session;

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Mock actions for disabled auth mode
const mockSignIn = async () => { console.log('[Auth Disabled] signIn called'); };
const mockSignUp = async () => { console.log('[Auth Disabled] signUp called'); };
const mockSignOut = async () => { console.log('[Auth Disabled] signOut called'); };
const mockSignInWithOAuth = async () => { console.log('[Auth Disabled] signInWithOAuth called'); };
const mockRefreshSession = async () => { console.log('[Auth Disabled] refreshSession called'); };

export function useAuth(): AuthState & AuthActions {
  // Always call all hooks unconditionally (rules of hooks)
  const [supabase] = useState<SupabaseClient | null>(() =>
    AUTH_DISABLED ? null : createClient()
  );

  const [state, setState] = useState<AuthState>(() =>
    AUTH_DISABLED
      ? { user: MOCK_USER, session: MOCK_SESSION, loading: false, error: null }
      : { user: null, session: null, loading: true, error: null }
  );

  // Initialize auth state (only runs when auth is enabled)
  useEffect(() => {
    if (AUTH_DISABLED || !supabase) return;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('Auth initialization failed'),
        }));
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (AUTH_DISABLED || !supabase) return mockSignIn();

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('Sign in failed'),
        }));
        throw error;
      }
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      if (AUTH_DISABLED || !supabase) return mockSignUp();

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });

        if (error) throw error;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('Sign up failed'),
        }));
        throw error;
      }
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (AUTH_DISABLED || !supabase) return mockSignOut();

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Sign out failed'),
      }));
      throw error;
    }
  }, [supabase]);

  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'github') => {
      if (AUTH_DISABLED || !supabase) return mockSignInWithOAuth();

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });

        if (error) throw error;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('OAuth sign in failed'),
        }));
        throw error;
      }
    },
    [supabase]
  );

  const refreshSession = useCallback(async () => {
    if (AUTH_DISABLED || !supabase) return mockRefreshSession();

    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
    } catch (error) {
      console.error('Session refresh failed:', error);
    }
  }, [supabase]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    refreshSession,
  }), [state, signIn, signUp, signOut, signInWithOAuth, refreshSession]);
}
