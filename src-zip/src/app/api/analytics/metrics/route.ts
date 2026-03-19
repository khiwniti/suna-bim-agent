/**
 * Analytics Metrics API Route
 *
 * GET /api/analytics/metrics - Fetch tenant usage metrics
 *
 * Query Parameters:
 * - tenantId: Required - The tenant ID to fetch metrics for
 * - startDate: Optional - Start of date range (ISO 8601)
 * - endDate: Optional - End of date range (ISO 8601)
 * - period: Optional - Aggregation period: day | week | month (default: day)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/supabase/server';
import { standardRateLimiter } from '@/lib/security';
import { checkTenantAccess } from '@/lib/tenant';
import {
  getTenantUsageMetrics,
  getTenantOverviewMetrics,
  aggregateUsageByPeriod,
} from '@/lib/analytics/metrics';

// Query parameter validation schema
const querySchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month']).default('day'),
});

/**
 * GET /api/analytics/metrics
 *
 * Fetch tenant usage metrics with optional aggregation
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // Authenticate user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryResult = querySchema.safeParse({
      tenantId: searchParams.get('tenantId'),
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      period: searchParams.get('period') || 'day',
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: queryResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { tenantId, startDate, endDate, period } = queryResult.data;

    // Verify user has access to this tenant
    const hasAccess = await checkTenantAccess(tenantId, user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this tenant' },
        { status: 403 }
      );
    }

    // Get tenant overview
    const overview = await getTenantOverviewMetrics(tenantId);
    if (!overview) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Calculate date range (default to last 30 days)
    const now = new Date();
    const defaultStartDate = new Date(now);
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : now;

    // Fetch usage metrics
    const rawUsage = await getTenantUsageMetrics(tenantId, start, end);

    // Aggregate by period if needed
    const usage = aggregateUsageByPeriod(rawUsage, period);

    // Transform dates to ISO strings for JSON serialization
    const serializedUsage = usage.map((item) => ({
      period: item.period.toISOString(),
      apiCalls: item.apiCalls,
      storageGb: item.storageGb,
      agentTokens: item.agentTokens,
    }));

    return NextResponse.json({
      usage: serializedUsage,
      overview,
      meta: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        period,
        totalRecords: serializedUsage.length,
      },
    });
  } catch (error) {
    console.error('Analytics metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
