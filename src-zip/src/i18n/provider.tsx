'use client';

/**
 * i18n Context Provider
 *
 * Provides translation context throughout the app.
 * Uses default locale on initial render to avoid hydration mismatch,
 * then syncs with localStorage after mount.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
import {
  Locale,
  defaultLocale,
  setStoredLocale,
  t,
  locales,
  localeNames,
} from './index';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  locales: readonly Locale[];
  localeNames: Record<Locale, string>;
}

const I18nContext = createContext<I18nContextType | null>(null);

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

/**
 * Get stored locale from browser (only call on client after mount)
 */
function getClientLocale(): Locale | null {
  if (typeof window === 'undefined') return null;

  try {
    // Check localStorage
    const stored = localStorage.getItem('locale');
    if (stored && (stored === 'en' || stored === 'th')) {
      return stored;
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'th') return 'th';
  } catch {
    // localStorage not available
  }

  return null;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  // IMPORTANT: Always start with default locale to avoid hydration mismatch
  // The locale will be synced with localStorage after mount
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale);
  const hasMounted = useRef(false);

  // Sync locale from localStorage AFTER hydration completes
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    const clientLocale = getClientLocale();
    if (clientLocale && clientLocale !== locale) {
      setLocaleState(clientLocale);
    }
  }, [locale]);

  // Update HTML lang attribute when locale changes
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
  }, []);

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return t(locale, key, params);
    },
    [locale]
  );

  const value = useMemo<I18nContextType>(() => ({
    locale,
    setLocale,
    t: translate,
    locales,
    localeNames,
  }), [locale, setLocale, translate]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to access i18n context
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

/**
 * Hook to get just the translation function
 */
export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}
