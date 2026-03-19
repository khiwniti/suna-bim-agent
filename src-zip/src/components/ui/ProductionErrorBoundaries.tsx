/**
 * Specialized Error Boundaries for Production
 *
 * Component-specific error boundaries with tailored fallback UIs
 * and logging integration for critical application sections.
 *
 * ★ Insight ─────────────────────────────────────
 * Different parts of the app need different error handling:
 * - BIM Viewer: Offer reload, show technical details for debugging
 * - Calculator: Allow retry with preserved inputs
 * - Chat: Show reconnection options
 * - Generic: Clean fallback with recovery actions
 * ─────────────────────────────────────────────────
 */

'use client';

import React, { Component, ErrorInfo, ReactNode, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  MessageSquare,
  Box,
  Calculator,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import { logError, createErrorHandler } from '@/lib/error-logging';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/provider';

// ============================================
// Base Error Boundary
// ============================================

interface BaseErrorBoundaryProps {
  children: ReactNode;
  component: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface BaseErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class BaseErrorBoundary extends Component<BaseErrorBoundaryProps, BaseErrorBoundaryState> {
  private errorHandler;

  constructor(props: BaseErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.errorHandler = createErrorHandler(props.component);
  }

  static getDerivedStateFromError(error: Error): Partial<BaseErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.errorHandler.log(error, 'component-crash', {
      componentStack: errorInfo.componentStack,
    });
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return null; // Subclasses provide fallback
    }
    return this.props.children;
  }
}

// ============================================
// BIM Viewer Error Boundary
// ============================================

interface ViewerErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
  onGoHome: () => void;
}

