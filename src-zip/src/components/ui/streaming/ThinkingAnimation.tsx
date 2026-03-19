'use client';

/**
 * ThinkingAnimation - Brain pulse animation for AI thinking state
 *
 * Visual indicator that the AI is processing/thinking.
 */

import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ThinkingAnimationProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show text label */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Animation style */
  variant?: 'pulse' | 'dots' | 'wave';
  className?: string;
}

const sizeStyles = {
  sm: { icon: 'w-4 h-4', text: 'text-xs', gap: 'gap-1.5' },
  md: { icon: 'w-5 h-5', text: 'text-sm', gap: 'gap-2' },
  lg: { icon: 'w-6 h-6', text: 'text-base', gap: 'gap-2.5' },
};

function PulseAnimation({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('relative', className)}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Brain className="w-full h-full text-purple-500" />
      <motion.div
        className="absolute inset-0 rounded-full bg-purple-500/30"
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

function DotsAnimation({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center', className)}>
      <Brain className="w-full h-full text-purple-500" />
      <div className="flex gap-0.5 ml-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-1 rounded-full bg-purple-500"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function WaveAnimation({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center', className)}>
      <Brain className="w-full h-full text-purple-500" />
      <div className="flex gap-0.5 ml-1.5 h-3 items-end">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-0.5 bg-purple-500 rounded-full"
            animate={{ height: ['30%', '100%', '30%'] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function ThinkingAnimation({
  size = 'md',
  showLabel = true,
  label = 'Thinking...',
  variant = 'pulse',
  className,
}: ThinkingAnimationProps) {
  const styles = sizeStyles[size];

  const AnimationComponent = {
    pulse: PulseAnimation,
    dots: DotsAnimation,
    wave: WaveAnimation,
  }[variant];

  return (
    <div className={cn('flex items-center', styles.gap, className)}>
      <AnimationComponent className={styles.icon} />
      {showLabel && (
        <motion.span
          className={cn(styles.text, 'text-purple-600 dark:text-purple-400')}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
}

export default ThinkingAnimation;
