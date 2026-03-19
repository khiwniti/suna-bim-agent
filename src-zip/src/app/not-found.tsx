'use client';

import Link from 'next/link';
import { useTranslation } from '@/i18n/provider';

/**
 * 404 Not Found Page
 *
 * Displayed when a page is not found
 */

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-card">
          <span className="text-5xl font-bold text-muted-foreground">404</span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {t('errorPage.notFound.title')}
        </h1>
        <p className="mb-6 text-muted-foreground">
          {t('errorPage.notFound.description')}
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground hover:bg-primary/90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {t('common.goHome')}
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            {t('nav.dashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
