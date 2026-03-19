'use client';

/**
 * Dashboard Loading State
 *
 * Shown while dashboard pages are loading
 */

import { Spinner } from '@/components/ui/Loading';
import { useTranslation } from '@/i18n/provider';

export default function DashboardLoading() {
  const { t } = useTranslation();

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
      </div>
    </div>
  );
}
