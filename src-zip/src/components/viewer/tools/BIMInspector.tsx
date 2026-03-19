'use client';

/**
 * BIMInspector - Property panel for selected BIM elements
 *
 * Shows detailed information about selected elements:
 * - Basic properties (name, type, ID)
 * - Geometric properties (volume, area, dimensions)
 * - Material information
 * - IFC classification
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, ChevronDown, ChevronRight, Layers, Box, Ruler, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBIMStore } from '@/stores/bim-store';
import { useTranslation } from '@/i18n/provider';
import type { BIMElement } from '@/types/bim';

interface BIMInspectorProps {
  isActive: boolean;
  onClose?: () => void;
}

interface PropertyGroup {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  properties: { label: string; value: string | number | undefined }[];
}

export function BIMInspector({ isActive, onClose }: BIMInspectorProps) {
  const { t } = useTranslation();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['basic', 'geometry']));
  const selectedIds = useBIMStore((state) => state.selection.selectedIds);
  const currentModel = useBIMStore((state) => state.currentModel);

  // Get selected elements
  const selectedElements = currentModel?.elements.filter((el) =>
    selectedIds.includes(el.id)
  ) || [];

  // Toggle group expansion
  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  // Build property groups for a single element
  const getPropertyGroups = (element: BIMElement): PropertyGroup[] => {
    const groups: PropertyGroup[] = [
      {
        name: 'basic',
        icon: Info,
        properties: [
          { label: t('viewer.name'), value: element.name },
          { label: t('viewer.type'), value: element.type },
          { label: 'Global ID', value: element.globalId },
          { label: 'Express ID', value: element.id },
          { label: t('viewer.level'), value: element.level },
        ],
      },
      {
        name: 'geometry',
        icon: Box,
        properties: [
          { label: t('viewer.volume'), value: element.properties?.volume ? `${(element.properties.volume as number).toFixed(2)} m³` : undefined },
          { label: t('viewer.area'), value: element.properties?.area ? `${(element.properties.area as number).toFixed(2)} m²` : undefined },
          { label: t('viewer.length'), value: element.properties?.length ? `${(element.properties.length as number).toFixed(2)} m` : undefined },
          { label: t('viewer.width'), value: element.properties?.width ? `${(element.properties.width as number).toFixed(2)} m` : undefined },
          { label: t('viewer.height'), value: element.properties?.height ? `${(element.properties.height as number).toFixed(2)} m` : undefined },
        ].filter((p) => p.value !== undefined),
      },
      {
        name: 'material',
        icon: Palette,
        properties: [
          { label: t('viewer.material'), value: element.material || element.properties?.materialName as string },
          { label: t('viewer.category'), value: element.properties?.materialCategory as string },
        ].filter((p) => p.value !== undefined),
      },
      {
        name: 'classification',
        icon: Layers,
        properties: [
          { label: t('viewer.ifcCategory'), value: element.properties?.ifcCategory as string },
          { label: t('viewer.predefinedType'), value: element.properties?.predefinedType as string },
          { label: t('viewer.source'), value: element.properties?.source as string },
        ].filter((p) => p.value !== undefined),
      },
    ];

    return groups.filter((g) => g.properties.length > 0);
  };

  // Calculate summary for multiple elements
  const getSummary = (elements: BIMElement[]) => {
    const types: Record<string, number> = {};
    let totalVolume = 0;
    let totalArea = 0;

    elements.forEach((el) => {
      types[el.type] = (types[el.type] || 0) + 1;
      if (el.properties?.volume) totalVolume += el.properties.volume as number;
      if (el.properties?.area) totalArea += el.properties.area as number;
    });

    return { types, totalVolume, totalArea };
  };

  if (!isActive) return null;

  const summary = getSummary(selectedElements);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute top-20 right-4 bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-lg w-80 max-h-[70vh] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{t('viewer.bimInspector')}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedElements.length === 0 ? (
          <div className="p-6 text-center">
            <Box className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              {t('viewer.selectElementToInspect')}
            </p>
          </div>
        ) : selectedElements.length === 1 ? (
          // Single element view
          <div className="p-2">
            {getPropertyGroups(selectedElements[0]).map((group) => (
              <div key={group.name} className="mb-2">
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  {expandedGroups.has(group.name) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <group.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium capitalize">{group.name}</span>
                </button>

                <AnimatePresence>
                  {expandedGroups.has(group.name) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-8 pr-2 pb-2 space-y-1">
                        {group.properties.map((prop, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center py-1 text-sm"
                          >
                            <span className="text-muted-foreground">{prop.label}</span>
                            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded max-w-[150px] truncate">
                              {prop.value ?? '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ) : (
          // Multiple elements summary
          <div className="p-4 space-y-4">
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <span className="text-2xl font-bold text-primary">{selectedElements.length}</span>
              <span className="text-sm text-muted-foreground ml-2">{t('viewer.elementsSelected')}</span>
            </div>

            {/* Type breakdown */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                {t('viewer.byType')}
              </h4>
              <div className="space-y-1">
                {Object.entries(summary.types).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="capitalize">{type}</span>
                    <span className="font-mono bg-muted px-2 rounded">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            {(summary.totalVolume > 0 || summary.totalArea > 0) && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-primary" />
                  {t('viewer.totals')}
                </h4>
                <div className="space-y-1">
                  {summary.totalVolume > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>{t('viewer.totalVolume')}</span>
                      <span className="font-mono bg-muted px-2 rounded">
                        {summary.totalVolume.toFixed(2)} m³
                      </span>
                    </div>
                  )}
                  {summary.totalArea > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>{t('viewer.totalArea')}</span>
                      <span className="font-mono bg-muted px-2 rounded">
                        {summary.totalArea.toFixed(2)} m²
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedElements.length > 0 && (
        <div className="p-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            {t('viewer.clickToInspect')}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default BIMInspector;
