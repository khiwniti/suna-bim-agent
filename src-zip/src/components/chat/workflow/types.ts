/**
 * Workflow Visualization Types
 *
 * Shared types for workflow timeline and node components.
 */

import type { ToolCallVisualization } from '@/lib/generative-ui/types';

/** Base event with timestamp */
interface BaseEvent {
  id: string;
  timestamp: Date;
}

/** Workflow start event */
export interface StartEvent extends BaseEvent {
  type: 'start';
}

/** Agent thinking/reasoning event */
export interface ThinkingEvent extends BaseEvent {
  type: 'thinking';
  content?: string;
  duration?: number;
}

/** Decision point event with branching */
export interface DecisionEvent extends BaseEvent {
  type: 'decision';
  question: string;
  options: string[];
  chosen: number;
  reasoning?: string;
}

/** Parallel execution start event */
export interface ParallelStartEvent extends BaseEvent {
  type: 'parallel_start';
  branches: string[];
}

/** Tool execution event */
export interface ToolExecutionEvent extends BaseEvent {
  type: 'tool_execution';
  toolCall: ToolCallVisualization;
}

/** Parallel execution end event */
export interface ParallelEndEvent extends BaseEvent {
  type: 'parallel_end';
  results: Record<string, unknown>;
  branchIds: string[];
}

/** Abandoned reasoning path event */
export interface AbandonedPathEvent extends BaseEvent {
  type: 'abandoned_path';
  reason: string;
  partialResult?: unknown;
  pathId: string;
}

/** Synthesis/convergence event */
export interface SynthesisEvent extends BaseEvent {
  type: 'synthesis';
  inputs: string[];
  output: string;
}

/** Response generation event */
export interface ResponseEvent extends BaseEvent {
  type: 'response';
  content: string;
  isStreaming?: boolean;
}

/** Workflow end event */
export interface EndEvent extends BaseEvent {
  type: 'end';
  totalDuration: number;
  success: boolean;
}

/** Union type of all workflow events */
export type AgentWorkflowEvent =
  | StartEvent
  | ThinkingEvent
  | DecisionEvent
  | ParallelStartEvent
  | ToolExecutionEvent
  | ParallelEndEvent
  | AbandonedPathEvent
  | SynthesisEvent
  | ResponseEvent
  | EndEvent;

/** View mode for workflow display */
export type ViewMode = 'simple' | 'detailed';

/** Node status for styling */
export type NodeStatus = 'pending' | 'active' | 'completed' | 'error' | 'abandoned';

/** Base props for workflow nodes */
export interface WorkflowNodeProps {
  id: string;
  status: NodeStatus;
  isExpanded?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
}
