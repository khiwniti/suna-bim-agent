/**
 * Agent State Machine Hook
 *
 * React hook for managing agent execution state with validated phase transitions.
 * Implements a state machine pattern for tracking:
 * - Agent phases (idle, thinking, reasoning, tool_calling, etc.)
 * - Tool call lifecycle (start, progress, complete)
 * - Reasoning accumulation
 * - Progress tracking
 * - Error handling with recovery
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import type { ToolCallVisualization } from '@/lib/generative-ui/types';
import {
  type AgentState,
  type AgentPhase,
  type AgentError,
  INITIAL_AGENT_STATE,
  isValidTransition,
} from '@/lib/streaming/event-types';

/**
 * Extended agent state with reasoning as array for accumulation
 */
interface AgentStateMachineState extends Omit<AgentState, 'reasoning'> {
  reasoning: string[] | null;
}

/**
 * Initial state for the state machine
 */
const INITIAL_STATE: AgentStateMachineState = {
  ...INITIAL_AGENT_STATE,
  reasoning: null,
};

/**
 * Return type for the useAgentStateMachine hook
 */
export interface UseAgentStateMachineReturn {
  /** Current state of the agent */
  state: AgentStateMachineState;

  /**
   * Transition to a new phase
   * @param to - Target phase
   * @returns true if transition succeeded, false if invalid
   */
  transition: (to: AgentPhase) => boolean;

  /**
   * Check if a transition to a phase is valid from current state
   * @param to - Target phase to check
   * @returns true if transition is valid
   */
  canTransitionTo: (to: AgentPhase) => boolean;

  /**
   * Start a new tool call
   * @param tool - Tool call visualization data
   */
  startToolCall: (tool: Omit<ToolCallVisualization, 'startedAt'>) => void;

  /**
   * Complete the current tool call
   * @param toolId - ID of the tool to complete
   * @param result - Result of the tool call
   */
  completeToolCall: (toolId: string, result: unknown) => void;

  /**
   * Update progress of the current tool
   * @param toolId - ID of the tool to update
   * @param progress - Progress percentage (0-100)
   */
  updateToolProgress: (toolId: string, progress: number) => void;

  /**
   * Add reasoning content
   * @param content - Reasoning text to append
   */
  addReasoning: (content: string) => void;

  /**
   * Set overall progress
   * @param progress - Progress percentage (0-100, clamped)
   */
  setProgress: (progress: number) => void;

  /**
   * Set error and transition to error phase
   * @param error - Error information
   */
  setError: (error: AgentError) => void;

  /**
   * Reset to initial state
   */
  reset: () => void;
}

/**
 * Hook for managing agent state machine with validated transitions
 *
 * @example
 * ```tsx
 * const { state, transition, startToolCall, completeToolCall, reset } = useAgentStateMachine();
 *
 * // Start processing
 * transition('thinking');
 *
 * // Start a tool call
 * transition('tool_calling');
 * startToolCall({ id: 'tool-1', name: 'analyzeCarbon', status: 'running' });
 *
 * // Execute and complete
 * transition('tool_executing');
 * completeToolCall('tool-1', { carbon: 150 });
 *
 * // Finish
 * transition('responding');
 * transition('idle');
 * reset();
 * ```
 */
export function useAgentStateMachine(): UseAgentStateMachineReturn {
  const [state, setState] = useState<AgentStateMachineState>(INITIAL_STATE);

  // Use ref to track phase synchronously for transition validation
  const phaseRef = useRef<AgentPhase>(INITIAL_STATE.phase);

  /**
   * Transition to a new phase with validation
   */
  const transition = useCallback((to: AgentPhase): boolean => {
    // Check validity using synchronous ref value
    if (!isValidTransition(phaseRef.current, to)) {
      return false;
    }

    // Update ref synchronously
    phaseRef.current = to;

    // Update state
    setState((prev) => ({
      ...prev,
      phase: to,
      // Set startedAt when leaving idle
      startedAt: prev.phase === 'idle' ? new Date() : prev.startedAt,
    }));

    return true;
  }, []);

  /**
   * Check if a transition is valid from current state
   */
  const canTransitionTo = useCallback(
    (to: AgentPhase): boolean => {
      return isValidTransition(state.phase, to);
    },
    [state.phase]
  );

  /**
   * Start a new tool call
   */
  const startToolCall = useCallback(
    (tool: Omit<ToolCallVisualization, 'startedAt'>): void => {
      setState((prev) => ({
        ...prev,
        currentTool: {
          ...tool,
          startedAt: new Date(),
        },
      }));
    },
    []
  );

  /**
   * Complete the current tool call and move to completed list
   */
  const completeToolCall = useCallback(
    (toolId: string, result: unknown): void => {
      setState((prev) => {
        // Only complete if current tool matches
        if (!prev.currentTool || prev.currentTool.id !== toolId) {
          return prev;
        }

        const completedTool: ToolCallVisualization = {
          ...prev.currentTool,
          status: 'success',
          result,
          completedAt: new Date(),
        };

        return {
          ...prev,
          currentTool: null,
          completedTools: [...prev.completedTools, completedTool],
        };
      });
    },
    []
  );

  /**
   * Update tool progress
   */
  const updateToolProgress = useCallback(
    (toolId: string, progress: number): void => {
      setState((prev) => {
        // Only update if current tool matches
        if (!prev.currentTool || prev.currentTool.id !== toolId) {
          return prev;
        }

        return {
          ...prev,
          currentTool: {
            ...prev.currentTool,
            progress,
          },
        };
      });
    },
    []
  );

  /**
   * Add reasoning content to the accumulator
   */
  const addReasoning = useCallback((content: string): void => {
    setState((prev) => ({
      ...prev,
      reasoning: prev.reasoning ? [...prev.reasoning, content] : [content],
    }));
  }, []);

  /**
   * Set overall progress (clamped to 0-100)
   */
  const setProgress = useCallback((progress: number): void => {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    setState((prev) => ({
      ...prev,
      progress: clampedProgress,
    }));
  }, []);

  /**
   * Set error and transition to error phase
   */
  const setError = useCallback((error: AgentError): void => {
    setState((prev) => ({
      ...prev,
      phase: 'error',
      error,
    }));
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback((): void => {
    phaseRef.current = INITIAL_STATE.phase;
    setState(INITIAL_STATE);
  }, []);

  /**
   * Memoized return value
   */
  const returnValue = useMemo<UseAgentStateMachineReturn>(
    () => ({
      state,
      transition,
      canTransitionTo,
      startToolCall,
      completeToolCall,
      updateToolProgress,
      addReasoning,
      setProgress,
      setError,
      reset,
    }),
    [
      state,
      transition,
      canTransitionTo,
      startToolCall,
      completeToolCall,
      updateToolProgress,
      addReasoning,
      setProgress,
      setError,
      reset,
    ]
  );

  return returnValue;
}
