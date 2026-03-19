'use client';

/**
 * ChatMessageWithTools - Enhanced message component with tool visualization
 *
 * Extends MessageBubble to render tool calls inline using the ToolVisualizer registry.
 * Provides collapsible tool sections and matches existing chat styling.
 *
 * ★ Insight ─────────────────────────────────────
 * This component bridges the gap between raw chat messages and rich tool
 * visualizations. When an AI response includes tool calls (code execution,
 * web search, data queries), this component renders specialized visualizers
 * that provide better UX than raw JSON output.
 * ─────────────────────────────────────────────────
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageBubble, type MessageRole } from './MessageBubble';
import { ToolVisualizer } from './tool-visualizers';
import type { ToolCallVisualization } from '@/lib/generative-ui/types';

/**
 * Tool call structure from ChatMessage metadata
 */
export interface ToolCall {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  arguments?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  progress?: number;
  description?: string;
}

/**
 * Props for ChatMessageWithTools
 */
export interface ChatMessageWithToolsProps {
  /** Message role */
  role: MessageRole;
  /** Text content of the message */
  content: string;
  /** Message timestamp */
  timestamp?: Date;
  /** Tool calls to visualize */
  toolCalls?: ToolCall[];
  /** Whether the message is currently streaming */
  isStreaming?: boolean;
  /** Whether tool calls section is initially collapsed */
  toolsCollapsed?: boolean;
  /** Callback when tool collapse state changes */
  onToolsToggle?: (collapsed: boolean) => void;
  /** CSS class name */
  className?: string;
}

/**
 * Convert ToolCall to ToolCallVisualization for the visualizer
 */
function toToolCallVisualization(toolCall: ToolCall): ToolCallVisualization {
  return {
    id: toolCall.id,
    name: toolCall.name,
    status: toolCall.status,
    startedAt: new Date(),
    completedAt: toolCall.status === 'success' || toolCall.status === 'error' ? new Date() : undefined,
    arguments: toolCall.arguments,
    result: toolCall.result,
    error: toolCall.error,
    progress: toolCall.progress,
  };
}

/**
 * Map tool names to their prop types for visualization
 */
function getToolProps(toolCall: ToolCall): Record<string, unknown> {
  const { name, arguments: args, result, status } = toolCall;

  // Code execution tools
  if (['execute_code', 'run_python', 'run_javascript', 'code_execution'].includes(name)) {
    return {
      language: (args?.language as string) || 'python',
      code: (args?.code as string) || '',
      output: result as { stdout?: string; stderr?: string; exitCode?: number } | undefined,
      status: status === 'running' ? 'running' : status === 'success' ? 'success' : 'error',
    };
  }

  // Web search tools
  if (['web_search', 'search', 'tavily_search'].includes(name)) {
    const searchResult = result as { results?: Array<{ url: string; title: string; snippet: string; favicon?: string }> } | undefined;
    return {
      query: (args?.query as string) || '',
      results: searchResult?.results || [],
      status: status === 'running' ? 'searching' : 'complete',
    };
  }

  // Data query tools
  if (['sql_query', 'api_call', 'graphql_query', 'database_query', 'data_query'].includes(name)) {
    const queryResult = result as { data?: Record<string, unknown>[]; rowCount?: number; executionTimeMs?: number } | undefined;
    return {
      queryType: name.includes('sql') ? 'sql' : name.includes('graphql') ? 'graphql' : 'api',
      query: (args?.query as string) || (args?.sql as string) || JSON.stringify(args, null, 2),
      result: queryResult,
      status: status === 'running' ? 'executing' : status === 'success' ? 'success' : 'error',
    };
  }

  // Default: return raw arguments
  return args || {};
}

/**
 * Tool call section header
 */
function ToolsHeader({
  toolCount,
  isCollapsed,
  onToggle,
}: {
  toolCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-2',
        'text-xs text-muted-foreground',
        'hover:bg-muted/50 rounded-lg transition-colors',
        'border border-border/50'
      )}
    >
      <Wrench className="w-3.5 h-3.5" />
      <span className="font-medium">
        {toolCount} tool {toolCount === 1 ? 'call' : 'calls'}
      </span>
      <span className="flex-1" />
      {isCollapsed ? (
        <ChevronRight className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );
}

/**
 * ChatMessageWithTools - Renders messages with inline tool visualizations
 */
export function ChatMessageWithTools({
  role,
  content,
  timestamp,
  toolCalls,
  isStreaming = false,
  toolsCollapsed: initialCollapsed = false,
  onToolsToggle,
  className,
}: ChatMessageWithToolsProps) {
  const [isToolsCollapsed, setIsToolsCollapsed] = useState(initialCollapsed);

  // Filter to only show tool calls for assistant messages
  const visibleToolCalls = useMemo(() => {
    if (role !== 'assistant' || !toolCalls?.length) return [];
    return toolCalls;
  }, [role, toolCalls]);

  // Handle toggle
  const handleToggle = () => {
    const newState = !isToolsCollapsed;
    setIsToolsCollapsed(newState);
    onToolsToggle?.(newState);
  };

  // No tool calls - render standard message
  if (visibleToolCalls.length === 0) {
    return (
      <MessageBubble
        role={role}
        content={content}
        timestamp={timestamp}
        isStreaming={isStreaming}
        className={className}
      />
    );
  }

  // Render message with tool calls
  return (
    <div className={cn('space-y-2', className)}>
      {/* Tool calls section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4"
      >
        <ToolsHeader
          toolCount={visibleToolCalls.length}
          isCollapsed={isToolsCollapsed}
          onToggle={handleToggle}
        />

        <AnimatePresence>
          {!isToolsCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 mt-2">
                {visibleToolCalls.map((toolCall) => (
                  <ToolVisualizer
                    key={toolCall.id}
                    toolCall={toToolCallVisualization(toolCall)}
                    toolProps={getToolProps(toolCall)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Message content (if any) */}
      {content && (
        <MessageBubble
          role={role}
          content={content}
          timestamp={timestamp}
          isStreaming={isStreaming}
        />
      )}
    </div>
  );
}

export default ChatMessageWithTools;
