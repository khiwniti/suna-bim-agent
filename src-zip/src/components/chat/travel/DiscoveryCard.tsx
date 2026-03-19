'use client';

/**
 * DiscoveryCard - Artifact cards for tool results
 *
 * Displays tool results as "discoveries" with:
 * - Themed card based on result type
 * - Expandable content
 * - Summary preview
 * - Visual icons and badges
 *
 * Features:
 * - Cards fade in with scale animation
 * - Expandable with smooth height transition
 * - Hover effect shows preview
 */

import { useState, memo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Leaf,
  AlertTriangle,
  Shield,
  Calculator,
  Search,
  FileText,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getToolCategory } from '@/lib/travel-destinations';

export interface DiscoveryCardProps {
  /** Unique identifier */
  id: string;
  /** Discovery title */
  title: string;
  /** Tool that produced this discovery */
  toolName?: string;
  /** Discovery type for theming */
  type?: 'carbon' | 'clash' | 'compliance' | 'boq' | 'query' | 'general';
  /** Summary text shown in collapsed state */
  summary?: string;
  /** Full content (can be string or ReactNode) */
  content?: string | ReactNode;
  /** Key metrics to highlight */
  metrics?: Array<{
    label: string;
    value: string | number;
    unit?: string;
    trend?: 'up' | 'down' | 'neutral';
  }>;
  /** Start expanded? */
  defaultExpanded?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * Get theme configuration for discovery type
 */
function getDiscoveryTheme(type: DiscoveryCardProps['type']) {
  const themes: Record<
    NonNullable<DiscoveryCardProps['type']>,
    {
      icon: ReactNode;
      iconBg: string;
      border: string;
      headerBg: string;
      badge: string;
      emoji: string;
    }
  > = {
    carbon: {
      icon: <Leaf className="w-4 h-4" />,
      iconBg: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      border: 'border-green-200/50 dark:border-green-800/50',
      headerBg: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
      badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
      emoji: '🌿',
    },
    clash: {
      icon: <AlertTriangle className="w-4 h-4" />,
      iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      border: 'border-amber-200/50 dark:border-amber-800/50',
      headerBg: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
      emoji: '⚡',
    },
    compliance: {
      icon: <Shield className="w-4 h-4" />,
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      border: 'border-blue-200/50 dark:border-blue-800/50',
      headerBg: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
      emoji: '🛡️',
    },
    boq: {
      icon: <Calculator className="w-4 h-4" />,
      iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      border: 'border-purple-200/50 dark:border-purple-800/50',
      headerBg: 'bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30',
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
      emoji: '💎',
    },
    query: {
      icon: <Search className="w-4 h-4" />,
      iconBg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
      border: 'border-cyan-200/50 dark:border-cyan-800/50',
      headerBg: 'bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30',
      badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
      emoji: '🔍',
    },
    general: {
      icon: <FileText className="w-4 h-4" />,
      iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
      border: 'border-slate-200/50 dark:border-slate-700/50',
      headerBg: 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30',
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300',
      emoji: '📄',
    },
  };

  return themes[type || 'general'];
}

/**
 * Metric pill component
 */
const MetricPill = memo(function MetricPill({
  label,
  value,
  unit,
  trend,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground',
  };

  return (
    <div className="flex flex-col gap-0.5 px-2.5 py-1.5 rounded-md bg-muted/50 border border-border/50">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className={cn('text-sm font-semibold', trend && trendColors[trend])}>
        {value}
        {unit && <span className="text-xs font-normal ml-0.5">{unit}</span>}
      </span>
    </div>
  );
});

/**
 * DiscoveryCard - Main component
 */
export const DiscoveryCard = memo(function DiscoveryCard({
  id: _id, // Reserved for future use (tracking, analytics)
  title,
  toolName,
  type: propType,
  summary,
  content,
  metrics,
  defaultExpanded = false,
  className,
}: DiscoveryCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Infer type from tool name if not provided
  const type = propType || (toolName ? getToolCategory(toolName) as DiscoveryCardProps['type'] : 'general');
  const theme = getDiscoveryTheme(type);

  const hasExpandableContent = content !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'rounded-lg border overflow-hidden',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
        theme.border,
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => hasExpandableContent && setIsExpanded(!isExpanded)}
        disabled={!hasExpandableContent}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3',
          'text-left transition-colors',
          theme.headerBg,
          hasExpandableContent && 'hover:brightness-95 cursor-pointer',
          !hasExpandableContent && 'cursor-default'
        )}
      >
        {/* Icon */}
        <div className={cn('p-2 rounded-lg', theme.iconBg)}>{theme.icon}</div>

        {/* Title and summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">{theme.emoji}</span>
            <h4 className="font-medium text-sm truncate">{title}</h4>
          </div>
          {summary && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{summary}</p>
          )}
        </div>

        {/* Sparkle for new discovery */}
        <motion.div
          initial={{ rotate: -15 }}
          animate={{ rotate: [0, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
        </motion.div>

        {/* Expand chevron */}
        {hasExpandableContent && (
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        )}
      </button>

      {/* Metrics row (always visible if present) */}
      {metrics && metrics.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-2 bg-muted/20 border-t border-border/30">
          {metrics.map((metric, idx) => (
            <MetricPill key={idx} {...metric} />
          ))}
        </div>
      )}

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && hasExpandableContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
              transition: {
                height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.2, delay: 0.1 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.15 },
              },
            }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 border-t border-border/30 bg-background/50">
              {typeof content === 'string' ? (
                <div className="text-sm text-foreground/80 whitespace-pre-wrap">
                  {content}
                </div>
              ) : (
                content
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default DiscoveryCard;
