'use client';

/**
 * ConvergenceNode - Results merging/synthesis visualization
 *
 * Shows where parallel branches or multiple inputs converge into a single output.
 */

import { motion } from 'framer-motion';
import { Merge, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowNodeProps, SynthesisEvent } from './types';

export interface ConvergenceNodeProps extends WorkflowNodeProps {
  synthesis: SynthesisEvent;
}

export function ConvergenceNode({
  id: _id,
  status,
  synthesis,
  isExpanded = false,
  onToggle,
  onClick,
}: ConvergenceNodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-lg border-2 p-3 transition-all cursor-pointer',
        status === 'completed'
          ? 'border-cyan-500/50 bg-cyan-500/5'
          : 'border-cyan-500 bg-cyan-500/10'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Merge className="w-4 h-4 text-cyan-500" />
        <span className="font-medium text-sm flex-1 text-cyan-700 dark:text-cyan-300">
          Synthesis
        </span>
        <span className="text-xs text-muted-foreground">
          {synthesis.inputs.length} inputs
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

      {/* Output preview */}
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
        {synthesis.output}
      </p>

      {/* Expanded details */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-3 pt-3 border-t border-border space-y-2 overflow-hidden"
        >
          {/* Inputs */}
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Inputs Combined
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {synthesis.inputs.map((input, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs rounded-full bg-muted"
                >
                  {input}
                </span>
              ))}
            </div>
          </div>

          {/* Full output */}
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Synthesized Output
            </span>
            <p className="mt-1 text-sm">{synthesis.output}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default ConvergenceNode;
