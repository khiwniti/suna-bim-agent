'use client';

/**
 * Solutions Layout
 *
 * Shared layout for partner landing pages with consistent navigation
 * and footer across all solution pages.
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Leaf } from 'lucide-react';
import { useTranslation } from '@/i18n/provider';

export default function SolutionsLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-white">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">{t('solutions.common.backToHome')}</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">CarbonBIM</span>
          </Link>

          <Link
            href="/auth/signup"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
          >
            {t('solutions.common.getStarted')}
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-900/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">CarbonBIM</span>
              </Link>
              <p className="mt-4 text-sm text-slate-400">
                {t('solutions.common.tagline')}
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-white">{t('solutions.common.footerSolutions')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/solutions/contractors" className="hover:text-white">{t('solutions.common.forContractors')}</Link></li>
                <li><Link href="/solutions/architects" className="hover:text-white">{t('solutions.common.forArchitects')}</Link></li>
                <li><Link href="/solutions/developers" className="hover:text-white">{t('solutions.common.forDevelopers')}</Link></li>
                <li><Link href="/solutions/consultants" className="hover:text-white">{t('solutions.common.forConsultants')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-white">{t('solutions.common.footerResources')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/case-studies" className="hover:text-white">{t('solutions.common.caseStudies')}</Link></li>
                <li><Link href="/pricing" className="hover:text-white">{t('solutions.common.pricing')}</Link></li>
                <li><Link href="/calculator" className="hover:text-white">{t('solutions.common.freeCalculator')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-white">{t('solutions.common.footerContact')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>hello@carbonbim.com</li>
                <li>{t('solutions.common.location')}</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-slate-500">
            {t('solutions.common.copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}
