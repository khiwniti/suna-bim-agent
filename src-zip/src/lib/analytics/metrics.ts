/**
 * Tenant Analytics Metrics
 *
 * Aggregation library for tenant usage metrics and analytics data.
 * Fetches from TenantUsage model and provides aggregation utilities.
 */

import { prisma } from '@/lib/db';
import type { SubscriptionTier } from '@prisma/client';

// ============================================
// Types
// ============================================

export interface UsageMetric {
  period: Date;
  apiCalls: number;
  storageGb: number;
  agentTokens: number;
}

export interface TenantOverview {
  tenantId: string;
  tenantName: string;
  subscriptionTier: SubscriptionTier;
  totalUsers: number;
  totalProjects: number;
  totalApiCalls: number;
  totalStorageGb: number;
  totalAgentTokens: number;
}

export type AggregationPeriod = 'day' | 'week' | 'month';

// ============================================
// Metrics Functions
// ============================================

/**
 * Get tenant usage metrics within a date range
 */
export async function getTenantUsageMetrics(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<UsageMetric[]> {
  const records = await prisma.tenantUsage.findMany({
    where: {
      tenantId,
      period: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { period: 'asc' },
  });

  return records.map((record) => ({
    period: record.period,
    apiCalls: record.apiCalls,
    storageGb: record.storageGb,
    agentTokens: record.agentTokens,
  }));
}

/**
 * Get aggregated tenant overview metrics
 */
export async function getTenantOverviewMetrics(
  tenantId: string
): Promise<TenantOverview | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      _count: {
        select: {
          memberships: true,
          projects: true,
        },
      },
    },
  });

  if (!tenant) {
    return null;
  }

  // Aggregate all-time usage
  const aggregation = await prisma.tenantUsage.aggregate({
    where: { tenantId },
    _sum: {
      apiCalls: true,
      storageGb: true,
      agentTokens: true,
    },
  });

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    subscriptionTier: tenant.subscriptionTier,
    totalUsers: tenant._count.memberships,
    totalProjects: tenant._count.projects,
    totalApiCalls: aggregation._sum.apiCalls ?? 0,
    totalStorageGb: aggregation._sum.storageGb ?? 0,
    totalAgentTokens: aggregation._sum.agentTokens ?? 0,
  };
}

/**
 * Aggregate usage data by period (day, week, month)
 *
 * For API calls and tokens: sums values
 * For storage: takes max value (storage is cumulative)
 */
export function aggregateUsageByPeriod(
  data: UsageMetric[],
  period: AggregationPeriod
): UsageMetric[] {
  if (data.length === 0) {
    return [];
  }

  if (period === 'day') {
    return data;
  }

  // Group by period key
  const groups = new Map<string, UsageMetric[]>();

  data.forEach((item) => {
    const key = getPeriodKey(item.period, period);
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  });

  // Aggregate each group
  const result: UsageMetric[] = [];

  groups.forEach((items, key) => {
    const periodDate = getDateFromPeriodKey(key, period);

    result.push({
      period: periodDate,
      apiCalls: items.reduce((sum, item) => sum + item.apiCalls, 0),
      storageGb: Math.max(...items.map((item) => item.storageGb)),
      agentTokens: items.reduce((sum, item) => sum + item.agentTokens, 0),
    });
  });

  // Sort by period date
  result.sort((a, b) => a.period.getTime() - b.period.getTime());

  return result;
}

/**
 * Get period key for grouping
 */
function getPeriodKey(date: Date, period: AggregationPeriod): string {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (period === 'month') {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  }

  if (period === 'week') {
    // Get start of week (Sunday)
    const dayOfWeek = date.getDay();
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - dayOfWeek);
    return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
  }

  // Day
  return date.toISOString().split('T')[0];
}

/**
 * Get date from period key
 */
function getDateFromPeriodKey(key: string, period: AggregationPeriod): Date {
  if (period === 'month') {
    const [year, month] = key.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }

  // Week or day - parse full date
  return new Date(key);
}

/**
 * Get usage metrics for multiple tenants
 */
export async function getMultipleTenantUsageMetrics(
  tenantIds: string[],
  startDate: Date,
  endDate: Date
): Promise<Map<string, UsageMetric[]>> {
  const records = await prisma.tenantUsage.findMany({
    where: {
      tenantId: { in: tenantIds },
      period: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { period: 'asc' },
  });

  const result = new Map<string, UsageMetric[]>();

  records.forEach((record) => {
    const existing = result.get(record.tenantId) || [];
    existing.push({
      period: record.period,
      apiCalls: record.apiCalls,
      storageGb: record.storageGb,
      agentTokens: record.agentTokens,
    });
    result.set(record.tenantId, existing);
  });

  return result;
}

/**
 * Calculate usage comparison between two periods
 */
export function calculateUsageComparison(
  currentPeriod: UsageMetric[],
  previousPeriod: UsageMetric[]
): {
  apiCalls: { current: number; previous: number; changePercent: number };
  storageGb: { current: number; previous: number; changePercent: number };
  agentTokens: { current: number; previous: number; changePercent: number };
} {
  const sumApiCalls = (data: UsageMetric[]) =>
    data.reduce((sum, item) => sum + item.apiCalls, 0);
  const sumTokens = (data: UsageMetric[]) =>
    data.reduce((sum, item) => sum + item.agentTokens, 0);
  const maxStorage = (data: UsageMetric[]) =>
    data.length > 0 ? Math.max(...data.map((item) => item.storageGb)) : 0;

  const currentApiCalls = sumApiCalls(currentPeriod);
  const previousApiCalls = sumApiCalls(previousPeriod);
  const currentStorage = maxStorage(currentPeriod);
  const previousStorage = maxStorage(previousPeriod);
  const currentTokens = sumTokens(currentPeriod);
  const previousTokens = sumTokens(previousPeriod);

  const calcPercent = (current: number, previous: number) =>
    previous === 0 ? 0 : ((current - previous) / previous) * 100;

  return {
    apiCalls: {
      current: currentApiCalls,
      previous: previousApiCalls,
      changePercent: calcPercent(currentApiCalls, previousApiCalls),
    },
    storageGb: {
      current: currentStorage,
      previous: previousStorage,
      changePercent: calcPercent(currentStorage, previousStorage),
    },
    agentTokens: {
      current: currentTokens,
      previous: previousTokens,
      changePercent: calcPercent(currentTokens, previousTokens),
    },
  };
}
