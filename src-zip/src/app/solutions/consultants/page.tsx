'use client';

/**
 * Consultants Solution Page
 *
 * Landing page targeting sustainability consultants in Thailand.
 * Focus: Scale services, white-label reports, client management.
 */

import Link from 'next/link';
import {
  Users,
  Briefcase,
  FileSpreadsheet,
  Zap,
  Award,
  Building2,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  FileText,
  Leaf,
  Settings,
} from 'lucide-react';
import { useTranslation } from '@/i18n/provider';

const BENEFIT_KEYS = ['fasterAnalysis', 'whiteLabel', 'clientManagement', 'tgoCertified'] as const;
const BENEFIT_ICONS = {
  fasterAnalysis: Zap,
  whiteLabel: FileSpreadsheet,
  clientManagement: Users,
  tgoCertified: Award,
};

const FEATURE_KEYS = ['instantCalcs', 'reportFormats', 'optimization', 'apiAccess'] as const;
const FEATURE_ICONS = {
  instantCalcs: BarChart3,
  reportFormats: FileText,
  optimization: Leaf,
  apiAccess: Settings,
};

const STATS = [
  { value: '90%', labelKey: 'timeSaved' },
  { value: '10x', labelKey: 'moreClients' },
  { value: '105+', labelKey: 'thaiMaterials' },
  { value: '3', labelKey: 'reportTemplates' },
];

const WORKFLOW_STEPS = ['step1', 'step2', 'step3'] as const;

export default function ConsultantsPage() {
  const { t } = useTranslation();

  return (
    <div className="text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-emerald-600/20" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-2 text-sm text-purple-300">
                <Briefcase className="h-4 w-4" />
                {t('solutions.consultants.badge')}
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                {t('solutions.consultants.title')}{' '}
                <span className="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
                  {t('solutions.consultants.titleHighlight')}
                </span>
              </h1>
              <p className="mb-8 text-lg text-slate-300 sm:text-xl">
                {t('solutions.consultants.subtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-6 py-3 font-semibold text-white transition-all hover:bg-purple-600"
                >
                  {t('solutions.consultants.startFreeTrial')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
                >
                  {t('solutions.consultants.viewProPlans')}
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  {t('solutions.consultants.trustWhiteLabel')}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  {t('solutions.consultants.trustApi')}
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Building2 className="mb-4 h-16 w-16 text-purple-400" />
                  <h3 className="mb-2 text-xl font-semibold">{t('solutions.consultants.mockup.title')}</h3>
                  <p className="mb-4 text-sm text-slate-400">{t('solutions.consultants.mockup.subtitle')}</p>
                  <div className="w-full space-y-2">
                    {[
                      { client: 'ABC Corp', projects: 5 },
                      { client: 'XYZ Ltd', projects: 3 },
                      { client: 'Green Dev', projects: 8 },
                    ].map((item) => (
                      <div key={item.client} className="flex items-center justify-between rounded-lg bg-slate-700/50 p-3 text-sm">
                        <span>{item.client}</span>
                        <span className="text-slate-400">{item.projects} {t('solutions.consultants.mockup.projects')}</span>
                      </div>
                    ))}
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
                <div className="text-3xl font-bold text-purple-400 sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-400">{t(`solutions.consultants.stats.${stat.labelKey}`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{t('solutions.consultants.whyTitle')}</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              {t('solutions.consultants.whySubtitle')}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {BENEFIT_KEYS.map((key) => {
              const Icon = BENEFIT_ICONS[key];
              return (
                <div
                  key={key}
                  className="rounded-xl border border-white/10 bg-slate-800/50 p-6 transition-all hover:border-purple-500/50"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
                    <Icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{t(`solutions.consultants.benefits.${key}.title`)}</h3>
                  <p className="text-sm text-slate-400">{t(`solutions.consultants.benefits.${key}.description`)}</p>
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
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{t('solutions.consultants.featuresTitle')}</h2>
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
                    <h3 className="mb-2 text-lg font-semibold">{t(`solutions.consultants.features.${key}.title`)}</h3>
                    <p className="text-slate-400">{t(`solutions.consultants.features.${key}.description`)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{t('solutions.consultants.workflow.title')}</h2>
            <p className="text-lg text-slate-400">{t('solutions.consultants.workflow.subtitle')}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500 text-xl font-bold">
                  {index + 1}
                </div>
                <h3 className="mb-2 font-semibold">{t(`solutions.consultants.workflow.${step}.title`)}</h3>
                <p className="text-sm text-slate-400">{t(`solutions.consultants.workflow.${step}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl">{t('solutions.consultants.cta')}</h2>
          <p className="mb-8 text-lg text-slate-400">
            {t('solutions.consultants.ctaDescription')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-purple-600"
            >
              {t('solutions.common.startFreeTrial')}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10"
            >
              {t('solutions.consultants.viewProPlans')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
