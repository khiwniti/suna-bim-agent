/**
 * useChatMemory Hook
 *
 * Provides easy access to chat memory operations for persisting and restoring threads.
 * Uses IndexedDB via ChatIndexedDBStore for browser-local persistence.
 *
 * @example
 * ```tsx
 * const {
 *   threads,
 *   currentThread,
 *   isLoading,
 *   createThread,
 *   appendMessage,
 * } = useChatMemory();
 *
 * // Create a new thread
 * await createThread('My Chat');
 *
 * // Append a message
 * await appendMessage({ id: 'msg-1', role: 'user', content: 'Hello' });
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import {
  chatIndexedDBStore,
  type ChatThread,
  type ChatMessage,
} from '@/lib/chat-memory/indexed-db-store';

export interface UseChatMemoryReturn {
  /** List of all stored threads, sorted by updatedAt descending */
  threads: ChatThread[];
  /** Currently active thread */
  currentThread: ChatThread | null;
  /** Whether threads are being loaded */
  isLoading: boolean;
  /** Error that occurred during loading */
  error: Error | null;

  /** Save or update a thread */
  saveThread: (thread: ChatThread) => Promise<void>;
  /** Load a thread by ID */
  loadThread: (threadId: string) => Promise<ChatThread | null>;
  /** Delete a thread by ID */
  deleteThread: (threadId: string) => Promise<void>;
  /** Append a message to the current thread */
  appendMessage: (message: ChatMessage) => Promise<void>;
  /** Create a new thread and set it as current */
  createThread: (title?: string) => Promise<ChatThread>;
  /** Set the current thread by ID (or null to clear) */
  setCurrentThread: (threadId: string | null) => void;
  /** Refresh the threads list from storage */
  refreshThreads: () => Promise<void>;
}

export function useChatMemory(): UseChatMemoryReturn {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThread, setCurrentThreadState] = useState<ChatThread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Refresh the threads list from storage
   */
  const refreshThreads = useCallback(async () => {
    try {
      const allThreads = await chatIndexedDBStore.loadAllThreads();
      setThreads(allThreads);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load threads'));
    }
  }, []);

  // Load threads on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await refreshThreads();
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [refreshThreads]);

  /**
   * Save or update a thread
   */
  const saveThread = useCallback(
    async (thread: ChatThread) => {
      await chatIndexedDBStore.saveThread(thread);
      await refreshThreads();

      // Update currentThread if it's the one being saved
      if (currentThread?.id === thread.id) {
        setCurrentThreadState(thread);
      }
    },
    [currentThread, refreshThreads]
  );

  /**
   * Load a thread by ID
   */
  const loadThread = useCallback(async (threadId: string) => {
    return await chatIndexedDBStore.loadThread(threadId);
  }, []);

  /**
   * Delete a thread by ID
   */
  const deleteThread = useCallback(
    async (threadId: string) => {
      await chatIndexedDBStore.deleteThread(threadId);
      await refreshThreads();

      // Clear currentThread if it was deleted
      if (currentThread?.id === threadId) {
        setCurrentThreadState(null);
      }
    },
    [currentThread, refreshThreads]
  );

  /**
   * Append a message to the current thread
   */
  const appendMessage = useCallback(
    async (message: ChatMessage) => {
      if (!currentThread) {
        throw new Error('No current thread');
      }

      await chatIndexedDBStore.appendMessage(currentThread.id, message);

      // Refresh current thread to get updated state
      const updated = await chatIndexedDBStore.loadThread(currentThread.id);
      if (updated) {
        setCurrentThreadState(updated);
      }
    },
    [currentThread]
  );

  /**
   * Create a new thread and set it as current
   */
  const createThread = useCallback(
    async (title?: string) => {
      const now = Date.now();
      const newThread: ChatThread = {
        id: nanoid(),
        title: title || `New Chat ${new Date(now).toLocaleDateString()}`,
        createdAt: now,
        updatedAt: now,
        messages: [],
      };

      await chatIndexedDBStore.saveThread(newThread);
      await refreshThreads();
      setCurrentThreadState(newThread);

      return newThread;
    },
    [refreshThreads]
  );

  /**
   * Set the current thread by ID (or null to clear)
   */
  const setCurrentThread = useCallback(async (threadId: string | null) => {
    if (threadId === null) {
      setCurrentThreadState(null);
      return;
    }

    const thread = await chatIndexedDBStore.loadThread(threadId);
    setCurrentThreadState(thread);
  }, []);

  return {
    threads,
    currentThread,
    isLoading,
    error,
    saveThread,
    loadThread,
    deleteThread,
    appendMessage,
    createThread,
    setCurrentThread,
    refreshThreads,
  };
}
