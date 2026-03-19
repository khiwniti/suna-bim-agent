'use client';

/**
 * StreamingCursor Component
 *
 * Animated blinking cursor for streaming text responses.
 * Provides visual feedback that content is being generated.
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StreamingCursorProps {
  /** Whether streaming is active */
  isStreaming: boolean;
  /** Cursor style variant */
  variant?: 'line' | 'block' | 'underscore';
  /** Custom className */
  className?: string;
  /** Blink speed in seconds */
  blinkSpeed?: number;
}

export function StreamingCursor({
  isStreaming,
  variant = 'line',
  className,
  blinkSpeed = 0.8,
}: StreamingCursorProps) {
  if (!isStreaming) return null;

  const variantStyles = {
    line: 'w-0.5 h-5',
    block: 'w-2.5 h-5',
    underscore: 'w-2.5 h-0.5 translate-y-4',
  };

  return (
    <motion.span
      className={cn(
        'inline-block bg-primary ml-0.5',
        variantStyles[variant],
        className
      )}
      animate={{ opacity: [1, 0, 1] }}
      transition={{
        duration: blinkSpeed,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Typing dots animation (alternative to cursor)
 */
export function TypingDots({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1, 0.8] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  );
}

/**
 * Streaming text wrapper with cursor
 */
interface StreamingTextProps {
  /** Text content */
  children: React.ReactNode;
  /** Whether streaming is active */
  isStreaming: boolean;
  /** Cursor variant */
  cursorVariant?: 'line' | 'block' | 'underscore' | 'dots';
  /** Custom className */
  className?: string;
}

export function StreamingText({
  children,
  isStreaming,
  cursorVariant = 'line',
  className,
}: StreamingTextProps) {
  return (
    <span className={cn('inline', className)}>
      {children}
      {cursorVariant === 'dots' ? (
        isStreaming && <TypingDots className="ml-1" />
      ) : (
        <StreamingCursor isStreaming={isStreaming} variant={cursorVariant} />
      )}
    </span>
  );
}

export default StreamingCursor;
