'use client';

/**
 * TenantMetrics Component
 *
 * Displays key tenant metrics in card format:
 * - Total users
 * - Total projects
 * - API calls
 * - Storage usage
 *
 * Features:
 * - Skeleton loading states
 * - Percentage change indicators
 * - Tier badge display
 * - Accessible ARIA labels
 */

import { motion } from 'framer-motion';
import { Users, FolderKanban, Activity, HardDrive, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { TenantOverview } from '@/lib/analytics/metrics';

// ============================================
// Types
// ============================================

interface TenantMetricsProps {
  overview: TenantOverview | null;
  isLoading?: boolean;
  previousPeriod?: {
    apiCalls: number;
    storageGb: number;
  };
  className?: string;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  formattedValue?: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'purple' | 'amber';
}

// ============================================
// Helper Functions
// ============================================

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatStorage(gb: number): string {
  if (gb >= 1000) {
    return `${(gb / 1000).toFixed(1)} TB`;
  }
  return `${gb.toFixed(1)} GB`;
}

function formatApiCalls(calls: number): string {
  if (calls >= 1000000) {
    return `${(calls / 1000000).toFixed(1)}M`;
  }
  if (calls >= 1000) {
    return `${(calls / 1000).toFixed(1)}K`;
  }
  return formatNumber(calls);
}

function getChangeIndicator(current: number, previous: number) {
  if (previous === 0) return { value: 0, isPositive: true };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change),
    isPositive: change >= 0,
  };
}

function getTierBadgeColor(tier: string): string {
  switch (tier) {
    case 'STARTER':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    case 'PROFESSIONAL':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'ENTERPRISE':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'UNLIMITED':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

// ============================================
// Subcomponents
// ============================================

function MetricCard({
  icon,
  label,
  value,
  formattedValue,
  change,
  color,
}: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="h-full"
        aria-label={`${label}: ${formattedValue ?? value}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div
              className={cn(
                'p-2.5 rounded-lg',
                colorClasses[color]
              )}
            >
              {icon}
            </div>
            {change && change.value > 0 && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  change.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {change.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {change.value.toFixed(1)}%
              </div>
            )}
          </div>
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{formattedValue ?? value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MetricCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-8 w-28 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Component
// ============================================

export function TenantMetrics({
  overview,
  isLoading = false,
  previousPeriod,
  className,
}: TenantMetricsProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Tier Badge Skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-6 w-32 bg-muted rounded-full animate-pulse" />
          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
        </div>

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      </div>
    );
  }

  // Handle null overview
  const metrics = overview
    ? {
        totalUsers: overview.totalUsers,
        totalProjects: overview.totalProjects,
        totalApiCalls: overview.totalApiCalls,
        totalStorageGb: overview.totalStorageGb,
      }
    : {
        totalUsers: 0,
        totalProjects: 0,
        totalApiCalls: 0,
        totalStorageGb: 0,
      };

  // Calculate change indicators if previous period is provided
  const apiCallsChange = previousPeriod
    ? getChangeIndicator(metrics.totalApiCalls, previousPeriod.apiCalls)
    : undefined;
  const storageChange = previousPeriod
    ? getChangeIndicator(metrics.totalStorageGb, previousPeriod.storageGb)
    : undefined;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Tenant Info Header */}
      {overview && (
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{overview.tenantName}</h2>
          <span
            className={cn(
              'px-2.5 py-0.5 text-xs font-medium rounded-full',
              getTierBadgeColor(overview.subscriptionTier)
            )}
          >
            {overview.subscriptionTier}
          </span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          label="Total Users"
          value={metrics.totalUsers}
          formattedValue={formatNumber(metrics.totalUsers)}
          color="blue"
        />
        <MetricCard
          icon={<FolderKanban className="w-5 h-5" />}
          label="Total Projects"
          value={metrics.totalProjects}
          formattedValue={formatNumber(metrics.totalProjects)}
          color="green"
        />
        <MetricCard
          icon={<Activity className="w-5 h-5" />}
          label="API Calls"
          value={metrics.totalApiCalls}
          formattedValue={formatApiCalls(metrics.totalApiCalls)}
          change={apiCallsChange}
          color="purple"
        />
        <MetricCard
          icon={<HardDrive className="w-5 h-5" />}
          label="Storage Used"
          value={metrics.totalStorageGb}
          formattedValue={formatStorage(metrics.totalStorageGb)}
          change={storageChange}
          color="amber"
        />
      </div>
    </div>
  );
}

export default TenantMetrics;
