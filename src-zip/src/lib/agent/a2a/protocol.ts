/**
 * A2A Protocol - Agent-to-Agent Communication Protocol
 *
 * Defines the standardized message schema for inter-agent communication
 * in the BIM Agent platform. All A2A messages must conform to this schema.
 *
 * Features:
 * - Zod-based schema validation
 * - Type-safe message creation
 * - Tenant isolation enforcement
 * - Correlation tracking for request/response pairs
 */

import { z } from 'zod';
import { nanoid } from 'nanoid';

// ============================================
// Message Types
// ============================================

/**
 * Types of A2A messages
 */
export const A2AMessageTypeEnum = z.enum([
  'request', // Agent requesting action from another agent
  'response', // Response to a request
  'event', // Broadcast event (no response expected)
  'error', // Error notification
  'handoff', // Task handoff between agents
]);

export type A2AMessageType = z.infer<typeof A2AMessageTypeEnum>;

/**
 * Message priority levels
 */
export const A2AMessagePriorityEnum = z.enum(['low', 'normal', 'high', 'critical']);

export type A2AMessagePriority = z.infer<typeof A2AMessagePriorityEnum>;

// ============================================
// Message Schema
// ============================================

/**
 * Core A2A Message Schema
 *
 * This schema defines the structure of all inter-agent messages.
 * It enforces tenant isolation and provides correlation tracking.
 */
export const A2AMessageSchema = z.object({
  /** Unique message identifier */
  id: z.string().min(1),

  /** Message type */
  type: A2AMessageTypeEnum,

  /** Source agent identifier */
  sourceAgent: z.string().min(1),

  /** Target agent identifier */
  targetAgent: z.string().min(1),

  /** Tenant ID for isolation (required for multi-tenant support) */
  tenantId: z.string().min(1),

  /** Message payload (action-specific data) */
  payload: z.record(z.unknown()),

  /** ISO 8601 timestamp when message was created */
  timestamp: z.string().datetime(),

  /** Correlation ID for request/response tracking (optional) */
  correlationId: z.string().optional(),

  /** Message priority */
  priority: A2AMessagePriorityEnum.optional(),

  /** Time-to-live in milliseconds (optional) */
  ttl: z.number().positive().optional(),

  /** Additional metadata */
  metadata: z.record(z.unknown()).optional(),
});

export type A2AMessage = z.infer<typeof A2AMessageSchema>;

// ============================================
// Capability Schema
// ============================================

/**
 * Agent Capability Declaration Schema
 *
 * Used for agent discovery and capability announcement.
 * Agents declare what actions they can perform.
 */
export const A2ACapabilitySchema = z.object({
  /** Unique agent instance identifier */
  agentId: z.string().min(1),

  /** Agent type (e.g., 'sustainability', 'spatial') */
  agentType: z.string().min(1),

  /** List of capabilities this agent provides */
  capabilities: z.array(z.string()),

  /** JSON Schema for expected input (optional) */
  inputSchema: z.record(z.unknown()).optional(),

  /** JSON Schema for output format (optional) */
  outputSchema: z.record(z.unknown()).optional(),

  /** Capability version */
  version: z.string(),

  /** Tenant ID for isolation */
  tenantId: z.string().min(1),

  /** Additional metadata */
  metadata: z.record(z.unknown()).optional(),
});

export type A2ACapability = z.infer<typeof A2ACapabilitySchema>;

// ============================================
// Message Creation
// ============================================

/**
 * Input for creating a new A2A message
 */
