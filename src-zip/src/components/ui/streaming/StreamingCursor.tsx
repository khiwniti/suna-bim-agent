'use client';

/**
 * StreamingCursor - Enhanced morphing cursor for streaming text
 *
 * A cursor that morphs into content as text streams in.
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface StreamingCursorProps {
  isVisible?: boolean;
  variant?: 'default' | 'block' | 'underscore';
  color?: string;
  className?: string;
}

export function StreamingCursor({
  isVisible = true,
  variant = 'default',
  color,
  className,
}: StreamingCursorProps) {
  if (!isVisible) return null;

  const cursorStyles = {
    default: 'w-0.5 h-5',
    block: 'w-2 h-5',
    underscore: 'w-3 h-0.5',
  };

  return (
    <motion.span
      className={cn(
        'inline-block rounded-sm',
        color ?? 'bg-primary',
        cursorStyles[variant],
        className
      )}
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export default StreamingCursor;
