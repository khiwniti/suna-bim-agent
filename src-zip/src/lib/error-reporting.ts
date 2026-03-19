/**
 * Error Reporting Service
 *
 * Unified error reporting with graceful degradation.
 * Uses Sentry when available and configured, otherwise falls back
 * to structured console logging.
 *
 * ★ Insight ─────────────────────────────────────
 * This service provides:
 * - Dynamic Sentry integration (no build errors if not installed)
 * - Graceful fallback to structured console logging
 * - User context management for error correlation
 * - Component-scoped error reporters for cleaner code
 * ─────────────────────────────────────────────────
 */

/**
 * Sentry-like interface for type safety
 */
interface SentryLike {
  captureException: (error: Error, options?: { extra?: Record<string, unknown> }) => void;
  setUser: (user: { id: string; email?: string; username?: string } | null) => void;
  addBreadcrumb: (breadcrumb: {
    category: string;
    message: string;
    level: string;
    data?: Record<string, unknown>;
  }) => void;
  setTag: (key: string, value: string) => void;
  setExtra: (key: string, value: unknown) => void;
}

// Module state
let sentryModule: SentryLike | null = null;
let initialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Error context for additional debugging information
 */
export interface ErrorContext {
  /** Component or module where error occurred */
  component?: string;
  /** User action that triggered the error */
  action?: string;
  /** User ID if available */
  userId?: string;
  /** Session ID */
  sessionId?: string;
  /** Additional key-value metadata */
  [key: string]: unknown;
}

/**
 * Breadcrumb for tracking user actions before error
 */
export interface Breadcrumb {
  /** Category of the breadcrumb (e.g., 'ui', 'navigation', 'http') */
  category: string;
  /** Human-readable message */
  message: string;
  /** Severity level */
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  /** Additional data */
  data?: Record<string, unknown>;
}

/**
 * Initialize Sentry module (singleton pattern)
 */
async function initSentry(): Promise<void> {
  // Already initialized
  if (initialized) return;

  // Initialization in progress, wait for it
  if (initPromise) {
    await initPromise;
    return;
  }

  // Start initialization
  initPromise = (async () => {
    // Only attempt to load Sentry if DSN is configured
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      sentryModule = null;
      initialized = true;
      return;
    }

    try {
      // Dynamic import to avoid build errors if @sentry/nextjs is not installed
      // Using a variable to prevent Vite from analyzing the import at build time
      const moduleName = '@sentry/nextjs';
      sentryModule = await import(/* @vite-ignore */ moduleName);
    } catch {
      // Sentry not installed, will use console fallback
      sentryModule = null;
    }
    initialized = true;
  })();

  await initPromise;
}

/**
 * Check if Sentry is available and configured
 */
function isSentryEnabled(): boolean {
  return sentryModule !== null && !!process.env.NEXT_PUBLIC_SENTRY_DSN;
}

/**
 * Report an error to monitoring
 *
 * @param error - The error to report
 * @param context - Additional context for debugging
 *
 * @example
 * ```ts
 * try {
 *   await loadModel();
 * } catch (error) {
 *   await reportError(error, { component: 'BIMViewer', action: 'loadModel' });
 * }
 * ```
 */
export async function reportError(
  error: Error,
  context?: ErrorContext
): Promise<void> {
  await initSentry();

  if (isSentryEnabled()) {
    // Use Sentry when available
    sentryModule!.captureException(error, {
      extra: context,
    });
  } else {
    // Structured console logging for development/non-Sentry environments
    console.error('[Error Report]', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Set user context for error correlation
 *
 * @param user - User information to attach to errors
 *
 * @example
 * ```ts
 * // On user login
 * await setUserContext({ id: user.id, email: user.email });
 * ```
 */
export async function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
}): Promise<void> {
  await initSentry();

  if (isSentryEnabled()) {
    sentryModule!.setUser(user);
  }
  // No-op for console fallback (context included in error reports)
}

/**
 * Clear user context on logout
 *
 * @example
 * ```ts
 * // On user logout
 * await clearUserContext();
 * ```
 */
export async function clearUserContext(): Promise<void> {
  await initSentry();

  if (isSentryEnabled()) {
    sentryModule!.setUser(null);
  }
  // No-op for console fallback
}

/**
 * Add breadcrumb for tracking user actions
 *
 * Breadcrumbs are a trail of events that happened prior to an error.
 *
 * @param breadcrumb - The breadcrumb to add
 *
 * @example
 * ```ts
 * await addBreadcrumb({
 *   category: 'navigation',
 *   message: 'User navigated to viewer',
 *   level: 'info',
 * });
 * ```
 */
export async function addBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
  await initSentry();

  if (isSentryEnabled()) {
    sentryModule!.addBreadcrumb({
      category: breadcrumb.category,
      message: breadcrumb.message,
      level: breadcrumb.level,
      data: breadcrumb.data,
    });
  }
  // No-op for console fallback (could log in verbose mode if needed)
}

/**
 * Set a tag for filtering in Sentry
 *
 * @param key - Tag name
 * @param value - Tag value
 */
export async function setTag(key: string, value: string): Promise<void> {
  await initSentry();

  if (isSentryEnabled()) {
    sentryModule!.setTag(key, value);
  }
}

/**
 * Set extra context data
 *
 * @param key - Context key
 * @param value - Context value
 */
export async function setExtra(key: string, value: unknown): Promise<void> {
  await initSentry();

  if (isSentryEnabled()) {
    sentryModule!.setExtra(key, value);
  }
}

/**
 * Component-scoped error reporter
 */
export interface ErrorReporter {
  /** Report an error with component context */
  report: (error: Error, context?: ErrorContext) => Promise<void>;
  /** Add a breadcrumb with component context */
  breadcrumb: (message: string, level?: Breadcrumb['level'], data?: Record<string, unknown>) => Promise<void>;
}

/**
 * Create a component-scoped error reporter
 *
 * @param component - Component name for error context
 * @returns ErrorReporter instance scoped to the component
 *
 * @example
 * ```ts
 * const reporter = createErrorReporter('BIMViewer');
 *
 * try {
 *   await loadModel(modelId);
 * } catch (error) {
 *   await reporter.report(error, { action: 'loadModel', modelId });
 * }
 * ```
 */
export function createErrorReporter(component: string): ErrorReporter {
  return {
    report: async (error: Error, context?: ErrorContext) => {
      await reportError(error, {
        component,
        ...context,
      });
    },
    breadcrumb: async (
      message: string,
      level: Breadcrumb['level'] = 'info',
      data?: Record<string, unknown>
    ) => {
      await addBreadcrumb({
        category: component,
        message,
        level,
        data,
      });
    },
  };
}

/**
 * Reset internal state for testing purposes
 * @internal
 */
export function _resetForTesting(): void {
  sentryModule = null;
  initialized = false;
  initPromise = null;
}

/**
 * Inject a mock Sentry module for testing
 * @internal
 */
export function _injectSentryForTesting(mock: SentryLike | null): void {
  sentryModule = mock;
  initialized = true;
  initPromise = null;
}

export default {
  reportError,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
  setTag,
  setExtra,
  createErrorReporter,
};
