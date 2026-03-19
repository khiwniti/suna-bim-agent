'use client';

/**
 * HeadlessChat - Main headless chat component
 *
 * Composes FloatingChatFAB, FloatingChatPanel, MessageBubble, and ChatInput
 * into a complete floating chat interface with agent state visualization.
 *
 * ★ Insight ─────────────────────────────────────
 * This component integrates:
 * 1. AgentStateVisualization - shows when ANY phase is active (not just thinking)
 * 2. StreamingStatusBar - displays tokens/sec, phase, and progress
 * 3. WorkflowTimeline - visualizes the agent's decision flow
 * ─────────────────────────────────────────────────
 */

import { useState, useRef, useEffect, useCallback, useMemo, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Paperclip, Sparkles, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

import { FloatingChatFAB, type FABPosition } from './FloatingChatFAB';
import { FloatingChatPanel } from './FloatingChatPanel';
import { TypingIndicator, MessageBubble } from './MessageBubble';
import { SmartAgentMessage } from './SmartAgentMessage';
import { AgentStateVisualization, ThinkingAnimation, type AgentState } from './AgentStateVisualization';
import { WorkflowTimeline, type AgentWorkflowEvent as WorkflowEvent } from './workflow';
import { StreamingStatusBar } from '@/components/ui/streaming';
import { useChatStore, type DockPosition } from '@/stores/chat-store';
import { useTranslation } from '@/i18n/provider';
import type { AgentPhase } from '@/lib/streaming/event-types';

// Convert store workflow events to workflow component format
// The store uses a different event type from the component
// This is a temporary bridge until we unify the types
function convertWorkflowEvents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storeEvents: any[]
): WorkflowEvent[] {
  return storeEvents
    .filter((e) => {
      // Filter to only events that match the WorkflowTimeline format
      return [
        'start', 'thinking', 'decision', 'parallel_start',
        'tool_execution', 'parallel_end', 'abandoned_path',
        'synthesis', 'response', 'end'
      ].includes(e.type);
    })
    .map((e, index) => ({
      ...e,
      id: e.id ?? `event-${index}`,
      timestamp: e.timestamp ?? new Date(),
    }));
}

interface HeadlessChatProps {
  /** Position of the FAB trigger */
  fabPosition?: FABPosition;
  /** Initial dock position of the panel */
  initialDockPosition?: DockPosition;
  /** Callback when message is sent */
  onSendMessage?: (message: string) => Promise<void>;
  /** Callback to abort current streaming operation */
  onAbort?: () => void;
  /** Whether AI is currently responding */
  isProcessing?: boolean;
  /** Class name for the container */
  className?: string;
}

