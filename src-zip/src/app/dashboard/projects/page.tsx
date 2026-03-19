'use client';

/**
 * Projects List Page
 *
 * Display and manage all user projects
 */

import { useState } from 'react';
import Link from 'next/link';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/Loading';
import { useTranslation } from '@/i18n/provider';

type FilterStatus = 'all' | 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
type StatusKey = 'all' | 'active' | 'draft' | 'completed' | 'archived';

const STATUS_FILTERS: { value: FilterStatus; key: StatusKey }[] = [
  { value: 'all', key: 'all' },
  { value: 'ACTIVE', key: 'active' },
  { value: 'DRAFT', key: 'draft' },
  { value: 'COMPLETED', key: 'completed' },
  { value: 'ARCHIVED', key: 'archived' },
];

export default function ProjectsPage() {
  const { projects, isLoading: loading, deleteProject } = useProjects();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects?.filter((project) => {
    const matchesFilter = filter === 'all' || project.status === filter;
    const matchesSearch =
      !searchQuery ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`${t('projects.deleteConfirm')} "${name}"?`)) {
      await deleteProject(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('projects.title')}</h1>
          <p className="mt-1 text-muted-foreground">
            {t('projects.subtitle')}
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button className="bg-primary hover:bg-primary/90">
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('dashboard.newProject')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t('projects.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-input bg-muted py-2 pl-10 pr-4 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status.value}
              onClick={() => setFilter(status.value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                filter === status.value
                  ? 'bg-primary text-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted'
              }`}
            >
              {t(`projects.status.${status.key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredProjects?.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-foreground">
              {searchQuery || filter !== 'all' ? t('projects.noMatchingProjects') : t('projects.empty')}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {searchQuery || filter !== 'all'
                ? t('projects.emptyFilterDescription')
                : t('projects.emptyDescription')}
            </p>
            {!searchQuery && filter === 'all' && (
              <Link
                href="/dashboard/projects/new"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground hover:bg-primary/90"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('projects.create')}
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects?.map((project) => (
            <Card
              key={project.id}
              className="group border-border bg-card transition-colors hover:border-input"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                    <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      project.status === 'ACTIVE'
                        ? 'bg-green-900/50 text-green-400'
                        : project.status === 'COMPLETED'
                        ? 'bg-blue-900/50 text-primary'
                        : project.status === 'ARCHIVED'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-yellow-900/50 text-yellow-400'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <Link href={`/dashboard/projects/${project.id}`}>
                  <h3 className="mt-4 font-semibold text-foreground hover:text-primary">
                    {project.name}
                  </h3>
                </Link>

                {project.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground/80">
                  {project.buildingType && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                      </svg>
                      {project.buildingType}
                    </span>
                  )}
                  {project.location && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {project.location}
                    </span>
                  )}
                  {project.totalArea && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                      </svg>
                      {project.totalArea.toLocaleString()} m²
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground/80">
                    {t('projects.updated')} {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Open"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(project.id, project.name)}
                      className="rounded p-1 text-muted-foreground hover:bg-red-900/50 hover:text-red-400"
                      title="Delete"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
