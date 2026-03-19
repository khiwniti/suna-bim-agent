'use client';

/**
 * BaseToolCard Component
 *
 * Shared card layout for all tool visualizers.
 * Features glassmorphism styling, collapsible content, status badges, and animations.
 */

import { type ReactNode } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ChevronDown, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolCallVisualization } from '@/lib/generative-ui/types';

export interface BaseToolCardProps {
  toolCall: ToolCallVisualization;
  status: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
  isCollapsed?: boolean;
  onToggle?: () => void;
  children: ReactNode;
  icon?: ReactNode;
  headerActions?: ReactNode;
}

/**
 * Animation variants for card entry/exit
 */
const toolCardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, damping: 20, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
};

/**
 * Animation variants for collapsible content
 */
const contentVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeInOut' as const },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' as const },
  },
};

/**
 * Status badge configuration
 */
const statusConfig = {
  pending: {
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20',
    label: 'pending',
  },
  running: {
    className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20 animate-pulse',
    label: 'running',
  },
  success: {
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    label: 'success',
  },
  error: {
    className: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20',
    label: 'error',
  },
};

/**
 * Format duration in milliseconds to human-readable format
 */
function formatDuration(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 10) {
    return `${seconds.toFixed(1)}s`;
  }
  return `${Math.round(seconds)}s`;
}

/**
 * BaseToolCard - Shared card layout for tool visualizers
 */
export function BaseToolCard({
  toolCall,
  status,
  duration,
  isCollapsed = false,
  onToggle,
  children,
  icon,
  headerActions,
}: BaseToolCardProps) {
  const statusInfo = statusConfig[status];

  const handleHeaderClick = () => {
    onToggle?.();
  };

  const durationDisplay =
    duration !== undefined
      ? formatDuration(duration)
      : status === 'pending'
        ? 'pending...'
        : status === 'running'
          ? 'running...'
          : null;

  return (
    <motion.div
      data-testid="tool-card"
      className={cn(
        'glass rounded-xl overflow-hidden',
        'border border-border/50',
        'shadow-sm'
      )}
      variants={toolCardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      {/* Header */}
      <motion.div
        data-testid="tool-card-header"
        className={cn(
          'flex items-center gap-3 px-4 py-3',
          'cursor-pointer select-none',
          'hover:bg-muted/50 transition-colors'
        )}
        onClick={handleHeaderClick}
      >
        {/* Icon */}
        <div className="flex-shrink-0 text-muted-foreground">
          {icon || (
            <Wrench data-testid="default-icon" className="w-4 h-4" />
          )}
        </div>

        {/* Tool name */}
        <span className="flex-1 font-medium text-sm text-foreground truncate">
          {toolCall.name}
        </span>

        {/* Duration display */}
        {durationDisplay && (
          <span className="text-xs text-muted-foreground font-mono">
            {durationDisplay}
          </span>
        )}

        {/* Status badge */}
        <div
          data-testid="status-badge"
          className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5',
            'text-xs font-medium',
            statusInfo.className
          )}
        >
          {statusInfo.label}
        </div>

        {/* Header actions */}
        {headerActions && (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {headerActions}
          </div>
        )}

        {/* Collapse indicator */}
        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.div>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default BaseToolCard;
