'use client';

/**
 * BOQ Analyzer Page
 *
 * Standalone page for analyzing Bill of Quantities documents.
 */

import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet, Zap, Shield } from 'lucide-react';
import { BOQAnalyzer } from '@/components/calculator/BOQAnalyzer';
import { useTranslation } from '@/i18n/provider';

type FeatureKey = 'multipleFormats' | 'instantExtraction' | 'thaiMaterials';
type StepKey = 'upload' | 'extract' | 'map' | 'calculate';

const FEATURE_KEYS: { key: FeatureKey; icon: typeof FileSpreadsheet; colorClass: string }[] = [
  { key: 'multipleFormats', icon: FileSpreadsheet, colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  { key: 'instantExtraction', icon: Zap, colorClass: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
  { key: 'thaiMaterials', icon: Shield, colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
];

const STEP_KEYS: StepKey[] = ['upload', 'extract', 'map', 'calculate'];

export default function BOQAnalyzerPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-900/10">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('boqAnalyzer.backToCalculator')}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Zap className="h-4 w-4" />
            {t('boqAnalyzer.badge')}
          </div>
          <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white md:text-5xl">
            {t('boqAnalyzer.title')}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            {t('boqAnalyzer.description')}
          </p>
        </section>

        {/* Features */}
        <section className="mb-12 grid gap-6 md:grid-cols-3">
          {FEATURE_KEYS.map(({ key, icon: Icon, colorClass }) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${colorClass.split(' ').slice(0, 2).join(' ')}`}>
                <Icon className={`h-6 w-6 ${colorClass.split(' ').slice(2).join(' ')}`} />
              </div>
              <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">
                {t(`boqAnalyzer.features.${key}.title`)}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t(`boqAnalyzer.features.${key}.description`)}
              </p>
            </div>
          ))}
        </section>

        {/* Analyzer Component */}
        <section className="mb-12">
          <BOQAnalyzer />
        </section>

        {/* How It Works */}
        <section className="rounded-2xl bg-slate-50 p-8 dark:bg-slate-800/50">
          <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">
            {t('boqAnalyzer.howItWorks.title')}
          </h2>
          <div className="grid gap-6 md:grid-cols-4">
            {STEP_KEYS.map((key, index) => (
              <div key={key} className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">
                  {t(`boqAnalyzer.howItWorks.steps.${key}.title`)}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t(`boqAnalyzer.howItWorks.steps.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
