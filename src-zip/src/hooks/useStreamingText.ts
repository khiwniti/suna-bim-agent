/**
 * useStreamingText Hook
 *
 * Provides typewriter effect for streaming text content.
 * Reveals text character-by-character with configurable speed,
 * pause on punctuation, and smooth animation.
 *
 * ★ Insight ─────────────────────────────────────
 * This hook creates the "typing" effect seen in ChatGPT/Claude:
 * 1. New content is queued and revealed progressively
 * 2. Punctuation triggers natural pauses for readability
 * 3. Supports both streaming (ongoing) and complete text
 * ─────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Configuration for streaming text behavior
 */
export interface StreamingTextConfig {
  /** Base delay between characters in ms (default: 20) */
  charDelay?: number;
  /** Additional delay after punctuation in ms (default: 100) */
  punctuationDelay?: number;
  /** Characters that trigger punctuation delay */
  punctuationChars?: string;
  /** Whether to skip animation and show all text immediately */
  instant?: boolean;
  /** Callback when streaming completes */
  onComplete?: () => void;
  /** Callback for each character revealed */
  onCharacter?: (char: string, index: number) => void;
}

/**
 * Return type for useStreamingText hook
 */
export interface UseStreamingTextReturn {
  /** Currently displayed text (progressively revealed) */
  displayedText: string;
  /** Whether text is currently being revealed */
  isRevealing: boolean;
  /** Whether all text has been revealed */
  isComplete: boolean;
  /** Progress percentage (0-100) */
  progress: number;
  /** Number of characters revealed */
  revealedCount: number;
  /** Total characters to reveal */
  totalCount: number;
  /** Skip to end immediately */
  skipToEnd: () => void;
  /** Pause the reveal */
  pause: () => void;
  /** Resume the reveal */
  resume: () => void;
  /** Reset and start over */
  reset: () => void;
}

const DEFAULT_CONFIG: Required<StreamingTextConfig> = {
  charDelay: 20,
  punctuationDelay: 100,
  punctuationChars: '.!?,;:',
  instant: false,
  onComplete: () => {},
  onCharacter: () => {},
};

/**
 * Hook for streaming text with typewriter effect
 *
 * @param text - The full text content to reveal
 * @param isStreaming - Whether new content is still arriving
 * @param config - Configuration options
 *
 * @example
 * ```tsx
 * const { displayedText, isRevealing } = useStreamingText(
 *   message.content,
 *   message.isStreaming,
 *   { charDelay: 15 }
 * );
 *
 * return (
 *   <p>
 *     {displayedText}
 *     {isRevealing && <StreamingCursor />}
 *   </p>
 * );
 * ```
 */
export function useStreamingText(
  text: string,
  isStreaming: boolean = false,
  config: StreamingTextConfig = {}
): UseStreamingTextReturn {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const {
    charDelay,
    punctuationDelay,
    punctuationChars,
    instant,
    onComplete,
    onCharacter,
  } = mergedConfig;

  // State
  const [displayedText, setDisplayedText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Refs for mutable state
  const indexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textRef = useRef(text);
  const onCompleteRef = useRef(onComplete);
  const onCharacterRef = useRef(onCharacter);

  // Keep refs updated
  useEffect(() => {
    textRef.current = text;
    onCompleteRef.current = onComplete;
    onCharacterRef.current = onCharacter;
  });

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle instant mode or when streaming completes
  useEffect(() => {
    if (instant) {
      setDisplayedText(text);
      indexRef.current = text.length;
      setIsComplete(true);
      return;
    }
  }, [instant, text]);

  // Track if reveal is in progress to avoid restarting on every text change
  const isRevealingRef = useRef(false);

  // Main reveal logic
  useEffect(() => {
    if (instant || isPaused) return;

    const revealNext = () => {
      const currentText = textRef.current;
      const currentIndex = indexRef.current;

      // Check if we've revealed everything available
      if (currentIndex >= currentText.length) {
        isRevealingRef.current = false;
        // If streaming is done and we've caught up, mark complete
        if (!isStreaming) {
          setIsComplete(true);
          onCompleteRef.current?.();
        }
        return;
      }

      isRevealingRef.current = true;

      // Reveal next character
      const char = currentText[currentIndex];
      indexRef.current = currentIndex + 1;
      setDisplayedText(currentText.slice(0, currentIndex + 1));
      onCharacterRef.current(char, currentIndex);

      // Calculate delay for next character
      const isPunctuation = punctuationChars.includes(char);
      const delay = isPunctuation ? charDelay + punctuationDelay : charDelay;

      // Schedule next reveal
      timeoutRef.current = setTimeout(revealNext, delay);
    };

    // Only start revealing if NOT already revealing and we have content to show
    // This prevents the cleanup function from interrupting an ongoing reveal
    if (!isRevealingRef.current && indexRef.current < text.length) {
      revealNext();
    } else if (indexRef.current >= text.length && !isStreaming) {
      // No more content and streaming is done
      setIsComplete(true);
    }

    // IMPORTANT: Don't clear the timeout on every render!
    // Only clear on unmount to let the reveal continue uninterrupted
  }, [text, isStreaming, isPaused, instant, charDelay, punctuationDelay, punctuationChars]);

  // Cleanup only on unmount, not on every effect re-run
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Control functions
  const skipToEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    isRevealingRef.current = false;
    setDisplayedText(textRef.current);
    indexRef.current = textRef.current.length;
    setIsComplete(true);
    onCompleteRef.current?.();
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    isRevealingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    // Note: isRevealingRef will be set to true when effect re-runs
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    indexRef.current = 0;
    isRevealingRef.current = false;
    setDisplayedText('');
    setIsComplete(false);
    setIsPaused(false);
  }, []);

  // Calculate derived values
  const totalCount = text.length;
  const revealedCount = displayedText.length;
  const progress = totalCount > 0 ? (revealedCount / totalCount) * 100 : 0;
  const isRevealing = !isComplete && !isPaused && revealedCount < totalCount;

  return {
    displayedText,
    isRevealing,
    isComplete,
    progress,
    revealedCount,
    totalCount,
    skipToEnd,
    pause,
    resume,
    reset,
  };
}

/**
 * Simplified hook for just getting the displayed text
 */
export function useTypewriter(
  text: string,
  isStreaming: boolean = false,
  speed: number = 20
): string {
  const { displayedText } = useStreamingText(text, isStreaming, {
    charDelay: speed,
  });
  return displayedText;
}

export default useStreamingText;
