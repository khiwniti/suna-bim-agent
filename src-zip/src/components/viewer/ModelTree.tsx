'use client';

/**
 * ModelTree - Hierarchical view of BIM model elements
 *
 * Displays the model structure organized by:
 * - Levels (floors)
 * - Element types (walls, doors, windows, etc.)
 * - Individual elements
 *
 * Supports:
 * - Expand/collapse nodes
 * - Select elements
 * - Visibility toggle
 * - Search/filter
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Search,
  Layers,
  Box,
  Building2,
  DoorOpen,
  Grid3X3,
  Square,
  Columns,
  CircleDot,
  Wind,
  Pipette,
  Sofa,
  Cog,
  MapPin,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import { useBIMStore } from '@/stores/bim-store';
import type { BIMElement, BIMElementType, BuildingLevel } from '@/types';

interface ModelTreeProps {
  className?: string;
  onElementSelect?: (elementId: string) => void;
  onElementVisibilityToggle?: (elementId: string, visible: boolean) => void;
}

// Icon mapping for element types
const ELEMENT_ICONS: Record<BIMElementType, React.ComponentType<{ className?: string }>> = {
  wall: Building2,
  door: DoorOpen,
  window: Grid3X3,
  slab: Square,
  roof: Layers,
  stair: Layers,
  column: Columns,
  beam: Columns,
  furniture: Sofa,
  equipment: Cog,
  space: MapPin,
  zone: MapPin,
  hvac: Wind,
  pipe: Pipette,
  duct: Wind,
  other: Box,
};

// Element type display names
const ELEMENT_TYPE_NAMES: Record<BIMElementType, string> = {
  wall: 'Walls',
  door: 'Doors',
  window: 'Windows',
  slab: 'Slabs',
  roof: 'Roofs',
  stair: 'Stairs',
  column: 'Columns',
  beam: 'Beams',
  furniture: 'Furniture',
  equipment: 'Equipment',
  space: 'Spaces',
  zone: 'Zones',
  hvac: 'HVAC',
  pipe: 'Pipes',
  duct: 'Ducts',
  other: 'Other',
};

interface TreeNode {
  id: string;
  name: string;
  type: 'model' | 'level' | 'category' | 'element';
  elementType?: BIMElementType;
  children?: TreeNode[];
  element?: BIMElement;
  count?: number;
}

export function ModelTree({
  className,
  onElementSelect,
  onElementVisibilityToggle,
}: ModelTreeProps) {
  const { t } = useTranslation();
  const currentModel = useBIMStore((state) => state.currentModel);
  const selection = useBIMStore((state) => state.selection);
  const selectElements = useBIMStore((state) => state.selectElements);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [hiddenElements, setHiddenElements] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Build tree structure from model
  const treeData = useMemo((): TreeNode | null => {
    if (!currentModel) return null;

    const elements = currentModel.elements;
    const levels = currentModel.levels;

    // Group elements by level and type
    const elementsByLevel = new Map<string, Map<BIMElementType, BIMElement[]>>();
    const unassignedByType = new Map<BIMElementType, BIMElement[]>();

    elements.forEach((el) => {
      const levelId = el.level || 'unassigned';

      if (levelId === 'unassigned') {
        if (!unassignedByType.has(el.type)) {
          unassignedByType.set(el.type, []);
        }
        unassignedByType.get(el.type)!.push(el);
      } else {
        if (!elementsByLevel.has(levelId)) {
          elementsByLevel.set(levelId, new Map());
        }
        const levelTypes = elementsByLevel.get(levelId)!;
        if (!levelTypes.has(el.type)) {
          levelTypes.set(el.type, []);
        }
        levelTypes.get(el.type)!.push(el);
      }
    });

    // Build level nodes
    const levelNodes: TreeNode[] = levels.map((level) => {
      const typeMap = elementsByLevel.get(level.id) || new Map<BIMElementType, BIMElement[]>();
      const categoryNodes: TreeNode[] = [];

      typeMap.forEach((elements: BIMElement[], type: BIMElementType) => {
        categoryNodes.push({
          id: `${level.id}-${type}`,
          name: ELEMENT_TYPE_NAMES[type],
          type: 'category',
          elementType: type,
          count: elements.length,
          children: elements.map((el) => ({
            id: el.id,
            name: el.name,
            type: 'element' as const,
            elementType: el.type,
            element: el,
          })),
        });
      });

      return {
        id: level.id,
        name: level.name,
        type: 'level' as const,
        count: categoryNodes.reduce((sum, c) => sum + (c.count || 0), 0),
        children: categoryNodes.sort((a, b) => a.name.localeCompare(b.name)),
      };
    });

    // Add unassigned elements
    if (unassignedByType.size > 0) {
      const unassignedCategories: TreeNode[] = [];

      unassignedByType.forEach((elements: BIMElement[], type: BIMElementType) => {
        unassignedCategories.push({
          id: `unassigned-${type}`,
          name: ELEMENT_TYPE_NAMES[type],
          type: 'category',
          elementType: type,
          count: elements.length,
          children: elements.map((el) => ({
            id: el.id,
            name: el.name,
            type: 'element' as const,
            elementType: el.type,
            element: el,
          })),
        });
      });

      levelNodes.push({
        id: 'unassigned',
        name: 'Unassigned',
        type: 'level',
        count: unassignedCategories.reduce((sum, c) => sum + (c.count || 0), 0),
        children: unassignedCategories.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }

    return {
      id: 'root',
      name: currentModel.name,
      type: 'model',
      count: elements.length,
      children: levelNodes.sort((a, b) => {
        // Sort by elevation if available
        const levelA = levels.find((l) => l.id === a.id);
        const levelB = levels.find((l) => l.id === b.id);
        if (levelA && levelB) return levelA.elevation - levelB.elevation;
        if (a.id === 'unassigned') return 1;
        if (b.id === 'unassigned') return -1;
        return a.name.localeCompare(b.name);
      }),
    };
  }, [currentModel]);

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!treeData || !searchQuery.trim()) return treeData;

    const query = searchQuery.toLowerCase();

    const filterNode = (node: TreeNode): TreeNode | null => {
      // Check if this node matches
      const matches = node.name.toLowerCase().includes(query);

      // Filter children
      const filteredChildren = node.children
        ?.map((child) => filterNode(child))
        .filter((child): child is TreeNode => child !== null);

      // Include this node if it matches or has matching children
      if (matches || (filteredChildren && filteredChildren.length > 0)) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    };

    return filterNode(treeData);
  }, [treeData, searchQuery]);

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleElementClick = useCallback(
    (elementId: string) => {
      selectElements([elementId]);
      onElementSelect?.(elementId);
    },
    [selectElements, onElementSelect]
  );

  const toggleVisibility = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const isHidden = hiddenElements.has(nodeId);
      setHiddenElements((prev) => {
        const next = new Set(prev);
        if (isHidden) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });
      onElementVisibilityToggle?.(nodeId, isHidden);
    },
    [hiddenElements, onElementVisibilityToggle]
  );

  if (!currentModel) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-6 text-center', className)}>
        <Box className="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">{t('viewer.noModelLoaded')}</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {t('viewer.loadIfcToSeeTree')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search Bar */}
      <div className="flex-shrink-0 p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('viewer.searchElements')}
            className="w-full pl-8 pr-8 py-1.5 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
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
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-1">
        {filteredTree ? (
          <TreeNodeComponent
            node={filteredTree}
            level={0}
            expandedNodes={expandedNodes}
            hiddenElements={hiddenElements}
            selectedIds={selection.selectedIds}
            onToggleExpand={toggleExpanded}
            onSelect={handleElementClick}
            onToggleVisibility={toggleVisibility}
          />
        ) : (
          <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
            No matching elements found
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>{currentModel.elements.length} elements</span>
          <span>{currentModel.levels.length} levels</span>
        </div>
      </div>
    </div>
  );
}

