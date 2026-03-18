'use client';

/**
 * Language Switcher Component for Carbon BIM
 *
 * Provides a dropdown to switch between available languages.
 * Uses next-intl's locale routing for language changes.
 */

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type Locale = 'en' | 'th';

const locales: readonly Locale[] = ['en', 'th'];
const localeNames: Record<Locale, string> = {
  en: 'English',
  th: 'ไทย',
};

interface LanguageSwitcherProps {
  variant?: 'default' | 'minimal' | 'button';
  className?: string;
}

export function LanguageSwitcher({ variant = 'default', className }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newLocale: Locale) => {
    setIsOpen(false);
    if (newLocale !== locale) {
      // For next-intl with App Router, we need to navigate to the new locale path
      // This assumes URL-based locale switching
      const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
      router.push(newPath);
    }
  };

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => handleSelect(loc)}
            className={cn(
              'px-2 py-1 text-sm rounded transition-colors',
              locale === loc
                ? 'bg-[var(--carbon-primary)] text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            )}
          >
            {loc.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={() => handleSelect(locale === 'en' ? 'th' : 'en')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
          'bg-white/10 hover:bg-white/20 transition-colors text-white/80 hover:text-white',
          className
        )}
      >
        <Globe className="w-4 h-4" />
        <span>{localeNames[locale]}</span>
      </button>
    );
  }

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
          'bg-white/10 hover:bg-white/20 transition-colors text-white/80',
          isOpen && 'bg-white/20'
        )}
      >
        <Globe className="w-4 h-4" />
        <span>{localeNames[locale]}</span>
        <svg
          className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-1 py-1 bg-zinc-900/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg min-w-[120px] z-50"
          >
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => handleSelect(loc)}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm transition-colors',
                  locale === loc
                    ? 'bg-[var(--carbon-primary)]/20 text-[var(--carbon-primary)]'
                    : 'hover:bg-white/10 text-white/80'
                )}
              >
                {localeNames[loc]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
