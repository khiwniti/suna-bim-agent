'use client';

/**
 * Progress Component
 *
 * Visual progress indicator for loading states and completion tracking.
 * Supports determinate and indeterminate states.
 *
 * ★ Insight ─────────────────────────────────────
 * Used in the BIM platform for:
 * - Carbon calculation progress
 * - File upload/processing status
 * - Certification completion tracking
 * ─────────────────────────────────────────────────
 */

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Current progress value (0-100) */
  value?: number;
  /** Visual variant */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gradient';
  /** Size of the progress bar */
  size?: 'sm' | 'md' | 'lg';
  /** Show percentage label */
  showLabel?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value = 0, variant = 'default', size = 'md', showLabel, ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    gradient: 'bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500',
  };

  return (
    <div className="relative w-full">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-full bg-secondary',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full w-full flex-1 transition-all duration-500 ease-out',
            variantClasses[variant]
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
      {showLabel && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
          {Math.round(value || 0)}%
        </span>
      )}
    </div>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