// Tree Node Component
interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
  expandedNodes: Set<string>;
  hiddenElements: Set<string>;
  selectedIds: string[];
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string, e: React.MouseEvent) => void;
}

function TreeNodeComponent({
  node,
  level,
  expandedNodes,
  hiddenElements,
  selectedIds,
  onToggleExpand,
  onSelect,
  onToggleVisibility,
}: TreeNodeComponentProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedIds.includes(node.id);
  const isHidden = hiddenElements.has(node.id);
  const Icon = node.elementType ? ELEMENT_ICONS[node.elementType] : Box;

  const handleClick = () => {
    if (node.type === 'element') {
      onSelect(node.id);
    } else if (hasChildren) {
      onToggleExpand(node.id);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-colors',
          'hover:bg-muted/80',
          isSelected && 'bg-primary/10 text-primary',
          isHidden && 'opacity-50'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Icon */}
        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        {/* Name */}
        <span className="flex-1 text-sm truncate">{node.name}</span>

        {/* Count Badge */}
        {node.count !== undefined && node.count > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {node.count}
          </span>
        )}

        {/* Visibility Toggle */}
        {node.type === 'element' && (
          <button
            onClick={(e) => onToggleVisibility(node.id, e)}
            className="p-0.5 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isHidden ? (
              <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

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
            {node.children!.map((child) => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                level={level + 1}
                expandedNodes={expandedNodes}
                hiddenElements={hiddenElements}
                selectedIds={selectedIds}
                onToggleExpand={onToggleExpand}
                onSelect={onSelect}
                onToggleVisibility={onToggleVisibility}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ModelTree;
