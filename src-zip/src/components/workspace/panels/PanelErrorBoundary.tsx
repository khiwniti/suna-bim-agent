'use client';

/**
 * PanelErrorBoundary
 *
 * Error boundary specifically designed for workspace panels.
 * Shows a friendly error message with retry button.
 */

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

// ============================================
// Types
// ============================================

interface PanelErrorBoundaryProps {
  /** Name of the panel for error message */
  panelName: string;
  /** Children to render */
  children: ReactNode;
  /** Optional callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface PanelErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================
// Error Fallback UI
// ============================================

interface ErrorFallbackProps {
  panelName: string;
  error: Error | null;
  onRetry: () => void;
}

function ErrorFallback({ panelName, error, onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>

      <h3 className="text-lg font-semibold mb-2">
        Something went wrong
      </h3>

      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        The {panelName} encountered an error and couldn&apos;t load properly.
      </p>

      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-4 w-full max-w-md text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            Error details
          </summary>
          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
    </div>
  );
}

// ============================================
// Error Boundary Class Component
// ============================================

export class PanelErrorBoundary extends Component<
  PanelErrorBoundaryProps,
  PanelErrorBoundaryState
> {
  constructor(props: PanelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PanelErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error
    console.error(`[PanelErrorBoundary] ${this.props.panelName}:`, error, errorInfo);

    // Call optional callback
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          panelName={this.props.panelName}
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default PanelErrorBoundary;
