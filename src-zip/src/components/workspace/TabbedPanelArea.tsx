'use client';

/**
 * TabbedPanelArea
 *
 * Main tabbed container that shows the tab bar and panel content.
 * Renders one panel at a time based on active tab selection.
 * Shows LockedPanelPlaceholder when clicking disabled tabs.
 * Includes export handler and loading state management.
 */

import { useState, useCallback, useEffect, type KeyboardEvent } from 'react';
import { Box, Table, Leaf, FileImage, FileText, AlertTriangle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePanelStore } from '@/stores/panel-store';
import { usePanelEvents } from '@/contexts/PanelEventContext';
import { useExportHandler } from '@/hooks/useExportHandler';
import { PanelLoadingOverlay } from '@/components/ui/PanelLoadingOverlay';
import type { PanelId } from '@/lib/panels/types';

// Panel components
import { BIMViewerPanel } from './panels/BIMViewerPanel';
import { BOQTablePanel } from './panels/BOQTablePanel';
import { CarbonDashboardPanel } from './panels/CarbonDashboardPanel';
import { FloorPlanViewerPanel } from './panels/FloorPlanViewerPanel';
import { DocumentEditorPanel } from './panels/DocumentEditorPanel';
import { ClashReportPanel } from './panels/ClashReportPanel';
import { LockedPanelPlaceholder } from './LockedPanelPlaceholder';

interface TabConfig {
  id: PanelId;
  label: string;
  icon: LucideIcon;
  fullName: string;
}

const TABS: TabConfig[] = [
  { id: '3d-viewer', label: '3D', icon: Box, fullName: '3D Viewer' },
  { id: 'boq-table', label: 'BOQ', icon: Table, fullName: 'BOQ Table' },
  { id: 'carbon-dashboard', label: 'Carbon', icon: Leaf, fullName: 'Carbon Dashboard' },
  { id: 'floorplan-viewer', label: 'Floor', icon: FileImage, fullName: 'Floor Plan Viewer' },
  { id: 'document-editor', label: 'Doc', icon: FileText, fullName: 'Document Editor' },
  { id: 'clash-report', label: 'Clash', icon: AlertTriangle, fullName: 'Clash Report' },
];

export interface TabbedPanelAreaProps {
  onUploadClick?: () => void;
  onAskAgentClick?: () => void;
  className?: string;
}

