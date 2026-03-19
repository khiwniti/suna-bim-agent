'use client';

/**
 * ThatOpenToolbar - Revit-style Ribbon Toolbar
 *
 * Provides navigation, measurement, and section tools
 * styled like Revit/Navisworks professional BIM software
 */

import { useBIMStore } from '@/stores/bim-store';
import { cn } from '@/lib/utils';
import {
  MousePointer2,
  Move3D,
  Hand,
  ZoomIn,
  Maximize2,
  Ruler,
  Square,
  Box,
  Scissors,
  Eye,
  EyeOff,
  RotateCcw,
  ArrowUp,
  ArrowLeft,
  Home,
  Layers,
} from 'lucide-react';
import type { ThatOpenTool } from '@/types/thatopen';

// ============================================
// Types
// ============================================

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  tool?: ThatOpenTool;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}

interface ToolGroupProps {
  label: string;
  children: React.ReactNode;
}

// ============================================
// Sub-components
// ============================================

function ToolButton({ icon, label, tool, onClick, active, disabled }: ToolButtonProps) {
  const activeTool = useBIMStore((s) => s.activeTool);
  const setActiveTool = useBIMStore((s) => s.setActiveTool);

  const isActive = tool ? activeTool === tool : active;

  const handleClick = () => {
    if (tool) {
      setActiveTool(tool);
    }
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all',
        'hover:bg-gray-100 active:scale-95',
        isActive && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      title={label}
    >
      <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
      <span className="text-[10px] font-medium whitespace-nowrap">{label}</span>
    </button>
  );
}

function ToolGroup({ label, children }: ToolGroupProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 px-2">{children}</div>
      <div className="text-[9px] text-muted-foreground/80 text-center mt-1 border-t border-border pt-1">
        {label}
      </div>
    </div>
  );
}

function ToolDivider() {
  return <div className="w-px h-12 bg-border mx-2" />;
}

// ============================================
// Main Component
// ============================================

interface ThatOpenToolbarProps {
  className?: string;
  onFitView?: () => void;
  onResetView?: () => void;
  onViewPreset?: (preset: 'top' | 'front' | 'left' | 'iso') => void;
  onClearMeasurements?: () => void;
  onClearSections?: () => void;
  onShowAll?: () => void;
}

export function ThatOpenToolbar({
  className,
  onFitView,
  onResetView,
  onViewPreset,
  onClearMeasurements,
  onClearSections,
  onShowAll,
}: ThatOpenToolbarProps) {
  const clearMeasurements = useBIMStore((s) => s.clearMeasurements);
  const clearSectionPlanes = useBIMStore((s) => s.clearSectionPlanes);
  const hideElements = useBIMStore((s) => s.hideElements);
  const isolateElements = useBIMStore((s) => s.isolateElements);
  const thatOpenSelection = useBIMStore((s) => s.thatOpenSelection);

  /**
   * Hide currently selected elements in the 3D viewer.
   * Converts expressIDs (numbers) to string IDs for the BIM store.
   */
  const handleHideSelected = () => {
    if (thatOpenSelection.expressIDs.length === 0) {
      return; // No elements selected, nothing to hide
    }
    // Convert expressIDs to string IDs for the BIM store
    const elementIds = thatOpenSelection.expressIDs.map((id) => String(id));
    hideElements(elementIds);
  };

  /**
   * Isolate currently selected elements in the 3D viewer.
   * Hides all elements EXCEPT the selected ones.
   * Converts expressIDs (numbers) to string IDs for the BIM store.
   */
  const handleIsolateSelected = () => {
    if (thatOpenSelection.expressIDs.length === 0) {
      return; // No elements selected, nothing to isolate
    }
    // Convert expressIDs to string IDs for the BIM store
    const elementIds = thatOpenSelection.expressIDs.map((id) => String(id));
    isolateElements(elementIds);
  };

  return (
    <div
      className={cn(
        'flex items-stretch gap-4 px-4 py-2 bg-white border-b border-border shadow-sm',
        className
      )}
    >
      {/* Navigation Tools */}
      <ToolGroup label="Navigate">
        <ToolButton icon={<MousePointer2 size={18} />} label="Select" tool="select" />
        <ToolButton icon={<Move3D size={18} />} label="Orbit" tool="orbit" />
        <ToolButton icon={<Hand size={18} />} label="Pan" tool="pan" />
        <ToolButton icon={<ZoomIn size={18} />} label="Zoom" tool="zoom" />
        <ToolButton icon={<Maximize2 size={18} />} label="Fit" onClick={onFitView} />
      </ToolGroup>

      <ToolDivider />

      {/* View Presets */}
      <ToolGroup label="View">
        <ToolButton
          icon={<ArrowUp size={18} />}
          label="Top"
          onClick={() => onViewPreset?.('top')}
        />
        <ToolButton
          icon={<ArrowLeft size={18} className="rotate-90" />}
          label="Front"
          onClick={() => onViewPreset?.('front')}
        />
        <ToolButton
          icon={<ArrowLeft size={18} />}
          label="Left"
          onClick={() => onViewPreset?.('left')}
        />
        <ToolButton icon={<Home size={18} />} label="Iso" onClick={() => onViewPreset?.('iso')} />
        <ToolButton icon={<RotateCcw size={18} />} label="Reset" onClick={onResetView} />
      </ToolGroup>

      <ToolDivider />

      {/* Measurement Tools */}
      <ToolGroup label="Measure">
        <ToolButton icon={<Ruler size={18} />} label="Length" tool="measure-length" />
        <ToolButton icon={<Square size={18} />} label="Area" tool="measure-area" />
        <ToolButton icon={<Box size={18} />} label="Volume" tool="measure-volume" />
        <ToolButton
          icon={<RotateCcw size={18} />}
          label="Clear"
          onClick={() => {
            clearMeasurements();
            onClearMeasurements?.();
          }}
        />
      </ToolGroup>

      <ToolDivider />

      {/* Section Tools */}
      <ToolGroup label="Section">
        <ToolButton icon={<Scissors size={18} />} label="Clip" tool="section" />
        <ToolButton
          icon={<RotateCcw size={18} />}
          label="Clear"
          onClick={() => {
            clearSectionPlanes();
            onClearSections?.();
          }}
        />
      </ToolGroup>

      <ToolDivider />

      {/* Visibility Tools */}
      <ToolGroup label="Visibility">
        <ToolButton icon={<EyeOff size={18} />} label="Hide" onClick={handleHideSelected} />
        <ToolButton icon={<Layers size={18} />} label="Isolate" onClick={handleIsolateSelected} />
        <ToolButton icon={<Eye size={18} />} label="Show All" onClick={onShowAll} />
      </ToolGroup>
    </div>
  );
}

export default ThatOpenToolbar;
