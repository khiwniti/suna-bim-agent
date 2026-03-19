'use client';

/**
 * ThatOpenPropertiesPanel - Revit-style Property Panel
 *
 * Displays IFC element properties and carbon analysis data
 * when an element is selected in the 3D viewer
 */

import { useMemo, useState } from 'react';
import { useBIMStore } from '@/stores/bim-store';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import {
  X,
  ChevronDown,
  ChevronRight,
  Info,
  MapPin,
  Ruler,
  Leaf,
  Box,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface PropertySectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

interface PropertyRowProps {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  highlight?: boolean;
}

// ============================================
// Sub-components
// ============================================

function PropertySection({ title, icon, defaultOpen = true, children }: PropertySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted transition-colors"
      >
        {isOpen ? (
          <ChevronDown size={16} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={16} className="text-muted-foreground" />
        )}
        <span className="text-muted-foreground/80">{icon}</span>
        <span className="font-medium text-sm text-foreground">{title}</span>
      </button>
      {isOpen && <div className="px-4 pb-3 space-y-1">{children}</div>}
    </div>
  );
}

function PropertyRow({ label, value, unit, highlight }: PropertyRowProps) {
  if (value === null || value === undefined) return null;

  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div className="flex justify-between items-center py-1 text-sm">
      <span className="text-muted-foreground/80">{label}</span>
      <span className={cn('font-medium', highlight ? 'text-emerald-600' : 'text-foreground')}>
        {displayValue}
        {unit && <span className="text-muted-foreground ml-1">{unit}</span>}
      </span>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

interface ThatOpenPropertiesPanelProps {
  className?: string;
  onClose?: () => void;
}

export function ThatOpenPropertiesPanel({ className, onClose }: ThatOpenPropertiesPanelProps) {
  const { t } = useTranslation();
  const thatOpenSelection = useBIMStore((s) => s.thatOpenSelection);
  const fragmentsModels = useBIMStore((s) => s.fragmentsModels);
  const currentModel = useBIMStore((s) => s.currentModel);

  // Get selected element data
  const selectedElement = useMemo(() => {
    if (thatOpenSelection.expressIDs.length === 0) return null;

    const expressID = thatOpenSelection.expressIDs[0];

    // Try to find element in fragments models
    for (const [, modelData] of fragmentsModels) {
      const element = modelData.properties.elements.find((e) => e.expressID === expressID);
      if (element) return element;
    }

    // Fallback to BIM store current model
    if (currentModel?.elements) {
      return currentModel.elements.find((e) => e.globalId === String(expressID));
    }

    return null;
  }, [thatOpenSelection, fragmentsModels, currentModel]);

  // No selection state
  if (!selectedElement) {
    return (
      <div className={cn('bg-background border-l border-border w-80', className)}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">{t('viewer.properties')}</h3>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-muted rounded">
              <X size={18} className="text-muted-foreground/80" />
            </button>
          )}
        </div>
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <Box size={32} className="mb-2" />
          <p className="text-sm">{t('viewer.selectElement')}</p>
        </div>
      </div>
    );
  }

  // Get quantities with fallback
  const quantities = 'quantities' in selectedElement ? selectedElement.quantities : undefined;
  const material = 'material' in selectedElement ? selectedElement.material : undefined;
  const level = 'level' in selectedElement ? selectedElement.level : undefined;
  const expressID = 'expressID' in selectedElement ? selectedElement.expressID : undefined;
  const properties = 'properties' in selectedElement ? selectedElement.properties : {};

  // Calculate carbon data (mock for now)
  const carbonData = {
    material: material || 'Unknown',
    volume: quantities?.volume || 0,
    carbonFactor: 0.159, // kgCO2e/kg for concrete
    density: 2400, // kg/m³ for concrete
    embodiedCarbon: 0,
  };
  carbonData.embodiedCarbon = carbonData.volume * carbonData.density * carbonData.carbonFactor;

  return (
    <div className={cn('bg-background border-l border-border w-80 overflow-y-auto', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted">
        <div>
          <h3 className="font-semibold text-foreground">{selectedElement.name || 'Element'}</h3>
          <p className="text-xs text-muted-foreground/80">{selectedElement.type}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X size={18} className="text-muted-foreground/80" />
          </button>
        )}
      </div>

      {/* Identity Section */}
      <PropertySection title={t('viewer.identity')} icon={<Info size={14} />}>
        <PropertyRow label={t('viewer.name')} value={selectedElement.name} />
        <PropertyRow label={t('viewer.type')} value={selectedElement.type} />
        <PropertyRow label="GlobalId" value={selectedElement.globalId} />
        {expressID !== undefined && <PropertyRow label="ExpressID" value={expressID as number} />}
      </PropertySection>

      {/* Location Section */}
      <PropertySection title={t('viewer.location')} icon={<MapPin size={14} />}>
        <PropertyRow label={t('viewer.level')} value={level || 'N/A'} />
      </PropertySection>

      {/* Dimensions Section */}
      <PropertySection title={t('viewer.dimensions')} icon={<Ruler size={14} />}>
        <PropertyRow label={t('viewer.area')} value={quantities?.area?.toFixed(2)} unit="m²" />
        <PropertyRow label={t('viewer.volume')} value={quantities?.volume?.toFixed(3)} unit="m³" />
        <PropertyRow label={t('viewer.length')} value={quantities?.length?.toFixed(2)} unit="m" />
      </PropertySection>

      {/* Carbon Analysis Section */}
      <PropertySection title={t('viewer.carbonAnalysis')} icon={<Leaf size={14} />} defaultOpen={true}>
        <PropertyRow label={t('viewer.material')} value={carbonData.material} />
        <PropertyRow label={t('viewer.volume')} value={carbonData.volume.toFixed(3)} unit="m³" />
        <PropertyRow label={t('viewer.carbonFactor')} value={carbonData.carbonFactor} unit="kgCO₂e/kg" />
        <div className="mt-2 pt-2 border-t border-border">
          <PropertyRow
            label={t('viewer.embodiedCarbon')}
            value={carbonData.embodiedCarbon.toFixed(1)}
            unit="kgCO₂e"
            highlight
          />
        </div>
        <button className="mt-3 w-full px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
          {t('viewer.addToCarbonReport')}
        </button>
      </PropertySection>

      {/* Custom Properties */}
      {properties && Object.keys(properties).length > 0 && (
        <PropertySection title={t('viewer.properties')} icon={<Box size={14} />} defaultOpen={false}>
          {Object.entries(properties).map(([key, value]) => (
            <PropertyRow key={key} label={key} value={String(value)} />
          ))}
        </PropertySection>
      )}
    </div>
  );
}

export default ThatOpenPropertiesPanel;
