'use client';

/**
 * BIM Ribbon Toolbar - Revit-inspired tabbed toolbar
 *
 * Features:
 * - Tab-based organization (Home, View, Annotate, Analyze, Collaborate)
 * - Contextual tabs that appear when elements are selected
 * - Quick Access Toolbar
 * - Collapsible ribbon panel
 * - Keyboard shortcut support
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Save,
  Undo,
  Redo,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRibbonStore } from '@/stores/ribbon-store';
import { useBIMStore } from '@/stores/bim-store';
import { allRibbonTabs, keyboardShortcuts } from '@/config/ribbon-tabs';
import type { RibbonTab, RibbonGroup, RibbonItem, RibbonProps } from '@/types/ribbon';

// ============================================
// Main Ribbon Component
// ============================================

export function Ribbon({
  tabs = allRibbonTabs,
  defaultTab = 'home',
  collapsed: controlledCollapsed,
  onCollapseChange,
  onCommand,
  className,
}: RibbonProps) {
  // Store state
  const storeActiveTab = useRibbonStore((s) => s.activeTab);
  const storeCollapsed = useRibbonStore((s) => s.collapsed);
  const setActiveTab = useRibbonStore((s) => s.setActiveTab);
  const setCollapsed = useRibbonStore((s) => s.setCollapsed);
  const executeCommand = useRibbonStore((s) => s.executeCommand);
  const toggleStates = useRibbonStore((s) => s.toggleStates);

  // BIM store for contextual tabs
  const selectedIds = useBIMStore((s) => s.selection.selectedIds);
  const currentModel = useBIMStore((s) => s.currentModel);

  // Controlled vs uncontrolled collapse
  const isCollapsed = controlledCollapsed ?? storeCollapsed;

  // Filter tabs based on selection context
  const visibleTabs = useMemo(() => {
    return tabs.filter((tab) => {
      if (!tab.contextual) return true;
      if (!tab.contextTrigger || tab.contextTrigger.length === 0) return true;

      // Show contextual tab if any selected element matches trigger
      if (selectedIds.length === 0) return false;

      const selectedElements = currentModel?.elements.filter((el) =>
        selectedIds.includes(el.id)
      ) ?? [];

      return selectedElements.some((el) =>
        tab.contextTrigger?.includes(el.type)
      );
    });
  }, [tabs, selectedIds, currentModel]);

  // Auto-switch to contextual tab when elements are selected
  useEffect(() => {
    const contextualTab = visibleTabs.find((t) => t.contextual);
    if (contextualTab && selectedIds.length > 0) {
      setActiveTab(contextualTab.id);
    }
  }, [selectedIds, visibleTabs, setActiveTab]);

  // Handle tab click
  const handleTabClick = useCallback(
    (tabId: string) => {
      if (isCollapsed) {
        const newCollapsed = false;
        setCollapsed(newCollapsed);
        onCollapseChange?.(newCollapsed);
      }
      setActiveTab(tabId);
    },
    [isCollapsed, setCollapsed, setActiveTab, onCollapseChange]
  );

  // Handle double-click to collapse
  const handleDoubleClick = useCallback(() => {
    const newCollapsed = !isCollapsed;
    setCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  }, [isCollapsed, setCollapsed, onCollapseChange]);

  // Handle command execution
  const handleCommand = useCallback(
    (commandId: string, data?: unknown) => {
      executeCommand(commandId, data);
      onCommand?.(commandId, data);
    },
    [executeCommand, onCommand]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');

      const key = e.key.toLowerCase();
      if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
        parts.push(key);
      }

      const combo = parts.join('+');
      const command = keyboardShortcuts[combo];

      if (command) {
        e.preventDefault();
        handleCommand(command);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCommand]);

  const currentTab = visibleTabs.find((t) => t.id === storeActiveTab) || visibleTabs[0];

  return (
    <div
      className={cn(
        'ribbon-container border-b border-border bg-background/95 backdrop-blur-sm',
        className
      )}
    >
      {/* Quick Access Toolbar */}
      <QuickAccessToolbar onCommand={handleCommand} />

      {/* Tab List */}
      <div
        className="ribbon-tabs flex items-center h-8 px-2 bg-muted/30 border-b border-border"
        onDoubleClick={handleDoubleClick}
      >
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              'px-4 py-1 text-sm font-medium transition-colors rounded-t',
              'hover:bg-muted',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              storeActiveTab === tab.id
                ? 'bg-background text-primary border-t-2 border-t-primary'
                : 'text-muted-foreground',
              tab.contextual && 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
            )}
          >
            {tab.label}
          </button>
        ))}

        {/* Collapse button */}
        <button
          onClick={() => {
            const newCollapsed = !isCollapsed;
            setCollapsed(newCollapsed);
            onCollapseChange?.(newCollapsed);
          }}
          className="ml-auto p-1 hover:bg-muted rounded"
          title={isCollapsed ? 'Expand ribbon' : 'Collapse ribbon'}
        >
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Ribbon Panel */}
      <AnimatePresence>
        {!isCollapsed && currentTab && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <RibbonPanel
              tab={currentTab}
              onCommand={handleCommand}
              toggleStates={toggleStates}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Quick Access Toolbar
// ============================================

interface QuickAccessToolbarProps {
  onCommand: (commandId: string) => void;
}

function QuickAccessToolbar({ onCommand }: QuickAccessToolbarProps) {
  const quickAccessItems = useRibbonStore((s) => s.quickAccessItems);

  // Static icon map for SSR compatibility (no dynamic require)
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'file.save': Save,
    'history.undo': Undo,
    'history.redo': Redo,
  };

  // Get icon for quick access item
  const getQuickAccessIcon = (commandId: string) => {
    return iconMap[commandId] || Circle;
  };

  return (
    <div className="quick-access-toolbar flex items-center h-7 px-2 bg-muted/50 gap-0.5">
      {quickAccessItems.map((commandId) => {
        const Icon = getQuickAccessIcon(commandId);
        return (
          <button
            key={commandId}
            onClick={() => onCommand(commandId)}
            title={commandId}
            className={cn(
              'p-1 rounded transition-colors',
              'hover:bg-muted',
              'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary'
            )}
          >
            <Icon className="w-4 h-4 text-muted-foreground" />
          </button>
        );
      })}

      {/* Customize dropdown */}
      <button className="p-1 rounded hover:bg-muted ml-1">
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
    </div>
  );
}

