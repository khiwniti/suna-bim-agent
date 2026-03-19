/**
 * BCF Issues API
 *
 * GET /api/issues - List issues for a project
 * POST /api/issues - Create a new BCF issue
 */

import { NextRequest, NextResponse } from 'next/server';
import { createBCFIssue, getBCFIssues } from '@/lib/agent/tools';
import { getUser } from '@/lib/supabase/server';
import { standardRateLimiter, validateCSRFToken } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // Require authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const filters = {
      status: searchParams.get('status') || undefined,
      topicType: searchParams.get('topicType') || undefined,
      priority: searchParams.get('priority') || undefined,
    };

    const issues = await getBCFIssues(projectId, filters);

    return NextResponse.json({
      success: true,
      issues,
      count: issues.length,
    });
  } catch (error) {
    console.error('Failed to get BCF issues:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get issues' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Require authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      modelId,
      title,
      description,
      topicType = 'issue',
      priority = 'medium',
      assignedTo,
      linkedElementIds,
      viewpoint,
    } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    const result = await createBCFIssue({
      projectId,
      modelId,
      title,
      description: description || '',
      topicType,
      priority,
      assignedTo,
      linkedElementIds,
      viewpoint,
      // createdBy is undefined for user-created issues
    });

    return NextResponse.json({
      success: true,
      issue: result,
    });
  } catch (error) {
    console.error('Failed to create BCF issue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create issue' },
      { status: 500 }
    );
  }
}
