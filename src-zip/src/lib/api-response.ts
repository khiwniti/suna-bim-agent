/**
 * API Response Helpers
 *
 * Standardized API response utilities
 */

import { NextResponse } from 'next/server';
import { createErrorResponse } from './errors';

// ============================================
// Success Response Types
// ============================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// ============================================
// Response Helpers
// ============================================

export function success<T>(
  data: T,
  meta?: ApiSuccessResponse<T>['meta'],
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

export function created<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return success(data, undefined, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function error(err: unknown): NextResponse {
  const { body, status } = createErrorResponse(err);
  return NextResponse.json(body, { status });
}

// ============================================
// Paginated Response Helper
// ============================================

export function paginated<T>(
  data: T[],
  options: {
    page: number;
    limit: number;
    total: number;
  }
): NextResponse<ApiSuccessResponse<T[]>> {
  const { page, limit, total } = options;
  const hasMore = page * limit < total;

  return success(data, {
    page,
    limit,
    total,
    hasMore,
  });
}

// ============================================
// Stream Response Helper
// ============================================

export function stream(
  readable: ReadableStream,
  headers?: Record<string, string>
): Response {
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      ...headers,
    },
  });
}

// ============================================
// CORS Headers
// ============================================

export function withCors(
  response: NextResponse,
  origin?: string
): NextResponse {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean);

  const requestOrigin = origin || '*';
  const isAllowed = allowedOrigins.includes(requestOrigin) || requestOrigin === '*';

  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', requestOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
}

// ============================================
// Security Headers
// ============================================

export function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

// ============================================
// Request Helpers
// ============================================

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch {
    throw new Error('Invalid JSON body');
  }
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}
