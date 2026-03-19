'use client';

/**
 * Architects Solution Page
 *
 * Landing page targeting architecture firms in Thailand.
 * Focus: Design optimization, early-stage carbon analysis, sustainable design.
 */

import Link from 'next/link';
import {
  Compass,
  Lightbulb,
  Layers,
  PenTool,
  Award,
  TrendingDown,
  CheckCircle2,
  ArrowRight,
  Building2,
  Leaf,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/i18n/provider';

const BENEFIT_KEYS = ['designAnalysis', 'materialComparison', 'optimization', 'certifications'] as const;
const BENEFIT_ICONS = {
  designAnalysis: Lightbulb,
  materialComparison: Layers,
  optimization: TrendingDown,
  certifications: Award,
};

const FEATURE_KEYS = ['ifcIntegration', 'visualDashboard', 'lowCarbonAlts', 'aiAssistant'] as const;
const FEATURE_ICONS = {
  ifcIntegration: PenTool,
  visualDashboard: BarChart3,
  lowCarbonAlts: Leaf,
  aiAssistant: Sparkles,
};

export default function ArchitectsPage() {
  const { t } = useTranslation();

  return (
    <div className="text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-transparent to-purple-600/20" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-500/20 px-4 py-2 text-sm text-cyan-300">
                <Compass className="h-4 w-4" />
                {t('solutions.architects.badge')}
              </div>

              <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                {t('solutions.architects.title')}{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {t('solutions.architects.titleHighlight')}
                </span>{' '}
                {t('solutions.architects.titleEnd')}
              </h1>

              <p className="mb-8 text-lg text-slate-300 sm:text-xl">
                {t('solutions.architects.subtitle')}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-white transition-all hover:bg-cyan-600 hover:shadow-lg hover:shadow-cyan-500/25"
                >
                  {t('solutions.architects.startFreeTrial')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/calculator"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
                >
                  {t('solutions.architects.tryCalculator')}
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  {t('solutions.architects.trustRevit')}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  {t('solutions.architects.trustIfc')}
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Building2 className="mb-4 h-16 w-16 text-cyan-400" />
                  <h3 className="mb-2 text-xl font-semibold">{t('solutions.architects.mockup.title')}</h3>
                  <p className="mb-6 text-sm text-slate-400">{t('solutions.architects.mockup.subtitle')}</p>

                  <div className="w-full space-y-4">
                    <div className="rounded-lg bg-slate-700/50 p-3">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{t('solutions.architects.mockup.optionA')}</span>
                        <span className="text-red-400">{t('solutions.architects.mockup.optionAValue')}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-600">
                        <div className="h-full w-[90%] rounded-full bg-red-500" />
                      </div>
                    </div>

                    <div className="rounded-lg bg-emerald-500/10 p-3 ring-2 ring-emerald-500/50">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{t('solutions.architects.mockup.optionB')}</span>
                        <span className="text-emerald-400">{t('solutions.architects.mockup.optionBValue')}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-600">
                        <div className="h-full w-[56%] rounded-full bg-emerald-500" />
                      </div>
                      <div className="mt-2 text-xs text-emerald-400">{t('solutions.architects.mockup.recommended')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-y border-white/10 bg-slate-900/50 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              {t('solutions.architects.whyTitle')}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              {t('solutions.architects.whySubtitle')}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {BENEFIT_KEYS.map((key) => {
              const Icon = BENEFIT_ICONS[key];
              return (
                <div
                  key={key}
                  className="rounded-xl border border-white/10 bg-slate-800/50 p-6 transition-all hover:border-cyan-500/50 hover:bg-slate-800"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20">
                    <Icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{t(`solutions.architects.benefits.${key}.title`)}</h3>
                  <p className="text-sm text-slate-400">{t(`solutions.architects.benefits.${key}.description`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              {t('solutions.architects.featuresTitle')}
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {FEATURE_KEYS.map((key) => {
              const Icon = FEATURE_ICONS[key];
              return (
                <div
                  key={key}
                  className="flex gap-4 rounded-xl border border-white/10 bg-slate-800/30 p-6"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/20">
                    <Icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">{t(`solutions.architects.features.${key}.title`)}</h3>
                    <p className="text-slate-400">{t(`solutions.architects.features.${key}.description`)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
            {t('solutions.architects.cta')}
          </h2>
          <p className="mb-8 text-lg text-slate-400">
            {t('solutions.architects.ctaDescription')}
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-cyan-600 hover:shadow-lg hover:shadow-cyan-500/25"
          >
            {t('solutions.common.startFreeTrial')}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
