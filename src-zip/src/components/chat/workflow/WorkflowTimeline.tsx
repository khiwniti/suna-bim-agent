'use client';

/**
 * WorkflowTimeline - Vertical timeline/flowchart for agent workflow visualization
 *
 * Displays the agent's decision-making process, tool executions,
 * and reasoning flow in a visual timeline format.
 *
 * ★ Insight ─────────────────────────────────────
 * Workflow visualization helps users understand how the AI reached its conclusions.
 * Showing decision points, parallel executions, and abandoned paths builds trust
 * and enables debugging when results are unexpected.
 * ─────────────────────────────────────────────────
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Brain,
  MessageSquare,
  CheckCircle2,
  Clock,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import { ExecutionNode } from './ExecutionNode';
import { DecisionNode } from './DecisionNode';
import { ConvergenceNode } from './ConvergenceNode';
import { AbandonedPath } from './AbandonedPath';
import { WorkflowControls } from './WorkflowControls';
import {
  useReducedMotion,
  getTimelineAriaProps,
} from '@/lib/accessibility';
import type {
  AgentWorkflowEvent,
  ViewMode,
  NodeStatus,
} from './types';

export interface WorkflowTimelineProps {
  events: AgentWorkflowEvent[];
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onNodeClick?: (nodeId: string) => void;
  onPathInspect?: (pathId: string) => void;
  className?: string;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function getEventStatus(event: AgentWorkflowEvent, isLast: boolean): NodeStatus {
  if (event.type === 'abandoned_path') return 'abandoned';
  if (event.type === 'end' && !(event as { success?: boolean }).success) return 'error';
  if (isLast && event.type !== 'end') return 'active';
  return 'completed';
}

export function WorkflowTimeline({
  events,
  viewMode: externalViewMode,
  onViewModeChange,
  onNodeClick,
  onPathInspect,
  className,
}: WorkflowTimelineProps) {
  const { t } = useTranslation();
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('simple');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showAbandoned, setShowAbandoned] = useState(true);

  // Accessibility: detect reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  const viewMode = externalViewMode ?? internalViewMode;
  const handleViewModeChange = onViewModeChange ?? setInternalViewMode;

  // Filter events based on settings
  const visibleEvents = useMemo(() => {
    let filtered = events;
    if (!showAbandoned) {
      filtered = filtered.filter((e) => e.type !== 'abandoned_path');
    }
    if (viewMode === 'simple') {
      // In simple mode, only show key events
      filtered = filtered.filter((e) =>
        ['start', 'decision', 'tool_execution', 'response', 'end'].includes(e.type)
      );
    }
    return filtered;
  }, [events, showAbandoned, viewMode]);

  // Calculate total duration
  const totalDuration = useMemo(() => {
    const endEvent = events.find((e) => e.type === 'end') as { totalDuration?: number } | undefined;
    if (endEvent?.totalDuration) return endEvent.totalDuration;

    if (events.length >= 2) {
      const start = events[0].timestamp;
      const end = events[events.length - 1].timestamp;
      return end.getTime() - start.getTime();
    }
    return 0;
  }, [events]);

  // Determine if workflow is complete for accessibility
  const isWorkflowComplete = events.some((e) => e.type === 'end');
  const timelineAriaProps = getTimelineAriaProps(events.length, isWorkflowComplete);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllExpanded = () => {
    if (expandedNodes.size > 0) {
      setExpandedNodes(new Set());
    } else {
      setExpandedNodes(new Set(events.map((e) => e.id)));
    }
  };

  const renderEvent = (event: AgentWorkflowEvent, index: number) => {
    const isLast = index === visibleEvents.length - 1;
    const status = getEventStatus(event, isLast);
    const isExpanded = viewMode === 'detailed' || expandedNodes.has(event.id);

    switch (event.type) {
      case 'start':
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Play className="w-4 h-4 text-green-500" />
            <span>Workflow started</span>
          </div>
        );

      case 'thinking':
        if (viewMode === 'simple') return null;
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-2"
          >
            <Brain className="w-4 h-4 text-purple-500 mt-0.5" />
            <div className="flex-1">
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Thinking...
              </span>
              {event.content && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {event.content}
                </p>
              )}
            </div>
          </motion.div>
        );

      case 'decision':
        return (
          <DecisionNode
            id={event.id}
            status={status}
            decision={event}
            isExpanded={isExpanded}
            onToggle={() => toggleNode(event.id)}
            onClick={() => onNodeClick?.(event.id)}
          />
        );

      case 'parallel_start':
        return (
          <div className="flex items-center gap-2 text-sm">
            <GitBranch className="w-4 h-4 text-blue-500" />
            <span className="text-blue-600 dark:text-blue-400">
              Parallel execution: {event.branches.length} branches
            </span>
          </div>
        );

      case 'tool_execution':
        return (
          <ExecutionNode
            id={event.id}
            status={status}
            toolCall={event.toolCall}
            isExpanded={isExpanded}
            onToggle={() => toggleNode(event.id)}
            onClick={() => onNodeClick?.(event.id)}
          />
        );

      case 'parallel_end':
        return (
          <div className="flex items-center gap-2 text-sm">
            <GitBranch className="w-4 h-4 text-blue-500 rotate-180" />
            <span className="text-muted-foreground">
              Parallel execution complete
            </span>
          </div>
        );

      case 'abandoned_path':
        return (
          <AbandonedPath
            abandoned={event}
            isExpanded={isExpanded}
            onToggle={() => toggleNode(event.id)}
            onClick={() => onPathInspect?.(event.pathId)}
          />
        );

      case 'synthesis':
        return (
          <ConvergenceNode
            id={event.id}
            status={status}
            synthesis={event}
            isExpanded={isExpanded}
            onToggle={() => toggleNode(event.id)}
            onClick={() => onNodeClick?.(event.id)}
          />
        );

      case 'response':
        return (
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-green-500 mt-0.5" />
            <div className="flex-1">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Response generated
              </span>
              {viewMode === 'detailed' && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                  {event.content}
                </p>
              )}
            </div>
          </div>
        );

      case 'end':
        return (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400">
              Workflow complete
            </span>
            <span className="text-xs text-muted-foreground font-mono ml-auto">
              {formatDuration(event.totalDuration)}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)} {...timelineAriaProps}>
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{t('workflow.workflow')}</span>
          {totalDuration > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              {formatDuration(totalDuration)}
            </span>
          )}
        </div>
        <WorkflowControls
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          showAbandoned={showAbandoned}
          onToggleAbandoned={() => setShowAbandoned(!showAbandoned)}
          isAllExpanded={expandedNodes.size === events.length}
          onToggleAllExpanded={toggleAllExpanded}
        />
      </div>

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />

        {/* Events */}
        <AnimatePresence>
          {visibleEvents.map((event, index) => (
            <div key={event.id} className="relative pb-4">
              {/* Node indicator */}
              <div
                className={cn(
                  'absolute left-[-18px] w-3 h-3 rounded-full border-2',
                  'bg-background',
                  getEventStatus(event, index === visibleEvents.length - 1) === 'active'
                    ? 'border-blue-500'
                    : getEventStatus(event, index === visibleEvents.length - 1) === 'error'
                    ? 'border-red-500'
                    : getEventStatus(event, index === visibleEvents.length - 1) === 'abandoned'
                    ? 'border-muted-foreground'
                    : 'border-green-500'
                )}
              >
                {getEventStatus(event, index === visibleEvents.length - 1) === 'active' && !prefersReducedMotion && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-blue-500/30"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Event content */}
              {renderEvent(event, index)}
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default WorkflowTimeline;
