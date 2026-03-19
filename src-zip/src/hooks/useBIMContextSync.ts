'use client';

import { useEffect } from 'react';
import { useBIMStore } from '@/stores/bim-store';
import { usePanelStore } from '@/stores/panel-store';
import { useTamboContextState } from '@/lib/tambo/context-state';
import type { PanelId } from '@/lib/panels/types';

/**
 * Syncs BIM store and panel store state to Tambo context state.
 * This enables AI to be aware of user's panel interactions and selections.
 *
 * Subscribes to:
 * - Selection changes (selectedIds)
 * - Model changes (currentModel)
 * - Active panel changes (activeTabId)
 * - Visible panels (enabledTabs)
 *
 * Updates Tambo context state which context helpers read from.
 */
export function useBIMContextSync(): void {
  const setSelection = useTamboContextState((s) => s.setSelection);
  const setModelInfo = useTamboContextState((s) => s.setModelInfo);
  const setActivePanel = useTamboContextState((s) => s.setActivePanel);
  const setVisiblePanels = useTamboContextState((s) => s.setVisiblePanels);

  useEffect(() => {
    // Subscribe to selection changes
    const unsubSelection = useBIMStore.subscribe(
      (state) => state.selection.selectedIds,
      (selectedIds: string[]) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[BIMContextSync] Selection changed:', selectedIds.length, 'elements');
        }
        setSelection(selectedIds);
      }
    );

    // Subscribe to model changes
    const unsubModel = useBIMStore.subscribe(
      (state) => state.currentModel,
      (model) => {
        if (model) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[BIMContextSync] Model loaded:', model.id);
          }
          setModelInfo({
            id: model.id,
            fileName: model.name,
            elementCount: model.elements?.length ?? 0,
          });
        }
      }
    );

    // Subscribe to active panel changes
    const unsubActivePanel = usePanelStore.subscribe(
      (state) => state.activeTabId,
      (panelId: PanelId | null) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[BIMContextSync] Active panel changed:', panelId);
        }
        setActivePanel(panelId);
      }
    );

    // Subscribe to enabled tabs (visible panels)
    const unsubVisiblePanels = usePanelStore.subscribe(
      (state) => state.enabledTabs,
      (enabledTabs: Set<PanelId>) => {
        const panels: string[] = Array.from(enabledTabs);
        if (process.env.NODE_ENV === 'development') {
          console.log('[BIMContextSync] Visible panels changed:', panels);
        }
        setVisiblePanels(panels);
      }
    );

    // Initial sync on mount
    const initialPanel = usePanelStore.getState().activeTabId;
    const initialTabs: string[] = Array.from(usePanelStore.getState().enabledTabs);
    if (initialPanel) setActivePanel(initialPanel);
    if (initialTabs.length > 0) setVisiblePanels(initialTabs);

    return () => {
      unsubSelection();
      unsubModel();
      unsubActivePanel();
      unsubVisiblePanels();
    };
  }, [setSelection, setModelInfo, setActivePanel, setVisiblePanels]);
}
