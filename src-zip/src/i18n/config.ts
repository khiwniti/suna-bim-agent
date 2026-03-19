/**
 * i18n Configuration
 *
 * Internationalization settings for BIM Carbon platform
 * Supports Thai (th) and English (en)
 */

export const locales = ['en', 'th'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  th: 'ไทย',
};

export const localeFlagEmoji: Record<Locale, string> = {
  en: '🇬🇧',
  th: '🇹🇭',
};

// Date/time formatting
export const dateFormats: Record<Locale, Intl.DateTimeFormatOptions> = {
  en: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  th: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'buddhist', // Thai Buddhist calendar
  },
};

// Number formatting
export const numberFormats: Record<Locale, Intl.NumberFormatOptions> = {
  en: {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
  th: {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
};

// Currency formatting
export const currencyFormats: Record<Locale, Intl.NumberFormatOptions> = {
  en: {
    style: 'currency',
    currency: 'THB',
    currencyDisplay: 'narrowSymbol',
  },
  th: {
    style: 'currency',
    currency: 'THB',
    currencyDisplay: 'narrowSymbol',
  },
};
