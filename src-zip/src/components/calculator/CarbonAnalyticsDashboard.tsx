/**
 * Carbon Analytics Dashboard
 *
 * Comprehensive dashboard for carbon footprint visualization and analysis.
 * Displays total carbon, benchmarks, savings potential, and breakdowns.
 *
 * ★ Insight ─────────────────────────────────────
 * This dashboard follows the TREES (Thai's Rating of Energy and
 * Environmental Sustainability) visualization standards and provides
 * actionable insights for carbon reduction in construction projects.
 * ─────────────────────────────────────────────────
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Leaf,
  Target,
  Building2,
  Layers,
  ArrowRight,
  Info,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ThaiMaterialCategory } from '@/lib/carbon';
import type { QuickCarbonEstimate, MaterialSummaryItem } from '@/hooks/useIFCCalculatorIntegration';

// ============================================
// Types
// ============================================

export interface CarbonAnalyticsDashboardProps {
  /** Project name */
  projectName?: string;
  /** Total carbon (kgCO2e) */
  totalCarbon: number;
  /** Carbon intensity (kgCO2e/m²) */
  carbonIntensity: number;
  /** Total floor area (m²) */
  floorArea: number;
  /** Breakdown by category */
  categoryBreakdown: Record<string, number>;
  /** Material summary items */
  materialSummary?: MaterialSummaryItem[];
  /** Potential savings with low-carbon alternatives */
  potentialSavings: number;
  /** Confidence level (0-1) */
  confidence: number;
  /** Building type for benchmarking */
  buildingType?: 'residential' | 'office' | 'retail' | 'industrial' | 'mixed';
  /** Whether data is from IFC model */
  isFromIFC?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Actions */
  onExportReport?: () => void;
  onRefresh?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

// ============================================
// Benchmark Data
// ============================================

const CARBON_BENCHMARKS: Record<string, { excellent: number; good: number; fair: number }> = {
  residential: { excellent: 300, good: 400, fair: 500 },
  office: { excellent: 350, good: 450, fair: 550 },
  retail: { excellent: 400, good: 500, fair: 600 },
  industrial: { excellent: 300, good: 400, fair: 500 },
  mixed: { excellent: 350, good: 450, fair: 550 },
};

const CATEGORY_CONFIG: Record<string, { color: string; icon: string; label: string; labelTh: string }> = {
  concrete: { color: 'bg-slate-500', icon: '🏗️', label: 'Concrete', labelTh: 'คอนกรีต' },
  steel: { color: 'bg-blue-500', icon: '🔩', label: 'Steel', labelTh: 'เหล็ก' },
  masonry: { color: 'bg-orange-500', icon: '🧱', label: 'Masonry', labelTh: 'งานก่อ' },
  timber: { color: 'bg-amber-600', icon: '🪵', label: 'Timber', labelTh: 'ไม้' },
  glass: { color: 'bg-cyan-500', icon: '🪟', label: 'Glass', labelTh: 'กระจก' },
  insulation: { color: 'bg-purple-500', icon: '🧊', label: 'Insulation', labelTh: 'ฉนวน' },
  finishes: { color: 'bg-pink-500', icon: '🎨', label: 'Finishes', labelTh: 'วัสดุตกแต่ง' },
  mep: { color: 'bg-yellow-500', icon: '⚡', label: 'MEP', labelTh: 'งานระบบ' },
  roofing: { color: 'bg-red-500', icon: '🏠', label: 'Roofing', labelTh: 'หลังคา' },
  waterproofing: { color: 'bg-teal-500', icon: '💧', label: 'Waterproofing', labelTh: 'กันซึม' },
};

// ============================================
// Helper Functions
// ============================================

function formatCarbon(kg: number): string {
  if (kg >= 1000000) return `${(kg / 1000000).toFixed(1)}M`;
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}`;
}

function getRating(intensity: number, buildingType: string): {
  status: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
  bgColor: string;
  icon: React.ReactNode;
} {
  const benchmarks = CARBON_BENCHMARKS[buildingType] || CARBON_BENCHMARKS.mixed;

  if (intensity <= benchmarks.excellent) {
    return {
      status: 'excellent',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      icon: <CheckCircle2 className="w-5 h-5" />,
    };
  }
  if (intensity <= benchmarks.good) {
    return {
      status: 'good',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      icon: <CheckCircle2 className="w-5 h-5" />,
    };
  }
  if (intensity <= benchmarks.fair) {
    return {
      status: 'fair',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      icon: <AlertTriangle className="w-5 h-5" />,
    };
  }
  return {
    status: 'poor',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    icon: <XCircle className="w-5 h-5" />,
  };
}

// ============================================
// Sub-Components
// ============================================

function MetricCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  className,
  highlight,
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={cn('relative overflow-hidden', highlight && 'ring-2 ring-emerald-500/50', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{value}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {trend && trendValue && (
              <div className={cn(
                'flex items-center gap-1 text-xs',
                trend === 'down' ? 'text-emerald-500' : trend === 'up' ? 'text-red-500' : 'text-muted-foreground'
              )}>
                {trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className="p-2 rounded-lg bg-muted">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryBar({
  category,
  emissions,
  percentage,
  maxEmissions,
  index,
}: {
  category: string;
  emissions: number;
  percentage: number;
  maxEmissions: number;
  index: number;
}) {
  const config = CATEGORY_CONFIG[category] || {
    color: 'bg-muted',
    icon: '📦',
    label: category,
    labelTh: category,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="space-y-1"
    >
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span>{config.icon}</span>
          <span className="font-medium">{config.label}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{formatCarbon(emissions)} kgCO₂e</span>
          <span className="w-10 text-right font-medium text-foreground">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="h-4 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', config.color)}
          initial={{ width: 0 }}
          animate={{ width: `${(emissions / maxEmissions) * 100}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: index * 0.05 }}
        />
      </div>
    </motion.div>
  );
}

