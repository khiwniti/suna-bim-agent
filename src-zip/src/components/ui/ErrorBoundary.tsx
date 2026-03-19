'use client';

/**
 * Error Boundary Component
 *
 * Catches React errors and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from '@/i18n/provider';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Translated fallback component
function TranslatedErrorFallback({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
      <svg
        className="mb-4 h-12 w-12 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h2 className="mb-2 text-lg font-semibold text-red-700 dark:text-red-400">
        {t('errorBoundary.title')}
      </h2>
      <p className="mb-4 text-sm text-red-600 dark:text-red-300">
        {error?.message || t('errorBoundary.defaultMessage')}
      </p>
      <button
        onClick={onRetry}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
      >
        {t('errorBoundary.tryAgain')}
      </button>
    </div>
  );
}

// Translated loading fallback
function TranslatedLoadingFallback() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="text-sm text-muted-foreground">
        {t('common.loading')}
      </p>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <TranslatedErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Async Error Boundary for Suspense boundaries
 */
interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AsyncErrorBoundary({
  children,
  fallback,
}: AsyncErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={fallback || <TranslatedLoadingFallback />}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * withErrorBoundary HOC
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithErrorBoundary;
}

export default ErrorBoundary;
