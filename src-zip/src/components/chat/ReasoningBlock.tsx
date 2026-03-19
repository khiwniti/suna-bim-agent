'use client';

/**
 * ReasoningBlock Component
 *
 * Collapsible block for displaying AI reasoning/thinking steps.
 * Inspired by Claude's "thinking" and DeepSeek's reasoning display.
 */

import { useState } from 'react';
import { Brain, ChevronDown, Lightbulb, Cog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ReasoningBlockProps {
  /** Reasoning/thinking content */
  reasoning: string;
  /** Whether to start collapsed */
  defaultCollapsed?: boolean;
  /** Title for the block */
  title?: string;
  /** Icon variant */
  iconVariant?: 'brain' | 'lightbulb' | 'cog';
  /** Whether reasoning is still streaming */
  isStreaming?: boolean;
  /** Custom className */
  className?: string;
}

const icons = {
  brain: Brain,
  lightbulb: Lightbulb,
  cog: Cog,
};

export function ReasoningBlock({
  reasoning,
  defaultCollapsed = true,
  title = 'Thinking',
  iconVariant = 'brain',
  isStreaming = false,
  className,
}: ReasoningBlockProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const Icon = icons[iconVariant];

  // Don't render if no reasoning content
  if (!reasoning && !isStreaming) return null;

  return (
    <div
      className={cn(
        'rounded-lg border border-border/50 overflow-hidden',
        'bg-muted/30',
        className
      )}
    >
      {/* Header - clickable to toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2',
          'text-sm text-muted-foreground hover:text-foreground',
          'transition-colors'
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', isStreaming && 'animate-pulse')} />
          <span>{title}</span>
          {isStreaming && (
            <motion.span
              className="text-xs text-primary"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              (in progress)
            </motion.span>
          )}
        </div>
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-3 pb-3 border-t border-border/50">
              <div className="pt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {reasoning}
                {isStreaming && (
                  <motion.span
                    className="inline-block w-1.5 h-4 bg-primary ml-1"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Inline thinking indicator (for use during streaming)
 */
interface ThinkingIndicatorProps {
  label?: string;
  className?: string;
}

export function ThinkingIndicator({ label = 'Thinking...', className }: ThinkingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <Brain className="w-4 h-4 animate-pulse" />
      <span>{label}</span>
      <motion.span
        className="flex gap-0.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1 h-1 rounded-full bg-current"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.span>
    </div>
  );
}

export default ReasoningBlock;
