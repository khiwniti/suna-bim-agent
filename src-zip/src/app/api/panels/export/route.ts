/**
 * Panel Export API Route
 *
 * POST /api/panels/export
 * Exports panel data to various formats (PDF, Excel, JSON)
 *
 * Security:
 * - Rate limiting (expensive operations - file generation)
 * - CSRF validation
 * - Authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import type { PanelId } from '@/lib/panels/types';
import { expensiveRateLimiter, validateCSRFToken } from '@/lib/security';
import { getUser } from '@/lib/supabase/server';

const VALID_PANEL_IDS: PanelId[] = [
  '3d-viewer',
  'boq-table',
  'carbon-dashboard',
  'floorplan-viewer',
  'document-editor',
];

const VALID_FORMATS = ['pdf', 'excel', 'json'] as const;
type ExportFormat = (typeof VALID_FORMATS)[number];

interface ExportRequest {
  panelId: PanelId;
  format: ExportFormat;
  data: Record<string, unknown>;
  options?: {
    title?: string;
    includeTimestamp?: boolean;
    projectName?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting (expensive operation)
    const rateLimitError = await expensiveRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // 2. CSRF validation
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    // 3. Authentication check
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: ExportRequest = await request.json();

    // Validate panel ID
    if (!body.panelId || !VALID_PANEL_IDS.includes(body.panelId)) {
      return NextResponse.json(
        { error: 'Invalid or missing panel ID' },
        { status: 400 }
      );
    }

    // Validate format
    if (!body.format || !VALID_FORMATS.includes(body.format)) {
      return NextResponse.json(
        { error: 'Invalid or missing format. Valid formats: pdf, excel, json' },
        { status: 400 }
      );
    }

    // Validate data
    if (!body.data) {
      return NextResponse.json(
        { error: 'Missing data to export' },
        { status: 400 }
      );
    }

    // Generate export based on format
    const exportResult = await generateExport(body);

    return NextResponse.json({
      success: true,
      panelId: body.panelId,
      format: body.format,
      userId: user.id,
      ...exportResult,
    });
  } catch (error) {
    console.error('[Panel Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export panel data' },
      { status: 500 }
    );
  }
}

async function generateExport(request: ExportRequest) {
  const timestamp = new Date().toISOString();
  const filename = `${request.panelId}-export-${Date.now()}`;

  switch (request.format) {
    case 'json':
      // JSON export - return data directly
      return {
        filename: `${filename}.json`,
        data: request.data,
        exportedAt: timestamp,
      };

    case 'pdf':
      // PDF export - placeholder for actual PDF generation
      // Would use libraries like @react-pdf/renderer or puppeteer
      return {
        filename: `${filename}.pdf`,
        message: 'PDF export would be generated here',
        exportedAt: timestamp,
      };

    case 'excel':
      // Excel export - placeholder for actual Excel generation
      // Would use libraries like xlsx or exceljs
      return {
        filename: `${filename}.xlsx`,
        message: 'Excel export would be generated here',
        exportedAt: timestamp,
      };

    default:
      throw new Error(`Unsupported format: ${request.format}`);
  }
}
