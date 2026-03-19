'use client';

/**
 * Tool Call Visualization Component
 *
 * Shows real-time tool execution status inline in chat
 * ChatGPT/Claude-style: "🔧 Using analyzeCarbon tool..."
 */

import { motion } from 'framer-motion';
import {
  Brain,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ToolCallVisualization } from '@/lib/generative-ui/types';

interface ToolCallCardProps {
  toolCall: ToolCallVisualization;
  compact?: boolean;
}

export function ToolCallCard({ toolCall, compact = false }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  const StatusIcon =
    toolCall.status === 'success'
      ? CheckCircle2
      : toolCall.status === 'error'
      ? AlertCircle
      : toolCall.status === 'running'
      ? Loader2
      : Brain;

  const statusColor =
    toolCall.status === 'success'
      ? 'text-green-600 dark:text-green-400'
      : toolCall.status === 'error'
      ? 'text-red-600 dark:text-red-400'
      : toolCall.status === 'running'
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-muted-foreground';

  const statusBg =
    toolCall.status === 'success'
      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
      : toolCall.status === 'error'
      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
      : toolCall.status === 'running'
      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
      : 'bg-muted/30 border-border';

  if (compact && toolCall.status === 'running') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground"
      >
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span>Using {toolCall.name}</span>
        {toolCall.progress !== undefined && (
          <span className="text-xs">({toolCall.progress}%)</span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'rounded-lg border p-3 mb-2',
        statusBg,
        'transition-all duration-200'
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <StatusIcon
          className={cn(
            'w-4 h-4 flex-shrink-0',
            statusColor,
            toolCall.status === 'running' && 'animate-spin'
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{toolCall.name}</span>
            {toolCall.status === 'running' && toolCall.progress !== undefined && (
              <span className="text-xs text-muted-foreground">
                {toolCall.progress}%
              </span>
            )}
          </div>
          {toolCall.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {toolCall.description}
            </p>
          )}
        </div>

        {(toolCall.arguments || toolCall.result || toolCall.error) && (
          <button className="p-1 hover:bg-background/50 rounded transition-colors">
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {toolCall.status === 'running' && toolCall.progress !== undefined && (
        <div className="mt-2 w-full bg-background/50 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-blue-600 dark:bg-blue-400"
            initial={{ width: 0 }}
            animate={{ width: `${toolCall.progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Expanded Details */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-3 pt-3 border-t border-border/50 space-y-2"
        >
          {/* Arguments */}
          {toolCall.arguments && Object.keys(toolCall.arguments).length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Arguments:
              </p>
              <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
                {JSON.stringify(toolCall.arguments, null, 2)}
              </pre>
            </div>
          )}

          {/* Result */}
          {toolCall.result && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Result:
              </p>
              <div className="text-xs bg-background/50 p-2 rounded">
                {typeof toolCall.result === 'string'
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </div>
            </div>
          )}

          {/* Error */}
          {toolCall.error && (
            <div>
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                Error:
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 bg-background/50 p-2 rounded">
                {toolCall.error}
              </p>
            </div>
          )}

          {/* Timing */}
          {toolCall.startedAt && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>
                Started: {new Date(toolCall.startedAt).toLocaleTimeString()}
              </span>
              {toolCall.completedAt && (
                <span>
                  • Completed:{' '}
                  {new Date(toolCall.completedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Thinking Indicator - Minimal version for inline display
 */
export function ThinkingIndicator({ message }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground"
    >
      <Brain className="w-4 h-4 animate-pulse text-blue-600" />
      <span>{message || 'Thinking...'}</span>
    </motion.div>
  );
}
