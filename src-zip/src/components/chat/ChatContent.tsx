"use client";

/**
 * Chat Content Component
 *
 * The core chat interface that can be used standalone or embedded in WorkspaceLayout.
 * Contains the message list, input area, and handles streaming responses.
 */

import { useRef, useEffect, FormEvent, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Building2,
  Leaf,
  Calculator,
  FileUp,
  ArrowLeft,
  Loader2,
  Plus,
  Settings,
  Paperclip,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, generateId } from "@/lib/utils";
import { useCSRFHeaders, ensureCSRFToken } from "@/hooks/useCSRF";
import { Button } from "@/components/ui";
import { SmartAgentMessage } from "@/components/chat/SmartAgentMessage";
import { TypingIndicator } from "@/components/chat/MessageBubble";
// AgentProgressSteps removed - now using inline display in AgentResponseCard
import { useChatStore } from "@/stores/chat-store";
import { usePanelStore } from "@/stores/panel-store";
import { useSharedStateStore } from "@/stores/shared-state-store";
import { useTranslation } from "@/i18n/provider";
import { HITLContainer } from "@/components/chat/hitl";
import { PanelContextDetector } from "@/lib/panel/context-detector";
import { panelEventBus } from "@/lib/panel/event-bus";
import { TOOL_PANEL_MAP } from "@/hooks/useToolPanelBridge";
import { useFileUpload } from "@/hooks/useFileUpload";
import { UploadProgress } from "@/components/chat/UploadProgress";
import type { PanelId } from "@/lib/panels/types";

type PromptKey =
  | "embodiedCarbon"
  | "sustainability"
  | "materialComparison"
  | "bimAnalysis";

const PROMPT_KEYS: PromptKey[] = [
  "embodiedCarbon",
  "sustainability",
  "materialComparison",
  "bimAnalysis",
];

const promptIcons: Record<PromptKey, typeof Building2> = {
  embodiedCarbon: Building2,
  sustainability: Leaf,
  materialComparison: Calculator,
  bimAnalysis: FileUp,
};

const promptGradients: Record<PromptKey, string> = {
  embodiedCarbon: "from-emerald-500 to-teal-600",
  sustainability: "from-green-500 to-emerald-600",
  materialComparison: "from-blue-500 to-cyan-600",
  bimAnalysis: "from-purple-500 to-indigo-600",
};

/**
 * Parse basic carbon data from AI response text
 * Attempts to extract total carbon and materials from structured text
 */
function parseBasicCarbonData(content: string): { carbonResults?: { totalCarbon: number; unit: string; materials?: { name: string; carbon: number; percentage: number }[] } } {
  try {
    // Try to find total carbon value (e.g., "369 kgCO₂e/m²" or "1,845,000 kgCO₂e")
    const totalMatch = content.match(/(?:total|estimated|approximately)\s*[:\-]?\s*([\d,]+(?:\.\d+)?)\s*(kgCO₂e(?:\/m²)?|tCO₂e)/i);
    if (!totalMatch) {
      // Try alternative pattern for "Total = X kgCO₂e"
      const altMatch = content.match(/Total\s*[=:]\s*([\d,]+(?:\.\d+)?)\s*(kgCO₂e)/i);
      if (altMatch) {
        const totalCarbon = parseFloat(altMatch[1].replace(/,/g, ''));
        return {
          carbonResults: {
            totalCarbon,
            unit: altMatch[2],
          }
        };
      }
      return {};
    }

    const totalCarbon = parseFloat(totalMatch[1].replace(/,/g, ''));
    const unit = totalMatch[2];

    // Try to extract material breakdown
    const materials: { name: string; carbon: number; percentage: number }[] = [];

    // Pattern: "Material: X kgCO₂e" or "Material = X kgCO₂e"
    const materialMatches = content.matchAll(/(\w+(?:\s+\w+)?)\s*[:\-=]\s*([\d,]+(?:\.\d+)?)\s*(?:m[³²]\s*\*)?\s*[\d,]*\s*(?:kgCO₂e(?:\/m[³²])?)?(?:\s*=\s*)?([\d,]+(?:\.\d+)?)\s*kgCO₂e/gi);

    for (const match of materialMatches) {
      const name = match[1];
      const carbon = parseFloat(match[3]?.replace(/,/g, '') || match[2].replace(/,/g, ''));
      if (name && carbon && !isNaN(carbon)) {
        materials.push({
          name,
          carbon,
          percentage: 0, // Will calculate below
        });
      }
    }

    // Calculate percentages
    const totalFromMaterials = materials.reduce((sum, m) => sum + m.carbon, 0);
    if (totalFromMaterials > 0) {
      materials.forEach(m => {
        m.percentage = Math.round((m.carbon / totalFromMaterials) * 100);
      });
    }

    return {
      carbonResults: {
        totalCarbon,
        unit,
        ...(materials.length > 0 && { materials }),
      }
    };
  } catch {
    return {};
  }
}

