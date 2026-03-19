'use client';

/**
 * CircularProgress - Deterministic circular progress indicator
 *
 * Shows exact progress percentage for known-duration operations.
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CircularProgressProps {
  /** Progress value 0-100 */
  value: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Show percentage text */
  showValue?: boolean;
  /** Custom color */
  color?: string;
  /** Track color */
  trackColor?: string;
  className?: string;
}

export function CircularProgress({
  value,
  size = 40,
  strokeWidth = 4,
  showValue = true,
  color,
  trackColor,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackColor ?? 'stroke-muted'}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={color ?? 'stroke-primary'}
          style={{
            strokeDasharray: circumference,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </svg>
      {showValue && (
        <span className="absolute text-xs font-medium">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}

export default CircularProgress;
