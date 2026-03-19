'use client';

/**
 * usePanelData Hook
 *
 * Base hook for all panel data fetching. Uses SWR for caching and
 * revalidation, with event-bus subscription for real-time updates from chat.
 *
 * Features:
 * - SWR-based caching with configurable revalidation
 * - Event bus subscription for real-time chat updates (works even when fetching is disabled)
 * - Conditional fetching via enabled flag
 * - Manual refetch and cache update methods
 *
 * ★ Insight ─────────────────────────────────────
 * Event-driven data updates from AI tools work independently of SWR fetching.
 * This allows panels to receive data from AI even when no model is loaded.
 * ─────────────────────────────────────────────────
 */

import { useEffect, useCallback, useState } from 'react';
import useSWR, { type SWRConfiguration } from 'swr';
import { panelEventBus, type PanelEvent } from '@/lib/panel/event-bus';
import type { PanelId } from '@/lib/panels/types';

// ============================================
// Types
// ============================================

export interface UsePanelDataOptions<T> {
  /** Panel identifier for cache key and event filtering */
  panelId: PanelId;
  /** Function to fetch data from API */
  fetchFn: () => Promise<T>;
  /** Enable/disable fetching (e.g., when no model loaded) */
  enabled?: boolean;
  /** SWR refresh interval in milliseconds */
  refreshInterval?: number;
  /** Additional SWR options */
  swrOptions?: SWRConfiguration<T>;
}

export interface UsePanelDataReturn<T> {
  /** Fetched data or undefined */
  data: T | undefined;
  /** Data pushed via event bus from AI tools (works without model loaded) */
  eventData: T | undefined;
  /** Combined data: eventData takes precedence over API data */
  combinedData: T | undefined;
  /** Error if fetch failed */
  error: Error | undefined;
  /** True while fetching for the first time */
  isLoading: boolean;
  /** True if validating (refetching in background) */
  isValidating: boolean;
  /** Manually refetch data */
  refetch: () => Promise<T | undefined>;
  /** Update cache without refetch */
  updateCache: (data: T | ((prev: T | undefined) => T)) => void;
  /** Clear event-driven data */
  clearEventData: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export function usePanelData<T>({
  panelId,
  fetchFn,
  enabled = true,
  refreshInterval,
  swrOptions,
}: UsePanelDataOptions<T>): UsePanelDataReturn<T> {
  // Separate state for event-driven data (works even when SWR fetching is disabled)
  const [eventData, setEventData] = useState<T | undefined>(undefined);

  // Generate cache key - null disables fetching
  const cacheKey = enabled ? `panel-data-${panelId}` : null;

  // SWR for caching + revalidation
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    cacheKey,
    fetchFn,
    {
      refreshInterval,
      revalidateOnFocus: false, // Don't refetch on window focus
      revalidateOnReconnect: true, // Refetch on network reconnect
      dedupingInterval: 5000, // Dedupe requests within 5s
      ...swrOptions,
    }
  );

  // Subscribe to singleton panelEventBus for real-time updates from chat
  // IMPORTANT: This subscription works ALWAYS, even when SWR fetching is disabled
  // This allows AI tools to push data to panels without a model being loaded
  useEffect(() => {
    console.log(`[usePanelData] Subscribing to UPDATE_PANEL_DATA for panel: ${panelId}`);
    const unsubscribe = panelEventBus.subscribe('UPDATE_PANEL_DATA', (event: PanelEvent) => {
      console.log(`[usePanelData] Received UPDATE_PANEL_DATA event:`, event);
      if (
        event.event.type === 'UPDATE_PANEL_DATA' &&
        event.event.panelId === panelId
      ) {
        console.log(`[usePanelData] Event matches panelId ${panelId}, updating state`);
        const newData = event.event.data as T;
        const shouldMerge = (event.event as { merge?: boolean }).merge;

        // Always update eventData state (works without SWR)
        if (shouldMerge) {
          setEventData((prev) => prev ? { ...prev, ...newData } : newData);
        } else {
          setEventData(newData);
        }

        // Also update SWR cache if enabled
        if (enabled) {
          if (shouldMerge && data) {
            mutate({ ...data, ...newData }, false);
          } else {
            mutate(newData, false);
          }
        }
      }
    });

    return unsubscribe;
  }, [panelId, mutate, data, enabled]);

  // Manual refetch
  const refetch = useCallback(async () => {
    return mutate();
  }, [mutate]);

  // Update cache without API call
  const updateCache = useCallback(
    (newData: T | ((prev: T | undefined) => T)) => {
      if (typeof newData === 'function') {
        mutate((prev) => (newData as (prev: T | undefined) => T)(prev), false);
      } else {
        mutate(newData, false);
      }
    },
    [mutate]
  );

  // Clear event-driven data
  const clearEventData = useCallback(() => {
    setEventData(undefined);
  }, []);

  // Combined data: eventData takes precedence over API data
  const combinedData = eventData ?? data;

  return {
    data,
    eventData,
    combinedData,
    error,
    isLoading,
    isValidating,
    refetch,
    updateCache,
    clearEventData,
  };
}

export default usePanelData;
