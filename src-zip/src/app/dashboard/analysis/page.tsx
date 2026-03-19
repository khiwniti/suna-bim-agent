'use client';

/**
 * Analysis Page
 *
 * View and run BIM analysis tasks
 */

import { useState } from 'react';
import Link from 'next/link';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/Loading';
import { useTranslation } from '@/i18n/provider';

type AnalysisType = 'spatial' | 'sustainability' | 'energy' | 'circulation' | 'mep';

const ANALYSIS_TYPE_KEYS: AnalysisType[] = ['spatial', 'sustainability', 'energy', 'circulation', 'mep'];

const analysisIcons: Record<AnalysisType, React.ReactNode> = {
  spatial: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  sustainability: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  energy: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  circulation: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  mep: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export default function AnalysisPage() {
  const { projects, isLoading } = useProjects();
  const { t } = useTranslation();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunAnalysis = async () => {
    if (!selectedProject || !selectedAnalysis) return;

    setIsRunning(true);
    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          analysisType: selectedAnalysis,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      // Redirect to project page to view results
      window.location.href = `/dashboard/projects/${selectedProject}`;
    } catch (error) {
      console.error('Analysis error:', error);
      alert(t('analysis.analysisFailed'));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('analysis.title')}</h1>
        <p className="mt-1 text-muted-foreground">
          {t('analysis.subtitle')}
        </p>
      </div>

      {/* Project Selection */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">{t('analysis.selectProject')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('analysis.selectProjectDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardSkeleton />
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{t('analysis.noProjectsAvailable')}</p>
              <Link href="/dashboard/projects/new">
                <Button className="bg-primary hover:bg-primary/90">
                  {t('dashboard.createProject')}
                </Button>
              </Link>
            </div>
          ) : (
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full rounded-lg border border-input bg-muted px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t('analysis.selectProjectPlaceholder')}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} {project.buildingType ? `(${project.buildingType})` : ''}
                </option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      {/* Analysis Types */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">{t('analysis.analysisType')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('analysis.analysisTypeDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ANALYSIS_TYPE_KEYS.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedAnalysis(type)}
                className={`flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                  selectedAnalysis === type
                    ? 'border-primary bg-primary/10'
                    : 'border-input hover:border-muted-foreground hover:bg-muted/50'
                }`}
              >
                <div className={`rounded-lg p-2 ${
                  selectedAnalysis === type
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {analysisIcons[type]}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{t(`analysis.types.${type}.name`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`analysis.types.${type}.description`)}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Run Analysis Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleRunAnalysis}
          disabled={!selectedProject || !selectedAnalysis || isRunning}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('analysis.runningAnalysis')}
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('analysis.run')}
            </>
          )}
        </Button>
      </div>

      {/* Recent Analyses */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">{t('analysis.recentAnalyses')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('analysis.recentAnalysesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <svg className="mx-auto h-12 w-12 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-4">{t('analysis.noAnalysesYet')}</p>
            <p className="text-sm">{t('analysis.noAnalysesHint')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
