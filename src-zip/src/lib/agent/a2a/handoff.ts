/**
 * A2A Handoff - Task Handoff Protocol Between Agents
 *
 * Manages the graceful transfer of tasks between agents, including:
 * - Initiating handoffs with context preservation
 * - Accepting/rejecting handoffs
 * - Completing handoffs with results
 * - Tracking handoff chains for multi-step workflows
 *
 * Features:
 * - Tenant isolation
 * - Timeout handling
 * - Status tracking
 * - Chain tracking for complex workflows
 * - Metrics collection
 */

import type { AgentRegistry } from './discovery';
import { nanoid } from 'nanoid';

// ============================================
// Types
// ============================================

/**
 * Handoff status values
 */
export type HandoffStatus =
  | 'pending' // Waiting for target agent to accept
  | 'accepted' // Target agent has accepted
  | 'rejected' // Target agent rejected the handoff
  | 'completed' // Task completed successfully
  | 'failed' // Task failed
  | 'timed_out'; // Handoff expired before acceptance

/**
 * Task definition for handoff
 */
export interface HandoffTask {
  /** Task type identifier */
  type: string;

  /** Task-specific data */
  data?: Record<string, unknown>;
}

/**
 * Context preserved during handoff
 */
export interface HandoffContext {
  /** Conversation ID for continuity */
  conversationId?: string;

  /** Project context */
  projectContext?: Record<string, unknown>;

  /** Results from previous agents */
  previousResults?: Record<string, unknown>;

  /** Additional context data */
  [key: string]: unknown;
}

/**
 * Result of a completed handoff
 */
export interface HandoffResult {
  /** Whether the task succeeded */
  success: boolean;

  /** Task result data (if successful) */
  result?: unknown;

  /** Error message (if failed) */
  error?: string;
}

/**
 * Handoff request input
 */
export interface HandoffRequestInput {
  /** Source agent initiating handoff */
  sourceAgent: string;

  /** Target agent to receive handoff */
  targetAgent: string;

  /** Tenant ID for isolation */
  tenantId: string;

  /** Task to hand off */
  task: HandoffTask;

  /** Context to preserve */
  context?: HandoffContext;

  /** Timeout in milliseconds (default: 60000) */
  timeout?: number;

  /** Parent handoff ID for chaining */
  parentHandoffId?: string;
}

/**
 * Handoff record
 */
export interface HandoffRequest {
  /** Unique handoff identifier */
  id: string;

  /** Source agent */
  sourceAgent: string;

  /** Target agent */
  targetAgent: string;

  /** Tenant ID */
  tenantId: string;

  /** Task being handed off */
  task: HandoffTask;

  /** Preserved context */
  context?: HandoffContext;

  /** Current status */
  status: HandoffStatus;

  /** Creation timestamp */
  createdAt: number;

  /** Expiration timestamp */
  expiresAt: number;

  /** When handoff was accepted */
  acceptedAt?: number;

  /** When handoff was completed */
  completedAt?: number;

  /** Rejection reason (if rejected) */
  rejectionReason?: string;

  /** Result (if completed) */
  result?: HandoffResult;

  /** Parent handoff ID for chains */
  parentHandoffId?: string;
}

/**
 * Handoff metrics
 */
export interface HandoffMetrics {
  totalHandoffs: number;
  successfulHandoffs: number;
  failedHandoffs: number;
  timedOutHandoffs: number;
  averageCompletionTimeMs: number;
}

// ============================================
// Errors
// ============================================

/**
 * Error thrown during handoff operations
 */
export class HandoffError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'HandoffError';
  }
}

// ============================================
// Handoff Manager
// ============================================

/**
 * Handoff Manager interface
 */
export interface HandoffManager {
  /** Get a handoff by ID */
  getHandoff(handoffId: string): HandoffRequest | null;

  /** Get all active (non-completed) handoffs */
  getActiveHandoffs(): HandoffRequest[];

  /** Get handoffs for a specific agent */
  getHandoffsForAgent(agentId: string): HandoffRequest[];

