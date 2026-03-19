'use client';

/**
 * PropertiesPanel - BIM Element Properties Display
 *
 * Displays detailed property information for selected BIM elements:
 * - Identity data (GlobalId, Name, Type)
 * - Property Sets (Pset_*, Qto_*, custom)
 * - Material information
 * - Geometric quantities
 * - Classification references
 *
 * ★ Insight ─────────────────────────────────────
 * IFC property sets are organized hierarchically with Pset_ prefix
 * for property sets and Qto_ for quantity takeoffs. This panel
 * groups them accordingly for BIM professionals who expect this
 * organization pattern from Revit/Navisworks.
 * ─────────────────────────────────────────────────
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import {
  ChevronRight,
  Search,
  Copy,
  Check,
  Tag,
  Box,
  Layers,
  FileText,
  Hash,
  ToggleLeft,
  Type,
  Package,
  Ruler,
  Palette,
  Building2,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import type { BIMElement, BIMElementType } from '@/types/bim';
import type { PropertySet, MaterialInfo, ClassificationReference } from '@/lib/ifc';

// ============================================
// Types
// ============================================

export interface PropertiesPanelProps {
  /** Currently selected element(s) */
  elements?: BIMElement[];
  /** Detailed property sets (if available from extraction pipeline) */
  propertySets?: PropertySet[];
  /** Material information */
  materials?: MaterialInfo[];
  /** Classification references */
  classifications?: ClassificationReference[];
  /** Is panel loading data */
  isLoading?: boolean;
  /** Panel can be closed */
  closeable?: boolean;
  /** Close callback */
  onClose?: () => void;
  /** Click on element ID to select in viewer */
  onElementClick?: (elementId: string) => void;
  /** Click on classification to filter */
  onClassificationClick?: (code: string) => void;
  /** CSS class */
  className?: string;
}

interface PropertyGroup {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  properties: PropertyItem[];
  type: 'identity' | 'pset' | 'qto' | 'material' | 'classification' | 'custom';
}

interface PropertyItem {
  name: string;
  value: string | number | boolean | null | undefined;
  unit?: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'reference' | 'area' | 'volume' | 'length';
}

// ============================================
// Element Type Icons
// ============================================

const ELEMENT_TYPE_ICONS: Record<BIMElementType, React.ComponentType<{ className?: string }>> = {
  wall: Box,
  slab: Layers,
  roof: Building2,
  door: Box,
  window: Box,
  stair: Box,
  column: Box,
  beam: Box,
  furniture: Package,
  equipment: Package,
  space: Box,
  zone: Box,
  hvac: Package,
  pipe: Package,
  duct: Package,
  other: Box,
};

// ============================================
// Property Type Formatters
// ============================================

function formatPropertyValue(value: string | number | boolean | null | undefined, type: PropertyItem['type'], unit?: string): string {
  if (value === null || value === undefined) return '—';

  switch (type) {
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'number':
      if (typeof value === 'number') {
        return unit ? `${value.toLocaleString()} ${unit}` : value.toLocaleString();
      }
      return String(value);
    case 'area':
      if (typeof value === 'number') {
        return `${value.toFixed(2)} m²`;
      }
      return String(value);
    case 'volume':
      if (typeof value === 'number') {
        return `${value.toFixed(3)} m³`;
      }
      return String(value);
    case 'length':
      if (typeof value === 'number') {
        return `${value.toFixed(3)} m`;
      }
      return String(value);
    default:
      return String(value);
  }
}

function getPropertyType(value: unknown): PropertyItem['type'] {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  return 'string';
}

// ============================================
// PropertiesPanel Component
// ============================================

