// src/lib/chat/chat-types.ts
import type { Message, Conversation, MessageRole } from '@prisma/client';

/**
 * Message input for creating new messages
 */
export interface CreateMessageInput {
  role: MessageRole;
  content: string;
  agentType?: string;
  toolCalls?: Record<string, unknown>[];
  toolResults?: Record<string, unknown>[];
  commands?: Record<string, unknown>[];
}

/**
 * Conversation with messages loaded
 */
export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

/**
 * Conversation list item (summary without full messages)
 */
export interface ConversationSummary {
  id: string;
  title: string | null;
  status: string;
  messageCount: number;
  lastMessageAt: Date | null;
  projectId: string | null;
  createdAt: Date;
}

/**
 * Options for listing conversations
 */
export interface ListConversationsOptions {
  userId: string;
  projectId?: string;
  limit?: number;
  offset?: number;
}
