/**
 * Anonymous Usage Tracking API
 *
 * Records chat turns and actions for anonymous users
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { standardRateLimiter } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/anonymous/usage
 *
 * Record a usage event for an anonymous user
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const body = await request.json();
    const {
      sessionId,
      action,
      messagePreview,
      tokensUsed,
      responseTime,
      wasSuccessful = true,
      errorType,
      conversationId,
    } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Find or create anonymous user
    let anonymousUser = await prisma.anonymousUser.findUnique({
      where: { sessionId },
    });

    if (!anonymousUser) {
      // Auto-create if not exists
      anonymousUser = await prisma.anonymousUser.create({
        data: { sessionId },
      });
    }

    // Check if it's a new day for daily turn reset
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastTurnDate = anonymousUser.lastTurnDate;
    const isNewDay = !lastTurnDate || new Date(lastTurnDate) < today;

    // Calculate turn number
    const nextTurnNumber = anonymousUser.totalTurns + 1;
    const newDailyTurns = isNewDay ? 1 : anonymousUser.dailyTurns + 1;

    // Update user stats and create usage log in transaction
    const [updatedUser, usageLog] = await prisma.$transaction([
      prisma.anonymousUser.update({
        where: { id: anonymousUser.id },
        data: {
          totalTurns: nextTurnNumber,
          dailyTurns: newDailyTurns,
          lastTurnDate: new Date(),
          lastSeenAt: new Date(),
        },
      }),
      prisma.anonymousUsage.create({
        data: {
          anonymousUserId: anonymousUser.id,
          action,
          turnNumber: nextTurnNumber,
          messagePreview: messagePreview?.slice(0, 200),
          tokensUsed,
          responseTime,
          wasSuccessful,
          errorType,
          conversationId,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      turnNumber: nextTurnNumber,
      totalTurns: updatedUser.totalTurns,
      dailyTurns: updatedUser.dailyTurns,
      usageId: usageLog.id,
    });
  } catch (error) {
    console.error('Usage tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/anonymous/usage
 *
 * Get usage history for an anonymous user
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const anonymousUser = await prisma.anonymousUser.findUnique({
      where: { sessionId },
      include: {
        usageLogs: {
          orderBy: { createdAt: 'desc' },
          take: Math.min(limit, 100),
        },
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
      totalTurns: anonymousUser.totalTurns,
      dailyTurns: anonymousUser.dailyTurns,
      usage: anonymousUser.usageLogs,
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
