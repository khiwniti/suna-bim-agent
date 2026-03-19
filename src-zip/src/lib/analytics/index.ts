/**
 * Analytics Module
 *
 * Centralized analytics tracking using PostHog.
 * Provides event tracking, user identification, and feature flags.
 */

// PostHog provider and core functions
export {
  PostHogProvider,
  trackEvent,
  identifyUser,
  resetUser,
  isFeatureEnabled,
  getFeatureFlagPayload,
  setUserProperties,
  setGroup,
  usePostHog,
  useFeatureFlagEnabled,
  useFeatureFlagPayload,
  posthog,
} from './posthog';

export type { AnalyticsEvent } from './posthog';

// Analytics hooks
export {
  useCalculatorAnalytics,
  useReportAnalytics,
  useBIMViewerAnalytics,
  useAuthAnalytics,
  useChatAnalytics,
  useNavigationAnalytics,
  useAnalytics,
} from './hooks';
