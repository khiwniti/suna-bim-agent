/**
 * Ribbon Tab Configuration - Revit-inspired BIM toolbar layout
 *
 * Tab Structure:
 * - Home: Selection, Modify, Clipboard, History
 * - View: Navigation, Views, Display
 * - Annotate: Dimension, Text, Tags
 * - Analyze: Sustainability, Validation, Reports
 * - Collaborate: Share, Comments, History
 * - Contextual tabs (appear when elements selected)
 */

import {
  // Selection & Edit
  MousePointer,
  Move,
  RotateCw,
  Copy,
  Trash2,
  Undo,
  Redo,
  Scissors,
  Link,
  // View & Navigation
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Box,
  Split,
  Grid3X3,
  Sun,
  Palette,
  // Annotation
  Ruler,
  Type,
  Tag,
  ArrowUpRight,
  Square,
  Triangle,
  // Analysis
  Leaf,
  FileSpreadsheet,
  Zap,
  AlertTriangle,
  CheckSquare,
  BarChart2,
  DollarSign,
  Building2,
  // Collaboration
  Share2,
  Download,
  FileCode,
  MessageSquare,
  MessagesSquare,
  History,
  Cloud,
  RefreshCw,
  // Element-specific
  Settings,
  PenTool,
  Focus,
  Home,
} from 'lucide-react';
import type { RibbonTab, RibbonButtonOption } from '@/types/ribbon';

// ============================================
// View Presets
// ============================================

const VIEW_PRESET_OPTIONS: RibbonButtonOption[] = [
  { id: 'view-top', label: 'Top', command: 'view.top' },
  { id: 'view-front', label: 'Front', command: 'view.front' },
  { id: 'view-back', label: 'Back', command: 'view.back' },
  { id: 'view-left', label: 'Left', command: 'view.left' },
  { id: 'view-right', label: 'Right', command: 'view.right' },
  { id: 'view-iso', label: 'Isometric', command: 'view.iso', icon: Box },
  { id: 'view-perspective', label: 'Perspective', command: 'view.perspective' },
];

const VISUAL_STYLE_OPTIONS: RibbonButtonOption[] = [
  { id: 'style-wireframe', label: 'Wireframe', command: 'display.wireframe' },
  { id: 'style-hidden', label: 'Hidden Line', command: 'display.hiddenLine' },
  { id: 'style-shaded', label: 'Shaded', command: 'display.shaded' },
  { id: 'style-realistic', label: 'Realistic', command: 'display.realistic' },
];

// ============================================
// Standard Tabs
// ============================================

