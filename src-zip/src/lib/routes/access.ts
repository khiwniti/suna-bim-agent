/**
 * Access Control Utilities
 *
 * Handles permission checking for workspace, chat, and project access.
 * Supports owner, tenant member, and public (with token) access levels.
 */

import { prisma } from '@/lib/db';
import { randomBytes, timingSafeEqual } from 'crypto';
import type { Project, Conversation } from '@prisma/client';

// ============================================
// Types
// ============================================

export type AccessLevel = 'owner' | 'member' | 'public_read' | 'none';

export interface UserContext {
  id: string;
}

export type ResourceWithAccess = (Project | Conversation) & {
  userId: string;
  tenantId?: string | null;
  isPublic?: boolean;
  publicToken?: string | null;
};

// ============================================
// Access Check Functions
// ============================================

/**
 * Check user's access level to a resource
 */
export async function checkAccess(
  resource: ResourceWithAccess,
  user: UserContext | null,
  token?: string
): Promise<AccessLevel> {
  // 1. Check if user is the owner
  if (user && resource.userId === user.id) {
    return 'owner';
  }

  // 2. Check if user is a tenant member
  if (user && resource.tenantId) {
    const membership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId: resource.tenantId,
          userId: user.id,
        },
      },
    });

    if (membership) {
      return 'member';
    }
  }

  // 3. Check public access with token (timing-safe comparison)
  if (resource.isPublic && resource.publicToken && token) {
    if (
      resource.publicToken.length === token.length &&
      timingSafeEqual(Buffer.from(resource.publicToken), Buffer.from(token))
    ) {
      return 'public_read';
    }
  }

  return 'none';
}

/**
 * Check if access level is read-only
 */
export function isReadOnly(accessLevel: AccessLevel): boolean {
  return accessLevel === 'public_read' || accessLevel === 'none';
}

/**
 * Check if user can view resource
 */
export function canView(accessLevel: AccessLevel): boolean {
  return accessLevel !== 'none';
}

/**
 * Check if user can edit resource
 */
export function canEdit(accessLevel: AccessLevel): boolean {
  return accessLevel === 'owner' || accessLevel === 'member';
}

/**
 * Check if user can chat (interact with AI)
 */
export function canChat(accessLevel: AccessLevel): boolean {
  return accessLevel === 'owner' || accessLevel === 'member';
}

/**
 * Check if user can delete resource
 */
export function canDelete(accessLevel: AccessLevel): boolean {
  return accessLevel === 'owner';
}

// ============================================
// Token Management
// ============================================

/**
 * Generate a secure public access token
 */
export function generatePublicToken(): string {
  return randomBytes(18).toString('base64url').slice(0, 24);
}

/**
 * Validate public token format
 */
export function validatePublicToken(token: string): boolean {
  if (!token || token.length !== 24) return false;
  return /^[a-zA-Z0-9_-]+$/.test(token);
}
