'use client';

/**
 * Case Study Content - Client Component
 *
 * Renders the detailed case study content with Framer Motion animations.
 * Receives data from the server component page.tsx.
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Leaf,
  ArrowRight,
  ArrowLeft,
  Building2,
  PenTool,
  Landmark,
  TrendingDown,
  Award,
  Clock,
  Users,
  CheckCircle2,
  Quote,
  Target,
  Lightbulb,
  BarChart3,
  FileText,
  Zap,
  ChevronRight,
  Share2,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/provider';
import type { CaseStudyDetail, CaseStudyResult, CaseStudyFeature, CaseStudyStep, CaseStudyMetric } from './data';

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  PenTool,
  Landmark,
  TrendingDown,
  Award,
  Clock,
  Lightbulb,
  BarChart3,
  FileText,
  Zap,
  Users,
  Download,
  Target,
};

function getIcon(iconName: string, className?: string) {
  const IconComponent = ICON_MAP[iconName] || Building2;
  return <IconComponent className={className} />;
}

// ============================================
// Components
// ============================================

function ResultCard({ result, index }: { result: CaseStudyResult; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="text-center p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50"
    >
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        {getIcon(result.iconName, 'w-5 h-5')}
      </div>
      <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
        {result.metric}
      </div>
      <div className="font-medium text-foreground mb-1">{result.value}</div>
      <div className="text-sm text-muted-foreground">{result.description}</div>
    </motion.div>
  );
}

function BeforeAfterCard({ metric, index }: { metric: CaseStudyMetric; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/30"
    >
      <div className="flex-1">
        <div className="text-sm text-muted-foreground mb-1">{metric.label}</div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground line-through">{metric.before}</span>
          <ArrowRight className="w-4 h-4 text-primary" />
          <span className="font-bold text-primary">{metric.after}</span>
        </div>
      </div>
      <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">
        {metric.improvement}
      </div>
    </motion.div>
  );
}

function FeatureCard({ feature, index }: { feature: CaseStudyFeature; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="p-5 rounded-xl bg-card/60 border border-border/50"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {getIcon(feature.iconName, 'w-5 h-5')}
      </div>
      <h4 className="font-semibold mb-2">{feature.title}</h4>
      <p className="text-sm text-muted-foreground">{feature.description}</p>
    </motion.div>
  );
}

function TimelineStep({ step, index, isLast }: { step: CaseStudyStep; index: number; isLast: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="flex items-start gap-4"
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary font-bold text-sm">
          {step.step}
        </div>
        {!isLast && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-primary/20" />
        )}
      </div>
      <div className="flex-1 pt-1">
        <h4 className="font-semibold mb-1">{step.title}</h4>
        <p className="text-sm text-muted-foreground">{step.description}</p>
      </div>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export default function CaseStudyContent({ study }: { study: CaseStudyDetail }) {
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
              <span className="font-bold text-lg">BIM Carbon</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/case-studies"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('caseStudies.detail.allCaseStudies')}
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  {t('caseStudies.detail.signIn')}
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/case-studies" className="hover:text-foreground transition-colors">
                {t('caseStudies.title')}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span>{study.category}</span>
            </div>

            {/* Category Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
              {getIcon(study.categoryIconName, 'w-5 h-5')}
              <span>{study.category}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {study.title}
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {study.titleTh}
            </p>

            {/* Subtitle */}
            <p className="text-lg text-muted-foreground mb-8">
              {study.subtitle}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{study.company}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{study.companySize}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{study.readTime}</span>
              </div>
            </div>

            {/* Share/Download */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                {t('caseStudies.detail.share')}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                {t('caseStudies.detail.downloadPdf')}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {study.results.map((result, index) => (
              <ResultCard key={index} result={result} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Challenge Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">{study.challenge.title}</h2>
            </div>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {study.challenge.description}
            </p>
            <div className="bg-card/60 rounded-2xl border border-border/50 p-6">
              <h3 className="font-semibold mb-4">{t('caseStudies.detail.keyPainPoints')}</h3>
              <ul className="space-y-3">
                {study.challenge.painPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">{study.solution.title}</h2>
            </div>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {study.solution.description}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {study.solution.features.map((feature, index) => (
                <FeatureCard key={index} feature={feature} index={index} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Implementation Timeline */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">{study.implementation.title}</h2>
            </div>
            <p className="text-muted-foreground mb-8">
              <span className="font-medium text-foreground">{t('caseStudies.detail.timeline')}:</span> {study.implementation.timeline}
            </p>
            <div className="space-y-8">
              {study.implementation.steps.map((step, index) => (
                <TimelineStep
                  key={index}
                  step={step}
                  index={index}
                  isLast={index === study.implementation.steps.length - 1}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Outcomes Section */}
      <section className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">{study.outcomes.title}</h2>
            </div>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {study.outcomes.description}
            </p>
            <div className="space-y-3">
              {study.outcomes.metrics.map((metric, index) => (
                <BeforeAfterCard key={index} metric={metric} index={index} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-purple-500/5 border border-primary/20"
          >
            <Quote className="absolute top-6 left-6 w-12 h-12 text-primary/20" />
            <div className="relative z-10">
              <blockquote className="text-xl md:text-2xl font-medium mb-4 leading-relaxed">
                &quot;{study.testimonial.quote}&quot;
              </blockquote>
              <p className="text-muted-foreground mb-6 italic">
                {study.testimonial.quoteTh}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                  {study.testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{study.testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {study.testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Takeaways */}
      <section className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-8">{t('caseStudies.detail.keyTakeaways')}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {study.keyTakeaways.map((takeaway, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-card/60 border border-border/50"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm">{takeaway}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('caseStudies.detail.readyTitle')}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                {t('caseStudies.detail.readyDescription', { company: study.company.split(' ')[0] })}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button variant="gradient" size="lg" glow shine className="group">
                    <Leaf className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {t('caseStudies.detail.startFreeAnalysis')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/case-studies">
                  <Button variant="outline" size="lg">
                    {t('caseStudies.cta.readMoreCaseStudies')}
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
              <Link href="/case-studies" className="hover:text-foreground transition-colors">
                {t('caseStudies.title')}
              </Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">
                {t('caseStudies.nav.pricing')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
