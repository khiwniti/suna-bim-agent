'use client';

/**
 * PanelLoadingState
 *
 * Skeleton loading components for different panel types.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type LoadingVariant = 'table' | 'chart' | 'image' | 'document' | 'list' | 'generic';

interface PanelLoadingStateProps {
  variant?: LoadingVariant;
  message?: string;
  className?: string;
}

// Skeleton pulse animation component
const SkeletonPulse = memo(function SkeletonPulse({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={cn('bg-muted rounded animate-pulse', className)}
      style={style}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
});

// Table skeleton for BOQ panel
const TableSkeleton = memo(function TableSkeleton() {
  const rows = 5;
  const cols = 4;

  return (
    <div className="space-y-2 p-4">
      {/* Header row */}
      <div className="flex gap-4 pb-2 border-b border-muted">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonPulse key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          data-testid="skeleton-row"
          className="flex gap-4 py-2"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <SkeletonPulse
              key={`cell-${rowIdx}-${colIdx}`}
              className={cn('h-4 flex-1', colIdx === 0 && 'max-w-[200px]')}
            />
          ))}
        </div>
      ))}
    </div>
  );
});

// Chart skeleton for Carbon Dashboard
const ChartSkeleton = memo(function ChartSkeleton() {
  return (
    <div className="p-4 space-y-4" data-testid="skeleton-chart">
      {/* Summary cards */}
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 p-4 border border-muted rounded-lg">
            <SkeletonPulse className="h-4 w-20 mb-2" />
            <SkeletonPulse className="h-8 w-32" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="flex gap-4">
        {/* Pie chart placeholder */}
        <div className="flex-1 aspect-square max-w-[200px] flex items-center justify-center">
          <SkeletonPulse className="w-40 h-40 rounded-full" />
        </div>

        {/* Bar chart placeholder */}
        <div className="flex-1 flex items-end gap-2 h-40">
          {[60, 80, 40, 90, 50, 70].map((height, i) => (
            <SkeletonPulse
              key={i}
              className="flex-1"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// Image skeleton for Floor Plan
const ImageSkeleton = memo(function ImageSkeleton() {
  return (
    <div className="p-4 h-full flex flex-col" data-testid="skeleton-image">
      {/* Toolbar */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonPulse key={i} className="w-8 h-8 rounded" />
        ))}
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center">
        <SkeletonPulse className="w-3/4 h-3/4 rounded-lg" />
      </div>
    </div>
  );
});

// Document skeleton for Document Editor
const DocumentSkeleton = memo(function DocumentSkeleton() {
  return (
    <div className="p-4 space-y-4" data-testid="skeleton-document">
      {/* Title */}
      <SkeletonPulse className="h-8 w-1/3" />

      {/* Paragraphs */}
      {[1, 2, 3].map((para) => (
        <div key={para} className="space-y-2">
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
});

// List skeleton for Clash Report
const ListSkeleton = memo(function ListSkeleton() {
  return (
    <div className="p-4 space-y-3" data-testid="skeleton-list">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-muted rounded-lg">
          <SkeletonPulse className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonPulse className="h-4 w-1/2" />
            <SkeletonPulse className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
});

// Generic fallback skeleton
const GenericSkeleton = memo(function GenericSkeleton() {
  return (
    <div className="p-4 space-y-4" data-testid="skeleton-generic">
      <SkeletonPulse className="h-6 w-1/4" />
      <SkeletonPulse className="h-4 w-3/4" />
      <SkeletonPulse className="h-4 w-1/2" />
      <div className="flex gap-4 mt-6">
        <SkeletonPulse className="h-32 flex-1" />
        <SkeletonPulse className="h-32 flex-1" />
      </div>
    </div>
  );
});

// Main component
export const PanelLoadingState = memo(function PanelLoadingState({
  variant = 'generic',
  message,
  className,
}: PanelLoadingStateProps) {
  const SkeletonComponent = {
    table: TableSkeleton,
    chart: ChartSkeleton,
    image: ImageSkeleton,
    document: DocumentSkeleton,
    list: ListSkeleton,
    generic: GenericSkeleton,
  }[variant];

  return (
    <div className={cn('h-full w-full', className)}>
      <SkeletonComponent />

      {message && (
        <div className="flex items-center justify-center mt-4">
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
      )}
    </div>
  );
});

export default PanelLoadingState;
