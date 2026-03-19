/**
 * Prefetch Utilities
 *
 * Intelligent prefetching for improved navigation performance.
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Routes to prefetch on idle
const PREFETCH_ROUTES = [
  '/calculator',
  '/pricing',
  '/blog',
  '/boq-analyzer',
];

/**
 * Hook to prefetch routes when browser is idle
 */
export function usePrefetchOnIdle() {
  const router = useRouter();
  const prefetchedRef = useRef(new Set<string>());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefetchRoutes = () => {
      PREFETCH_ROUTES.forEach((route) => {
        if (!prefetchedRef.current.has(route)) {
          router.prefetch(route);
          prefetchedRef.current.add(route);
        }
      });
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetchRoutes, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    } else {
      const id = setTimeout(prefetchRoutes, 1000);
      return () => clearTimeout(id);
    }
  }, [router]);
}

/**
 * Hook to prefetch route on hover/focus
 */
export function usePrefetchOnHover(route: string) {
  const router = useRouter();
  const prefetchedRef = useRef(false);

  const handlePrefetch = useCallback(() => {
    if (!prefetchedRef.current) {
      router.prefetch(route);
      prefetchedRef.current = true;
    }
  }, [router, route]);

  return {
    onMouseEnter: handlePrefetch,
    onFocus: handlePrefetch,
  };
}

/**
 * Intersection observer based prefetching
 */
export function usePrefetchOnVisible(route: string) {
  const router = useRouter();
  const prefetchedRef = useRef(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !prefetchedRef.current) {
            router.prefetch(route);
            prefetchedRef.current = true;
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px' }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [router, route]);

  return elementRef;
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;

  // Preload fonts
  const fonts = [
    '/fonts/inter-var.woff2',
  ];

  fonts.forEach((font) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.href = font;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Preconnect to external domains
 */
export function setupPreconnects() {
  if (typeof window === 'undefined') return;

  const domains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://cdnjs.cloudflare.com',
  ];

  domains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}
