'use client';

/**
 * Material Browser Component
 *
 * Searchable, filterable UI for browsing the Thai construction material database.
 * Displays emission factors, sources, and low-carbon alternatives.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Building2,
  Layers,
  Leaf,
  Package,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  ArrowRight,
  Sparkles,
  Factory,
  TreeDeciduous,
  Droplets,
  Zap,
  HardHat,
  PanelTop,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  THAI_MATERIALS,
  getMaterialsByCategory,
  searchMaterials,
  getLowCarbonAlternative,
  type ThaiMaterial,
  type ThaiMaterialCategory,
} from '@/lib/carbon/thai-materials';
import { useTranslation } from '@/i18n/provider';

// ============================================
// Category Configuration
// ============================================

interface CategoryInfo {
  label: string;
  labelTh: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const CATEGORY_CONFIG: Record<ThaiMaterialCategory, CategoryInfo> = {
  concrete: {
    label: 'Concrete',
    labelTh: 'คอนกรีต',
    icon: Building2,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/10',
  },
  steel: {
    label: 'Steel & Metal',
    labelTh: 'เหล็กและโลหะ',
    icon: Factory,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  masonry: {
    label: 'Masonry & Brick',
    labelTh: 'งานก่ออิฐ',
    icon: Layers,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  timber: {
    label: 'Timber & Wood',
    labelTh: 'ไม้',
    icon: TreeDeciduous,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  glass: {
    label: 'Glass & Glazing',
    labelTh: 'กระจก',
    icon: PanelTop,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  insulation: {
    label: 'Insulation',
    labelTh: 'ฉนวน',
    icon: Sparkles,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  finishes: {
    label: 'Finishes',
    labelTh: 'วัสดุตกแต่ง',
    icon: Package,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  mep: {
    label: 'MEP Systems',
    labelTh: 'ระบบ MEP',
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  roofing: {
    label: 'Roofing',
    labelTh: 'หลังคา',
    icon: HardHat,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  waterproofing: {
    label: 'Waterproofing',
    labelTh: 'กันซึม',
    icon: Droplets,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
};

// ============================================
// Props & Types
// ============================================

interface MaterialBrowserProps {
  onSelectMaterial?: (material: ThaiMaterial) => void;
  selectedMaterials?: Set<string>;
  showLowCarbonAlternatives?: boolean;
  className?: string;
  mode?: 'browse' | 'select';
}

// ============================================
// Component
// ============================================

export function MaterialBrowser({
  onSelectMaterial,
  selectedMaterials = new Set(),
  showLowCarbonAlternatives = true,
  className = '',
  mode = 'browse',
}: MaterialBrowserProps) {
  const { t, locale } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ThaiMaterialCategory | 'all'>('all');
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'emission' | 'category'>('category');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  // Get all materials as array
  const allMaterials = useMemo(() => Object.values(THAI_MATERIALS), []);

  // Filter and sort materials
  const filteredMaterials = useMemo(() => {
    let materials = allMaterials;

    // Filter by search query
    if (searchQuery.trim()) {
      materials = searchMaterials(searchQuery);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      materials = materials.filter(m => m.category === selectedCategory);
    }

    // Sort
    materials.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.nameEn.localeCompare(b.nameEn);
          break;
        case 'emission':
          comparison = a.emissionFactor - b.emissionFactor;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return materials;
  }, [allMaterials, searchQuery, selectedCategory, sortBy, sortOrder]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allMaterials.length };
    for (const category of Object.keys(CATEGORY_CONFIG)) {
      counts[category] = getMaterialsByCategory(category as ThaiMaterialCategory).length;
    }
    return counts;
  }, [allMaterials]);

  // Handle material click
  const handleMaterialClick = useCallback((material: ThaiMaterial) => {
    if (mode === 'select' && onSelectMaterial) {
      onSelectMaterial(material);
    } else {
      setExpandedMaterial(expandedMaterial === material.id ? null : material.id);
    }
  }, [mode, onSelectMaterial, expandedMaterial]);

  // Format emission factor with unit
  const formatEmission = (material: ThaiMaterial) => {
    return `${material.emissionFactor.toLocaleString('th-TH')} kgCO₂e/${material.unit}`;
  };

  // Get data quality badge
  const getQualityBadge = (quality: string) => {
    const colors: Record<string, string> = {
      excellent: 'bg-emerald-500/20 text-emerald-400',
      good: 'bg-blue-500/20 text-blue-400',
      fair: 'bg-yellow-500/20 text-yellow-400',
      poor: 'bg-orange-500/20 text-orange-400',
      estimated: 'bg-muted/20 text-muted-foreground',
    };
    return colors[quality] || colors.estimated;
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{t('calculator.materialBrowser.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {filteredMaterials.length} / {allMaterials.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {t('calculator.materialBrowser.filters')}
            {showFilters ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('calculator.materialBrowser.searchPlaceholder')}
            className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('calculator.materialBrowser.sortBy')}:</span>
                  <div className="flex gap-2">
                    {[
                      { value: 'category', labelKey: 'calculator.materialBrowser.sortCategory' },
                      { value: 'name', labelKey: 'calculator.materialBrowser.sortName' },
                      { value: 'emission', labelKey: 'calculator.materialBrowser.sortEmission' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          if (sortBy === option.value) {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy(option.value as typeof sortBy);
                            setSortOrder('asc');
                          }
                        }}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          sortBy === option.value
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                        }`}
                      >
                        {t(option.labelKey)}
                        {sortBy === option.value && (
                          <span className="ml-1">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto py-3 px-4 gap-2 border-b border-white/10 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-emerald-500 text-white'
              : 'bg-white/5 text-muted-foreground hover:bg-white/10'
          }`}
        >
          {t('calculator.materialBrowser.allCategories')} ({categoryCounts.all})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as ThaiMaterialCategory)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === key
                  ? `${config.bgColor} ${config.color}`
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{locale === 'th' ? config.labelTh : config.label}</span>
              <span className="opacity-60">({categoryCounts[key] || 0})</span>
            </button>
          );
        })}
      </div>

      {/* Material List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredMaterials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">{t('calculator.materialBrowser.noMaterialsFound')}</p>
            <p className="text-sm">{t('calculator.materialBrowser.tryAdjusting')}</p>
          </div>
        ) : (
          filteredMaterials.map((material, index) => {
            const config = CATEGORY_CONFIG[material.category];
            const Icon = config.icon;
            const isExpanded = expandedMaterial === material.id;
            const isSelected = selectedMaterials.has(material.id);
            const alternative = showLowCarbonAlternatives && material.lowCarbonAlternativeId
              ? getLowCarbonAlternative(material.id)
              : null;

            return (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.5) }}
                className={`glass-strong rounded-lg overflow-hidden transition-all ${
                  isSelected ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                {/* Material Header */}
                <button
                  onClick={() => handleMaterialClick(material)}
                  className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white truncate">
                          {locale === 'th' ? material.nameTh : material.nameEn}
                        </h3>
                        {material.locallyAvailable && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded">
                            {t('calculator.materialBrowser.local')}
                          </span>
                        )}
                        {alternative && (
                          <Leaf className="h-3.5 w-3.5 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {locale === 'th' ? material.nameEn : material.nameTh}
                      </p>

                      {/* Emission & Source */}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-emerald-400 font-mono text-sm">
                          {formatEmission(material)}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] rounded-full ${getQualityBadge(material.dataQuality)}`}>
                          {material.source}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center">
                      {mode === 'select' ? (
                        <div className={`p-1.5 rounded-full transition-colors ${
                          isSelected
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white/10 text-muted-foreground'
                        }`}>
                          <Plus className="h-4 w-4" />
                        </div>
                      ) : (
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 space-y-4 border-t border-white/10">
                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground mb-1">{t('calculator.materialBrowser.emissionFactor')}</div>
                            <div className="font-mono text-emerald-400">
                              {formatEmission(material)}
                            </div>
                          </div>
                          {material.density && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-xs text-muted-foreground mb-1">{t('calculator.materialBrowser.density')}</div>
                              <div className="font-mono text-white">
                                {material.density.toLocaleString()} kg/m³
                              </div>
                            </div>
                          )}
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground mb-1">{t('calculator.materialBrowser.source')}</div>
                            <div className="text-white text-sm">
                              {material.source} ({material.sourceYear || 'N/A'})
                            </div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground mb-1">{t('calculator.materialBrowser.dataQuality')}</div>
                            <div className={`inline-flex px-2 py-0.5 text-xs rounded-full ${getQualityBadge(material.dataQuality)}`}>
                              {t(`calculator.materialBrowser.quality.${material.dataQuality}`)}
                            </div>
                          </div>
                        </div>

                        {/* Source Reference */}
                        {material.sourceReference && (
                          <div className="flex items-start gap-2 text-sm">
                            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-muted-foreground">{material.sourceReference}</span>
                          </div>
                        )}

                        {/* Low Carbon Alternative */}
                        {alternative && (
                          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-2">
                              <Leaf className="h-4 w-4" />
                              {t('calculator.materialBrowser.lowCarbonAlt')}
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-white text-sm">{locale === 'th' ? alternative.nameTh : alternative.nameEn}</div>
                                <div className="text-muted-foreground text-xs">{locale === 'th' ? alternative.nameEn : alternative.nameTh}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-green-400 font-mono text-sm">
                                  -{material.carbonReductionPotential}%
                                </span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {material.tags && material.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {material.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 text-xs bg-white/5 text-muted-foreground rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Select Button */}
                        {mode === 'browse' && onSelectMaterial && (
                          <Button
                            onClick={() => onSelectMaterial(material)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('calculator.materialBrowser.addToCalculator')}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-3 border-t border-white/10 bg-black/20">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {t('calculator.materialBrowser.dataSources')}: TGO, MTEC, SCG EPD, CPAC EPD, TGBI
          </span>
          <span>
            {t('calculator.materialBrowser.lastUpdated')}: 2024
          </span>
        </div>
      </div>
    </div>
  );
}

export default MaterialBrowser;
