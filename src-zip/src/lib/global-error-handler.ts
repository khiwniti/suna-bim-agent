/**
 * Global Error Handler
 *
 * Catches unhandled errors and promise rejections globally.
 * Should be initialized once at app startup.
 *
 * ★ Insight ─────────────────────────────────────
 * This handles errors that escape React's error boundary system:
 * - Unhandled promise rejections (async errors)
 * - Global JavaScript errors
 * - Event handler errors
 * ─────────────────────────────────────────────────
 */

'use client';

import { useEffect } from 'react';
import { logError, logWarning } from '@/lib/error-logging';
import { reportError } from '@/lib/error-reporting';

/**
 * Initialize global error handlers
 */
export function initGlobalErrorHandlers(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // Handle unhandled promise rejections
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault();

    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    const context = {
      component: 'GlobalHandler',
      action: 'unhandled-rejection',
      metadata: {
        type: 'unhandledrejection',
      },
    };

    logError(error, context);

    // Report to monitoring service
    reportError(error, context);
  };

  // Handle global JavaScript errors
  const handleError = (event: ErrorEvent) => {
    // Ignore ResizeObserver errors (common false positive)
    if (event.message.includes('ResizeObserver')) {
      return;
    }

    const error = event.error instanceof Error
      ? event.error
      : new Error(event.message);

    const context = {
      component: 'GlobalHandler',
      action: 'global-error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    };

    logError(error, context);

    // Report to monitoring service
    reportError(error, context);
  };

  // Add listeners
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  window.addEventListener('error', handleError);

  // Return cleanup function
  return () => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener('error', handleError);
  };
}

/**
 * React hook to initialize global error handlers
 */
export function useGlobalErrorHandler(): void {
  useEffect(() => {
    const cleanup = initGlobalErrorHandlers();
    return cleanup;
  }, []);
}

/**
 * Report error to monitoring (uses error-reporting service)
 */
export async function reportErrorToMonitoring(
  error: Error,
  context?: Record<string, unknown>
): Promise<void> {
  // Use the unified error reporting service
  await reportError(error, context);

  logWarning('Error reported to monitoring', {
    component: 'ErrorReporter',
    metadata: { error: error.message, context },
  });
}

/**
 * Safe async wrapper that catches and logs errors
 */
export function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: { component?: string; action?: string }
): Promise<T> {
  return fn().catch((error) => {
    logError(error instanceof Error ? error : new Error(String(error)), {
      component: context?.component || 'safeAsync',
      action: context?.action || 'async-operation',
    });
    return fallback;
  });
}

/**
 * Try-catch wrapper for synchronous operations
 */
export function safeTry<T>(
  fn: () => T,
  fallback: T,
  context?: { component?: string; action?: string }
): T {
  try {
    return fn();
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      component: context?.component || 'safeTry',
      action: context?.action || 'sync-operation',
    });
    return fallback;
  }
}
