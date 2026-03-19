/**
 * Tenant Route Detection
 *
 * Utilities for detecting and rewriting tenant-scoped routes.
 */

/**
 * Reserved slugs that cannot be tenant names
 */
export const RESERVED_SLUGS = [
  // Short routes
  'w', 'c', 'p',
  // Full routes
  'workspace', 'chat', 'project',
  // App routes
  'dashboard', 'auth', 'api',
  // Marketing
  'about', 'pricing', 'blog', 'solutions', 'case-studies', 'calculator', 'boq-analyzer',
  // System
  'admin', 'settings', '_next', 'static', '_tenant', 'favicon.ico', 'public',
];

/**
 * Valid tenant slug pattern: 2+ lowercase alphanumeric with hyphens
 */
const TENANT_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$/;

/**
 * Check if a path segment looks like a valid tenant slug
 */
export function looksLikeTenantSlug(segment: string): boolean {
  if (!segment) return false;
  if (segment.length < 2) return false;
  if (RESERVED_SLUGS.includes(segment.toLowerCase())) return false;
  return TENANT_SLUG_PATTERN.test(segment.toLowerCase());
}

/**
 * Get the rewrite path for a tenant route
 */
export function getTenantRewritePath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const firstSegment = segments[0];
  if (!looksLikeTenantSlug(firstSegment)) {
    return null;
  }

  return `/_tenant${pathname}`;
}
