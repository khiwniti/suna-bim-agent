'use client';

/**
 * NavigationControls - Professional BIM Navigation Toolbar
 *
 * Provides comprehensive navigation controls for BIM viewers:
 * - View presets (Top, Front, Left, Right, Back, Iso)
 * - Navigation modes (Orbit, Pan, Walk, First Person)
 * - Zoom controls (Fit, In, Out, Selection)
 * - Section plane controls
 * - Measurement tools
 *
 * ★ Insight ─────────────────────────────────────
 * Professional BIM software like Revit uses a "mode-based" navigation
 * paradigm where tools are mutually exclusive. This component follows
 * that pattern with clear visual feedback for the active tool.
 * ─────────────────────────────────────────────────
 */

import { useCallback, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Hand,
  Footprints,
  Eye,
  EyeOff,
  Focus,
  Grid3X3,
  Box,
  Square,
  Ruler,
  Scissors,
  ChevronDown,
  ChevronUp,
  Home,
  Compass,
} from 'lucide-react';
import type { ViewPreset } from '@/types/bim';
import type { XeokitTool } from '@/types/xeokit';
import { useTranslation } from '@/i18n/provider';

// ============================================
// Types
// ============================================

export type NavigationMode = 'orbit' | 'pan' | 'walk' | 'firstPerson' | 'select';

export interface NavigationControlsProps {
  /** Currently active navigation mode */
  activeMode?: NavigationMode;
  /** Currently active tool (selection, measure, section) */
  activeTool?: XeokitTool;
  /** Current view preset */
  currentView?: ViewPreset;
  /** Has a model loaded */
  hasModel?: boolean;
  /** Is something selected */
  hasSelection?: boolean;
  /** Section planes enabled */
  sectionsEnabled?: boolean;
  /** Grid visible */
  gridVisible?: boolean;
  /** Orientation (vertical or horizontal layout) */
  orientation?: 'vertical' | 'horizontal';
  /** Compact mode (icons only) */
  compact?: boolean;

  // Callbacks
  onModeChange?: (mode: NavigationMode) => void;
  onToolChange?: (tool: XeokitTool) => void;
  onViewPreset?: (preset: ViewPreset) => void;
  onZoomFit?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomToSelection?: () => void;
  onShowAll?: () => void;
  onHideSelected?: () => void;
  onIsolateSelected?: () => void;
  onToggleGrid?: () => void;
  onToggleSections?: () => void;
  onHomeView?: () => void;

  /** CSS class */
  className?: string;
}

interface ToolButton {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  action: () => void;
  active?: boolean;
  disabled?: boolean;
}

interface ToolGroup {
  id: string;
  label: string;
  buttons: ToolButton[];
  collapsible?: boolean;
}

// ============================================
// View Presets
// ============================================

const VIEW_PRESETS: { id: ViewPreset; label: string; shortLabel: string }[] = [
  { id: 'top', label: 'Top View', shortLabel: 'TOP' },
  { id: 'bottom', label: 'Bottom View', shortLabel: 'BTM' },
  { id: 'front', label: 'Front View', shortLabel: 'FRT' },
  { id: 'back', label: 'Back View', shortLabel: 'BCK' },
  { id: 'left', label: 'Left View', shortLabel: 'LFT' },
  { id: 'right', label: 'Right View', shortLabel: 'RGT' },
  { id: 'iso', label: 'Isometric', shortLabel: 'ISO' },
];

// ============================================
// NavigationControls Component
// ============================================

