/**
 * Production Error Logging Service
 *
 * Centralized error handling and logging for production monitoring.
 * Integrates with console in development and can be extended for
 * external services (Sentry, LogRocket, etc.) in production.
 *
 * ★ Insight ─────────────────────────────────────
 * This service provides:
 * - Structured error logging with context
 * - Error deduplication to prevent flooding
 * - Environment-aware behavior (dev vs prod)
 * - Automatic reporting to Sentry for medium+ severity errors
 * ─────────────────────────────────────────────────
 */

import { reportError } from '@/lib/error-reporting';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  /** Component or module where error occurred */
  component?: string;
  /** User action that triggered the error */
  action?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** User ID if available */
  userId?: string;
  /** Session ID */
  sessionId?: string;
  /** Allow additional properties for extensibility */
  [key: string]: unknown;
}

export interface LoggedError {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
}

// In-memory error store for deduplication
const errorStore = new Map<string, LoggedError>();

// Generate error fingerprint for deduplication
function getErrorFingerprint(error: Error, context: ErrorContext): string {
  const parts = [
    error.name,
    error.message,
    context.component || 'unknown',
    context.action || 'unknown',
  ];
  return parts.join('::');
}

// Generate unique ID
function generateId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Determine severity based on error type and context
function determineSeverity(error: Error, context: ErrorContext): ErrorSeverity {
  // Critical: Auth, data loss, security
  if (
    context.component?.includes('auth') ||
    context.component?.includes('payment') ||
    error.message.includes('unauthorized') ||
    error.message.includes('forbidden')
  ) {
    return 'critical';
  }

  // High: Core functionality failures
  if (
    context.component?.includes('viewer') ||
    context.component?.includes('calculator') ||
    context.component?.includes('chat')
  ) {
    return 'high';
  }

  // Medium: Feature failures
  if (
    context.component?.includes('report') ||
    context.component?.includes('export')
  ) {
    return 'medium';
  }

  // Low: UI glitches, non-critical
  return 'low';
}

/**
 * Log an error with context
 */
export function logError(
  error: Error,
  context: ErrorContext = {}
): LoggedError {
  const fingerprint = getErrorFingerprint(error, context);
  const now = new Date();
  const severity = determineSeverity(error, context);

  // Check for existing error (deduplication)
  const existing = errorStore.get(fingerprint);
  if (existing) {
    existing.count++;
    existing.lastSeen = now;

    // Only log to console every 10th occurrence
    if (existing.count % 10 === 0 || process.env.NODE_ENV === 'development') {
      console.error(`[${severity.toUpperCase()}] Error (x${existing.count}):`, {
        message: error.message,
        component: context.component,
        action: context.action,
      });
    }

    return existing;
  }

  // New error
  const loggedError: LoggedError = {
    id: generateId(),
    timestamp: now,
    message: error.message,
    stack: error.stack,
    severity,
    context,
    count: 1,
    firstSeen: now,
    lastSeen: now,
  };

  errorStore.set(fingerprint, loggedError);

  // Console logging
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${severity.toUpperCase()}] Error:`, {
      id: loggedError.id,
      message: error.message,
      stack: error.stack,
      context,
    });
  } else {
    // Production: minimal logging
    console.error(`[${severity.toUpperCase()}] ${context.component || 'App'}: ${error.message}`);
  }

  // Send to external monitoring service for medium+ severity errors
  // Only report new errors (not deduplicated) to avoid flooding
  if (severity !== 'low') {
    reportError(error, context);
  }

  return loggedError;
}

/**
 * Log a warning (non-error issue)
 */
export function logWarning(
  message: string,
  context: ErrorContext = {}
): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[WARNING] ${context.component || 'App'}:`, message, context);
  }
}

/**
 * Log info for debugging
 */
export function logInfo(
  message: string,
  context: ErrorContext = {}
): void {
  if (process.env.NODE_ENV === 'development') {
    console.info(`[INFO] ${context.component || 'App'}:`, message, context);
  }
}

/**
 * Get all logged errors (for debugging UI)
 */
export function getLoggedErrors(): LoggedError[] {
  return Array.from(errorStore.values()).sort(
    (a, b) => b.lastSeen.getTime() - a.lastSeen.getTime()
  );
}

/**
 * Clear error store
 */
export function clearErrors(): void {
  errorStore.clear();
}

/**
 * Get error statistics
 */
export function getErrorStats(): {
  total: number;
  bySeverity: Record<ErrorSeverity, number>;
  byComponent: Record<string, number>;
} {
  const errors = Array.from(errorStore.values());

  return {
    total: errors.reduce((sum, e) => sum + e.count, 0),
    bySeverity: {
      low: errors.filter(e => e.severity === 'low').reduce((sum, e) => sum + e.count, 0),
      medium: errors.filter(e => e.severity === 'medium').reduce((sum, e) => sum + e.count, 0),
      high: errors.filter(e => e.severity === 'high').reduce((sum, e) => sum + e.count, 0),
      critical: errors.filter(e => e.severity === 'critical').reduce((sum, e) => sum + e.count, 0),
    },
    byComponent: errors.reduce((acc, e) => {
      const comp = e.context.component || 'unknown';
      acc[comp] = (acc[comp] || 0) + e.count;
      return acc;
    }, {} as Record<string, number>),
  };
}

/**
 * Create error handler for specific component
 */
export function createErrorHandler(component: string) {
  return {
    log: (error: Error, action?: string, metadata?: Record<string, unknown>) =>
      logError(error, { component, action, metadata }),
    warn: (message: string, metadata?: Record<string, unknown>) =>
      logWarning(message, { component, metadata }),
    info: (message: string, metadata?: Record<string, unknown>) =>
      logInfo(message, { component, metadata }),
  };
}

export default {
  logError,
  logWarning,
  logInfo,
  getLoggedErrors,
  clearErrors,
  getErrorStats,
  createErrorHandler,
};
