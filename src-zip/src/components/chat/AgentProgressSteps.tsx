'use client';

/**
 * AgentProgressSteps - Visual step indicator for agent workflow
 *
 * Shows the current phase of agent processing with:
 * - Step icons (done/active/pending states)
 * - Vertical connecting lines
 * - Pulsing animation for active step
 * - Tool details for executing step
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Wrench,
  MessageSquare,
  CheckCircle2,
  Loader2,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentPhase } from '@/lib/streaming/event-types';
import type { ToolCallVisualization } from '@/lib/generative-ui/types';

interface AgentProgressStepsProps {
  phase: AgentPhase;
  currentTool: ToolCallVisualization | null;
  completedTools: ToolCallVisualization[];
  className?: string;
}

type StepStatus = 'done' | 'active' | 'pending';

interface Step {
  id: string;
  label: string;
  icon: typeof Brain;
  phases: AgentPhase[];
}

const STEPS: Step[] = [
  {
    id: 'thinking',
    label: 'Thinking',
    icon: Brain,
    phases: ['thinking', 'reasoning'],
  },
  {
    id: 'executing',
    label: 'Executing Tools',
    icon: Wrench,
    phases: ['tool_calling', 'tool_executing'],
  },
  {
    id: 'responding',
    label: 'Generating Response',
    icon: MessageSquare,
    phases: ['responding', 'synthesizing'],
  },
];

function getStepStatus(step: Step, phase: AgentPhase, stepIndex: number, steps: Step[]): StepStatus {
  // If we're idle, all steps are pending (component shouldn't render in this state)
  if (phase === 'idle') return 'pending';

  // If error, show the step where error occurred as active (red)
  if (phase === 'error') {
    // For error state, mark all prior steps as done, last active step as error (shown as active)
    // Since we don't track which step failed, just mark based on current progress
    return stepIndex === 0 ? 'active' : 'pending';
  }

  // Check if this step's phases include the current phase
  if (step.phases.includes(phase)) {
    return 'active';
  }

  // Check if we've passed this step (current phase is in a later step)
  const currentStepIndex = steps.findIndex(s => s.phases.includes(phase));
  if (currentStepIndex > stepIndex) {
    return 'done';
  }

  return 'pending';
}

const StepIcon = memo(function StepIcon({
  status,
}: {
  status: StepStatus;
}) {
  if (status === 'done') {
    return (
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
      >
        <CheckCircle2 className="w-4 h-4 text-white" />
      </motion.div>
    );
  }

  if (status === 'active') {
    return (
      <motion.div
        className="relative w-6 h-6 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center"
        animate={{ boxShadow: ['0 0 0 3px rgba(16, 185, 129, 0.2)', '0 0 0 6px rgba(16, 185, 129, 0.1)', '0 0 0 3px rgba(16, 185, 129, 0.2)'] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-3.5 h-3.5 text-emerald-500" />
        </motion.div>
      </motion.div>
    );
  }

  // Pending
  return (
    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
      <Circle className="w-3 h-3 text-slate-400 dark:text-slate-500" />
    </div>
  );
});

const ToolBadge = memo(function ToolBadge({
  tool
}: {
  tool: ToolCallVisualization;
}) {
  const isRunning = tool.status === 'running';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
        isRunning
          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
          : tool.status === 'success'
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300'
      )}
    >
      {isRunning && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-3 h-3" />
        </motion.div>
      )}
      {tool.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
      <span className="font-mono">{tool.name}</span>
    </motion.div>
  );
});

export const AgentProgressSteps = memo(function AgentProgressSteps({
  phase,
  currentTool,
  completedTools,
  className,
}: AgentProgressStepsProps) {
  // Don't render if idle
  if (phase === 'idle') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn('px-4 py-3', className)}
    >
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="relative pl-1">
          {STEPS.map((step, index) => {
            const status = getStepStatus(step, phase, index, STEPS);
            const isLast = index === STEPS.length - 1;
            const showTools = step.id === 'executing' && (currentTool || completedTools.length > 0);

            return (
              <div key={step.id} className="relative">
                {/* Vertical connecting line */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute left-3 top-6 w-0.5 h-full -translate-x-1/2',
                      status === 'done' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                    )}
                  />
                )}

                {/* Step row */}
                <div className={cn(
                  'relative flex items-start gap-3 pb-4',
                  isLast && 'pb-0'
                )}>
                  <StepIcon status={status} />

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className={cn(
                      'text-sm font-medium',
                      status === 'active' && 'text-emerald-600 dark:text-emerald-400',
                      status === 'done' && 'text-foreground',
                      status === 'pending' && 'text-muted-foreground'
                    )}>
                      {step.label}
                    </div>

                    {/* Tool badges for executing step */}
                    <AnimatePresence mode="popLayout">
                      {showTools && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-wrap gap-1.5 mt-2"
                        >
                          {completedTools.map((tool) => (
                            <ToolBadge key={tool.id} tool={tool} />
                          ))}
                          {currentTool && (
                            <ToolBadge key={currentTool.id} tool={currentTool} />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});

export default AgentProgressSteps;