export function NavigationControls({
  activeMode = 'orbit',
  activeTool = 'select',
  currentView,
  hasModel = false,
  hasSelection = false,
  sectionsEnabled = false,
  gridVisible = true,
  orientation = 'vertical',
  compact = false,
  onModeChange,
  onToolChange,
  onViewPreset,
  onZoomFit,
  onZoomIn,
  onZoomOut,
  onZoomToSelection,
  onShowAll,
  onHideSelected,
  onIsolateSelected,
  onToggleGrid,
  onToggleSections,
  onHomeView,
  className,
}: NavigationControlsProps) {
  const { t } = useTranslation();
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['navigation', 'zoom']));

  // Toggle group expansion
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  // Build tool groups
  const toolGroups: ToolGroup[] = useMemo(() => [
    {
      id: 'navigation',
      label: 'Navigation',
      buttons: [
        {
          id: 'orbit',
          icon: RotateCcw,
          label: 'Orbit (O)',
          shortcut: 'O',
          action: () => onModeChange?.('orbit'),
          active: activeMode === 'orbit',
        },
        {
          id: 'pan',
          icon: Move,
          label: 'Pan (P)',
          shortcut: 'P',
          action: () => onModeChange?.('pan'),
          active: activeMode === 'pan',
        },
        {
          id: 'walk',
          icon: Footprints,
          label: 'Walk (W)',
          shortcut: 'W',
          action: () => onModeChange?.('walk'),
          active: activeMode === 'walk',
        },
        {
          id: 'firstPerson',
          icon: Eye,
          label: 'First Person (1)',
          shortcut: '1',
          action: () => onModeChange?.('firstPerson'),
          active: activeMode === 'firstPerson',
        },
      ],
    },
    {
      id: 'zoom',
      label: 'Zoom',
      buttons: [
        {
          id: 'zoomFit',
          icon: Maximize2,
          label: 'Zoom Fit (F)',
          shortcut: 'F',
          action: () => onZoomFit?.(),
          disabled: !hasModel,
        },
        {
          id: 'zoomIn',
          icon: ZoomIn,
          label: 'Zoom In (+)',
          shortcut: '+',
          action: () => onZoomIn?.(),
          disabled: !hasModel,
        },
        {
          id: 'zoomOut',
          icon: ZoomOut,
          label: 'Zoom Out (-)',
          shortcut: '-',
          action: () => onZoomOut?.(),
          disabled: !hasModel,
        },
        {
          id: 'zoomSelection',
          icon: Focus,
          label: 'Zoom to Selection (Z)',
          shortcut: 'Z',
          action: () => onZoomToSelection?.(),
          disabled: !hasSelection,
        },
      ],
    },
    {
      id: 'visibility',
      label: 'Visibility',
      collapsible: true,
      buttons: [
        {
          id: 'showAll',
          icon: Eye,
          label: 'Show All (Shift+H)',
          shortcut: 'Shift+H',
          action: () => onShowAll?.(),
          disabled: !hasModel,
        },
        {
          id: 'hideSelected',
          icon: EyeOff,
          label: 'Hide Selected (H)',
          shortcut: 'H',
          action: () => onHideSelected?.(),
          disabled: !hasSelection,
        },
        {
          id: 'isolate',
          icon: Focus,
          label: 'Isolate Selected (I)',
          shortcut: 'I',
          action: () => onIsolateSelected?.(),
          disabled: !hasSelection,
        },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      collapsible: true,
      buttons: [
        {
          id: 'select',
          icon: Hand,
          label: 'Select (S)',
          shortcut: 'S',
          action: () => onToolChange?.('select'),
          active: activeTool === 'select',
        },
        {
          id: 'measure',
          icon: Ruler,
          label: 'Measure (M)',
          shortcut: 'M',
          action: () => onToolChange?.('measure'),
          active: activeTool === 'measure',
        },
        {
          id: 'section',
          icon: Scissors,
          label: 'Section Plane (X)',
          shortcut: 'X',
          action: () => onToolChange?.('section'),
          active: activeTool === 'section',
        },
      ],
    },
    {
      id: 'display',
      label: 'Display',
      collapsible: true,
      buttons: [
        {
          id: 'grid',
          icon: Grid3X3,
          label: 'Toggle Grid (G)',
          shortcut: 'G',
          action: () => onToggleGrid?.(),
          active: gridVisible,
        },
        {
          id: 'sections',
          icon: Box,
          label: 'Section Planes',
          action: () => onToggleSections?.(),
          active: sectionsEnabled,
        },
      ],
    },
  ], [activeMode, activeTool, hasModel, hasSelection, gridVisible, sectionsEnabled, onModeChange, onToolChange, onZoomFit, onZoomIn, onZoomOut, onZoomToSelection, onShowAll, onHideSelected, onIsolateSelected, onToggleGrid, onToggleSections]);

  // Render individual button
  const renderButton = useCallback(
    (button: ToolButton) => {
      const Icon = button.icon;
      return (
        <button
          key={button.id}
          onClick={button.action}
          disabled={button.disabled}
          aria-label={button.label}
          aria-pressed={button.active}
          title={button.label}
          className={cn(
            'p-2 rounded-lg transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            button.active
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'hover:bg-muted',
            button.disabled && 'opacity-40 cursor-not-allowed'
          )}
        >
          <Icon className="w-5 h-5" />
          {!compact && (
            <span className="sr-only">{button.label}</span>
          )}
        </button>
      );
    },
    [compact]
  );

  // Render tool group
  const renderGroup = useCallback(
    (group: ToolGroup) => {
      const isExpanded = expandedGroups.has(group.id);
      const showContent = !group.collapsible || isExpanded;

      return (
        <div key={group.id} className="space-y-1">
          {/* Group Header (if collapsible) */}
          {group.collapsible && (
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <span>{group.label}</span>
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}

          {/* Group Buttons */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={group.collapsible ? { opacity: 0, height: 0 } : false}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  orientation === 'vertical' ? 'flex flex-col gap-1' : 'flex flex-row gap-1'
                )}
              >
                {group.buttons.map(renderButton)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    },
    [expandedGroups, orientation, toggleGroup, renderButton]
  );

  return (
    <div
      className={cn(
        'flex gap-2 p-2',
        'bg-background/95 backdrop-blur-sm',
        'rounded-xl shadow-lg border border-border',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        className
      )}
    >
      {/* Home Button */}
      <button
        onClick={onHomeView}
        aria-label={t('navigationControls.homeView')}
        title={t('navigationControls.homeView')}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'bg-primary/10 text-primary',
          'hover:bg-primary/20',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        )}
      >
        <Home className="w-5 h-5" />
      </button>

      {/* View Presets Dropdown */}
      <div className="relative">
        <button
          onClick={() => setViewDropdownOpen(!viewDropdownOpen)}
          aria-label={t('navigationControls.viewPresets')}
          aria-expanded={viewDropdownOpen}
          aria-haspopup="listbox"
          className={cn(
            'p-2 rounded-lg transition-colors flex items-center gap-1',
            'hover:bg-muted',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
          )}
        >
          <Compass className="w-5 h-5" />
          {!compact && (
            <>
              <span className="text-sm font-medium">
                {currentView ? VIEW_PRESETS.find(v => v.id === currentView)?.shortLabel : 'View'}
              </span>
              <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>

        {/* View Presets Dropdown Menu */}
        <AnimatePresence>
          {viewDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              className={cn(
                'absolute z-50 mt-1 p-1',
                'bg-background rounded-lg shadow-lg border border-border',
                'min-w-[140px]',
                orientation === 'vertical' ? 'left-full ml-2 top-0' : 'top-full left-0'
              )}
              role="listbox"
            >
              {VIEW_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onViewPreset?.(preset.id);
                    setViewDropdownOpen(false);
                  }}
                  role="option"
                  aria-selected={currentView === preset.id}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                    'transition-colors',
                    currentView === preset.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  )}
                >
                  <Square className="w-4 h-4" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Separator */}
      <div className={cn(
        'bg-border',
        orientation === 'vertical' ? 'h-px w-full' : 'w-px h-8 self-center'
      )} />

      {/* Tool Groups */}
      {toolGroups.map(renderGroup)}
    </div>
  );
}

