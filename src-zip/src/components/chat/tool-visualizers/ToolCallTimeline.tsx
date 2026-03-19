'use client';

/**
 * ToolCallTimeline - Multi-tool sequence visualization
 *
 * Displays a vertical timeline of tool calls showing execution order,
 * durations, and status. Supports parallel execution visualization.
 *
 * ★ Insight ─────────────────────────────────────
 * Complex AI workflows often involve multiple tool calls in sequence
 * or parallel. This timeline helps users understand the execution
 * flow and identify bottlenecks or failed steps.
 * ─────────────────────────────────────────────────
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolCallVisualization } from '@/lib/generative-ui/types';

// ============================================
// Types
// ============================================

export interface ToolCallTimelineProps {
  /** Array of tool calls to display */
  toolCalls: ToolCallVisualization[];
  /** Whether to show expanded details by default */
  expandedByDefault?: boolean;
  /** Whether to show duration for each call */
  showDurations?: boolean;
  /** Whether to show parallel execution indicators */
  showParallel?: boolean;
  /** Callback when a tool call is clicked */
  onToolClick?: (toolCall: ToolCallVisualization) => void;
  /** CSS class name */
  className?: string;
}

interface TimelineNode {
  id: string;
  toolCall: ToolCallVisualization;
  isParallel: boolean;
  parallelGroup?: string;
  duration?: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate duration in milliseconds between start and completion
 */
function calculateDuration(toolCall: ToolCallVisualization): number | undefined {
  if (!toolCall.startedAt) return undefined;
  const endTime = toolCall.completedAt || new Date();
  return endTime.getTime() - toolCall.startedAt.getTime();
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

/**
 * Detect parallel tool calls based on overlapping timestamps
 */
function detectParallelGroups(toolCalls: ToolCallVisualization[]): TimelineNode[] {
  const nodes: TimelineNode[] = [];
  let parallelGroupIndex = 0;

  for (let i = 0; i < toolCalls.length; i++) {
    const current = toolCalls[i];
    const prev = i > 0 ? toolCalls[i - 1] : null;

    // Check if this call started before the previous one ended
    const isParallel =
      prev &&
      current.startedAt &&
      prev.startedAt &&
      prev.completedAt &&
      current.startedAt < prev.completedAt;

    if (isParallel) {
      // Continue or start parallel group
      nodes.push({
        id: current.id,
        toolCall: current,
        isParallel: true,
        parallelGroup: `parallel-${parallelGroupIndex}`,
        duration: calculateDuration(current),
      });
    } else {
      // New sequential node
      if (nodes.length > 0 && nodes[nodes.length - 1].isParallel) {
        parallelGroupIndex++;
      }
      nodes.push({
        id: current.id,
        toolCall: current,
        isParallel: false,
        duration: calculateDuration(current),
      });
    }
  }

  return nodes;
}

// ============================================
// Status Icon Component
// ============================================

function StatusIcon({
  status,
  className,
}: {
  status: ToolCallVisualization['status'];
  className?: string;
}) {
  switch (status) {
    case 'pending':
      return <Clock className={cn('w-4 h-4 text-muted-foreground', className)} />;
    case 'running':
      return (
        <Loader2
          className={cn('w-4 h-4 text-blue-500 animate-spin', className)}
        />
      );
    case 'success':
      return (
        <CheckCircle2 className={cn('w-4 h-4 text-green-500', className)} />
      );
    case 'error':
      return <XCircle className={cn('w-4 h-4 text-red-500', className)} />;
    default:
      return null;
  }
}

// ============================================
// Timeline Node Component
// ============================================

interface TimelineNodeProps {
  node: TimelineNode;
  isLast: boolean;
  isExpanded: boolean;
  showDurations: boolean;
  onToggle: () => void;
  onClick?: (toolCall: ToolCallVisualization) => void;
}

function TimelineNodeItem({
  node,
  isLast,
  isExpanded,
  showDurations,
  onToggle,
  onClick,
}: TimelineNodeProps) {
  const { toolCall, isParallel, duration } = node;

  const statusColors = {
    pending: 'border-muted-foreground',
    running: 'border-blue-500 bg-blue-500/10',
    success: 'border-green-500',
    error: 'border-red-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative"
    >
      {/* Vertical connector line */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-4 top-8 w-0.5 h-[calc(100%)]',
            toolCall.status === 'running' ? 'bg-blue-500/50' : 'bg-border'
          )}
        />
      )}

