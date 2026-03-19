/**
 * Event Types for AI Streaming System
 *
 * Defines the state machine phases, valid transitions, and event types
 * for the agent response streaming system.
 */

import type {
  ToolCallVisualization,
  GenerativeUIComponent,
} from '@/lib/generative-ui/types';

// ============================================================================
// Agent Phase State Machine
// ============================================================================

/**
 * Agent execution phases representing the state machine states
 */
export type AgentPhase =
  | 'idle' // No active processing
  | 'thinking' // Initial processing, understanding request
  | 'reasoning' // Extended thinking / chain-of-thought
  | 'tool_calling' // Preparing to call a tool
  | 'tool_executing' // Tool is running
  | 'synthesizing' // Combining results
  | 'responding' // Generating final response
  | 'error'; // Error state

/**
 * Valid state transitions for the agent phase state machine
 *
 * The state machine follows this general flow:
 * idle → thinking → (reasoning | tool_calling | responding)
 *                    ↓                ↓
 *              tool_calling → tool_executing → (tool_calling | synthesizing)
 *                                                              ↓
 *                                                         responding → idle
 *
 * Any state can transition to 'error', and 'error' can recover to 'idle'
 */
export const VALID_TRANSITIONS: Record<AgentPhase, AgentPhase[]> = {
  idle: ['thinking', 'error'],
  thinking: ['reasoning', 'tool_calling', 'responding', 'synthesizing', 'error'],
  reasoning: ['tool_calling', 'responding', 'synthesizing', 'error'],
  tool_calling: ['tool_executing', 'error'],
  tool_executing: ['tool_calling', 'synthesizing', 'responding', 'error'],
  synthesizing: ['responding', 'error'],
  responding: ['idle', 'error'],
  error: ['idle'],
};

/**
 * Check if a state transition is valid
 */
export function isValidTransition(from: AgentPhase, to: AgentPhase): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

// ============================================================================
// Agent State
// ============================================================================

/**
 * Current state of the agent during streaming
 */
export interface AgentState {
  /** Current phase of execution */
  phase: AgentPhase;
  /** Currently executing tool, if any */
  currentTool: ToolCallVisualization | null;
  /** Tools queued for execution */
  pendingTools: ToolCallVisualization[];
  /** Completed tool executions */
  completedTools: ToolCallVisualization[];
  /** Current reasoning/thinking text being streamed */
  reasoning: string | null;
  /** Progress percentage (0-100) */
  progress: number;
  /** Error information if in error state */
  error: AgentError | null;
  /** When the current operation started */
  startedAt: Date | null;
}

/**
 * Error information for error state
 */
export interface AgentError {
  code: string;
  message: string;
  recoverable: boolean;
  details?: Record<string, unknown>;
}

/**
 * Initial agent state
 */
export const INITIAL_AGENT_STATE: AgentState = {
  phase: 'idle',
  currentTool: null,
  pendingTools: [],
  completedTools: [],
  reasoning: null,
  progress: 0,
  error: null,
  startedAt: null,
};

// ============================================================================
// Server Events (SSE from backend)
// ============================================================================

/**
 * Base event structure for all server events
 */
interface BaseServerEvent {
  timestamp: string;
  messageId: string;
}

/**
 * Server event: Phase changed
 */
export interface PhaseChangeEvent extends BaseServerEvent {
  type: 'phase_change';
  payload: {
    from: AgentPhase;
    to: AgentPhase;
    reason?: string;
  };
}

/**
 * Server event: Text token streamed
 */
export interface TextDeltaEvent extends BaseServerEvent {
  type: 'text_delta';
  payload: {
    content: string;
    role: 'assistant' | 'reasoning';
  };
}

/**
 * Server event: Reasoning/thinking content
 */
export interface ReasoningEvent extends BaseServerEvent {
  type: 'reasoning';
  payload: {
    content: string;
    isComplete: boolean;
  };
}

/**
 * Server event: Tool call started
 */
export interface ToolCallStartEvent extends BaseServerEvent {
  type: 'tool_call_start';
  payload: {
    toolId: string;
    toolName: string;
    arguments: Record<string, unknown>;
    description?: string;
  };
}

/**
 * Server event: Tool call progress update
 */
export interface ToolCallProgressEvent extends BaseServerEvent {
  type: 'tool_call_progress';
  payload: {
    toolId: string;
    progress: number;
    status?: string;
  };
}

/**
 * Server event: Tool call completed
 */
export interface ToolCallCompleteEvent extends BaseServerEvent {
  type: 'tool_call_complete';
  payload: {
    toolId: string;
    result: unknown;
    duration: number;
  };
}

/**
 * Server event: Tool call failed
 */
export interface ToolCallErrorEvent extends BaseServerEvent {
  type: 'tool_call_error';
  payload: {
    toolId: string;
    error: string;
    recoverable: boolean;
  };
}

/**
 * Server event: Generative UI component
 */
export interface UIComponentEvent extends BaseServerEvent {
  type: 'ui_component';
  payload: {
    component: GenerativeUIComponent;
    insertPosition?: 'inline' | 'after' | 'replace';
    targetId?: string;
  };
}

