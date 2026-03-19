/**
 * Analysis Job Status API Route
 *
 * GET /api/analysis/[jobId] - Get status of a background analysis job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { expensiveRateLimiter } from '@/lib/security';
import { getJob } from '@/lib/jobs/job-store';

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

/**
 * GET /api/analysis/[jobId] - Get job status
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Apply rate limiting
    const rateLimitError = await expensiveRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;
    const job = getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Return job status
    return NextResponse.json({
      jobId: job.id,
      type: job.type,
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      result: job.result,
      error: job.error,
      metadata: job.metadata,
    });
  } catch (error) {
    console.error('Get job status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