export function TabbedPanelArea({
  onUploadClick,
  onAskAgentClick,
  className,
}: TabbedPanelAreaProps) {
  const { activeTabId, setActiveTab, isTabEnabled } = usePanelStore();
  const eventBus = usePanelEvents();

  // Initialize export handler (subscribes to EXPORT_DATA events)
  useExportHandler();

  // Track which disabled tab's locked placeholder to show
  const [showLockedFor, setShowLockedFor] = useState<PanelId | null>(null);

  // Loading state for panels during tool execution
  const [loadingState, setLoadingState] = useState<{
    isLoading: boolean;
    panelId: PanelId | null;
    message?: string;
  }>({ isLoading: false, panelId: null });

  // Subscribe to PANEL_LOADING events
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('PANEL_LOADING', (event) => {
      if (event.event.type === 'PANEL_LOADING') {
        setLoadingState({
          isLoading: event.event.isLoading,
          panelId: event.event.panelId,
          message: event.event.message,
        });
      }
    });

    return unsubscribe;
  }, [eventBus]);

  // Check if current panel should show loading
  const shouldShowLoading =
    loadingState.isLoading &&
    (loadingState.panelId === activeTabId || loadingState.panelId === null);

  // Handle tab click
  const handleTabClick = useCallback(
    (tabId: PanelId) => {
      if (isTabEnabled(tabId)) {
        setActiveTab(tabId);
        setShowLockedFor(null);
      } else {
        // Show locked placeholder for this tab
        setShowLockedFor(tabId);
      }
    },
    [isTabEnabled, setActiveTab]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = TABS.findIndex((tab) => tab.id === activeTabId);

      switch (event.key) {
        case 'ArrowLeft': {
          event.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : TABS.length - 1;
          handleTabClick(TABS[prevIndex].id);
          break;
        }
        case 'ArrowRight': {
          event.preventDefault();
          const nextIndex = currentIndex < TABS.length - 1 ? currentIndex + 1 : 0;
          handleTabClick(TABS[nextIndex].id);
          break;
        }
        case 'Home': {
          event.preventDefault();
          handleTabClick(TABS[0].id);
          break;
        }
        case 'End': {
          event.preventDefault();
          handleTabClick(TABS[TABS.length - 1].id);
          break;
        }
        case 'Enter':
        case ' ': {
          event.preventDefault();
          if (activeTabId) {
            handleTabClick(activeTabId);
          }
          break;
        }
      }
    },
    [activeTabId, handleTabClick]
  );

  // Get the panel name for locked placeholder
  const getLockedPanelName = (): string => {
    if (!showLockedFor) return '';
    const tab = TABS.find((t) => t.id === showLockedFor);
    return tab?.fullName || '';
  };

  // Render the appropriate panel content
  // NOTE: We render ALL panels but hide inactive ones to preserve state
  // This is critical for BIMViewerPanel which has WebGL context
  // IMPORTANT: Never early-return here - always render all panels to preserve WebGL context
  //
  // We use visibility:hidden + absolute positioning instead of display:none (hidden class)
  // because display:none causes zero dimensions which breaks Recharts ResponsiveContainer
  const renderAllPanels = () => {
    // Helper: classes for inactive panels that preserve dimensions
    // Using visibility:hidden keeps element in layout flow with dimensions
    // pointer-events-none prevents interaction with hidden panel
    // absolute inset-0 stacks panels on top of each other
    const inactiveClasses = 'invisible pointer-events-none absolute inset-0';
    const activeClasses = 'relative';

    return (
      <>
        {/* Locked placeholder shown as overlay - panels stay mounted underneath */}
        {showLockedFor && (
          <div className="absolute inset-0 z-10">
            <LockedPanelPlaceholder
              panelName={getLockedPanelName()}
              onUploadClick={onUploadClick}
              onAskAgentClick={onAskAgentClick}
            />
          </div>
        )}

        {/* ALL panels always rendered - use visibility:hidden for inactive ones */}
        {/* This preserves WebGL context AND chart dimensions (no Recharts warnings) */}
        <div className={cn('h-full w-full', activeTabId === '3d-viewer' ? activeClasses : inactiveClasses)}>
          <BIMViewerPanel />
        </div>
        <div className={cn('h-full w-full', activeTabId === 'boq-table' ? activeClasses : inactiveClasses)}>
          <BOQTablePanel />
        </div>
        <div className={cn('h-full w-full', activeTabId === 'carbon-dashboard' ? activeClasses : inactiveClasses)}>
          <CarbonDashboardPanel />
        </div>
        <div className={cn('h-full w-full', activeTabId === 'floorplan-viewer' ? activeClasses : inactiveClasses)}>
          <FloorPlanViewerPanel />
        </div>
        <div className={cn('h-full w-full', activeTabId === 'document-editor' ? activeClasses : inactiveClasses)}>
          <DocumentEditorPanel />
        </div>
        <div className={cn('h-full w-full', activeTabId === 'clash-report' ? activeClasses : inactiveClasses)}>
          <ClashReportPanel />
        </div>
      </>
    );
  };

  // Get the active tab for panel labelling
  const activeTab = TABS.find((tab) => tab.id === activeTabId) || TABS[4];
  const displayedTab = showLockedFor
    ? TABS.find((tab) => tab.id === showLockedFor) || activeTab
    : activeTab;

  return (
    <div className={cn('flex flex-col h-full w-full', className)}>
      {/* Tab Bar */}
      <div
        role="tablist"
        aria-label="Panel tabs"
        className="flex border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
        onKeyDown={handleKeyDown}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isEnabled = isTabEnabled(tab.id);
          const isActive = activeTabId === tab.id && !showLockedFor;
          const isShowingLocked = showLockedFor === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-disabled={!isEnabled}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500',
                isActive &&
                  'bg-white dark:bg-neutral-900 border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400',
                isShowingLocked &&
                  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
                !isActive &&
                  !isShowingLocked &&
                  'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700',
                !isEnabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel Content */}
      <div
        role="tabpanel"
        id={`tabpanel-${displayedTab.id}`}
        aria-labelledby={`tab-${displayedTab.id}`}
        className="relative flex-1 overflow-hidden"
      >
        {/* Loading Overlay */}
        <PanelLoadingOverlay
          isLoading={shouldShowLoading}
          message={loadingState.message}
        />

        {/*
          Render ALL panels but hide inactive ones
          This preserves WebGL context for BIMViewerPanel across tab switches
          Using CSS hidden instead of AnimatePresence unmounting
        */}
        <div className="h-full w-full">
          {renderAllPanels()}
        </div>
      </div>
    </div>
  );
}

export default TabbedPanelArea;
