'use client';

/**
 * LandingPage - Carbon-Focused Landing Experience
 *
 * Key Messages (from Implementation Plan):
 * - Primary: "Calculate Your Project's Carbon Footprint in Minutes, Not Months"
 * - Secondary: "No consultants. No enterprise software. Just upload your BIM model."
 * - CTA: "Try Free - No Credit Card Required"
 *
 * ★ Insight ─────────────────────────────────────
 * This redesign targets Thai SMB contractors (99% of 117,000+ firms)
 * who are underserved by enterprise carbon tools like Vekin.
 * Focus on speed, simplicity, and Thai-specific data sources.
 * ─────────────────────────────────────────────────
 */

import { useState, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Building2,
  Sparkles,
  ArrowRight,
  Zap,
  Leaf,
  FileText,
  Upload,
  ChevronRight,
  Star,
  Calculator,
  Clock,
  Shield,
  TrendingDown,
  Award,
  Users,
  CheckCircle2,
  ArrowDown,
  BarChart3,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { useFileUpload } from '@/hooks/useFileUpload';
import { UploadProgress } from '@/components/chat/UploadProgress';

interface LandingPageProps {
  onStartChat: (message: string) => void;
  onUploadFloorPlan?: () => void;
}

// Pre-computed particle positions (deterministic for SSR hydration)
const PARTICLE_POSITIONS = [
  { x: 5, y: 10, size: 3, duration: 15, delay: 0.5 },
  { x: 15, y: 25, size: 2, duration: 18, delay: 1.2 },
  { x: 25, y: 40, size: 4, duration: 14, delay: 2.0 },
  { x: 35, y: 55, size: 2, duration: 20, delay: 0.8 },
  { x: 45, y: 70, size: 3, duration: 16, delay: 3.1 },
  { x: 55, y: 15, size: 2, duration: 19, delay: 1.7 },
  { x: 65, y: 30, size: 4, duration: 15, delay: 2.4 },
  { x: 75, y: 45, size: 2, duration: 22, delay: 0.3 },
  { x: 85, y: 60, size: 3, duration: 17, delay: 4.2 },
  { x: 95, y: 75, size: 2, duration: 14, delay: 1.5 },
  { x: 10, y: 85, size: 3, duration: 16, delay: 2.8 },
  { x: 20, y: 5, size: 2, duration: 21, delay: 0.9 },
  { x: 30, y: 20, size: 4, duration: 18, delay: 3.5 },
  { x: 40, y: 35, size: 2, duration: 15, delay: 1.1 },
  { x: 50, y: 50, size: 3, duration: 17, delay: 4.0 },
  { x: 60, y: 65, size: 2, duration: 20, delay: 2.2 },
  { x: 70, y: 80, size: 4, duration: 16, delay: 0.6 },
  { x: 80, y: 95, size: 2, duration: 14, delay: 3.3 },
  { x: 90, y: 8, size: 3, duration: 19, delay: 1.8 },
  { x: 100, y: 22, size: 2, duration: 17, delay: 2.6 },
];

// Floating particles with glow effect
function FloatingParticles() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLE_POSITIONS.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, rgba(16, 185, 129, 0.6) 0%, rgba(6, 182, 212, 0.3) 50%, transparent 100%)`,
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
          }}
          initial={{
            x: `${particle.x}%`,
            y: `${particle.y}%`,
          }}
          animate={{
            y: [null, '-30%', '130%'],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// Animated gradient orb with blur
function GradientOrb({ className, colors }: { className?: string; colors: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        className={cn(
          'absolute rounded-full blur-[100px] opacity-30',
          className
        )}
        style={{ background: colors }}
      />
    );
  }

  return (
    <motion.div
      className={cn(
        'absolute rounded-full blur-[100px] opacity-40',
        className
      )}
      style={{ background: colors }}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.3, 0.5, 0.3],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

// Mesh gradient background
function MeshGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(at 40% 20%, hsla(160, 84%, 39%, 0.3) 0px, transparent 50%),
            radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.2) 0px, transparent 50%),
            radial-gradient(at 0% 50%, hsla(160, 84%, 39%, 0.2) 0px, transparent 50%),
            radial-gradient(at 80% 50%, hsla(270, 76%, 70%, 0.15) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(189, 100%, 56%, 0.2) 0px, transparent 50%),
            radial-gradient(at 80% 100%, hsla(160, 84%, 39%, 0.15) 0px, transparent 50%)
          `,
        }}
      />
    </div>
  );
}

