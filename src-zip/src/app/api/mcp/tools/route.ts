/**
 * MCP Tools API Route - Proxies to BIM Agent Service
 *
 * This route proxies MCP tool requests to the backend service,
 * avoiding CORS issues and allowing server-side environment variables.
 */

import { NextRequest, NextResponse } from 'next/server';
import { standardRateLimiter } from '@/lib/security';

// Get the BIM service URL from server-side environment
const BIM_SERVICE_URL = process.env.BIM_AGENT_SERVICE_URL || 'http://localhost:8000';
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const response = await fetch(`${BIM_SERVICE_URL}/mcp/tools`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Key': SERVICE_API_KEY,
      },
      // Cache for 60 seconds to reduce backend load
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`[MCP Proxy] Backend returned ${response.status}`);
      return NextResponse.json(
        { error: `Backend returned ${response.status}`, tools: [] },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[MCP Proxy] Failed to fetch tools:', error);
    // Return empty tools array instead of failing completely
    return NextResponse.json(
      { error: 'Failed to connect to backend', tools: [] },
      { status: 503 }
    );
  }
}
