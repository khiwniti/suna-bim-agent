'use client';

/**
 * About Page
 *
 * Company information, platform overview, features, and technology stack.
 * Follows the same design patterns as other marketing pages (pricing, case-studies).
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Leaf,
  ArrowRight,
  Building2,
  Zap,
  Shield,
  Globe,
  Users,
  Award,
  TrendingDown,
  Code,
  Brain,
  Layers,
  ChevronRight,
  Sparkles,
  Target,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/provider';

// ============================================
// Types
// ============================================

interface Feature {
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
}

interface TechItem {
  icon: React.ReactNode;
  nameKey: string;
  descriptionKey: string;
}

// ============================================
// Data
// ============================================

const FEATURES: Feature[] = [
  {
    icon: <Brain className="w-6 h-6" />,
    titleKey: 'aiPowered',
    descriptionKey: 'aiPoweredDesc',
  },
  {
    icon: <TrendingDown className="w-6 h-6" />,
    titleKey: 'carbonAnalysis',
    descriptionKey: 'carbonAnalysisDesc',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    titleKey: 'clashDetection',
    descriptionKey: 'clashDetectionDesc',
  },
  {
    icon: <CheckCircle className="w-6 h-6" />,
    titleKey: 'codeCompliance',
    descriptionKey: 'codeComplianceDesc',
  },
  {
    icon: <Layers className="w-6 h-6" />,
    titleKey: 'visualization3d',
    descriptionKey: 'visualization3dDesc',
  },
  {
    icon: <Globe className="w-6 h-6" />,
    titleKey: 'thaiLocalized',
    descriptionKey: 'thaiLocalizedDesc',
  },
];

const TECH_STACK: TechItem[] = [
  {
    icon: <Code className="w-5 h-5" />,
    nameKey: 'nextjs',
    descriptionKey: 'nextjsDesc',
  },
  {
    icon: <Brain className="w-5 h-5" />,
    nameKey: 'langraph',
    descriptionKey: 'langraphDesc',
  },
  {
    icon: <Layers className="w-5 h-5" />,
    nameKey: 'ifcjs',
    descriptionKey: 'ifcjsDesc',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    nameKey: 'fastapi',
    descriptionKey: 'fastapiDesc',
  },
];

// ============================================
// Components
// ============================================

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
        {feature.icon}
      </div>
      <h3 className="text-lg font-bold mb-2">
        {t(`about.features.${feature.titleKey}`)}
      </h3>
      <p className="text-sm text-muted-foreground">
        {t(`about.features.${feature.descriptionKey}`)}
      </p>
    </motion.div>
  );
}

function TechCard({ tech, index }: { tech: TechItem; index: number }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/30"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {tech.icon}
      </div>
      <div>
        <h4 className="font-semibold mb-1">
          {t(`about.technology.${tech.nameKey}`)}
        </h4>
        <p className="text-sm text-muted-foreground">
          {t(`about.technology.${tech.descriptionKey}`)}
        </p>
      </div>
    </motion.div>
  );
}

function StatCard({
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
      <div className="text-sm text-muted-foreground">
        {t(`about.stats.${labelKey}`)}
      </div>
    </motion.div>
  );
}

// ============================================
// Page Component
// ============================================

export default function AboutPage() {
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
                {t('about.nav.calculator')}
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('about.nav.pricing')}
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  {t('about.nav.signIn')}
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
              <Building2 className="w-4 h-4" />
              <span>{t('about.hero.badge')}</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t('about.hero.title')}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                {t('about.hero.titleHighlight')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {t('about.hero.subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button variant="gradient" size="lg" glow shine className="group">
                  <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {t('about.cta.startFree')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/case-studies">
                <Button variant="outline" size="lg">
                  {t('about.cta.viewCaseStudies')}
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard
              icon={<Building2 className="w-6 h-6" />}
              value="500+"
              labelKey="projectsAnalyzed"
              delay={0.1}
            />
            <StatCard
              icon={<TrendingDown className="w-6 h-6" />}
              value="35%"
              labelKey="avgCarbonReduction"
              delay={0.2}
            />
            <StatCard
              icon={<Users className="w-6 h-6" />}
              value="100+"
              labelKey="companies"
              delay={0.3}
            />
            <StatCard
              icon={<Clock className="w-6 h-6" />}
              value="15min"
              labelKey="avgAnalysisTime"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
              <Target className="w-4 h-4" />
              {t('about.mission.badge')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('about.mission.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('about.mission.description')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              {t('about.features.badge')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('about.features.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('about.features.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.titleKey} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
              <Code className="w-4 h-4" />
              {t('about.technology.badge')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('about.technology.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('about.technology.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {TECH_STACK.map((tech, index) => (
              <TechCard key={tech.nameKey} tech={tech} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {[
              { icon: <Shield className="w-6 h-6" />, textKey: 'tgoCertified' },
              { icon: <Award className="w-6 h-6" />, textKey: 'treesCompliant' },
              { icon: <Globe className="w-6 h-6" />, textKey: 'thaiEnglish' },
              { icon: <Zap className="w-6 h-6" />, textKey: 'fastAnalysis' },
            ].map((badge, i) => (
              <motion.div
                key={badge.textKey}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 text-muted-foreground"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {badge.icon}
                </div>
                <span className="font-medium">{t(`about.trust.${badge.textKey}`)}</span>
              </motion.div>
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
                {t('about.cta.title')}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                {t('about.cta.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button variant="gradient" size="lg" glow shine className="group">
                    <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {t('about.cta.startFree')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg">
                    {t('about.cta.viewPricing')}
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
                {t('about.footer.copyright')}
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                {t('about.nav.home')}
              </Link>
              <Link href="/calculator" className="hover:text-foreground transition-colors">
                {t('about.nav.calculator')}
              </Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">
                {t('about.nav.pricing')}
              </Link>
              <Link href="/case-studies" className="hover:text-foreground transition-colors">
                {t('about.nav.caseStudies')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
