'use client';

/**
 * MultiChoiceCard - HITL choice selection component
 *
 * Travel-themed "Route Selection" design for choosing between options.
 * Features:
 * - Single and multi-select modes
 * - Recommended option badge
 * - Meta info display (timing, details)
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChoiceOption {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional emoji icon */
  icon?: string;
  /** Mark as recommended */
  recommended?: boolean;
  /** Meta info (e.g., "⚡ 30 seconds") */
  meta?: string;
}

export interface MultiChoiceCardProps {
  /** Unique identifier */
  id: string;
  /** Question to ask */
  question: string;
  /** Available options */
  options: ChoiceOption[];
  /** Allow multiple selections */
  allowMultiple?: boolean;
  /** Label for submit button */
  submitLabel?: string;
  /** Callback when selection is made */
  onSelect: (selectedIds: string[]) => void;
  /** Whether the action is in progress */
  isLoading?: boolean;
  /** Optional className */
  className?: string;
}

export const MultiChoiceCard = memo(function MultiChoiceCard({
  id: _id,
  question,
  options,
  allowMultiple = false,
  submitLabel = 'Continue',
  onSelect,
  isLoading = false,
  className,
}: MultiChoiceCardProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleOption = (optionId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allowMultiple) {
        if (next.has(optionId)) {
          next.delete(optionId);
        } else {
          next.add(optionId);
        }
      } else {
        next.clear();
        next.add(optionId);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    onSelect(Array.from(selected));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'rounded-lg border overflow-hidden',
        'bg-gradient-to-br from-sky-50/50 to-indigo-50/30',
        'dark:from-sky-950/20 dark:to-indigo-950/10',
        'border-sky-200/50 dark:border-sky-800/50',
        'shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-sky-200/30 dark:border-sky-800/30">
        <span className="text-lg">🗺️</span>
        <span className="text-sm font-medium text-sky-800 dark:text-sky-200">
          Route Selection
        </span>
      </div>

      {/* Question */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-sm font-medium text-foreground">{question}</p>
      </div>

      {/* Options */}
      <div className="px-4 pb-2 space-y-2">
        {options.map((option, index) => {
          const isSelected = selected.has(option.id);
          return (
            <motion.button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              disabled={isLoading}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                'w-full flex items-start gap-3 p-3 rounded-lg border text-left',
                'transition-all duration-200',
                isSelected
                  ? 'bg-sky-100 dark:bg-sky-900/40 border-sky-400 dark:border-sky-600'
                  : 'bg-white/50 dark:bg-white/5 border-border/50 hover:border-sky-300 dark:hover:border-sky-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {/* Selection indicator */}
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                  'transition-colors',
                  isSelected
                    ? 'bg-sky-500 border-sky-500'
                    : 'border-muted-foreground/30'
                )}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {option.icon && <span className="text-sm">{option.icon}</span>}
                  <span className="font-medium text-sm">{option.label}</span>
                  {option.recommended && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                      <Sparkles className="w-3 h-3" />
                      Recommended
                    </span>
                  )}
                </div>
                {option.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                )}
                {option.meta && (
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {option.meta}
                  </p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Submit */}
      <div className="px-4 py-3 border-t border-sky-200/30 dark:border-sky-800/30">
        <button
          onClick={handleSubmit}
          disabled={selected.size === 0 || isLoading}
          className={cn(
            'w-full px-4 py-2 text-sm font-medium rounded-md',
            'bg-sky-600 hover:bg-sky-700 text-white',
            'transition-colors flex items-center justify-center gap-2',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {submitLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
});

export default MultiChoiceCard;
