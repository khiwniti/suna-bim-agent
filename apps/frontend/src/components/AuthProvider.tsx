'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import { clearUserLocalStorage } from '@/lib/utils/clear-local-storage';
import { isLocalMode } from '@/lib/config';
// Auth tracking moved to AuthEventTracker component (handles OAuth redirects)

type AuthContextType = {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
const LOCAL_DEV_ACCESS_TOKEN = 'local-dev-token';

const LOCAL_DEV_USER: User = {
  id: LOCAL_DEV_USER_ID,
  aud: 'authenticated',
  app_metadata: {
    provider: 'local',
    providers: ['local'],
  },
  user_metadata: {
    name: 'Local Developer',
    locale: 'en',
  },
  email: 'local-dev@carbon-bim.local',
  role: 'authenticated',
  created_at: '1970-01-01T00:00:00.000Z',
  is_anonymous: false,
};

const LOCAL_DEV_SESSION: Session = {
  access_token: LOCAL_DEV_ACCESS_TOKEN,
  refresh_token: 'local-dev-refresh-token',
  expires_in: 60 * 60 * 24 * 365,
  expires_at: 4102444800,
  token_type: 'bearer',
  user: LOCAL_DEV_USER,
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient();
  const localMode = isLocalMode();
  const [session, setSession] = useState<Session | null>(localMode ? LOCAL_DEV_SESSION : null);
  const [user, setUser] = useState<User | null>(localMode ? LOCAL_DEV_USER : null);
  const [isLoading, setIsLoading] = useState(!localMode);

  useEffect(() => {
    if (localMode) {
      setSession(LOCAL_DEV_SESSION);
      setUser(LOCAL_DEV_USER);
      setIsLoading(false);
      return;
    }

    const getInitialSession = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (isLoading) setIsLoading(false);
        switch (event) {
          case 'SIGNED_IN':
            // Auth tracking handled by AuthEventTracker component via URL params
            break;
          case 'SIGNED_OUT':
            clearUserLocalStorage();
            break;
          case 'TOKEN_REFRESHED':
            break;
          case 'MFA_CHALLENGE_VERIFIED':
            break;
          default:
        }
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [localMode, supabase]); // Removed isLoading from dependencies to prevent infinite loops

  const signOut = async () => {
    if (localMode) {
      clearUserLocalStorage();
      return;
    }

    try {
      await supabase.auth.signOut();
      // Clear local storage after successful sign out
      clearUserLocalStorage();
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  const value = {
    supabase,
    session,
    user,
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
