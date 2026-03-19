/**
 * PostHog Analytics Provider
 *
 * Provides PostHog analytics context for the entire application.
 * Handles initialization, user identification, and feature flags.
 *
 * ★ Insight ─────────────────────────────────────
 * PostHog provides:
 * - Event tracking for user behavior analysis
 * - Feature flags for gradual rollouts
 * - Session recording for UX debugging
 * - A/B testing capabilities
 * ─────────────────────────────────────────────────
 */

'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// PostHog configuration
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// Initialize PostHog only on client side
if (typeof window !== 'undefined' && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Capture pageviews automatically
    capture_pageview: false, // We'll handle this manually for better control
    // Capture page leaves
    capture_pageleave: true,
    // Respect Do Not Track
    respect_dnt: true,
    // Disable session recording by default (can enable for specific users)
    disable_session_recording: true,
    // Persistence mode
    persistence: 'localStorage+cookie',
    // Bootstrap feature flags for faster initial load
    bootstrap: {
      featureFlags: {},
    },
  });
}

/**
 * Page view tracking component
 */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!POSTHOG_KEY) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    posthog.capture('$pageview', {
      $current_url: url,
    });
  }, [pathname, searchParams]);

  return null;
}

/**
 * PostHog Provider wrapper
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  // If PostHog is not configured, just render children
  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  );
}

// ============================================
// Analytics Event Types
// ============================================

export type AnalyticsEvent =
  // Auth events
  | 'user_signed_up'
  | 'user_signed_in'
  | 'user_signed_out'
  // Calculator events
  | 'calculator_started'
  | 'calculator_completed'
  | 'material_added'
  | 'material_removed'
  | 'building_type_selected'
  // Report events
  | 'report_generated'
  | 'report_exported_pdf'
  | 'report_exported_excel'
  // BIM Viewer events
  | 'model_uploaded'
  | 'model_viewed'
  | 'measurement_taken'
  | 'section_created'
  // Chat events
  | 'chat_message_sent'
  | 'chat_session_started'
  // Navigation events
  | 'cta_clicked'
  | 'pricing_viewed'
  | 'case_study_viewed'
  | 'solution_page_viewed'
  // Performance events
  | 'web_vitals'
  | 'long_task';

// ============================================
// Analytics Functions
// ============================================

/**
 * Track an analytics event
 */
export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>
) {
  if (!POSTHOG_KEY || typeof window === 'undefined') return;

  posthog.capture(event, {
    timestamp: new Date().toISOString(),
    ...properties,
  });
}

/**
 * Identify a user (call after authentication)
 */
export function identifyUser(
  userId: string,
  traits?: {
    email?: string;
    name?: string;
    company?: string;
    plan?: string;
    [key: string]: unknown;
  }
) {
  if (!POSTHOG_KEY || typeof window === 'undefined') return;

  posthog.identify(userId, {
    ...traits,
    identified_at: new Date().toISOString(),
  });
}

/**
 * Reset user identity (call on logout)
 */
export function resetUser() {
  if (!POSTHOG_KEY || typeof window === 'undefined') return;

  posthog.reset();
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flagKey: string): boolean {
  if (!POSTHOG_KEY || typeof window === 'undefined') return false;

  return posthog.isFeatureEnabled(flagKey) ?? false;
}

/**
 * Get feature flag payload
 */
export function getFeatureFlagPayload<T>(flagKey: string): T | undefined {
  if (!POSTHOG_KEY || typeof window === 'undefined') return undefined;

  return posthog.getFeatureFlagPayload(flagKey) as T | undefined;
}

/**
 * Set user properties (without creating new events)
 */
export function setUserProperties(properties: Record<string, unknown>) {
  if (!POSTHOG_KEY || typeof window === 'undefined') return;

  posthog.setPersonProperties(properties);
}

/**
 * Track a group (company/organization)
 */
export function setGroup(groupType: string, groupKey: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY || typeof window === 'undefined') return;

  posthog.group(groupType, groupKey, properties);
}

// ============================================
// React Hooks
// ============================================

export { usePostHog, useFeatureFlagEnabled, useFeatureFlagPayload } from 'posthog-js/react';

// Re-export posthog instance for advanced usage
export { posthog };
