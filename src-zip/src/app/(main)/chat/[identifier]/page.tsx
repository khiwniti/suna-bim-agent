/**
 * Chat Page (Dynamic Route)
 *
 * Dynamic route for viewing a specific chat by slug or ID.
 * Loads the workspace with the specific conversation context.
 *
 * Note: Currently, Conversation model has isPublic but not publicToken,
 * so token-based public sharing is only available at the Project level.
 * Chats can be marked as public, but access is determined by ownership
 * or project-level token sharing.
 */

import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { resolveChat } from '@/lib/routes/resolver';
import { checkAccess, canView } from '@/lib/routes/access';
import { getUser } from '@/lib/supabase/server';
import { WorkspaceLayout } from '@/components/workspace/WorkspaceLayout';
import { ReadOnlyWorkspace } from '@/components/workspace/ReadOnlyWorkspace';

interface ChatPageProps {
  params: Promise<{ identifier: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({
  params,
}: ChatPageProps): Promise<Metadata> {
  const { identifier } = await params;
  const resolved = await resolveChat(identifier);

  if (!resolved) {
    return {
      title: 'Chat Not Found',
    };
  }

  return {
    title: `${resolved.conversation.title || 'Chat'} | CarbonBIM`,
    description: 'BIM Agent Conversation',
  };
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { identifier } = await params;
  const { token } = await searchParams;

  // Resolve chat by slug or ID
  const resolved = await resolveChat(identifier);

  if (!resolved) {
    notFound();
  }

  // Get current user
  const user = await getUser();

  // Check access level - use conversation for access check
  // Pass the full conversation object which has userId and isPublic fields
  const accessLevel = await checkAccess(
    resolved.conversation as Parameters<typeof checkAccess>[0],
    user ? { id: user.id } : null,
    token
  );

  // No access - redirect to login
  if (!canView(accessLevel)) {
    redirect(`/auth/login?next=/chat/${identifier}`);
  }

  // Public read-only access
  if (accessLevel === 'public_read') {
    // If chat has a project, show ReadOnlyWorkspace
    if (resolved.conversation.project) {
      return (
        <ReadOnlyWorkspace
          project={resolved.conversation.project}
          conversations={[resolved.conversation]}
        />
      );
    }
    // Chat without project in public read mode - show minimal read-only view
    return (
      <div className="flex h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            {resolved.conversation.title || 'Chat'}
          </h1>
          <p className="text-muted-foreground">Read-only view</p>
          <p className="text-sm text-muted-foreground mt-4">
            Sign in to interact with this conversation
          </p>
        </div>
      </div>
    );
  }

  // Full access - render workspace layout
  // Known limitation: WorkspaceLayout does not yet accept initialConversationId. The conversation is loaded via URL params.
  return <WorkspaceLayout />;
}
