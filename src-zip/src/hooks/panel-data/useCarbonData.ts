'use client';

/**
 * useCarbonData Hook
 *
 * Fetches carbon analysis data for the Carbon Dashboard panel.
 * Combines API data with real-time chat updates via the base usePanelData hook.
 *
 * Features:
 * - Auto-fetches when model changes
 * - Disables fetch when no model loaded
 * - Subscribes to chat tool results for real-time updates
 * - Receives AI-pushed data even without a model loaded
 * - Typed CarbonData interface
 *
 * ★ Insight ─────────────────────────────────────
 * The hook returns both API data and event-driven data. Event data comes from
 * AI tools via the event bus and works independently of model state.
 * This enables AI to show carbon analysis results even before a model is loaded.
 * ─────────────────────────────────────────────────
 */

import { useMemo } from 'react';
import { useBIMStore } from '@/stores/bim-store';
import { useAnalysisResultsStore, type CarbonData as StoreCarbonData } from '@/stores/analysis-results-store';
import { usePanelData } from './usePanelData';

// ============================================
// Types
// ============================================

export interface CarbonMaterial {
  /** Material name (e.g., "Concrete", "Steel") */
  name: string;
  /** Embodied carbon in kgCO2e */
  carbon: number;
  /** Percentage of total carbon */
  percentage: number;
}

export interface CarbonCategory {
  /** Category name (e.g., "Structure", "Envelope") */
  category: string;
  /** Embodied carbon in kgCO2e */
  carbon: number;
}

export interface CarbonData {
  /** Total embodied carbon */
  totalCarbon: number;
  /** Unit of measurement (typically "kgCO2e") */
  unit: string;
  /** Breakdown by material */
  materials?: CarbonMaterial[];
  /** Breakdown by building category */
  categories?: CarbonCategory[];
  /** Raw analysis text from AI */
  rawAnalysis?: string;
  /** Timestamp of analysis */
  timestamp?: number;
}

// ============================================
// API Fetcher
// ============================================

async function fetchCarbonData(modelId: string): Promise<CarbonData> {
  const response = await fetch(`/api/bim/carbon/${modelId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch carbon data: ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// Store Data Transformation Helper
// ============================================

/**
 * Transforms store CarbonData format to panel CarbonData format
 * Store format has breakdown object, panel format has materials array
 */
function transformStoreData(storeData: StoreCarbonData): CarbonData {
  const materials: CarbonMaterial[] = Object.entries(storeData.breakdown).map(
    ([name, carbon]) => ({
      name,
      carbon,
      percentage: (carbon / storeData.totalCarbon) * 100,
    })
  );

  const categories: CarbonCategory[] = Object.entries(storeData.breakdown).map(
    ([category, carbon]) => ({
      category,
      carbon,
    })
  );

  return {
    totalCarbon: storeData.totalCarbon,
    unit: storeData.unit,
    materials,
    categories,
    timestamp: storeData.timestamp,
  };
}

// ============================================
// Hook Implementation
// ============================================

export function useCarbonData() {
  // Get current model from BIM store
  const currentModel = useBIMStore((state) => state.currentModel);
  const modelId = currentModel?.id;

  // Subscribe to analysis results store for carbon data
  const analysisStoreData = useAnalysisResultsStore((state) => state.carbonResults);

  // Transform store data to panel format
  const storeData = useMemo(() => {
    if (!analysisStoreData) return null;
    return transformStoreData(analysisStoreData);
  }, [analysisStoreData]);

  // Memoize fetch function to avoid recreating on every render
  const fetchFn = useMemo(() => {
    if (!modelId) return async () => undefined as unknown as CarbonData;
    return () => fetchCarbonData(modelId);
  }, [modelId]);

  // Use base panel data hook with carbon-specific configuration
  const result = usePanelData<CarbonData>({
    panelId: 'carbon-dashboard',
    fetchFn,
    enabled: !!modelId,
    swrOptions: {
      // Don't retry on error - carbon analysis may not be available
      shouldRetryOnError: false,
    },
  });

  // Determine if we have any data from any source
  // Priority: eventData (from event bus) > storeData (from analysis store) > API data
  const hasData = !!(
    result.combinedData?.totalCarbon !== undefined ||
    result.combinedData?.materials?.length ||
    result.combinedData?.categories?.length ||
    storeData?.totalCarbon !== undefined
  );

  return {
    ...result,
    /** Data from analysis results store (transformed to panel format) */
    storeData,
    /** Current model ID being analyzed */
    modelId,
    /** Whether a model is loaded and ready for analysis */
    hasModel: !!modelId,
    /** Whether we have any data (from API, AI events, or analysis store) */
    hasData,
  };
}

export default useCarbonData;