function BenchmarkGauge({
  intensity,
  buildingType,
  className,
}: {
  intensity: number;
  buildingType: string;
  className?: string;
}) {
  const benchmarks = CARBON_BENCHMARKS[buildingType] || CARBON_BENCHMARKS.mixed;
  const maxValue = benchmarks.fair * 1.5;
  const position = Math.min((intensity / maxValue) * 100, 100);
  const rating = getRating(intensity, buildingType);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Carbon Intensity</span>
        <span className={cn('font-bold flex items-center gap-1', rating.color)}>
          {rating.icon}
          {rating.status.charAt(0).toUpperCase() + rating.status.slice(1)}
        </span>
      </div>

      {/* Gauge */}
      <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500">
        <motion.div
          className="absolute top-0 h-full w-1 bg-white shadow-lg"
          initial={{ left: 0 }}
          animate={{ left: `${position}%` }}
          transition={{ type: 'spring', damping: 20 }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Excellent</span>
        <span>Good</span>
        <span>Fair</span>
        <span>Poor</span>
      </div>

      {/* Benchmark targets */}
      <div className="flex justify-between text-xs">
        <span className="text-emerald-500">&lt;{benchmarks.excellent}</span>
        <span className="text-green-500">&lt;{benchmarks.good}</span>
        <span className="text-yellow-500">&lt;{benchmarks.fair}</span>
        <span className="text-red-500">&gt;{benchmarks.fair}</span>
      </div>
    </div>
  );
}

