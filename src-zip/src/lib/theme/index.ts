/**
 * Theme Module Exports
 *
 * Re-exports all white-label theming utilities
 */

export {
  // Types
  type ThemeColors,
  type ThemeFonts,
  type TenantBranding,
  type WhiteLabelTheme,
  type WhiteLabelThemeOverrides,
  type TenantSettings,
  type TenantWithTheme,
  type ValidationResult,
  // Constants
  DEFAULT_THEME,
  DEFAULT_DARK_THEME,
  // Validation
  validateWhiteLabelTheme,
  // Theme creation
  createWhiteLabelTheme,
  parseTenantSettings,
  mergeTenantTheme,
  // CSS generation
  generateCSSVariables,
  generateInlineStyles,
  // Domain resolution
  getTenantByDomain,
  getTenantTheme,
  isCustomDomain,
  // Server utilities
  generateThemeStyleTag,
  getThemeClientData,
} from './white-label';
