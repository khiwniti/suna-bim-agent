/**
 * Tenant Management Utilities
 *
 * Core utilities for multi-tenant operations including CRUD,
 * membership management, and tier-based limits.
 */

import { prisma } from '@/lib/db';
import { SubscriptionTier, TenantRole, Prisma } from '@prisma/client';
import { z } from 'zod';

// ============================================
// Validation Schemas
// ============================================

export const createTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  domain: z.string().url('Invalid URL format').optional(),
  subscriptionTier: z.nativeEnum(SubscriptionTier).optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  domain: z.string().url().nullish(),
  logoUrl: z.string().url().nullish(),
  settings: z.record(z.unknown()).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(TenantRole).default('MEMBER'),
});

export const updateMemberSchema = z.object({
  role: z.nativeEnum(TenantRole),
});

// ============================================
// Tier Limits Configuration
// ============================================

export interface TierLimits {
  maxUsers: number;
  maxProjects: number;
  maxStorageGb: number;
  apiRateLimit: number;
  features: string[];
}

export const tierLimits: Record<SubscriptionTier, TierLimits> = {
  STARTER: {
    maxUsers: 3,
    maxProjects: 5,
    maxStorageGb: 5,
    apiRateLimit: 60,
    features: ['basic_analysis', 'carbon_calculator'],
  },
  PROFESSIONAL: {
    maxUsers: 25,
    maxProjects: 50,
    maxStorageGb: 100,
    apiRateLimit: 300,
    features: [
      'basic_analysis',
      'carbon_calculator',
      'ai_agents',
      'reports',
      'certifications',
    ],
  },
  ENTERPRISE: {
    maxUsers: -1, // Unlimited
    maxProjects: -1,
    maxStorageGb: -1,
    apiRateLimit: 1000,
    features: ['all'],
  },
  UNLIMITED: {
    maxUsers: -1,
    maxProjects: -1,
    maxStorageGb: -1,
    apiRateLimit: -1, // No limit
    features: ['all'],
  },
};

// ============================================
// Tenant CRUD Operations
// ============================================

/**
 * Create a new tenant with the requesting user as owner
 */
export async function createTenant(
  data: z.infer<typeof createTenantSchema>,
  ownerId: string
) {
  // Check if slug already exists
  const existing = await prisma.tenant.findUnique({
    where: { slug: data.slug },
  });

  if (existing) {
    throw new Error('A tenant with this slug already exists');
  }

  return prisma.tenant.create({
    data: {
      name: data.name,
      slug: data.slug,
      domain: data.domain,
      subscriptionTier: data.subscriptionTier ?? 'STARTER',
      memberships: {
        create: {
          userId: ownerId,
          role: 'OWNER',
        },
      },
    },
    include: {
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get all tenants for a user
 */
export async function getUserTenants(userId: string) {
  return prisma.tenant.findMany({
    where: {
      memberships: {
        some: { userId },
      },
    },
    include: {
      memberships: {
        where: { userId },
        select: {
          role: true,
          joinedAt: true,
        },
      },
      _count: {
        select: {
          projects: true,
          memberships: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get a single tenant by ID with full details
 */
export async function getTenantById(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    include: {
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          joinedAt: 'asc',
        },
      },
      _count: {
        select: {
          projects: true,
        },
      },
    },
  });
}

/**
 * Get a tenant by slug
 */
export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
    include: {
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          projects: true,
          memberships: true,
        },
      },
    },
  });
}

/**
 * Update a tenant
 */
export async function updateTenant(
  id: string,
  data: z.infer<typeof updateTenantSchema>
) {
  // If updating slug, check for uniqueness
  if (data.slug) {
    const existing = await prisma.tenant.findFirst({
      where: {
        slug: data.slug,
        id: { not: id },
      },
    });

    if (existing) {
      throw new Error('A tenant with this slug already exists');
    }
  }

  // Build update data object
  const updateData: Prisma.TenantUpdateInput = {};

  if (data.name) updateData.name = data.name;
  if (data.slug) updateData.slug = data.slug;
  if (data.domain !== undefined) updateData.domain = data.domain;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
  if (data.settings) updateData.settings = data.settings as Prisma.InputJsonValue;

  return prisma.tenant.update({
    where: { id },
    data: updateData,
    include: {
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          projects: true,
        },
      },
    },
  });
}

