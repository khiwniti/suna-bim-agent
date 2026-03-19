'use client';

/**
 * useSmartPosition - Viewport-aware positioning hook for floating elements
 *
 * Features:
 * - Calculate optimal position based on viewport boundaries
 * - Account for other floating elements
 * - Handle mobile/desktop breakpoints
 * - Preserve user preferences when possible
 */

import { useState, useEffect, useCallback, type RefObject } from 'react';
import type { DockPosition } from '@/stores/chat-store';

interface Position {
  x: number;
  y: number;
}

interface Dimensions {
  width: number;
  height: number;
}

interface ViewportBounds {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface SmartPositionOptions {
  /** Reference to the positioned element */
  elementRef: RefObject<HTMLElement>;
  /** Current dock position preference */
  dockPosition: DockPosition;
  /** Minimum margin from viewport edges */
  margin?: number;
  /** Whether the element is currently visible */
  isVisible?: boolean;
  /** Other elements to avoid overlapping */
  avoidElements?: RefObject<HTMLElement>[];
}

interface SmartPositionResult {
  /** Calculated position */
  position: Position;
  /** Calculated dimensions (may be adjusted for mobile) */
  dimensions: Dimensions;
  /** Whether the element fits in the preferred position */
  fitsPreferred: boolean;
  /** Actual dock position after adjustment */
  actualDockPosition: DockPosition;
  /** Whether we're on a mobile viewport */
  isMobile: boolean;
  /** Recalculate position */
  recalculate: () => void;
}

// Breakpoints
const MOBILE_BREAKPOINT = 640;
const TABLET_BREAKPOINT = 1024;

// Default dimensions by dock position
const DEFAULT_DIMENSIONS: Record<DockPosition, Dimensions> = {
  corner: { width: 420, height: 520 },
  bottom: { width: 600, height: 400 },
  side: { width: 420, height: 600 },
};

// Mobile dimensions
const MOBILE_DIMENSIONS: Dimensions = {
  width: 0, // Will be calculated as viewport width - margin
  height: 0, // Will be calculated as 70% of viewport height
};

export function useSmartPosition({
  elementRef,
  dockPosition,
  margin = 16,
  isVisible = true,
  avoidElements = [],
}: SmartPositionOptions): SmartPositionResult {
  const [result, setResult] = useState<SmartPositionResult>({
    position: { x: 0, y: 0 },
    dimensions: DEFAULT_DIMENSIONS[dockPosition],
    fitsPreferred: true,
    actualDockPosition: dockPosition,
    isMobile: false,
    recalculate: () => {},
  });

  const calculatePosition = useCallback(() => {
    if (typeof window === 'undefined') return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Determine device type
    const isMobile = viewportWidth < MOBILE_BREAKPOINT;
    const isTablet = viewportWidth >= MOBILE_BREAKPOINT && viewportWidth < TABLET_BREAKPOINT;

    // Calculate dimensions
    let dimensions: Dimensions;

    if (isMobile) {
      // Mobile: nearly full width, 70% height
      dimensions = {
        width: viewportWidth - margin * 2,
        height: Math.min(viewportHeight * 0.7, viewportHeight - 100),
      };
    } else if (isTablet) {
      // Tablet: slightly smaller than desktop
      dimensions = {
        width: Math.min(400, viewportWidth - margin * 2),
        height: Math.min(500, viewportHeight - 100),
      };
    } else {
      // Desktop: use default dimensions
      dimensions = { ...DEFAULT_DIMENSIONS[dockPosition] };
    }

    // Calculate position based on dock position
    let position: Position;
    let actualDockPosition = dockPosition;

    if (isMobile) {
      // Mobile: always center at bottom
      position = {
        x: margin,
        y: viewportHeight - dimensions.height - 80, // Leave space for FAB
      };
      actualDockPosition = 'bottom';
    } else {
      switch (dockPosition) {
        case 'corner':
          position = {
            x: viewportWidth - dimensions.width - margin,
            y: viewportHeight - dimensions.height - 100, // Above FAB
          };
          break;

        case 'bottom':
          position = {
            x: (viewportWidth - dimensions.width) / 2,
            y: viewportHeight - dimensions.height - margin,
          };
          break;

        case 'side':
          position = {
            x: viewportWidth - dimensions.width - margin,
            y: (viewportHeight - dimensions.height) / 2,
          };
          break;

        default:
          position = {
            x: viewportWidth - dimensions.width - margin,
            y: viewportHeight - dimensions.height - 100,
          };
      }
    }

    // Check if position fits within viewport
    const fitsPreferred =
      position.x >= margin &&
      position.y >= margin &&
      position.x + dimensions.width <= viewportWidth - margin &&
      position.y + dimensions.height <= viewportHeight - margin;

    // Adjust if doesn't fit
    if (!fitsPreferred) {
      position.x = Math.max(margin, Math.min(position.x, viewportWidth - dimensions.width - margin));
      position.y = Math.max(margin, Math.min(position.y, viewportHeight - dimensions.height - margin));
    }

    // Check for overlaps with other elements
    avoidElements.forEach((ref) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const overlaps =
          position.x < rect.right + margin &&
          position.x + dimensions.width > rect.left - margin &&
          position.y < rect.bottom + margin &&
          position.y + dimensions.height > rect.top - margin;

        if (overlaps) {
          // Try to move to avoid overlap
          // Priority: move up, then left, then adjust
          if (position.y > rect.bottom) {
            position.y = rect.bottom + margin;
          } else if (position.y + dimensions.height < rect.top) {
            position.y = rect.top - dimensions.height - margin;
          } else if (position.x > rect.right) {
            position.x = rect.right + margin;
          } else {
            position.x = rect.left - dimensions.width - margin;
          }
        }
      }
    });

    setResult({
      position,
      dimensions,
      fitsPreferred,
      actualDockPosition,
      isMobile,
      recalculate: calculatePosition,
    });
  }, [dockPosition, margin, avoidElements]);

  // Recalculate on mount and when dependencies change
  useEffect(() => {
    if (!isVisible) return;

    calculatePosition();

    // Recalculate on resize
    const handleResize = () => {
      calculatePosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible, calculatePosition]);

  return result;
}

export default useSmartPosition;
