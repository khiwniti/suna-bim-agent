'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Building2,
  Leaf,
  Zap,
  LayoutGrid,
  Wrench,
  FileText,
  ChevronDown,
  AlertCircle,
  Lock,
  Paperclip,
} from 'lucide-react';
import { useChatStore, useBIMStore } from '@/stores';
import { Button } from '@/components/ui';
import { cn, generateId } from '@/lib/utils';
import { useAuth } from '@/hooks';
import { useCSRFHeaders } from '@/hooks/useCSRF';
import { useTranslation } from '@/i18n/provider';
import { useFileUpload } from '@/hooks/useFileUpload';
import { SmartAgentMessage } from './SmartAgentMessage';
import { TypingIndicator } from './MessageBubble';
import { UploadProgress } from './UploadProgress';
import type { QuickAction } from '@/types';

// Quick action icons mapping
const quickActionIcons: Record<string, React.ReactNode> = {
  overview: <Building2 className="w-5 h-5" />,
  sustainability: <Leaf className="w-5 h-5" />,
  energy: <Zap className="w-5 h-5" />,
  spaces: <LayoutGrid className="w-5 h-5" />,
  'exterior-walls': <Building2 className="w-5 h-5" />,
  hvac: <Zap className="w-5 h-5" />,
  maintenance: <Wrench className="w-5 h-5" />,
  quote: <FileText className="w-5 h-5" />,
};

// NOTE: ChatMessageBubble, MessageContent, and StreamingIndicator removed
// SmartAgentMessage from ./SmartAgentMessage.tsx is the canonical renderer
// TypingIndicator from ./MessageBubble.tsx is the canonical streaming indicator