function SavingsCard({
  currentCarbon,
  potentialSavings,
  className,
}: {
  currentCarbon: number;
  potentialSavings: number;
  className?: string;
}) {
  const savingsPercent = currentCarbon > 0 ? (potentialSavings / currentCarbon) * 100 : 0;
  const optimizedCarbon = currentCarbon - potentialSavings;

  return (
    <Card className={cn('overflow-hidden border-emerald-500/30', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-emerald-500">
          <Leaf className="w-5 h-5" />
          Low-Carbon Optimization
        </CardTitle>
        <CardDescription>
          Potential savings with sustainable alternatives
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Current</p>
            <p className="text-xl font-bold">{formatCarbon(currentCarbon)} t</p>
          </div>
          <ArrowRight className="w-5 h-5 text-emerald-500" />
          <div className="space-y-1 text-right">
            <p className="text-sm text-muted-foreground">Optimized</p>
            <p className="text-xl font-bold text-emerald-500">{formatCarbon(optimizedCarbon)} t</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Potential Reduction</span>
            <span className="text-lg font-bold text-emerald-500">
              -{savingsPercent.toFixed(0)}% ({formatCarbon(potentialSavings)} kgCO₂e)
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Based on switching to low-carbon alternatives available in Thailand.
          Includes SCG Green Cement, recycled steel, and AAC blocks.
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Component
// ============================================

export function CarbonAnalyticsDashboard({
  projectName,
  totalCarbon,
  carbonIntensity,
  floorArea,
  categoryBreakdown,
  materialSummary,
  potentialSavings,
  confidence,
  buildingType = 'mixed',
  isFromIFC = false,
  isLoading = false,
  onExportReport,
  onRefresh,
  onViewDetails,
  className,
}: CarbonAnalyticsDashboardProps) {
  const [showMaterials, setShowMaterials] = useState(false);

  // Process category breakdown
  const sortedCategories = useMemo(() => {
    const entries = Object.entries(categoryBreakdown);
    const total = entries.reduce((sum, [, val]) => sum + val, 0);

    return entries
      .filter(([, val]) => val > 0)
      .map(([category, emissions]) => ({
        category,
        emissions,
        percentage: total > 0 ? (emissions / total) * 100 : 0,
      }))
      .sort((a, b) => b.emissions - a.emissions);
  }, [categoryBreakdown]);

  const maxEmissions = sortedCategories[0]?.emissions || 1;
  const totalCategories = sortedCategories.length;

  // Rating
  const rating = getRating(carbonIntensity, buildingType);

  // Confidence display
  const confidenceColor = confidence >= 0.7 ? 'text-emerald-500' : confidence >= 0.5 ? 'text-yellow-500' : 'text-red-500';

  return (
    <TooltipProvider>
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Carbon Analytics</h2>
            {projectName && (
              <p className="text-muted-foreground">{projectName}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isFromIFC && (
              <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                IFC Model
              </span>
            )}
            <Tooltip>
              <TooltipTrigger>
                <span className={cn('px-2 py-1 text-xs rounded-full border', confidenceColor)}>
                  {(confidence * 100).toFixed(0)}% confidence
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Material mapping confidence level</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Embodied Carbon"
            value={formatCarbon(totalCarbon)}
            unit="kgCO₂e"
            icon={<BarChart3 className="w-5 h-5 text-muted-foreground" />}
            highlight
          />
          <MetricCard
            title="Carbon Intensity"
            value={carbonIntensity.toFixed(0)}
            unit="kgCO₂e/m²"
            icon={<Target className="w-5 h-5 text-muted-foreground" />}
          />
          <MetricCard
            title="Floor Area"
            value={floorArea.toLocaleString()}
            unit="m²"
            icon={<Building2 className="w-5 h-5 text-muted-foreground" />}
          />
          <MetricCard
            title="Material Categories"
            value={totalCategories}
            unit="types"
            icon={<Layers className="w-5 h-5 text-muted-foreground" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Emissions by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AnimatePresence>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="space-y-1 animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-4 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : sortedCategories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No emission data available
                  </div>
                ) : (
                  sortedCategories.map((cat, index) => (
                    <CategoryBar
                      key={cat.category}
                      category={cat.category}
                      emissions={cat.emissions}
                      percentage={cat.percentage}
                      maxEmissions={maxEmissions}
                      index={index}
                    />
                  ))
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Benchmark Gauge */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                TREES Benchmark
              </CardTitle>
              <CardDescription>
                Compared to {buildingType} building standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BenchmarkGauge
                intensity={carbonIntensity}
                buildingType={buildingType}
              />

              <div className={cn(
                'mt-4 p-3 rounded-lg border',
                rating.bgColor,
                rating.color.replace('text-', 'border-')
              )}>
                <div className="flex items-center gap-2">
                  {rating.icon}
                  <div>
                    <p className="font-medium">
                      {rating.status === 'excellent' && 'Excellent Performance'}
                      {rating.status === 'good' && 'Good Performance'}
                      {rating.status === 'fair' && 'Fair Performance'}
                      {rating.status === 'poor' && 'Needs Improvement'}
                    </p>
                    <p className="text-xs opacity-80">
                      {carbonIntensity.toFixed(0)} kgCO₂e/m²
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Savings Potential */}
        {potentialSavings > 0 && (
          <SavingsCard
            currentCarbon={totalCarbon}
            potentialSavings={potentialSavings}
          />
        )}

        {/* Material Summary (Collapsible) */}
        {materialSummary && materialSummary.length > 0 && (
          <Card>
            <CardHeader
              className="cursor-pointer"
              onClick={() => setShowMaterials(!showMaterials)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Material Mapping
                  <span className="text-sm font-normal text-muted-foreground">
                    ({materialSummary.length} materials)
                  </span>
                </CardTitle>
                {showMaterials ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
            <AnimatePresence>
              {showMaterials && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {materialSummary.slice(0, 10).map((item, index) => (
                        <div
                          key={item.ifcMaterial || index}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {item.thaiMaterial.nameEn}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.ifcMaterial || 'Default mapping'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">
                              {item.elementCount} elements
                            </span>
                            <span className={cn(
                              'px-2 py-0.5 rounded text-xs',
                              item.confidence >= 0.7 ? 'bg-emerald-500/10 text-emerald-500' :
                              item.confidence >= 0.5 ? 'bg-yellow-500/10 text-yellow-500' :
                              'bg-red-500/10 text-red-500'
                            )}>
                              {(item.confidence * 100).toFixed(0)}%
                            </span>
                            {item.hasAlternative && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Leaf className="w-4 h-4 text-emerald-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Low-carbon alternative available</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      ))}
                      {materialSummary.length > 10 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          +{materialSummary.length - 10} more materials
                        </p>
                      )}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {onExportReport && (
            <Button onClick={onExportReport} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          )}
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" className="gap-2" disabled={isLoading}>
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          )}
          {onViewDetails && (
            <Button onClick={onViewDetails} className="gap-2">
              View Full Analysis
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default CarbonAnalyticsDashboard;
