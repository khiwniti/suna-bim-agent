'use client';

/**
 * Project Detail Page
 *
 * Full workspace with 3D viewport, chat, and analytics
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjects, type Project } from '@/hooks/useProjects';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { ThatOpenViewer } from '@/components/viewer/ThatOpenViewer';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Spinner } from '@/components/ui/Loading';
import { useTranslation } from '@/i18n/provider';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: loading, getProject } = useProjects();
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);

  const projectId = params.id as string;

  useEffect(() => {
    const fetchProject = async () => {
      if (projectId) {
        setIsLoadingProject(true);
        try {
          const data = await getProject(projectId);
          if (!data) {
            setError(t('common.projectNotFound'));
          } else {
            setProject(data);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : t('common.failedToLoadProject'));
        } finally {
          setIsLoadingProject(false);
        }
      }
    };

    fetchProject();
  }, [projectId, getProject, t]);

  if (loading || isLoadingProject) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center">
        <svg
          className="mb-4 h-12 w-12 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h2 className="mb-2 text-xl font-semibold text-white">{error}</h2>
        <button
          onClick={() => router.push('/dashboard/projects')}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('common.backToProjects')}
        </button>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="-m-4 lg:-m-6 h-[calc(100vh-4rem)]">
      <WorkspaceLayout
        viewportPanel={<ThatOpenViewer className="w-full h-full" />}
        chatPanel={<ChatPanel />}
        onBackToLanding={() => router.push('/dashboard/projects')}
      />
    </div>
  );
}
