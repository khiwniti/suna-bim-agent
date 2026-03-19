/**
 * Slug Generation Utilities
 *
 * Generates URL-friendly slugs from names and ensures uniqueness.
 */

/**
 * CUID pattern: starts with 'c' followed by 23-24 lowercase alphanumeric chars
 * CUID v1: 25 chars total, CUID v2: 24 chars total
 */
const CUID_PATTERN = /^c[a-z0-9]{23,24}$/;

/**
 * Valid slug pattern: lowercase alphanumeric with hyphens, no leading/trailing hyphens
 */
const VALID_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Generate random alphanumeric suffix
 */
function generateSuffix(length: number = 3): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Convert a name to a URL-friendly slug
 */
export function generateSlug(name: string): string {
  if (!name) return '';

  return name
    .toLowerCase()
    // Remove non-ASCII characters (Thai, Chinese, etc.)
    .replace(/[^\x00-\x7F]/g, '')
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove any remaining non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Collapse multiple hyphens into one
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique slug by appending a random suffix if collision detected
 */
export function generateUniqueSlug(
  baseName: string,
  existingSlugs: string[]
): string {
  const baseSlug = generateSlug(baseName);

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const slugWithSuffix = `${baseSlug}-${generateSuffix()}`;
    if (!existingSlugs.includes(slugWithSuffix)) {
      return slugWithSuffix;
    }
    attempts++;
  }

  // Fallback with longer suffix for extreme collision cases
  return `${baseSlug}-${generateSuffix(6)}`;
}

/**
 * Validate if a string is a valid slug
 */
export function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  if (isCuid(slug)) return false;
  return VALID_SLUG_PATTERN.test(slug);
}

/**
 * Check if a string looks like a CUID
 */
export function isCuid(str: string): boolean {
  return CUID_PATTERN.test(str);
}
