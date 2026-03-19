/**
 * Web Vitals Reporting
 *
 * Tracks Core Web Vitals and reports to analytics.
 */

'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { trackEvent } from '@/lib/analytics';

interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

// Thresholds for Core Web Vitals
const thresholds = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

export function useWebVitalsReporting() {
  useReportWebVitals((metric) => {
    const { id, name, value, delta, navigationType } = metric;
    const rating = getRating(name, value);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${name}: ${Math.round(value)} (${rating})`);
    }

    // Report to analytics
    trackEvent('web_vitals', {
      metric_id: id,
      metric_name: name,
      metric_value: Math.round(value),
      metric_rating: rating,
      metric_delta: Math.round(delta),
      navigation_type: navigationType,
    });
  });
}

/**
 * Component to enable Web Vitals reporting
 */
export function WebVitalsReporter() {
  useWebVitalsReporting();
  return null;
}

/**
 * Performance observer for custom metrics
 */
export function usePerformanceObserver() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Long task observer
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) {
          console.warn(`[Performance] Long task detected: ${entry.duration}ms`);
          trackEvent('long_task', {
            duration: Math.round(entry.duration),
            start_time: Math.round(entry.startTime),
          });
        }
      });
    });

    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // longtask not supported
    }

    // Resource timing observer
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const resourceEntry = entry as PerformanceResourceTiming;
        if (resourceEntry.duration > 1000) {
          console.warn(`[Performance] Slow resource: ${entry.name} (${resourceEntry.duration}ms)`);
        }
      });
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      // resource timing not supported
    }

    return () => {
      longTaskObserver.disconnect();
      resourceObserver.disconnect();
    };
  }, []);
}