function ViewerErrorFallback({ error, errorInfo, onRetry, onGoHome }: ViewerErrorFallbackProps) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyErrorDetails = useCallback(() => {
    const details = `Error: ${error?.message}\n\nStack:\n${error?.stack}\n\nComponent Stack:\n${errorInfo?.componentStack}`;
    navigator.clipboard.writeText(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [error, errorInfo]);

  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-foreground">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-500/20 p-4">
            <Box className="h-12 w-12 text-red-400" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold">{t('errorBoundaries.viewerError')}</h2>
        <p className="mb-6 max-w-md text-sm text-slate-400">
          {t('errorBoundaries.viewerErrorDescription')}
        </p>

        <div className="mb-6 flex flex-wrap justify-center gap-3">
          <Button
            onClick={onRetry}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <RefreshCw className="h-4 w-4" />
            {t('errorBoundaries.reloadViewer')}
          </Button>
          <Button
            onClick={onGoHome}
            variant="outline"
            className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Home className="h-4 w-4" />
            {t('errorBoundaries.goToDashboard')}
          </Button>
        </div>

        {/* Technical Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-400"
        >
          {t('errorBoundaries.technicalDetails')}
          {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="relative rounded-lg bg-slate-950 p-4 text-left">
                <button
                  onClick={copyErrorDetails}
                  className="absolute right-2 top-2 rounded p-1 hover:bg-slate-800"
                  title={t('errorBoundaries.copyErrorDetails')}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-500" />
                  )}
                </button>
                <pre className="max-h-40 overflow-auto text-xs text-slate-400">
                  <code>
                    {error?.message}
                    {'\n\n'}
                    {error?.stack?.slice(0, 500)}
                  </code>
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

interface ViewerErrorBoundaryProps {
  children: ReactNode;
  onGoHome?: () => void;
}

interface ViewerErrorBoundaryState extends BaseErrorBoundaryState {}

export class ViewerErrorBoundary extends Component<ViewerErrorBoundaryProps, ViewerErrorBoundaryState> {
  private errorHandler = createErrorHandler('BIMViewer');

  constructor(props: ViewerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ViewerErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.errorHandler.log(error, 'viewer-crash', {
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    this.props.onGoHome?.();
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ViewerErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }
    return this.props.children;
  }
}

// ============================================
// Calculator Error Boundary
// ============================================

interface CalculatorErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

function CalculatorErrorFallback({ error, onRetry }: CalculatorErrorFallbackProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800 dark:bg-amber-900/20">
      <div className="mb-4 rounded-full bg-amber-100 p-3 dark:bg-amber-900/40">
        <Calculator className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>

      <h3 className="mb-2 text-lg font-semibold text-amber-800 dark:text-amber-300">
        {t('errorBoundaries.calculationError')}
      </h3>
      <p className="mb-4 max-w-sm text-sm text-amber-700 dark:text-amber-400">
        {error?.message || t('errorBoundaries.calculationErrorDescription')}
      </p>

      <Button
        onClick={onRetry}
        className="gap-2 bg-amber-600 text-foreground hover:bg-amber-700"
      >
        <RefreshCw className="h-4 w-4" />
        {t('errorBoundaries.retryAnalysis')}
      </Button>
    </div>
  );
}

interface CalculatorErrorBoundaryProps {
  children: ReactNode;
}

export class CalculatorErrorBoundary extends Component<CalculatorErrorBoundaryProps, BaseErrorBoundaryState> {
  private errorHandler = createErrorHandler('CarbonCalculator');

  constructor(props: CalculatorErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<BaseErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.errorHandler.log(error, 'calculation-error', {
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <CalculatorErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

// ============================================
// Chat Error Boundary
// ============================================

interface ChatErrorFallbackProps {
  onRetry: () => void;
}

function ChatErrorFallback({ onRetry }: ChatErrorFallbackProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 rounded-full bg-blue-100 p-3 dark:bg-blue-900/40">
        <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      </div>

      <h3 className="mb-2 font-medium text-slate-800 dark:text-slate-200">
        {t('errorBoundaries.chatConnectionLost')}
      </h3>
      <p className="mb-4 max-w-xs text-sm text-slate-600 dark:text-slate-400">
        {t('errorBoundaries.chatConnectionDescription')}
      </p>

      <Button
        onClick={onRetry}
        size="sm"
        className="gap-2 bg-primary hover:bg-primary/90"
      >
        <RefreshCw className="h-3 w-3" />
        {t('errorBoundaries.reconnect')}
      </Button>
    </div>
  );
}

interface ChatErrorBoundaryProps {
  children: ReactNode;
}

export class ChatErrorBoundary extends Component<ChatErrorBoundaryProps, BaseErrorBoundaryState> {
  private errorHandler = createErrorHandler('Chat');

  constructor(props: ChatErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<BaseErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.errorHandler.log(error, 'chat-error', {
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return <ChatErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

// ============================================
// Generic Feature Error Boundary
// ============================================

interface FeatureErrorFallbackProps {
  featureName: string;
  className?: string;
  onRetry: () => void;
}

function FeatureErrorFallback({ featureName, className, onRetry }: FeatureErrorFallbackProps) {
  const { t } = useTranslation();

  return (
    <div className={cn(
      "flex min-h-[150px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50",
      className
    )}>
      <AlertTriangle className="mb-3 h-6 w-6 text-slate-400" />
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
        {t('errorBoundaries.featureUnavailable', { feature: featureName })}
      </p>
      <Button
        onClick={onRetry}
        size="sm"
        variant="outline"
        className="gap-1.5"
      >
        <RefreshCw className="h-3 w-3" />
        {t('common.retry')}
      </Button>
    </div>
  );
}

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  className?: string;
}

export class FeatureErrorBoundary extends Component<FeatureErrorBoundaryProps, BaseErrorBoundaryState> {
  private errorHandler;

  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.errorHandler = createErrorHandler(props.featureName);
  }

  static getDerivedStateFromError(error: Error): Partial<BaseErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.errorHandler.log(error, 'feature-error', {
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <FeatureErrorFallback
          featureName={this.props.featureName}
          className={this.props.className}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

// ============================================
// HOC Wrappers
// ============================================

export function withViewerErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  onGoHome?: () => void
): React.FC<P> {
  const WithBoundary: React.FC<P> = (props) => (
    <ViewerErrorBoundary onGoHome={onGoHome}>
      <WrappedComponent {...props} />
    </ViewerErrorBoundary>
  );
  WithBoundary.displayName = `WithViewerErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  return WithBoundary;
}

export function withCalculatorErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> {
  const WithBoundary: React.FC<P> = (props) => (
    <CalculatorErrorBoundary>
      <WrappedComponent {...props} />
    </CalculatorErrorBoundary>
  );
  WithBoundary.displayName = `WithCalculatorErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  return WithBoundary;
}

export function withChatErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> {
  const WithBoundary: React.FC<P> = (props) => (
    <ChatErrorBoundary>
      <WrappedComponent {...props} />
    </ChatErrorBoundary>
  );
  WithBoundary.displayName = `WithChatErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  return WithBoundary;
}
