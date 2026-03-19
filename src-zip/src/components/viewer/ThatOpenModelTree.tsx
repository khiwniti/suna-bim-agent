'use client';

/**
 * ThatOpenModelTree - Hierarchical Model Tree
 *
 * Displays spatial structure, element types, or materials
 * with expand/collapse and selection capabilities
 */

import { useState, useMemo, useCallback } from 'react';
import { useBIMStore } from '@/stores/bim-store';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import {
  ChevronDown,
  ChevronRight,
  Building2,
  Layers,
  Box,
  Search,
  X,
} from 'lucide-react';
import type { SpatialTreeNode } from '@/types/thatopen';

// ============================================
// Types
// ============================================

type TreeViewMode = 'spatial' | 'types' | 'materials';

interface TreeNodeProps {
  node: SpatialTreeNode;
  level: number;
  onSelect: (nodeId: string, expressID?: number) => void;
  selectedId: string | null;
  expandedIds: Set<string>;
  onToggleExpand: (nodeId: string) => void;
}

// ============================================
// Tree Node Component
// ============================================

function TreeNode({
  node,
  level,
  onSelect,
  selectedId,
  expandedIds,
  onToggleExpand,
}: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  const getNodeIcon = () => {
    switch (node.type) {
      case 'project':
        return '🏗️';
      case 'site':
        return '🌍';
      case 'building':
        return '🏢';
      case 'storey':
        return '📐';
      case 'space':
        return '🚪';
      default:
        return '📦';
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-1 px-2 cursor-pointer rounded hover:bg-muted',
          isSelected && 'bg-emerald-100 hover:bg-emerald-200'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(node.id, node.expressID)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown size={14} className="text-muted-foreground" />
            ) : (
              <ChevronRight size={14} className="text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <span className="text-sm">{getNodeIcon()}</span>
        <span className="text-sm text-foreground truncate flex-1">{node.name}</span>
        {node.elementCount !== undefined && node.elementCount > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {node.elementCount}
          </span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

interface ThatOpenModelTreeProps {
  className?: string;
  onElementSelect?: (expressID: number) => void;
  onClose?: () => void;
}

export function ThatOpenModelTree({
  className,
  onElementSelect,
  onClose,
}: ThatOpenModelTreeProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<TreeViewMode>('spatial');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['root']));

  const fragmentsModels = useBIMStore((s) => s.fragmentsModels);
  const currentModel = useBIMStore((s) => s.currentModel);

  // Build tree from fragments or BIM model
  const treeData = useMemo((): SpatialTreeNode => {
    // Try fragments models first
    for (const [, modelData] of fragmentsModels) {
      if (modelData.properties.spatialTree) {
        return modelData.properties.spatialTree;
      }
    }

    // Build from current BIM model
    if (currentModel) {
      const levelMap = new Map<string, SpatialTreeNode>();

      // Create level nodes
      for (const level of currentModel.levels) {
        levelMap.set(level.id, {
          id: level.id,
          name: level.name,
          type: 'storey',
          children: [],
          elementCount: 0,
        });
      }

      // Add elements to levels
      for (const element of currentModel.elements) {
        const levelId = element.level || 'unknown';
        let levelNode = levelMap.get(levelId);

        if (!levelNode) {
          levelNode = {
            id: levelId,
            name: levelId,
            type: 'storey',
            children: [],
            elementCount: 0,
          };
          levelMap.set(levelId, levelNode);
        }

        levelNode.children.push({
          id: element.id,
          name: element.name,
          type: 'element',
          expressID: parseInt(element.globalId) || undefined,
          children: [],
        });
        levelNode.elementCount = (levelNode.elementCount || 0) + 1;
      }

      return {
        id: 'root',
        name: currentModel.name,
        type: 'project',
        children: Array.from(levelMap.values()),
        elementCount: currentModel.elements.length,
      };
    }

    // Empty tree
    return {
      id: 'root',
      name: t('viewer.noModelLoaded'),
      type: 'project',
      children: [],
    };
  }, [fragmentsModels, currentModel]);

  // Handle selection
  const handleSelect = useCallback(
    (nodeId: string, expressID?: number) => {
      setSelectedId(nodeId);
      if (expressID !== undefined) {
        onElementSelect?.(expressID);
      }
    },
    [onElementSelect]
  );

  // Handle expand toggle
  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  return (
    <div className={cn('bg-background border-r border-border w-72 flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">{t('viewer.modelTree')}</h3>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X size={18} className="text-muted-foreground/80" />
          </button>
        )}
      </div>

      {/* View Mode Tabs */}
      <div className="flex border-b border-border">
        {[
          { mode: 'spatial' as const, icon: Building2, label: t('viewer.spatial') },
          { mode: 'types' as const, icon: Layers, label: t('viewer.types') },
          { mode: 'materials' as const, icon: Box, label: t('viewer.materials') },
        ].map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium transition-colors',
              viewMode === mode
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground/80 hover:text-foreground'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('viewer.searchElements')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        <TreeNode
          node={treeData}
          level={0}
          onSelect={handleSelect}
          selectedId={selectedId}
          expandedIds={expandedIds}
          onToggleExpand={handleToggleExpand}
        />
      </div>
    </div>
  );
}

export default ThatOpenModelTree;
