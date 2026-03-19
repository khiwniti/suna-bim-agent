'use client';

/**
 * AdvancedDashboard Component
 *
 * Main analytics dashboard combining:
 * - Tenant selection (for users with multiple tenants)
 * - Overview metrics cards
 * - Usage trends chart
 * - Date range selection
 *
 * Features:
 * - SWR for data fetching with caching
 * - Period aggregation (day/week/month)
 * - Date range picker
 * - Responsive layout
 * - Loading and error states
 */

import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TenantMetrics } from './TenantMetrics';
import { UsageChart } from './UsageChart';
import type { TenantOverview, UsageMetric, AggregationPeriod } from '@/lib/analytics/metrics';

// ============================================
// Types
// ============================================

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface AdvancedDashboardProps {
  tenants: Tenant[];
  defaultTenantId?: string;
  className?: string;
}

interface MetricsResponse {
  usage: Array<{
    period: string;
    apiCalls: number;
    storageGb: number;
    agentTokens: number;
  }>;
  overview: TenantOverview;
  meta: {
    startDate: string;
    endDate: string;
    period: AggregationPeriod;
    totalRecords: number;
  };
}

// ============================================
// Fetcher
// ============================================

const fetcher = async (url: string): Promise<MetricsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch' }));
    throw new Error(error.error || 'Failed to fetch metrics');
  }
  return res.json();
};

// ============================================
// Helper Functions
// ============================================

function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
}

function transformUsageData(
  data: MetricsResponse['usage']
): UsageMetric[] {
  return data.map((item) => ({
    period: new Date(item.period),
    apiCalls: item.apiCalls,
    storageGb: item.storageGb,
    agentTokens: item.agentTokens,
  }));
}

// ============================================
// Constants
// ============================================

const DATE_RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

// ============================================
// Subcomponents
// ============================================

interface TenantSelectorProps {
  tenants: Tenant[];
  selectedId: string;
  onChange: (id: string) => void;
}

function TenantSelector({ tenants, selectedId, onChange }: TenantSelectorProps) {
  if (tenants.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="tenant-select" className="text-sm text-muted-foreground">
        Organization:
      </label>
      <select
        id="tenant-select"
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
    </div>
  );
}

interface DateRangeSelectorProps {
  value: number;
  onChange: (days: number) => void;
}

function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {DATE_RANGES.map((range) => (
        <button
          key={range.days}
          onClick={() => onChange(range.days)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            value === range.days
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to Load Analytics</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{message}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </Card>
  );
}

// ============================================
// Main Component
// ============================================

export function AdvancedDashboard({
  tenants,
  defaultTenantId,
  className,
}: AdvancedDashboardProps) {
  // State
  const [selectedTenantId, setSelectedTenantId] = useState(
    defaultTenantId || tenants[0]?.id || ''
  );
  const [dateRangeDays, setDateRangeDays] = useState(30);
  const [period, setPeriod] = useState<AggregationPeriod>('day');

  // Calculate date range
  const { start, end } = useMemo(() => getDateRange(dateRangeDays), [dateRangeDays]);

  // Build API URL
  const apiUrl = useMemo(() => {
    if (!selectedTenantId) return null;

    const params = new URLSearchParams({
      tenantId: selectedTenantId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      period,
    });

    return `/api/analytics/metrics?${params.toString()}`;
  }, [selectedTenantId, start, end, period]);

  // Fetch data with SWR
  const { data, error, isLoading, mutate } = useSWR<MetricsResponse>(
    apiUrl,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: false,
    }
  );

  // Transform usage data
  const usageData = useMemo(() => {
    return data ? transformUsageData(data.usage) : [];
  }, [data]);

  // Handlers
  const handleTenantChange = useCallback((id: string) => {
    setSelectedTenantId(id);
  }, []);

  const handleDateRangeChange = useCallback((days: number) => {
    setDateRangeDays(days);
    // Adjust period based on date range
    if (days <= 7) {
      setPeriod('day');
    } else if (days <= 30) {
      setPeriod('day');
    } else {
      setPeriod('week');
    }
  }, []);

  const handlePeriodChange = useCallback((newPeriod: AggregationPeriod) => {
    setPeriod(newPeriod);
  }, []);

  const handleRetry = useCallback(() => {
    mutate();
  }, [mutate]);

  // Handle no tenants
  if (tenants.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Organizations Found</h3>
          <p className="text-sm text-muted-foreground">
            You need to be a member of at least one organization to view analytics.
          </p>
        </div>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <ErrorState
        message={error.message || 'Unable to load analytics data'}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <TenantSelector
          tenants={tenants}
          selectedId={selectedTenantId}
          onChange={handleTenantChange}
        />
        <div className="flex items-center gap-4">
          <DateRangeSelector
            value={dateRangeDays}
            onChange={handleDateRangeChange}
          />
          <button
            onClick={handleRetry}
            disabled={isLoading}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            aria-label="Refresh data"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <TenantMetrics
        overview={data?.overview ?? null}
        isLoading={isLoading}
      />

      {/* Usage Chart */}
      <UsageChart
        data={usageData}
        period={period}
        onPeriodChange={handlePeriodChange}
        isLoading={isLoading}
      />

      {/* Additional Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : data ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Date Range</span>
                  <span className="text-sm font-medium">
                    {new Date(data.meta.startDate).toLocaleDateString()} -{' '}
                    {new Date(data.meta.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Data Points</span>
                  <span className="text-sm font-medium">{data.meta.totalRecords}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Aggregation</span>
                  <span className="text-sm font-medium capitalize">{data.meta.period}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Subscription</span>
                  <span className="text-sm font-medium">{data.overview.subscriptionTier}</span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Period Totals</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : usageData.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total API Calls</span>
                  <span className="text-sm font-medium">
                    {usageData
                      .reduce((sum, item) => sum + item.apiCalls, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Peak Storage</span>
                  <span className="text-sm font-medium">
                    {Math.max(...usageData.map((item) => item.storageGb)).toFixed(1)} GB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Tokens</span>
                  <span className="text-sm font-medium">
                    {usageData
                      .reduce((sum, item) => sum + item.agentTokens, 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data for selected period</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdvancedDashboard;
