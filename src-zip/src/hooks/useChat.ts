/**
 * useChat Hook
 *
 * Manages chat with the BIM Agent via streaming API.
 * Integrates with the agent state machine for phase tracking
 * and workflow visualization.
 *
 * ★ Insight ─────────────────────────────────────
 * The hook now bridges SSE events to the state machine, enabling:
 * 1. Phase-aware UI (thinking indicators, tool cards)
 * 2. Workflow timeline visualization
 * 3. Proper error recovery with phase validation
 * ─────────────────────────────────────────────────
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { generateId } from '@/lib/utils';
import { useCSRFHeaders } from '@/hooks/useCSRF';
import { useAgentStateMachine } from '@/hooks/useAgentStateMachine';
import { useToolPanelBridge } from '@/hooks/useToolPanelBridge';
import type { ToolCallVisualization } from '@/lib/generative-ui/types';

interface UseChatOptions {
  conversationId?: string;
  projectContext?: Record<string, unknown>;
  onMessage?: (content: string) => void;
  onUICommand?: (command: { type: string; data: unknown }) => void;
  onError?: (error: Error) => void;
  onPhaseChange?: (phase: string) => void;
  onToolCall?: (tool: ToolCallVisualization) => void;
}

interface UseChatReturn {
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  currentAgent: string | null;
  abort: () => void;
  /** Current agent phase from state machine */
  phase: string;
  /** Current tool being executed */
  currentTool: ToolCallVisualization | null;
  /** List of completed tools in this session */
  completedTools: ToolCallVisualization[];
  /** Reset state machine to idle */
  resetState: () => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const csrfHeaders = useCSRFHeaders();

  // Ref to track current agent for use in callbacks (avoids stale closure)
  const currentAgentRef = useRef<string | null>(null);

  // State machine integration
  const {
    state: agentState,
    transition,
    startToolCall,
    completeToolCall,
    updateToolProgress,
    addReasoning,
    setError: setAgentError,
    reset: resetAgentState,
  } = useAgentStateMachine();

  // Tool→Panel bridge for auto-activating panels on tool completion
  const { onToolComplete, onToolStart } = useToolPanelBridge();

  const abortControllerRef = useRef<AbortController | null>(null);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const addWorkflowEvent = useChatStore((state) => state.addWorkflowEvent);
  const clearWorkflowEvents = useChatStore((state) => state.clearWorkflowEvents);

  // Shared agent state actions (sync with HeadlessChat/AgentStateVisualization)
  const setAgentPhase = useChatStore((state) => state.setAgentPhase);
  const setAgentCurrentTool = useChatStore((state) => state.setAgentCurrentTool);
  const addAgentCompletedTool = useChatStore((state) => state.addAgentCompletedTool);
  const storeResetAgentState = useChatStore((state) => state.resetAgentState);

  // Notify on phase changes
  useEffect(() => {
    options.onPhaseChange?.(agentState.phase);
  }, [agentState.phase, options]);

  // Sync local state machine phase changes to shared store
  // This ensures HeadlessChat/AgentStateVisualization sees the same state
  useEffect(() => {
    setAgentPhase(agentState.phase);
  }, [agentState.phase, setAgentPhase]);

  // Sync current tool to shared store
  useEffect(() => {
    setAgentCurrentTool(agentState.currentTool);
  }, [agentState.currentTool, setAgentCurrentTool]);

  // Sync completed tools to shared store (when a new one is added)
  const prevCompletedToolsLength = useRef(agentState.completedTools.length);
  useEffect(() => {
    // Only add new completed tools to avoid duplicates
    if (agentState.completedTools.length > prevCompletedToolsLength.current) {
      const newTools = agentState.completedTools.slice(prevCompletedToolsLength.current);
      newTools.forEach(tool => addAgentCompletedTool(tool));
    }
    prevCompletedToolsLength.current = agentState.completedTools.length;
  }, [agentState.completedTools, addAgentCompletedTool]);

  const sendMessage = useCallback(
    async (content: string) => {
      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      resetAgentState();
      storeResetAgentState(); // Reset shared store too
      clearWorkflowEvents();

      // Transition to thinking phase (store sync via useEffect)
      transition('thinking');

      // Add workflow start event (compatible with WorkflowTimeline)
      const messageId = generateId();
      addWorkflowEvent({
        id: `start-${messageId}`,
        type: 'start',
        timestamp: new Date(),
      });

      // Add user message to store
      const userMessageId = generateId();
      addMessage({
        id: userMessageId,
        role: 'user',
        content,
        timestamp: new Date(),
      });

      // Create assistant message placeholder
      const assistantMessageId = generateId();
      addMessage({
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        metadata: { isStreaming: true },
      });

      let accumulatedContent = '';
      const startTime = Date.now();

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...csrfHeaders,
          },
          body: JSON.stringify({
            message: content,
            conversationId: options.conversationId,
            projectContext: options.projectContext,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        // Handle SSE stream
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response stream');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                switch (data.type) {
                  case 'thinking':
                  case 'agent_thinking':
                    currentAgentRef.current = data.agent || data.agentName || null;
                    setCurrentAgent(data.agent || data.agentName);
                    transition('thinking');
                    // Add workflow event compatible with WorkflowTimeline
                    addWorkflowEvent({
                      id: `thinking-${Date.now()}`,
                      type: 'thinking',
                      content: data.content || `${data.agent || 'Agent'} is analyzing your request...`,
                      timestamp: new Date(),
                    });
                    break;

                  // DEPRECATED: API does not emit 'reasoning' or 'chain_of_thought' events
                  // These were planned but never implemented in the LangGraph API
                  // Keeping as comments for future reference if API adds this
                  // case 'reasoning':
                  // case 'chain_of_thought':
                  //   transition('reasoning');
                  //   addReasoning(data.content || data.thought);
                  //   break;

                  // DEPRECATED: API does not emit 'plan' or 'execution_plan' events
                  // Plans are embedded in message content, not separate events
                  // case 'plan':
                  // case 'execution_plan':
                  //   transition('thinking');
                  //   const planContent = typeof data.plan === 'string'
                  //     ? data.plan : JSON.stringify(data.plan, null, 2);
                  //   accumulatedContent += `\n\n**Execution Plan:**\n${planContent}`;
                  //   updateMessage(assistantMessageId, { content: accumulatedContent });
                  //   break;

                  case 'tool_call_start':
                  case 'tool_start':
                  case 'function_call':
                    transition('tool_calling');
                    const toolId = data.toolId || data.id || data.call_id || generateId();
                    const toolName = data.toolName || data.name || data.function_name || 'unknown_tool';
                    const toolData: Omit<ToolCallVisualization, 'startedAt'> = {
                      id: toolId,
                      name: toolName,
                      status: 'running',
                      arguments: data.arguments || data.args || data.input,
                      description: data.description || `Executing ${toolName}`,
                    };
                    startToolCall(toolData);
                    // Notify tool→panel bridge about tool start
                    onToolStart({ id: toolId, name: toolName });
                    options.onToolCall?.({
                      ...toolData,
                      startedAt: new Date(),
                    });
                    // Add workflow event compatible with WorkflowTimeline
                    addWorkflowEvent({
                      id: toolId,
                      type: 'tool_execution',
                      toolCall: { ...toolData, startedAt: new Date() },
                      timestamp: new Date(),
                    });
                    transition('tool_executing');
                    break;

                  // DEPRECATED: API does not emit 'tool_call_progress' events
                  // Tool execution is atomic - only start and complete events
                  // case 'tool_call_progress':
                  //   updateToolProgress(data.toolId, data.progress);
                  //   break;

                  case 'tool_call_complete':
                  case 'tool_complete':
                  case 'tool_result':
                  case 'function_result':
                    const completeToolId = data.toolId || data.id || data.call_id;
                    const completeToolName = data.toolName || data.name || 'unknown_tool';
                    completeToolCall(completeToolId, data.result || data.output);
                    // Trigger panel activation for successful tool completion
                    onToolComplete({
                      id: completeToolId,
                      name: completeToolName,
                      status: data.error ? 'error' : 'success',
                      result: data.result || data.output,
                      error: data.error,
                    });
                    addWorkflowEvent({
                      id: `complete-${completeToolId}`,
                      type: 'synthesis',
                      inputs: [completeToolId],
                      output: typeof data.result === 'string'
                        ? data.result
                        : JSON.stringify(data.result).slice(0, 200),
                      timestamp: new Date(),
                    });
                    // Transition back for potential next tool or synthesis
                    if (data.hasMoreTools) {
                      transition('tool_calling');
                    } else {
                      transition('synthesizing');
                    }
                    break;

                  // DEPRECATED: API sends tool errors via 'tool_call_complete' with status: 'error'
                  // Not a separate 'tool_call_error' event - the completeToolCall handler
                  // already processes error status correctly via result.error
                  // case 'tool_call_error':
                  //   completeToolCall(data.toolId, { error: data.error });
                  //   break;

                  case 'token':
                  case 'stream':
                    // First token switches to responding phase
                    if (agentState.phase !== 'responding') {
                      transition('responding');
                    }
                    accumulatedContent += data.content;
                    updateMessage(assistantMessageId, {
                      content: accumulatedContent,
                    });
                    options.onMessage?.(data.content);
                    break;

                  case 'model_end':
                  case 'agent_change':
                    currentAgentRef.current = data.agent || null;
                    setCurrentAgent(data.agent || null);
                    break;

                  case 'ui_command':
                  case 'ui_component':
                    // Auto-activate 3D viewer for viewport commands
                    const command = data.command || data.component;
                    if (command?.type) {
                      const viewportCommands = ['highlight', 'isolate', 'setView', 'zoomTo', 'focus', 'select', 'showAll', 'section'];
                      if (viewportCommands.includes(command.type)) {
                        // Activate 3D viewer panel when viewport commands are received
                        onToolComplete({
                          id: `ui-${Date.now()}`,
                          name: 'highlight_elements',
                          status: 'success',
                          result: command,
                        });
                      }
                    }
                    options.onUICommand?.(command);
                    break;

                  case 'done':
                  case 'complete':
                  case 'end':
                    transition('idle');
                    addWorkflowEvent({
                      id: `end-${Date.now()}`,
                      type: 'end',
                      totalDuration: Date.now() - startTime,
                      success: true,
                      timestamp: new Date(),
                    });
                    // Get toolCalls from backend's done event metadata, or fall back to state machine
                    const backendToolCalls = data.metadata?.toolCalls as Array<{
                      id: string;
                      name: string;
                      status?: string;
                      arguments?: Record<string, unknown>;
                      result?: unknown;
                      error?: string;
                      description?: string;
                    }> | undefined;

                    // Convert to metadata format
                    const toolCallsMetadata = backendToolCalls?.map((t) => ({
                      id: t.id,
                      name: t.name,
                      status: (t.status || 'success') as 'pending' | 'running' | 'success' | 'error',
                      arguments: t.arguments,
                      result: t.result,
                      error: t.error,
                      description: t.description,
                    })) || agentState.completedTools.map((t) => ({
                      id: t.id,
                      name: t.name,
                      status: t.status as 'pending' | 'running' | 'success' | 'error',
                      arguments: t.arguments as Record<string, unknown> | undefined,
                      result: t.result,
                      error: t.error,
                      progress: t.progress,
                      description: t.description,
                    }));

                    // Get agent name - use ref to avoid stale closure
                    const finalAgentName = currentAgentRef.current || data.agent || data.agentName;

                    updateMessage(assistantMessageId, {
                      content: accumulatedContent,
                      metadata: {
                        isStreaming: false,
                        conversationId: data.conversationId,
                        toolsUsed: toolCallsMetadata.map((t) => t.name),
                        // Add toolCalls for SmartAgentMessage detection
                        toolCalls: toolCallsMetadata.length > 0 ? toolCallsMetadata : undefined,
                        // Add agentName from ref (avoids stale closure)
                        agentName: finalAgentName || undefined,
                        // Persist uiComponents from done event for future UI rendering
                        uiComponents: data.metadata?.uiComponents,
                      },
                    });
                    break;

                  case 'error':
                    throw new Error(data.message);
                }
              } catch (parseError) {
                // Ignore JSON parse errors for incomplete data
                if (parseError instanceof SyntaxError) {
                  continue;
                }
                throw parseError;
              }
            }
          }
        }

        // Finalize message if not already done
        if (agentState.phase !== 'idle') {
          transition('idle');
          // Convert completed tools to metadata format
          const finalToolCalls = agentState.completedTools.map((t) => ({
            id: t.id,
            name: t.name,
            status: t.status as 'pending' | 'running' | 'success' | 'error',
            arguments: t.arguments as Record<string, unknown> | undefined,
            result: t.result,
            error: t.error,
            progress: t.progress,
            description: t.description,
          }));
          updateMessage(assistantMessageId, {
            content: accumulatedContent || 'Analysis complete.',
            metadata: {
              isStreaming: false,
              toolCalls: finalToolCalls.length > 0 ? finalToolCalls : undefined,
              // Use ref to avoid stale closure
              agentName: currentAgentRef.current || undefined,
            },
          });
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was aborted
          transition('idle');
          return;
        }

        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        setAgentError({
          code: 'STREAM_ERROR',
          message: errorObj.message,
          recoverable: true,
        });
        options.onError?.(errorObj);

        addWorkflowEvent({
          id: `error-${messageId}`,
          type: 'end',
          totalDuration: Date.now() - startTime,
          success: false,
          timestamp: new Date(),
        });

        // Update message with error
        updateMessage(assistantMessageId, {
          content: `Error: ${errorObj.message}`,
          metadata: { isStreaming: false, error: true },
        });
      } finally {
        setIsLoading(false);
        currentAgentRef.current = null;
        setCurrentAgent(null);
      }
    },
    [
      addMessage,
      updateMessage,
      addWorkflowEvent,
      clearWorkflowEvents,
      csrfHeaders,
      options,
      transition,
      startToolCall,
      completeToolCall,
      updateToolProgress,
      addReasoning,
      setAgentError,
      resetAgentState,
      storeResetAgentState,
      onToolStart,
      onToolComplete,
      agentState.phase,
      agentState.completedTools,
    ]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      currentAgentRef.current = null;
      setCurrentAgent(null);
      transition('idle');
    }
  }, [transition]);

  const resetState = useCallback(() => {
    resetAgentState();
    clearWorkflowEvents();
  }, [resetAgentState, clearWorkflowEvents]);

  return {
    sendMessage,
    isLoading,
    error,
    currentAgent,
    abort,
    phase: agentState.phase,
    currentTool: agentState.currentTool,
    completedTools: agentState.completedTools,
    resetState,
  };
}
