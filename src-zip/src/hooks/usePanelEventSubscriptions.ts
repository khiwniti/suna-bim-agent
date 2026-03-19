/**
 * usePanelEventSubscriptions Hook
 *
 * Subscribes the panel store to event bus messages.
 * Should be called once in the root layout or workspace.
 *
 * ★ Insight ─────────────────────────────────────
 * This hook bridges the event bus (pub/sub) to the panel store (state).
 * By centralizing subscriptions here, we ensure consistent panel behavior
 * across the app without scattering subscription logic in components.
 *
 * IMPORTANT: For the tabbed layout, we need to:
 * 1. Enable the tab (add to enabledTabs set)
 * 2. Set it as active tab (activeTabId)
 * 3. Call activatePanel for sidebar/expand behavior
 * ─────────────────────────────────────────────────
 */

'use client';

import { useEffect } from 'react';
import { panelEventBus } from '@/lib/panel/event-bus';
import { usePanelStore } from '@/stores/panel-store';
import type { PanelId } from '@/lib/panels/types';

export function usePanelEventSubscriptions() {
  const activatePanel = usePanelStore((state) => state.activatePanel);
  const updatePanelData = usePanelStore((state) => state.updatePanelData);
  const enableTab = usePanelStore((state) => state.enableTab);
  const setActiveTab = usePanelStore((state) => state.setActiveTab);

  useEffect(() => {
    // Subscribe to ACTIVATE_PANEL events
    const unsubActivate = panelEventBus.subscribe('ACTIVATE_PANEL', (message) => {
      const event = message.event as {
        type: 'ACTIVATE_PANEL';
        panelId: PanelId;
        autoExpand?: boolean;
      };

      console.log('[usePanelEventSubscriptions] ACTIVATE_PANEL received:', event.panelId);

      // Enable the tab first (adds to enabledTabs set)
      enableTab(event.panelId);

      // Set it as the active tab (for TabbedPanelArea)
      setActiveTab(event.panelId);

      // Also call activatePanel for sidebar/expand behavior
      activatePanel(event.panelId, event.autoExpand ?? true);
    });

    // Subscribe to UPDATE_PANEL_DATA events
    const unsubUpdate = panelEventBus.subscribe('UPDATE_PANEL_DATA', (message) => {
      const event = message.event as {
        type: 'UPDATE_PANEL_DATA';
        panelId: PanelId;
        data: Record<string, unknown>;
        merge?: boolean;
      };

      console.log('[usePanelEventSubscriptions] UPDATE_PANEL_DATA received:', event.panelId, event.data);

      updatePanelData(event.panelId, event.data);
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubActivate();
      unsubUpdate();
    };
  }, [activatePanel, updatePanelData, enableTab, setActiveTab]);
}