/**
 * Server event: Component update for existing UI components
 *
 * Used to update props of already-rendered generative UI components
 * without replacing the entire component (Tambo-style reactive updates)
 */
export interface ComponentUpdateEvent extends BaseServerEvent {
  type: 'component_update';
  payload: {
    /** ID of the component instance to update */
    componentId: string;
    /** Type of component being updated (e.g., 'bim.CarbonResultCard') */
    componentType: string;
    /** Partial props to merge into the component */
    updates: Record<string, unknown>;
    /** Action to perform: update props, remove component, or replace entirely */
    action: 'update' | 'remove' | 'replace';
  };
}

/**
 * Server event: Stream completed
 */
export interface StreamCompleteEvent extends BaseServerEvent {
  type: 'stream_complete';
  payload: {
    totalTokens?: number;
    duration: number;
    toolsUsed: string[];
  };
}

/**
 * Server event: Stream error
 */
export interface StreamErrorEvent extends BaseServerEvent {
  type: 'stream_error';
  payload: {
    code: string;
    message: string;
    recoverable: boolean;
  };
}

/**
 * Server event: Heartbeat/ping
 */
export interface HeartbeatEvent {
  type: 'heartbeat';
  timestamp: string;
}

/**
 * Union type for all server events
 */
export type ServerEvent =
  | PhaseChangeEvent
  | TextDeltaEvent
  | ReasoningEvent
  | ToolCallStartEvent
  | ToolCallProgressEvent
  | ToolCallCompleteEvent
  | ToolCallErrorEvent
  | UIComponentEvent
  | ComponentUpdateEvent
  | StreamCompleteEvent
  | StreamErrorEvent
  | HeartbeatEvent;

// ============================================================================
// Client Events (Sent to backend)
// ============================================================================

/**
 * Client event: Start a new message stream
 */
export interface StartStreamEvent {
  type: 'start_stream';
  payload: {
    message: string;
    conversationId: string;
    context?: Record<string, unknown>;
  };
}

/**
 * Client event: Cancel current stream
 */
export interface CancelStreamEvent {
  type: 'cancel_stream';
  payload: {
    messageId: string;
    reason?: string;
  };
}

/**
 * Client event: Retry failed stream
 */
export interface RetryStreamEvent {
  type: 'retry_stream';
  payload: {
    messageId: string;
    fromPhase?: AgentPhase;
  };
}

/**
 * Client event: Acknowledge received event
 */
export interface AckEvent {
  type: 'ack';
  payload: {
    eventId: string;
    receivedAt: string;
  };
}

/**
 * Union type for all client events
 */
export type ClientEvent =
  | StartStreamEvent
  | CancelStreamEvent
  | RetryStreamEvent
  | AckEvent;

// ============================================================================
// Connection State
// ============================================================================

/**
 * Connection state for the streaming transport
 */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * Connection status with metadata
 */
export interface ConnectionStatus {
  state: ConnectionState;
  lastConnectedAt: Date | null;
  reconnectAttempts: number;
  error?: string;
}

// ============================================================================
// Timeline / Workflow Events
// ============================================================================

/**
 * Workflow step for timeline visualization
 */
export interface WorkflowStep {
  id: string;
  phase: AgentPhase;
  label: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'active' | 'completed' | 'error';
  details?: string;
  toolInfo?: ToolCallVisualization;
}

/**
 * Agent workflow event for timeline tracking
 */
export type AgentWorkflowEvent =
  | {
      type: 'workflow_start';
      messageId: string;
      timestamp: Date;
    }
  | {
      type: 'step_start';
      step: WorkflowStep;
    }
  | {
      type: 'step_update';
      stepId: string;
      updates: Partial<WorkflowStep>;
    }
  | {
      type: 'step_complete';
      stepId: string;
      result?: unknown;
    }
  | {
      type: 'workflow_complete';
      messageId: string;
      duration: number;
      steps: WorkflowStep[];
    }
  | {
      type: 'workflow_error';
      messageId: string;
      error: AgentError;
      failedStep?: string;
    };

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if an event is a server event
 */
export function isServerEvent(event: unknown): event is ServerEvent {
  if (typeof event !== 'object' || event === null) return false;
  const e = event as Record<string, unknown>;
  return (
    typeof e.type === 'string' &&
    [
      'phase_change',
      'text_delta',
      'reasoning',
      'tool_call_start',
      'tool_call_progress',
      'tool_call_complete',
      'tool_call_error',
      'ui_component',
      'component_update',
      'stream_complete',
      'stream_error',
      'heartbeat',
    ].includes(e.type)
  );
}

/**
 * Type guard to check if an event is a client event
 */
export function isClientEvent(event: unknown): event is ClientEvent {
  if (typeof event !== 'object' || event === null) return false;
  const e = event as Record<string, unknown>;
  return (
    typeof e.type === 'string' &&
    ['start_stream', 'cancel_stream', 'retry_stream', 'ack'].includes(e.type)
  );
}