      {/* Parallel indicator */}
      {isParallel && (
        <div className="absolute left-0 top-2 flex items-center">
          <GitBranch className="w-3 h-3 text-muted-foreground rotate-180" />
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          'flex items-start gap-3 pl-2',
          isParallel && 'ml-4'
        )}
      >
        {/* Status indicator */}
        <div
          className={cn(
            'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 bg-background',
            statusColors[toolCall.status]
          )}
        >
          <StatusIcon status={toolCall.status} />
        </div>

        {/* Content card */}
        <div
          className={cn(
            'flex-1 rounded-lg border p-3 mb-2 cursor-pointer transition-colors',
            toolCall.status === 'running' && 'border-blue-500/50 bg-blue-500/5',
            toolCall.status === 'error' && 'border-red-500/50 bg-red-500/5'
          )}
          onClick={() => onClick?.(toolCall)}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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
              <span className="font-medium text-sm">{toolCall.name}</span>
              {toolCall.status === 'running' && (
                <span className="text-xs text-blue-500 animate-pulse">
                  Running...
                </span>
              )}
            </div>
            {showDurations && duration !== undefined && (
              <span className="text-xs text-muted-foreground font-mono">
                {formatDuration(duration)}
              </span>
            )}
          </div>

          {/* Progress bar for running state */}
          {toolCall.status === 'running' && toolCall.progress !== undefined && (
            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${toolCall.progress}%` }}
              />
            </div>
          )}

          {/* Expanded details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  {/* Arguments */}
                  {toolCall.arguments && Object.keys(toolCall.arguments).length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Arguments
                      </span>
                      <pre className="mt-1 text-xs bg-muted/50 rounded p-2 overflow-x-auto max-h-24">
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
                      <pre className="mt-1 text-xs bg-muted/50 rounded p-2 overflow-x-auto max-h-32">
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

                  {/* Timestamps */}
                  <div className="flex gap-4 text-[10px] text-muted-foreground">
                    {toolCall.startedAt && (
                      <span>
                        Started: {toolCall.startedAt.toLocaleTimeString()}
                      </span>
                    )}
                    {toolCall.completedAt && (
                      <span>
                        Completed: {toolCall.completedAt.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function ToolCallTimeline({
  toolCalls,
  expandedByDefault = false,
  showDurations = true,
  showParallel = true,
  onToolClick,
  className,
}: ToolCallTimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    expandedByDefault ? new Set(toolCalls.map((tc) => tc.id)) : new Set()
  );

  // Process tool calls into timeline nodes
  const nodes = useMemo(
    () => (showParallel ? detectParallelGroups(toolCalls) : toolCalls.map((tc) => ({
      id: tc.id,
      toolCall: tc,
      isParallel: false,
      duration: calculateDuration(tc),
    }))),
    [toolCalls, showParallel]
  );

  // Calculate total duration
  const totalDuration = useMemo(() => {
    if (toolCalls.length === 0) return 0;
    const now = new Date().getTime();
    const starts = toolCalls
      .map((tc) => tc.startedAt?.getTime())
      .filter((t): t is number => t !== undefined);
    const ends = toolCalls
      .map((tc) => tc.completedAt?.getTime() ?? now)
      .filter((t): t is number => t !== undefined);
    if (starts.length === 0 || ends.length === 0) return 0;
    return Math.max(...ends) - Math.min(...starts);
  }, [toolCalls]);

  // Toggle expansion
  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Count by status
  const statusCounts = useMemo(() => {
    const counts = { pending: 0, running: 0, success: 0, error: 0 };
    toolCalls.forEach((tc) => {
      counts[tc.status]++;
    });
    return counts;
  }, [toolCalls]);

  if (toolCalls.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header summary */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {toolCalls.length} tool {toolCalls.length === 1 ? 'call' : 'calls'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {statusCounts.success > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              {statusCounts.success}
            </span>
          )}
          {statusCounts.running > 0 && (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
              {statusCounts.running}
            </span>
          )}
          {statusCounts.error > 0 && (
            <span className="flex items-center gap-1">
              <XCircle className="w-3 h-3 text-red-500" />
              {statusCounts.error}
            </span>
          )}
          {showDurations && totalDuration > 0 && (
            <span className="font-mono">
              Total: {formatDuration(totalDuration)}
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="pl-2">
        {nodes.map((node, index) => (
          <TimelineNodeItem
            key={node.id}
            node={node}
            isLast={index === nodes.length - 1}
            isExpanded={expandedIds.has(node.id)}
            showDurations={showDurations}
            onToggle={() => toggleExpanded(node.id)}
            onClick={onToolClick}
          />
        ))}
      </div>
    </div>
  );
}

export default ToolCallTimeline;
