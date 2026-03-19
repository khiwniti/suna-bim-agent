/**
 * Project Dashboard Page
 *
 * Dynamic route for viewing a project dashboard by slug or ID.
 * Shows project overview, stats, models, conversations, and settings.
 */

import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { resolveProject } from '@/lib/routes/resolver';
import { checkAccess, canView, canEdit } from '@/lib/routes/access';
import { getUser } from '@/lib/supabase/server';
import { ProjectDashboard } from '@/components/project/ProjectDashboard';

interface ProjectPageProps {
  params: Promise<{ identifier: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { identifier } = await params;
  const resolved = await resolveProject(identifier);

  if (!resolved) {
    return {
      title: 'Project Not Found',
    };
  }

  return {
    title: `${resolved.project.name} | Project Dashboard`,
    description: resolved.project.description || 'BIM Project Dashboard',
    openGraph: {
      title: resolved.project.name,
      description: resolved.project.description || 'BIM Project Dashboard',
      type: 'website',
    },
  };
}

export default async function ProjectPage({
  params,
  searchParams,
}: ProjectPageProps) {
  const { identifier } = await params;
  const { token } = await searchParams;

  // Resolve project by slug or ID
  const resolved = await resolveProject(identifier);

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
    redirect(`/auth/login?next=/project/${identifier}`);
  }

  // Determine if user can edit
  const userCanEdit = canEdit(accessLevel);

  // Render project dashboard
  return (
    <ProjectDashboard
      project={resolved.project}
      canEdit={userCanEdit}
    />
  );
}
