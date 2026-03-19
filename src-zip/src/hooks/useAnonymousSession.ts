/**
 * useAnonymousSession Hook
 *
 * Manages anonymous user sessions with persistent localStorage-based IDs
 * Tracks usage and enables conversion to registered users
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';

const ANONYMOUS_SESSION_KEY = 'bim_anonymous_session';
const ANONYMOUS_TURNS_KEY = 'bim_anonymous_turns';

interface AnonymousSession {
  sessionId: string;
  createdAt: string;
  totalTurns: number;
  lastTurnAt: string | null;
}

interface AnonymousSessionState {
  session: AnonymousSession | null;
  isAnonymous: boolean;
  loading: boolean;
}

interface AnonymousSessionActions {
  incrementTurn: () => Promise<number>;
  getSessionId: () => string | null;
  clearSession: () => void;
}

export function useAnonymousSession(): AnonymousSessionState & AnonymousSessionActions {
  const [state, setState] = useState<AnonymousSessionState>({
    session: null,
    isAnonymous: true,
    loading: true,
  });

  const sessionInitialized = useRef(false);

  // Initialize or load existing session
  useEffect(() => {
    if (sessionInitialized.current) return;
    sessionInitialized.current = true;

    const initSession = () => {
      try {
        // Check for existing session in localStorage
        const storedSession = localStorage.getItem(ANONYMOUS_SESSION_KEY);

        if (storedSession) {
          const parsed = JSON.parse(storedSession) as AnonymousSession;
          setState({
            session: parsed,
            isAnonymous: true,
            loading: false,
          });
        } else {
          // Create new anonymous session
          const newSession: AnonymousSession = {
            sessionId: `anon_${nanoid(21)}`,
            createdAt: new Date().toISOString(),
            totalTurns: 0,
            lastTurnAt: null,
          };

          localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(newSession));

          setState({
            session: newSession,
            isAnonymous: true,
            loading: false,
          });

          // Register with backend (fire and forget)
          registerAnonymousUser(newSession.sessionId);
        }
      } catch {
        // localStorage not available (SSR or privacy mode)
        const fallbackSession: AnonymousSession = {
          sessionId: `anon_temp_${nanoid(21)}`,
          createdAt: new Date().toISOString(),
          totalTurns: 0,
          lastTurnAt: null,
        };

        setState({
          session: fallbackSession,
          isAnonymous: true,
          loading: false,
        });
      }
    };

    initSession();
  }, []);

  // Increment turn count
  const incrementTurn = useCallback(async (): Promise<number> => {
    return new Promise((resolve) => {
      setState((prev) => {
        if (!prev.session) {
          resolve(0);
          return prev;
        }

        const newTurnCount = prev.session.totalTurns + 1;
        const updatedSession: AnonymousSession = {
          ...prev.session,
          totalTurns: newTurnCount,
          lastTurnAt: new Date().toISOString(),
        };

        // Persist to localStorage
        try {
          localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(updatedSession));
        } catch {
          // Ignore localStorage errors
        }

        resolve(newTurnCount);
        return {
          ...prev,
          session: updatedSession,
        };
      });
    });
  }, []);

  // Get session ID
  const getSessionId = useCallback((): string | null => {
    return state.session?.sessionId ?? null;
  }, [state.session]);

  // Clear session (on logout or conversion)
  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(ANONYMOUS_SESSION_KEY);
      localStorage.removeItem(ANONYMOUS_TURNS_KEY);
    } catch {
      // Ignore
    }

    setState({
      session: null,
      isAnonymous: false,
      loading: false,
    });
  }, []);

  return {
    ...state,
    incrementTurn,
    getSessionId,
    clearSession,
  };
}

// Register anonymous user with backend
async function registerAnonymousUser(sessionId: string): Promise<void> {
  try {
    await fetch('/api/anonymous/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      }),
    });
  } catch {
    // Silently fail - not critical
  }
}
