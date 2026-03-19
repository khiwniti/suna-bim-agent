'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Leaf,
  Zap,
  TrendingDown,
  Award,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Building2,
  Layers,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useBIMStore, useAnalyticsData } from '@/stores';
import { cn, formatCarbon, formatEnergy } from '@/lib/utils';
import {
  calculateSustainability,
  analyzeSpatialStructure,
  analyzeEgress,
  summarizeElements,
} from '@/lib/ifc/extraction';
import { useTranslation } from '@/i18n/provider';

export function AnalyticsDashboard() {
  const { t } = useTranslation();
  const currentModel = useBIMStore((state) => state.currentModel);
  const analyticsData = useAnalyticsData();

  // Compute live analysis from the loaded model
  const liveAnalysis = useMemo(() => {
    if (!currentModel) return null;

    const sustainability = calculateSustainability(currentModel);
    const spatial = analyzeSpatialStructure(currentModel);
    const egress = analyzeEgress(currentModel);
    const elements = summarizeElements(currentModel);

    return { sustainability, spatial, egress, elements };
  }, [currentModel]);

  // Check if we have real data (model loaded OR AI analysis performed)
  const hasRealData = currentModel !== null || analyticsData.hasAIAnalysis;

  // Show empty state if no data
  if (!hasRealData) {
    return <EmptyAnalyticsState />;
  }

  // Use live analysis data if available
  const sustainability = liveAnalysis?.sustainability;
  const spatial = liveAnalysis?.spatial;
  const egress = liveAnalysis?.egress;
  const elements = liveAnalysis?.elements;

  // Calculate total area
  const totalArea = spatial?.totalArea || currentModel?.metadata?.totalArea || 0;

  // Determine sustainability rating based on carbon intensity
  const carbonIntensity = sustainability?.carbonPerSquareMeter || 0;
  const rating = carbonIntensity <= 300 ? 'A' : carbonIntensity <= 500 ? 'B' : carbonIntensity <= 800 ? 'C' : 'D';

  return (
    <div className="h-full overflow-y-auto bg-background p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('analytics.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {currentModel?.name || t('layout.demoBuilding')} • {totalArea.toLocaleString()} m²
          </p>
        </div>
        <div className={cn(
          'px-4 py-2 rounded-full font-bold text-lg',
          rating === 'A' || rating === 'B' ? 'bg-green-100 text-green-700' :
          rating === 'C' || rating === 'D' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        )}>
          {t('analytics.rating')}: {rating}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<Leaf className="w-5 h-5" />}
          label={t('analytics.metrics.embodiedCarbon')}
          value={formatCarbon(sustainability?.estimatedEmbodiedCarbon || 0)}
          subValue={`${carbonIntensity} kgCO₂e/m²`}
          trend={carbonIntensity <= 300 ? -12 : undefined}
          color="green"
        />
        <MetricCard
          icon={<Zap className="w-5 h-5" />}
          label={t('analytics.metrics.energyIntensity')}
          value={`${sustainability?.energyUseIntensity || 0} kWh/m²/yr`}
          subValue={formatEnergy((sustainability?.energyUseIntensity || 0) * totalArea)}
          color="yellow"
        />
        <MetricCard
          icon={<Building2 className="w-5 h-5" />}
          label={t('analytics.metrics.buildingFloors')}
          value={`${spatial?.floorCount || 0} floors`}
          subValue={`${spatial?.averageFloorArea?.toFixed(0) || 0} m² ${t('analytics.metrics.avgFloorArea')}`}
          color="blue"
        />
        <MetricCard
          icon={<Layers className="w-5 h-5" />}
          label={t('analytics.metrics.totalElements')}
          value={`${elements?.totalCount || currentModel?.elements.length || 0}`}
          subValue={`${Object.keys(elements?.byType || {}).length} types`}
          color="orange"
        />
      </div>

      {/* Spatial Analysis */}
      {spatial && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            {t('analytics.spatialAnalysis')}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t('analytics.totalVolume')}:</span>
              <span className="ml-2 font-medium">{spatial.totalVolume.toLocaleString()} m³</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('analytics.netToGross')}:</span>
              <span className={cn(
                'ml-2 font-medium',
                spatial.netToGrossRatio >= 0.8 ? 'text-green-600' : 'text-yellow-600'
              )}>
                {(spatial.netToGrossRatio * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('analytics.circulation')}:</span>
              <span className="ml-2 font-medium">{spatial.circulationArea.toLocaleString()} m²</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('analytics.avgFloorHeight')}:</span>
              <span className="ml-2 font-medium">{(spatial.totalVolume / spatial.totalArea).toFixed(2)}m</span>
            </div>
          </div>
        </div>
      )}

      {/* Carbon Breakdown */}
      {sustainability && sustainability.materialBreakdown.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-600" />
            {t('analytics.carbonBreakdown')}
          </h3>
          <div className="space-y-3">
            {sustainability.materialBreakdown.slice(0, 5).map((material) => (
              <BreakdownBar
                key={material.material}
                label={material.material.charAt(0).toUpperCase() + material.material.slice(1)}
                value={material.percentage}
                amount={`${(material.estimatedCarbon / 1000).toFixed(1)} tCO₂e`}
                color={getMaterialColor(material.material)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Element Distribution */}
      {elements && Object.keys(elements.byType).length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            {t('analytics.elementDistribution')}
          </h3>
          <div className="space-y-3">
            {Object.entries(elements.byType).slice(0, 5).map(([type, count]) => (
              <BreakdownBar
                key={type}
                label={type.charAt(0).toUpperCase() + type.slice(1)}
                value={(count / elements.totalCount) * 100}
                amount={`${count} elements`}
                color={getElementColor(type)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Egress Compliance */}
      {egress && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            {egress.compliant ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
            {t('analytics.egressCompliance')}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <div>
              <span className="text-muted-foreground">{t('analytics.occupantLoad')}:</span>
              <span className="ml-2 font-medium">{egress.occupantLoad} persons</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('analytics.exits')}:</span>
              <span className={cn(
                'ml-2 font-medium',
                egress.actualExits >= egress.requiredExits ? 'text-green-600' : 'text-red-600'
              )}>
                {egress.actualExits} / {egress.requiredExits} {t('analytics.requiredExits')}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('analytics.maxTravel')}:</span>
              <span className={cn(
                'ml-2 font-medium',
                egress.maxTravelDistance <= 60 ? 'text-green-600' : 'text-yellow-600'
              )}>
                {egress.maxTravelDistance.toFixed(1)}m
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('analytics.status')}:</span>
              <span className={cn(
                'ml-2 font-medium',
                egress.compliant ? 'text-green-600' : 'text-red-600'
              )}>
                {egress.compliant ? t('analytics.compliant') : t('analytics.issuesFound')}
              </span>
            </div>
          </div>
          {egress.issues.length > 0 && (
            <div className="space-y-2">
              {egress.issues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded text-sm">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-red-700 dark:text-red-400">{issue.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {sustainability && sustainability.recommendations.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-primary" />
            {t('analytics.recommendations')}
          </h3>
          <div className="space-y-2">
            {sustainability.recommendations.map((rec, idx) => (
              <RecommendationCard
                key={idx}
                recommendation={{
                  id: `rec-${idx}`,
                  category: rec.category,
                  priority: rec.priority,
                  title: rec.suggestion,
                  description: rec.potentialSavings,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          {t('analytics.certifications')}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <CertificationCard
            name="LEED"
            level={carbonIntensity <= 300 ? 'Platinum' : carbonIntensity <= 500 ? 'Gold' : 'Silver'}
            progress={Math.max(20, Math.min(95, 100 - carbonIntensity / 10))}
          />
          <CertificationCard
            name="BREEAM"
            level={carbonIntensity <= 350 ? 'Outstanding' : carbonIntensity <= 500 ? 'Excellent' : 'Good'}
            progress={Math.max(20, Math.min(90, 95 - carbonIntensity / 12))}
          />
          <CertificationCard
            name="WELL"
            level={carbonIntensity <= 400 ? 'Gold' : 'Silver'}
            progress={Math.max(20, Math.min(85, 90 - carbonIntensity / 15))}
          />
        </div>
      </div>
    </div>
  );
}

// Color mapping for materials
function getMaterialColor(material: string): string {
  const colors: Record<string, string> = {
    concrete: '#64748b',
    steel: '#3b82f6',
    timber: '#22c55e',
    brick: '#f59e0b',
    glass: '#06b6d4',
    aluminum: '#8b5cf6',
    plaster: '#ec4899',
    insulation: '#f97316',
  };
  return colors[material] || '#d1d5db';
}

// Color mapping for element types
function getElementColor(type: string): string {
  const colors: Record<string, string> = {
    wall: '#3b82f6',
    slab: '#64748b',
    column: '#f59e0b',
    beam: '#8b5cf6',
    door: '#22c55e',
    window: '#06b6d4',
    stair: '#ec4899',
    roof: '#f97316',
    railing: '#84cc16',
    furniture: '#a855f7',
    space: '#6366f1',
  };
  return colors[type] || '#d1d5db';
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
  color: 'green' | 'yellow' | 'orange' | 'blue';
}

function MetricCard({ icon, label, value, subValue, trend, color }: MetricCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-4 border border-border"
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-2', colorClasses[color])}>
        {icon}
      </div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-muted-foreground">{subValue}</span>
        {trend && (
          <span className={cn('text-xs font-medium', trend < 0 ? 'text-green-600' : 'text-red-600')}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </motion.div>
  );
}

interface BreakdownBarProps {
  label: string;
  value: number;
  amount: string;
  color: string;
}

function BreakdownBar({ label, value, amount, color }: BreakdownBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{amount} ({value}%)</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: {
    id: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    potentialSavings?: {
      carbon: number;
      cost: number;
      paybackYears: number;
    };
  };
}

function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const priorityColors = {
    high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
    low: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  };

  return (
    <button className="w-full flex items-center gap-3 p-3 bg-accent/30 hover:bg-accent rounded-lg transition-colors text-left">
      <div className={cn('px-2 py-1 rounded text-xs font-medium', priorityColors[recommendation.priority])}>
        {recommendation.priority}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{recommendation.title}</div>
        {recommendation.potentialSavings ? (
          <div className="text-xs text-muted-foreground">
            Save {formatCarbon(recommendation.potentialSavings.carbon)}/yr
            {recommendation.potentialSavings.paybackYears > 0 && ` • ${recommendation.potentialSavings.paybackYears}yr payback`}
          </div>
        ) : recommendation.description && (
          <div className="text-xs text-muted-foreground truncate">{recommendation.description}</div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}

interface CertificationCardProps {
  name: string;
  level: string;
  progress: number;
}

function CertificationCard({ name, level, progress }: CertificationCardProps) {
  return (
    <div className="bg-accent/30 rounded-lg p-3 text-center">
      <div className="text-xs text-muted-foreground">{name}</div>
      <div className="font-semibold text-sm">{level}</div>
      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground mt-1">{progress}%</div>
    </div>
  );
}

/**
 * Empty state shown when no model is loaded and no AI analysis has been performed
 */
function EmptyAnalyticsState() {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 flex items-center justify-center">
          <Leaf className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2">{t('analytics.noData')}</h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-6">
          {t('analytics.noDataDescription')}
        </p>

        {/* Suggestions */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium mb-2">{t('analytics.tryAsking')}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <SuggestionChip icon={<Leaf className="w-3 h-3" />} text={t('analytics.suggestions.carbonFootprint')} />
            <SuggestionChip icon={<Zap className="w-3 h-3" />} text={t('analytics.suggestions.energyEfficiency')} />
            <SuggestionChip icon={<Award className="w-3 h-3" />} text={t('analytics.suggestions.leedCheck')} />
          </div>
        </div>

        {/* AI Indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-4 h-4" />
          <span>{t('analytics.poweredByAI')}</span>
        </div>
      </motion.div>
    </div>
  );
}

interface SuggestionChipProps {
  icon: React.ReactNode;
  text: string;
}

function SuggestionChip({ icon, text }: SuggestionChipProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/50 rounded-full text-xs text-muted-foreground">
      {icon}
      <span>{text}</span>
    </div>
  );
}

export default AnalyticsDashboard;
