/**
 * Analysis Results Store
 *
 * Centralized Zustand store for analysis results providing
 * a single source of truth for carbon, BOQ, and clash data.
 *
 * Both chat (artifact cards) and panels subscribe to this store.
 *
 * ★ Insight ─────────────────────────────────────
 * This store complements the event bus system:
 * - Event bus: Real-time notifications for UI updates
 * - This store: Persistent state for data consumption
 * ─────────────────────────────────────────────────
 */

import { create } from 'zustand';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Carbon analysis data structure
 */
export interface CarbonData {
  totalCarbon: number;
  unit: 'kgCO2e';
  breakdown: {
    materials: number;
    construction: number;
    transport: number;
  };
  hotspots?: Array<{
    element: string;
    carbon: number;
    percentage: number;
  }>;
  recommendations?: string[];
  timestamp: number;
}

/**
 * Bill of Quantities data structure
 */
export interface BOQData {
  items: Array<{
    id: string;
    item: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    category: string;
  }>;
  totalCost: number;
  currency: string;
  timestamp: number;
}

/**
 * Clash detection data structure
 */
export interface ClashData {
  clashes: Array<{
    id: string;
    elements: string[];
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status?: 'open' | 'resolved' | 'ignored';
  }>;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  timestamp: number;
}

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface AnalysisResultsStore {
  // Data
  carbonResults: CarbonData | null;
  boqResults: BOQData | null;
  clashResults: ClashData | null;

  // Actions
  setCarbonResults: (data: Omit<CarbonData, 'timestamp'>) => void;
  setBOQResults: (data: Omit<BOQData, 'timestamp'>) => void;
  setClashResults: (data: Omit<ClashData, 'timestamp'>) => void;
  clearResults: () => void;
  clearCarbonResults: () => void;
  clearBOQResults: () => void;
  clearClashResults: () => void;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useAnalysisResultsStore = create<AnalysisResultsStore>((set) => ({
  // Initial state
  carbonResults: null,
  boqResults: null,
  clashResults: null,

  // Actions
  setCarbonResults: (data) =>
    set({
      carbonResults: { ...data, timestamp: Date.now() },
    }),

  setBOQResults: (data) =>
    set({
      boqResults: { ...data, timestamp: Date.now() },
    }),

  setClashResults: (data) =>
    set({
      clashResults: { ...data, timestamp: Date.now() },
    }),

  clearResults: () =>
    set({
      carbonResults: null,
      boqResults: null,
      clashResults: null,
    }),

  clearCarbonResults: () => set({ carbonResults: null }),
  clearBOQResults: () => set({ boqResults: null }),
  clearClashResults: () => set({ clashResults: null }),
}));

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

/** Select carbon results */
export const useCarbonResults = () =>
  useAnalysisResultsStore((state) => state.carbonResults);

/** Select BOQ results */
export const useBOQResults = () =>
  useAnalysisResultsStore((state) => state.boqResults);

/** Select clash results */
export const useClashResults = () =>
  useAnalysisResultsStore((state) => state.clashResults);

/** Check if any analysis results exist */
export const useHasAnalysisResults = () =>
  useAnalysisResultsStore(
    (state) =>
      state.carbonResults !== null ||
      state.boqResults !== null ||
      state.clashResults !== null
  );

export default useAnalysisResultsStore;
