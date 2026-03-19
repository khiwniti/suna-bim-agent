'use client';

/**
 * FloorPlanViewerPanel - 2D Floor Plan Viewer
 *
 * Displays floor plan images with:
 * - Image viewer with zoom/pan
 * - AI annotation overlay
 * - Measurement tools
 * - Export functionality
 *
 * Features:
 * - Wrapped with Tambo's withTamboInteractable for AI control
 * - Accepts props from Tambo (imageUrl, floorLevel, annotations, scale)
 */

import { useState, useCallback, useRef } from 'react';
import { usePanelStore } from '@/stores/panel-store';
import { useTranslation } from '@/i18n/provider';
import { FileImage, ZoomIn, ZoomOut, RotateCw, Download, Move } from 'lucide-react';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import {
  withTamboInteractable,
  type WithTamboInteractableProps,
} from '@tambo-ai/react';
import {
  FloorPlanViewerSchema,
  type FloorPlanViewerProps,
} from '@/lib/tambo/schemas';

// Pan state interface
interface PanState {
  x: number;
  y: number;
}

// ============================================
// Inner Panel Content (accepts Tambo props)
// ============================================

interface FloorPlanViewerContentProps extends FloorPlanViewerProps, WithTamboInteractableProps {}

function FloorPlanViewerContent(props: FloorPlanViewerContentProps) {
  const {
    imageUrl,
    floorLevel,
    annotations,
    scale: tamboScale,
  } = props;

  const { t } = useTranslation();
  const [zoom, setZoom] = useState(tamboScale ?? 1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const { updatePanelData } = usePanelStore();

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Export
  const handleExport = useCallback((format: 'pdf' | 'csv') => {
    updatePanelData('floorplan-viewer', {
      state: { exportRequest: format },
      lastActive: Date.now(),
    });
  }, [updatePanelData]);

  // Reset pan when zoom changes significantly
  const handleResetView = useCallback(() => {
    setZoom(tamboScale ?? 1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, [tamboScale]);

  // Pan handlers
  const handlePanStart = useCallback(
    (clientX: number, clientY: number) => {
      setIsPanning(true);
      panStartRef.current = {
        x: clientX,
        y: clientY,
        panX: pan.x,
        panY: pan.y,
      };
    },
    [pan]
  );

  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    if (!panStartRef.current) return;

    const deltaX = clientX - panStartRef.current.x;
    const deltaY = clientY - panStartRef.current.y;

    setPan({
      x: panStartRef.current.panX + deltaX,
      y: panStartRef.current.panY + deltaY,
    });
  }, []);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
  }, []);

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        // Left click
        e.preventDefault();
        handlePanStart(e.clientX, e.clientY);
      }
    },
    [handlePanStart]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        handlePanMove(e.clientX, e.clientY);
      }
    },
    [isPanning, handlePanMove]
  );

  const handleMouseUp = useCallback(() => {
    handlePanEnd();
  }, [handlePanEnd]);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        handlePanStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [handlePanStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isPanning && e.touches.length === 1) {
        handlePanMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [isPanning, handlePanMove]
  );

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  }, []);

  // No image URL - show empty state
  if (!imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <FileImage className="w-12 h-12 text-purple-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('workspacePanel.noFloorPlanLoaded')}</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('workspacePanel.uploadFloorPlan')}
        </p>
      </div>
    );
  }

  // Derive fileName from URL or use floorLevel
  const displayName = floorLevel || imageUrl.split('/').pop() || 'Floor Plan';

  return (
    <>
      {/* Controls */}
      <div className="flex items-center justify-between p-2 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <div className="flex items-center gap-2" role="toolbar" aria-label={t('workspacePanel.floorPlanControls')}>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={t('workspacePanel.zoomIn')}
          >
            <ZoomIn className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={t('workspacePanel.zoomOut')}
          >
            <ZoomOut className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={t('workspacePanel.rotate90')}
          >
            <RotateCw className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={t('workspacePanel.resetView')}
            title={t('workspacePanel.resetViewTitle')}
          >
            <Move className="w-4 h-4" aria-hidden="true" />
          </button>
          <span className="text-sm text-neutral-600 dark:text-neutral-400 ml-2" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {displayName}
          </span>
          <button
            onClick={() => handleExport('pdf')}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={t('workspacePanel.exportAsPDF')}
          >
            <Download className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Viewer with Pan/Drag */}
      <div
        className={`flex-1 overflow-hidden bg-neutral-50 dark:bg-neutral-900 p-4 ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handlePanEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handlePanEnd}
        onWheel={handleWheel}
        role="application"
        aria-label={t('workspacePanel.floorPlanViewerAriaLabel')}
        tabIndex={0}
      >
        <div
          className="flex items-center justify-center h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`Floor plan: ${displayName}`}
            draggable={false}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Annotations overlay (if any) */}
      {annotations && annotations.length > 0 && (
        <div className="p-2 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <div className="text-sm font-medium mb-1">{t('workspacePanel.annotations')}</div>
          <div className="flex flex-wrap gap-2">
            {annotations.map((annotation) => (
              <span
                key={annotation.id}
                className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
              >
                {annotation.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// Tambo Interactable Wrapper
// ============================================

const FloorPlanViewerInteractable = withTamboInteractable(FloorPlanViewerContent, {
  componentName: 'FloorPlanViewer',
  description:
    'Floor plan image viewer with zoom, pan, and rotation controls. ' +
    'Displays 2D floor plan images with annotation overlays and export functionality.',
  propsSchema: FloorPlanViewerSchema,
});

// ============================================
// Main Exported Component
// ============================================

export function FloorPlanViewerPanel() {
  return (
    <PanelErrorBoundary panelName="Floor Plan Viewer">
      <div data-testid="floorplan-viewer-panel" className="h-full w-full flex flex-col">
        <FloorPlanViewerInteractable />
      </div>
    </PanelErrorBoundary>
  );
}