  /** Get the chain of handoffs leading to a given handoff */
  getHandoffChain(handoffId: string): HandoffRequest[];

  /** Prune expired pending handoffs */
  pruneExpiredHandoffs(): void;

  /** Clean up old completed handoffs */
  cleanupOldHandoffs(retentionMs: number): number;

  /** Get handoff metrics */
  getMetrics(): HandoffMetrics;

  /** Internal: add a handoff */
  _addHandoff(handoff: HandoffRequest): void;

  /** Internal: update a handoff */
  _updateHandoff(handoffId: string, updates: Partial<HandoffRequest>): HandoffRequest | null;
}

/**
 * Creates a new handoff manager
 *
 * @param registry - Agent registry for validation
 * @returns Handoff manager instance
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createHandoffManager(_registry: AgentRegistry): HandoffManager {
  const handoffs = new Map<string, HandoffRequest>();
  const completionTimes: number[] = [];

  return {
    getHandoff(handoffId: string): HandoffRequest | null {
      return handoffs.get(handoffId) ?? null;
    },

    getActiveHandoffs(): HandoffRequest[] {
      const results: HandoffRequest[] = [];

      for (const handoff of handoffs.values()) {
        if (
          handoff.status === 'pending' ||
          handoff.status === 'accepted'
        ) {
          results.push(handoff);
        }
      }

      return results;
    },

    getHandoffsForAgent(agentId: string): HandoffRequest[] {
      const results: HandoffRequest[] = [];

      for (const handoff of handoffs.values()) {
        if (
          handoff.sourceAgent === agentId ||
          handoff.targetAgent === agentId
        ) {
          results.push(handoff);
        }
      }

      return results;
    },

    getHandoffChain(handoffId: string): HandoffRequest[] {
      const chain: HandoffRequest[] = [];
      const visited = new Set<string>();

      // Build chain backwards from the given handoff
      let currentId: string | undefined = handoffId;

      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const handoff = handoffs.get(currentId);

        if (handoff) {
          chain.unshift(handoff);
          currentId = handoff.parentHandoffId;
        } else {
          break;
        }
      }

      return chain;
    },

    pruneExpiredHandoffs(): void {
      const now = Date.now();

      for (const handoff of handoffs.values()) {
        if (
          handoff.status === 'pending' &&
          now > handoff.expiresAt
        ) {
          handoff.status = 'timed_out';
        }
      }
    },

    cleanupOldHandoffs(retentionMs: number): number {
      const now = Date.now();
      let removed = 0;

      for (const [id, handoff] of handoffs.entries()) {
        if (
          handoff.completedAt &&
          now - handoff.completedAt > retentionMs
        ) {
          handoffs.delete(id);
          removed++;
        }
      }

      return removed;
    },

    getMetrics(): HandoffMetrics {
      let total = 0;
      let successful = 0;
      let failed = 0;
      let timedOut = 0;

      for (const handoff of handoffs.values()) {
        total++;

        switch (handoff.status) {
          case 'completed':
            if (handoff.result?.success) {
              successful++;
            } else {
              failed++;
            }
            break;
          case 'failed':
            failed++;
            break;
          case 'timed_out':
            timedOut++;
            break;
        }
      }

      const avgTime =
        completionTimes.length > 0
          ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
          : 0;

      return {
        totalHandoffs: total,
        successfulHandoffs: successful,
        failedHandoffs: failed,
        timedOutHandoffs: timedOut,
        averageCompletionTimeMs: avgTime,
      };
    },

    _addHandoff(handoff: HandoffRequest): void {
      handoffs.set(handoff.id, handoff);
    },

    _updateHandoff(handoffId: string, updates: Partial<HandoffRequest>): HandoffRequest | null {
      const handoff = handoffs.get(handoffId);

      if (!handoff) {
        return null;
      }

      Object.assign(handoff, updates);

      // Track completion time for metrics
      if (updates.completedAt && handoff.acceptedAt) {
        completionTimes.push(updates.completedAt - handoff.acceptedAt);
      }

      return handoff;
    },
  };
}

// ============================================
// Handoff Operations
// ============================================

const DEFAULT_TIMEOUT = 60000; // 60 seconds

/**
 * Initiate a handoff from one agent to another
 *
 * @param manager - Handoff manager
 * @param input - Handoff request input
 * @returns Created handoff request
 * @throws HandoffError if validation fails
 */
