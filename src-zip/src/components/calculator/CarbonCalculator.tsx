'use client';

/**
 * Carbon Calculator - Interactive Building Carbon Footprint Estimator
 *
 * Features:
 * - Building type and area input
 * - Material selection from Thai database
 * - Real-time carbon calculation
 * - Low-carbon alternatives with savings
 * - Visual emissions breakdown
 *
 * ★ Insight ─────────────────────────────────────
 * This calculator follows TGO (Thailand Greenhouse Gas Management
 * Organization) methodology for construction carbon accounting.
 * Results align with TREES certification requirements.
 * ─────────────────────────────────────────────────
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Calculator,
  Leaf,
  TrendingDown,
  Sparkles,
  ChevronRight,
  Info,
  RotateCcw,
  Download,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  THAI_MATERIALS,
  getMaterialsByCategory,
  getLowCarbonAlternative,
  calculateMaterialCarbon,
  type ThaiMaterial,
  type ThaiMaterialCategory,
} from '@/lib/carbon';
import { MaterialSelector } from './MaterialSelector';
import { EmissionsChart } from './EmissionsChart';
import { RecommendationsPanel } from './RecommendationsPanel';
import { useTranslation } from '@/i18n/provider';

// ============================================
// Types
// ============================================

export type BuildingType =
  | 'residential_house'
  | 'residential_condo'
  | 'office'
  | 'retail'
  | 'industrial'
  | 'hotel'
  | 'hospital'
  | 'school';

interface BuildingTypeOption {
  id: BuildingType;
  nameEn: string;
  nameTh: string;
  icon: string;
  defaultMaterials: MaterialQuantity[];
  benchmarkKgCO2ePerSqm: number;
}

interface MaterialQuantity {
  materialId: string;
  quantity: number;
  unit: string;
}

interface CalculationResult {
  totalEmissions: number;        // kgCO2e
  emissionsPerSqm: number;       // kgCO2e/m²
  breakdown: CategoryBreakdown[];
  optimizedEmissions: number;    // with low-carbon alternatives
  savingsPotential: number;      // percentage
  recommendations: Recommendation[];
  benchmark: BenchmarkComparison;
}

interface CategoryBreakdown {
  category: ThaiMaterialCategory;
  emissions: number;
  percentage: number;
  materials: MaterialEmission[];
}

interface MaterialEmission {
  material: ThaiMaterial;
  quantity: number;
  emissions: number;
  lowCarbonAlternative?: ThaiMaterial;
  potentialSavings?: number;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  savingsKgCO2e: number;
  savingsPercent: number;
  materialSwap?: {
    from: ThaiMaterial;
    to: ThaiMaterial;
  };
}

interface BenchmarkComparison {
  targetKgCO2ePerSqm: number;
  currentKgCO2ePerSqm: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  percentFromTarget: number;
}

// ============================================
// Building Type Presets
// ============================================

const BUILDING_TYPES: BuildingTypeOption[] = [
  {
    id: 'residential_house',
    nameEn: 'Residential House',
    nameTh: 'บ้านพักอาศัย',
    icon: '🏠',
    benchmarkKgCO2ePerSqm: 350,
    defaultMaterials: [
      { materialId: 'concrete_c25', quantity: 0.5, unit: 'm³/m²' },
      { materialId: 'steel_rebar_db12', quantity: 40, unit: 'kg/m²' },
      { materialId: 'masonry_clay_brick', quantity: 80, unit: 'kg/m²' },
      { materialId: 'roofing_metal_sheet', quantity: 1.2, unit: 'm²/m²' },
    ],
  },
  {
    id: 'residential_condo',
    nameEn: 'Condominium',
    nameTh: 'คอนโดมิเนียม',
    icon: '🏢',
    benchmarkKgCO2ePerSqm: 450,
    defaultMaterials: [
      { materialId: 'concrete_c30', quantity: 0.8, unit: 'm³/m²' },
      { materialId: 'steel_rebar_db16', quantity: 60, unit: 'kg/m²' },
      { materialId: 'masonry_aac_block', quantity: 50, unit: 'kg/m²' },
      { materialId: 'glass_float_clear', quantity: 0.3, unit: 'm²/m²' },
    ],
  },
  {
    id: 'office',
    nameEn: 'Office Building',
    nameTh: 'อาคารสำนักงาน',
    icon: '🏛️',
    benchmarkKgCO2ePerSqm: 500,
    defaultMaterials: [
      { materialId: 'concrete_c35', quantity: 0.9, unit: 'm³/m²' },
      { materialId: 'steel_structural_section', quantity: 80, unit: 'kg/m²' },
      { materialId: 'glass_low_e', quantity: 0.5, unit: 'm²/m²' },
      { materialId: 'finishes_ceiling_gypsum', quantity: 1.0, unit: 'm²/m²' },
    ],
  },
  {
    id: 'retail',
    nameEn: 'Retail/Commercial',
    nameTh: 'ห้างสรรพสินค้า',
    icon: '🏬',
    benchmarkKgCO2ePerSqm: 400,
    defaultMaterials: [
      { materialId: 'concrete_c30', quantity: 0.7, unit: 'm³/m²' },
      { materialId: 'steel_structural_section', quantity: 50, unit: 'kg/m²' },
      { materialId: 'finishes_floor_tile_ceramic', quantity: 1.0, unit: 'm²/m²' },
    ],
  },
  {
    id: 'industrial',
    nameEn: 'Industrial/Warehouse',
    nameTh: 'โรงงาน/คลังสินค้า',
    icon: '🏭',
    benchmarkKgCO2ePerSqm: 300,
    defaultMaterials: [
      { materialId: 'concrete_c25', quantity: 0.3, unit: 'm³/m²' },
      { materialId: 'steel_structural_section', quantity: 100, unit: 'kg/m²' },
      { materialId: 'roofing_metal_sheet', quantity: 1.5, unit: 'm²/m²' },
    ],
  },
  {
    id: 'hotel',
    nameEn: 'Hotel',
    nameTh: 'โรงแรม',
    icon: '🏨',
    benchmarkKgCO2ePerSqm: 550,
    defaultMaterials: [
      { materialId: 'concrete_c30', quantity: 0.8, unit: 'm³/m²' },
      { materialId: 'steel_rebar_db16', quantity: 55, unit: 'kg/m²' },
      { materialId: 'glass_float_clear', quantity: 0.4, unit: 'm²/m²' },
      { materialId: 'finishes_floor_tile_granite', quantity: 0.5, unit: 'm²/m²' },
    ],
  },
  {
    id: 'hospital',
    nameEn: 'Hospital/Healthcare',
    nameTh: 'โรงพยาบาล',
    icon: '🏥',
    benchmarkKgCO2ePerSqm: 600,
    defaultMaterials: [
      { materialId: 'concrete_c35', quantity: 1.0, unit: 'm³/m²' },
      { materialId: 'steel_rebar_db20', quantity: 70, unit: 'kg/m²' },
      { materialId: 'finishes_floor_tile_ceramic', quantity: 1.0, unit: 'm²/m²' },
    ],
  },
  {
    id: 'school',
    nameEn: 'School/Educational',
    nameTh: 'โรงเรียน',
    icon: '🏫',
    benchmarkKgCO2ePerSqm: 380,
    defaultMaterials: [
      { materialId: 'concrete_c25', quantity: 0.6, unit: 'm³/m²' },
      { materialId: 'steel_rebar_db12', quantity: 45, unit: 'kg/m²' },
      { materialId: 'masonry_concrete_block', quantity: 60, unit: 'kg/m²' },
    ],
  },
];

// ============================================
// Calculator Component
// ============================================

export interface CarbonCalculatorProps {
  className?: string;
  onCalculate?: (result: CalculationResult) => void;
}

export function CarbonCalculator({ className, onCalculate }: CarbonCalculatorProps) {
  const { t, locale } = useTranslation();

  // Form state
  const [buildingType, setBuildingType] = useState<BuildingType | null>(null);
  const [floorArea, setFloorArea] = useState<number>(0);
  const [floors, setFloors] = useState<number>(1);
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialQuantity[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Get building type config
  const selectedBuildingType = useMemo(
    () => BUILDING_TYPES.find((bt) => bt.id === buildingType),
    [buildingType]
  );

  // Total building area
  const totalArea = useMemo(() => floorArea * floors, [floorArea, floors]);

  // Initialize materials when building type changes
  const handleBuildingTypeSelect = useCallback((type: BuildingType) => {
    setBuildingType(type);
    const typeConfig = BUILDING_TYPES.find((bt) => bt.id === type);
    if (typeConfig) {
      setSelectedMaterials(typeConfig.defaultMaterials);
    }
    setStep(2);
  }, []);

  // Calculate emissions
  const calculateEmissions = useCallback(() => {
    if (!selectedBuildingType || totalArea <= 0) return;

    setIsCalculating(true);

    // Simulate calculation delay for UX
    setTimeout(() => {
      const categoryMap = new Map<ThaiMaterialCategory, MaterialEmission[]>();
      let totalEmissions = 0;
      let optimizedEmissions = 0;
      const recommendations: Recommendation[] = [];

      // Calculate emissions for each material
      selectedMaterials.forEach((mq) => {
        const material = THAI_MATERIALS[mq.materialId];
        if (!material) return;

        const actualQuantity = mq.quantity * totalArea;
        const emissionsResult = calculateMaterialCarbon(mq.materialId, actualQuantity);
        if (!emissionsResult) return;

        const emissions = emissionsResult.carbon;

        // Get low-carbon alternative
        const alternative = getLowCarbonAlternative(mq.materialId);
        let alternativeEmissionsValue = emissions;
        let potentialSavings = 0;

        if (alternative) {
          const altResult = calculateMaterialCarbon(alternative.id, actualQuantity);
          alternativeEmissionsValue = altResult ? altResult.carbon : emissions;
          potentialSavings = emissions - alternativeEmissionsValue;
          optimizedEmissions += alternativeEmissionsValue;

          // Add recommendation if savings significant
          if (potentialSavings > 100) {
            recommendations.push({
              priority: potentialSavings > 1000 ? 'high' : potentialSavings > 500 ? 'medium' : 'low',
              title: `Switch to ${alternative.nameEn}`,
              description: `Replace ${material.nameEn} with ${alternative.nameEn} to reduce carbon emissions.`,
              savingsKgCO2e: potentialSavings,
              savingsPercent: (potentialSavings / emissions) * 100,
              materialSwap: { from: material, to: alternative },
            });
          }
        } else {
          optimizedEmissions += emissions;
        }

        totalEmissions += emissions;

        // Add to category breakdown
        const categoryEmissions = categoryMap.get(material.category) || [];
        categoryEmissions.push({
          material,
          quantity: actualQuantity,
          emissions,
          lowCarbonAlternative: alternative || undefined,
          potentialSavings: potentialSavings > 0 ? potentialSavings : undefined,
        });
        categoryMap.set(material.category, categoryEmissions);
      });

      // Build breakdown array
      const breakdown: CategoryBreakdown[] = Array.from(categoryMap.entries()).map(
        ([category, materials]) => {
          const categoryTotal = materials.reduce((sum, m) => sum + m.emissions, 0);
          return {
            category,
            emissions: categoryTotal,
            percentage: (categoryTotal / totalEmissions) * 100,
            materials,
          };
        }
      );

      // Sort by emissions (highest first)
      breakdown.sort((a, b) => b.emissions - a.emissions);
      recommendations.sort((a, b) => b.savingsKgCO2e - a.savingsKgCO2e);

      // Calculate benchmark comparison
      const emissionsPerSqm = totalEmissions / totalArea;
      const targetKgCO2ePerSqm = selectedBuildingType.benchmarkKgCO2ePerSqm;
      const percentFromTarget = ((emissionsPerSqm - targetKgCO2ePerSqm) / targetKgCO2ePerSqm) * 100;

      let status: BenchmarkComparison['status'] = 'poor';
      if (percentFromTarget <= -20) status = 'excellent';
      else if (percentFromTarget <= 0) status = 'good';
      else if (percentFromTarget <= 20) status = 'fair';

      const calculationResult: CalculationResult = {
        totalEmissions,
        emissionsPerSqm,
        breakdown,
        optimizedEmissions,
        savingsPotential: ((totalEmissions - optimizedEmissions) / totalEmissions) * 100,
        recommendations: recommendations.slice(0, 5),
        benchmark: {
          targetKgCO2ePerSqm,
          currentKgCO2ePerSqm: emissionsPerSqm,
          status,
          percentFromTarget,
        },
      };

      setResult(calculationResult);
      setStep(3);
      setIsCalculating(false);
      onCalculate?.(calculationResult);
    }, 800);
  }, [selectedBuildingType, totalArea, selectedMaterials, onCalculate]);

  // Reset calculator
  const handleReset = useCallback(() => {
    setBuildingType(null);
    setFloorArea(0);
    setFloors(1);
    setSelectedMaterials([]);
    setResult(null);
    setStep(1);
  }, []);

  return (
    <div className={cn('w-full max-w-6xl mx-auto', className)}>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <motion.div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors',
                  step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
                animate={{ scale: step === s ? 1.1 : 1 }}
              >
                {s}
              </motion.div>
              {s < 3 && (
                <div
                  className={cn(
                    'w-16 h-1 mx-2 rounded transition-colors',
                    step > s ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-12 mt-2 text-sm text-muted-foreground">
          <span>{t('calculator.steps.building')}</span>
          <span>{t('calculator.steps.materials')}</span>
          <span>{t('calculator.steps.results')}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Building Type Selection */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">{t('calculator.building.selectTitle')}</h2>
              <p className="text-muted-foreground">
                {t('calculator.building.selectSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {BUILDING_TYPES.map((bt) => (
                <motion.button
                  key={bt.id}
                  onClick={() => handleBuildingTypeSelect(bt.id)}
                  className={cn(
                    'p-6 rounded-xl border-2 transition-all',
                    'hover:border-primary hover:shadow-lg hover:-translate-y-1',
                    buildingType === bt.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-4xl mb-3">{bt.icon}</div>
                  <div className="font-medium">{locale === 'th' ? bt.nameTh : bt.nameEn}</div>
                  <div className="text-sm text-muted-foreground">{locale === 'th' ? bt.nameEn : bt.nameTh}</div>
                  <div className="text-xs text-primary mt-2">
                    ~{bt.benchmarkKgCO2ePerSqm} kgCO₂e/m²
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Area & Materials */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {selectedBuildingType?.icon} {locale === 'th' ? selectedBuildingType?.nameTh : selectedBuildingType?.nameEn}
              </h2>
              <p className="text-muted-foreground">
                {t('calculator.building.customizeMaterials')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Building Dimensions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {t('calculator.building.dimensionsTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('calculator.building.area')}
                    </label>
                    <input
                      type="number"
                      value={floorArea || ''}
                      onChange={(e) => setFloorArea(Number(e.target.value))}
                      placeholder={t('calculator.building.areaPlaceholder')}
                      className={cn(
                        'w-full px-4 py-3 rounded-xl border bg-background',
                        'focus:outline-none focus:ring-2 focus:ring-primary',
                        'placeholder:text-muted-foreground'
                      )}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('calculator.building.floors')}
                    </label>
                    <input
                      type="number"
                      value={floors}
                      onChange={(e) => setFloors(Math.max(1, Number(e.target.value)))}
                      className={cn(
                        'w-full px-4 py-3 rounded-xl border bg-background',
                        'focus:outline-none focus:ring-2 focus:ring-primary'
                      )}
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="text-sm text-muted-foreground">{t('calculator.building.totalArea')}</div>
                    <div className="text-2xl font-bold text-primary">
                      {totalArea.toLocaleString()} {t('calculator.building.areaUnit')}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    {t('calculator.building.estimatedImpact')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl">
                    <div className="text-sm text-muted-foreground">
                      {t('calculator.building.estimatedEmissions')}
                    </div>
                    <div className="text-3xl font-bold">
                      {totalArea > 0
                        ? (
                            (selectedBuildingType?.benchmarkKgCO2ePerSqm || 400) * totalArea
                          ).toLocaleString()
                        : '—'}{' '}
                      <span className="text-lg font-normal">kgCO₂e</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t('calculator.building.basedOnBenchmark').replace('{benchmark}', String(selectedBuildingType?.benchmarkKgCO2ePerSqm || 400))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="w-4 h-4" />
                    <span>{t('calculator.building.customizeMaterials')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Material Selector */}
            <MaterialSelector
              selectedMaterials={selectedMaterials}
              onMaterialsChange={setSelectedMaterials}
              totalArea={totalArea}
            />

            {/* Actions */}
            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                {t('calculator.actions.back')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={calculateEmissions}
                disabled={totalArea <= 0 || selectedMaterials.length === 0}
                isLoading={isCalculating}
                glow
              >
                <Calculator className="w-5 h-5 mr-2" />
                {t('calculator.actions.calculate')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Results */}
        {step === 3 && result && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Results Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4"
              >
                <Sparkles className="w-5 h-5" />
                {t('calculator.results.analysisComplete')}
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">{t('calculator.results.footprintResults')}</h2>
              <p className="text-muted-foreground">
                {locale === 'th' ? selectedBuildingType?.nameTh : selectedBuildingType?.nameEn} • {totalArea.toLocaleString()} {t('calculator.building.areaUnit')}
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Total Emissions */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">
                    {t('calculator.results.totalEmissions')}
                  </div>
                  <div className="text-3xl font-bold">
                    {Math.round(result.totalEmissions).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">kgCO₂e</div>
                  <div className="mt-2 text-xs">
                    = {(result.totalEmissions / 1000).toFixed(1)} {t('calculator.results.tonnes')}
                  </div>
                </CardContent>
              </Card>

              {/* Emissions per m² */}
              <Card className={cn(
                'relative overflow-hidden',
                result.benchmark.status === 'excellent' && 'border-green-500',
                result.benchmark.status === 'good' && 'border-emerald-500',
                result.benchmark.status === 'fair' && 'border-yellow-500',
                result.benchmark.status === 'poor' && 'border-red-500'
              )}>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">
                    {t('calculator.results.carbonIntensity')}
                  </div>
                  <div className="text-3xl font-bold">
                    {Math.round(result.emissionsPerSqm)}
                  </div>
                  <div className="text-sm text-muted-foreground">kgCO₂e/{t('calculator.building.areaUnit')}</div>
                  <div className={cn(
                    'mt-2 text-xs font-medium',
                    result.benchmark.status === 'excellent' && 'text-green-600',
                    result.benchmark.status === 'good' && 'text-emerald-600',
                    result.benchmark.status === 'fair' && 'text-yellow-600',
                    result.benchmark.status === 'poor' && 'text-red-600'
                  )}>
                    {result.benchmark.percentFromTarget > 0 ? '+' : ''}
                    {result.benchmark.percentFromTarget.toFixed(0)}% {t('calculator.results.vsBenchmark')}
                  </div>
                </CardContent>
              </Card>

              {/* Savings Potential */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full" />
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 mb-1">
                    <Leaf className="w-4 h-4" />
                    {t('calculator.results.optimizationPotential')}
                  </div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                    -{result.savingsPotential.toFixed(0)}%
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-500">
                    {Math.round(result.totalEmissions - result.optimizedEmissions).toLocaleString()} kgCO₂e
                  </div>
                  <div className="mt-2 text-xs text-green-600/80 dark:text-green-500/80">
                    {t('calculator.results.usingLowCarbon')}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts & Recommendations */}
            <div className="grid lg:grid-cols-2 gap-6">
              <EmissionsChart breakdown={result.breakdown} />
              <RecommendationsPanel recommendations={result.recommendations} />
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('calculator.results.startOver')}
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary">
                  <Download className="w-4 h-4 mr-2" />
                  {t('calculator.results.exportReport')}
                </Button>
                <Button variant="primary" glow>
                  <Leaf className="w-4 h-4 mr-2" />
                  {t('calculator.results.applyOptimizations')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CarbonCalculator;
