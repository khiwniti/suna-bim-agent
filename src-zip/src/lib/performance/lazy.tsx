/**
 * Lazy Loading Utilities
 *
 * Dynamic imports and lazy loading patterns for performance.
 */

import dynamic from 'next/dynamic';

// Loading fallback component
export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  );
}

// Skeleton loader
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700 ${className}`} />
  );
}

// Heavy component lazy loaders
export const LazyBOQAnalyzer = dynamic(
  () => import('@/components/calculator/BOQAnalyzer').then((mod) => mod.BOQAnalyzer),
  {
    loading: () => <LoadingSpinner className="min-h-[400px]" />,
    ssr: false,
  }
);

export const LazyMDXContent = dynamic(
  () => import('@/components/blog/MDXContent').then((mod) => mod.MDXContent),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: true,
  }
);

// Chart components (heavy)
export const LazyCarbonAnalyticsDashboard = dynamic(
  () => import('@/components/calculator/CarbonAnalyticsDashboard').then((mod) => mod.CarbonAnalyticsDashboard),
  {
    loading: () => <Skeleton className="h-[500px] w-full" />,
    ssr: false,
  }
);
