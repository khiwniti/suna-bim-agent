'use client';

/**
 * ParameterInputCard - HITL parameter input component
 *
 * Travel-themed "Packing List" design for collecting parameters before execution.
 * Features:
 * - Support for text, number, select, and range inputs
 * - Unit display and validation
 * - Required field indicators
 */

import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Parameter {
  /** Unique name for the parameter */
  name: string;
  /** Display label */
  label: string;
  /** Input type */
  type: 'text' | 'number' | 'select' | 'range';
  /** Default value */
  defaultValue?: string | number;
  /** Placeholder text */
  placeholder?: string;
  /** Options for select type */
  options?: Array<{ value: string; label: string }>;
  /** Minimum value for number/range */
  min?: number;
  /** Maximum value for number/range */
  max?: number;
  /** Step value for number/range */
  step?: number;
  /** Unit label */
  unit?: string;
  /** Whether the field is required */
  required?: boolean;
}

export interface ParameterInputCardProps {
  /** Unique identifier */
  id: string;
  /** Card title */
  title: string;
  /** Optional description */
  description?: string;
  /** Parameters to collect */
  parameters: Parameter[];
  /** Label for submit button */
  submitLabel?: string;
  /** Label for cancel button */
  cancelLabel?: string;
  /** Callback when submitted */
  onSubmit: (values: Record<string, string | number>) => void;
  /** Callback when cancelled */
  onCancel: () => void;
  /** Whether the action is in progress */
  isLoading?: boolean;
  /** Optional className */
  className?: string;
}

export const ParameterInputCard = memo(function ParameterInputCard({
  id: _id,
  title,
  description,
  parameters,
  submitLabel = 'Start',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: ParameterInputCardProps) {
  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const initial: Record<string, string | number> = {};
    parameters.forEach((param) => {
      if (param.defaultValue !== undefined) {
        initial[param.name] = param.defaultValue;
      } else if (param.type === 'number' || param.type === 'range') {
        initial[param.name] = param.min ?? 0;
      } else if (param.type === 'select' && param.options?.[0]) {
        initial[param.name] = param.options[0].value;
      } else {
        initial[param.name] = '';
      }
    });
    return initial;
  });

  const handleChange = (name: string, value: string | number) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSubmit(values);
  };

  const isValid = parameters
    .filter((p) => p.required)
    .every((p) => values[p.name] !== '' && values[p.name] !== undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'rounded-lg border overflow-hidden',
        'bg-gradient-to-br from-violet-50/50 to-purple-50/30',
        'dark:from-violet-950/20 dark:to-purple-950/10',
        'border-violet-200/50 dark:border-violet-800/50',
        'shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-200/30 dark:border-violet-800/30">
        <span className="text-lg">🎒</span>
        <span className="text-sm font-medium text-violet-800 dark:text-violet-200">
          Packing List
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-4">
        <div>
          <h4 className="font-medium text-sm text-foreground">{title}</h4>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        {/* Parameters */}
        <div className="space-y-3">
          {parameters.map((param, index) => (
            <motion.div
              key={param.name}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-1.5"
            >
              <React.Fragment key={param.name}>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  {param.label}
                  {param.required && <span className="text-red-500">*</span>}
                </label>

                {param.type === 'text' && (
                  <input
                    type="text"
                    value={values[param.name] as string}
                    onChange={(e) => handleChange(param.name, e.target.value)}
                    placeholder={param.placeholder}
                    disabled={isLoading}
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-md border',
                      'bg-white dark:bg-black/20',
                      'border-border focus:border-violet-400 dark:focus:border-violet-600',
                      'focus:outline-none focus:ring-2 focus:ring-violet-400/20',
                      'disabled:opacity-50'
                    )}
                  />
                )}

                {param.type === 'number' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={values[param.name] as number}
                      onChange={(e) =>
                        handleChange(param.name, parseFloat(e.target.value) || 0)
                      }
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      disabled={isLoading}
                      className={cn(
                        'flex-1 px-3 py-2 text-sm rounded-md border',
                        'bg-white dark:bg-black/20',
                        'border-border focus:border-violet-400 dark:focus:border-violet-600',
                        'focus:outline-none focus:ring-2 focus:ring-violet-400/20',
                        'disabled:opacity-50'
                      )}
                    />
                    {param.unit && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {param.unit}
                      </span>
                    )}
                  </div>
                )}

                {param.type === 'select' && param.options && (
                  <select
                    value={values[param.name] as string}
                    onChange={(e) => handleChange(param.name, e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-md border',
                      'bg-white dark:bg-black/20',
                      'border-border focus:border-violet-400 dark:focus:border-violet-600',
                      'focus:outline-none focus:ring-2 focus:ring-violet-400/20',
                      'disabled:opacity-50'
                    )}
                  >
                    {param.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {param.type === 'range' && (
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      value={values[param.name] as number}
                      onChange={(e) =>
                        handleChange(param.name, parseFloat(e.target.value))
                      }
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      disabled={isLoading}
                      className="flex-1 accent-violet-500"
                    />
                    <span className="text-sm font-mono w-16 text-right">
                      {values[param.name]}
                      {param.unit && (
                        <span className="text-xs ml-0.5 text-muted-foreground">
                          {param.unit}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </React.Fragment>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md flex items-center gap-1',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted/50 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <X className="w-3.5 h-3.5" />
            {cancelLabel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md',
              'bg-violet-600 hover:bg-violet-700 text-white',
              'transition-colors flex items-center gap-2',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Play className="w-4 h-4" />
            {submitLabel}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

export default ParameterInputCard;
