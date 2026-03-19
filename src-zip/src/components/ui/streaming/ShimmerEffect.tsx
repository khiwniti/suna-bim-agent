'use client';

/**
 * ShimmerEffect - Indeterminate shimmer loading animation
 *
 * For loading states where progress is unknown (LLM generation).
 */

import { cn } from '@/lib/utils';

export interface ShimmerEffectProps {
  /** Width of shimmer area */
  width?: string | number;
  /** Height of shimmer area */
  height?: string | number;
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Animation speed */
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}

const roundedStyles = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

const speedStyles = {
  slow: 'animate-[shimmer_3s_infinite]',
  normal: 'animate-[shimmer_2s_infinite]',
  fast: 'animate-[shimmer_1s_infinite]',
};

export function ShimmerEffect({
  width = '100%',
  height = '1rem',
  rounded = 'md',
  speed = 'normal',
  className,
}: ShimmerEffectProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted',
        roundedStyles[rounded],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    >
      <div
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-r from-transparent via-white/20 to-transparent',
          speedStyles[speed]
        )}
        style={{
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  );
}

export default ShimmerEffect;
