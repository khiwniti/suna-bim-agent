/**
 * Tenant Rate Limits API Route
 *
 * Manage custom rate limit overrides per tenant.
 * Allows admins to view/modify rate limits that override tier defaults.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/supabase/server';
import { standardRateLimiter, validateCSRFToken } from '@/lib/security';
import { prisma } from '@/lib/db';
import { checkTenantAccess } from '@/lib/tenant';
import {
  tierRateLimits,
  endpointMultipliers,
  formatRateLimit,
} from '@/lib/rate-limit/tiered';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================
// Validation Schemas
// ============================================

const updateRateLimitSchema = z.object({
  apiRateLimit: z
    .number()
    .int('Rate limit must be a whole number')
    .min(1, 'Rate limit must be at least 1')
    .max(10000, 'Rate limit cannot exceed 10000')
    .nullable()
    .optional(),
  endpointOverrides: z
    .record(
      z.string(),
      z.number().int().min(1).max(10000).nullable()
    )
    .optional(),
});

export type UpdateRateLimitInput = z.infer<typeof updateRateLimitSchema>;

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate effective endpoint limits based on base limit and multipliers
 */
function calculateEndpointLimits(baseLimit: number): Record<string, number | string> {
  const limits: Record<string, number | string> = {};

  for (const [endpoint, multiplier] of Object.entries(endpointMultipliers)) {
    if (baseLimit === -1) {
      limits[endpoint] = 'Unlimited';
    } else {
      limits[endpoint] = Math.floor(baseLimit * multiplier);
    }
  }

  return limits;
}

/**
 * Build rate limit response object
 */
function buildRateLimitResponse(
  tenant: {
    subscriptionTier: string;
    apiRateLimit: number | null;
  },
  usage?: { current: number; resetTime: number }
) {
  const tier = tenant.subscriptionTier as keyof typeof tierRateLimits;
  const tierDefault = tierRateLimits[tier] ?? 60;
  const effectiveLimit = tenant.apiRateLimit ?? tierDefault;

  const response: {
    tier: string;
    tierDefault: number;
    tierDefaultFormatted: string;
    customOverride: number | null;
    effectiveLimit: number;
    effectiveLimitFormatted: string;
    isUnlimited: boolean;
    endpointLimits: Record<string, number | string>;
    usage?: {
      current: number;
      remaining: number;
      resetTime: number;
      percentUsed: number;
    };
  } = {
    tier: tenant.subscriptionTier,
    tierDefault,
    tierDefaultFormatted: formatRateLimit(tierDefault),
    customOverride: tenant.apiRateLimit,
    effectiveLimit,
    effectiveLimitFormatted: formatRateLimit(effectiveLimit),
    isUnlimited: effectiveLimit === -1,
    endpointLimits: calculateEndpointLimits(effectiveLimit),
  };

  // Add usage data if available
  if (usage) {
    const remaining = effectiveLimit === -1
      ? Number.MAX_SAFE_INTEGER
      : Math.max(0, effectiveLimit - usage.current);
    const percentUsed = effectiveLimit === -1
      ? 0
      : Math.round((usage.current / effectiveLimit) * 100);

    response.usage = {
      current: usage.current,
      remaining,
      resetTime: usage.resetTime,
      percentUsed,
    };
  }

  return response;
}

// ============================================
// GET /api/tenants/[id]/rate-limits
// ============================================

/**
 * Get rate limit configuration for a tenant
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

    // Check admin/owner access
    const hasAccess = await checkTenantAccess(id, user.id, ['OWNER', 'ADMIN']);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionTier: true,
        apiRateLimit: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Build response (usage data would come from Redis in production)
    // For now, we return without real-time usage
    const rateLimits = buildRateLimitResponse(tenant);

    return NextResponse.json({
      rateLimits,
      availableEndpoints: Object.keys(endpointMultipliers),
      endpointMultipliers,
    });
  } catch (error) {
    console.error('Get rate limits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/tenants/[id]/rate-limits
// ============================================

/**
 * Update rate limit configuration for a tenant
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

    // Check admin/owner access
    const hasAccess = await checkTenantAccess(id, user.id, ['OWNER', 'ADMIN']);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id },
      select: { id: true, subscriptionTier: true, apiRateLimit: true },
    });

    if (!existingTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const result = updateRateLimitSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: { apiRateLimit?: number | null } = {};

    if (result.data.apiRateLimit !== undefined) {
      updateData.apiRateLimit = result.data.apiRateLimit;
    }

    // Return current state if no changes to apply
    if (Object.keys(updateData).length === 0) {
      const rateLimits = buildRateLimitResponse(existingTenant);
      return NextResponse.json({
        rateLimits,
        message: 'No changes to apply',
      });
    }

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionTier: true,
        apiRateLimit: true,
      },
    });

    // Build response
    const rateLimits = buildRateLimitResponse(updatedTenant);

    return NextResponse.json({
      rateLimits,
      message: 'Rate limits updated successfully',
    });
  } catch (error) {
    console.error('Update rate limits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/tenants/[id]/rate-limits
// ============================================

/**
 * Remove all custom rate limit overrides for a tenant
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

    // Check admin/owner access
    const hasAccess = await checkTenantAccess(id, user.id, ['OWNER', 'ADMIN']);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Remove custom rate limit
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: { apiRateLimit: null },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionTier: true,
        apiRateLimit: true,
      },
    });

    // Build response
    const rateLimits = buildRateLimitResponse(updatedTenant);

    return NextResponse.json({
      rateLimits,
      message: 'Custom rate limits removed',
    });
  } catch (error) {
    console.error('Delete rate limits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
