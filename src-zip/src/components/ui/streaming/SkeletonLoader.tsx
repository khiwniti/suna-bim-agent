'use client';

/**
 * SkeletonLoader - Structure-aware skeleton loading placeholders
 *
 * Provides visual structure while content is loading, matching expected output.
 */

import { cn } from '@/lib/utils';

export interface SkeletonLoaderProps {
  /** Layout pattern to display */
  variant?: 'text' | 'card' | 'table' | 'list' | 'code' | 'image';
  /** Number of lines for text variant */
  lines?: number;
  /** Number of rows for table/list variants */
  rows?: number;
  /** Width configuration */
  width?: 'full' | 'auto' | string;
  /** Enable shimmer animation */
  animate?: boolean;
  className?: string;
}

function SkeletonLine({
  width = '100%',
  height = '1rem',
  animate = true,
  className,
}: {
  width?: string;
  height?: string;
  animate?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn('rounded bg-muted', animate && 'animate-pulse', className)}
      style={{ width, height }}
    />
  );
}

export function SkeletonLoader({
  variant = 'text',
  lines = 3,
  rows = 3,
  width = 'full',
  animate = true,
  className,
}: SkeletonLoaderProps) {
  const baseClass = cn(
    'space-y-2',
    width === 'full' ? 'w-full' : width === 'auto' ? 'w-auto' : '',
    className
  );

  switch (variant) {
    case 'text':
      return (
        <div className={baseClass}>
          {Array.from({ length: lines }).map((_, i) => (
            <SkeletonLine
              key={i}
              width={i === lines - 1 ? '60%' : '100%'}
              height="0.875rem"
              animate={animate}
            />
          ))}
        </div>
      );

    case 'card':
      return (
        <div className={cn(baseClass, 'p-4 border rounded-lg')}>
          <SkeletonLine width="40%" height="1.25rem" animate={animate} />
          <SkeletonLine width="100%" height="0.875rem" animate={animate} />
          <SkeletonLine width="80%" height="0.875rem" animate={animate} />
          <div className="flex gap-2 mt-2">
            <SkeletonLine width="4rem" height="2rem" animate={animate} />
            <SkeletonLine width="4rem" height="2rem" animate={animate} />
          </div>
        </div>
      );

    case 'table':
      return (
        <div className={cn(baseClass, 'border rounded-lg overflow-hidden')}>
          {/* Header */}
          <div className="flex gap-2 p-2 bg-muted/50">
            <SkeletonLine width="25%" height="1rem" animate={animate} />
            <SkeletonLine width="25%" height="1rem" animate={animate} />
            <SkeletonLine width="25%" height="1rem" animate={animate} />
            <SkeletonLine width="25%" height="1rem" animate={animate} />
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-2 p-2 border-t border-border">
              <SkeletonLine width="25%" height="0.875rem" animate={animate} />
              <SkeletonLine width="25%" height="0.875rem" animate={animate} />
              <SkeletonLine width="25%" height="0.875rem" animate={animate} />
              <SkeletonLine width="25%" height="0.875rem" animate={animate} />
            </div>
          ))}
        </div>
      );

    case 'list':
      return (
        <div className={baseClass}>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonLine
                width="2rem"
                height="2rem"
                animate={animate}
                className="rounded-full flex-shrink-0"
              />
              <div className="flex-1 space-y-1">
                <SkeletonLine width="70%" height="0.875rem" animate={animate} />
                <SkeletonLine width="40%" height="0.75rem" animate={animate} />
              </div>
            </div>
          ))}
        </div>
      );

    case 'code':
      return (
        <div className={cn(baseClass, 'p-3 bg-muted/50 rounded-lg font-mono')}>
          <SkeletonLine width="60%" height="0.75rem" animate={animate} />
          <SkeletonLine width="80%" height="0.75rem" animate={animate} className="ml-4" />
          <SkeletonLine width="70%" height="0.75rem" animate={animate} className="ml-4" />
          <SkeletonLine width="50%" height="0.75rem" animate={animate} className="ml-8" />
          <SkeletonLine width="40%" height="0.75rem" animate={animate} />
        </div>
      );

    case 'image':
      return (
        <div
          className={cn(
            baseClass,
            'aspect-video rounded-lg bg-muted flex items-center justify-center',
            animate && 'animate-pulse'
          )}
        >
          <svg
            className="w-10 h-10 text-muted-foreground/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      );

    default:
      return null;
  }
}

export default SkeletonLoader;
