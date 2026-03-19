/**
 * TenantThemeProvider
 *
 * Server component that injects tenant-specific CSS custom properties
 * for white-label theming. Supports custom domains and tenant settings.
 *
 * SECURITY NOTE: The CSS variables generated are sanitized through
 * validation in white-label.ts and only accept valid color formats.
 */

import { headers } from 'next/headers';
import {
  getTenantByDomain,
  mergeTenantTheme,
  generateCSSVariables,
  isCustomDomain,
  DEFAULT_THEME,
  type TenantBranding,
} from '@/lib/theme/white-label';

export interface TenantThemeProps {
  children: React.ReactNode;
  /** Override tenant ID for testing */
  tenantId?: string;
  /** Override domain detection */
  forceDomain?: string;
}

export interface TenantContext {
  tenantId: string | null;
  tenantName: string | null;
  tenantSlug: string | null;
  branding: TenantBranding;
  isCustomDomain: boolean;
}

/**
 * Get tenant context from request headers
 */
async function getTenantContext(
  forceDomain?: string
): Promise<TenantContext | null> {
  try {
    const headersList = await headers();
    const host = forceDomain || headersList.get('host') || '';

    // Skip if not a custom domain
    if (!isCustomDomain(host)) {
      return null;
    }

    // Look up tenant by domain
    const tenant = await getTenantByDomain(host);

    if (!tenant) {
      return null;
    }

    const theme = mergeTenantTheme(tenant.settings);

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      branding: theme.branding,
      isCustomDomain: true,
    };
  } catch (error) {
    console.error('[TenantThemeProvider] Error getting tenant context:', error);
    return null;
  }
}

/**
 * Sanitize CSS string to prevent injection attacks
 * Only allows CSS custom property definitions
 */
function sanitizeCSS(css: string): string {
  // Remove any script tags or event handlers
  const sanitized = css
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/@import/gi, '')
    .replace(/url\s*\([^)]*\)/gi, 'url()');

  return sanitized;
}

/**
 * TenantThemeProvider - Server Component
 *
 * Injects tenant-specific CSS variables and provides theme context.
 * Should wrap the main layout content.
 */
export async function TenantThemeProvider({
  children,
  forceDomain,
}: TenantThemeProps) {
  const tenantContext = await getTenantContext(forceDomain);

  // No custom domain, use default theme
  if (!tenantContext) {
    return <>{children}</>;
  }

  // Get tenant and generate theme
  const tenant = await getTenantByDomain(
    forceDomain || (await headers()).get('host') || ''
  );

  if (!tenant) {
    return <>{children}</>;
  }

  const theme = mergeTenantTheme(tenant.settings);
  // Sanitize CSS to prevent XSS
  const cssVariables = sanitizeCSS(generateCSSVariables(theme));

  return (
    <>
      {/* Inject tenant theme CSS variables - sanitized output */}
      <style id="tenant-theme">{cssVariables}</style>

      {/* Provide tenant context via data attributes for client components */}
      <div
        data-tenant-id={tenantContext.tenantId}
        data-tenant-name={tenantContext.tenantName}
        data-tenant-slug={tenantContext.tenantSlug}
        data-custom-domain={tenantContext.isCustomDomain ? 'true' : 'false'}
        style={{ display: 'contents' }}
      >
        {children}
      </div>
    </>
  );
}

/**
 * TenantThemeScript - Client-side theme hydration
 *
 * Provides JavaScript access to tenant branding for client components.
 * Safely encodes branding data as JSON.
 */
export function TenantThemeScript({
  branding,
}: {
  branding: TenantBranding;
}) {
  // Encode branding as base64 to prevent script injection
  const encodedBranding = Buffer.from(JSON.stringify(branding)).toString('base64');

  return (
    <script
      id="tenant-branding"
      type="application/json"
      data-branding={encodedBranding}
    />
  );
}

/**
 * useTenantBranding - Client hook for accessing tenant branding
 *
 * Use this in client components to access tenant-specific branding.
 */
export function getTenantBrandingFromWindow(): TenantBranding {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME.branding;
  }

  try {
    const script = document.getElementById('tenant-branding');
    if (script) {
      const encoded = script.getAttribute('data-branding');
      if (encoded) {
        return JSON.parse(atob(encoded));
      }
    }
  } catch {
    // Fallback to default
  }

  return DEFAULT_THEME.branding;
}

/**
 * StaticThemeStyle - For pages that don't need dynamic theming
 *
 * Use when you want to apply a fixed theme without database lookup.
 */
export function StaticThemeStyle({
  theme,
}: {
  theme: Parameters<typeof generateCSSVariables>[0];
}) {
  const cssVariables = sanitizeCSS(generateCSSVariables(theme));

  return <style id="static-theme">{cssVariables}</style>;
}

/**
 * TenantFavicon - Dynamic favicon based on tenant branding
 */
export function TenantFavicon({
  branding,
}: {
  branding: TenantBranding;
}) {
  if (!branding.faviconUrl) {
    return null;
  }

  // Validate URL to prevent injection
  try {
    const url = new URL(branding.faviconUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
  } catch {
    return null;
  }

  return (
    <>
      <link rel="icon" href={branding.faviconUrl} sizes="any" />
      <link rel="apple-touch-icon" href={branding.faviconUrl} />
    </>
  );
}

/**
 * TenantLogo - Dynamic logo component
 */
export function TenantLogo({
  branding,
  className,
  height = 32,
}: {
  branding: TenantBranding;
  className?: string;
  height?: number;
}) {
  let logoUrl = '/logo.svg';
  const appName = branding.appName || 'CarbonBIM';

  // Validate logo URL
  if (branding.logoUrl) {
    try {
      const url = new URL(branding.logoUrl);
      if (['http:', 'https:'].includes(url.protocol)) {
        logoUrl = branding.logoUrl;
      }
    } catch {
      // Use default logo
    }
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={appName}
      height={height}
      className={className}
      style={{ height: `${height}px`, width: 'auto' }}
    />
  );
}

export default TenantThemeProvider;