interface ChatContentProps {
  /** Whether to show the header with navigation */
  showHeader?: boolean;
  /** Whether to show back button on mobile */
  showBackButton?: boolean;
  /** Custom class name for the container */
  className?: string;
}

function WelcomeScreen({
  onSendMessage,
}: {
  onSendMessage: (message: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          {t("chat.title")}
        </h1>
        <p className="text-muted-foreground text-lg max-w-md">
          {t("chat.subtitle")}
        </p>
      </motion.div>

      {/* Suggested prompts */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl"
      >
        {PROMPT_KEYS.map((key) => {
          const Icon = promptIcons[key];
          return (
            <button
              key={key}
              onClick={() => onSendMessage(t(`chat.prompts.${key}.prompt`))}
              className="group flex items-start gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 text-left"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                  promptGradients[key],
                )}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                  {t(`chat.prompts.${key}.title`)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {t(`chat.prompts.${key}.prompt`)}
                </p>
              </div>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}

export function ChatContent({
  showHeader = true,
  showBackButton = true,
  className,
}: ChatContentProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingMessageProcessed = useRef(false);
  const csrfHeaders = useCSRFHeaders();
  const { t } = useTranslation();

  // Use Zustand store for messages
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const updateMessageMetadata = useChatStore(
    (state) => state.updateMessageMetadata,
  );
  const clearMessages = useChatStore((state) => state.clearMessages);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const setIsStreaming = useChatStore((state) => state.setIsStreaming);
  const inputValue = useChatStore((state) => state.inputValue);
  const setInputValue = useChatStore((state) => state.setInputValue);

  // Agent state for tool visualization
  const setAgentPhase = useChatStore((state) => state.setAgentPhase);
  const setAgentCurrentTool = useChatStore(
    (state) => state.setAgentCurrentTool,
  );
  const addAgentCompletedTool = useChatStore(
    (state) => state.addAgentCompletedTool,
  );
  const resetAgentState = useChatStore((state) => state.resetAgentState);
  const agentState = useChatStore((state) => state.agentState);

  // Panel store for activating panels on tool calls
  const activatePanel = usePanelStore((state) => state.activatePanel);
  const enableTab = usePanelStore((state) => state.enableTab);
  const setActiveTab = usePanelStore((state) => state.setActiveTab);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // File upload hook for IFC and other files
  const {
    openFilePicker,
    dropZoneProps,
    isDragActive,
    uploadState,
    progress: uploadProgress,
    currentFile,
    error: uploadError,
    cancel: cancelUpload,
  } = useFileUpload({
    autoActivatePanel: true,
    onUploadComplete: (result) => {
      if (result.success) {
        // Auto-send message to analyze uploaded file
        const message = `I've uploaded ${result.filename}. Please analyze this file.`;
        setInputValue(message);
        // Trigger send after a short delay
        setTimeout(() => {
          const fakeEvent = { preventDefault: () => {} } as FormEvent;
          handleSubmit(fakeEvent);
        }, 100);
      }
    },
  });

  // Track mount state to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize CSRF token on mount
  useEffect(() => {
    ensureCSRFToken();
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  // Check for pending message from landing page and send it automatically
  useEffect(() => {
    if (!mounted || pendingMessageProcessed.current) return;

    const pendingMessage = sessionStorage.getItem("pendingChatMessage");
    if (pendingMessage) {
      pendingMessageProcessed.current = true;
      sessionStorage.removeItem("pendingChatMessage");

      // Small delay to ensure component is fully mounted
      const timeoutId = setTimeout(() => {
        sendMessage(pendingMessage);
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [mounted]);

  // Check for pending upload action from landing page
  useEffect(() => {
    if (!mounted) return;

    const pendingUpload = sessionStorage.getItem("pendingUploadAction");
    if (pendingUpload) {
      sessionStorage.removeItem("pendingUploadAction");

      // Small delay to ensure component is fully mounted, then open file picker
      const timeoutId = setTimeout(() => {
        openFilePicker();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [mounted, openFilePicker]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      setError(null);
      setInputValue("");

      // Add user message
      const userMessageId = generateId();
      addMessage({
        id: userMessageId,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      });

      // Detect and activate relevant panel based on user message content
      const detectionResult = PanelContextDetector.detectPanel({
        userMessage: content.trim(),
      });
      // Track which panel was activated for sending data later
      let activatedPanelId: PanelId | null = null;
      if (detectionResult.panelId && detectionResult.confidence >= 0.5) {
        console.log(`[ContextDetection] Activating panel: ${detectionResult.panelId} (confidence: ${detectionResult.confidence}, reason: ${detectionResult.reason})`);
        activatePanel(detectionResult.panelId, detectionResult.autoExpand);
        enableTab(detectionResult.panelId);
        if (detectionResult.autoExpand) {
          setActiveTab(detectionResult.panelId);
        }
        activatedPanelId = detectionResult.panelId;
      }

      // Add placeholder assistant message
      const assistantMessageId = generateId();
      addMessage({
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        metadata: { isStreaming: true },
      });

      setIsStreaming(true);

      try {
        // Get or create anonymous session ID
        let anonymousSessionId = localStorage.getItem("anonymousSessionId");
        if (!anonymousSessionId) {
          anonymousSessionId = generateId();
          localStorage.setItem("anonymousSessionId", anonymousSessionId);
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...csrfHeaders,
          },
          body: JSON.stringify({
            message: content.trim(),
            conversationId,
            anonymousSessionId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send message");
        }

        // Handle SSE stream
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response stream");
        }

        const decoder = new TextDecoder();
        let accumulatedContent = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                switch (data.type) {
                  case "token":
                  case "stream":
                    accumulatedContent += data.content;
                    // Update content without overwriting metadata
                    updateMessage(assistantMessageId, {
                      content: accumulatedContent,
                    });
                    updateMessageMetadata(assistantMessageId, {
                      isStreaming: true,
                    });
                    break;

                  case "thinking":
                    setAgentPhase("thinking");
                    updateMessageMetadata(assistantMessageId, {
                      isStreaming: true,
                      agentPhase: "thinking",
                    });
                    break;

                  case "agent_change":
                    // Agent routing happened - merge metadata
                    setAgentPhase("reasoning");
                    updateMessageMetadata(assistantMessageId, {
                      isStreaming: true,
                      agentName: data.agent,
                      agentPhase: "reasoning",
                      currentTask: data.task || undefined,
                    });
                    break;

                  case "tool_call_start":
                  case "tool_start": {
                    setAgentPhase("tool_executing");
                    const toolName =
                      data.toolName ||
                      data.name ||
                      data.toolCall?.name ||
                      "unknown_tool";
                    const toolId =
                      data.toolId ||
                      data.id ||
                      data.toolCall?.id ||
                      generateId();
                    const toolCall = {
                      id: toolId,
                      name: toolName,
                      status: "running" as const,
                      description:
                        data.description || data.toolCall?.description,
                      arguments: data.toolCall?.arguments,
                    };
                    setAgentCurrentTool({
                      ...toolCall,
                      startedAt: new Date(),
                    });

                    // Add tool to message metadata
                    const currentMsg = useChatStore
                      .getState()
                      .messages.find((m) => m.id === assistantMessageId);
                    const existingToolCalls =
                      currentMsg?.metadata?.toolCalls || [];
                    updateMessageMetadata(assistantMessageId, {
                      agentPhase: "tool_executing",
                      toolCalls: [...existingToolCalls, toolCall],
                    });

                    // Auto-activate relevant panel based on tool name
                    const panelId = TOOL_PANEL_MAP[toolName];
                    if (panelId) {
                      activatePanel(panelId);
                      enableTab(panelId);
                      setActiveTab(panelId);
                    }
                    break;
                  }

                  case "tool_call_complete":
                  case "tool_complete":
                  case "tool_result": {
                    const completedToolId =
                      data.toolCall?.id || agentState.currentTool?.id;
                    if (agentState.currentTool) {
                      addAgentCompletedTool({
                        ...agentState.currentTool,
                        status: data.error ? "error" : "success",
                        result: data.result || data.toolCall?.result,
                        completedAt: new Date(),
                      });
                    }
                    setAgentPhase("synthesizing");

                    // Update tool status in message metadata
                    const msg = useChatStore
                      .getState()
                      .messages.find((m) => m.id === assistantMessageId);
                    const toolCalls = msg?.metadata?.toolCalls || [];
                    const updatedToolCalls = toolCalls.map((tc) =>
                      tc.id === completedToolId
                        ? {
                            ...tc,
                            status: (data.error ? "error" : "success") as
                              | "success"
                              | "error",
                            result: data.result || data.toolCall?.result,
                          }
                        : tc,
                    );
                    updateMessageMetadata(assistantMessageId, {
                      agentPhase: "synthesizing",
                      toolCalls: updatedToolCalls,
                    });
                    break;
                  }

                  case "hitl_request": {
                    // Handle Human-in-the-Loop request
                    // Store the request in shared state for HITLContainer to display
                    const hitlRequest = data.request;
                    if (hitlRequest) {
                      useSharedStateStore.getState().setPendingHITL({
                        requestId: hitlRequest.requestId,
                        type: hitlRequest.type,
                        payload: hitlRequest.payload,
                        context: hitlRequest.context,
                      });
                    }
                    break;
                  }

                  case "done":
                  case "complete":
                    if (data.conversationId) {
                      setConversationId(data.conversationId);
                    }
                    // Merge metadata to preserve toolCalls, uiComponents, etc.
                    updateMessageMetadata(assistantMessageId, {
                      isStreaming: false,
                      agentPhase: undefined,
                    });

                    // Send accumulated content to activated panel (if any)
                    // This enables panels to display AI analysis even when no tools were called
                    if (activatedPanelId && accumulatedContent) {
                      console.log(`[ContextDetection] Sending content to panel: ${activatedPanelId}`);
                      panelEventBus.publish('chat', {
                        type: 'UPDATE_PANEL_DATA',
                        panelId: activatedPanelId,
                        data: {
                          // For carbon-dashboard, provide raw analysis
                          rawAnalysis: accumulatedContent,
                          // Parse basic carbon data if possible
                          ...(activatedPanelId === 'carbon-dashboard' && parseBasicCarbonData(accumulatedContent)),
                          // For document-editor, provide the content as document
                          ...(activatedPanelId === 'document-editor' && { documentContent: accumulatedContent }),
                          timestamp: Date.now(),
                        },
                        merge: true,
                      });
                    }

                    resetAgentState();
                    break;

                  case "error":
                    throw new Error(data.message);
                }
              } catch (parseError) {
                // Only ignore JSON parse errors for incomplete chunks
                // Re-throw actual errors from event processing
                if (parseError instanceof SyntaxError) {
                  // JSON parse error - ignore, chunk is incomplete
                } else {
                  throw parseError;
                }
              }
            }
          }
        }

        // Finalize message - update content and merge metadata
        updateMessage(assistantMessageId, {
          content: accumulatedContent || t("chat.analysisComplete"),
        });
        updateMessageMetadata(assistantMessageId, { isStreaming: false });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);

        // Update assistant message with error - merge metadata
        updateMessage(assistantMessageId, {
          content: `Error: ${errorMessage}`,
        });
        updateMessageMetadata(assistantMessageId, { isStreaming: false });
      } finally {
        setIsStreaming(false);
        resetAgentState();
      }
    },
    [
      conversationId,
      csrfHeaders,
      isStreaming,
      addMessage,
      updateMessage,
      updateMessageMetadata,
      setIsStreaming,
      setInputValue,
      t,
      setAgentPhase,
      setAgentCurrentTool,
      addAgentCompletedTool,
      resetAgentState,
      agentState,
      activatePanel,
      enableTab,
      setActiveTab,
    ],
  );

  // Handle HITL (Human-in-the-Loop) response
  const handleHITLResponse = useCallback(
    async (requestId: string, accepted: boolean, data?: unknown) => {
      // Clear the pending HITL request
      useSharedStateStore.getState().clearPendingHITL();

      // Send the response back to the API by adding a system message
      // that will be processed by the agent
      const responseMessage = accepted
        ? `[HITL Response: ${requestId}] User accepted${data ? `: ${JSON.stringify(data)}` : ""}`
        : `[HITL Response: ${requestId}] User declined`;

      // Add the response as a message to continue the conversation
      sendMessage(responseMessage);
    },
    [sendMessage],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const startNewChat = () => {
    clearMessages();
    setConversationId(null);
    setError(null);
    inputRef.current?.focus();
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={cn("flex flex-col h-full bg-background", className)}>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      {showHeader && (
        <header className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/")}
                  className="md:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold hidden sm:inline">
                  CarbonBIM
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={startNewChat}
                title={t("chat.newChat")}
              >
                <Plus className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard")}
                title={t("nav.settings")}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-6">
          {messages.length === 0 ? (
            <WelcomeScreen onSendMessage={sendMessage} />
          ) : (
            <div className="space-y-2">
              {messages.map((message, index) => {
                // For the last assistant message during streaming, use agent state for tool calls
                const isLastAssistantStreaming =
                  message.role === "assistant" &&
                  index === messages.length - 1 &&
                  isStreaming;

                // Build tool calls from agent state for streaming message
                const streamingToolCalls = isLastAssistantStreaming
                  ? [
                      ...agentState.completedTools.map((t) => ({
                        id: t.id,
                        name: t.name,
                        status: t.status,
                        description: t.description,
                        result: t.result,
                      })),
                      ...(agentState.currentTool
                        ? [
                            {
                              id: agentState.currentTool.id,
                              name: agentState.currentTool.name,
                              status: agentState.currentTool.status,
                              description: agentState.currentTool.description,
                            },
                          ]
                        : []),
                    ]
                  : message.metadata?.toolCalls;

                return (
                  <SmartAgentMessage
                    key={message.id}
                    role={message.role as "user" | "assistant" | "system"}
                    content={message.content}
                    timestamp={message.timestamp}
                    toolCalls={streamingToolCalls}
                    agentName={
                      message.metadata?.agentName ||
                      (isLastAssistantStreaming
                        ? agentState.currentTool?.name?.split("_")[0]
                        : undefined)
                    }
                    viewportCommands={message.metadata?.viewportCommands}
                    isStreaming={message.metadata?.isStreaming}
                    agentPhase={
                      isLastAssistantStreaming
                        ? agentState.phase === "error"
                          ? "thinking"
                          : agentState.phase
                        : undefined
                    }
                    currentTask={
                      isLastAssistantStreaming
                        ? agentState.currentTool?.description
                        : undefined
                    }
                    uiComponents={message.metadata?.uiComponents}
                  />
                );
              })}
              {isStreaming && messages[messages.length - 1]?.content === "" && (
                <TypingIndicator />
              )}

              {/* HITL Container for inline human-in-the-loop requests */}
              <HITLContainer onResponse={handleHITLResponse} className="px-4" />

              {/* Agent Progress Steps - REMOVED: Now using inline display in SmartAgentMessage/AgentResponseCard */}
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 text-center"
          >
            <span className="text-sm text-destructive">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-sm underline hover:no-underline"
            >
              {t("chat.dismiss")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal floating input - no background/border */}
      <div className="px-4 pb-4">
        {/* Upload progress indicator */}
        {(uploadState === 'uploading' || uploadState === 'success' || uploadState === 'error') && currentFile && (
          <div className="mb-2">
            <UploadProgress
              filename={currentFile.name}
              fileSize={currentFile.size}
              progress={uploadProgress}
              targetPanel={currentFile.targetPanel}
              status={uploadState === 'uploading' ? 'uploading' : uploadState === 'success' ? 'success' : 'error'}
              error={uploadError ?? undefined}
              onCancel={cancelUpload}
              onRetry={() => openFilePicker()}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2" {...dropZoneProps}>
          {/* File upload button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={openFilePicker}
            disabled={isStreaming || uploadState === 'uploading'}
            className={cn(
              "flex-shrink-0 hover:bg-primary/10",
              isDragActive && "ring-2 ring-primary"
            )}
            title="Upload file (IFC, PDF, Excel, Image)"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chat.placeholder")}
            disabled={isStreaming}
            rows={1}
            className={cn(
              "flex-1 resize-none px-4 py-3 rounded-2xl",
              "bg-transparent border border-transparent",
              "focus:border-primary/50 focus:ring-0",
              "placeholder:text-muted-foreground",
              "text-sm leading-relaxed",
              "max-h-[200px]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200",
              isDragActive && "ring-2 ring-primary"
            )}
            style={{
              backgroundColor: "rgba(128, 128, 128, 0.1)",
            }}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            disabled={!inputValue.trim() || isStreaming}
            className="flex-shrink-0 hover:bg-primary/10"
          >
            {isStreaming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
