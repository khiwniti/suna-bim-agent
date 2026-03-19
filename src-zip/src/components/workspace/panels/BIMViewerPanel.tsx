'use client';

/**
 * BIMViewerPanel - 3D BIM Viewer Panel Integration
 *
 * Tambo-enabled wrapper for ThatOpenViewer component:
 * - Receives viewer state via Tambo props (highlightedIds, isolatedIds, etc.)
 * - Converts prop changes to viewport commands
 * - Publishes selection events back to context
 *
 * Tambo-enabled: AI can control the 3D viewer via natural language.
 */

import { useEffect, useCallback, useRef } from 'react';
import { ThatOpenViewer } from '@/components/viewer/ThatOpenViewer';
import { usePanelStore } from '@/stores/panel-store';
import { useBIMStore } from '@/stores/bim-store';
import { withTamboInteractable, type WithTamboInteractableProps } from '@tambo-ai/react';
import { BIMViewerSchema, type BIMViewerProps } from '@/lib/tambo/schemas';

/** View preset to camera position mapping */
const VIEW_PRESETS = {
  top: { position: [0, 50, 0], target: [0, 0, 0] },
  front: { position: [0, 10, 50], target: [0, 0, 0] },
  side: { position: [50, 10, 0], target: [0, 0, 0] },
  isometric: { position: [30, 30, 30], target: [0, 0, 0] },
  custom: null, // No change for custom
} as const;

/** Inner component that receives Tambo props */
function BIMViewerPanelInner(props: BIMViewerProps & WithTamboInteractableProps) {
  const { highlightedIds, isolatedIds, selectedId, viewPreset } = props;

  const { updatePanelData } = usePanelStore();
  const addPendingCommand = useBIMStore((state) => state.addPendingCommand);
  const currentModel = useBIMStore((state) => state.currentModel);

  // Track previous props to detect changes
  const prevPropsRef = useRef<{
    highlightedIds?: string[];
    isolatedIds?: string[];
    selectedId?: string;
    viewPreset?: string;
  }>({});

  // Process Tambo prop changes into viewport commands
  useEffect(() => {
    const prev = prevPropsRef.current;

    // Handle highlighted elements change
    if (
      highlightedIds &&
      highlightedIds.length > 0 &&
      JSON.stringify(highlightedIds) !== JSON.stringify(prev.highlightedIds)
    ) {
      addPendingCommand({
        type: 'highlight',
        data: { elementIds: highlightedIds },
      });
    }

    // Handle isolated elements change
    if (
      isolatedIds &&
      isolatedIds.length > 0 &&
      JSON.stringify(isolatedIds) !== JSON.stringify(prev.isolatedIds)
    ) {
      addPendingCommand({
        type: 'isolate',
        data: { elementIds: isolatedIds },
      });
    }

    // Handle selected element change
    if (selectedId && selectedId !== prev.selectedId) {
      addPendingCommand({
        type: 'select',
        data: { elementIds: [selectedId] },
      });
    }

    // Handle view preset change
    if (viewPreset && viewPreset !== prev.viewPreset && viewPreset !== 'custom') {
      const preset = VIEW_PRESETS[viewPreset as keyof typeof VIEW_PRESETS];
      if (preset) {
        addPendingCommand({
          type: 'setView',
          data: { preset: viewPreset },
        });
      }
    }

    // Update previous props reference
    prevPropsRef.current = { highlightedIds, isolatedIds, selectedId, viewPreset };
  }, [highlightedIds, isolatedIds, selectedId, viewPreset, addPendingCommand]);

  // Handle model loaded event
  const handleModelLoaded = useCallback(
    (modelId: string) => {
      // Update panel data with loaded model
      updatePanelData('3d-viewer', {
        state: { loadedModels: [modelId] },
        lastActive: Date.now(),
        isDirty: false,
      });
    },
    [updatePanelData]
  );

  // Handle element selection from viewer
  const handleElementSelected = useCallback(
    (expressID: number | null) => {
      if (expressID === null) return;

      // Update panel data with selected element
      updatePanelData('3d-viewer', {
        state: { selectedElement: expressID },
        lastActive: Date.now(),
        isDirty: false,
      });
    },
    [updatePanelData]
  );

  // Check if model is loaded
  const hasModel = !!currentModel;

  return (
    <div data-testid="bim-viewer-panel" className="h-full w-full">
      {!hasModel ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-muted/30">
          <div className="w-16 h-16 rounded-full bg-muted mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Model Loaded</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upload an IFC model or ask the BIM Agent to analyze your building to view it in 3D.
          </p>
        </div>
      ) : (
        <ThatOpenViewer
          onModelLoaded={handleModelLoaded}
          onElementSelected={handleElementSelected}
        />
      )}
    </div>
  );
}

/** Tambo-wrapped interactable component */
export const BIMViewerInteractable = withTamboInteractable(BIMViewerPanelInner, {
  componentName: 'BIMViewer',
  description:
    '3D BIM model viewer for displaying and interacting with IFC building models',
  propsSchema: BIMViewerSchema,
});

/** Default export for panel usage */
export function BIMViewerPanel(props: BIMViewerProps) {
  return <BIMViewerInteractable {...props} />;
}