// ============================================
// Ribbon Panel
// ============================================

interface RibbonPanelProps {
  tab: RibbonTab;
  onCommand: (commandId: string, data?: unknown) => void;
  toggleStates: Record<string, boolean>;
}

function RibbonPanel({ tab, onCommand, toggleStates }: RibbonPanelProps) {
  return (
    <div className="ribbon-panel flex items-stretch h-24 px-2 py-1 bg-background overflow-x-auto">
      {tab.groups.map((group, index) => (
        <React.Fragment key={group.id}>
          <RibbonGroupComponent
            group={group}
            onCommand={onCommand}
            toggleStates={toggleStates}
          />
          {index < tab.groups.length - 1 && (
            <div className="w-px bg-border mx-2 my-1" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================
// Ribbon Group
// ============================================

interface RibbonGroupComponentProps {
  group: RibbonGroup;
  onCommand: (commandId: string, data?: unknown) => void;
  toggleStates: Record<string, boolean>;
}

function RibbonGroupComponent({ group, onCommand, toggleStates }: RibbonGroupComponentProps) {
  // Separate large and small items
  const largeItems = group.items.filter(
    (item) => 'size' in item && item.size === 'large'
  );
  const smallItems = group.items.filter(
    (item) => !('size' in item) || item.size !== 'large'
  );

  return (
    <div className="ribbon-group flex flex-col min-w-0">
      <div className="flex-1 flex items-start gap-1 p-1">
        {/* Large buttons */}
        {largeItems.map((item) => (
          <RibbonItemComponent
            key={item.id}
            item={item}
            onCommand={onCommand}
            toggleStates={toggleStates}
          />
        ))}

        {/* Small buttons in columns */}
        {smallItems.length > 0 && (
          <div className="flex flex-col flex-wrap h-full gap-0.5 content-start">
            {smallItems.map((item) => (
              <RibbonItemComponent
                key={item.id}
                item={item}
                onCommand={onCommand}
                toggleStates={toggleStates}
              />
            ))}
          </div>
        )}
      </div>

      {/* Group label */}
      <div className="text-[10px] text-muted-foreground text-center px-2 py-0.5 border-t border-border/50">
        {group.label}
      </div>
    </div>
  );
}

// ============================================
// Ribbon Item Renderer
// ============================================

interface RibbonItemComponentProps {
  item: RibbonItem;
  onCommand: (commandId: string, data?: unknown) => void;
  toggleStates: Record<string, boolean>;
}

function RibbonItemComponent({ item, onCommand, toggleStates }: RibbonItemComponentProps) {
  switch (item.type) {
    case 'button':
      return <RibbonButton item={item} onCommand={onCommand} />;
    case 'split-button':
      return <RibbonSplitButton item={item} onCommand={onCommand} />;
    case 'dropdown':
      return <RibbonDropdown item={item} onCommand={onCommand} />;
    case 'toggle':
      return (
        <RibbonToggle
          item={item}
          onCommand={onCommand}
          checked={toggleStates[item.command] ?? item.defaultChecked ?? false}
        />
      );
    default:
      return null;
  }
}

// ============================================
// Ribbon Button
// ============================================

interface RibbonButtonProps {
  item: Extract<RibbonItem, { type: 'button' }>;
  onCommand: (commandId: string) => void;
}

function RibbonButton({ item, onCommand }: RibbonButtonProps) {
  const Icon = item.icon;
  const isLarge = item.size === 'large';

  return (
    <button
      onClick={() => onCommand(item.command)}
      disabled={item.disabled}
      title={item.tooltip || `${item.label}${item.shortcut ? ` (${item.shortcut})` : ''}`}
      className={cn(
        'flex items-center justify-center rounded transition-colors',
        'hover:bg-primary/10',
        'active:bg-primary/20',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isLarge
          ? 'flex-col gap-1 px-3 py-1.5 min-w-[56px]'
          : 'flex-row gap-1.5 px-2 py-1 h-6'
      )}
    >
      <Icon className={cn('flex-shrink-0', isLarge ? 'w-6 h-6' : 'w-4 h-4')} />
      <span
        className={cn(
          'text-foreground',
          isLarge ? 'text-[10px]' : 'text-xs'
        )}
      >
        {item.label}
      </span>
    </button>
  );
}

// ============================================
// Ribbon Split Button
// ============================================

interface RibbonSplitButtonProps {
  item: Extract<RibbonItem, { type: 'split-button' }>;
  onCommand: (commandId: string) => void;
}

function RibbonSplitButton({ item, onCommand }: RibbonSplitButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = item.icon;
  const isLarge = item.size === 'large';

  return (
    <div className="relative">
      <div
        className={cn(
          'flex rounded overflow-hidden',
          isLarge ? 'flex-col' : 'flex-row'
        )}
      >
        {/* Primary action */}
        <button
          onClick={() => onCommand(item.primaryCommand)}
          className={cn(
            'flex items-center justify-center transition-colors',
            'hover:bg-primary/10',
            'active:bg-primary/20',
            isLarge
              ? 'flex-col gap-1 px-3 py-1.5 min-w-[56px]'
              : 'flex-row gap-1.5 px-2 py-1'
          )}
        >
          <Icon className={cn(isLarge ? 'w-6 h-6' : 'w-4 h-4')} />
          <span className={cn(isLarge ? 'text-[10px]' : 'text-xs')}>
            {item.label}
          </span>
        </button>

        {/* Dropdown trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center justify-center transition-colors',
            'hover:bg-primary/10',
            'border-l border-border',
            isLarge ? 'px-1 py-0.5' : 'px-1 py-1'
          )}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 mt-1 z-50 min-w-[200px] bg-popover border border-border rounded-lg shadow-lg py-1"
            >
              {item.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onCommand(option.command);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-start gap-3 px-3 py-2 hover:bg-muted text-left"
                >
                  {option.icon && <option.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                  <div>
                    <div className="text-sm font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Ribbon Dropdown
// ============================================

interface RibbonDropdownProps {
  item: Extract<RibbonItem, { type: 'dropdown' }>;
  onCommand: (commandId: string) => void;
}

function RibbonDropdown({ item, onCommand }: RibbonDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = item.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded transition-colors',
          'hover:bg-primary/10',
          'active:bg-primary/20'
        )}
      >
        <Icon className="w-4 h-4" />
        <span className="text-xs">{item.label}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 mt-1 z-50 min-w-[150px] bg-popover border border-border rounded-lg shadow-lg py-1"
            >
              {item.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onCommand(option.command);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-left text-sm"
                >
                  {option.icon && <option.icon className="w-4 h-4" />}
                  {option.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Ribbon Toggle
// ============================================

interface RibbonToggleProps {
  item: Extract<RibbonItem, { type: 'toggle' }>;
  onCommand: (commandId: string) => void;
  checked: boolean;
}

function RibbonToggle({ item, onCommand, checked }: RibbonToggleProps) {
  const Icon = item.icon;
  const isLarge = item.size === 'large';

  return (
    <button
      onClick={() => onCommand(item.command)}
      className={cn(
        'flex items-center justify-center rounded transition-colors',
        'hover:bg-primary/10',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        checked && 'bg-primary/20 text-primary',
        isLarge
          ? 'flex-col gap-1 px-3 py-1.5 min-w-[56px]'
          : 'flex-row gap-1.5 px-2 py-1 h-6'
      )}
    >
      <Icon className={cn('flex-shrink-0', isLarge ? 'w-6 h-6' : 'w-4 h-4')} />
      <span className={cn(isLarge ? 'text-[10px]' : 'text-xs')}>
        {item.label}
      </span>
    </button>
  );
}

export default Ribbon;
