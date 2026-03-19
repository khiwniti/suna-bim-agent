/**
 * White-Label Configuration
 *
 * Provides tenant-specific theming through CSS custom properties.
 * Supports custom colors, fonts, logos, and branding.
 */

import { prisma } from '@/lib/db';
import { z } from 'zod';

// ============================================
// Type Definitions
// ============================================

/**
 * Theme color configuration
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

/**
 * Font configuration
 */
export interface ThemeFonts {
  sans?: string;
  heading?: string;
  mono?: string;
}

/**
 * Branding configuration
 */
export interface TenantBranding {
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  appName?: string;
  supportEmail?: string;
  primaryColor?: string;
  customFooter?: string;
}

/**
 * Complete white-label theme configuration
 */
export interface WhiteLabelTheme {
  colors: ThemeColors;
  fonts: ThemeFonts;
  branding: TenantBranding;
  borderRadius: string;
  darkMode?: {
    colors: ThemeColors;
  };
}

/**
 * Partial theme for overrides
 */
export type WhiteLabelThemeOverrides = {
  colors?: Partial<ThemeColors>;
  fonts?: Partial<ThemeFonts>;
  branding?: Partial<TenantBranding>;
  borderRadius?: string;
  darkMode?: {
    colors?: Partial<ThemeColors>;
  };
};

/**
 * Tenant settings from database
 */
export interface TenantSettings {
  theme?: WhiteLabelThemeOverrides;
  logoUrl?: string;
  appName?: string;
  [key: string]: unknown;
}

// ============================================
// Default Theme (matches globals.css)
// ============================================

export const DEFAULT_THEME: WhiteLabelTheme = {
  colors: {
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
  },
  fonts: {
    sans: 'var(--font-inter), system-ui, -apple-system, sans-serif',
    heading: 'var(--font-inter), system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  branding: {
    logoUrl: undefined,
    logoDarkUrl: undefined,
    faviconUrl: undefined,
    appName: 'CarbonBIM',
    supportEmail: undefined,
    primaryColor: '#10b981',
    customFooter: undefined,
  },
  borderRadius: '0.875rem',
};

export const DEFAULT_DARK_THEME: ThemeColors = {
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

// ============================================
// Validation
// ============================================

const colorRegex =
  /^(#([0-9a-fA-F]{3}){1,2}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)|hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)|hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*[\d.]+\s*\))$/i;

const colorSchema = z.string().max(100).regex(colorRegex, 'Invalid color format');

// Font family validation: only allow safe characters (alphanumeric, spaces, quotes, commas, hyphens)
// Prevents CSS injection via font-family values
const fontFamilyRegex = /^[a-zA-Z0-9\s'",-]+$/;
const fontSchema = z.string().max(200).regex(fontFamilyRegex, 'Invalid font-family format');

const themeColorsSchema = z
  .object({
    primary: colorSchema.optional(),
    primaryForeground: colorSchema.optional(),
    primaryHover: colorSchema.optional(),
    primaryGlow: colorSchema.optional(),
    secondary: colorSchema.optional(),
    secondaryForeground: colorSchema.optional(),
    accent: colorSchema.optional(),
    accentForeground: colorSchema.optional(),
    background: colorSchema.optional(),
    foreground: colorSchema.optional(),
    muted: colorSchema.optional(),
    mutedForeground: colorSchema.optional(),
    border: colorSchema.optional(),
    ring: colorSchema.optional(),
    gradientStart: colorSchema.optional(),
    gradientMid: colorSchema.optional(),
    gradientEnd: colorSchema.optional(),
  })
  .passthrough();

const whiteLabelThemeSchema = z.object({
  colors: themeColorsSchema.optional(),
  fonts: z
    .object({
      sans: fontSchema.optional(),
      heading: fontSchema.optional(),
      mono: fontSchema.optional(),
    })
    .optional(),
  branding: z
    .object({
      logoUrl: z.string().url().optional(),
      logoDarkUrl: z.string().url().optional(),
      faviconUrl: z.string().url().optional(),
      appName: z.string().max(50).optional(),
      supportEmail: z.string().email().optional(),
      primaryColor: colorSchema.optional(),
      customFooter: z.string().max(500).optional(),
    })
    .optional(),
  borderRadius: z.string().optional(),
  darkMode: z
    .object({
      colors: themeColorsSchema.optional(),
    })
    .optional(),
});

export interface ValidationResult {
  success: boolean;
  error?: string;
  data?: WhiteLabelThemeOverrides;
}

/**
 * Validate white-label theme configuration
 */
export function validateWhiteLabelTheme(
  theme: unknown
): ValidationResult {
  try {
    const parsed = whiteLabelThemeSchema.parse(theme);
    return { success: true, data: parsed as WhiteLabelThemeOverrides };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }
    return { success: false, error: 'Invalid theme configuration' };
  }
}

// ============================================
// Theme Creation & Merging
// ============================================

/**
 * Deep merge two objects
 */
function deepMerge<T extends object>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target } as T;

  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== undefined &&
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as object,
        sourceValue as object
      ) as T[keyof T];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T];
    }
  }

  return result;
}

/**
 * Create a white-label theme with overrides applied to defaults
 */
export function createWhiteLabelTheme(
  overrides: WhiteLabelThemeOverrides
): WhiteLabelTheme {
  if (!overrides || Object.keys(overrides).length === 0) {
    return DEFAULT_THEME;
  }

  return deepMerge(DEFAULT_THEME, overrides as Partial<WhiteLabelTheme>);
}

/**
 * Parse tenant settings JSON
 */
