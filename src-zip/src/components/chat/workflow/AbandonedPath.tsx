'use client';

/**
 * AbandonedPath - Inspectable abandoned reasoning path
 *
 * Shows reasoning paths that were explored but not followed.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowNodeProps, AbandonedPathEvent } from './types';

export interface AbandonedPathProps extends Omit<WorkflowNodeProps, 'id' | 'status'> {
  abandoned: AbandonedPathEvent;
}

export function AbandonedPath({
  abandoned,
  isExpanded = false,
  onToggle,
  onClick,
}: AbandonedPathProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-lg border-2 border-dashed p-3 transition-all cursor-pointer',
        'border-muted-foreground/30 bg-muted/10 opacity-70 hover:opacity-100'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <XCircle className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-sm flex-1 text-muted-foreground">
          Abandoned Path
        </span>
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

      {/* Reason */}
      <div className="mt-2 flex items-start gap-2">
        <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-muted-foreground">{abandoned.reason}</p>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && abandoned.partialResult !== undefined && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-border overflow-hidden"
          >
            <span className="text-xs font-medium text-muted-foreground">
              Partial Result (Before Abandonment)
            </span>
            <pre className="mt-1 text-xs bg-muted/50 rounded p-2 overflow-x-auto max-h-32">
              {typeof abandoned.partialResult === 'string'
                ? abandoned.partialResult
                : JSON.stringify(abandoned.partialResult, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AbandonedPath;