export const ribbonTabs: RibbonTab[] = [
  // =========== HOME TAB ===========
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    groups: [
      {
        id: 'select',
        label: 'Select',
        items: [
          {
            type: 'split-button',
            id: 'select-tool',
            label: 'Select',
            icon: MousePointer,
            size: 'large',
            primaryCommand: 'select.elements',
            options: [
              { id: 'select-all', label: 'Select All', command: 'select.all', description: 'Select all elements' },
              { id: 'select-similar', label: 'Select Similar', command: 'select.similar', description: 'Select elements of same type' },
              { id: 'select-box', label: 'Box Select', command: 'select.box', description: 'Draw a selection box' },
              { id: 'select-invert', label: 'Invert Selection', command: 'select.invert' },
            ],
          },
        ],
      },
      {
        id: 'modify',
        label: 'Modify',
        items: [
          { type: 'button', id: 'move', label: 'Move', icon: Move, size: 'large', command: 'modify.move', shortcut: 'M' },
          { type: 'button', id: 'rotate', label: 'Rotate', icon: RotateCw, size: 'large', command: 'modify.rotate', shortcut: 'R' },
          { type: 'button', id: 'hide', label: 'Hide', icon: EyeOff, size: 'small', command: 'modify.hide', shortcut: 'H' },
          { type: 'button', id: 'isolate', label: 'Isolate', icon: Focus, size: 'small', command: 'modify.isolate', shortcut: 'I' },
          { type: 'button', id: 'show-all', label: 'Show All', icon: Eye, size: 'small', command: 'modify.showAll', shortcut: 'Shift+H' },
        ],
      },
      {
        id: 'clipboard',
        label: 'Clipboard',
        items: [
          { type: 'button', id: 'copy', label: 'Copy', icon: Copy, size: 'small', command: 'clipboard.copy', shortcut: 'Ctrl+C' },
          { type: 'button', id: 'delete', label: 'Delete', icon: Trash2, size: 'small', command: 'clipboard.delete', shortcut: 'Del' },
        ],
      },
      {
        id: 'history',
        label: 'History',
        items: [
          { type: 'button', id: 'undo', label: 'Undo', icon: Undo, size: 'small', command: 'history.undo', shortcut: 'Ctrl+Z' },
          { type: 'button', id: 'redo', label: 'Redo', icon: Redo, size: 'small', command: 'history.redo', shortcut: 'Ctrl+Y' },
        ],
      },
    ],
  },

  // =========== VIEW TAB ===========
  {
    id: 'view',
    label: 'View',
    icon: Eye,
    groups: [
      {
        id: 'navigation',
        label: 'Navigation',
        items: [
          { type: 'button', id: 'zoom-fit', label: 'Zoom Fit', icon: Maximize2, size: 'large', command: 'view.zoomFit', shortcut: 'F' },
          { type: 'button', id: 'zoom-in', label: 'Zoom In', icon: ZoomIn, size: 'small', command: 'view.zoomIn' },
          { type: 'button', id: 'zoom-out', label: 'Zoom Out', icon: ZoomOut, size: 'small', command: 'view.zoomOut' },
          { type: 'button', id: 'orbit', label: 'Orbit', icon: RotateCcw, size: 'small', command: 'view.orbit', shortcut: 'O' },
        ],
      },
      {
        id: 'views',
        label: 'Views',
        items: [
          {
            type: 'split-button',
            id: 'view-preset',
            label: '3D View',
            icon: Box,
            size: 'large',
            primaryCommand: 'view.3d',
            options: VIEW_PRESET_OPTIONS,
          },
          { type: 'button', id: 'section', label: 'Section', icon: Split, size: 'large', command: 'view.section' },
        ],
      },
      {
        id: 'display',
        label: 'Display',
        items: [
          {
            type: 'dropdown',
            id: 'visual-style',
            label: 'Visual Style',
            icon: Palette,
            options: VISUAL_STYLE_OPTIONS,
          },
          { type: 'toggle', id: 'shadows', label: 'Shadows', icon: Sun, size: 'small', command: 'display.shadows' },
          { type: 'toggle', id: 'edges', label: 'Edges', icon: Square, size: 'small', command: 'display.edges', defaultChecked: true },
          { type: 'toggle', id: 'grid', label: 'Grid', icon: Grid3X3, size: 'small', command: 'display.grid', defaultChecked: true },
        ],
      },
    ],
  },

  // =========== ANNOTATE TAB ===========
  {
    id: 'annotate',
    label: 'Annotate',
    icon: Ruler,
    groups: [
      {
        id: 'dimension',
        label: 'Dimension',
        items: [
          { type: 'button', id: 'distance', label: 'Distance', icon: Ruler, size: 'large', command: 'annotate.distance', tooltip: 'Measure distance between two points' },
          { type: 'button', id: 'angle', label: 'Angle', icon: Triangle, size: 'small', command: 'annotate.angle' },
          { type: 'button', id: 'area', label: 'Area', icon: Square, size: 'small', command: 'annotate.area' },
        ],
      },
      {
        id: 'text',
        label: 'Text',
        items: [
          { type: 'button', id: 'text', label: 'Text', icon: Type, size: 'large', command: 'annotate.text' },
          { type: 'button', id: 'leader', label: 'Leader', icon: ArrowUpRight, size: 'small', command: 'annotate.leader' },
          { type: 'button', id: 'tag', label: 'Tag', icon: Tag, size: 'small', command: 'annotate.tag' },
        ],
      },
    ],
  },

  // =========== ANALYZE TAB ===========
  {
    id: 'analyze',
    label: 'Analyze',
    icon: BarChart2,
    groups: [
      {
        id: 'sustainability',
        label: 'Sustainability',
        items: [
          {
            type: 'button',
            id: 'carbon-analysis',
            label: 'Carbon Analysis',
            icon: Leaf,
            size: 'large',
            command: 'analyze.carbon',
            tooltip: 'Calculate embodied carbon footprint',
          },
          {
            type: 'button',
            id: 'material-takeoff',
            label: 'Material Takeoff',
            icon: FileSpreadsheet,
            size: 'small',
            command: 'analyze.materialTakeoff',
          },
          {
            type: 'button',
            id: 'energy-model',
            label: 'Energy Model',
            icon: Zap,
            size: 'small',
            command: 'analyze.energy',
          },
        ],
      },
      {
        id: 'validation',
        label: 'Validation',
        items: [
          {
            type: 'button',
            id: 'clash-detection',
            label: 'Clash Detection',
            icon: AlertTriangle,
            size: 'large',
            command: 'analyze.clash',
            tooltip: 'Detect geometry clashes between elements',
          },
          {
            type: 'button',
            id: 'model-check',
            label: 'Model Check',
            icon: CheckSquare,
            size: 'small',
            command: 'analyze.modelCheck',
          },
        ],
      },
      {
        id: 'reports',
        label: 'Reports',
        items: [
          { type: 'button', id: 'quantity-report', label: 'Quantity Report', icon: BarChart2, size: 'small', command: 'analyze.quantityReport' },
          { type: 'button', id: 'cost-estimate', label: 'Cost Estimate', icon: DollarSign, size: 'small', command: 'analyze.costEstimate' },
        ],
      },
    ],
  },

  // =========== COLLABORATE TAB ===========
  {
    id: 'collaborate',
    label: 'Collaborate',
    icon: Share2,
    groups: [
      {
        id: 'sync',
        label: 'Synchronize',
        items: [
          { type: 'button', id: 'sync', label: 'Sync Now', icon: Cloud, size: 'large', command: 'collab.sync' },
          { type: 'button', id: 'reload', label: 'Reload Latest', icon: RefreshCw, size: 'small', command: 'collab.reload' },
        ],
      },
      {
        id: 'share',
        label: 'Share',
        items: [
          { type: 'button', id: 'share', label: 'Share', icon: Share2, size: 'large', command: 'collab.share' },
          { type: 'button', id: 'export', label: 'Export', icon: Download, size: 'small', command: 'collab.export' },
          { type: 'button', id: 'bcf-export', label: 'BCF Export', icon: FileCode, size: 'small', command: 'collab.bcfExport', tooltip: 'Export BCF viewpoints' },
        ],
      },
      {
        id: 'comments',
        label: 'Comments',
        items: [
          { type: 'button', id: 'add-comment', label: 'Add Comment', icon: MessageSquare, size: 'small', command: 'collab.addComment' },
          { type: 'button', id: 'view-comments', label: 'View Comments', icon: MessagesSquare, size: 'small', command: 'collab.viewComments' },
          { type: 'button', id: 'history', label: 'History', icon: History, size: 'small', command: 'collab.history' },
        ],
      },
    ],
  },
];

