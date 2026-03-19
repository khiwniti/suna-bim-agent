/**
 * i18n Configuration and Utilities
 *
 * Provides internationalization support for EN and TH languages
 */

import en from './en.json';
import th from './th.json';

export type Locale = 'en' | 'th';

export const locales: Locale[] = ['en', 'th'];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  th: 'ไทย',
};

export const defaultLocale: Locale = 'en';

const translations = { en, th } as const;

export type TranslationKeys = typeof en;

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Return the key if not found
    }
  }

  return typeof result === 'string' ? result : path;
}

/**
 * Get translation for a given key
 */
export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const translation = getNestedValue(translations[locale] as unknown as Record<string, unknown>, key);

  if (params) {
    return Object.entries(params).reduce(
      (str, [paramKey, value]) => str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value)),
      translation
    );
  }

  return translation;
}

/**
 * Create a translator function bound to a specific locale
 */
export function createTranslator(locale: Locale) {
  return (key: string, params?: Record<string, string | number>) => t(locale, key, params);
}

/**
 * Get browser's preferred locale
 */
export function getBrowserLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;

  const browserLang = navigator.language.split('-')[0];
  return locales.includes(browserLang as Locale) ? (browserLang as Locale) : defaultLocale;
}

/**
 * Get stored locale from localStorage
 */
export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('locale');
  return stored && locales.includes(stored as Locale) ? (stored as Locale) : null;
}

/**
 * Store locale in localStorage
 */
export function setStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('locale', locale);
}
