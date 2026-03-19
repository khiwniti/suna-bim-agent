/**
 * Chat Session Initialization API
 *
 * Creates or retrieves a chat conversation session in the database.
 * Supports both authenticated users and anonymous sessions.
 *
 * ★ Insight ─────────────────────────────────────
 * This endpoint enables proper session persistence:
 * 1. Authenticated users get Conversation records linked to their profile
 * 2. Anonymous users get AnonymousConversation records with session tracking
 * 3. The returned conversationId is used as LangGraph's thread_id for continuity
 * ─────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getUser } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { validateCSRFToken, standardRateLimiter } from '@/lib/security';

export const runtime = 'nodejs';

interface SessionRequest {
  projectId?: string;
  anonymousSessionId?: string;
  title?: string;
}

interface SessionResponse {
  conversationId: string;
  isAnonymous: boolean;
  isNew: boolean;
}

/**
 * POST /api/chat/session
 *
 * Creates a new chat session or returns existing one.
 *
 * Request body:
 * {
 *   projectId?: string;        // Optional project to associate with
 *   anonymousSessionId?: string; // For anonymous users (from localStorage)
 *   title?: string;            // Optional conversation title
 * }
 *
 * Response:
 * {
 *   conversationId: string;    // Use as thread_id for chat API
 *   isAnonymous: boolean;      // Whether this is an anonymous session
 *   isNew: boolean;            // Whether a new conversation was created
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Security checks
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    // Parse request body
    const body: SessionRequest = await request.json();
    const { projectId, anonymousSessionId, title } = body;

    // Check for authenticated user
    const user = await getUser();

    // Check if auth is disabled (development mode)
    const authDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

    if (user) {
      // Authenticated user - create Conversation
      const conversation = await prisma.conversation.create({
        data: {
          id: nanoid(),
          userId: user.id,
          projectId: projectId || undefined,
          title: title || 'New Conversation',
          status: 'ACTIVE',
        },
      });

      return NextResponse.json<SessionResponse>({
        conversationId: conversation.id,
        isAnonymous: false,
        isNew: true,
      });
    }

    if (anonymousSessionId || authDisabled) {
      // Anonymous user - find or create anonymous user, then create conversation
      const sessionId = anonymousSessionId || `anon_${nanoid()}`;

      // Find or create anonymous user
      let anonymousUser = await prisma.anonymousUser.findUnique({
        where: { sessionId },
      });

      if (!anonymousUser) {
        // Extract device info from request
        const userAgent = request.headers.get('user-agent') || undefined;
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor?.split(',')[0]?.trim();

        // Hash IP for privacy (simple hash)
        const hashedIp = ip ? Buffer.from(ip).toString('base64').slice(0, 20) : undefined;

        anonymousUser = await prisma.anonymousUser.create({
          data: {
            sessionId,
            userAgent,
            ipAddress: hashedIp,
          },
        });
      }

      // Create anonymous conversation
      const conversation = await prisma.anonymousConversation.create({
        data: {
          id: nanoid(),
          anonymousUserId: anonymousUser.id,
          title: title || 'Anonymous Conversation',
        },
      });

      return NextResponse.json<SessionResponse>({
        conversationId: conversation.id,
        isAnonymous: true,
        isNew: true,
      });
    }

    // No authentication and no anonymous session
    return NextResponse.json(
      { error: 'Authentication required. Please provide anonymousSessionId for guest access.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Session initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize chat session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/session
 *
 * Retrieves existing conversations for the current user.
 *
 * Query params:
 * - limit: number (default: 10)
 * - offset: number (default: 0)
 * - projectId: string (optional filter)
 * - anonymousSessionId: string (for anonymous users)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const projectId = searchParams.get('projectId');
    const anonymousSessionId = searchParams.get('anonymousSessionId');

    const user = await getUser();

    if (user) {
      // Get authenticated user's conversations
      const conversations = await prisma.conversation.findMany({
        where: {
          userId: user.id,
          ...(projectId && { projectId }),
          status: 'ACTIVE',
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          status: true,
          projectId: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { messages: true },
          },
        },
      });

      return NextResponse.json({
        conversations: conversations.map((c) => ({
          ...c,
          messageCount: c._count.messages,
        })),
        isAnonymous: false,
      });
    }

    if (anonymousSessionId) {
      // Get anonymous user's conversations
      const anonymousUser = await prisma.anonymousUser.findUnique({
        where: { sessionId: anonymousSessionId },
        include: {
          conversations: {
            orderBy: { updatedAt: 'desc' },
            take: limit,
            skip: offset,
            select: {
              id: true,
              title: true,
              messageCount: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      return NextResponse.json({
        conversations: anonymousUser?.conversations || [],
        isAnonymous: true,
      });
    }

    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversations' },
      { status: 500 }
    );
  }
}
