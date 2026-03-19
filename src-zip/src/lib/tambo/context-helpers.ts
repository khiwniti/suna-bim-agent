/**
 * Tambo Context Helpers
 *
 * Lightweight helper functions that read from context state snapshot
 * to provide structured context information to Tambo AI.
 */

import { getContextStateSnapshot } from './context-state';

// ============================================
// Types
// ============================================

export interface ActiveModelInfo {
  modelId: string | null;
  fileName: string | null;
  elementCount: number;
  isLoaded: boolean;
}

export interface ViewerSelectionInfo {
  selectedIds: string[];
  highlightedIds: string[];
  selectionCount: number;
  hasSelection: boolean;
}

export interface ActivePanelInfo {
  panelId: string | null;
  hasActivePanel: boolean;
}

export interface WorkspaceLayoutInfo {
  visiblePanels: string[];
  activePanelId: string | null;
  panelCount: number;
  hasModel: boolean;
  hasSelection: boolean;
}

// ============================================
// Context Helpers
// ============================================

/**
 * Get information about the currently active BIM model.
 */
export function getActiveModel(): ActiveModelInfo {
  const snapshot = getContextStateSnapshot();

  if (!snapshot) {
    return {
      modelId: null,
      fileName: null,
      elementCount: 0,
      isLoaded: false,
    };
  }

  return {
    modelId: snapshot.modelId,
    fileName: snapshot.modelFileName,
    elementCount: snapshot.elementCount,
    isLoaded: snapshot.modelId !== null,
  };
}

/**
 * Get information about the current viewer selection.
 */
export function getViewerSelection(): ViewerSelectionInfo {
  const snapshot = getContextStateSnapshot();

  if (!snapshot) {
    return {
      selectedIds: [],
      highlightedIds: [],
      selectionCount: 0,
      hasSelection: false,
    };
  }

  return {
    selectedIds: snapshot.selectedElementIds,
    highlightedIds: snapshot.highlightedElementIds,
    selectionCount: snapshot.selectedElementIds.length,
    hasSelection: snapshot.selectedElementIds.length > 0,
  };
}

/**
 * Get information about the currently active panel.
 */
export function getActivePanel(): ActivePanelInfo {
  const snapshot = getContextStateSnapshot();

  if (!snapshot) {
    return {
      panelId: null,
      hasActivePanel: false,
    };
  }

  return {
    panelId: snapshot.activePanelId,
    hasActivePanel: snapshot.activePanelId !== null,
  };
}

/**
 * Get full workspace layout information.
 */
export function getWorkspaceLayout(): WorkspaceLayoutInfo {
  const snapshot = getContextStateSnapshot();

  if (!snapshot) {
    return {
      visiblePanels: [],
      activePanelId: null,
      panelCount: 0,
      hasModel: false,
      hasSelection: false,
    };
  }

  return {
    visiblePanels: snapshot.visiblePanels,
    activePanelId: snapshot.activePanelId,
    panelCount: snapshot.visiblePanels.length,
    hasModel: snapshot.modelId !== null,
    hasSelection: snapshot.selectedElementIds.length > 0,
  };
}

// ============================================
// Bundled Export for Tambo
// ============================================

/**
 * All context helpers bundled for Tambo integration.
 * Use this for registering with Tambo's context system.
 */
export const tamboContextHelpers = {
  getActiveModel,
  getViewerSelection,
  getActivePanel,
  getWorkspaceLayout,
};
