/**
 * Tenants API Route
 *
 * CRUD operations for multi-tenant management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { standardRateLimiter, validateCSRFToken } from '@/lib/security';
import {
  createTenant,
  createTenantSchema,
  getUserTenants,
} from '@/lib/tenant';

/**
 * GET /api/tenants - List all tenants for current user
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenants = await getUserTenants(user.id);

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('Get tenants error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tenants - Create new tenant
 */
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

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createTenantSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const tenant = await createTenant(result.data, user.id);

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    console.error('Create tenant error:', error);

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
