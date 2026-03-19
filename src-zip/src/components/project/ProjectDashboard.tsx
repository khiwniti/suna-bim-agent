'use client';

/**
 * Project Dashboard Component
 *
 * Displays a comprehensive view of a project with tabs for different sections.
 * Shows project stats, models, conversations, and settings (if user can edit).
 */

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Project, User, Tenant, Conversation } from '@prisma/client';

// ============================================
// Types
// ============================================

export interface ProjectDashboardProps {
  project: Project & {
    user: Pick<User, 'id' | 'email' | 'name'>;
    tenant: Tenant | null;
    conversations: Conversation[];
    _count: {
      bimModels: number;
      conversations: number;
    };
  };
  canEdit: boolean;
}

// ============================================
// Helper Components
// ============================================

function StatsCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card variant="outlined">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
    ACTIVE: 'success',
    DRAFT: 'secondary',
    COMPLETED: 'default',
    ARCHIVED: 'warning',
  };

  return (
    <Badge variant={variants[status] || 'default'}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

// ============================================
// Icons
// ============================================

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function CubeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m21.12 6.4-9-5.19a2 2 0 0 0-2 0l-9 5.19a2 2 0 0 0-1 1.73V16a2 2 0 0 0 1 1.73l9 5.19a2 2 0 0 0 2 0l9-5.19a2 2 0 0 0 1-1.73V8.13a2 2 0 0 0-1-1.73Z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

// ============================================
// Main Component
// ============================================

export function ProjectDashboard({ project, canEdit }: ProjectDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          {project.description && (
            <p className="text-muted-foreground max-w-2xl">{project.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Created {formatDate(project.createdAt)}</span>
            {project.location && (
              <>
                <span>•</span>
                <span>{project.location}</span>
              </>
            )}
            {project.tenant && (
              <>
                <span>•</span>
                <span>{project.tenant.name}</span>
              </>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <Link href={`/workspace/${project.slug || project.id}`}>
              <Button variant="outline" size="sm">
                Open Workspace
              </Button>
            </Link>
            <Button variant="primary" size="sm">
              <PlusIcon className="h-4 w-4" />
              New Conversation
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="BIM Models"
          value={project._count.bimModels}
          icon={<CubeIcon className="h-5 w-5" />}
        />
        <StatsCard
          title="Conversations"
          value={project._count.conversations}
          icon={<MessageIcon className="h-5 w-5" />}
        />
        <StatsCard
          title="Building Type"
          value={project.buildingType || 'Not specified'}
          icon={<BuildingIcon className="h-5 w-5" />}
        />
        <StatsCard
          title="Team"
          value={project.tenant ? 'Team Project' : 'Personal'}
          description={project.tenant?.name}
          icon={<UsersIcon className="h-5 w-5" />}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          {canEdit && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>
                Summary of your BIM project and recent activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Project Details</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Status</dt>
                      <dd><StatusBadge status={project.status} /></dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Building Type</dt>
                      <dd>{project.buildingType || '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Total Area</dt>
                      <dd>{project.totalArea ? `${project.totalArea.toLocaleString()} m²` : '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Floors</dt>
                      <dd>{project.floors || '—'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Ownership</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Owner</dt>
                      <dd>{canEdit ? (project.user.name || project.user.email) : 'Project Owner'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Organization</dt>
                      <dd>{project.tenant?.name || 'Personal'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Visibility</dt>
                      <dd>{project.isPublic ? 'Public' : 'Private'}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Recent Conversations */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Recent Conversations</h4>
                {project.conversations.length > 0 ? (
                  <div className="space-y-2">
                    {project.conversations.slice(0, 5).map((conversation) => (
                      <Link
                        key={conversation.id}
                        href={`/chat/${conversation.slug || conversation.id}`}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <div className="flex items-center gap-3">
                          <MessageIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{conversation.title || 'Untitled'}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(conversation.updatedAt)}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No conversations yet. Start a new conversation to begin analyzing your BIM models.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>BIM Models</CardTitle>
                  <CardDescription>
                    Manage your IFC and BIM model files
                  </CardDescription>
                </div>
                {canEdit && (
                  <Button variant="primary" size="sm">
                    <PlusIcon className="h-4 w-4" />
                    Upload Model
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {project._count.bimModels > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {project._count.bimModels} model(s) in this project.
                  View them in the workspace.
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CubeIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium">No models yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Upload your first IFC model to start analyzing your building data with AI.
                  </p>
                  {canEdit && (
                    <Button variant="outline" size="sm" className="mt-4">
                      <PlusIcon className="h-4 w-4" />
                      Upload Model
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Conversations</CardTitle>
                  <CardDescription>
                    AI-powered discussions about your BIM models
                  </CardDescription>
                </div>
                {canEdit && (
                  <Button variant="primary" size="sm">
                    <PlusIcon className="h-4 w-4" />
                    New Conversation
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {project.conversations.length > 0 ? (
                <div className="space-y-2">
                  {project.conversations.map((conversation) => (
                    <Link
                      key={conversation.id}
                      href={`/chat/${conversation.slug || conversation.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <div className="flex items-center gap-3">
                        <MessageIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{conversation.title || 'Untitled'}</p>
                          <p className="text-xs text-muted-foreground">
                            Updated {formatDate(conversation.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {new Date(conversation.updatedAt) > new Date(Date.now() - 86400000)
                          ? 'Recent'
                          : 'Older'}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium">No conversations yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Start a conversation with the AI to analyze your BIM models,
                    check carbon emissions, detect clashes, and more.
                  </p>
                  {canEdit && (
                    <Button variant="outline" size="sm" className="mt-4">
                      <PlusIcon className="h-4 w-4" />
                      Start Conversation
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canEdit && (
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Project Settings
                </CardTitle>
                <CardDescription>
                  Manage project configuration, sharing, and access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* General Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium">General</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Project Name</label>
                      <input
                        type="text"
                        defaultValue={project.name}
                        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        readOnly
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Slug</label>
                      <input
                        type="text"
                        defaultValue={project.slug || 'Not set'}
                        className="flex h-10 w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Sharing Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium">Sharing</h4>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Public Access</p>
                      <p className="text-sm text-muted-foreground">
                        Allow anyone with the link to view this project
                      </p>
                    </div>
                    <Badge variant={project.isPublic ? 'success' : 'secondary'}>
                      {project.isPublic ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="space-y-4">
                  <h4 className="font-medium text-destructive">Danger Zone</h4>
                  <div className="rounded-lg border border-destructive/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Archive Project</p>
                        <p className="text-sm text-muted-foreground">
                          Archive this project. It can be restored later.
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">
                        Archive
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
