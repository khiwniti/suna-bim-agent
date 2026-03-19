'use client';

/**
 * UsageChart Component
 *
 * Displays usage metrics over time with interactive charts:
 * - API calls trend
 * - Storage usage trend
 * - Agent tokens consumed
 *
 * Features:
 * - Period selection (day, week, month)
 * - Metric toggle visibility
 * - Responsive chart sizing
 * - Tooltip formatting
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { UsageMetric, AggregationPeriod } from '@/lib/analytics/metrics';

// ============================================
// Types
// ============================================

interface UsageChartProps {
  data: UsageMetric[];
  period?: AggregationPeriod;
  onPeriodChange?: (period: AggregationPeriod) => void;
  isLoading?: boolean;
  className?: string;
}

type MetricType = 'apiCalls' | 'storage' | 'tokens';

interface VisibleMetrics {
  apiCalls: boolean;
  storage: boolean;
  tokens: boolean;
}

// ============================================
// Constants
// ============================================

const CHART_COLORS = {
  apiCalls: '#3b82f6', // blue-500
  storage: '#10b981', // emerald-500
  tokens: '#f59e0b', // amber-500
};

const METRIC_LABELS: Record<MetricType, string> = {
  apiCalls: 'API Calls',
  storage: 'Storage (GB)',
  tokens: 'Agent Tokens',
};

// Skeleton bar heights for loading animation
const SKELETON_HEIGHTS = [60, 45, 75, 50, 80, 55, 70, 40, 65, 58, 72, 48];

const PERIODS: { value: AggregationPeriod; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

// ============================================
// Helper Functions
// ============================================

function formatDate(date: Date, period: AggregationPeriod): string {
  switch (period) {
    case 'day':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'week':
      return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    default:
      return date.toISOString().split('T')[0];
  }
}

function formatTooltipValue(value: number, metric: string): string {
  if (metric === 'storage' || metric === 'Storage (GB)') {
    return `${value.toFixed(2)} GB`;
  }
  return value.toLocaleString();
}

// ============================================
// Subcomponents
// ============================================

interface PeriodSelectorProps {
  value: AggregationPeriod;
  onChange: (period: AggregationPeriod) => void;
}

function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {PERIODS.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            value === period.value
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

interface MetricToggleProps {
  metrics: VisibleMetrics;
  onToggle: (metric: MetricType) => void;
}

function MetricToggle({ metrics, onToggle }: MetricToggleProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(metrics) as MetricType[]).map((metric) => (
        <button
          key={metric}
          onClick={() => onToggle(metric)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors',
            metrics[metric]
              ? 'border-transparent'
              : 'border-border text-muted-foreground opacity-50'
          )}
          style={{
            backgroundColor: metrics[metric]
              ? `${CHART_COLORS[metric]}20`
              : undefined,
            color: metrics[metric] ? CHART_COLORS[metric] : undefined,
          }}
        >
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: CHART_COLORS[metric] }}
          />
          {METRIC_LABELS[metric]}
        </button>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-64 flex items-end justify-between px-4 pb-4">
      {SKELETON_HEIGHTS.map((height, i) => (
        <div
          key={i}
          className="w-8 bg-muted rounded-t animate-pulse"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-center p-8">
      <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Usage Data</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Start using the platform to see usage trends appear here.
      </p>
    </div>
  );
}

// ============================================
// Custom Tooltip
// ============================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              {formatTooltipValue(entry.value, entry.name)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function UsageChart({
  data,
  period = 'day',
  onPeriodChange,
  isLoading = false,
  className,
}: UsageChartProps) {
  const [visibleMetrics, setVisibleMetrics] = useState<VisibleMetrics>({
    apiCalls: true,
    storage: true,
    tokens: false,
  });

  // Transform data for chart
  const chartData = useMemo(() => {
    return data.map((item) => ({
      date: formatDate(item.period, period),
      'API Calls': item.apiCalls,
      'Storage (GB)': item.storageGb,
      'Agent Tokens': item.agentTokens,
    }));
  }, [data, period]);

  const toggleMetric = (metric: MetricType) => {
    setVisibleMetrics((prev) => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  const handlePeriodChange = (newPeriod: AggregationPeriod) => {
    onPeriodChange?.(newPeriod);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Usage Over Time</CardTitle>
          {onPeriodChange && (
            <PeriodSelector value={period} onChange={handlePeriodChange} />
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {/* Metric Toggles */}
          <div className="mb-4">
            <MetricToggle metrics={visibleMetrics} onToggle={toggleMetric} />
          </div>

          {/* Chart Area */}
          {isLoading ? (
            <ChartSkeleton />
          ) : chartData.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="h-64" role="img" aria-label="Usage trends chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorApiCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.apiCalls} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.apiCalls} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.storage} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.storage} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.tokens} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.tokens} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                      return value;
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {visibleMetrics.apiCalls && (
                    <Area
                      type="monotone"
                      dataKey="API Calls"
                      stroke={CHART_COLORS.apiCalls}
                      fillOpacity={1}
                      fill="url(#colorApiCalls)"
                      strokeWidth={2}
                    />
                  )}
                  {visibleMetrics.storage && (
                    <Area
                      type="monotone"
                      dataKey="Storage (GB)"
                      stroke={CHART_COLORS.storage}
                      fillOpacity={1}
                      fill="url(#colorStorage)"
                      strokeWidth={2}
                    />
                  )}
                  {visibleMetrics.tokens && (
                    <Area
                      type="monotone"
                      dataKey="Agent Tokens"
                      stroke={CHART_COLORS.tokens}
                      fillOpacity={1}
                      fill="url(#colorTokens)"
                      strokeWidth={2}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default UsageChart;
