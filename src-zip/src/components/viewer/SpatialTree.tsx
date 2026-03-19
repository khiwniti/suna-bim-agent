'use client';

/**
 * SpatialTree - IFC Spatial Hierarchy Navigation
 *
 * Displays the complete IFC spatial structure:
 * - IfcProject → IfcSite → IfcBuilding → IfcBuildingStorey → IfcSpace
 *
 * This follows the official IFC spatial containment hierarchy,
 * which is the standard organization for BIM models.
 *
 * ★ Insight ─────────────────────────────────────
 * The IFC spatial hierarchy is fundamental to BIM. Elements are
 * "contained in" spatial structures through IfcRelContainedInSpatialStructure.
 * This tree reflects that hierarchy exactly as defined in the IFC schema.
 * ─────────────────────────────────────────────────
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Search,
  Box,
  Building2,
  Layers,
  MapPin,
  FileCode,
  Grid3X3,
  Folder,
  FolderOpen,
  X,
  MoreVertical,
  Focus,
  Trash2,
  Copy,
} from 'lucide-react';
import type { BIMElement, BIMElementType, BuildingLevel } from '@/types';

// ============================================
// Types
// ============================================

export interface SpatialNode {
  id: string;
  name: string;
  ifcType: string;
  nodeType: 'project' | 'site' | 'building' | 'storey' | 'space' | 'element' | 'group';
  elementType?: BIMElementType;
  element?: BIMElement;
  children: SpatialNode[];
  elementCount?: number;
  elevation?: number;
  globalId?: string;
}

export interface SpatialTreeProps {
  /** Root node of the spatial hierarchy */
  rootNode?: SpatialNode;
  /** Currently selected element IDs */
  selectedIds?: string[];
  /** Hidden element IDs */
  hiddenIds?: Set<string>;
  /** Element visibility map (element ID → visible) */
  visibilityMap?: Map<string, boolean>;
  /** Show element types as sub-groups */
  groupByType?: boolean;
  /** Show spatial containment indicators */
  showSpatialInfo?: boolean;
  /** Enable multi-select */
  multiSelect?: boolean;
  /** Loading state */
  isLoading?: boolean;

  // Callbacks
  onSelect?: (ids: string[]) => void;
  onToggleVisibility?: (ids: string[], visible: boolean) => void;
  onIsolate?: (ids: string[]) => void;
  onZoomTo?: (ids: string[]) => void;
  onExpand?: (nodeId: string, expanded: boolean) => void;

  /** CSS class */
  className?: string;
}

// ============================================
// Node Type Icons
// ============================================

const NODE_TYPE_ICONS: Record<SpatialNode['nodeType'], React.ComponentType<{ className?: string }>> = {
  project: FileCode,
  site: MapPin,
  building: Building2,
  storey: Layers,
  space: Grid3X3,
  element: Box,
  group: Folder,
};

const NODE_TYPE_COLORS: Record<SpatialNode['nodeType'], string> = {
  project: 'text-purple-500',
  site: 'text-green-500',
  building: 'text-blue-500',
  storey: 'text-amber-500',
  space: 'text-cyan-500',
  element: 'text-muted-foreground/80',
  group: 'text-muted-foreground',
};

// ============================================
// SpatialTree Component
// ============================================

