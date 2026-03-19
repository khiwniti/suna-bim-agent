/**
 * Accessibility Utilities for Streaming Components
 *
 * Provides:
 * - Screen reader announcements
 * - Reduced motion detection
 * - ARIA live region helpers
 * - Focus management utilities
 *
 * ★ Insight ─────────────────────────────────────
 * Accessibility in streaming UIs requires special attention:
 * 1. ARIA live regions announce content changes to screen readers
 * 2. Reduced motion support respects user preferences
 * 3. Focus management ensures keyboard users aren't lost during updates
 * ─────────────────────────────────────────────────
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ============================================================================
// Reduced Motion Detection
// ============================================================================

/**
 * Hook to detect user's reduced motion preference
 * Returns true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  // Initialize with a function to avoid SSR mismatch
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }

    // Legacy API fallback
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Get animation duration based on reduced motion preference
 * Returns 0 for reduced motion, normal duration otherwise
 */
export function useAnimationDuration(normalDuration: number = 300): number {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? 0 : normalDuration;
}

// ============================================================================
// Screen Reader Announcements
// ============================================================================

/**
 * Hook for announcing messages to screen readers
 * Uses ARIA live regions for dynamic content updates
 */
export function useScreenReaderAnnounce() {
  const announcerRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create announcer element on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if announcer already exists
    let announcer = document.getElementById('sr-announcer') as HTMLDivElement | null;

    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'sr-announcer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(announcer);
    }

    announcerRef.current = announcer;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Announce a message to screen readers
   * @param message - Text to announce
   * @param priority - 'polite' waits for current speech, 'assertive' interrupts
   */
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcerRef.current) return;

    // Clear any pending announcement
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update live region priority if needed
    announcerRef.current.setAttribute('aria-live', priority);

    // Clear then set content (ensures announcement triggers)
    announcerRef.current.textContent = '';

    timeoutRef.current = setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = message;
      }
    }, 100);
  }, []);

  return announce;
}

// ============================================================================
// Phase Announcements
// ============================================================================

/**
 * Human-readable labels for agent phases
 */
const PHASE_LABELS: Record<string, string> = {
  idle: 'Ready',
  thinking: 'Agent is thinking',
  reasoning: 'Agent is reasoning through the problem',
  tool_calling: 'Preparing to use a tool',
  tool_executing: 'Tool is running',
  synthesizing: 'Combining results',
  responding: 'Generating response',
  error: 'An error occurred',
};

/**
 * Hook for announcing agent phase changes to screen readers
 */
export function usePhaseAnnouncements(phase: string, currentToolName?: string | null) {
  const announce = useScreenReaderAnnounce();
  const previousPhaseRef = useRef<string>(phase);

  useEffect(() => {
    // Only announce on phase change
    if (previousPhaseRef.current === phase) return;
    previousPhaseRef.current = phase;

    let message = PHASE_LABELS[phase] || `Phase: ${phase}`;

    // Add tool name if executing
    if (phase === 'tool_executing' && currentToolName) {
      message = `Running ${currentToolName}`;
    }

    announce(message, phase === 'error' ? 'assertive' : 'polite');
  }, [phase, currentToolName, announce]);
}

// ============================================================================
// Focus Management
// ============================================================================

/**
 * Hook for trapping focus within a container
 * Useful for modals and floating panels
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement | null>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store current focus
    previousActiveElement.current = document.activeElement;

    // Get focusable elements
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    // Focus first element
    (focusableElements[0] as HTMLElement).focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

// ============================================================================
// ARIA Props Helpers
// ============================================================================

/**
 * Get ARIA props for a live streaming region
 */
export function getStreamingAriaProps(isStreaming: boolean) {
  return {
    'aria-live': isStreaming ? ('polite' as const) : ('off' as const),
    'aria-atomic': false,
    'aria-relevant': 'additions text' as const,
    'aria-busy': isStreaming,
  };
}

/**
 * Get ARIA props for a tool execution card
 */
export function getToolCardAriaProps(
  toolName: string,
  status: 'pending' | 'running' | 'success' | 'error',
  progress?: number
) {
  const labels: Record<string, string> = {
    pending: `${toolName} is pending`,
    running: progress !== undefined
      ? `${toolName} is running, ${progress}% complete`
      : `${toolName} is running`,
    success: `${toolName} completed successfully`,
    error: `${toolName} failed`,
  };

  return {
    role: 'status' as const,
    'aria-label': labels[status],
    'aria-busy': status === 'running',
  };
}

/**
 * Get ARIA props for the workflow timeline
 */
export function getTimelineAriaProps(eventCount: number, isComplete: boolean) {
  return {
    role: 'log' as const,
    'aria-label': `Workflow timeline with ${eventCount} events`,
    'aria-live': isComplete ? ('off' as const) : ('polite' as const),
  };
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

/**
 * Hook for arrow key navigation within a list
 */
export function useArrowKeyNavigation(itemCount: number) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, itemCount - 1));
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(itemCount - 1);
          break;
      }
    },
    [itemCount]
  );

  return { focusedIndex, setFocusedIndex, handleKeyDown };
}
