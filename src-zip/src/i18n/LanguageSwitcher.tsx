'use client';

/**
 * Language Switcher Component
 *
 * Dropdown to switch between available languages
 */

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from './provider';
import { Locale } from './index';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'default' | 'minimal' | 'button';
  className?: string;
}

export function LanguageSwitcher({ variant = 'default', className }: LanguageSwitcherProps) {
  const { locale, setLocale, locales, localeNames } = useI18n();
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
    setLocale(newLocale);
    setIsOpen(false);
  };

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => setLocale(loc)}
            className={cn(
              'px-2 py-1 text-sm rounded transition-colors',
              locale === loc
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
        onClick={() => setLocale(locale === 'en' ? 'th' : 'en')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
          'bg-secondary hover:bg-secondary/80 transition-colors',
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
          'bg-secondary hover:bg-secondary/80 transition-colors',
          isOpen && 'bg-secondary/80'
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
            className="absolute top-full right-0 mt-1 py-1 bg-card border border-border rounded-lg shadow-lg min-w-[120px] z-50"
          >
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => handleSelect(loc)}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm transition-colors',
                  locale === loc
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-foreground'
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