export function SpatialTree({
  rootNode,
  selectedIds = [],
  hiddenIds = new Set(),
  visibilityMap,
  groupByType = true,
  showSpatialInfo = true,
  multiSelect = true,
  isLoading = false,
  onSelect,
  onToggleVisibility,
  onIsolate,
  onZoomTo,
  onExpand,
  className,
}: SpatialTreeProps) {
  const { t } = useTranslation();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['root', 'site-default', 'building-default'])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenuNode, setContextMenuNode] = useState<string | null>(null);

  // Toggle node expansion
  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      const wasExpanded = next.has(nodeId);
      if (wasExpanded) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      onExpand?.(nodeId, !wasExpanded);
      return next;
    });
  }, [onExpand]);

  // Expand all nodes
  const expandAll = useCallback(() => {
    if (!rootNode) return;

    const getAllIds = (node: SpatialNode): string[] => {
      return [node.id, ...node.children.flatMap(getAllIds)];
    };

    setExpandedNodes(new Set(getAllIds(rootNode)));
  }, [rootNode]);

  // Collapse all nodes
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set(['root']));
  }, []);

  // Handle node selection
  const handleSelect = useCallback((nodeId: string, isElement: boolean, shiftKey: boolean, ctrlKey: boolean) => {
    if (!isElement) {
      // For non-element nodes, toggle expansion
      toggleExpanded(nodeId);
      return;
    }

    if (multiSelect && (shiftKey || ctrlKey)) {
      // Multi-select: toggle this element
      const newSelection = ctrlKey
        ? selectedIds.includes(nodeId)
          ? selectedIds.filter(id => id !== nodeId)
          : [...selectedIds, nodeId]
        : [nodeId];
      onSelect?.(newSelection);
    } else {
      // Single select
      onSelect?.([nodeId]);
    }
  }, [multiSelect, selectedIds, onSelect, toggleExpanded]);

  // Handle visibility toggle
  const handleVisibilityToggle = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyHidden = hiddenIds.has(nodeId) || visibilityMap?.get(nodeId) === false;
    onToggleVisibility?.([nodeId], isCurrentlyHidden);
  }, [hiddenIds, visibilityMap, onToggleVisibility]);

  // Filter tree based on search
  const filteredRoot = useMemo(() => {
    if (!rootNode || !searchQuery.trim()) return rootNode;

    const query = searchQuery.toLowerCase();

    const filterNode = (node: SpatialNode): SpatialNode | null => {
      const matches = node.name.toLowerCase().includes(query) ||
                      node.ifcType.toLowerCase().includes(query);

      const filteredChildren = node.children
        .map(filterNode)
        .filter((n): n is SpatialNode => n !== null);

      if (matches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    };

    return filterNode(rootNode);
  }, [rootNode, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!rootNode) return { elements: 0, levels: 0, spaces: 0 };

    let elements = 0;
    let levels = 0;
    let spaces = 0;

    const countNodes = (node: SpatialNode) => {
      if (node.nodeType === 'element') elements++;
      if (node.nodeType === 'storey') levels++;
      if (node.nodeType === 'space') spaces++;
      node.children.forEach(countNodes);
    };

    countNodes(rootNode);
    return { elements, levels, spaces };
  }, [rootNode]);

  // Empty state
  if (!rootNode && !isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-6 text-center', className)}>
        <Building2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">{t('viewer.noSpatialHierarchy')}</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {t('viewer.loadBimModelToSeeStructure')}
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-6', className)}>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold">{t('viewer.spatialStructure')}</h3>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('viewer.searchHierarchy')}
            className={cn(
              'w-full pl-8 pr-8 py-1.5 text-sm',
              'bg-muted rounded-md',
              'border border-transparent',
              'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary'
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Expand/Collapse controls */}
        <div className="flex gap-2 mt-2 text-xs">
          <button
            onClick={expandAll}
            className="text-muted-foreground hover:text-foreground"
          >
            {t('viewer.expandAll')}
          </button>
          <span className="text-muted-foreground">•</span>
          <button
            onClick={collapseAll}
            className="text-muted-foreground hover:text-foreground"
          >
            {t('viewer.collapseAll')}
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-1">
        {filteredRoot ? (
          <SpatialNodeComponent
            node={filteredRoot}
            level={0}
            expandedNodes={expandedNodes}
            selectedIds={selectedIds}
            hiddenIds={hiddenIds}
            visibilityMap={visibilityMap}
            showSpatialInfo={showSpatialInfo}
            onToggleExpand={toggleExpanded}
            onSelect={handleSelect}
            onToggleVisibility={handleVisibilityToggle}
            onIsolate={onIsolate}
            onZoomTo={onZoomTo}
            contextMenuNode={contextMenuNode}
            setContextMenuNode={setContextMenuNode}
          />
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No matching items found
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-border bg-muted/30">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{stats.levels} storeys</span>
          <span>{stats.spaces} spaces</span>
          <span>{stats.elements} elements</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Spatial Node Component
// ============================================

interface SpatialNodeComponentProps {
  node: SpatialNode;
  level: number;
  expandedNodes: Set<string>;
  selectedIds: string[];
  hiddenIds: Set<string>;
  visibilityMap?: Map<string, boolean>;
  showSpatialInfo: boolean;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string, isElement: boolean, shiftKey: boolean, ctrlKey: boolean) => void;
  onToggleVisibility: (id: string, e: React.MouseEvent) => void;
  onIsolate?: (ids: string[]) => void;
  onZoomTo?: (ids: string[]) => void;
  contextMenuNode: string | null;
  setContextMenuNode: (id: string | null) => void;
}

function SpatialNodeComponent({
  node,
  level,
  expandedNodes,
  selectedIds,
  hiddenIds,
  visibilityMap,
  showSpatialInfo,
  onToggleExpand,
  onSelect,
  onToggleVisibility,
  onIsolate,
  onZoomTo,
  contextMenuNode,
  setContextMenuNode,
}: SpatialNodeComponentProps) {
  const { t } = useTranslation();
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedIds.includes(node.id);
  const isHidden = hiddenIds.has(node.id) || visibilityMap?.get(node.id) === false;
  const isElement = node.nodeType === 'element';

  const Icon = isExpanded && hasChildren ? FolderOpen : NODE_TYPE_ICONS[node.nodeType];
  const iconColor = NODE_TYPE_COLORS[node.nodeType];

  // Handle click
  const handleClick = useCallback((e: React.MouseEvent) => {
    onSelect(node.id, isElement, e.shiftKey, e.ctrlKey || e.metaKey);
  }, [node.id, isElement, onSelect]);

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuNode(contextMenuNode === node.id ? null : node.id);
  }, [node.id, contextMenuNode, setContextMenuNode]);

  return (
    <div className="group">
      {/* Node Row */}
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-colors',
          'hover:bg-muted',
          isSelected && 'bg-primary/10 text-primary ring-1 ring-primary/20',
          isHidden && 'opacity-40'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Expand/Collapse Arrow */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className="p-0.5 hover:bg-muted rounded"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.div>
          </button>
        ) : (
          <span className="w-4.5" />
        )}

        {/* Icon */}
        <Icon className={cn('w-4 h-4 flex-shrink-0', iconColor)} />

        {/* Name */}
        <span className="flex-1 text-sm truncate" title={node.name}>
          {node.name}
        </span>

        {/* Spatial Info */}
        {showSpatialInfo && node.elevation !== undefined && (
          <span className="text-[10px] text-muted-foreground">
            {node.elevation.toFixed(1)}m
          </span>
        )}

        {/* Element Count */}
        {node.elementCount !== undefined && node.elementCount > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {node.elementCount}
          </span>
        )}

        {/* Visibility Toggle */}
        <button
          onClick={(e) => onToggleVisibility(node.id, e)}
          className={cn(
            'p-1 rounded transition-opacity',
            'hover:bg-muted',
            isElement ? 'opacity-0 group-hover:opacity-100' : 'opacity-60'
          )}
          aria-label={isHidden ? t('common.show') : t('common.hide')}
        >
          {isHidden ? (
            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>

        {/* Context Menu Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setContextMenuNode(contextMenuNode === node.id ? null : node.id);
          }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted"
        >
          <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenuNode === node.id && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'absolute z-50 mt-1 ml-8 p-1',
              'bg-background rounded-lg shadow-lg border border-border',
              'min-w-[140px]'
            )}
            style={{ marginLeft: `${level * 16 + 40}px` }}
          >
            <ContextMenuItem
              icon={Focus}
              label={t('spatialTree.zoomTo')}
              onClick={() => {
                onZoomTo?.([node.id]);
                setContextMenuNode(null);
              }}
            />
            <ContextMenuItem
              icon={Eye}
              label={t('spatialTree.isolate')}
              onClick={() => {
                onIsolate?.([node.id]);
                setContextMenuNode(null);
              }}
            />
            <ContextMenuItem
              icon={Copy}
              label={t('spatialTree.copyId')}
              onClick={() => {
                navigator.clipboard.writeText(node.globalId || node.id);
                setContextMenuNode(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <SpatialNodeComponent
                key={child.id}
                node={child}
                level={level + 1}
                expandedNodes={expandedNodes}
                selectedIds={selectedIds}
                hiddenIds={hiddenIds}
                visibilityMap={visibilityMap}
                showSpatialInfo={showSpatialInfo}
                onToggleExpand={onToggleExpand}
                onSelect={onSelect}
                onToggleVisibility={onToggleVisibility}
                onIsolate={onIsolate}
                onZoomTo={onZoomTo}
                contextMenuNode={contextMenuNode}
                setContextMenuNode={setContextMenuNode}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Context Menu Item
// ============================================

interface ContextMenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

function ContextMenuItem({ icon: Icon, label, onClick, destructive }: ContextMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md',
        'hover:bg-muted',
        destructive && 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

export default SpatialTree;
