/**
 * Read-Only Workspace Component
 *
 * Displays workspace content for public viewers with read-only access.
 * Shows chat history, panels, but disables interactive features.
 */

'use client';

import { useState } from 'react';
import { Lock, LogIn, Eye, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Project, Conversation } from '@prisma/client';

interface ReadOnlyWorkspaceProps {
  project: Project;
  conversations: Conversation[];
}

export function ReadOnlyWorkspace({
  project,
  conversations,
}: ReadOnlyWorkspaceProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(conversations[0]?.id ?? null);

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Read-only banner */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" aria-hidden="true" />
          <span>Viewing in read-only mode</span>
        </div>
        <Link href="/auth/login">
          <Button variant="outline" size="sm" className="gap-2">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Sign in to interact
          </Button>
        </Link>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Conversation list */}
        <div className="w-64 border-r bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold truncate">{project.name}</h2>
            <p className="text-sm text-muted-foreground truncate">
              {project.description || 'No description'}
            </p>
          </div>

          <div className="flex-1 overflow-auto p-2">
            <h3 className="text-xs font-medium text-muted-foreground px-2 py-1">
              Chat History
            </h3>
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-4">
                No conversations yet
              </p>
            ) : (
              <div className="space-y-1" role="listbox" aria-label="Conversations">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    role="option"
                    aria-selected={selectedConversationId === conversation.id}
                    aria-current={selectedConversationId === conversation.id ? 'true' : undefined}
                    className={cn(
                      'w-full text-left px-2 py-2 rounded-md text-sm transition-colors flex items-center gap-2',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      selectedConversationId === conversation.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {conversation.title || 'Untitled Chat'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Chat history (read-only) */}
          <div className="flex-1 overflow-auto p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  {selectedConversation?.title || 'Chat History'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sign in to view and participate in conversations.
                </p>
                {selectedConversation && (
                  <p className="text-sm text-muted-foreground mt-2">
                    This conversation was last updated on{' '}
                    {new Date(selectedConversation.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Disabled chat input */}
          <div className="border-t p-4 bg-muted/50">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg border border-dashed">
              <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">
                Sign in to send messages and interact with the AI
              </span>
            </div>
          </div>
        </div>

        {/* Right panel area - read-only view */}
        <div className="w-80 border-l bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-medium text-sm">Workspace Panels</h3>
            <p className="text-xs text-muted-foreground mt-1">
              View-only mode
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <Lock className="h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
            <p className="text-sm font-medium">Panel Access Limited</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Sign in to access 3D viewer, carbon dashboard, BOQ, and other panels
            </p>
            <Link href="/auth/login" className="mt-4">
              <Button variant="outline" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReadOnlyWorkspace;
