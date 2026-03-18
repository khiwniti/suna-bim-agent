'use client';

/**
 * i18n Provider Shim for Carbon BIM Landing Page
 *
 * Wraps next-intl's useTranslations to provide a compatible API
 * for the Carbon BIM LandingPage component.
 *
 * Supports multiple namespaces:
 * - landing.* - Landing page translations
 * - nav.* - Navigation translations
 * - footer.* - Footer translations
 * - common.* - Common translations
 */

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { ReactNode } from 'react';

type Locale = 'en' | 'th';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  locales: readonly Locale[];
  localeNames: Record<Locale, string>;
}

/**
 * Hook to get translation function compatible with Carbon BIM LandingPage
 * Supports keys from multiple namespaces: landing, nav, footer, common
 */
export function useTranslation() {
  const tLanding = useTranslations('landing');
  const tNav = useTranslations('nav');
  const tFooter = useTranslations('footer');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;

  // Create a wrapper that handles keys from multiple namespaces
  const t = (key: string, params?: Record<string, string | number>) => {
    try {
      // Determine which namespace to use based on key prefix
      if (key.startsWith('landing.')) {
        const subKey = key.replace('landing.', '');
        // @ts-expect-error - next-intl types are strict about keys
        return tLanding(subKey, params);
      } else if (key.startsWith('nav.')) {
        const subKey = key.replace('nav.', '');
        // @ts-expect-error - next-intl types are strict about keys
        return tNav(subKey, params);
      } else if (key.startsWith('footer.')) {
        const subKey = key.replace('footer.', '');
        // @ts-expect-error - next-intl types are strict about keys
        return tFooter(subKey, params);
      } else if (key.startsWith('common.')) {
        const subKey = key.replace('common.', '');
        // @ts-expect-error - next-intl types are strict about keys
        return tCommon(subKey, params);
      } else {
        // Default to landing namespace for backwards compatibility
        // @ts-expect-error - next-intl types are strict about keys
        return tLanding(key, params);
      }
    } catch {
      // If key not found, return the key itself
      return key;
    }
  };

  return { t, locale };
}

/**
 * I18n Provider - wraps children with next-intl context
 * Note: In Next.js App Router, next-intl handles this at the layout level
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * Hook to access full i18n context (for LanguageSwitcher)
 */
export function useI18n(): I18nContextType {
  const locale = useLocale() as Locale;
  const tLanding = useTranslations('landing');
  const tNav = useTranslations('nav');
  const tFooter = useTranslations('footer');
  const tCommon = useTranslations('common');

  const t = (key: string, params?: Record<string, string | number>) => {
    try {
      if (key.startsWith('landing.')) {
        const subKey = key.replace('landing.', '');
        // @ts-expect-error - next-intl types are strict about keys
        return tLanding(subKey, params);
      } else if (key.startsWith('nav.')) {
        const subKey = key.replace('nav.', '');
        // @ts-expect-error - next-intl types are strict about keys
        return tNav(subKey, params);
      } else if (key.startsWith('footer.')) {
        const subKey = key.replace('footer.', '');
        // @ts-expect-error - next-intl types are strict about keys
        return tFooter(subKey, params);
      } else if (key.startsWith('common.')) {
        const subKey = key.replace('common.', '');
        // @ts-expect-error - next-intl types are strict about keys
        return tCommon(subKey, params);
      } else {
        // @ts-expect-error - next-intl types are strict about keys
        return tLanding(key, params);
      }
    } catch {
      return key;
    }
  };

  // setLocale is a no-op here - language switching is handled via URL in next-intl
  const setLocale = (_locale: Locale) => {
    // In next-intl with app router, locale switching requires navigation
    // This is handled by LanguageSwitcher via Link
    console.log('Language switch requested:', _locale);
  };

  return {
    locale,
    setLocale,
    t,
    locales: ['en', 'th'] as const,
    localeNames: {
      en: 'English',
      th: 'ไทย',
    },
  };
}