// ============================================
// Contextual Tabs
// ============================================

export const contextualTabs: RibbonTab[] = [
  {
    id: 'modify-elements',
    label: 'Modify | Elements',
    contextual: true,
    contextTrigger: ['wall', 'slab', 'column', 'beam', 'door', 'window', 'roof', 'stair'],
    groups: [
      {
        id: 'properties',
        label: 'Properties',
        items: [
          { type: 'button', id: 'edit-props', label: 'Edit Properties', icon: Settings, size: 'large', command: 'element.editProperties' },
          { type: 'button', id: 'match-props', label: 'Match Properties', icon: Copy, size: 'small', command: 'element.matchProperties' },
        ],
      },
      {
        id: 'geometry',
        label: 'Geometry',
        items: [
          { type: 'button', id: 'edit-profile', label: 'Edit Profile', icon: PenTool, size: 'large', command: 'element.editProfile' },
          { type: 'button', id: 'split-element', label: 'Split', icon: Scissors, size: 'small', command: 'element.split' },
          { type: 'button', id: 'join-elements', label: 'Join', icon: Link, size: 'small', command: 'element.join' },
        ],
      },
      {
        id: 'analysis',
        label: 'Analysis',
        items: [
          { type: 'button', id: 'element-carbon', label: 'Carbon', icon: Leaf, size: 'small', command: 'element.carbon', tooltip: 'View element carbon data' },
          { type: 'button', id: 'element-info', label: 'Info', icon: Building2, size: 'small', command: 'element.info' },
        ],
      },
    ],
  },
];

// ============================================
// All Tabs Combined
// ============================================

export const allRibbonTabs = [...ribbonTabs, ...contextualTabs];

// ============================================
// Keyboard Shortcuts Map
// ============================================

export const keyboardShortcuts: Record<string, string> = {
  // File
  'ctrl+s': 'file.save',
  'ctrl+o': 'file.open',

  // Edit
  'ctrl+z': 'history.undo',
  'ctrl+y': 'history.redo',
  'ctrl+shift+z': 'history.redo',
  'ctrl+c': 'clipboard.copy',
  'ctrl+v': 'clipboard.paste',
  'ctrl+x': 'clipboard.cut',
  'delete': 'clipboard.delete',

  // Selection
  'ctrl+a': 'select.all',
  'escape': 'select.none',

  // Tools
  'm': 'modify.move',
  'r': 'modify.rotate',
  'h': 'modify.hide',
  'shift+h': 'modify.showAll',
  'i': 'modify.isolate',

  // View
  'f': 'view.zoomFit',
  'o': 'view.orbit',
  'p': 'view.pan',

  // Command palette
  'ctrl+p': 'ui.commandPalette',
  'ctrl+shift+p': 'ui.commandPalette',
};
