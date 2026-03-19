/**
 * Reports API
 *
 * POST /api/reports/generate - Generate a BIM analysis report
 *
 * Security: Authentication, CSRF validation, and rate limiting required
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateReport, reportToMarkdown, type ReportType, type ReportOptions } from '@/lib/reports';
import { expensiveRateLimiter, validateCSRFToken } from '@/lib/security';
import { getUser } from '@/lib/supabase/server';
import type { BIMModel } from '@/types';

interface GenerateReportRequest {
  model: BIMModel;
  type: ReportType;
  options?: Partial<ReportOptions>;
  format?: 'json' | 'markdown';
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check - require logged in user
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Apply rate limiting (report generation is expensive)
    const rateLimitError = await expensiveRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // 3. Validate CSRF token
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    const body = await request.json() as GenerateReportRequest;
    const { model, type, options, format = 'json' } = body;

    if (!model) {
      return NextResponse.json(
        { error: 'Model data is required' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Report type is required' },
        { status: 400 }
      );
    }

    // Ensure dates are proper Date objects
    const modelWithDates: BIMModel = {
      ...model,
      createdAt: new Date(model.createdAt),
      updatedAt: new Date(model.updatedAt),
    };

    // Generate the report
    const report = await generateReport(modelWithDates, type, options);

    // Return in requested format
    if (format === 'markdown') {
      const markdown = reportToMarkdown(report);
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${report.type}-report.md"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Report generation failed' },
      { status: 500 }
    );
  }
}
