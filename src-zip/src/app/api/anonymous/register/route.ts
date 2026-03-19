/**
 * Anonymous User Registration API
 *
 * Registers anonymous users and tracks their sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { authRateLimiter } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/anonymous/register
 *
 * Register a new anonymous user session
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (prevent rapid session creation)
    const rateLimitError = await authRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const body = await request.json();
    const { sessionId, userAgent } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get IP address (hashed for privacy)
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';
    const hashedIp = crypto.createHash('sha256').update(ipAddress).digest('hex').slice(0, 16);

    // Check if session already exists
    const existingUser = await prisma.anonymousUser.findUnique({
      where: { sessionId },
    });

    if (existingUser) {
      // Update last seen
      await prisma.anonymousUser.update({
        where: { sessionId },
        data: { lastSeenAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        isNew: false,
        sessionId,
      });
    }

    // Create new anonymous user
    const anonymousUser = await prisma.anonymousUser.create({
      data: {
        sessionId,
        userAgent: userAgent?.slice(0, 500), // Limit length
        ipAddress: hashedIp,
      },
    });

    return NextResponse.json({
      success: true,
      isNew: true,
      sessionId: anonymousUser.sessionId,
    });
  } catch (error) {
    console.error('Anonymous registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/anonymous/register
 *
 * Get anonymous user stats
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitError = await authRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const anonymousUser = await prisma.anonymousUser.findUnique({
      where: { sessionId },
      select: {
        totalTurns: true,
        dailyTurns: true,
        firstSeenAt: true,
        lastSeenAt: true,
      },
    });

    if (!anonymousUser) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      stats: anonymousUser,
    });
  } catch (error) {
    console.error('Anonymous stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
