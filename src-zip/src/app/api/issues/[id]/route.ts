/**
 * BCF Issue API - Individual Issue Operations
 *
 * GET /api/issues/[id] - Get issue details
 * PATCH /api/issues/[id] - Update issue status
 * DELETE /api/issues/[id] - Delete an issue
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateBCFIssueStatus } from '@/lib/agent/tools';
import { prisma } from '@/lib/db';
import { standardRateLimiter, validateCSRFToken } from '@/lib/security';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const { id } = await params;

    const topic = await prisma.bcfTopic.findUnique({
      where: { id },
      include: {
        viewpoints: true,
        linkedElements: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      issue: {
        id: topic.id,
        guid: topic.guid,
        title: topic.title,
        description: topic.description,
        status: topic.topicStatus.toLowerCase(),
        topicType: topic.topicType.toLowerCase(),
        priority: topic.priority.toLowerCase(),
        assignedTo: topic.assignedTo,
        createdByAgent: topic.createdByAgent,
        index: topic.index,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
        viewpoints: topic.viewpoints,
        linkedElements: topic.linkedElements,
        comments: topic.comments,
      },
    });
  } catch (error) {
    console.error('Failed to get BCF issue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get issue' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // Validate CSRF token
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    const { id } = await params;
    const body = await request.json();
    const { status, comment } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await updateBCFIssueStatus(
      id,
      status as 'open' | 'in_progress' | 'resolved' | 'closed',
      comment
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update issue' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Issue status updated to ${status}`,
    });
  } catch (error) {
    console.error('Failed to update BCF issue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update issue' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // Validate CSRF token
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    const { id } = await params;

    await prisma.bcfTopic.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Issue deleted',
    });
  } catch (error) {
    console.error('Failed to delete BCF issue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete issue' },
      { status: 500 }
    );
  }
}