export function initiateHandoff(
  manager: HandoffManager,
  input: HandoffRequestInput
): HandoffRequest {
  // Validate target agent exists
  // Note: We get registry from manager's closure, but for simplicity we'll
  // pass it separately in the test setup. For now, we'll check via manager methods.

  const now = Date.now();
  const timeout = input.timeout ?? DEFAULT_TIMEOUT;

  const handoff: HandoffRequest = {
    id: `handoff-${nanoid()}`,
    sourceAgent: input.sourceAgent,
    targetAgent: input.targetAgent,
    tenantId: input.tenantId,
    task: input.task,
    context: input.context,
    status: 'pending',
    createdAt: now,
    expiresAt: now + timeout,
    parentHandoffId: input.parentHandoffId,
  };

  manager._addHandoff(handoff);

  return handoff;
}

/**
 * Create a handoff manager with registry validation
 *
 * This is a factory that creates a manager with validation capabilities.
 */
export function createHandoffManagerWithValidation(registry: AgentRegistry): HandoffManager {
  const baseManager = createHandoffManager(registry);

  // Wrap _addHandoff to add validation
  const originalAddHandoff = baseManager._addHandoff.bind(baseManager);

  baseManager._addHandoff = (handoff: HandoffRequest) => {
    // Validate target agent exists
    const targetAgent = registry.getAgent(handoff.targetAgent);

    if (!targetAgent) {
      throw new HandoffError(
        `Target agent ${handoff.targetAgent} not found`,
        'TARGET_NOT_FOUND'
      );
    }

    // Validate tenant isolation
    if (targetAgent.tenantId !== handoff.tenantId) {
      throw new HandoffError(
        `Target agent ${handoff.targetAgent} belongs to different tenant`,
        'TENANT_MISMATCH'
      );
    }

    originalAddHandoff(handoff);
  };

  return baseManager;
}

// Re-export base manager for tests that need non-validating version
export { createHandoffManager as _createHandoffManagerBase };

/**
 * Accept a pending handoff
 *
 * @param manager - Handoff manager
 * @param handoffId - Handoff to accept
 * @param agentId - Agent accepting the handoff
 * @returns Updated handoff
 * @throws HandoffError if acceptance fails
 */
export function acceptHandoff(
  manager: HandoffManager,
  handoffId: string,
  agentId: string
): HandoffRequest {
  const handoff = manager.getHandoff(handoffId);

  if (!handoff) {
    throw new HandoffError(`Handoff ${handoffId} not found`, 'NOT_FOUND');
  }

  if (handoff.targetAgent !== agentId) {
    throw new HandoffError(
      `Agent ${agentId} is not the target of this handoff`,
      'UNAUTHORIZED'
    );
  }

  if (handoff.status !== 'pending') {
    throw new HandoffError(
      `Handoff is not in pending state (current: ${handoff.status})`,
      'INVALID_STATE'
    );
  }

  const updated = manager._updateHandoff(handoffId, {
    status: 'accepted',
    acceptedAt: Date.now(),
  });

  if (!updated) {
    throw new HandoffError('Failed to update handoff', 'UPDATE_FAILED');
  }

  return updated;
}

/**
 * Reject a pending handoff
 *
 * @param manager - Handoff manager
 * @param handoffId - Handoff to reject
 * @param agentId - Agent rejecting the handoff
 * @param reason - Rejection reason
 * @returns Updated handoff
 * @throws HandoffError if rejection fails
 */
