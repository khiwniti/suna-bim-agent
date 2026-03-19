// Ribbon Toolbar Type Definitions

import type { ComponentType } from 'react';

// ============================================
// Tab Configuration Types
// ============================================

export interface RibbonTab {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  groups: RibbonGroup[];
  /** Contextual tabs only appear when specific elements are selected */
  contextual?: boolean;
  /** Element types that trigger this contextual tab */
  contextTrigger?: string[];
}

export interface RibbonGroup {
  id: string;
  label: string;
  /** For responsive behavior - collapse to dropdown when true */
  collapsed?: boolean;
  items: RibbonItem[];
}

// ============================================
// Item Types
// ============================================

export type RibbonItem =
  | RibbonButton
  | RibbonSplitButton
  | RibbonDropdown
  | RibbonToggle
  | RibbonGallery;

export interface RibbonButton {
  type: 'button';
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  size: 'large' | 'small';
  tooltip?: string;
  shortcut?: string;
  disabled?: boolean;
  command: string;
}

export interface RibbonSplitButton {
  type: 'split-button';
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  size: 'large' | 'small';
  primaryCommand: string;
  options: RibbonButtonOption[];
}

export interface RibbonButtonOption {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  command: string;
  description?: string;
}

export interface RibbonDropdown {
  type: 'dropdown';
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  options: RibbonButtonOption[];
}

export interface RibbonToggle {
  type: 'toggle';
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  size: 'large' | 'small';
  command: string;
  defaultChecked?: boolean;
}

export interface RibbonGallery {
  type: 'gallery';
  id: string;
  label: string;
  items: GalleryItem[];
  columns: number;
}

export interface GalleryItem {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  preview?: string; // Image URL
  command: string;
}

// ============================================
// Command System Types
// ============================================

export interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon?: ComponentType<{ className?: string }>;
  execute: (context: CommandContext) => void | Promise<void>;
  canExecute?: (context: CommandContext) => boolean;
  keywords?: string[];
}

export interface CommandContext {
  selectedElementIds: string[];
  hasModel: boolean;
  activeTool: string | null;
  dispatch: (command: string, data?: unknown) => void;
}

// ============================================
// State Types
// ============================================

export interface RibbonState {
  activeTab: string;
  collapsed: boolean;
  quickAccessItems: string[];
  activeTool: string | null;
  toolOptions: Record<string, Record<string, unknown>>;
  toggleStates: Record<string, boolean>;
}

export interface RibbonActions {
  setActiveTab: (tab: string) => void;
  setCollapsed: (collapsed: boolean) => void;
  setActiveTool: (tool: string | null) => void;
  setToolOption: (tool: string, option: string, value: unknown) => void;
  setToggleState: (id: string, checked: boolean) => void;
  addQuickAccessItem: (commandId: string) => void;
  removeQuickAccessItem: (commandId: string) => void;
  executeCommand: (commandId: string, data?: unknown) => void;
}

// ============================================
// Component Props Types
// ============================================

export interface RibbonProps {
  tabs: RibbonTab[];
  defaultTab?: string;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  onCommand?: (commandId: string, data?: unknown) => void;
  className?: string;
}

export interface QuickAccessToolbarProps {
  items: string[];
  onCommand?: (commandId: string) => void;
  onCustomize?: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
  recentCommands?: Command[];
  onCommand?: (commandId: string) => void;
}
