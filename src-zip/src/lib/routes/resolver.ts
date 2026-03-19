/**
 * Smart Identifier Resolution
 *
 * Resolves workspace, chat, and project identifiers that can be either
 * slugs or CUIDs. Supports smart detection and efficient database queries.
 */

import { prisma } from '@/lib/db';
import { isCuid } from './slugify';
import type { Project, Conversation, User, Tenant } from '@prisma/client';

// ============================================
// Types
// ============================================

export type IdentifierType = 'cuid' | 'slug';

/** How the resolution was performed */
export type ResolvedByType = 'id' | 'slug';

export interface ResolvedWorkspace {
  project: Project & {
    user: Pick<User, 'id' | 'email' | 'name'>;
    tenant: Tenant | null;
    conversations: Conversation[];
  };
  resolvedBy: ResolvedByType;
}

export interface ResolvedChat {
  conversation: Conversation & {
    user: Pick<User, 'id' | 'email' | 'name'>;
    project: Project | null;
  };
  resolvedBy: ResolvedByType;
}

export interface ResolvedProject {
  project: Project & {
    user: Pick<User, 'id' | 'email' | 'name'>;
    tenant: Tenant | null;
    conversations: Conversation[];
    _count: {
      bimModels: number;
      conversations: number;
    };
  };
  resolvedBy: ResolvedByType;
}

// ============================================
// Resolution Functions
// ============================================

/**
 * Determine if identifier is a CUID or slug
 */
export function resolveIdentifierType(identifier: string): IdentifierType {
  return isCuid(identifier) ? 'cuid' : 'slug';
}

/**
 * Resolve a workspace (project) by identifier (slug or ID)
 */
export async function resolveWorkspace(
  identifier: string
): Promise<ResolvedWorkspace | null> {
  const identifierType = resolveIdentifierType(identifier);

  const includeOptions = {
    user: {
      select: {
        id: true,
        email: true,
        name: true,
      },
    },
    tenant: true,
    conversations: {
      orderBy: { updatedAt: 'desc' as const },
      take: 10,
    },
  };

  if (identifierType === 'cuid') {
    const project = await prisma.project.findUnique({
      where: { id: identifier },
      include: includeOptions,
    });

    if (!project) return null;

    return {
      project,
      resolvedBy: 'id',
    };
  }

  // Resolve by slug
  const project = await prisma.project.findFirst({
    where: { slug: identifier },
    include: includeOptions,
  });

  if (!project) return null;

  return {
    project,
    resolvedBy: 'slug',
  };
}

/**
 * Resolve a chat (conversation) by identifier (slug or ID)
 */
export async function resolveChat(
  identifier: string
): Promise<ResolvedChat | null> {
  const identifierType = resolveIdentifierType(identifier);

  const includeOptions = {
    user: {
      select: {
        id: true,
        email: true,
        name: true,
      },
    },
    project: true,
  };

  if (identifierType === 'cuid') {
    const conversation = await prisma.conversation.findUnique({
      where: { id: identifier },
      include: includeOptions,
    });

    if (!conversation) return null;

    return {
      conversation,
      resolvedBy: 'id',
    };
  }

  // Resolve by slug
  const conversation = await prisma.conversation.findFirst({
    where: { slug: identifier },
    include: includeOptions,
  });

  if (!conversation) return null;

  return {
    conversation,
    resolvedBy: 'slug',
  };
}

/**
 * Resolve a project by identifier (slug or ID)
 */
export async function resolveProject(
  identifier: string
): Promise<ResolvedProject | null> {
  const identifierType = resolveIdentifierType(identifier);

  const includeOptions = {
    user: {
      select: {
        id: true,
        email: true,
        name: true,
      },
    },
    tenant: true,
    conversations: {
      orderBy: { updatedAt: 'desc' as const },
      take: 5,
    },
    _count: {
      select: {
        bimModels: true,
        conversations: true,
      },
    },
  };

  if (identifierType === 'cuid') {
    const project = await prisma.project.findUnique({
      where: { id: identifier },
      include: includeOptions,
    });

    if (!project) return null;

    return {
      project,
      resolvedBy: 'id',
    };
  }

  // Resolve by slug
  const project = await prisma.project.findFirst({
    where: { slug: identifier },
    include: includeOptions,
  });

  if (!project) return null;

  return {
    project,
    resolvedBy: 'slug',
  };
}
