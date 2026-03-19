'use client';

import { useEffect, useCallback } from 'react';
import { usePanelEvent, type PanelEvent } from '@/lib/panel/event-bus';
import { usePanelStore } from '@/stores/panel-store';
import type { PanelId } from '@/lib/panels/types';

/**
 * PanelEventSubscriber
 *
 * Subscribes to panel events from the event bus and updates the panel store.
 * This bridges the gap between tool-published events and the UI.
 *
 * Events handled:
 * - ACTIVATE_PANEL: Opens and activates a specific panel
 * - UPDATE_PANEL_DATA: Updates panel data in store
 * - HIGHLIGHT_ELEMENTS: Forwards to 3D viewer (via BIM store)
 */
export function PanelEventSubscriber() {
  const setActiveTab = usePanelStore((s) => s.setActiveTab);
  const enableTab = usePanelStore((s) => s.enableTab);
  const expandPanel = usePanelStore((s) => s.expandPanel);
  const openSidebar = usePanelStore((s) => s.openSidebar);
  const updatePanelData = usePanelStore((s) => s.updatePanelData);

  // Handle ACTIVATE_PANEL events
  const handleActivatePanel = useCallback(
    (event: PanelEvent) => {
      if (event.event.type !== 'ACTIVATE_PANEL') return;

      const { panelId, autoExpand } = event.event;
      console.log('[PanelEventSubscriber] Activating panel:', panelId, { autoExpand });

      // Enable the tab first (in case it's not enabled)
      enableTab(panelId as PanelId);

      // Set as active tab
      setActiveTab(panelId as PanelId);

      // Auto-expand if requested
      if (autoExpand) {
        expandPanel(panelId as PanelId);
        openSidebar();
      }
    },
    [enableTab, setActiveTab, expandPanel, openSidebar]
  );

  // Handle UPDATE_PANEL_DATA events
  const handleUpdatePanelData = useCallback(
    (event: PanelEvent) => {
      if (event.event.type !== 'UPDATE_PANEL_DATA') return;

      const { panelId, data } = event.event;
      console.log('[PanelEventSubscriber] Updating panel data:', panelId);

      updatePanelData(panelId as PanelId, data as Record<string, unknown>);
    },
    [updatePanelData]
  );

  // Subscribe to ACTIVATE_PANEL events
  usePanelEvent('ACTIVATE_PANEL', handleActivatePanel);

  // Subscribe to UPDATE_PANEL_DATA events
  usePanelEvent('UPDATE_PANEL_DATA', handleUpdatePanelData);

  // Log subscription on mount
  useEffect(() => {
    console.log('[PanelEventSubscriber] Mounted - listening for panel events');
    return () => {
      console.log('[PanelEventSubscriber] Unmounted');
    };
  }, []);

  // This component doesn't render anything
  return null;
}