/**
 * Delete a tenant (cascades to memberships, projects, etc.)
 */
export async function deleteTenant(id: string) {
  return prisma.tenant.delete({
    where: { id },
  });
}

// ============================================
// Access Control
// ============================================

/**
 * Check if a user has access to a tenant
 */
export async function checkTenantAccess(
  tenantId: string,
  userId: string,
  requiredRoles?: TenantRole[]
): Promise<boolean> {
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
  });

  if (!membership) {
    return false;
  }

  if (requiredRoles && !requiredRoles.includes(membership.role)) {
    return false;
  }

  return true;
}

/**
 * Get user's role in a tenant
 */
export async function getUserTenantRole(
  tenantId: string,
  userId: string
): Promise<TenantRole | null> {
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
  });

  return membership?.role ?? null;
}

// ============================================
// Membership Operations
// ============================================

/**
 * Get all members of a tenant
 */
export async function getTenantMembers(tenantId: string) {
  return prisma.tenantMembership.findMany({
    where: { tenantId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'asc',
    },
  });
}

/**
 * Invite a member to a tenant (creates user if needed)
 */
export async function inviteMember(
  tenantId: string,
  email: string,
  role: TenantRole
) {
  // Check tier limits
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      _count: {
        select: { memberships: true },
      },
    },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const limits = tierLimits[tenant.subscriptionTier];
  const maxUsers = tenant.maxUsers ?? limits.maxUsers;

  if (maxUsers !== -1 && tenant._count.memberships >= maxUsers) {
    throw new Error(
      `Maximum number of users (${maxUsers}) reached for this subscription tier`
    );
  }

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { email },
    });
  }

  // Check if already a member
  const existingMembership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId: user.id,
      },
    },
  });

  if (existingMembership) {
    throw new Error('User is already a member of this tenant');
  }

  return prisma.tenantMembership.create({
    data: {
      tenantId,
      userId: user.id,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  tenantId: string,
  userId: string,
  newRole: TenantRole
) {
  // Prevent demoting the last owner
  if (newRole !== 'OWNER') {
    const ownerCount = await prisma.tenantMembership.count({
      where: {
        tenantId,
        role: 'OWNER',
      },
    });

    const currentMembership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: { tenantId, userId },
      },
    });

    if (currentMembership?.role === 'OWNER' && ownerCount <= 1) {
      throw new Error('Cannot demote the last owner');
    }
  }

  return prisma.tenantMembership.update({
    where: {
      tenantId_userId: { tenantId, userId },
    },
    data: { role: newRole },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });
}

/**
 * Remove a member from a tenant
 */
export async function removeMember(tenantId: string, userId: string) {
  // Prevent removing the last owner
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: { tenantId, userId },
    },
  });

  if (membership?.role === 'OWNER') {
    const ownerCount = await prisma.tenantMembership.count({
      where: {
        tenantId,
        role: 'OWNER',
      },
    });

    if (ownerCount <= 1) {
      throw new Error('Cannot remove the last owner');
    }
  }

  return prisma.tenantMembership.delete({
    where: {
      tenantId_userId: { tenantId, userId },
    },
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get tenant limits (accounting for custom overrides)
 */
export function getTenantLimits(
  tenant: {
    subscriptionTier: SubscriptionTier;
    maxUsers?: number | null;
    maxProjects?: number | null;
    maxStorageGb?: number | null;
    apiRateLimit?: number | null;
  }
): TierLimits {
  const baseLimits = tierLimits[tenant.subscriptionTier];

  return {
    maxUsers: tenant.maxUsers ?? baseLimits.maxUsers,
    maxProjects: tenant.maxProjects ?? baseLimits.maxProjects,
    maxStorageGb: tenant.maxStorageGb ?? baseLimits.maxStorageGb,
    apiRateLimit: tenant.apiRateLimit ?? baseLimits.apiRateLimit,
    features: baseLimits.features,
  };
}

/**
 * Check if a tenant has access to a specific feature
 */
export function hasFeature(
  tenant: { subscriptionTier: SubscriptionTier },
  feature: string
): boolean {
  const limits = tierLimits[tenant.subscriptionTier];

  if (limits.features.includes('all')) {
    return true;
  }

  return limits.features.includes(feature);
}
