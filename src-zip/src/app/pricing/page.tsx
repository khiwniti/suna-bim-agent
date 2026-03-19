'use client';

/**
 * Pricing Page - SMB-Focused Pricing Tiers
 *
 * Key Strategy (from competitive analysis):
 * - Position against enterprise tools (Vekin ฿50,000+/month)
 * - Target 99% of Thai contractors who are SMBs
 * - Free tier for adoption, Pro for growing firms, Enterprise for large projects
 *
 * ★ Insight ─────────────────────────────────────
 * Thai SMB contractors (117,000+ firms) are underserved by carbon tools.
 * Our pricing creates a 10x+ cost advantage vs consultants while
 * delivering similar value through AI automation.
 * ─────────────────────────────────────────────────
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Check,
  X,
  Sparkles,
  Building2,
  Leaf,
  Zap,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Calculator,
  FileText,
  Users,
  Shield,
  BarChart3,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/provider';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';

// ============================================
// Types
// ============================================

interface PricingTier {
  id: string;
  name: string;
  nameTh: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  currency: string;
  popular?: boolean;
  features: PricingFeature[];
  cta: {
    text: string;
    href: string;
    variant: 'primary' | 'outline' | 'gradient';
  };
  badge?: string;
}

interface PricingFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
  tooltip?: string;
}

interface FAQ {
  question: string;
  answer: string;
}

// ============================================
// Pricing Data
// ============================================

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    nameTh: 'ฟรี',
    description: 'Perfect for trying out carbon analysis on small projects',
    price: {
      monthly: 0,
      yearly: 0,
    },
    currency: '฿',
    features: [
      { text: '3 projects per month', included: true },
      { text: 'Quick carbon calculator', included: true },
      { text: '104+ Thai materials database', included: true },
      { text: 'Basic PDF reports', included: true },
      { text: 'AI chat assistance', included: true, tooltip: 'Limited to 50 messages/month' },
      { text: 'IFC file upload (up to 10MB)', included: true },
      { text: 'Email support', included: true },
      { text: 'TGO-compliant reports', included: false },
      { text: 'TREES documentation', included: false },
      { text: 'Team collaboration', included: false },
      { text: 'API access', included: false },
      { text: 'Custom branding', included: false },
    ],
    cta: {
      text: 'Start Free',
      href: '/auth/signup',
      variant: 'outline',
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    nameTh: 'โปร',
    description: 'For growing contractors and sustainability consultants',
    price: {
      monthly: 1990,
      yearly: 19900,
    },
    currency: '฿',
    popular: true,
    badge: 'Most Popular',
    features: [
      { text: 'Unlimited projects', included: true, highlight: true },
      { text: 'Quick carbon calculator', included: true },
      { text: '104+ Thai materials database', included: true },
      { text: 'Professional PDF reports', included: true, highlight: true },
      { text: 'Unlimited AI chat assistance', included: true, highlight: true },
      { text: 'IFC file upload (up to 100MB)', included: true },
      { text: 'Priority email support', included: true },
      { text: 'TGO-compliant reports', included: true, highlight: true },
      { text: 'TREES documentation', included: true, highlight: true },
      { text: 'Team collaboration (up to 5)', included: true },
      { text: 'API access', included: false },
      { text: 'Custom branding', included: false },
    ],
    cta: {
      text: 'Start Pro Trial',
      href: '/auth/signup?plan=pro',
      variant: 'gradient',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    nameTh: 'องค์กร',
    description: 'For large developers and construction firms',
    price: {
      monthly: 9900,
      yearly: 99000,
    },
    currency: '฿',
    badge: 'Best Value',
    features: [
      { text: 'Unlimited projects', included: true },
      { text: 'Quick carbon calculator', included: true },
      { text: '104+ Thai materials database', included: true },
      { text: 'White-label PDF reports', included: true, highlight: true },
      { text: 'Unlimited AI chat assistance', included: true },
      { text: 'IFC file upload (unlimited)', included: true, highlight: true },
      { text: 'Dedicated support manager', included: true, highlight: true },
      { text: 'TGO-compliant reports', included: true },
      { text: 'TREES documentation', included: true },
      { text: 'Unlimited team members', included: true, highlight: true },
      { text: 'Full API access', included: true, highlight: true },
      { text: 'Custom branding', included: true, highlight: true },
    ],
    cta: {
      text: 'Contact Sales',
      href: '/contact?plan=enterprise',
      variant: 'primary',
    },
  },
];

const FAQS: FAQ[] = [
  {
    question: 'What is included in the free tier?',
    answer: 'The free tier includes 3 projects per month, access to our 104+ Thai material database, basic PDF reports, and limited AI chat assistance. It\'s perfect for trying out the platform or for small projects.',
  },
  {
    question: 'Can I switch plans anytime?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll get immediate access to new features. When downgrading, changes take effect at the next billing cycle.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, bank transfers, and PromptPay. Enterprise customers can also pay via invoice with NET 30 terms.',
  },
  {
    question: 'Is there a discount for annual billing?',
    answer: 'Yes! You save approximately 17% when you choose annual billing. The Pro plan is ฿19,900/year (vs ฿23,880 monthly) and Enterprise is ฿99,000/year (vs ฿118,800 monthly).',
  },
  {
    question: 'What file formats do you support?',
    answer: 'We support IFC (Industry Foundation Classes), PDF floor plans, DWG files, and common image formats. Our AI can extract building data from most architectural documents.',
  },
  {
    question: 'Are the emission factors Thailand-specific?',
    answer: 'Yes! Our database includes 104+ materials with emission factors from TGO (Thailand Greenhouse Gas Management Organization), MTEC, and SCG EPDs. This provides more accurate results than international databases.',
  },
  {
    question: 'Can I use the reports for TREES certification?',
    answer: 'Pro and Enterprise plans include TREES-compliant documentation that can be submitted as part of your green building certification application.',
  },
  {
    question: 'Do you offer training or onboarding?',
    answer: 'Enterprise customers receive dedicated onboarding and training sessions. Pro users have access to our video tutorials and documentation. All users can access our AI chat for guidance.',
  },
];

// ============================================
// Components
// ============================================

function PricingCard({ tier, isYearly, locale }: { tier: PricingTier; isYearly: boolean; locale: string }) {
  const price = isYearly ? tier.price.yearly : tier.price.monthly;
  const period = isYearly ? '/year' : '/month';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={cn(
        'relative rounded-2xl border bg-card/60 backdrop-blur-xl overflow-hidden',
        tier.popular
          ? 'border-primary shadow-xl shadow-primary/20 scale-105 z-10'
          : 'border-border/50'
      )}
    >
      {/* Popular badge */}
      {tier.badge && (
        <div
          className={cn(
            'absolute top-0 right-0 px-4 py-1 text-xs font-semibold rounded-bl-xl',
            tier.popular
              ? 'bg-primary text-primary-foreground'
              : 'bg-accent text-accent-foreground'
          )}
        >
          {tier.badge}
        </div>
      )}

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-1">{locale === 'th' ? tier.nameTh : tier.name}</h3>
          <p className="text-sm text-muted-foreground">{tier.description}</p>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl md:text-5xl font-bold">
              {price === 0 ? 'Free' : `${tier.currency}${price.toLocaleString()}`}
            </span>
            {price > 0 && (
              <span className="text-muted-foreground">{period}</span>
            )}
          </div>
          {isYearly && tier.price.monthly > 0 && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Save {tier.currency}
              {((tier.price.monthly * 12) - tier.price.yearly).toLocaleString()}/year
            </p>
          )}
        </div>

        {/* CTA */}
        <Link href={tier.cta.href} className="block mb-6">
          <Button
            variant={tier.cta.variant as 'primary' | 'outline' | 'gradient'}
            size="lg"
            className="w-full"
            glow={tier.popular}
            shine={tier.popular}
          >
            {tier.cta.text}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>

        {/* Features */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Features
          </p>
          {tier.features.map((feature, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-3 text-sm',
                !feature.included && 'opacity-50'
              )}
            >
              {feature.included ? (
                <Check
                  className={cn(
                    'w-4 h-4 mt-0.5 shrink-0',
                    feature.highlight
                      ? 'text-primary'
                      : 'text-green-600 dark:text-green-400'
                  )}
                />
              ) : (
                <X className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              )}
              <span className={feature.highlight ? 'font-medium' : ''}>
                {feature.text}
              </span>
              {feature.tooltip && (
                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function FAQItem({ faq, index }: { faq: FAQ; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="border-b border-border/50 last:border-0"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="font-medium pr-4">{faq.question}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-muted-foreground transition-transform shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-muted-foreground">{faq.answer}</p>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Page Component
// ============================================

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);
  const { t, locale } = useTranslation();

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
                {t('nav.calculator')}
              </Link>
              <LanguageSwitcher variant="minimal" />
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  {t('nav.signIn')}
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>{t('pricing.title')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t('landing.comparisonSection.title')}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                {t('landing.comparisonSection.titleHighlight')}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {t('pricing.subtitle')}
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1.5 rounded-full bg-muted/50 border border-border/50">
              <button
                onClick={() => setIsYearly(false)}
                className={cn(
                  'px-6 py-2 rounded-full text-sm font-medium transition-all',
                  !isYearly
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t('pricing.monthly')}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={cn(
                  'px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                  isYearly
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t('pricing.yearly')}
                <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs">
                  {t('pricing.yearlyDiscount')}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6 md:gap-4 items-start">
            {PRICING_TIERS.map((tier) => (
              <PricingCard key={tier.id} tier={tier} isYearly={isYearly} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison with Competitors */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
              <BarChart3 className="w-4 h-4" />
              Cost Comparison
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How We Compare
            </h2>
            <p className="text-muted-foreground">
              See how BIM Carbon stacks up against traditional carbon consultants
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Carbon Consultants',
                price: '฿50,000 - ฿200,000',
                period: 'per project',
                time: '2-4 weeks',
                cons: ['Long turnaround', 'High cost', 'Limited revisions'],
              },
              {
                icon: <Building2 className="w-6 h-6" />,
                title: 'Enterprise Software',
                price: '฿50,000+',
                period: 'per month',
                time: '2-4 weeks setup',
                cons: ['Training required', 'Annual contracts', 'Complex setup'],
              },
              {
                icon: <Leaf className="w-6 h-6" />,
                title: 'BIM Carbon',
                price: '฿0 - ฿9,900',
                period: 'per month',
                time: '15 minutes',
                pros: ['Instant results', 'Thai data', 'No training needed'],
                highlight: true,
              },
            ].map((option, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  'p-6 rounded-2xl border',
                  option.highlight
                    ? 'bg-primary/5 border-primary shadow-lg'
                    : 'bg-card/60 border-border/50'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                    option.highlight
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {option.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{option.title}</h3>
                <div className="text-2xl font-bold mb-1">{option.price}</div>
                <div className="text-sm text-muted-foreground mb-4">
                  {option.period}
                </div>
                <div className="text-sm mb-4">
                  <span className="text-muted-foreground">Time to results: </span>
                  <span className={option.highlight ? 'text-green-600 font-medium' : ''}>
                    {option.time}
                  </span>
                </div>
                {option.cons && (
                  <div className="space-y-2">
                    {option.cons.map((con, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <X className="w-4 h-4 text-red-500" />
                        {con}
                      </div>
                    ))}
                  </div>
                )}
                {option.pros && (
                  <div className="space-y-2">
                    {option.pros.map((pro, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600" />
                        {pro}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {[
              { icon: <Shield className="w-6 h-6" />, text: 'TGO Certified Data' },
              { icon: <FileText className="w-6 h-6" />, text: 'TREES Compliant' },
              { icon: <Globe className="w-6 h-6" />, text: 'Thai & English' },
              { icon: <Zap className="w-6 h-6" />, text: '15-min Analysis' },
            ].map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 text-muted-foreground"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {badge.icon}
                </div>
                <span className="font-medium">{badge.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about BIM Carbon pricing
            </p>
          </motion.div>

          <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/50 p-6 md:p-8">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
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
                <Calculator className="w-8 h-8 text-white" />
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Start Free Today
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                No credit card required. Start analyzing your projects in minutes
                and upgrade when you&apos;re ready.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button variant="gradient" size="lg" glow shine className="group">
                    <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Create Free Account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/calculator">
                  <Button variant="outline" size="lg">
                    <Calculator className="w-5 h-5" />
                    Try Calculator First
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
                © 2025 BIM Carbon. Built for Thai Construction.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/calculator" className="hover:text-foreground transition-colors">
                Calculator
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
