/**
 * AI Streaming System - Module Index
 *
 * Barrel export for all streaming components.
 *
 * @example
 * ```typescript
 * import {
 *   TransportManager,
 *   ReconnectionManager,
 *   AgentPhase,
 *   ServerEvent,
 *   VALID_TRANSITIONS,
 *   DEFAULT_TRANSPORT_CONFIG,
 * } from '@/lib/streaming';
 * ```
 */

// ============================================================================
// Event Types
// ============================================================================
export {
  // Types
  type AgentPhase,
  type AgentState,
  type AgentError,
  type PhaseChangeEvent,
  type TextDeltaEvent,
  type ReasoningEvent,
  type ToolCallStartEvent,
  type ToolCallProgressEvent,
  type ToolCallCompleteEvent,
  type ToolCallErrorEvent,
  type UIComponentEvent,
  type StreamCompleteEvent,
  type StreamErrorEvent,
  type HeartbeatEvent,
  type ServerEvent,
  type StartStreamEvent,
  type CancelStreamEvent,
  type RetryStreamEvent,
  type AckEvent,
  type ClientEvent,
  type ConnectionState,
  type ConnectionStatus,
  type WorkflowStep,
  type AgentWorkflowEvent,
  // Constants
  VALID_TRANSITIONS,
  INITIAL_AGENT_STATE,
  // Functions
  isValidTransition,
  isServerEvent,
  isClientEvent,
} from './event-types';

// ============================================================================
// Reconnection Manager
// ============================================================================
export {
  ReconnectionManager,
  type ReconnectionConfig,
  DEFAULT_RECONNECTION_CONFIG,
} from './reconnection';

// ============================================================================
// Transport Manager
// ============================================================================
export {
  TransportManager,
  type TransportConfig,
  type EventHandler,
  type StateChangeHandler,
  DEFAULT_TRANSPORT_CONFIG,
} from './transport-manager';
