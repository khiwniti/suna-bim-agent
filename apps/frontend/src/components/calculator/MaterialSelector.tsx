'use client';

/**
 * MaterialSelector - Interactive material selection and quantity input
 *
 * Features:
 * - Searchable material list from Thai database
 * - Category filtering
 * - Quantity input with unit display
 * - Low-carbon badge indicators
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  X,
  Leaf,
  ChevronDown,
  Package,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  THAI_MATERIALS,
  getMaterialsByCategory,
  searchMaterials,
  type ThaiMaterial,
  type ThaiMaterialCategory,
} from '@/lib/carbon';
import { useTranslation } from '@/i18n/provider';

// ============================================
// Types
// ============================================

interface MaterialQuantity {
  materialId: string;
  quantity: number;
  unit: string;
}

interface MaterialSelectorProps {
  selectedMaterials: MaterialQuantity[];
  onMaterialsChange: (materials: MaterialQuantity[]) => void;
  totalArea: number;
  className?: string;
}

// ============================================
// Category Config
// ============================================

const CATEGORIES: { id: ThaiMaterialCategory; label: string; icon: string }[] = [
  { id: 'concrete', label: 'Concrete', icon: '🏗️' },
  { id: 'steel', label: 'Steel', icon: '🔩' },
  { id: 'masonry', label: 'Masonry', icon: '🧱' },
  { id: 'timber', label: 'Timber', icon: '🪵' },
  { id: 'glass', label: 'Glass', icon: '🪟' },
  { id: 'insulation', label: 'Insulation', icon: '🧊' },
  { id: 'finishes', label: 'Finishes', icon: '🎨' },
  { id: 'mep', label: 'MEP', icon: '⚡' },
  { id: 'roofing', label: 'Roofing', icon: '🏠' },
  { id: 'waterproofing', label: 'Waterproofing', icon: '💧' },
];

// ============================================
// Component
// ============================================

export function MaterialSelector({
  selectedMaterials,
  onMaterialsChange,
  totalArea,
  className,
}: MaterialSelectorProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ThaiMaterialCategory | 'all'>('all');
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Filter materials based on search and category
  const filteredMaterials = useMemo(() => {
    let materials: ThaiMaterial[];

    if (searchQuery.trim()) {
      materials = searchMaterials(searchQuery);
    } else if (activeCategory === 'all') {
      materials = Object.values(THAI_MATERIALS);
    } else {
      materials = getMaterialsByCategory(activeCategory);
    }

    // Exclude already selected materials
    const selectedIds = new Set(selectedMaterials.map((m) => m.materialId));
    return materials.filter((m) => !selectedIds.has(m.id));
  }, [searchQuery, activeCategory, selectedMaterials]);

  // Add material
  const handleAddMaterial = useCallback(
    (material: ThaiMaterial) => {
      const newMaterial: MaterialQuantity = {
        materialId: material.id,
        quantity: 1,
        unit: `${material.unit}/m²`,
      };
      onMaterialsChange([...selectedMaterials, newMaterial]);
    },
    [selectedMaterials, onMaterialsChange]
  );

  // Remove material
  const handleRemoveMaterial = useCallback(
    (materialId: string) => {
      onMaterialsChange(selectedMaterials.filter((m) => m.materialId !== materialId));
    },
    [selectedMaterials, onMaterialsChange]
  );

  // Update quantity
  const handleQuantityChange = useCallback(
    (materialId: string, quantity: number) => {
      onMaterialsChange(
        selectedMaterials.map((m) =>
          m.materialId === materialId ? { ...m, quantity: Math.max(0, quantity) } : m
        )
      );
    },
    [selectedMaterials, onMaterialsChange]
  );

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {t('materialSelector.materialsCount', { count: selectedMaterials.length })}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddPanel(!showAddPanel)}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('materialSelector.addMaterial')}
            <ChevronDown
              className={cn(
                'w-4 h-4 ml-1 transition-transform',
                showAddPanel && 'rotate-180'
              )}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add Material Panel */}
        <AnimatePresence>
          {showAddPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-muted/50 rounded-xl space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('materialSelector.searchMaterials')}
                    className={cn(
                      'w-full pl-10 pr-4 py-2 rounded-lg border bg-background',
                      'focus:outline-none focus:ring-2 focus:ring-primary'
                    )}
                  />
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-colors',
                      activeCategory === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {t('common.all')}
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1',
                        activeCategory === cat.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      <span>{cat.icon}</span>
                      <span className="hidden sm:inline">{t(`materialSelector.categories.${cat.id}`)}</span>
                    </button>
                  ))}
                </div>

                {/* Material List */}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredMaterials.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('materialSelector.noMaterialsFound')}
                    </div>
                  ) : (
                    filteredMaterials.slice(0, 20).map((material) => (
                      <motion.button
                        key={material.id}
                        onClick={() => handleAddMaterial(material)}
                        className={cn(
                          'w-full p-3 rounded-lg border bg-background text-left',
                          'hover:border-primary hover:shadow-sm transition-all',
                          'flex items-center justify-between gap-4'
                        )}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {material.nameEn}
                            </span>
                            {material.lowCarbonAlternativeId && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                                <Leaf className="w-3 h-3" />
                                {t('materialSelector.lowCarbon')}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {material.nameTh}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-semibold text-primary">
                            {material.emissionFactor}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            kgCO₂e/{material.unit}
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-muted-foreground" />
                      </motion.button>
                    ))
                  )}
                  {filteredMaterials.length > 20 && (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      {t('materialSelector.moreMaterials', { count: filteredMaterials.length - 20 })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Materials List */}
        <div className="space-y-2">
          {selectedMaterials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{t('materialSelector.noMaterialsSelected')}</p>
              <p className="text-sm">{t('materialSelector.clickToGetStarted')}</p>
            </div>
          ) : (
            selectedMaterials.map((mq) => {
              const material = THAI_MATERIALS[mq.materialId];
              if (!material) return null;

              const totalQuantity = mq.quantity * totalArea;
              const emissions = material.emissionFactor * totalQuantity;

              return (
                <motion.div
                  key={mq.materialId}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    'p-4 rounded-xl border bg-card',
                    'flex flex-col sm:flex-row sm:items-center gap-4'
                  )}
                >
                  {/* Material Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{material.nameEn}</span>
                      {material.carbonReductionPotential && (
                        <span
                          className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs"
                          title={`${material.carbonReductionPotential}% reduction available`}
                        >
                          <Leaf className="w-3 h-3" />
                          -{material.carbonReductionPotential}%
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>{material.source}</span>
                      <span>•</span>
                      <span>{material.emissionFactor} kgCO₂e/{material.unit}</span>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={mq.quantity}
                        onChange={(e) =>
                          handleQuantityChange(mq.materialId, Number(e.target.value))
                        }
                        className={cn(
                          'w-20 px-3 py-2 rounded-lg border bg-background text-right',
                          'focus:outline-none focus:ring-2 focus:ring-primary'
                        )}
                        min={0}
                        step={0.1}
                      />
                      <span className="text-sm text-muted-foreground w-16">
                        {mq.unit}
                      </span>
                    </div>

                    {/* Emissions */}
                    <div className="text-right min-w-24">
                      <div className="font-semibold text-primary">
                        {emissions > 1000
                          ? `${(emissions / 1000).toFixed(1)}t`
                          : `${Math.round(emissions)}`}
                      </div>
                      <div className="text-xs text-muted-foreground">kgCO₂e</div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveMaterial(mq.materialId)}
                      className={cn(
                        'p-2 rounded-lg text-muted-foreground',
                        'hover:bg-destructive/10 hover:text-destructive transition-colors'
                      )}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Info Note */}
        {selectedMaterials.length > 0 && totalArea > 0 && (
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              {t('materialSelector.quantityNote', { area: totalArea.toLocaleString() })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MaterialSelector;
