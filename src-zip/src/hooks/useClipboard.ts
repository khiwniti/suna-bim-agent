'use client';

/**
 * useClipboard Hook
 *
 * Provides clipboard copy functionality with success/error state tracking.
 * Used for copy buttons on code blocks, messages, etc.
 */

import { useState, useCallback } from 'react';

interface UseClipboardOptions {
  /** Duration in ms to show success state (default: 2000) */
  successDuration?: number;
  /** Callback on successful copy */
  onSuccess?: (text: string) => void;
  /** Callback on copy error */
  onError?: (error: Error) => void;
}

interface UseClipboardReturn {
  /** Copy text to clipboard */
  copy: (text: string) => Promise<boolean>;
  /** Whether the last copy was successful (resets after successDuration) */
  copied: boolean;
  /** Any error from the last copy attempt */
  error: Error | null;
  /** Reset the state */
  reset: () => void;
}

export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { successDuration = 2000, onSuccess, onError } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        const err = new Error('Clipboard API not supported');
        setError(err);
        onError?.(err);
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setError(null);
        onSuccess?.(text);

        // Reset after duration
        setTimeout(() => {
          setCopied(false);
        }, successDuration);

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to copy');
        setError(error);
        setCopied(false);
        onError?.(error);
        return false;
      }
    },
    [successDuration, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  return { copy, copied, error, reset };
}

export default useClipboard;