function QuickActionsBar({ onSendMessage }: { onSendMessage: (message: string) => void }) {
  const quickActions = useChatStore((state) => state.quickActions);
  const [expanded, setExpanded] = useState(true);
  const { t } = useTranslation();

  const handleQuickAction = (action: QuickAction) => {
    onSendMessage(action.prompt);
  };

  return (
    <div className="border-b border-border bg-card/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {t('chat.panel.quickActions')}
        </span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', expanded ? 'rotate-180' : '')} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 grid grid-cols-2 gap-2">
              {quickActions.slice(0, 6).map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-accent/50 hover:bg-accent text-accent-foreground rounded-lg text-sm font-medium transition-colors text-left"
                >
                  {quickActionIcons[action.id] || <Sparkles className="w-5 h-5" />}
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

function ChatInput({ onSendMessage, disabled }: { onSendMessage: (message: string) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputValue = useChatStore((state) => state.inputValue);
  const setInputValue = useChatStore((state) => state.setInputValue);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const [isListening, setIsListening] = useState(false);
  const { t } = useTranslation();

  // File upload hook
  const {
    openFilePicker,
    dropZoneProps,
    isDragActive,
    uploadState,
    progress,
    currentFile,
    error: uploadError,
    cancel: cancelUpload,
  } = useFileUpload({
    autoActivatePanel: true,
    onUploadComplete: (result) => {
      if (result.success) {
        onSendMessage(`I've uploaded ${result.filename}. Please analyze this file.`);
      }
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming || disabled) return;

    onSendMessage(inputValue.trim());
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
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card">
      {/* Upload progress */}
      {uploadState !== 'idle' && currentFile && (
        <div className="mb-3">
          <UploadProgress
            filename={currentFile.name}
            fileSize={currentFile.size}
            progress={progress}
            targetPanel={currentFile.targetPanel}
            status={uploadState === 'uploading' ? 'uploading' : uploadState === 'success' ? 'success' : 'error'}
            error={uploadError ?? undefined}
            onCancel={cancelUpload}
            onRetry={() => {}}
          />
        </div>
      )}

      <div
        className={cn(
          'flex gap-3 items-end rounded-xl border border-input bg-secondary p-2',
          isDragActive && 'ring-2 ring-primary ring-inset'
        )}
        {...dropZoneProps}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={openFilePicker}
          disabled={disabled || isStreaming || uploadState === 'uploading'}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          title="Upload file (IFC, PDF, Excel, Image)"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsListening(!isListening)}
          disabled={disabled}
          className={cn('flex-shrink-0', isListening && 'bg-red-100 border-red-300 text-red-600')}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? t('chat.panel.placeholderSignedOut') : t('chat.panel.placeholderSignedIn')}
            disabled={isStreaming || disabled}
            rows={1}
            className={cn(
              'w-full resize-none px-4 py-2',
              'bg-transparent rounded-lg border-0',
              'focus:outline-none focus:ring-0',
              'placeholder:text-muted-foreground',
              'text-base leading-relaxed',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
        </div>

        <Button type="submit" variant="primary" size="icon" disabled={!inputValue.trim() || isStreaming || disabled} className="flex-shrink-0">
          <Send className="w-5 h-5" />
        </Button>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('chat.panel.enterToSend')}</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘K</kbd>
          <span>{t('chat.panel.shortcuts')}</span>
        </span>
      </div>
    </form>
  );
}

// Authentication required message
function AuthRequiredMessage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{t('chat.panel.signInRequired')}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {t('chat.panel.signInMessage')}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.location.href = '/auth/signup'}>
          {t('chat.panel.createAccount')}
        </Button>
        <Button variant="primary" onClick={() => window.location.href = '/auth/login'}>
          {t('chat.panel.signIn')}
        </Button>
      </div>
    </div>
  );
}

export function ChatPanel() {
  const { user, loading: authLoading } = useAuth();
  const csrfHeaders = useCSRFHeaders();
  const { t } = useTranslation();
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const setIsStreaming = useChatStore((state) => state.setIsStreaming);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedElements = useBIMStore((state) => state.selection.selectedIds);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to real API
  const sendMessage = useCallback(async (content: string) => {
    if (!user) {
      setError(t('chat.panel.signInToSend'));
      return;
    }

    setError(null);

    // Add user message
    const userMessageId = generateId();
    addMessage({
      id: userMessageId,
      role: 'user',
      content,
      timestamp: new Date(),
    });

    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeaders,
        },
        body: JSON.stringify({
          message: content,
          conversationId,
        }),
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
      let assistantContent = '';
      const assistantMessageId = generateId();

      // Add placeholder assistant message
      addMessage({
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'token':
                  assistantContent += data.content;
                  // Update the message content
                  useChatStore.getState().updateMessage(assistantMessageId, {
                    content: assistantContent,
                  });
                  break;

                case 'stream':
                  // Same as 'token' - stream text content
                  if (data.content) {
                    assistantContent += data.content;
                    useChatStore.getState().updateMessage(assistantMessageId, {
                      content: assistantContent,
                    });
                    // Update phase to responding if we're getting content
                    useChatStore.getState().updateMessageMetadata(assistantMessageId, {
                      agentPhase: 'responding',
                    });
                  }
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
                  // Update agent state to reasoning/processing phase
                  useChatStore.getState().setAgentPhase('reasoning');
                  // Update message metadata with new agent and task
                  useChatStore.getState().updateMessageMetadata(assistantMessageId, {
                    agentName: data.agent,
                    agentPhase: 'reasoning',
                    currentTask: data.task || undefined,
                  });
                  break;

                case 'tool_call_start':
                  // Update agent state with current tool
                  useChatStore.getState().setAgentPhase('tool_executing');
                  useChatStore.getState().setAgentCurrentTool(data.toolCall);
                  // Add tool to message's toolCalls array
                  {
                    const currentMsg = useChatStore.getState().messages.find(m => m.id === assistantMessageId);
                    const existingToolCalls = currentMsg?.metadata?.toolCalls || [];
                    useChatStore.getState().updateMessageMetadata(assistantMessageId, {
                      agentPhase: 'tool_executing',
                      toolCalls: [
                        ...existingToolCalls,
                        {
                          id: data.toolCall.id,
                          name: data.toolCall.name,
                          status: 'running' as const,
                          arguments: data.toolCall.arguments,
                          description: data.toolCall.description,
                        },
                      ],
                    });
                  }
                  break;

                case 'tool_call_complete':
                  // Update agent state - tool completed
                  useChatStore.getState().addAgentCompletedTool(data.toolCall);
                  // Update the tool in message's toolCalls array with result
                  {
                    const currentMsg = useChatStore.getState().messages.find(m => m.id === assistantMessageId);
                    const existingToolCalls = currentMsg?.metadata?.toolCalls || [];
                    const updatedToolCalls = existingToolCalls.map(tc =>
                      tc.id === data.toolCall.id
                        ? {
                            ...tc,
                            status: (data.toolCall.status === 'error' ? 'error' : 'success') as 'success' | 'error',
                            result: data.toolCall.result,
                            error: data.toolCall.error,
                          }
                        : tc
                    );
                    useChatStore.getState().updateMessageMetadata(assistantMessageId, {
                      agentPhase: 'synthesizing',
                      toolCalls: updatedToolCalls,
                    });
                  }
                  break;

                case 'done':
                  if (data.conversationId) {
                    setConversationId(data.conversationId);
                  }
                  // Reset agent state
                  useChatStore.getState().resetAgentState();
                  // Finalize message metadata
                  useChatStore.getState().updateMessageMetadata(assistantMessageId, {
                    isStreaming: false,
                    agentPhase: 'idle',
                    toolsUsed: data.metadata?.toolCalls?.map((tc: { name: string }) => tc.name) || [],
                  });
                  break;

                case 'error':
                  throw new Error(data.message);

                case 'ui_command':
                  // Execute UI commands from the agent on the 3D viewport
                  if (data.command) {
                    useBIMStore.getState().addPendingCommand(data.command);
                  }
                  break;

                case 'ui_component':
                  // Add UI component to message metadata
                  {
                    const currentMsg = useChatStore.getState().messages.find(m => m.id === assistantMessageId);
                    const existingComponents = currentMsg?.metadata?.uiComponents || [];
                    useChatStore.getState().updateMessageMetadata(assistantMessageId, {
                      uiComponents: [
                        ...existingComponents,
                        {
                          id: data.component.id,
                          type: data.component.type,
                          props: data.component.props,
                          zone: data.component.zone,
                        },
                      ],
                    });
                  }
                  break;
              }
            } catch {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);

      // Add error message
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: `❌ Error: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`,
        timestamp: new Date(),
      });
    } finally {
      setIsStreaming(false);
    }
  }, [user, conversationId, addMessage, setIsStreaming, csrfHeaders, t]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{t('chat.bimAgent')}</h2>
              <p className="text-xs text-muted-foreground">
                {user ? t('chat.aiPoweredBuildingIntelligence') : t('chat.signInToStart')}
              </p>
            </div>
          </div>

          {selectedElements.length > 0 && (
            <div className="px-3 py-1.5 bg-accent text-accent-foreground rounded-full text-sm">
              {t('chat.elementsSelected', { count: selectedElements.length })}
            </div>
          )}
        </div>
      </div>

      {/* Auth check */}
      {!user ? (
        <AuthRequiredMessage />
      ) : (
        <>
          <QuickActionsBar onSendMessage={sendMessage} />

          {/* Error banner */}
          {error && (
            <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto hover:underline">
                {t('common.close')}
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <WelcomeMessage onSendMessage={sendMessage} />
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

          <ChatInput onSendMessage={sendMessage} disabled={!user} />
        </>
      )}
    </div>
  );
}

function WelcomeMessage({ onSendMessage }: { onSendMessage: (message: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6">
        <Building2 className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{t('chat.welcomeToBimAgent')}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {t('chat.welcomeDescription')}
      </p>
      <div className="grid gap-3 w-full max-w-sm">
        <SuggestionButton icon="🏢" text={t('chat.suggestionFloorArea')} onSend={onSendMessage} />
        <SuggestionButton icon="🌱" text={t('chat.suggestionCarbon')} onSend={onSendMessage} />
        <SuggestionButton icon="⚡" text={t('chat.suggestionEnergy')} onSend={onSendMessage} />
      </div>
    </div>
  );
}

function SuggestionButton({ icon, text, onSend }: { icon: string; text: string; onSend: (message: string) => void }) {
  return (
    <button
      onClick={() => onSend(text)}
      className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:bg-accent transition-colors text-left"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium">{text}</span>
    </button>
  );
}

export default ChatPanel;
