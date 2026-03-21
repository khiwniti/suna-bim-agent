/**
 * Theme Token Definitions
 *
 * Mirrors globals.css CSS custom properties as typed TypeScript constants.
 * Use these tokens for programmatic theming, testing, or SSR style injection.
 */

export interface ThemeColors {
  primary?: string;
  primaryForeground?: string;
  primaryHover?: string;
  primaryGlow?: string;
  secondary?: string;
  secondaryForeground?: string;
  accent?: string;
  accentForeground?: string;
  accentMuted?: string;
  accentMutedForeground?: string;
  background?: string;
  foreground?: string;
  muted?: string;
  mutedForeground?: string;
  destructive?: string;
  destructiveForeground?: string;
  success?: string;
  successForeground?: string;
  warning?: string;
  warningForeground?: string;
  info?: string;
  infoForeground?: string;
  border?: string;
  input?: string;
  ring?: string;
  card?: string;
  cardForeground?: string;
  popover?: string;
  popoverForeground?: string;
  gradientStart?: string;
  gradientMid?: string;
  gradientEnd?: string;
}

export interface ThemeConfig {
  colors: ThemeColors;
  darkColors?: ThemeColors;
  borderRadius?: string;
  appName?: string;
  logoUrl?: string;
}

export const LIGHT_THEME: ThemeColors = {
  primary: '#10b981',
  primaryForeground: '#ffffff',
  primaryHover: '#059669',
  primaryGlow: 'rgba(16, 185, 129, 0.35)',
  secondary: '#ecfdf5',
  secondaryForeground: '#065f46',
  accent: '#06b6d4',
  accentForeground: '#ffffff',
  accentMuted: '#d1fae5',
  accentMutedForeground: '#065f46',
  background: '#fafcfb',
  foreground: '#0c1811',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  success: '#22c55e',
  successForeground: '#ffffff',
  warning: '#f59e0b',
  warningForeground: '#000000',
  info: '#3b82f6',
  infoForeground: '#ffffff',
  border: '#e2e8f0',
  input: '#e2e8f0',
  ring: '#10b981',
  card: '#ffffff',
  cardForeground: '#0c1811',
  popover: '#ffffff',
  popoverForeground: '#0c1811',
  gradientStart: '#10b981',
  gradientMid: '#06b6d4',
  gradientEnd: '#8b5cf6',
};

export const DARK_THEME: ThemeColors = {
  primary: '#34d399',
  primaryForeground: '#022c22',
  primaryHover: '#6ee7b7',
  primaryGlow: 'rgba(52, 211, 153, 0.3)',
  secondary: '#064e3b',
  secondaryForeground: '#d1fae5',
  accent: '#22d3ee',
  accentForeground: '#042f2e',
  accentMuted: '#134e4a',
  accentMutedForeground: '#5eead4',
  background: '#030a08',
  foreground: '#f0fdf4',
  muted: '#1e293b',
  mutedForeground: '#94a3b8',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  success: '#4ade80',
  successForeground: '#052e16',
  warning: '#fbbf24',
  warningForeground: '#000000',
  info: '#60a5fa',
  infoForeground: '#000000',
  border: '#1e3a36',
  input: '#1e3a36',
  ring: '#34d399',
  card: '#0d1f1a',
  cardForeground: '#f0fdf4',
  popover: '#0d1f1a',
  popoverForeground: '#f0fdf4',
  gradientStart: '#34d399',
  gradientMid: '#22d3ee',
  gradientEnd: '#a78bfa',
};

export const DEFAULT_THEME: ThemeConfig = {
  colors: LIGHT_THEME,
  darkColors: DARK_THEME,
  borderRadius: '0.875rem',
  appName: 'Carbon BIM',
};

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Generate CSS custom property overrides from a partial theme
 */
export function generateCSSVariables(colors: ThemeColors): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(colors)) {
    if (value) {
      vars[`--${camelToKebab(key)}`] = value;
    }
  }
  return vars;
}

/**
 * Apply theme to document root (client-side only)
 */
export function applyTheme(colors: ThemeColors, target: HTMLElement = document.documentElement): void {
  const vars = generateCSSVariables(colors);
  for (const [prop, value] of Object.entries(vars)) {
    target.style.setProperty(prop, value);
  }
}
