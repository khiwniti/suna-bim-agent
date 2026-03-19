/**
 * Mobile Utilities
 *
 * Hooks and utilities for mobile-specific functionality.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect mobile device
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook to detect touch device
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

/**
 * Hook to handle viewport height on mobile (accounting for browser chrome)
 */
export function useViewportHeight() {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);
}

/**
 * Hook for pull-to-refresh functionality
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      const touch = e.touches[0];
      (window as Window & { _pullStartY?: number })._pullStartY = touch.clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const startY = (window as Window & { _pullStartY?: number })._pullStartY;
    if (startY === undefined || window.scrollY > 0) return;

    const touch = e.touches[0];
    const distance = touch.clientY - startY;

    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.5, 100));
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    const startY = (window as Window & { _pullStartY?: number })._pullStartY;
    delete (window as Window & { _pullStartY?: number })._pullStartY;

    if (pullDistance > 60) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isRefreshing, pullDistance };
}

/**
 * Hook to detect scroll direction
 */
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return scrollDirection;
}

/**
 * Hook for safe area insets (notch, home indicator)
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateInsets = () => {
      const style = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(style.getPropertyValue('--sat') || '0', 10),
        right: parseInt(style.getPropertyValue('--sar') || '0', 10),
        bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
        left: parseInt(style.getPropertyValue('--sal') || '0', 10),
      });
    };

    // Set CSS variables for safe area
    document.documentElement.style.setProperty(
      '--sat',
      'env(safe-area-inset-top)'
    );
    document.documentElement.style.setProperty(
      '--sar',
      'env(safe-area-inset-right)'
    );
    document.documentElement.style.setProperty(
      '--sab',
      'env(safe-area-inset-bottom)'
    );
    document.documentElement.style.setProperty(
      '--sal',
      'env(safe-area-inset-left)'
    );

    updateInsets();
  }, []);

  return insets;
}

/**
 * Hook to handle keyboard visibility on mobile
 */
export function useKeyboardVisibility() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // On mobile, viewport height decreases when keyboard is visible
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      setIsKeyboardVisible(viewportHeight < windowHeight * 0.75);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, []);

  return isKeyboardVisible;
}
