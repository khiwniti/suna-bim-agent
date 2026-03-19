'use client';

/**
 * BIMToolbar - Simple BIM tools for the viewport
 *
 * Provides quick access to common BIM operations:
 * - View presets (orthographic views)
 * - Visibility controls
 * - Selection mode toggle
 * - Basic measurements
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Move3D,
  RotateCcw,
  Maximize2,
  Box,
  Layers,
  MousePointer2,
  Ruler,
  ChevronDown,
  Grid3X3,
  Home,
  Scissors,
  Sun,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import { useBIMStore } from '@/stores/bim-store';

import { MeasurementMode } from './tools';

interface BIMToolbarProps {
  className?: string;
  onViewChange?: (view: string) => void;
  onShowAll?: () => void;
  onResetView?: () => void;
  onToggleGrid?: () => void;
  onToggleSelection?: (enabled: boolean) => void;
  onFitToView?: () => void;
  onMeasureClick?: (mode: MeasurementMode) => void;
  onSectionClick?: () => void;
  onSolarClick?: () => void;
  onInspectorClick?: () => void;
  isGridVisible?: boolean;
  isSelectionMode?: boolean;
  isMeasureActive?: boolean;
  isSectionActive?: boolean;
  isSolarActive?: boolean;
  isInspectorActive?: boolean;
  hasModel?: boolean;
}

const VIEW_OPTIONS = [
  { id: 'iso', labelKey: 'bimToolbar.views.isometric', icon: Box },
  { id: 'top', labelKey: 'bimToolbar.views.top', icon: Layers },
  { id: 'front', labelKey: 'bimToolbar.views.front', icon: Grid3X3 },
  { id: 'back', labelKey: 'bimToolbar.views.back', icon: Grid3X3 },
  { id: 'left', labelKey: 'bimToolbar.views.left', icon: Grid3X3 },
  { id: 'right', labelKey: 'bimToolbar.views.right', icon: Grid3X3 },
];

export function BIMToolbar({
  className,
  onViewChange,
  onShowAll,
  onResetView,
  onToggleGrid,
  onToggleSelection,
  onFitToView,
  onMeasureClick,
  onSectionClick,
  onSolarClick,
  onInspectorClick,
  isGridVisible = true,
  isSelectionMode = false,
  isMeasureActive = false,
  isSectionActive = false,
  isSolarActive = false,
  isInspectorActive = false,
  hasModel = false,
}: BIMToolbarProps) {
  const { t } = useTranslation();
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showMeasureMenu, setShowMeasureMenu] = useState(false);
  const [currentView, setCurrentView] = useState('iso');

  // Camera state from BIM store for orbit/pan toggle
  const camera = useBIMStore((state) => state.camera);
  const setCamera = useBIMStore((state) => state.setCamera);

  const handleOrbitToggle = () => {
    setCamera({ mode: camera.mode === 'orbit' ? 'pan' : 'orbit' });
  };

  const handleViewChange = (viewId: string) => {
    setCurrentView(viewId);
    onViewChange?.(viewId);
    setShowViewMenu(false);
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {/* View Selector */}
      <div className="relative">
        <ToolButton
          icon={Box}
          label={t('bimToolbar.view')}
          onClick={() => setShowViewMenu(!showViewMenu)}
          active={showViewMenu}
          hasDropdown
        />

        <AnimatePresence>
          {showViewMenu && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-full top-0 ml-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-20"
            >
              {VIEW_OPTIONS.map((view) => (
                <button
                  key={view.id}
                  onClick={() => handleViewChange(view.id)}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors',
                    currentView === view.id && 'bg-primary/10 text-primary'
                  )}
                >
                  <view.icon className="w-4 h-4" />
                  {t(view.labelKey)}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Divider />

      {/* Navigation Tools */}
      <ToolButton
        icon={Home}
        label={t('bimToolbar.resetView')}
        onClick={onResetView}
      />

      <ToolButton
        icon={Maximize2}
        label={t('bimToolbar.fitToView')}
        onClick={onFitToView}
        disabled={!hasModel}
      />

      <Divider />

      {/* Visibility Controls */}
      <ToolButton
        icon={Eye}
        label={t('bimToolbar.showAll')}
        onClick={onShowAll}
        disabled={!hasModel}
      />

      <ToolButton
        icon={isGridVisible ? Grid3X3 : EyeOff}
        label={isGridVisible ? t('bimToolbar.hideGrid') : t('bimToolbar.showGrid')}
        onClick={onToggleGrid}
        active={isGridVisible}
      />

      <Divider />

      {/* Selection Tool */}
      <ToolButton
        icon={MousePointer2}
        label={t('bimToolbar.select')}
        onClick={() => onToggleSelection?.(!isSelectionMode)}
        active={isSelectionMode}
        disabled={!hasModel}
      />

      {/* Move Tool */}
      <ToolButton
        icon={Move3D}
        label={t('bimToolbar.orbit')}
        onClick={handleOrbitToggle}
        active={camera.mode === 'orbit'}
      />

      <Divider />

      {/* Measurement Tool */}
      <div className="relative">
        <ToolButton
          icon={Ruler}
          label={t('bimToolbar.measure')}
          onClick={() => setShowMeasureMenu(!showMeasureMenu)}
          active={isMeasureActive || showMeasureMenu}
          disabled={!hasModel}
          hasDropdown
        />

        <AnimatePresence>
          {showMeasureMenu && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-full top-0 ml-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-20"
            >
              <button
                onClick={() => {
                  onMeasureClick?.('distance');
                  setShowMeasureMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Ruler className="w-4 h-4" />
                {t('bimToolbar.distance')}
              </button>
              <button
                onClick={() => {
                  onMeasureClick?.('angle');
                  setShowMeasureMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Box className="w-4 h-4" />
                {t('bimToolbar.angle')}
              </button>
              <button
                onClick={() => {
                  onMeasureClick?.('area');
                  setShowMeasureMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Grid3X3 className="w-4 h-4" />
                {t('bimToolbar.area')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Section/Clip Tool */}
      <ToolButton
        icon={Scissors}
        label={t('bimToolbar.sectionPlanes')}
        onClick={onSectionClick}
        active={isSectionActive}
        disabled={!hasModel}
      />

      {/* Solar Simulation */}
      <ToolButton
        icon={Sun}
        label={t('bimToolbar.solarSimulation')}
        onClick={onSolarClick}
        active={isSolarActive}
        disabled={!hasModel}
      />

      {/* BIM Inspector */}
      <ToolButton
        icon={Info}
        label={t('bimToolbar.inspector')}
        onClick={onInspectorClick}
        active={isInspectorActive}
        disabled={!hasModel}
      />
    </div>
  );
}

// Tool Button Component
interface ToolButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  hasDropdown?: boolean;
  tooltip?: string;
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
  hasDropdown = false,
  tooltip,
}: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip || label}
      className={cn(
        'group relative flex items-center justify-center w-9 h-9 rounded-lg transition-all',
        'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50',
        active && 'bg-primary/10 text-primary',
        disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
      )}
    >
      <Icon className="w-4 h-4" />
      {hasDropdown && (
        <ChevronDown className="w-2 h-2 absolute bottom-1 right-1" />
      )}

      {/* Tooltip */}
      <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
        {label}
      </span>
    </button>
  );
}

// Divider Component
function Divider() {
  return <div className="h-px w-full bg-border my-1" />;
}

export default BIMToolbar;
