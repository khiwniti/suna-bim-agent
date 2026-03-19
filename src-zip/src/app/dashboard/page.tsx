'use client';

/**
 * Dashboard Home Page
 *
 * Overview of projects, recent activity, and quick stats
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CardSkeleton } from '@/components/ui/Loading';
import { useTranslation } from '@/i18n/provider';

const STAT_KEYS = ['totalProjects', 'activeProjects', 'analysesRun', 'bimModels'] as const;

export default function DashboardPage() {
  const { projects, isLoading: loading } = useProjects();
  const { t } = useTranslation();

  // Derive stats from projects instead of using useEffect + setState
  const stats = useMemo(() => ({
    totalProjects: projects?.length || 0,
    activeProjects: projects?.filter((p) => p.status === 'ACTIVE').length || 0,
    totalAnalyses: 0, // Would fetch from API
    totalModels: 0, // Would fetch from API
  }), [projects]);

  const statCards = [
    {
      key: 'totalProjects',
      value: stats.totalProjects,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'bg-primary',
    },
    {
      key: 'activeProjects',
      value: stats.activeProjects,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'bg-green-600',
    },
    {
      key: 'analysesRun',
      value: stats.totalAnalyses,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-purple-600',
    },
    {
      key: 'bimModels',
      value: stats.totalModels,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'bg-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
        <p className="mt-1 text-muted-foreground">
          {t('dashboard.welcome')}! {t('dashboard.welcomeSubtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.key} className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                <span className="text-foreground">{stat.icon}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t(`dashboard.stats.${stat.key}`)}</p>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Projects */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">{t('dashboard.recentProjects')}</CardTitle>
          <Link
            href="/dashboard/projects"
            className="text-sm text-primary hover:text-primary/80"
          >
            {t('dashboard.viewAll')}
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : projects?.length === 0 ? (
            <div className="py-8 text-center">
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
              <h3 className="mt-4 text-lg font-medium text-foreground">{t('dashboard.noProjects')}</h3>
              <p className="mt-2 text-muted-foreground">
                {t('dashboard.noProjectsDescription')}
              </p>
              <Link
                href="/dashboard/projects/new"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground hover:bg-primary/90"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('dashboard.createProject')}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {projects?.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="flex items-center justify-between py-4 hover:bg-muted/50 -mx-6 px-6 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.buildingType || 'Building'} • {project.location || 'No location'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        project.status === 'ACTIVE'
                          ? 'bg-green-900/50 text-green-400'
                          : project.status === 'COMPLETED'
                          ? 'bg-blue-900/50 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {project.status}
                    </span>
                    <svg className="h-5 w-5 text-muted-foreground/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/projects/new"
          className="flex items-center gap-4 rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
            <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-foreground">{t('dashboard.newProject')}</p>
            <p className="text-sm text-muted-foreground">{t('dashboard.newProjectDescription')}</p>
          </div>
        </Link>

        <Link
          href="/dashboard/analysis"
          className="flex items-center gap-4 rounded-lg border border-border bg-card p-6 transition-colors hover:border-purple-600"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/20">
            <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-foreground">{t('dashboard.runAnalysis')}</p>
            <p className="text-sm text-muted-foreground">{t('dashboard.runAnalysisDescription')}</p>
          </div>
        </Link>

        <Link
          href="/dashboard/settings"
          className="flex items-center gap-4 rounded-lg border border-border bg-card p-6 transition-colors hover:border-input"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/20">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-foreground">{t('dashboard.settings')}</p>
            <p className="text-sm text-muted-foreground">{t('dashboard.settingsDescription')}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
