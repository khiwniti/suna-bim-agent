/**
 * Tambo Context State
 *
 * Lightweight Zustand store for context state that Tambo context helpers read from.
 * Panels and viewer update this store, context helpers provide snapshot to AI.
 *
 * Uses persist middleware to retain model/panel state across page reloads,
 * enabling AI to remember context between sessions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// Types
// ============================================

export interface TamboContextState {
  // Model info
  modelId: string | null;
  modelFileName: string | null;
  elementCount: number;

  // Viewer state
  selectedElementIds: string[];
  highlightedElementIds: string[];

  // Panel state
  activePanelId: string | null;
  visiblePanels: string[];

  // Actions
  setModelInfo: (info: { id: string; fileName: string; elementCount: number }) => void;
  setSelection: (ids: string[]) => void;
  setActivePanel: (id: string | null) => void;
  setVisiblePanels: (ids: string[]) => void;
  clearModel: () => void;
}

// ============================================
// Store with Persistence
// ============================================

export const useTamboContextState = create<TamboContextState>()(
  persist(
    (set) => ({
      // Initial state
      modelId: null,
      modelFileName: null,
      elementCount: 0,
      selectedElementIds: [],
      highlightedElementIds: [],
      activePanelId: null,
      visiblePanels: [],

      // Actions
      setModelInfo: (info) =>
        set({
          modelId: info.id,
          modelFileName: info.fileName,
          elementCount: info.elementCount,
        }),

      setSelection: (ids) => set({ selectedElementIds: ids }),

      setActivePanel: (id) => set({ activePanelId: id }),

      setVisiblePanels: (ids) => set({ visiblePanels: ids }),

      clearModel: () =>
        set({
          modelId: null,
          modelFileName: null,
          elementCount: 0,
          selectedElementIds: [],
          highlightedElementIds: [],
        }),
    }),
    {
      name: 'tambo-context-state',
      // Only persist model and panel info, not ephemeral selections
      partialize: (state) => ({
        modelId: state.modelId,
        modelFileName: state.modelFileName,
        elementCount: state.elementCount,
        activePanelId: state.activePanelId,
        visiblePanels: state.visiblePanels,
        // Exclude selectedElementIds and highlightedElementIds (ephemeral)
      }),
    }
  )
);

// ============================================
// Snapshot Access (for non-hook context helpers)
// ============================================

let stateSnapshot: TamboContextState | null = null;

/**
 * Sync current state to snapshot for context helpers.
 * Called from useTamboContextSync hook.
 */
export function syncContextState(state: TamboContextState): void {
  stateSnapshot = state;
}

/**
 * Get current state snapshot for context helpers.
 * Returns null if not yet synced.
 */
export function getContextStateSnapshot(): TamboContextState | null {
  return stateSnapshot;
}