export function PropertiesPanel({
  elements = [],
  propertySets = [],
  materials = [],
  classifications = [],
  isLoading = false,
  closeable = true,
  onClose,
  className,
}: PropertiesPanelProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['identity']));
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  // Get the primary selected element
  const primaryElement = elements[0];

  // Build property groups from element data
  const propertyGroups = useMemo((): PropertyGroup[] => {
    if (!primaryElement) return [];

    const groups: PropertyGroup[] = [];

    // Identity group (always first)
    groups.push({
      id: 'identity',
      name: 'Identity',
      icon: Info,
      type: 'identity',
      properties: [
        { name: 'Global ID', value: primaryElement.globalId, type: 'string' as const },
        { name: 'Name', value: primaryElement.name, type: 'string' as const },
        { name: 'Type', value: primaryElement.type, type: 'string' as const },
        { name: 'Level', value: primaryElement.level, type: 'string' as const },
      ].filter(p => p.value !== undefined),
    });

    // Property sets from element.properties (grouped by prefix)
    if (primaryElement.properties) {
      const psetGroups = new Map<string, PropertyItem[]>();

      Object.entries(primaryElement.properties).forEach(([key, value]) => {
        const [prefix, ...rest] = key.split('.');
        const propName = rest.join('.') || prefix;
        const groupKey = rest.length > 0 ? prefix : 'Custom';

        if (!psetGroups.has(groupKey)) {
          psetGroups.set(groupKey, []);
        }

        psetGroups.get(groupKey)?.push({
          name: propName,
          value: value as string | number | boolean,
          type: getPropertyType(value),
        });
      });

      // Add Pset_ groups
      psetGroups.forEach((props, groupName) => {
        const isPset = groupName.startsWith('Pset_');
        const isQto = groupName.startsWith('Qto_');

        groups.push({
          id: groupName,
          name: groupName.replace('Pset_', '').replace('Qto_', ''),
          icon: isPset ? FileText : isQto ? Ruler : Tag,
          type: isPset ? 'pset' : isQto ? 'qto' : 'custom',
          properties: props,
        });
      });
    }

    // Detailed property sets from extraction pipeline
    propertySets.forEach((pset) => {
      // Avoid duplicates
      if (groups.some(g => g.name === pset.name)) return;

      const props: PropertyItem[] = pset.properties.map((prop) => ({
        name: prop.name,
        value: prop.value,
        unit: prop.unit,
        type: prop.type === 'IfcBoolean' ? 'boolean' as const :
              prop.type === 'IfcReal' || prop.type === 'IfcInteger' ? 'number' as const :
              prop.type === 'IfcAreaMeasure' ? 'area' as const :
              prop.type === 'IfcVolumeMeasure' ? 'volume' as const :
              prop.type === 'IfcLengthMeasure' ? 'length' as const : 'string' as const,
      }));

      const isPset = pset.name.startsWith('Pset_');
      const isQto = pset.name.startsWith('Qto_');

      groups.push({
        id: pset.name,
        name: pset.name.replace('Pset_', '').replace('Qto_', ''),
        icon: isPset ? FileText : isQto ? Ruler : Tag,
        type: isPset ? 'pset' : isQto ? 'qto' : 'custom',
        properties: props,
      });
    });

    // Materials
    if (materials.length > 0) {
      const materialProps: PropertyItem[] = materials.flatMap((mat, idx) => {
        const props: PropertyItem[] = [
          { name: `Material ${idx + 1}`, value: mat.name, type: 'string' as const },
        ];
        // Add total thickness if available
        if (mat.totalThickness) {
          props.push({ name: `Thickness ${idx + 1}`, value: mat.totalThickness, type: 'length' as const, unit: 'm' });
        }
        // Add layer info if available
        if (mat.layers && mat.layers.length > 0) {
          mat.layers.forEach((layer, layerIdx) => {
            props.push({ name: `Layer ${layerIdx + 1}`, value: layer.name, type: 'string' as const });
            props.push({ name: `Layer ${layerIdx + 1} Thickness`, value: layer.thickness, type: 'length' as const, unit: 'm' });
          });
        }
        // Add constituent info if available
        if (mat.constituents && mat.constituents.length > 0) {
          mat.constituents.forEach((constituent, constIdx) => {
            props.push({ name: `Constituent ${constIdx + 1}`, value: constituent.name, type: 'string' as const });
            props.push({ name: `Fraction ${constIdx + 1}`, value: `${(constituent.fraction * 100).toFixed(1)}%`, type: 'string' as const });
          });
        }
        return props;
      });

      if (materialProps.length > 0) {
        groups.push({
          id: 'materials',
          name: 'Materials',
          icon: Palette,
          type: 'material',
          properties: materialProps,
        });
      }
    }

    // Classifications
    if (classifications.length > 0) {
      const classProps: PropertyItem[] = classifications.map(cls => ({
        name: cls.system,
        value: `${cls.code}${cls.title ? ` - ${cls.title}` : ''}`,
        type: 'reference' as const,
      }));

      groups.push({
        id: 'classifications',
        name: 'Classifications',
        icon: Tag,
        type: 'classification',
        properties: classProps,
      });
    }

    return groups;
  }, [primaryElement, propertySets, materials, classifications]);

  // Filter properties by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return propertyGroups;

    const query = searchQuery.toLowerCase();
    return propertyGroups
      .map((group) => ({
        ...group,
        properties: group.properties.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            String(p.value).toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.properties.length > 0);
  }, [propertyGroups, searchQuery]);

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

  // Copy value to clipboard
  const copyValue = useCallback(async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    setTimeout(() => setCopiedValue(null), 2000);
  }, []);

  // Expand/collapse all
  const expandAll = useCallback(() => {
    setExpandedGroups(new Set(filteredGroups.map(g => g.id)));
  }, [filteredGroups]);

  const collapseAll = useCallback(() => {
    setExpandedGroups(new Set());
  }, []);

  // Get element icon
  const ElementIcon = primaryElement ? ELEMENT_TYPE_ICONS[primaryElement.type] || Box : Box;

  return (
    <div
      className={cn(
        'flex flex-col h-full',
        'bg-background',
        'border-l border-border',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <ElementIcon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {primaryElement?.name || t('propertiesPanel.properties')}
            </h3>
            {primaryElement && (
              <p className="text-xs text-muted-foreground capitalize">
                {primaryElement.type}
              </p>
            )}
          </div>
        </div>

        {closeable && onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted"
            aria-label={t('propertiesPanel.closeProperties')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Empty State */}
      {!primaryElement && !isLoading && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Box className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {t('propertiesPanel.selectElementToView')}
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t('propertiesPanel.loadingProperties')}</p>
          </div>
        </div>
      )}

      {/* Properties Content */}
      {primaryElement && !isLoading && (
        <>
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('propertiesPanel.searchProperties')}
                className={cn(
                  'w-full pl-9 pr-3 py-2 text-sm',
                  'bg-muted rounded-lg',
                  'border border-transparent',
                  'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary'
                )}
              />
            </div>

            {/* Expand/Collapse All */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={expandAll}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t('propertiesPanel.expandAll')}
              </button>
              <span className="text-muted-foreground">•</span>
              <button
                onClick={collapseAll}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t('propertiesPanel.collapseAll')}
              </button>
            </div>
          </div>

          {/* Property Groups */}
          <div className="flex-1 overflow-y-auto">
            {filteredGroups.map((group) => (
              <PropertyGroupComponent
                key={group.id}
                group={group}
                isExpanded={expandedGroups.has(group.id)}
                onToggle={() => toggleGroup(group.id)}
                onCopyValue={copyValue}
                copiedValue={copiedValue}
              />
            ))}

            {/* No results */}
            {searchQuery && filteredGroups.length === 0 && (
              <div className="p-6 text-center">
                <Search className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t('propertiesPanel.noPropertiesMatch', { query: searchQuery })}
                </p>
              </div>
            )}
          </div>

          {/* Multi-selection info */}
          {elements.length > 1 && (
            <div className="p-3 border-t border-border bg-amber-50 dark:bg-amber-950/20">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                {t('propertiesPanel.multiSelectionInfo', { count: elements.length })}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// Property Group Component
// ============================================

interface PropertyGroupComponentProps {
  group: PropertyGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onCopyValue: (value: string) => void;
  copiedValue: string | null;
}

function PropertyGroupComponent({
  group,
  isExpanded,
  onToggle,
  onCopyValue,
  copiedValue,
}: PropertyGroupComponentProps) {
  const Icon = group.icon;

  // Group header color based on type
  const headerColors = {
    identity: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900',
    pset: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900',
    qto: 'bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900',
    material: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900',
    classification: 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-100 dark:border-cyan-900',
    custom: 'bg-muted border-border',
  };

  return (
    <div className="border-b border-border">
      {/* Group Header */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2',
          'hover:bg-muted transition-colors',
          headerColors[group.type]
        )}
        aria-expanded={isExpanded}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.div>
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="flex-1 text-left text-sm font-medium">{group.name}</span>
        <span className="text-xs text-muted-foreground">
          {group.properties.length}
        </span>
      </button>

      {/* Group Properties */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border/50">
              {group.properties.map((prop, idx) => (
                <PropertyRow
                  key={`${prop.name}-${idx}`}
                  property={prop}
                  onCopy={onCopyValue}
                  isCopied={copiedValue === String(prop.value)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Property Row Component
// ============================================

interface PropertyRowProps {
  property: PropertyItem;
  onCopy: (value: string) => void;
  isCopied: boolean;
}

function PropertyRow({ property, onCopy, isCopied }: PropertyRowProps) {
  const { t } = useTranslation();
  const formattedValue = formatPropertyValue(property.value, property.type, property.unit);
  const canCopy = property.value !== null && property.value !== undefined;

  // Value type icon
  const ValueIcon = property.type === 'boolean' ? ToggleLeft :
                    property.type === 'number' || property.type === 'area' || property.type === 'volume' || property.type === 'length' ? Hash :
                    property.type === 'reference' ? ExternalLink : Type;

  return (
    <div className="flex items-center justify-between px-3 py-2 hover:bg-muted group">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <ValueIcon className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
        <span className="text-sm text-muted-foreground truncate">
          {property.name}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <span
          className={cn(
            'text-sm font-medium truncate max-w-[180px]',
            property.type === 'boolean' && property.value === true && 'text-green-600 dark:text-green-400',
            property.type === 'boolean' && property.value === false && 'text-red-600 dark:text-red-400'
          )}
          title={formattedValue}
        >
          {formattedValue}
        </span>

        {canCopy && (
          <button
            onClick={() => onCopy(String(property.value))}
            className={cn(
              'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:bg-muted'
            )}
            aria-label={t('propertiesPanel.copyValue')}
          >
            {isCopied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default PropertiesPanel;
