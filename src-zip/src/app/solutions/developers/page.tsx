'use client';

/**
 * Developers Solution Page
 *
 * Landing page targeting property developers in Thailand.
 * Focus: Green financing, ESG compliance, portfolio carbon tracking.
 */

import Link from 'next/link';
import {
  Building,
  Banknote,
  LineChart,
  Globe,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  PieChart,
  FileBarChart,
  Leaf,
  Shield,
} from 'lucide-react';
import { useTranslation } from '@/i18n/provider';

const BENEFIT_KEYS = ['greenFinancing', 'esgReporting', 'portfolioTracking', 'carbonTargets'] as const;
const BENEFIT_ICONS = {
  greenFinancing: Banknote,
  esgReporting: LineChart,
  portfolioTracking: Globe,
  carbonTargets: Target,
};

const FEATURE_KEYS = ['portfolioDashboard', 'investorReports', 'carbonBenchmarks', 'dataVerification'] as const;
const FEATURE_ICONS = {
  portfolioDashboard: PieChart,
  investorReports: FileBarChart,
  carbonBenchmarks: Leaf,
  dataVerification: Shield,
};

const STATS = [
  { value: '฿50B+', labelKey: 'greenBonds' },
  { value: '2-3%', labelKey: 'lowerInterest' },
  { value: '105+', labelKey: 'materialsTracked' },
  { value: '100%', labelKey: 'tgoCompliant' },
];

export default function DevelopersPage() {
  const { t } = useTranslation();

  return (
    <div className="text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-emerald-600/20" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-4 py-2 text-sm text-blue-300">
                <Building className="h-4 w-4" />
                {t('solutions.developers.badge')}
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                {t('solutions.developers.title')}{' '}
                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  {t('solutions.developers.titleHighlight')}
                </span>
              </h1>
              <p className="mb-8 text-lg text-slate-300 sm:text-xl">
                {t('solutions.developers.subtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-600"
                >
                  {t('solutions.common.startFreeTrial')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/case-studies/green-heights-financing"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
                >
                  {t('solutions.common.viewCaseStudy')}
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  {t('solutions.common.botGreenFinanceReady')}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  {t('solutions.common.esgCompliant')}
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <TrendingUp className="mb-4 h-16 w-16 text-blue-400" />
                  <h3 className="mb-2 text-xl font-semibold">{t('solutions.developers.portfolioScore')}</h3>
                  <p className="mb-4 text-sm text-slate-400">12 {t('solutions.developers.projectsTracked')}</p>
                  <div className="mb-4 text-5xl font-bold text-emerald-400">A+</div>
                  <p className="text-sm text-slate-400">15% {t('solutions.developers.belowBenchmark')}</p>
                  <div className="mt-4 rounded-full bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300">
                    {t('solutions.developers.greenFinanceEligible')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-slate-900/50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.labelKey} className="text-center">
                <div className="text-3xl font-bold text-blue-400 sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-400">{t(`solutions.developers.stats.${stat.labelKey}`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{t('solutions.developers.whyTitle')}</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              {t('solutions.developers.whySubtitle')}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {BENEFIT_KEYS.map((key) => {
              const Icon = BENEFIT_ICONS[key];
              return (
                <div
                  key={key}
                  className="rounded-xl border border-white/10 bg-slate-800/50 p-6 transition-all hover:border-blue-500/50"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20">
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{t(`solutions.developers.benefits.${key}.title`)}</h3>
                  <p className="text-sm text-slate-400">{t(`solutions.developers.benefits.${key}.description`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-900/50 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{t('solutions.developers.enterpriseFeatures')}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {FEATURE_KEYS.map((key) => {
              const Icon = FEATURE_ICONS[key];
              return (
                <div key={key} className="flex gap-4 rounded-xl border border-white/10 bg-slate-800/30 p-6">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
                    <Icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">{t(`solutions.developers.features.${key}.title`)}</h3>
                    <p className="text-slate-400">{t(`solutions.developers.features.${key}.description`)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Green Finance Callout */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/30 to-blue-900/30 p-8">
            <div className="text-center">
              <Banknote className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
              <h3 className="mb-4 text-2xl font-bold">{t('solutions.developers.greenFinanceSection.title')}</h3>
              <p className="mb-6 text-slate-300">
                {t('solutions.developers.greenFinanceSection.description')}
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-800/50 p-4">
                  <div className="text-2xl font-bold text-emerald-400">2-3%</div>
                  <div className="text-sm text-slate-400">{t('solutions.developers.greenFinanceSection.lowerInterest')}</div>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-4">
                  <div className="text-2xl font-bold text-emerald-400">฿50B+</div>
                  <div className="text-sm text-slate-400">{t('solutions.developers.greenFinanceSection.availableFunding')}</div>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-4">
                  <div className="text-2xl font-bold text-emerald-400">TGO</div>
                  <div className="text-sm text-slate-400">{t('solutions.developers.greenFinanceSection.compliantReports')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl">{t('solutions.developers.cta')}</h2>
          <p className="mb-8 text-lg text-slate-400">
            {t('solutions.developers.ctaDescription')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-blue-600"
            >
              {t('solutions.common.startFreeTrial')}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10"
            >
              {t('solutions.common.viewEnterprisePlans')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