export function rejectHandoff(
  manager: HandoffManager,
  handoffId: string,
  agentId: string,
  reason: string
): HandoffRequest {
  const handoff = manager.getHandoff(handoffId);

  if (!handoff) {
    throw new HandoffError(`Handoff ${handoffId} not found`, 'NOT_FOUND');
  }

  if (handoff.targetAgent !== agentId) {
    throw new HandoffError(
      `Agent ${agentId} is not the target of this handoff`,
      'UNAUTHORIZED'
    );
  }

  if (handoff.status === 'completed' || handoff.status === 'failed') {
    throw new HandoffError(
      `Cannot reject a ${handoff.status} handoff`,
      'INVALID_STATE'
    );
  }

  const updated = manager._updateHandoff(handoffId, {
    status: 'rejected',
    rejectionReason: reason,
  });

  if (!updated) {
    throw new HandoffError('Failed to update handoff', 'UPDATE_FAILED');
  }

  return updated;
}

/**
 * Complete a handoff with results
 *
 * @param manager - Handoff manager
 * @param handoffId - Handoff to complete
 * @param agentId - Agent completing the handoff
 * @param result - Task result
 * @returns Updated handoff
 * @throws HandoffError if completion fails
 */
export function completeHandoff(
  manager: HandoffManager,
  handoffId: string,
  agentId: string,
  result: HandoffResult
): HandoffRequest {
  const handoff = manager.getHandoff(handoffId);

  if (!handoff) {
    throw new HandoffError(`Handoff ${handoffId} not found`, 'NOT_FOUND');
  }

  if (handoff.targetAgent !== agentId) {
    throw new HandoffError(
      `Agent ${agentId} is not the target of this handoff`,
      'UNAUTHORIZED'
    );
  }

  if (handoff.status !== 'accepted') {
    throw new HandoffError(
      `Handoff must be accepted before completion (current: ${handoff.status})`,
      'INVALID_STATE'
    );
  }

  const updated = manager._updateHandoff(handoffId, {
    status: 'completed',
    completedAt: Date.now(),
    result,
  });

  if (!updated) {
    throw new HandoffError('Failed to update handoff', 'UPDATE_FAILED');
  }

  return updated;
}

/**
 * Get the current status of a handoff
 *
 * @param manager - Handoff manager
 * @param handoffId - Handoff to check
 * @returns Handoff status or null if not found
 */
export function getHandoffStatus(
  manager: HandoffManager,
  handoffId: string
): HandoffStatus | null {
  const handoff = manager.getHandoff(handoffId);
  return handoff?.status ?? null;
}

/**
 * Get all pending handoffs for an agent
 *
 * @param manager - Handoff manager
 * @param agentId - Agent to check
 * @returns List of pending handoffs
 */
export function getPendingHandoffs(
  manager: HandoffManager,
  agentId: string
): HandoffRequest[] {
  return manager
    .getHandoffsForAgent(agentId)
    .filter((h) => h.targetAgent === agentId && h.status === 'pending');
}

/**
 * Cancel a pending handoff (by source agent)
 *
 * @param manager - Handoff manager
 * @param handoffId - Handoff to cancel
 * @param agentId - Agent cancelling (must be source)
 * @returns Updated handoff
 * @throws HandoffError if cancellation fails
 */
export function cancelHandoff(
  manager: HandoffManager,
  handoffId: string,
  agentId: string
): HandoffRequest {
  const handoff = manager.getHandoff(handoffId);

  if (!handoff) {
    throw new HandoffError(`Handoff ${handoffId} not found`, 'NOT_FOUND');
  }

  if (handoff.sourceAgent !== agentId) {
    throw new HandoffError(
      `Only source agent can cancel handoff`,
      'UNAUTHORIZED'
    );
  }

  if (handoff.status !== 'pending') {
    throw new HandoffError(
      `Can only cancel pending handoffs (current: ${handoff.status})`,
      'INVALID_STATE'
    );
  }

  const updated = manager._updateHandoff(handoffId, {
    status: 'failed',
    result: { success: false, error: 'Cancelled by source agent' },
    completedAt: Date.now(),
  });

  if (!updated) {
    throw new HandoffError('Failed to update handoff', 'UPDATE_FAILED');
  }

  return updated;
}
