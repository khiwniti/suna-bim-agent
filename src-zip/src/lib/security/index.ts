/**
 * Security Utilities - Entry Point
 *
 * Provides CSRF protection, rate limiting, and ISO 27001 compliance for API routes.
 */

// CSRF Protection
export {
  getOrCreateCSRFToken,
  validateCSRFToken,
  setCSRFTokenInResponse,
  getCSRFHeadersClient,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from './csrf';

// Rate Limiting
export {
  checkRateLimit,
  withRateLimit,
  addRateLimitHeaders,
  createRateLimiter,
  authRateLimiter,
  standardRateLimiter,
  uploadRateLimiter,
  expensiveRateLimiter,
  RATE_LIMIT_PRESETS,
  type RateLimitConfig,
} from './rate-limit';

// ISO 27001 Compliance Framework
export {
  // Data Classification
  DATA_CLASSIFICATION_RULES,
  type DataClassification,
  type ClassificationMetadata,

  // Control Domains
  ISO27001_CONTROL_DOMAINS,
  BIM_AGENT_COMPLIANCE_MAP,
  type ComplianceStatus,
  type ControlImplementation,

  // Audit Logging
  SECURITY_EVENTS,
  createAuditLogEntry,
  type SecurityEventType,
  type AuditLogEntry,

  // Risk Assessment
  PLATFORM_RISKS,
  calculateRiskLevel,
  type RiskAssessment,

  // Compliance Reports
  generateComplianceReport,
  exportComplianceReportMarkdown,

  // Validation Utilities
  validateSecurityPolicy,
  canExportData,
} from './iso27001-compliance';
