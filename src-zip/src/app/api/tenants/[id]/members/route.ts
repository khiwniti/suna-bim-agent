/**
 * Tenant Members API Route
 *
 * Manage tenant membership - list, invite, update role, remove members
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { standardRateLimiter, validateCSRFToken } from '@/lib/security';
import {
  getTenantMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  checkTenantAccess,
  inviteMemberSchema,
  updateMemberSchema,
} from '@/lib/tenant';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tenants/[id]/members - List tenant members
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check access
    const hasAccess = await checkTenantAccess(id, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const members = await getTenantMembers(id);

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tenants/[id]/members - Invite new member
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and owners can invite members
    const hasAccess = await checkTenantAccess(id, user.id, ['OWNER', 'ADMIN']);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = inviteMemberSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const membership = await inviteMember(id, result.data.email, result.data.role);

    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    console.error('Invite member error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('already a member')) {
        return NextResponse.json(
          { error: 'User is already a member of this tenant' },
          { status: 409 }
        );
      }
      if (error.message.includes('Maximum number of users')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      if (error.message.includes('Tenant not found')) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tenants/[id]/members - Update member role
 * Body: { userId: string, role: TenantRole }
 */
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
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and owners can update roles
    const hasAccess = await checkTenantAccess(id, user.id, ['OWNER', 'ADMIN']);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, ...roleData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const result = updateMemberSchema.safeParse(roleData);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const membership = await updateMemberRole(id, userId, result.data.role);

    return NextResponse.json({ membership });
  } catch (error) {
    console.error('Update member role error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Cannot demote the last owner')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tenants/[id]/members - Remove member
 * Query param: userId
 */
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
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the userId from query params
    const { searchParams } = new URL(request.url);
    const userIdToRemove = searchParams.get('userId');

    if (!userIdToRemove) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    // Users can remove themselves, or admins/owners can remove others
    const isSelf = user.id === userIdToRemove;
    if (!isSelf) {
      const hasAccess = await checkTenantAccess(id, user.id, ['OWNER', 'ADMIN']);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Admin access required to remove other members' },
          { status: 403 }
        );
      }
    }

    await removeMember(id, userIdToRemove);

    return NextResponse.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Cannot remove the last owner')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
