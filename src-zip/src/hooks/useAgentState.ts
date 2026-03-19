/**
 * useAgentState - Hook for managing AI agent state visualization
 *
 * Processes SSE events from the backend to build a real-time view of:
 * - Tool calls
 * - MCP server interactions
 * - A2A protocol events
 * - Thinking/reasoning phases
 */

import { useState, useCallback, useRef } from 'react';
import type { AgentState, AgentEvent, AgentEventType, AgentEventStatus } from '../components/chat/AgentStateVisualization';
import { componentUpdateBus } from '@/lib/generative-ui/update-bus';
import type { UpdateAction } from '@/lib/generative-ui/update-bus';

// Generate unique IDs
function generateEventId(): string {
  return `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export interface UseAgentStateOptions {
  maxEvents?: number; // Maximum events to keep in history
  autoCleanup?: boolean; // Clean up completed events
}

export function useAgentState(options: UseAgentStateOptions = {}) {
  const { maxEvents = 50, autoCleanup = true } = options;

  const [state, setState] = useState<AgentState>({
    isThinking: false,
    currentPhase: '',
    events: [],
    activeTools: [],
    mcpConnections: [],
    a2aAgents: [],
  });

  // Track running events for duration calculation
  const eventStartTimes = useRef<Map<string, number>>(new Map());

  /**
   * Start thinking phase
   */
  const startThinking = useCallback((phase: string = 'Analyzing...') => {
    setState((prev) => ({
      ...prev,
      isThinking: true,
      currentPhase: phase,
    }));
  }, []);

  /**
   * Stop thinking
   */
  const stopThinking = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isThinking: false,
      currentPhase: '',
    }));
  }, []);

  /**
   * Add a new event
   */
  const addEvent = useCallback(
    (event: Omit<AgentEvent, 'id' | 'timestamp'>): string => {
      const id = generateEventId();
      const timestamp = new Date();

      if (event.status === 'running') {
        eventStartTimes.current.set(id, Date.now());
      }

      setState((prev) => {
        const newEvents = [
          ...prev.events,
          { ...event, id, timestamp } as AgentEvent,
        ].slice(-maxEvents);

        // Track active tools
        const activeTools =
          event.type === 'tool_start' && event.data.toolName
            ? [...prev.activeTools, event.data.toolName]
            : prev.activeTools;

        return {
          ...prev,
          events: newEvents,
          activeTools,
        };
      });

      return id;
    },
    [maxEvents]
  );

  /**
   * Update an existing event
   */
  const updateEvent = useCallback(
    (id: string, updates: Partial<Omit<AgentEvent, 'id' | 'timestamp'>>) => {
      setState((prev) => {
        const events = prev.events.map((event) => {
          if (event.id !== id) return event;

          // Calculate duration if completing
          let duration = event.duration;
          if (
            updates.status &&
            ['completed', 'failed'].includes(updates.status) &&
            eventStartTimes.current.has(id)
          ) {
            duration = Date.now() - eventStartTimes.current.get(id)!;
            eventStartTimes.current.delete(id);
          }

          return {
            ...event,
            ...updates,
            duration,
            data: { ...event.data, ...updates.data },
          };
        });

        // Remove tool from active list if completed
        let activeTools = prev.activeTools;
        if (updates.status && ['completed', 'failed'].includes(updates.status)) {
          const completedEvent = events.find((e) => e.id === id);
          if (completedEvent?.data.toolName) {
            activeTools = activeTools.filter(
              (t) => t !== completedEvent.data.toolName
            );
          }
        }

        return { ...prev, events, activeTools };
      });
    },
    []
  );

  /**
   * Process an SSE event from the backend
   */
  const processSSEEvent = useCallback(
    (data: Record<string, unknown>) => {
      const eventType = data.type as string;

      switch (eventType) {
        case 'thinking_start':
          startThinking(data.phase as string);
          break;

        case 'thinking_end':
          stopThinking();
          break;

        case 'tool_start':
          addEvent({
            type: 'tool_start',
            status: 'running',
            data: {
              toolName: data.tool_name as string,
              name: data.tool_name as string,
              description: data.description as string,
              input: data.input as Record<string, unknown>,
            },
          });
          break;

        case 'tool_end': {
          // Find the matching start event
          setState((prev) => {
            const startEvent = [...prev.events]
              .reverse()
              .find(
                (e) =>
                  e.type === 'tool_start' &&
                  e.data.toolName === data.tool_name &&
                  e.status === 'running'
              );

            if (startEvent) {
              updateEvent(startEvent.id, {
                type: 'tool_end',
                status: data.error ? 'failed' : 'completed',
                data: {
                  output: data.result,
                  error: data.error as string,
                },
              });
            }

            return prev;
          });
          break;
        }

        case 'mcp_call':
          addEvent({
            type: 'mcp_call',
            status: 'running',
            data: {
              serverName: data.server as string,
              method: data.method as string,
              name: `${data.server}/${data.method}`,
              input: data.params as Record<string, unknown>,
            },
          });
          // Track MCP connection
          setState((prev) => ({
            ...prev,
            mcpConnections: Array.from(
              new Set([...prev.mcpConnections, data.server as string])
            ),
          }));
          break;

        case 'mcp_result': {
          setState((prev) => {
            const startEvent = [...prev.events]
              .reverse()
              .find(
                (e) =>
                  e.type === 'mcp_call' &&
                  e.data.serverName === data.server &&
                  e.status === 'running'
              );

            if (startEvent) {
              updateEvent(startEvent.id, {
                type: 'mcp_result',
                status: data.error ? 'failed' : 'completed',
                data: {
                  output: data.result,
                  error: data.error as string,
                },
              });
            }

            return prev;
          });
          break;
        }

        case 'a2a_task_update':
          addEvent({
            type: 'a2a_task_update',
            status: mapA2AStatus(data.status as string),
            data: {
              taskId: data.task_id as string,
              taskStatus: data.status as string,
              agentId: data.agent_id as string,
              name: `Task ${data.task_id}`,
              description: data.message as string,
            },
          });
          // Track A2A agent
          if (data.agent_id) {
            setState((prev) => ({
              ...prev,
              a2aAgents: Array.from(
                new Set([...prev.a2aAgents, data.agent_id as string])
              ),
            }));
          }
          break;

        case 'a2a_artifact':
          addEvent({
            type: 'a2a_artifact',
            status: 'completed',
            data: {
              taskId: data.task_id as string,
              name: data.artifact_type as string || 'Artifact',
              output: data.data,
            },
          });
          break;

        case 'error':
          addEvent({
            type: 'error',
            status: 'failed',
            data: {
              name: 'Error',
              error: data.message as string,
            },
          });
          break;

        case 'component_update': {
          // Handle Tambo-style component updates via the update bus
          const payload = data.payload as {
            componentId: string;
            updates: Record<string, unknown>;
            action: UpdateAction;
          } | undefined;

          // Support both nested payload and flat structure
          const componentId = payload?.componentId ?? (data.componentId as string);
          const updates = payload?.updates ?? (data.updates as Record<string, unknown>);
          const action = payload?.action ?? (data.action as UpdateAction) ?? 'update';

          if (componentId && updates) {
            componentUpdateBus.emit(componentId, updates, action);
          }
          break;
        }
      }
    },
    [addEvent, updateEvent, startThinking, stopThinking]
  );

  /**
   * Clear all events
   */
  const clearEvents = useCallback(() => {
    setState((prev) => ({
      ...prev,
      events: [],
      activeTools: [],
    }));
    eventStartTimes.current.clear();
  }, []);

  /**
   * Reset entire state
   */
  const reset = useCallback(() => {
    setState({
      isThinking: false,
      currentPhase: '',
      events: [],
      activeTools: [],
      mcpConnections: [],
      a2aAgents: [],
    });
    eventStartTimes.current.clear();
  }, []);

  return {
    state,
    startThinking,
    stopThinking,
    addEvent,
    updateEvent,
    processSSEEvent,
    clearEvents,
    reset,
  };
}

/**
 * Map A2A task status to our event status
 */
function mapA2AStatus(a2aStatus: string): AgentEventStatus {
  switch (a2aStatus) {
    case 'submitted':
      return 'pending';
    case 'working':
      return 'running';
    case 'completed':
      return 'completed';
    case 'failed':
    case 'canceled':
      return 'failed';
    default:
      return 'pending';
  }
}

export default useAgentState;
