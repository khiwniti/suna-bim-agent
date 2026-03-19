/**
 * MCP Health API Route - Proxies to BIM Agent Service
 */

import { NextRequest, NextResponse } from 'next/server';
import { standardRateLimiter } from '@/lib/security';

const BIM_SERVICE_URL = process.env.BIM_AGENT_SERVICE_URL || 'http://localhost:8000';
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const response = await fetch(`${BIM_SERVICE_URL}/mcp/health`, {
      headers: {
        'X-Service-Key': SERVICE_API_KEY,
      },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: 'unhealthy', backend: 'unreachable' },
        { status: 503 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[MCP Proxy] Health check failed:', error);
    return NextResponse.json(
      { status: 'unhealthy', backend: 'connection_failed' },
      { status: 503 }
    );
  }
}
