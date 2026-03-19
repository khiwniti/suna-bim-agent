'use client';

/**
 * Case Studies Index Page
 *
 * Marketing page showcasing real-world success stories of BIM Carbon users.
 * Features 3 case studies targeting different customer segments:
 * 1. SMB Contractor - Winning green building contracts
 * 2. Architect - Design optimization for carbon reduction
 * 3. Developer - Green financing through automated reports
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Leaf,
  ArrowRight,
  Building2,
  PenTool,
  Landmark,
  TrendingDown,
  Award,
  Clock,
  Users,
  BadgeCheck,
  ChevronRight,
  Star,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';

// ============================================
// Types
// ============================================

interface CaseStudyResult {
  metricKey: string;
  valueKey: string;
  metricValue: string;
}

interface CaseStudy {
  id: string;
  slug: string;
  categoryKey: string;
  categoryIcon: React.ReactNode;
  titleKey: string;
  subtitleKey: string;
  companyKey: string;
  companyTypeKey: string;
  heroImage: string;
  results: CaseStudyResult[];
  quoteKey: string;
  quoteeKey: string;
  quoteeRoleKey: string;
  tags: string[];
  readTimeMinutes: number;
}

// ============================================
// Case Study Data
// ============================================

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'smb-contractor',
    slug: 'abc-construction-green-contracts',
    categoryKey: 'smbContractor',
    categoryIcon: <Building2 className="w-5 h-5" />,
    titleKey: 'abcConstruction.title',
    subtitleKey: 'abcConstruction.subtitle',
    companyKey: 'abcConstruction.company',
    companyTypeKey: 'abcConstruction.companyType',
    heroImage: '/images/case-studies/abc-construction.jpg',
    results: [
      { metricKey: 'abcConstruction.results.contracts.metric', valueKey: 'abcConstruction.results.contracts.value', metricValue: '3' },
      { metricKey: 'abcConstruction.results.projectValue.metric', valueKey: 'abcConstruction.results.projectValue.value', metricValue: '฿45M' },
      { metricKey: 'abcConstruction.results.fasterReports.metric', valueKey: 'abcConstruction.results.fasterReports.value', metricValue: '85%' },
    ],
    quoteKey: 'abcConstruction.quote',
    quoteeKey: 'abcConstruction.quotee',
    quoteeRoleKey: 'abcConstruction.quoteeRole',
    tags: ['SMB', 'Green Building', 'TGO Compliance', 'Competitive Advantage'],
    readTimeMinutes: 5,
  },
  {
    id: 'architect',
    slug: 'studio-verde-carbon-optimization',
    categoryKey: 'architect',
    categoryIcon: <PenTool className="w-5 h-5" />,
    titleKey: 'studioVerde.title',
    subtitleKey: 'studioVerde.subtitle',
    companyKey: 'studioVerde.company',
    companyTypeKey: 'studioVerde.companyType',
    heroImage: '/images/case-studies/studio-verde.jpg',
    results: [
      { metricKey: 'studioVerde.results.carbonReduction.metric', valueKey: 'studioVerde.results.carbonReduction.value', metricValue: '30%' },
      { metricKey: 'studioVerde.results.certification.metric', valueKey: 'studioVerde.results.certification.value', metricValue: 'TREES Gold' },
      { metricKey: 'studioVerde.results.savings.metric', valueKey: 'studioVerde.results.savings.value', metricValue: '฿2.1M' },
    ],
    quoteKey: 'studioVerde.quote',
    quoteeKey: 'studioVerde.quotee',
    quoteeRoleKey: 'studioVerde.quoteeRole',
    tags: ['Architecture', 'TREES Certification', 'AI Optimization', 'Material Selection'],
    readTimeMinutes: 6,
  },
  {
    id: 'developer',
    slug: 'green-heights-financing',
    categoryKey: 'developer',
    categoryIcon: <Landmark className="w-5 h-5" />,
    titleKey: 'greenHeights.title',
    subtitleKey: 'greenHeights.subtitle',
    companyKey: 'greenHeights.company',
    companyTypeKey: 'greenHeights.companyType',
    heroImage: '/images/case-studies/green-heights.jpg',
    results: [
      { metricKey: 'greenHeights.results.financing.metric', valueKey: 'greenHeights.results.financing.value', metricValue: '฿500M' },
      { metricKey: 'greenHeights.results.interest.metric', valueKey: 'greenHeights.results.interest.value', metricValue: '0.5%' },
      { metricKey: 'greenHeights.results.projects.metric', valueKey: 'greenHeights.results.projects.value', metricValue: '5' },
    ],
    quoteKey: 'greenHeights.quote',
    quoteeKey: 'greenHeights.quotee',
    quoteeRoleKey: 'greenHeights.quoteeRole',
    tags: ['Green Finance', 'TGO Reports', 'ESG Compliance', 'Property Development'],
    readTimeMinutes: 7,
  },
];

// ============================================
// Components
// ============================================

function CaseStudyCard({ study, index }: { study: CaseStudy; index: number }) {
  const { t } = useTranslation();
  const gradients = [
    'from-emerald-500/10 to-cyan-500/10',
    'from-blue-500/10 to-purple-500/10',
    'from-amber-500/10 to-orange-500/10',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <Link href={`/case-studies/${study.slug}`}>
        <div className="relative rounded-3xl overflow-hidden bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10">
          {/* Category Badge */}
          <div className="absolute top-6 left-6 z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-sm font-medium">
              {study.categoryIcon}
              <span>{t(`caseStudies.categories.${study.categoryKey}`)}</span>
            </div>
          </div>

          {/* Image Placeholder */}
          <div className={cn(
            'relative h-56 bg-gradient-to-br',
            gradients[index % 3]
          )}>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                {study.categoryIcon}
              </motion.div>
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Company info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Building2 className="w-4 h-4" />
              <span>{t(`caseStudies.studies.${study.companyTypeKey}`)}</span>
            </div>

            {/* Title */}
            <h3 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
              {t(`caseStudies.studies.${study.titleKey}`)}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {t(`caseStudies.studies.${study.subtitleKey}`)}
            </p>

            {/* Results preview */}
            <div className="grid grid-cols-3 gap-4 py-4 mb-4 border-y border-border/30">
              {study.results.map((result, i) => (
                <div key={i} className="text-center">
                  <div className="text-lg md:text-xl font-bold text-primary">
                    {result.metricValue}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t(`caseStudies.studies.${result.valueKey}`)}
                  </div>
                </div>
              ))}
            </div>

            {/* Quote preview */}
            <div className="flex items-start gap-3 mb-4">
              <Quote className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground italic line-clamp-2">
                &ldquo;{t(`caseStudies.studies.${study.quoteKey}`)}&rdquo;
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{study.readTimeMinutes} {t('caseStudies.readTime')}</span>
              </div>
              <div className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all duration-300">
                <span>{t('caseStudies.readMore')}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function StatHighlight({
  icon,
  value,
  labelKey,
  delay,
}: {
  icon: React.ReactNode;
  value: string;
  labelKey: string;
  delay: number;
}) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="text-center"
    >
      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{t(`caseStudies.stats.${labelKey}`)}</div>
    </motion.div>
  );
}

