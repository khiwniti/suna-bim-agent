'use client';

import { useState, useRef, useEffect, FormEvent, useCallback, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Building2,
  Leaf,
  Zap,
  LayoutGrid,
  Wrench,
  FileText,
  ChevronDown,
  Mic,
  MicOff,
  AlertCircle,
  UserCircle2,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { useChatStore, useBIMStore } from '@/stores';
import { useAuth } from '@/hooks/useAuth';
import { useFloorPlanAPI, fileToBase64 } from '@/hooks/useFloorPlanAPI';
import { cn, generateId } from '@/lib/utils';
import { useCSRFHeaders } from '@/hooks/useCSRF';
import { useTranslation } from '@/i18n/provider';
import { FloorPlanProgress } from './FloorPlanProgress';
import { SmartAgentMessage } from './SmartAgentMessage';
import { TypingIndicator } from './MessageBubble';
import type { ChatMessage, QuickAction } from '@/types';

// Quick action icons mapping - using smaller w-4 h-4 icons
const quickActionIcons: Record<string, React.ReactNode> = {
  overview: <Building2 className="w-4 h-4" />,
  sustainability: <Leaf className="w-4 h-4" />,
  energy: <Zap className="w-4 h-4" />,
  spaces: <LayoutGrid className="w-4 h-4" />,
  'exterior-walls': <Building2 className="w-4 h-4" />,
  hvac: <Zap className="w-4 h-4" />,
  maintenance: <Wrench className="w-4 h-4" />,
  quote: <FileText className="w-4 h-4" />,
};

interface WorkspaceChatPanelProps {
  anonymousSessionId?: string;
  /** If true, show the floor plan upload panel on mount */
  initialShowUpload?: boolean;
}

// Note: ChatMessageBubble, MessageContent, and StreamingIndicator
// have been replaced by shared components: ChatMessageWithTools and TypingIndicator

interface QuickActionsBarProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

function QuickActionsBar({ onSendMessage, disabled }: QuickActionsBarProps) {
  const quickActions = useChatStore((state) => state.quickActions);
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  const handleQuickAction = (action: QuickAction) => {
    if (disabled) return;
    onSendMessage(action.prompt);
  };

  return (
    <div className="border-b border-border bg-card/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          {t('chat.panel.quickActions')}
        </span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', expanded ? 'rotate-180' : '')} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2.5 grid grid-cols-2 gap-1.5">
              {quickActions.slice(0, 6).map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  disabled={disabled}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-2 bg-accent/40 hover:bg-accent text-accent-foreground rounded-lg text-xs font-medium transition-colors text-left",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {quickActionIcons[action.id] || <Sparkles className="w-4 h-4" />}
                  <span className="truncate">{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputValue = useChatStore((state) => state.inputValue);
  const setInputValue = useChatStore((state) => state.setInputValue);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const [isListening, setIsListening] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming || disabled) return;

    const userQuery = inputValue.trim();
    onSendMessage(userQuery);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 100)}px`;
    }
  }, [inputValue]);

  const isDisabled = isStreaming || disabled;

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-card/50">
      <div className="flex gap-2 items-end">
        <button
          type="button"
          onClick={() => setIsListening(!isListening)}
          disabled={isDisabled}
          className={cn(
            'flex-shrink-0 p-2 rounded-lg transition-colors',
            isListening
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
              : 'bg-secondary text-muted-foreground hover:text-foreground',
            isDisabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? t('chat.panel.placeholderSignedOut') : t('chat.panel.placeholderSignedIn')}
            disabled={isDisabled}
            rows={1}
            className={cn(
              'w-full resize-none px-3 py-2',
              'bg-secondary rounded-xl border-0',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'placeholder:text-muted-foreground/60',
              'text-sm leading-relaxed',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
        </div>

        <button
          type="submit"
          disabled={!inputValue.trim() || isDisabled}
          className={cn(
            'flex-shrink-0 p-2 rounded-lg transition-all duration-200',
            inputValue.trim() && !isDisabled
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-secondary text-muted-foreground'
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground/60">
        <span>{t('chat.enterToSend')}</span>
        <span>{t('chat.shiftEnterNewline')}</span>
      </div>
    </form>
  );
}

function AnonymousUserBanner() {
  return (
    <div className="mx-4 my-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
          <UserCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
            Guest Mode
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            You&apos;re using the BIM Agent as a guest. Sign in to save your conversations and access more features.
          </p>
          <a
            href="/auth/login"
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <UserCircle2 className="w-4 h-4" />
            Create Account
          </a>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceChatPanel({ anonymousSessionId, initialShowUpload = false }: WorkspaceChatPanelProps) {
  const { user } = useAuth();
  const csrfHeaders = useCSRFHeaders();
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const setIsStreaming = useChatStore((state) => state.setIsStreaming);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedElements = useBIMStore((state) => state.selection.selectedIds);
  const currentModel = useBIMStore((state) => state.currentModel);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFloorPlanUpload, setShowFloorPlanUpload] = useState(initialShowUpload);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Floor plan API hook (direct API, not MCP)
  const {
    isProcessing: isFloorPlanProcessing,
    progressMessage: floorPlanProgressMessage,
    error: floorPlanError,
    processFloorPlan,
    reset: resetFloorPlan,
  } = useFloorPlanAPI({
    onComplete: (scene) => {
      // Add success message to chat
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: `✅ **Floor Plan Processed Successfully!**\n\nI've analyzed your floor plan and generated a 3D model with:\n- ${scene.metadata.totalWalls} walls\n- ${scene.metadata.totalRooms} rooms\n- ${scene.metadata.totalOpenings} doors/windows\n- Total floor area: ${scene.metadata.floorArea.toFixed(1)} m²\n\nThe 3D model is now displayed in the viewport. You can rotate, pan, and zoom to explore it.`,
        timestamp: new Date(),
      });
      setShowFloorPlanUpload(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (errorMsg) => {
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: `⚠️ **Floor Plan Processing Failed**\n\n${errorMsg}\n\nPlease try again with a clearer floor plan image.`,
        timestamp: new Date(),
      });
    },
  });

  // Determine if user can chat (authenticated OR has anonymous session)
  const canChat = !!user || !!anonymousSessionId;
  const isAnonymous = !user && !!anonymousSessionId;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track if we've processed the initial message
  const initialMessageProcessedRef = useRef(false);

  // Handle file selection for floor plan upload
  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, etc.)');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file must be smaller than 10MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  }, []);

  // Handle floor plan processing
  const handleProcessFloorPlan = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const base64 = await fileToBase64(selectedFile);
      await processFloorPlan(base64, {
        wallHeight: 2.8,
        generateLabels: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process floor plan');
    }
  }, [selectedFile, processFloorPlan]);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Send message to API
  const sendMessage = useCallback(async (content: string) => {
    if (!canChat) return;

    // Add user message
    const userMessageId = generateId();
    addMessage({
      id: userMessageId,
      role: 'user',
      content,
      timestamp: new Date(),
    });

    setIsStreaming(true);
    setError(null);

    // Create assistant message placeholder
    const assistantMessageId = generateId();
    let assistantContent = '';

    try {
      // Build project context from current model
      const projectContext = currentModel ? {
        modelId: currentModel.id,
        modelName: currentModel.name,
        totalArea: currentModel.metadata.totalArea || 0,
        floors: currentModel.levels.map(level => ({
          id: level.id,
          name: level.name,
          level: level.elevation,
          area: 0,
        })),
        selectedElements,
        elementCount: currentModel.elements.length,
        elementTypes: Object.entries(
          currentModel.elements.reduce((acc, el) => {
            acc[el.type] = (acc[el.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([type, count]) => ({ type, count })),
        source: currentModel.source,
      } : null;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeaders,
        },
        body: JSON.stringify({
          message: content,
          conversationId,
          anonymousSessionId: isAnonymous ? anonymousSessionId : undefined,
          projectContext,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please refresh the page.');
        }
        throw new Error('Failed to send message');
      }

      // Handle SSE streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response stream');

      // Add placeholder message with streaming flag
      addMessage({
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        metadata: { isStreaming: true },
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'token':
                case 'stream': // API sends 'stream', also handle 'token' for compatibility
                  assistantContent += data.content;
                  // Update message in store - keep isStreaming true while receiving
                  useChatStore.getState().updateMessage(assistantMessageId, {
                    content: assistantContent,
                    metadata: { isStreaming: true },
                  });
                  // Update agent phase to responding when we get content
                  useChatStore.getState().updateMessageMetadata(assistantMessageId, {
                    agentPhase: 'responding',
                  });
                  break;

                case 'thinking':
                  // Update agent state to thinking phase
                  useChatStore.getState().setAgentPhase('thinking');
                  // Update message metadata with agent info
                  useChatStore.getState().updateMessageMetadata(assistantMessageId, {
                    agentName: data.agent,
                    agentPhase: 'thinking',
                    isStreaming: true,
                  });
                  break;

                case 'agent_change':
                  // Update agent state to reasoning phase
                  useChatStore.getState().setAgentPhase('reasoning');
                  // Update message metadata with new agent and task
                  useChatStore.getState().updateMessageMetadata(assistantMessageId, {
                    agentName: data.agent,
                    agentPhase: 'reasoning',
                    currentTask: data.task || undefined,
                  });
                  break;

                case 'tool_call_start': {
                  // Update agent state with current tool
                  useChatStore.getState().setAgentPhase('tool_executing');
                  const toolCall = {
                    id: data.toolCall?.id || generateId(),
                    name: data.toolCall?.name || 'unknown_tool',
                    status: 'running' as const,
                    arguments: data.toolCall?.arguments,
                    description: data.toolCall?.description,
                  };
                  useChatStore.getState().setAgentCurrentTool(toolCall);
                  // Add tool to message's toolCalls array
                  const currentMsg = useChatStore.getState().messages.find(m => m.id === assistantMessageId);
                  const existingToolCalls = currentMsg?.metadata?.toolCalls || [];
                  useChatStore.getState().updateMessageMetadata(assistantMessageId, {
                    agentPhase: 'tool_executing',
                    toolCalls: [...existingToolCalls, toolCall],
                  });
                  break;
                }

                case 'tool_call_complete': {
                  // Update agent state - tool completed
                  const completedTool = {
                    id: data.toolCall?.id || '',
                    name: data.toolCall?.name || 'unknown_tool',
                    status: (data.toolCall?.status === 'error' ? 'error' : 'success') as 'success' | 'error',
                    result: data.toolCall?.result,
                    error: data.toolCall?.error,
                  };
                  useChatStore.getState().addAgentCompletedTool(completedTool);
                  // Update the tool in message's toolCalls array with result
                  const msg = useChatStore.getState().messages.find(m => m.id === assistantMessageId);
                  const toolCalls = msg?.metadata?.toolCalls || [];
                  const updatedToolCalls = toolCalls.map(tc =>
                    tc.id === completedTool.id ? { ...tc, ...completedTool } : tc
                  );
                  useChatStore.getState().updateMessageMetadata(assistantMessageId, {
                    agentPhase: 'synthesizing',
                    toolCalls: updatedToolCalls,
                  });
                  break;
                }

                case 'ui_component':
                  // Add UI component to message metadata
                  {
                    const currentMessage = useChatStore.getState().messages.find(m => m.id === assistantMessageId);
                    const existingComponents = currentMessage?.metadata?.uiComponents || [];
                    useChatStore.getState().updateMessageMetadata(assistantMessageId, {
                      uiComponents: [...existingComponents, {
                        id: data.component?.id || generateId(),
                        type: data.component?.type,
                        props: data.component?.props,
                        zone: data.component?.zone,
                      }],
                    });
                  }
                  break;

                case 'done':
                case 'complete': // Also handle 'complete' for compatibility
                  // Mark streaming complete and reset agent state
                  useChatStore.getState().updateMessage(assistantMessageId, {
                    metadata: { isStreaming: false },
                  });
                  useChatStore.getState().updateMessageMetadata(assistantMessageId, {
                    agentPhase: undefined,
                  });
                  useChatStore.getState().resetAgentState();
                  if (data.conversationId) {
                    setConversationId(data.conversationId);
                  }
                  break;

                case 'ui_command':
                  // Execute UI commands from the agent
                  if (data.command) {
                    const command = data.command;

                    // Handle analytics updates separately
                    if (command.type === 'updateAnalytics') {
                      useBIMStore.getState().setAnalyticsData({
                        sustainabilityAnalysis: command.data?.content || null,
                      });
                    } else {
                      // All other commands go to the viewport
                      useBIMStore.getState().addPendingCommand(command);
                    }
                  }
                  break;

                case 'error':
                  throw new Error(data.message);
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');

      // Add error message
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: `⚠️ ${err instanceof Error ? err.message : 'An error occurred while processing your request.'}`,
        timestamp: new Date(),
        metadata: { isStreaming: false },
      });
    } finally {
      // Ensure streaming is marked complete on the message
      useChatStore.getState().updateMessage(assistantMessageId, {
        metadata: { isStreaming: false },
      });
      setIsStreaming(false);
    }
  }, [canChat, isAnonymous, anonymousSessionId, conversationId, addMessage, setIsStreaming]);

  // Process pending initial message from landing page
  useEffect(() => {
    if (initialMessageProcessedRef.current) return;

    const pendingMessage = useChatStore.getState().pendingInitialMessage;
    if (pendingMessage && canChat) {
      initialMessageProcessedRef.current = true;
      // Clear the pending message immediately to prevent re-processing
      useChatStore.getState().clearPendingInitialMessage();
      // Small delay to ensure component is fully mounted
      const timeoutId = setTimeout(() => {
        sendMessage(pendingMessage);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [canChat, sendMessage]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Compact Header */}
      <div className="flex-shrink-0 px-3 py-2.5 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">BIM Agent</h2>
              <p className="text-xs text-muted-foreground/70">
                {isAnonymous ? 'Guest Mode' : 'AI-powered analysis'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Floor Plan Upload Button */}
            <button
              onClick={() => setShowFloorPlanUpload(!showFloorPlanUpload)}
              disabled={!canChat || isFloorPlanProcessing}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                showFloorPlanUpload
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent hover:bg-accent/80 text-accent-foreground',
                (!canChat || isFloorPlanProcessing) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Upload className="w-3.5 h-3.5" />
              Floor Plan
            </button>

            {selectedElements.length > 0 && (
              <div className="px-2 py-1 bg-accent text-accent-foreground rounded-full text-xs">
                {selectedElements.length} selected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floor Plan Upload Panel */}
      <AnimatePresence>
        {showFloorPlanUpload && !isFloorPlanProcessing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-border bg-card/50 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Upload Floor Plan
                </h3>
                <button
                  onClick={() => {
                    setShowFloorPlanUpload(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="p-1 hover:bg-accent rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!selectedFile ? (
                <label
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer transition-colors',
                    'hover:border-primary hover:bg-accent/50'
                  )}
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click or drag to upload
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    PNG, JPG up to 10MB
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  {/* Preview */}
                  <div className="relative rounded-lg overflow-hidden bg-muted">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Floor plan preview"
                        className="w-full h-32 object-contain"
                      />
                    )}
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={handleProcessFloorPlan}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate 3D
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floor Plan Processing Progress */}
      <AnimatePresence>
        {(isFloorPlanProcessing || floorPlanProgressMessage || floorPlanError) && (
          <FloorPlanProgress
            progress={floorPlanProgressMessage ? {
              step: 'vision_analysis',
              progress: 50,
              message: floorPlanProgressMessage,
              timestamp: new Date().toISOString(),
            } : null}
            isProcessing={isFloorPlanProcessing}
            error={floorPlanError}
            onCancel={() => resetFloorPlan()}
            onRetry={() => {
              resetFloorPlan();
              if (selectedFile) {
                handleProcessFloorPlan();
              }
            }}
            compact
          />
        )}
      </AnimatePresence>

      <QuickActionsBar onSendMessage={sendMessage} disabled={!canChat} />

      {/* Anonymous user banner (show once at the start) */}
      {isAnonymous && messages.length === 0 && <AnonymousUserBanner />}

      {/* Error display */}
      {error && (
        <div className="mx-4 my-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WorkspaceWelcome
            onSendMessage={sendMessage}
            onUploadFloorPlan={() => setShowFloorPlanUpload(true)}
            disabled={!canChat}
            isAnonymous={isAnonymous}
          />
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <SmartAgentMessage
                key={message.id}
                role={message.role as 'user' | 'assistant' | 'system'}
                content={message.content}
                timestamp={message.timestamp}
                toolCalls={message.metadata?.toolCalls}
                agentName={message.metadata?.agentName}
                viewportCommands={message.metadata?.viewportCommands}
                isStreaming={message.metadata?.isStreaming}
                agentPhase={message.metadata?.agentPhase}
                currentTask={message.metadata?.currentTask}
                uiComponents={message.metadata?.uiComponents}
              />
            ))}
          </AnimatePresence>
        )}
        {isStreaming && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSendMessage={sendMessage} disabled={!canChat} />
    </div>
  );
}

interface WorkspaceWelcomeProps {
  onSendMessage: (message: string) => void;
  onUploadFloorPlan?: () => void;
  disabled?: boolean;
  isAnonymous?: boolean;
}

function WorkspaceWelcome({ onSendMessage, onUploadFloorPlan, disabled, isAnonymous }: WorkspaceWelcomeProps) {
  const suggestions = [
    { icon: '🏢', text: 'Building overview' },
    { icon: '🌱', text: 'Carbon analysis' },
    { icon: '⚡', text: 'Energy efficiency' },
  ];

  const handleSuggestion = (text: string) => {
    if (disabled) return;
    onSendMessage(text);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mb-4">
        <Building2 className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-base font-semibold mb-1">
        {isAnonymous ? 'Welcome, Guest!' : 'Start analyzing'}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
        {disabled
          ? 'Sign in to ask about your building'
          : isAnonymous
            ? 'Try asking about building analysis'
            : 'Ask anything about your building'}
      </p>

      {/* Floor Plan Upload CTA */}
      {!disabled && onUploadFloorPlan && (
        <button
          onClick={onUploadFloorPlan}
          className="flex items-center gap-2 px-4 py-2.5 mb-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Upload className="w-4 h-4" />
          Upload Floor Plan
        </button>
      )}

      <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSuggestion(s.text)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors text-left text-sm",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span>{s.icon}</span>
            <span className="font-medium">{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default WorkspaceChatPanel;
