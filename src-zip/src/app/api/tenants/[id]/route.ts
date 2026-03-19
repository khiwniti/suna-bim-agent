/**
 * Single Tenant API Route
 *
 * Get, update, delete specific tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { standardRateLimiter, validateCSRFToken } from '@/lib/security';
import {
  getTenantById,
  updateTenant,
  deleteTenant,
  checkTenantAccess,
  updateTenantSchema,
} from '@/lib/tenant';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tenants/[id] - Get single tenant
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

    const tenant = await getTenantById(id);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Get tenant error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tenants/[id] - Update tenant
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

    // Check admin access
    const hasAccess = await checkTenantAccess(id, user.id, ['OWNER', 'ADMIN']);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = updateTenantSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const tenant = await updateTenant(id, result.data);

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Update tenant error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('slug already exists')) {
        return NextResponse.json(
          { error: 'A tenant with this slug already exists' },
          { status: 409 }
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
 * DELETE /api/tenants/[id] - Delete tenant
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

    // Only owners can delete tenants
    const hasAccess = await checkTenantAccess(id, user.id, ['OWNER']);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Owner access required' },
        { status: 403 }
      );
    }

    await deleteTenant(id);

    return NextResponse.json({ message: 'Tenant deleted' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
