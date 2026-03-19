/**
 * MCP Tool Call API Route - Proxies tool calls to BIM Agent Service
 *
 * Security:
 * - Authentication required (getUser)
 * - Expensive rate limiting (10 requests/5min)
 * - CSRF token validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { expensiveRateLimiter, validateCSRFToken } from '@/lib/security';
import { getUser } from '@/lib/supabase/server';

const BIM_SERVICE_URL = process.env.BIM_AGENT_SERVICE_URL || 'http://localhost:8000';
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (tool calls are expensive)
    const rateLimitError = await expensiveRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // Validate CSRF token
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    // Authentication - only authenticated users can execute MCP tools
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${BIM_SERVICE_URL}/mcp/tools/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Key': SERVICE_API_KEY,
        'X-Session-ID': request.headers.get('x-session-id') || '',
        'X-Request-ID': request.headers.get('x-request-id') || '',
        'X-User-ID': user.id, // Pass authenticated user ID to backend
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      return NextResponse.json(
        { success: false, error: errorData.message || `Backend returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[MCP Proxy] Tool call failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to backend' },
      { status: 503 }
    );
  }
}
