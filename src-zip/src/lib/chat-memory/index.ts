/**
 * Chat Memory Module
 *
 * Provides IndexedDB-based persistence for chat threads and messages.
 * Allows chat history to persist across page refreshes and browser sessions.
 */

export {
  ChatIndexedDBStore,
  chatIndexedDBStore,
  type ChatThread,
  type ChatMessage,
  type ToolCall,
} from './indexed-db-store';
