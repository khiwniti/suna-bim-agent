'use client';

/**
 * ViewerErrorBoundary - Error boundary specifically for 3D viewers
 *
 * Handles:
 * - WebGL context loss
 * - xeokit-sdk initialization failures
 * - Memory exhaustion during large model loads
 * - Runtime rendering errors
 *
 * ★ Insight ─────────────────────────────────────
 * WebGL applications require special error handling because:
 * 1. Context can be lost when GPU resources are exhausted
 * 2. Large BIM models can cause out-of-memory errors
 * 3. Shader compilation can fail on some hardware
 * This boundary provides recovery options specific to 3D rendering.
 * ─────────────────────────────────────────────────
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { reportError } from '@/lib/error-reporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorType: 'webgl' | 'memory' | 'network' | 'unknown';
}

/**
 * Categorize error type for appropriate recovery suggestions
 */
function categorizeError(error: Error): State['errorType'] {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (
    message.includes('webgl') ||
    message.includes('context') ||
    message.includes('shader') ||
    message.includes('gl_')
  ) {
    return 'webgl';
  }

  if (
    message.includes('memory') ||
    message.includes('allocation') ||
    message.includes('heap') ||
    name.includes('rangeerror')
  ) {
    return 'memory';
  }

  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('load')
  ) {
    return 'network';
  }

  return 'unknown';
}

export class ViewerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorType: 'unknown',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorType: categorizeError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging
    console.error('[ViewerErrorBoundary] Caught error:', error);
    console.error('[ViewerErrorBoundary] Component stack:', errorInfo.componentStack);

    // Call external error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report error to monitoring service (Sentry or console fallback)
    const errorType = categorizeError(error);
    reportError(error, {
      component: 'ViewerErrorBoundary',
      errorType,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorType: 'unknown' });
    this.props.onReset?.();
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorType } = this.state;

      // Error-specific recovery suggestions
      const suggestions = {
        webgl: {
          title: 'WebGL Rendering Error',
          description:
            'The 3D viewer encountered a graphics rendering issue. This may be due to GPU resource limits or unsupported hardware.',
          actions: [
            'Try refreshing the page',
            'Close other browser tabs using 3D graphics',
            'Update your graphics drivers',
            'Try a different browser (Chrome recommended)',
          ],
        },
        memory: {
          title: 'Memory Limit Reached',
          description:
            'The model is too large for available memory. Try loading a smaller model or close other applications.',
          actions: [
            'Close other browser tabs',
            'Load a smaller portion of the model',
            'Use a device with more RAM',
            'Try the lightweight view mode',
          ],
        },
        network: {
          title: 'Network Error',
          description:
            'Failed to load the model from the server. Check your internet connection and try again.',
          actions: [
            'Check your internet connection',
            'Refresh the page',
            'Try again in a few minutes',
          ],
        },
        unknown: {
          title: 'Viewer Error',
          description:
            'An unexpected error occurred in the 3D viewer. Please try refreshing the page.',
          actions: ['Refresh the page', 'Return to home page', 'Contact support if issue persists'],
        },
      };

      const info = suggestions[errorType];

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-background/95 backdrop-blur-sm rounded-lg border border-destructive/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-destructive">{info.title}</h2>
          </div>

          <p className="text-center text-muted-foreground mb-6 max-w-md">{info.description}</p>

          {/* Recovery suggestions */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6 max-w-md w-full">
            <h3 className="text-sm font-medium mb-2">Suggestions:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              {info.actions.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          </div>

          {/* Error details (collapsible) */}
          {error && process.env.NODE_ENV === 'development' && (
            <details className="mt-6 w-full max-w-md">
              <summary className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                <Bug className="w-4 h-4" />
                Error Details (Development Only)
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-48">
                {error.name}: {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with ViewerErrorBoundary
 */
export function withViewerErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  boundaryProps?: Omit<Props, 'children'>
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <ViewerErrorBoundary {...boundaryProps}>
      <Component {...props} />
    </ViewerErrorBoundary>
  );

  WrappedComponent.displayName = `withViewerErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

export default ViewerErrorBoundary;