// Value Proposition Card
function ValueCard({
  icon,
  title,
  description,
  highlight,
  delay,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
  delay: number;
  index: number;
}) {
  const colors = [
    'from-emerald-500/20 to-cyan-500/20',
    'from-cyan-500/20 to-blue-500/20',
    'from-blue-500/20 to-purple-500/20',
    'from-purple-500/20 to-emerald-500/20',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative"
    >
      <div className={cn(
        'absolute -inset-px rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl',
        colors[index % 4]
      )} />

      <div className="relative p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-500 h-full">
        <div className={cn(
          'absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
          colors[index % 4]
        )} />

        <div className="relative z-10">
          <motion.div
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white mb-5 shadow-lg shadow-primary/25"
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {icon}
          </motion.div>
          <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {description}
          </p>
          {highlight && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <CheckCircle2 className="w-3 h-3" />
              {highlight}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Comparison Card
function ComparisonRow({
  feature,
  us,
  others,
  delay,
}: {
  feature: string;
  us: string;
  others: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="grid grid-cols-3 gap-4 py-4 border-b border-border/30 last:border-0"
    >
      <div className="font-medium text-sm">{feature}</div>
      <div className="text-center">
        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          {us}
        </span>
      </div>
      <div className="text-center text-muted-foreground text-sm">{others}</div>
    </motion.div>
  );
}

// Testimonial Card
function TestimonialCard({
  quote,
  author,
  role,
  company,
  delay,
}: {
  quote: string;
  author: string;
  role: string;
  company: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      className="p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50"
    >
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-muted-foreground mb-4 italic">&ldquo;{quote}&rdquo;</p>
      <div>
        <div className="font-semibold">{author}</div>
        <div className="text-sm text-muted-foreground">
          {role}, {company}
        </div>
      </div>
    </motion.div>
  );
}

// How It Works Step
function HowItWorksStep({
  step,
  icon,
  title,
  description,
  index,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-6 group"
    >
      <div className="relative">
        {index < 2 && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-primary/50 to-transparent" />
        )}

        <motion.div
          className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent group-hover:text-white transition-all duration-500"
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          {icon}
        </motion.div>
      </div>

      <div className="flex-1 pt-2">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {step}
          </span>
          <h3 className="font-bold text-lg group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
        </div>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// Stat Counter
function StatCounter({
  value,
  label,
  icon,
  delay,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="text-center group"
    >
      <motion.div
        className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center text-primary"
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        {icon}
      </motion.div>
      <motion.div
        className="text-3xl md:text-4xl font-bold gradient-text mb-1"
        whileHover={{ scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        {value}
      </motion.div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </motion.div>
  );
}

export function LandingPage({ onStartChat, onUploadFloorPlan }: LandingPageProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // File upload hook
  const {
    openFilePicker,
    dropZoneProps,
    isDragActive,
    uploadState,
    progress,
    currentFile,
    error: uploadError,
    cancel: cancelUpload,
  } = useFileUpload({
    autoActivatePanel: true,
    onUploadComplete: (result) => {
      if (result.success) {
        onStartChat(`I've uploaded ${result.filename}. Please analyze this file.`);
      }
    },
    onError: (err) => {
      console.error('Upload error:', err.message);
    },
  });

  // Carbon-focused suggestions - using translation keys
  const suggestions = [
    { icon: '🌱', textKey: 'landing.suggestions.embodiedCarbon' },
    { icon: '📊', textKey: 'landing.suggestions.compareMaterials' },
    { icon: '🏗️', textKey: 'landing.suggestions.analyzeIfc' },
    { icon: '📋', textKey: 'landing.suggestions.generateReport' },
  ];

  // Value propositions - carbon focused - using translation keys
  const valueProps = [
    {
      icon: <Clock className="w-5 h-5" />,
      titleKey: 'landing.valueProps.minutesNotMonths.title',
      descriptionKey: 'landing.valueProps.minutesNotMonths.description',
      highlightKey: 'landing.valueProps.minutesNotMonths.highlight',
    },
    {
      icon: <Calculator className="w-5 h-5" />,
      titleKey: 'landing.valueProps.thaiMaterials.title',
      descriptionKey: 'landing.valueProps.thaiMaterials.description',
      highlightKey: 'landing.valueProps.thaiMaterials.highlight',
    },
    {
      icon: <TrendingDown className="w-5 h-5" />,
      titleKey: 'landing.valueProps.aiOptimization.title',
      descriptionKey: 'landing.valueProps.aiOptimization.description',
      highlightKey: 'landing.valueProps.aiOptimization.highlight',
    },
    {
      icon: <Award className="w-5 h-5" />,
      titleKey: 'landing.valueProps.tgoReady.title',
      descriptionKey: 'landing.valueProps.tgoReady.description',
      highlightKey: 'landing.valueProps.tgoReady.highlight',
    },
  ];

  // Comparison data - using translation keys
  const comparisonKeys = [
    'setupTime',
    'monthlyCost',
    'thaiMaterials',
    'aiRecommendations',
    'learningCurve',
  ];

  // Testimonials - using translation keys
  const testimonialKeys = ['testimonial1', 'testimonial2', 'testimonial3'];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onStartChat(inputValue.trim());
  };

  const handleSuggestionClick = (text: string) => {
    onStartChat(text);
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      {/* Background effects */}
      <MeshGradient />
      <FloatingParticles />
      <GradientOrb
        className="w-[800px] h-[800px] -top-96 -left-96"
        colors="linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(6, 182, 212, 0.3) 100%)"
      />
      <GradientOrb
        className="w-[600px] h-[600px] -bottom-64 -right-64"
        colors="linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%)"
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3"
        >
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-accent to-purple-500 flex items-center justify-center shadow-lg shadow-primary/30"
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Leaf className="w-5 h-5 text-white" />
          </motion.div>
          <span className="font-bold text-xl gradient-text">BIM Carbon</span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            🇹🇭 Thailand
          </span>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:flex items-center gap-8"
        >
          {[
            { key: 'calculator', href: '/calculator' },
            { key: 'features', href: '#features' },
            { key: 'howItWorks', href: '#how-it-works' },
            { key: 'pricing', href: '#pricing' },
          ].map((item) => (
            <motion.a
              key={item.key}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 relative group"
              whileHover={{ y: -2 }}
            >
                            {t(`nav.${item.key}`)}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300" />
            </motion.a>
          ))}
          <LanguageSwitcher variant="minimal" />
          <Button variant="primary" size="sm" shine>
            {t('common.tryFree')}
          </Button>
        </motion.nav>
      </header>

      {/* Hero Section - Carbon Focused */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 md:pt-24 pb-16 max-w-5xl mx-auto">
        {/* Hero badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8 relative"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-cyan-500/10 border border-green-500/20" />
          <Leaf className="relative w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="relative text-green-700 dark:text-green-300 font-medium">
            {t('landing.hero.badge')}
          </span>
          <ChevronRight className="relative w-4 h-4 text-green-600 dark:text-green-400" />
        </motion.div>

        {/* Hero title - Primary Message */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-center leading-[1.1] mb-6"
        >
          <span>{t('landing.hero.title')}</span>
          <br />
          <span className="gradient-text">Carbon Footprint</span>
          <br />
          <span className="text-3xl md:text-4xl lg:text-5xl">
            {t('landing.hero.titleHighlight')}
          </span>
        </motion.h1>

        {/* Hero subtitle - Secondary Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground text-center max-w-2xl mb-8 leading-relaxed"
        >
          {t('landing.hero.subtitle')}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <Button
            variant="gradient"
            size="xl"
            glow
            shine
            onClick={() => onStartChat('Analyze carbon footprint of my building project')}
            className="group"
          >
            <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {t('landing.hero.cta')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Link href="/calculator">
            <Button variant="outline" size="xl" className="group w-full sm:w-auto">
              <Calculator className="w-5 h-5" />
              {t('nav.calculator')}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground mb-12"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            <span>{t('landing.hero.trustBadges.tgoData')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-green-600" />
            <span>{t('landing.hero.trustBadges.treesAligned')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-green-600" />
            <span>{t('landing.hero.trustBadges.bilingualSupport')}</span>
          </div>
        </motion.div>

        {/* Main chat input */}
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="w-full max-w-2xl"
          {...dropZoneProps}
        >
          <div
            className={cn(
              'relative rounded-2xl transition-all duration-500',
              isInputFocused || isDragActive
                ? 'shadow-2xl shadow-primary/20'
                : 'shadow-xl shadow-black/5',
              isDragActive && 'ring-2 ring-primary ring-inset'
            )}
          >
            {/* Drag overlay */}
            <AnimatePresence>
              {isDragActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center rounded-2xl"
                >
                  <div className="p-8 border-2 border-dashed border-primary rounded-xl text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <p className="text-lg font-medium">{t('landing.hero.dropFilesHere') || 'Drop files here'}</p>
                    <p className="text-sm text-muted-foreground">IFC, PDF, Excel, Images</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isInputFocused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-primary via-accent to-purple-500 opacity-60 blur-sm animate-gradient"
                  style={{ backgroundSize: '200% 200%' }}
                />
              )}
            </AnimatePresence>

            <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 overflow-hidden">
              <div className="flex items-start gap-4 p-5">
                <motion.div
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 mt-0.5"
                  animate={isInputFocused ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Leaf className="w-5 h-5 text-white" />
                </motion.div>

                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder={t('landing.hero.inputPlaceholder')}
                  rows={1}
                  className="flex-1 bg-transparent resize-none outline-none text-base md:text-lg placeholder:text-muted-foreground/50 min-h-[28px] pt-1"
                />

                <Button
                  type="submit"
                  variant={inputValue.trim() ? 'primary' : 'secondary'}
                  size="icon"
                  disabled={!inputValue.trim()}
                  className={cn(
                    'flex-shrink-0 transition-all duration-300',
                    inputValue.trim() && 'glow-sm'
                  )}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Upload progress */}
              {uploadState !== 'idle' && currentFile && (
                <UploadProgress
                  filename={currentFile.name}
                  fileSize={currentFile.size}
                  progress={progress}
                  targetPanel={currentFile.targetPanel}
                  status={uploadState === 'uploading' ? 'uploading' : uploadState === 'success' ? 'success' : 'error'}
                  error={uploadError ?? undefined}
                  onCancel={cancelUpload}
                  onRetry={() => {}}
                />
              )}

              <div className="flex items-center gap-3 px-5 pb-4 pt-0">
                <motion.button
                  type="button"
                  onClick={openFilePicker}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-300"
                  disabled={uploadState === 'uploading'}
                >
                  <Upload className="w-4 h-4" />
                  <span>{t('landing.hero.uploadModel')}</span>
                </motion.button>
                <span className="text-xs text-muted-foreground/40">•</span>
                <span className="text-xs text-muted-foreground/40">{t('landing.hero.supportedFormats')}</span>
              </div>
            </div>
          </div>
        </motion.form>

        {/* Quick suggestions */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {suggestions.map((suggestion, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSuggestionClick(t(suggestion.textKey))}
              className="group relative flex items-center gap-2.5 px-5 py-3 rounded-full text-sm font-medium transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-card to-secondary border border-border/60 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all duration-300" />
              <span className="relative text-lg">{suggestion.icon}</span>
              <span className="relative">{t(suggestion.textKey)}</span>
              <ArrowRight className="relative w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-primary" />
            </motion.button>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 px-8 py-8 glass rounded-3xl"
        >
          <StatCounter
            value="104+"
            label={t('landing.stats.thaiMaterials')}
            icon={<BarChart3 className="w-5 h-5" />}
            delay={1.0}
          />
          <StatCounter
            value="15min"
            label={t('landing.stats.avgAnalysisTime')}
            icon={<Clock className="w-5 h-5" />}
            delay={1.1}
          />
          <StatCounter
            value="35%"
            label={t('landing.stats.avgCarbonSavings')}
            icon={<TrendingDown className="w-5 h-5" />}
            delay={1.2}
          />
          <StatCounter
            value="500+"
            label={t('landing.stats.projectsAnalyzed')}
            icon={<Building2 className="w-5 h-5" />}
            delay={1.3}
          />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-12"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-muted-foreground"
          >
            <span className="text-xs uppercase tracking-wider">{t('landing.stats.learnMore')}</span>
            <ArrowDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </main>

      {/* Value Propositions Section */}
      <section id="features" className="relative z-10 px-6 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
            >
              <Leaf className="w-4 h-4" />
              {t('landing.whyChooseUs.badge')}
            </motion.div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              {t('landing.whyChooseUs.title')}{' '}
              <span className="gradient-text">{t('landing.whyChooseUs.titleHighlight')}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.whyChooseUs.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {valueProps.map((prop, i) => (
              <ValueCard
                key={i}
                icon={prop.icon}
                title={t(prop.titleKey)}
                description={t(prop.descriptionKey)}
                highlight={t(prop.highlightKey)}
                delay={0.1 + i * 0.1}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="relative z-10 px-6 py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />

        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6"
            >
              <Zap className="w-4 h-4" />
              {t('landing.comparisonSection.badge')}
            </motion.div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              {t('landing.comparisonSection.title')}{' '}
              <span className="gradient-text">{t('landing.comparisonSection.titleHighlight')}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('landing.comparisonSection.subtitle')}
            </p>
          </motion.div>

          <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/50 p-6 md:p-8">
            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border mb-4">
              <div className="font-semibold">{t('landing.comparisonSection.featureColumn')}</div>
              <div className="text-center font-semibold text-primary">{t('landing.comparisonSection.usColumn')}</div>
              <div className="text-center font-semibold text-muted-foreground">{t('landing.comparisonSection.othersColumn')}</div>
            </div>
            {comparisonKeys.map((key, i) => (
              <ComparisonRow
                key={i}
                feature={t(`landing.comparisonSection.rows.${key}.feature`)}
                us={t(`landing.comparisonSection.rows.${key}.us`)}
                others={t(`landing.comparisonSection.rows.${key}.others`)}
                delay={0.1 + i * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 px-6 py-24 md:py-32">
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6"
            >
              <Zap className="w-4 h-4" />
              {t('landing.howItWorks.badge')}
            </motion.div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              {t('landing.howItWorks.title')}{' '}
              <span className="gradient-text">{t('landing.howItWorks.titleHighlight')}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('landing.howItWorks.subtitle')}
            </p>
          </motion.div>

          <div className="space-y-12">
            {[
              {
                step: '01',
                icon: <Upload className="w-6 h-6" />,
                titleKey: 'landing.howItWorks.step1.title',
                descriptionKey: 'landing.howItWorks.step1.description',
              },
              {
                step: '02',
                icon: <Sparkles className="w-6 h-6" />,
                titleKey: 'landing.howItWorks.step2.title',
                descriptionKey: 'landing.howItWorks.step2.description',
              },
              {
                step: '03',
                icon: <FileText className="w-6 h-6" />,
                titleKey: 'landing.howItWorks.step3.title',
                descriptionKey: 'landing.howItWorks.step3.description',
              },
            ].map((item, i) => (
              <HowItWorksStep
                key={i}
                step={item.step}
                icon={item.icon}
                title={t(item.titleKey)}
                description={t(item.descriptionKey)}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 px-6 py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />

        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm font-medium mb-6"
            >
              <Users className="w-4 h-4" />
              {t('landing.testimonials.badge')}
            </motion.div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              {t('landing.testimonials.title')}{' '}
              <span className="gradient-text">{t('landing.testimonials.titleHighlight')}</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonialKeys.map((key, i) => (
              <TestimonialCard
                key={i}
                quote={t(`landing.testimonials.items.${key}.quote`)}
                author={t(`landing.testimonials.items.${key}.author`)}
                role={t(`landing.testimonials.items.${key}.role`)}
                company={t(`landing.testimonials.items.${key}.company`)}
                delay={0.1 + i * 0.15}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="relative p-12 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-purple-500/10" />
            <div className="absolute inset-0 glass" />

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
                {t('landing.ctaSection.title')}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                {t('landing.ctaSection.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => onStartChat(t('landing.suggestions.embodiedCarbon'))}
                  variant="gradient"
                  size="lg"
                  glow
                  shine
                  className="group"
                >
                  <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {t('landing.ctaSection.cta')}
                </Button>
                <Link href="/calculator">
                  <Button variant="outline" size="lg">
                    <Calculator className="w-5 h-5" />
                    {t('nav.calculator')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-border/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Leaf className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-muted-foreground">
              {t('footer.copyright')}
            </span>
          </motion.div>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            {[
              { key: 'privacy', label: t('footer.privacy'), href: '/privacy' },
              { key: 'terms', label: t('footer.terms'), href: '/terms' },
              { key: 'contact', label: t('footer.contact'), href: '/contact' },
            ].map((item) => (
              <motion.a
                key={item.key}
                href={item.href}
                whileHover={{ color: 'var(--primary)' }}
                className="hover:text-foreground transition-colors duration-300"
              >
                {item.label}
              </motion.a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