// ============================================
// Compact Navigation Bar
// ============================================

export interface CompactNavigationBarProps {
  activeMode?: NavigationMode;
  onModeChange?: (mode: NavigationMode) => void;
  onZoomFit?: () => void;
  onShowAll?: () => void;
  hasModel?: boolean;
  className?: string;
}

export function CompactNavigationBar({
  activeMode = 'orbit',
  onModeChange,
  onZoomFit,
  onShowAll,
  hasModel = false,
  className,
}: CompactNavigationBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 p-1',
        'bg-background/90 backdrop-blur-sm',
        'rounded-xl shadow-lg border border-border',
        className
      )}
    >
      <ControlButton
        icon={Maximize2}
        label="Zoom Fit (F)"
        onClick={onZoomFit}
        disabled={!hasModel}
      />

      <div className="w-8 h-px bg-border mx-auto" />

      <ControlButton
        icon={RotateCcw}
        label="Orbit"
        active={activeMode === 'orbit'}
        onClick={() => onModeChange?.('orbit')}
      />
      <ControlButton
        icon={Move}
        label="Pan"
        active={activeMode === 'pan'}
        onClick={() => onModeChange?.('pan')}
      />

      <div className="w-8 h-px bg-border mx-auto" />

      <ControlButton
        icon={Focus}
        label="Isolate"
        disabled={!hasModel}
      />
      <ControlButton
        icon={Eye}
        label="Show All"
        onClick={onShowAll}
        disabled={!hasModel}
      />
    </div>
  );
}

// ============================================
// Control Button Component
// ============================================

interface ControlButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function ControlButton({ icon: Icon, label, active, disabled, onClick }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'p-2 rounded-lg transition-colors',
        'hover:bg-muted',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        active && 'bg-primary/10 text-primary',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

export default NavigationControls;