export interface CreateA2AMessageInput {
  id?: string;
  type: A2AMessageType;
  sourceAgent: string;
  targetAgent: string;
  tenantId: string;
  payload: Record<string, unknown>;
  timestamp?: string;
  correlationId?: string;
  priority?: A2AMessagePriority;
  ttl?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Creates a new A2A message with auto-generated fields
 *
 * @param input - Message creation input
 * @returns Complete A2A message
 */
export function createA2AMessage(input: CreateA2AMessageInput): A2AMessage {
  const message: A2AMessage = {
    id: input.id ?? `a2a-${nanoid()}`,
    type: input.type,
    sourceAgent: input.sourceAgent,
    targetAgent: input.targetAgent,
    tenantId: input.tenantId,
    payload: input.payload,
    timestamp: input.timestamp ?? new Date().toISOString(),
    correlationId: input.correlationId,
    priority: input.priority ?? 'normal',
    ttl: input.ttl,
    metadata: input.metadata,
  };

  // Validate the created message
  return A2AMessageSchema.parse(message);
}

// ============================================
// Validation Utilities
// ============================================

/**
 * Error thrown when message validation fails
 */
export class A2AValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: z.ZodError['errors']
  ) {
    super(message);
    this.name = 'A2AValidationError';
  }
}

/**
 * Validates an A2A message against the schema
 *
 * @param message - Message to validate
 * @returns Validated message
 * @throws A2AValidationError if validation fails
 */
export function validateA2AMessage(message: unknown): A2AMessage {
  const result = A2AMessageSchema.safeParse(message);

  if (!result.success) {
    throw new A2AValidationError(
      `A2A message validation failed: ${result.error.errors.map((e) => e.message).join(', ')}`,
      result.error.errors
    );
  }

  return result.data;
}

/**
 * Safely parse a message without throwing
 *
 * @param message - Message to parse
 * @returns Parsed result with success flag
 */
export function parseA2AMessage(message: unknown): z.SafeParseReturnType<unknown, A2AMessage> {
  return A2AMessageSchema.safeParse(message);
}

// ============================================
// Message Helpers
// ============================================

/**
 * Creates a response message for a given request
 *
 * @param request - Original request message
 * @param payload - Response payload
 * @param sourceAgent - Agent sending the response
 * @returns Response message
 */
export function createResponseMessage(
  request: A2AMessage,
  payload: Record<string, unknown>,
  sourceAgent: string
): A2AMessage {
  return createA2AMessage({
    type: 'response',
    sourceAgent,
    targetAgent: request.sourceAgent,
    tenantId: request.tenantId,
    payload,
    correlationId: request.id,
    priority: request.priority,
  });
}

/**
 * Creates an error message for a given request
 *
 * @param request - Original request message
 * @param error - Error information
 * @param sourceAgent - Agent sending the error
 * @returns Error message
 */
export function createErrorMessage(
  request: A2AMessage,
  error: { code: string; message: string; details?: Record<string, unknown> },
  sourceAgent: string
): A2AMessage {
  return createA2AMessage({
    type: 'error',
    sourceAgent,
    targetAgent: request.sourceAgent,
    tenantId: request.tenantId,
    payload: {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    },
    correlationId: request.id,
    priority: 'high',
  });
}

/**
 * Creates an event message (broadcast, no response expected)
 *
 * @param input - Event creation input
 * @returns Event message
 */
export function createEventMessage(input: {
  sourceAgent: string;
  targetAgent: string;
  tenantId: string;
  eventType: string;
  data: Record<string, unknown>;
}): A2AMessage {
  return createA2AMessage({
    type: 'event',
    sourceAgent: input.sourceAgent,
    targetAgent: input.targetAgent,
    tenantId: input.tenantId,
    payload: {
      eventType: input.eventType,
      data: input.data,
    },
    priority: 'normal',
  });
}

/**
 * Checks if a message is expired based on TTL
 *
 * @param message - Message to check
 * @returns True if message has expired
 */
export function isMessageExpired(message: A2AMessage): boolean {
  if (!message.ttl) {
    return false;
  }

  const createdAt = new Date(message.timestamp).getTime();
  const expiresAt = createdAt + message.ttl;

  return Date.now() > expiresAt;
}

/**
 * Extracts correlation chain from message metadata
 *
 * @param message - Message to extract chain from
 * @returns Array of correlated message IDs
 */
export function getCorrelationChain(message: A2AMessage): string[] {
  const chain: string[] = [];

  if (message.correlationId) {
    chain.push(message.correlationId);
  }

  if (message.metadata?.correlationChain && Array.isArray(message.metadata.correlationChain)) {
    chain.push(...(message.metadata.correlationChain as string[]));
  }

  return chain;
}