// ============================================
// Page Component
// ============================================

export default function CaseStudiesPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg">BIM Carbon</span>
                <span className="hidden sm:inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  🇹🇭 Thailand
                </span>
              </div>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/calculator"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('caseStudies.nav.calculator')}
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('caseStudies.nav.pricing')}
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  {t('caseStudies.nav.signIn')}
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <Award className="w-4 h-4" />
              <span>{t('caseStudies.hero.badge')}</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t('caseStudies.hero.title')}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                {t('caseStudies.hero.titleHighlight')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {t('caseStudies.description')}
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-green-600" />
                <span>{t('caseStudies.hero.verifiedResults')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <span>{t('caseStudies.hero.realCompanies')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-green-600" />
                <span>{t('caseStudies.hero.thaiSuccessStories')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatHighlight
              icon={<TrendingDown className="w-6 h-6" />}
              value="35%"
              labelKey="carbonReduction"
              delay={0.1}
            />
            <StatHighlight
              icon={<Award className="w-6 h-6" />}
              value="50+"
              labelKey="certifications"
              delay={0.2}
            />
            <StatHighlight
              icon={<Building2 className="w-6 h-6" />}
              value="500+"
              labelKey="projectsAnalyzed"
              delay={0.3}
            />
            <StatHighlight
              icon={<Landmark className="w-6 h-6" />}
              value="฿1B+"
              labelKey="greenFinancing"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('caseStudies.featured.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('caseStudies.featured.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CASE_STUDIES.map((study, index) => (
              <CaseStudyCard key={study.id} study={study} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto max-w-3xl text-center"
        >
          <div className="relative p-12 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-purple-500/10" />
            <div className="absolute inset-0 backdrop-blur-xl bg-card/30" />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30"
              >
                <Leaf className="w-8 h-8 text-white" />
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('caseStudies.cta.title')}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                {t('caseStudies.cta.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button variant="gradient" size="lg" glow shine className="group">
                    <Leaf className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {t('caseStudies.cta.startFreeAnalysis')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg">
                    {t('caseStudies.cta.viewPricing')}
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Leaf className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-muted-foreground">
                {t('caseStudies.footer.copyright')}
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                {t('caseStudies.nav.home')}
              </Link>
              <Link href="/calculator" className="hover:text-foreground transition-colors">
                {t('caseStudies.nav.calculator')}
              </Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">
                {t('caseStudies.nav.pricing')}
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                {t('caseStudies.nav.contact')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
