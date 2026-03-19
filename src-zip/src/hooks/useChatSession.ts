/**
 * useChatSession Hook
 *
 * Manages chat session lifecycle including database persistence.
 * Handles both authenticated users and anonymous sessions.
 *
 * ★ Insight ─────────────────────────────────────
 * This hook bridges client-side chat state with database persistence:
 * 1. Initializes conversations in the database BEFORE first message
 * 2. Manages anonymous session IDs via localStorage
 * 3. Provides the conversationId for LangGraph thread_id continuity
 * ─────────────────────────────────────────────────
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useCSRFHeaders } from './useCSRF';
import { nanoid } from 'nanoid';

interface ChatSession {
  conversationId: string | null;
  isAnonymous: boolean;
  anonymousSessionId: string | null;
  isInitializing: boolean;
  error: Error | null;
}

interface UseChatSessionOptions {
  /** Project to associate conversations with */
  projectId?: string;
  /** Auto-initialize on mount */
  autoInitialize?: boolean;
}

interface UseChatSessionReturn extends ChatSession {
  /** Initialize a new conversation in the database */
  initializeConversation: (title?: string) => Promise<string | null>;
  /** Update the conversation ID (e.g., when resuming) */
  setConversationId: (id: string) => void;
  /** Clear the current session */
  clearSession: () => void;
}

const ANONYMOUS_SESSION_KEY = 'anonymousSessionId';
const ANONYMOUS_SESSION_STARTED_KEY = 'anonymousSessionStarted';

export function useChatSession(options: UseChatSessionOptions = {}): UseChatSessionReturn {
  const { user, loading: authLoading } = useAuth();
  const csrfHeaders = useCSRFHeaders();

  const [session, setSession] = useState<ChatSession>({
    conversationId: null,
    isAnonymous: false,
    anonymousSessionId: null,
    isInitializing: false,
    error: null,
  });

  // Track if we've already initialized to prevent duplicate calls
  const initializingRef = useRef(false);

  // Initialize anonymous session ID on mount if no user
  useEffect(() => {
    if (typeof window === 'undefined' || authLoading) return;

    let anonId = localStorage.getItem(ANONYMOUS_SESSION_KEY);

    // Create anonymous session ID if no user and no existing session
    if (!user && !anonId) {
      anonId = `anon_${nanoid()}`;
      localStorage.setItem(ANONYMOUS_SESSION_KEY, anonId);
      localStorage.setItem(ANONYMOUS_SESSION_STARTED_KEY, new Date().toISOString());
    }

    setSession((prev) => ({
      ...prev,
      isAnonymous: !user,
      anonymousSessionId: anonId,
    }));
  }, [user, authLoading]);

  // Initialize conversation in database
  const initializeConversation = useCallback(
    async (title?: string): Promise<string | null> => {
      // Prevent duplicate initialization
      if (session.conversationId || initializingRef.current) {
        return session.conversationId;
      }

      initializingRef.current = true;
      setSession((prev) => ({ ...prev, isInitializing: true, error: null }));

      try {
        const response = await fetch('/api/chat/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...csrfHeaders,
          },
          body: JSON.stringify({
            projectId: options.projectId,
            anonymousSessionId: session.isAnonymous ? session.anonymousSessionId : undefined,
            title,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to initialize session');
        }

        const data = await response.json();
        const { conversationId, isAnonymous } = data;

        setSession((prev) => ({
          ...prev,
          conversationId,
          isAnonymous,
          isInitializing: false,
        }));

        return conversationId;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error('Failed to initialize chat session');
        setSession((prev) => ({
          ...prev,
          isInitializing: false,
          error: errorObj,
        }));
        console.error('Failed to initialize chat session:', error);
        return null;
      } finally {
        initializingRef.current = false;
      }
    },
    [session.conversationId, session.isAnonymous, session.anonymousSessionId, options.projectId, csrfHeaders]
  );

  // Auto-initialize if requested
  useEffect(() => {
    if (options.autoInitialize && !session.conversationId && !session.isInitializing && !authLoading) {
      initializeConversation();
    }
  }, [options.autoInitialize, session.conversationId, session.isInitializing, authLoading, initializeConversation]);

  // Update conversation ID (e.g., when resuming a conversation)
  const setConversationId = useCallback((id: string) => {
    setSession((prev) => ({ ...prev, conversationId: id }));
  }, []);

  // Clear the current session
  const clearSession = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      conversationId: null,
      error: null,
    }));
  }, []);

  return {
    ...session,
    initializeConversation,
    setConversationId,
    clearSession,
  };
}

/**
 * Get the anonymous session ID from localStorage
 * Useful for components that need the ID without the full hook
 */
export function getAnonymousSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ANONYMOUS_SESSION_KEY);
}

/**
 * Clear the anonymous session from localStorage
 * Call this when user signs up or logs in
 */
export function clearAnonymousSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ANONYMOUS_SESSION_KEY);
  localStorage.removeItem(ANONYMOUS_SESSION_STARTED_KEY);
}
