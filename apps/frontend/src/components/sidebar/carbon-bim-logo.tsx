'use client';

import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarbonBIMLogoProps {
  size?: number;
  variant?: 'symbol' | 'logomark';
  className?: string;
}

export function CarbonBIMLogo({ size = 24, variant = 'symbol', className }: CarbonBIMLogoProps) {
  if (variant === 'logomark') {
    return (
      <span
        className={cn('inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 flex-shrink-0', className)}
        style={{ fontSize: `${size}px` }}
      >
        <Leaf style={{ width: size, height: size }} strokeWidth={2} />
        <span style={{ fontSize: `${Math.round(size * 0.75)}px` }}>Carbon BIM</span>
      </span>
    );
  }

  // symbol variant — leaf icon only
  return (
    <Leaf
      aria-label="Carbon BIM"
      className={cn('text-emerald-600 dark:text-emerald-400 flex-shrink-0', className)}
      style={{ width: size, height: size }}
      strokeWidth={2}
    />
  );
}
