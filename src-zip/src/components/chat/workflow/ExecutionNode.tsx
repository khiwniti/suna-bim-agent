'use client';

/**
 * ExecutionNode - Tool execution visualization node
 *
 * Displays a single tool execution with status, duration, and results.
 */

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowNodeProps, NodeStatus } from './types';
import type { ToolCallVisualization } from '@/lib/generative-ui/types';

export interface ExecutionNodeProps extends WorkflowNodeProps {
  toolCall: ToolCallVisualization;
}

const STATUS_ICONS: Record<NodeStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-muted-foreground" />,
  active: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
  abandoned: <XCircle className="w-4 h-4 text-muted-foreground" />,
};

const STATUS_COLORS: Record<NodeStatus, string> = {
  pending: 'border-muted-foreground/30 bg-muted/20',
  active: 'border-blue-500 bg-blue-500/10',
  completed: 'border-green-500/50 bg-green-500/5',
  error: 'border-red-500/50 bg-red-500/5',
  abandoned: 'border-muted-foreground/30 bg-muted/10 opacity-60',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function ExecutionNode({
  id: _id,
  status,
  toolCall,
  isExpanded = false,
  onToggle,
  onClick,
}: ExecutionNodeProps) {
  const duration =
    toolCall.startedAt && toolCall.completedAt
      ? toolCall.completedAt.getTime() - toolCall.startedAt.getTime()
      : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-lg border-2 p-3 transition-all cursor-pointer',
        STATUS_COLORS[status]
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        {STATUS_ICONS[status]}
        <span className="font-medium text-sm flex-1">{toolCall.name}</span>
        {duration !== undefined && (
          <span className="text-xs text-muted-foreground font-mono">
            {formatDuration(duration)}
          </span>
        )}
        {onToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Progress bar for running state */}
      {status === 'active' && toolCall.progress !== undefined && (
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${toolCall.progress}%` }}
          />
        </div>
      )}

      {/* Expanded details */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-3 pt-3 border-t border-border space-y-2 overflow-hidden"
        >
          {/* Arguments */}
          {toolCall.arguments && Object.keys(toolCall.arguments).length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                Arguments
              </span>
              <pre className="mt-1 text-xs bg-muted/50 rounded p-2 overflow-x-auto max-h-20">
                {JSON.stringify(toolCall.arguments, null, 2)}
              </pre>
            </div>
          )}

          {/* Result */}
          {toolCall.result !== undefined && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                Result
              </span>
              <pre className="mt-1 text-xs bg-muted/50 rounded p-2 overflow-x-auto max-h-24">
                {typeof toolCall.result === 'string'
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {toolCall.error && (
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600 dark:text-red-400">
              {toolCall.error}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default ExecutionNode;
