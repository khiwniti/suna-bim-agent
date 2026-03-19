/**
 * Files Upload API Route
 *
 * Proxies file uploads to the BIM Agent backend
 * Supports: PDF, Excel, CSV, Images, CAD files
 */

import { NextRequest, NextResponse } from 'next/server';
import { expensiveRateLimiter } from '@/lib/security';

const BIM_SERVICE_URL = process.env.BIM_AGENT_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  const rateLimitError = await expensiveRateLimiter.check(request);
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const backendFormData = new FormData();
    backendFormData.append('file', file, file.name);

    const response = await fetch(`${BIM_SERVICE_URL}/files/upload`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || 'Upload failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
