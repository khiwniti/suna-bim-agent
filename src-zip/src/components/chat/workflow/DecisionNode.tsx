'use client';

/**
 * DecisionNode - Branching decision point visualization
 *
 * Shows decision points where the agent chose between multiple options.
 */

import { motion } from 'framer-motion';
import { GitBranch, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowNodeProps, DecisionEvent } from './types';

export interface DecisionNodeProps extends WorkflowNodeProps {
  decision: DecisionEvent;
}

export function DecisionNode({
  id: _id,
  status,
  decision,
  isExpanded = false,
  onToggle,
  onClick,
}: DecisionNodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-lg border-2 p-3 transition-all cursor-pointer',
        status === 'completed'
          ? 'border-purple-500/50 bg-purple-500/5'
          : 'border-purple-500 bg-purple-500/10'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-purple-500" />
        <span className="font-medium text-sm flex-1 text-purple-700 dark:text-purple-300">
          Decision Point
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

      {/* Question */}
      <p className="mt-2 text-sm text-muted-foreground">{decision.question}</p>

      {/* Options (collapsed view shows just the chosen option) */}
      {!isExpanded ? (
        <div className="mt-2 flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          <span className="text-xs font-medium">
            {decision.options[decision.chosen]}
          </span>
        </div>
      ) : (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-3 space-y-1 overflow-hidden"
        >
          {decision.options.map((option, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2 p-2 rounded text-sm',
                index === decision.chosen
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-muted/30 opacity-60'
              )}
            >
              {index === decision.chosen && (
                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
              )}
              <span className={cn(index === decision.chosen && 'font-medium')}>
                {option}
              </span>
            </div>
          ))}

          {/* Reasoning */}
          {decision.reasoning && (
            <div className="mt-2 pt-2 border-t border-border">
              <span className="text-xs font-medium text-muted-foreground">
                Reasoning
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                {decision.reasoning}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default DecisionNode;
