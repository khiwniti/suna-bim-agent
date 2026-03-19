'use client';

/**
 * useStateBridge Hook
 *
 * Bridges state between panel store and shared state store.
 * Enables bidirectional synchronization:
 * - Panel tool results → Chat context
 * - Chat analysis results → Panel data
 * - Viewport commands → All synced systems
 *
 * ★ Insight ─────────────────────────────────────
 * This hook complements useToolPanelBridge by providing the reverse
 * direction sync. While useToolPanelBridge activates panels from chat,
 * useStateBridge syncs state bidirectionally for complete integration.
 * ─────────────────────────────────────────────────
 */

import { useEffect, useCallback } from 'react';
import { useSharedStateStore, type ViewportCommand } from '@/stores/shared-state-store';
import { usePanelStore } from '@/stores/panel-store';
import { panelEventBus, type PanelId } from '@/lib/panel/event-bus';

// ============================================
// Types
// ============================================

export interface StateBridgeResult {
  /** Sync panel result to chat context */
  syncPanelResult: (panelId: string, data: unknown) => void;
  /** Sync chat result to panel */
  syncChatResult: (panelId: PanelId, data: unknown) => void;
  /** Sync viewport command to all systems */
  syncViewport: (command: ViewportCommand) => void;
  /** Current shared state */
  sharedState: ReturnType<typeof useSharedStateStore.getState>;
  /** Current active panel ID */
  activePanelId: string | null;
  /** Current viewer selection */
  viewerSelection: string[];
}

// ============================================
// Hook Implementation
// ============================================

export function useStateBridge(): StateBridgeResult {
  // Get stores
  const sharedState = useSharedStateStore();
  const panelStore = usePanelStore();

  // Sync panel result to chat context
  const syncPanelResult = useCallback(
    (panelId: string, data: unknown) => {
      sharedState.syncPanelToChat(panelId, data);

      // Also publish event for any listeners using the event bus
      // Note: The event bus uses typed events, so we use UPDATE_PANEL_DATA
      // to notify that panel data has changed
      panelEventBus.publish('panel', {
        type: 'PANEL_READY',
        panelId: panelId as PanelId,
      });
    },
    [sharedState]
  );

  // Sync chat result to panel
  const syncChatResult = useCallback(
    (panelId: PanelId, data: unknown) => {
      // Update shared state
      sharedState.syncChatToPanel(panelId, data);

      // Also update panel store directly for immediate UI update
      const panel = panelStore.panels.get(panelId);
      if (panel) {
        panelStore.updatePanelData(panelId, data as Record<string, unknown>);
      }

      // Publish event for any listeners
      panelEventBus.publish('chat', {
        type: 'UPDATE_PANEL_DATA',
        panelId,
        data,
        merge: true,
      });
    },
    [sharedState, panelStore]
  );

  // Sync viewport command
  const syncViewport = useCallback(
    (command: ViewportCommand) => {
      // Update shared state
      sharedState.syncViewport(command);

      // Publish viewport event for BIM viewer
      // Map ViewportCommand to panel event type
      if (command.type === 'highlight' && command.elementIds) {
        panelEventBus.publish('chat', {
          type: 'HIGHLIGHT_ELEMENTS',
          elementIds: command.elementIds,
          isolate: false,
          zoomTo: false,
        });
      }
    },
    [sharedState]
  );

  // Subscribe to panel store changes and sync active panel
  useEffect(() => {
    // When active panel changes, update shared state
    const unsubscribe = usePanelStore.subscribe((state) => {
      // Use the activePanelId from the store directly
      const activePanelId = state.activePanelId;
      sharedState.setActivePanel(activePanelId);
    });

    return unsubscribe;
  }, [sharedState]);

  // Subscribe to panel event bus for panel selection events
  useEffect(() => {
    const unsubscribe = panelEventBus.subscribe('PANEL_SELECTION', (event) => {
      // When a panel selection occurs, sync the selected data to chat context
      if (event.event.type === 'PANEL_SELECTION') {
        syncPanelResult(event.event.panelId, event.event.selectedData);
      }
    });

    return unsubscribe;
  }, [syncPanelResult]);

  return {
    syncPanelResult,
    syncChatResult,
    syncViewport,
    sharedState,
    activePanelId: sharedState.activePanelId,
    viewerSelection: sharedState.viewerSelection,
  };
}

export default useStateBridge;
