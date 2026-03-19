/**
 * Workspace Page
 *
 * Dynamic route for viewing a workspace by slug or ID.
 * Supports authenticated full access and public read-only access with token.
 */

import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { resolveWorkspace } from '@/lib/routes/resolver';
import { checkAccess, canView } from '@/lib/routes/access';
import { getUser } from '@/lib/supabase/server';
import { WorkspaceLayout } from '@/components/workspace/WorkspaceLayout';
import { ReadOnlyWorkspace } from '@/components/workspace/ReadOnlyWorkspace';

interface WorkspacePageProps {
  params: Promise<{ identifier: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({
  params,
}: WorkspacePageProps): Promise<Metadata> {
  const { identifier } = await params;
  const resolved = await resolveWorkspace(identifier);

  if (!resolved) {
    return {
      title: 'Workspace Not Found',
    };
  }

  return {
    title: `${resolved.project.name} | Workspace`,
    description: resolved.project.description || 'BIM Workspace',
  };
}

export default async function WorkspacePage({
  params,
  searchParams,
}: WorkspacePageProps) {
  const { identifier } = await params;
  const { token } = await searchParams;

  // Resolve workspace by slug or ID
  const resolved = await resolveWorkspace(identifier);

  if (!resolved) {
    notFound();
  }

  // Get current user (may be null for public access)
  const user = await getUser();

  // Check access level
  const accessLevel = await checkAccess(
    resolved.project as Parameters<typeof checkAccess>[0],
    user ? { id: user.id } : null,
    token
  );

  // No access - redirect to login
  if (!canView(accessLevel)) {
    redirect(`/auth/login?next=/workspace/${identifier}`);
  }

  // Public read-only access - show ReadOnlyWorkspace
  if (accessLevel === 'public_read') {
    return (
      <ReadOnlyWorkspace
        project={resolved.project}
        conversations={resolved.project.conversations}
      />
    );
  }

  // Full access - render workspace layout
  return <WorkspaceLayout />;
}