// Animation variants for message list
const messageListVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export function HeadlessChat({
  fabPosition = 'bottom-right',
  initialDockPosition = 'corner',
  onSendMessage,
  onAbort,
  isProcessing = false,
  className,
}: HeadlessChatProps) {
  const { t } = useTranslation();

  // Chat store
  const {
    messages,
    isPanelOpen,
    dockPosition,
    unreadCount,
    inputValue,
    isListening,
    viewMode,
    workflowEvents,
    agentState: sharedAgentState,
    togglePanel,
    setDockPosition,
    setInputValue,
    setListening,
    addMessage,
    setViewMode,
    toggleViewMode,
    resetAgentState,
  } = useChatStore();

  // Map shared agent state to AgentStateVisualization format
  // The sharedAgentState comes from the chat store, updated by useChat
  const agentState: AgentState = useMemo(() => {
    const isThinking = sharedAgentState.phase !== 'idle' && sharedAgentState.phase !== 'error';

    // Build events from currentTool and completedTools
    const events: AgentState['events'] = [];

    // Add completed tools as events
    sharedAgentState.completedTools.forEach((tool) => {
      events.push({
        id: tool.id,
        type: tool.status === 'error' ? 'error' : 'tool_end',
        status: tool.status === 'error' ? 'failed' : 'completed',
        timestamp: tool.completedAt || new Date(),
        duration: tool.startedAt && tool.completedAt
          ? tool.completedAt.getTime() - tool.startedAt.getTime()
          : undefined,
        data: {
          toolName: tool.name,
          name: tool.name,
          description: tool.description,
          input: tool.arguments as Record<string, unknown> | undefined,
          output: tool.result,
          error: tool.error,
        },
      });
    });

    // Add current tool as running event
    if (sharedAgentState.currentTool) {
      events.push({
        id: sharedAgentState.currentTool.id,
        type: 'tool_start',
        status: 'running',
        timestamp: sharedAgentState.currentTool.startedAt || new Date(),
        data: {
          toolName: sharedAgentState.currentTool.name,
          name: sharedAgentState.currentTool.name,
          description: sharedAgentState.currentTool.description,
          input: sharedAgentState.currentTool.arguments as Record<string, unknown> | undefined,
        },
      });
    }

    return {
      isThinking,
      currentPhase: sharedAgentState.phase,
      events,
      activeTools: sharedAgentState.currentTool ? [sharedAgentState.currentTool.name] : [],
      mcpConnections: [],
      a2aAgents: [],
    };
  }, [sharedAgentState]);

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Local state
  const [showAgentState, setShowAgentState] = useState(true);
  const [isAgentStateExpanded, setIsAgentStateExpanded] = useState(false);

  // Determine if agent is in an active phase (not idle)
  const isAgentActive = useMemo(() => {
    const phase = agentState.currentPhase || 'idle';
    return phase !== 'idle';
  }, [agentState.currentPhase]);

  // Map agent state to StreamingStatusBar phase
  const streamingPhase = useMemo((): AgentPhase => {
    const phase = agentState.currentPhase;
    if (!phase || phase === 'idle') return 'idle';
    // Map phases to AgentPhase type
    const phaseMap: Record<string, AgentPhase> = {
      thinking: 'thinking',
      reasoning: 'reasoning',
      tool_calling: 'tool_calling',
      tool_executing: 'tool_executing',
      synthesizing: 'synthesizing',
      responding: 'responding',
      error: 'error',
    };
    return phaseMap[phase] || 'thinking';
  }, [agentState.currentPhase]);

  // Initialize dock position (only on mount)
  useEffect(() => {
    setDockPosition(initialDockPosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDockPosition]); // Only run when initialDockPosition changes, not dockPosition

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isPanelOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isPanelOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isPanelOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPanelOpen]);

  // Handle sending message
  const handleSend = useCallback(async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isProcessing) return;

    // Add user message
    addMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: trimmedValue,
      timestamp: new Date(),
    });

    // Clear input
    setInputValue('');

    // Call send handler
    if (onSendMessage) {
      try {
        await onSendMessage(trimmedValue);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  }, [inputValue, isProcessing, addMessage, setInputValue, onSendMessage]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Toggle voice input
  const toggleVoice = useCallback(() => {
    setListening(!isListening);
    // Voice input implementation would go here
  }, [isListening, setListening]);

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [setInputValue]);

  // Handle stop/abort streaming
  const handleStop = useCallback(() => {
    // Call parent abort handler if provided
    onAbort?.();
    // Reset agent state in store (handles phase, tools, etc.)
    resetAgentState();
  }, [onAbort, resetAgentState]);

  return (
    <div className={cn('contents', className)}>
      {/* Floating Action Button */}
      <FloatingChatFAB
        onClick={togglePanel}
        isOpen={isPanelOpen}
        unreadCount={unreadCount}
        position={fabPosition}
      />

      {/* Floating Chat Panel */}
      <FloatingChatPanel
        isOpen={isPanelOpen}
        onClose={togglePanel}
        dockPosition={dockPosition}
        onDockPositionChange={setDockPosition}
        title={t('chat.bimAssistant')}
      >
        <div className="flex flex-col h-full">
          {/* Streaming Status Bar - shows during active processing */}
          <AnimatePresence>
            {(isProcessing || isAgentActive) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <StreamingStatusBar
                  isStreaming={isProcessing || isAgentActive}
                  phase={streamingPhase}
                  onStop={handleStop}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Agent State Visualization - shows when agent is active */}
          <AnimatePresence>
            {isAgentActive && showAgentState && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-border/50 overflow-hidden"
              >
                <div className="px-3 py-2">
                  {/* Collapse/Expand toggle */}
                  <button
                    onClick={() => setIsAgentStateExpanded(!isAgentStateExpanded)}
                    className="flex items-center gap-2 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isAgentStateExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                    <span>{t('chat.agentActivity')}</span>
                  </button>

                  {/* Thinking animation (always visible when active) */}
                  {!isAgentStateExpanded && agentState.currentPhase && (
                    <ThinkingAnimation phase={agentState.currentPhase} />
                  )}

                  {/* Full agent state (when expanded) */}
                  {isAgentStateExpanded && (
                    <AgentStateVisualization
                      state={agentState}
                      collapsed={false}
                      onToggleCollapse={() => setShowAgentState(!showAgentState)}
                      className="mt-2 max-h-48"
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* View Mode Toggle & Workflow Timeline */}
          {workflowEvents.length > 0 && (
            <div className="border-b border-border/50 px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('chat.agentWorkflow')}
                </span>
                <button
                  onClick={toggleViewMode}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-md text-xs',
                    'transition-colors hover:bg-muted/50',
                    viewMode === 'detailed'
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground'
                  )}
                >
                  {viewMode === 'detailed' ? (
                    <>
                      <Eye className="w-3 h-3" />
                      Detailed
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3" />
                      Simple
                    </>
                  )}
                </button>
              </div>
              <WorkflowTimeline
                events={convertWorkflowEvents(workflowEvents)}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                className="max-h-48 overflow-y-auto"
              />
            </div>
          )}

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto chat-scroll py-4"
          >
            <motion.div
              variants={messageListVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {/* Welcome message if no messages */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full min-h-[200px] px-6 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t('chat.bimIntelligenceAssistant')}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-[280px]">
                    {t('chat.welcomePrompt')}
                  </p>
                </motion.div>
              )}

              {/* Message list */}
              {messages.map((message) => {
                const isLastMessage = message.id === messages[messages.length - 1]?.id;
                const isAssistant = message.role === 'assistant';

                // Use SmartAgentMessage for assistant messages (handles JSON reasoning parsing)
                // Use MessageBubble for user/system messages
                if (isAssistant) {
                  return (
                    <SmartAgentMessage
                      key={message.id}
                      role="assistant"
                      content={message.content}
                      timestamp={message.timestamp}
                      toolCalls={message.metadata?.toolCalls}
                      agentName={message.metadata?.agentName}
                      viewportCommands={message.metadata?.viewportCommands}
                      isStreaming={isProcessing && isLastMessage}
                    />
                  );
                }

                return (
                  <MessageBubble
                    key={message.id}
                    role={message.role as 'user' | 'system'}
                    content={message.content}
                    timestamp={message.timestamp}
                    isStreaming={message.metadata?.isStreaming}
                  />
                );
              })}

              {/* Typing indicator */}
              {isProcessing && <TypingIndicator />}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </motion.div>
          </div>

          {/* Input area */}
          <div className="border-t border-border/50 p-3 bg-muted/30">
            <div className="flex items-end gap-2">
              {/* Attachment button */}
              <button
                className={cn(
                  'p-2 rounded-lg',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-muted/50 transition-colors',
                  'flex-shrink-0'
                )}
                aria-label={t('chat.attachFile')}
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Text input */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chat.askAboutModel')}
                  className={cn(
                    'w-full px-4 py-2.5 pr-12',
                    'rounded-xl border border-border',
                    'bg-background text-foreground',
                    'placeholder:text-muted-foreground',
                    'resize-none overflow-hidden',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50',
                    'transition-all duration-200',
                    'text-sm leading-relaxed'
                  )}
                  rows={1}
                  disabled={isProcessing}
                />

                {/* Voice input button */}
                <button
                  onClick={toggleVoice}
                  className={cn(
                    'absolute right-2 bottom-2',
                    'p-1.5 rounded-lg',
                    'transition-colors',
                    isListening
                      ? 'text-destructive bg-destructive/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                  aria-label={isListening ? t('chat.stopListening') : t('chat.startVoice')}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Send button */}
              <motion.button
                onClick={handleSend}
                disabled={!inputValue.trim() || isProcessing}
                className={cn(
                  'p-2.5 rounded-xl',
                  'bg-gradient-to-r from-primary to-accent',
                  'text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'hover:shadow-md transition-all',
                  'flex-shrink-0'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={t('chat.send')}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Quick suggestions */}
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {[
                { key: 'carbonAnalysis', label: t('chat.quickSuggestions.carbonAnalysis') },
                { key: 'costBreakdown', label: t('chat.quickSuggestions.costBreakdown') },
                { key: 'materialSpecs', label: t('chat.quickSuggestions.materialSpecs') },
              ].map((suggestion) => (
                <button
                  key={suggestion.key}
                  onClick={() => setInputValue(suggestion.label)}
                  className={cn(
                    'px-3 py-1 rounded-full',
                    'text-xs text-muted-foreground',
                    'bg-muted/50 hover:bg-muted',
                    'border border-border/50',
                    'whitespace-nowrap',
                    'transition-colors'
                  )}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FloatingChatPanel>
    </div>
  );
}

export default HeadlessChat;
