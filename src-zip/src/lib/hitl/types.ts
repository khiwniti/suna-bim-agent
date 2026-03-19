/**
 * HITL Types and Helpers
 *
 * Human-in-the-Loop types for inline user interaction in chat
 */

import { nanoid } from 'nanoid';

// ============================================
// HITL Types
// ============================================

/**
 * HITL Request types for inline user interaction
 */
export type HITLRequestType = 'confirmation' | 'choice' | 'parameter';

/**
 * HITL Request event payload
 */
export interface HITLRequestEvent {
  /** Unique request ID for tracking responses */
  requestId: string;
  /** Type of HITL request */
  type: HITLRequestType;
  /** Request payload specific to type */
  payload: HITLConfirmationPayload | HITLChoicePayload | HITLParameterPayload;
  /** Context about the request */
  context?: {
    agentName?: string;
    toolName?: string;
    operation?: string;
  };
}

/**
 * Confirmation request payload (yes/no decisions)
 */
export interface HITLConfirmationPayload {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  impact?: 'info' | 'warning' | 'danger';
  details?: string[];
}

/**
 * Choice request payload (multiple options)
 */
export interface HITLChoicePayload {
  question: string;
  options: Array<{
    id: string;
    label: string;
    description?: string;
    icon?: string;
    recommended?: boolean;
    meta?: string;
  }>;
  allowMultiple?: boolean;
  submitLabel?: string;
}

/**
 * Parameter request payload (form input)
 */
export interface HITLParameterPayload {
  title: string;
  description?: string;
  parameters: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'range';
    defaultValue?: string | number;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    required?: boolean;
  }>;
  submitLabel?: string;
  cancelLabel?: string;
}

// ============================================
// HITL Helper Functions
// ============================================

/**
 * Create a HITL confirmation request
 */
export function createHITLConfirmation(
  payload: HITLConfirmationPayload,
  context?: HITLRequestEvent['context']
): HITLRequestEvent {
  return {
    requestId: `hitl-${nanoid()}`,
    type: 'confirmation',
    payload,
    context,
  };
}

/**
 * Create a HITL choice request
 */
export function createHITLChoice(
  payload: HITLChoicePayload,
  context?: HITLRequestEvent['context']
): HITLRequestEvent {
  return {
    requestId: `hitl-${nanoid()}`,
    type: 'choice',
    payload,
    context,
  };
}

/**
 * Create a HITL parameter request
 */
export function createHITLParameter(
  payload: HITLParameterPayload,
  context?: HITLRequestEvent['context']
): HITLRequestEvent {
  return {
    requestId: `hitl-${nanoid()}`,
    type: 'parameter',
    payload,
    context,
  };
}