export function parseTenantSettings(
  settings: unknown
): TenantSettings {
  if (settings === null || settings === undefined) {
    return {};
  }

  if (typeof settings !== 'object' || Array.isArray(settings)) {
    return {};
  }

  return settings as TenantSettings;
}

/**
 * Merge tenant settings with default theme
 */
export function mergeTenantTheme(
  settings: unknown
): WhiteLabelTheme {
  const parsed = parseTenantSettings(settings);

  if (!parsed || Object.keys(parsed).length === 0) {
    return DEFAULT_THEME;
  }

  // Extract theme overrides
  const overrides: WhiteLabelThemeOverrides = parsed.theme || {};

  // Extract branding from root settings
  if (parsed.logoUrl) {
    overrides.branding = overrides.branding || {};
    overrides.branding.logoUrl = parsed.logoUrl as string;
  }

  if (parsed.appName) {
    overrides.branding = overrides.branding || {};
    overrides.branding.appName = parsed.appName as string;
  }

  return createWhiteLabelTheme(overrides);
}

// ============================================
// CSS Variable Generation
// ============================================

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Generate CSS custom properties from theme
 */
export function generateCSSVariables(theme: WhiteLabelTheme): string {
  const variables: string[] = [];

  // Color variables
  for (const [key, value] of Object.entries(theme.colors)) {
    if (value) {
      const cssKey = `--${camelToKebab(key)}`;
      variables.push(`  ${cssKey}: ${value};`);
    }
  }

  // Font variables
  if (theme.fonts.sans) {
    variables.push(`  --font-sans: ${theme.fonts.sans};`);
  }
  if (theme.fonts.heading) {
    variables.push(`  --font-heading: ${theme.fonts.heading};`);
  }
  if (theme.fonts.mono) {
    variables.push(`  --font-mono: ${theme.fonts.mono};`);
  }

  // Border radius
  if (theme.borderRadius) {
    variables.push(`  --radius: ${theme.borderRadius};`);
    variables.push(`  --radius-sm: calc(${theme.borderRadius} - 4px);`);
    variables.push(`  --radius-lg: calc(${theme.borderRadius} + 4px);`);
  }

  let css = `:root {\n${variables.join('\n')}\n}`;

  // Dark mode variables
  if (theme.darkMode?.colors) {
    const darkVariables: string[] = [];

    for (const [key, value] of Object.entries(theme.darkMode.colors)) {
      if (value) {
        const cssKey = `--${camelToKebab(key)}`;
        darkVariables.push(`    ${cssKey}: ${value};`);
      }
    }

    if (darkVariables.length > 0) {
      css += `\n\n@media (prefers-color-scheme: dark) {\n  :root {\n${darkVariables.join('\n')}\n  }\n}`;
    }
  }

  return css;
}

/**
 * Generate inline style object from theme
 */
export function generateInlineStyles(
  theme: WhiteLabelTheme
): Record<string, string> {
  const styles: Record<string, string> = {};

  // Color variables
  for (const [key, value] of Object.entries(theme.colors)) {
    if (value) {
      const cssKey = `--${camelToKebab(key)}`;
      styles[cssKey] = value;
    }
  }

  // Font variables
  if (theme.fonts.sans) {
    styles['--font-sans'] = theme.fonts.sans;
  }

  // Border radius
  if (theme.borderRadius) {
    styles['--radius'] = theme.borderRadius;
  }

  return styles;
}

// ============================================
// Domain Resolution
// ============================================

export interface TenantWithTheme {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logoUrl: string | null;
  settings: unknown;
}

/**
 * Normalize domain for lookup
 */
function normalizeDomain(domain: string): string {
  // Remove port if present
  const withoutPort = domain.split(':')[0];
  // Lowercase
  return withoutPort.toLowerCase();
}

/**
 * Get tenant by custom domain
 */
export async function getTenantByDomain(
  domain: string
): Promise<TenantWithTheme | null> {
  const normalizedDomain = normalizeDomain(domain);

  const tenant = await prisma.tenant.findUnique({
    where: { domain: normalizedDomain },
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      logoUrl: true,
      settings: true,
    },
  });

  return tenant;
}

/**
 * Get theme for a specific tenant
 */
export async function getTenantTheme(
  tenantId: string
): Promise<WhiteLabelTheme> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      settings: true,
      logoUrl: true,
    },
  });

  if (!tenant) {
    return DEFAULT_THEME;
  }

  const settings = parseTenantSettings(tenant.settings);

  // Add logoUrl from tenant record
  if (tenant.logoUrl) {
    settings.logoUrl = tenant.logoUrl;
  }

  return mergeTenantTheme(settings);
}

/**
 * Check if domain is a custom tenant domain
 */
export function isCustomDomain(
  hostname: string,
  defaultDomains: string[] = []
): boolean {
  const normalized = normalizeDomain(hostname);

  // Check against default/system domains
  const systemDomains = [
    'localhost',
    '127.0.0.1',
    'bim.getintheq.space',
    'carbonbim.com',
    ...defaultDomains,
  ];

  return !systemDomains.some(
    (d) => normalized === d || normalized.endsWith(`.${d}`)
  );
}

// ============================================
// Server-Side Theme Injection
// ============================================

/**
 * Generate style tag content for server-side injection
 */
export function generateThemeStyleTag(theme: WhiteLabelTheme): string {
  return `<style id="tenant-theme">${generateCSSVariables(theme)}</style>`;
}

/**
 * Get theme data for client hydration
 */
export function getThemeClientData(theme: WhiteLabelTheme): {
  branding: TenantBranding;
  cssVariables: string;
} {
  return {
    branding: theme.branding,
    cssVariables: generateCSSVariables(theme),
  };
}
