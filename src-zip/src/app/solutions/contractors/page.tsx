'use client';

/**
 * Contractors Solution Page
 *
 * Landing page targeting construction contractors in Thailand.
 * Focus: Win more green contracts, TGO compliance, competitive advantage.
 */

import Link from 'next/link';
import {
  HardHat,
  TrendingUp,
  FileCheck,
  Clock,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  Building2,
  Leaf,
  Calculator,
  FileText,
  Shield,
} from 'lucide-react';
import { useTranslation } from '@/i18n/provider';

const BENEFIT_KEYS = ['winContracts', 'tgoCompliance', 'saveTime', 'treesReady'] as const;
const BENEFIT_ICONS = {
  winContracts: TrendingUp,
  tgoCompliance: FileCheck,
  saveTime: Clock,
  treesReady: Award,
};

const FEATURE_KEYS = ['instantAnalysis', 'professionalReports', 'thaiMaterials', 'lowCarbonRecs'] as const;
const FEATURE_ICONS = {
  instantAnalysis: Calculator,
  professionalReports: FileText,
  thaiMaterials: Leaf,
  lowCarbonRecs: Shield,
};

const STATS = [
  { value: '117,000+', labelKey: 'thaiContractors' },
  { value: '90%', labelKey: 'timeSaved' },
  { value: '105+', labelKey: 'thaiMaterials' },
  { value: '30%', labelKey: 'carbonReduction' },
];

export default function ContractorsPage() {
  const { t } = useTranslation();

  return (
    <div className="text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-cyan-600/20" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300">
                <HardHat className="h-4 w-4" />
                {t('solutions.contractors.badge')}
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                {t('solutions.contractors.title')}{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  {t('solutions.contractors.titleHighlight')}
                </span>
              </h1>
              <p className="mb-8 text-lg text-slate-300 sm:text-xl">
                {t('solutions.contractors.subtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white transition-all hover:bg-emerald-600"
                >
                  {t('solutions.common.startFreeTrial')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/calculator"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
                >
                  {t('solutions.contractors.tryCalculator')}
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {t('solutions.contractors.noCreditCard')}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {t('solutions.contractors.freeAnalyses')}
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Building2 className="mb-4 h-16 w-16 text-emerald-400" />
                  <h3 className="mb-2 text-xl font-semibold">{t('solutions.contractors.reportTitle')}</h3>
                  <p className="mb-4 text-sm text-slate-400">{t('solutions.contractors.readyInMinutes')}</p>
                  <div className="w-full space-y-3">
                    {[
                      { label: 'Concrete', percent: 45, color: 'emerald' },
                      { label: 'Steel', percent: 30, color: 'cyan' },
                      { label: 'Other', percent: 25, color: 'amber' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">{item.label}</span>
                          <span className={`text-${item.color}-400`}>{item.percent}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-400`}
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
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
                <div className="text-3xl font-bold text-emerald-400 sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-400">{t(`solutions.contractors.stats.${stat.labelKey}`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{t('solutions.contractors.whyTitle')}</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              {t('solutions.contractors.whySubtitle')}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {BENEFIT_KEYS.map((key) => {
              const Icon = BENEFIT_ICONS[key];
              return (
                <div
                  key={key}
                  className="rounded-xl border border-white/10 bg-slate-800/50 p-6 transition-all hover:border-emerald-500/50"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20">
                    <Icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{t(`solutions.contractors.benefits.${key}.title`)}</h3>
                  <p className="text-sm text-slate-400">{t(`solutions.contractors.benefits.${key}.description`)}</p>
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
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{t('solutions.contractors.featuresTitle')}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {FEATURE_KEYS.map((key) => {
              const Icon = FEATURE_ICONS[key];
              return (
                <div key={key} className="flex gap-4 rounded-xl border border-white/10 bg-slate-800/30 p-6">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-500/20">
                    <Icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">{t(`solutions.contractors.features.${key}.title`)}</h3>
                    <p className="text-slate-400">{t(`solutions.contractors.features.${key}.description`)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-white/10 bg-slate-800/30 p-8 text-center">
            <div className="mb-4 flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-xl text-amber-400">★</span>
              ))}
            </div>
            <p className="mb-6 text-xl italic text-slate-300">
              &quot;{t('solutions.contractors.testimonial.quote')}&quot;
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                <Users className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{t('solutions.contractors.testimonial.name')}</div>
                <div className="text-sm text-slate-400">{t('solutions.contractors.testimonial.role')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl">{t('solutions.contractors.cta')}</h2>
          <p className="mb-8 text-lg text-slate-400">
            {t('solutions.contractors.ctaDescription')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-emerald-600"
            >
              {t('solutions.common.startFreeTrial')}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/case-studies"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10"
            >
              {t('solutions.contractors.viewCaseStudies')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
