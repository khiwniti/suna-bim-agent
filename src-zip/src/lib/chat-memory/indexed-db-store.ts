import { get, set, del, keys, clear } from 'idb-keyval';

/**
 * Represents a tool call made by the assistant
 */
export interface ToolCall {
  id: string;
  name: string;
  status: 'pending' | 'completed' | 'failed';
  result?: unknown;
}

/**
 * Represents a single chat message in a thread
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

/**
 * Represents a chat thread containing messages
 */
export interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

const THREAD_PREFIX = 'thread:';

/**
 * IndexedDB-based storage for chat threads
 * Uses idb-keyval for simple key-value operations on IndexedDB
 */
export class ChatIndexedDBStore {
  /**
   * Generate the storage key for a thread
   */
  private getThreadKey(threadId: string): string {
    return `${THREAD_PREFIX}${threadId}`;
  }

  /**
   * Save a thread to IndexedDB
   * Updates the updatedAt timestamp automatically
   */
  async saveThread(thread: ChatThread): Promise<void> {
    const key = this.getThreadKey(thread.id);
    await set(key, { ...thread, updatedAt: Date.now() });
  }

  /**
   * Load a thread from IndexedDB by ID
   * Returns null if the thread doesn't exist
   */
  async loadThread(threadId: string): Promise<ChatThread | null> {
    const key = this.getThreadKey(threadId);
    const thread = await get<ChatThread>(key);
    return thread ?? null;
  }

  /**
   * Load all threads, sorted by updatedAt descending (most recent first)
   */
  async loadAllThreads(): Promise<ChatThread[]> {
    const allKeys = await keys<string>();
    const threadKeys = allKeys.filter(k =>
      typeof k === 'string' && k.startsWith(THREAD_PREFIX)
    );

    const threads = await Promise.all(
      threadKeys.map(key => get<ChatThread>(key))
    );

    return threads
      .filter((t): t is ChatThread => t !== undefined)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Delete a thread from IndexedDB
   */
  async deleteThread(threadId: string): Promise<void> {
    const key = this.getThreadKey(threadId);
    await del(key);
  }

  /**
   * Append a message to an existing thread
   * Throws an error if the thread doesn't exist
   */
  async appendMessage(threadId: string, message: ChatMessage): Promise<void> {
    const thread = await this.loadThread(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    thread.messages.push(message);
    thread.updatedAt = Date.now();

    await this.saveThread(thread);
  }

  /**
   * Clear all stored data
   * Use with caution - this removes all threads
   */
  async clearAll(): Promise<void> {
    await clear();
  }
}

// Export singleton instance for convenience
export const chatIndexedDBStore = new ChatIndexedDBStore();
