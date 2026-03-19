'use client';

import { useCallback, useRef } from 'react';
import { PanelContainer } from './PanelContainer';
import { usePanelStore } from '@/stores/panel-store';
import { BIMViewerPanel } from './panels/BIMViewerPanel';
import { CarbonDashboardPanel } from './panels/CarbonDashboardPanel';
import { BOQTablePanel } from './panels/BOQTablePanel';
import { FloorPlanViewerPanel } from './panels/FloorPlanViewerPanel';
import { DocumentEditorPanel } from './panels/DocumentEditorPanel';
import type { PanelId } from '@/lib/panels/types';

const PANEL_DEFINITIONS = [
  {
    id: '3d-viewer' as const,
    title: '3D Model Viewer',
    icon: 'Box' as const,
  },
  {
    id: 'boq-table' as const,
    title: 'BOQ Data Table',
    icon: 'Table' as const,
  },
  {
    id: 'carbon-dashboard' as const,
    title: 'Carbon Dashboard',
    icon: 'Leaf' as const,
  },
  {
    id: 'floorplan-viewer' as const,
    title: 'Floor Plan Viewer',
    icon: 'FileImage' as const,
  },
  {
    id: 'document-editor' as const,
    title: 'Document Editor',
    icon: 'FileText' as const,
  },
];

export function PanelStack() {
  const { expandedPanels } = usePanelStore();
  const panelRefs = useRef<Map<PanelId, HTMLButtonElement>>(new Map());

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    const panels = PANEL_DEFINITIONS;
    let targetIndex: number | null = null;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        targetIndex = (currentIndex + 1) % panels.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        targetIndex = currentIndex === 0 ? panels.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        e.preventDefault();
        targetIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        targetIndex = panels.length - 1;
        break;
    }

    if (targetIndex !== null) {
      const targetPanelId = panels[targetIndex].id;
      const targetRef = panelRefs.current.get(targetPanelId);
      targetRef?.focus();
    }
  }, []);

  // Register panel header ref
  const registerPanelRef = useCallback((panelId: PanelId, ref: HTMLButtonElement | null) => {
    if (ref) {
      panelRefs.current.set(panelId, ref);
    } else {
      panelRefs.current.delete(panelId);
    }
  }, []);

  const renderPanelContent = (panelId: string) => {
    switch (panelId) {
      case '3d-viewer':
        return <BIMViewerPanel />;
      case 'carbon-dashboard':
        return <CarbonDashboardPanel />;
      case 'boq-table':
        return <BOQTablePanel />;
      case 'floorplan-viewer':
        return <FloorPlanViewerPanel />;
      case 'document-editor':
        return <DocumentEditorPanel />;
      default:
        return (
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {PANEL_DEFINITIONS.find(p => p.id === panelId)?.title} content will go here
          </div>
        );
    }
  };

  return (
    <div
      className="flex flex-col"
      role="tablist"
      aria-label="Panel navigation"
      aria-orientation="vertical"
    >
      {PANEL_DEFINITIONS.map((panel, index) => (
        <PanelContainer
          key={panel.id}
          panelId={panel.id}
          title={panel.title}
          icon={panel.icon}
          isExpanded={expandedPanels.has(panel.id)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          registerRef={(ref) => registerPanelRef(panel.id, ref)}
        >
          {renderPanelContent(panel.id)}
        </PanelContainer>
      ))}
    </div>
  );
}
