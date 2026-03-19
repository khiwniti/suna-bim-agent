'use client';

/**
 * DestinationsVisited - Tool calls displayed as travel destinations
 *
 * Each tool call appears as a "destination visited" with:
 * - Random travel-themed destination name
 * - Category-specific icon
 * - Status animations (pending, running, success, error)
 * - Duration display
 * - Expandable result preview
 *
 * Features:
 * - Cards slide in from the right
 * - Success: Green glow + checkmark animation
 * - Running: Pulsing border + spinner
 * - Error: Red shake + X mark
 */

import { useState, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getRandomDestination,
  getToolCategory,
  CATEGORY_ICONS,
} from '@/lib/travel-destinations';

export interface DestinationInfo {
  /** Unique identifier */
  id: string;
  /** Tool name */
  toolName: string;
  /** Execution status */
  status: 'pending' | 'running' | 'success' | 'error';
  /** Description of what the tool does */
  description?: string;
  /** Execution duration in ms */
  duration?: number;
  /** Tool result (for expandable preview) */
  result?: unknown;
  /** Error message if failed */
  error?: string;
  /** Pre-assigned destination name (optional, will generate if not provided) */
  destinationName?: string;
}

export interface DestinationsVisitedProps {
  /** List of tool calls/destinations */
  destinations: DestinationInfo[];
  /** Optional className */
  className?: string;
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Single destination card
 */
const DestinationCard = memo(function DestinationCard({
  destination,
  index,
}: {
  destination: DestinationInfo;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate or use provided destination name
  const destinationName = useMemo(() => {
    return destination.destinationName || getRandomDestination(destination.toolName);
  }, [destination.destinationName, destination.toolName]);

  const category = getToolCategory(destination.toolName);
  const icon = CATEGORY_ICONS[category];

  const statusConfig = {
    pending: {
      icon: <Clock className="w-4 h-4 text-muted-foreground" />,
      border: 'border-muted-foreground/20',
      bg: 'bg-muted/30',
      text: 'text-muted-foreground',
    },
    running: {
      icon: <Loader2 className="w-4 h-4 text-primary animate-spin" />,
      border: 'border-primary/50',
      bg: 'bg-primary/5',
      text: 'text-primary',
    },
    success: {
      icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      border: 'border-green-500/30',
      bg: 'bg-green-500/5',
      text: 'text-green-600 dark:text-green-400',
    },
    error: {
      icon: <XCircle className="w-4 h-4 text-red-500" />,
      border: 'border-red-500/30',
      bg: 'bg-red-500/5',
      text: 'text-red-600 dark:text-red-400',
    },
  };

  const config = statusConfig[destination.status];
  const hasResult = destination.result !== undefined || destination.error;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: destination.status === 'success' ? [1, 1.02, 1] : 1,
      }}
      transition={{
        delay: index * 0.1,
        duration: 0.3,
        scale: { duration: 0.3 },
      }}
      className={cn(
        'rounded-lg border transition-all duration-300',
        config.border,
        config.bg,
        destination.status === 'running' && 'shadow-md shadow-primary/10',
        destination.status === 'error' && 'animate-shake'
      )}
    >
      {/* Main card content */}
      <button
        onClick={() => hasResult && setIsExpanded(!isExpanded)}
        disabled={!hasResult}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5',
          'text-left transition-colors',
          hasResult && 'hover:bg-muted/30 cursor-pointer',
          !hasResult && 'cursor-default'
        )}
      >
        {/* Category icon */}
        <span className="text-lg flex-shrink-0">{icon}</span>

        {/* Destination info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{destinationName}</span>
            {destination.status === 'running' && (
              <motion.span
                className="text-xs text-primary/70"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                exploring...
              </motion.span>
            )}
          </div>
          <div className={cn('text-xs truncate', config.text)}>
            {destination.toolName}
            {destination.description && ` • ${destination.description}`}
          </div>
        </div>

        {/* Status and duration */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {destination.duration !== undefined && destination.status !== 'running' && (
            <span className="text-xs text-muted-foreground">
              {formatDuration(destination.duration)}
            </span>
          )}

          <motion.div
            key={destination.status}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {config.icon}
          </motion.div>

          {hasResult && (
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground/50 transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          )}
        </div>
      </button>

      {/* Expandable result */}
      <AnimatePresence>
        {isExpanded && hasResult && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0">
              <div className="p-2 rounded-md bg-muted/50 border border-border/50">
                {destination.error ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono">
                    {destination.error}
                  </p>
                ) : (
                  <pre className="text-xs text-muted-foreground font-mono overflow-x-auto max-h-32">
                    {typeof destination.result === 'string'
                      ? destination.result
                      : JSON.stringify(destination.result, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

/**
 * DestinationsVisited - Main component
 */
export const DestinationsVisited = memo(function DestinationsVisited({
  destinations,
  className,
}: DestinationsVisitedProps) {
  if (!destinations.length) return null;

  // Count completed destinations
  const completedCount = destinations.filter(
    (d) => d.status === 'success' || d.status === 'error'
  ).length;

  return (
    <motion.div
      className={cn('space-y-2', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-sm">🗺️</span>
        <span className="text-xs font-medium text-muted-foreground">
          Destinations Visited
        </span>
        <span className="text-xs text-muted-foreground/60">
          ({completedCount}/{destinations.length})
        </span>
      </div>

      {/* Destination cards */}
      <div className="space-y-2">
        {destinations.map((destination, index) => (
          <DestinationCard
            key={destination.id}
            destination={destination}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
});

export default DestinationsVisited;
