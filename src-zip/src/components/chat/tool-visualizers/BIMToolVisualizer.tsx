'use client';

/**
 * BIMToolVisualizer - BIM-specific tool call visualization
 *
 * Visualizes BIM tools like carbon analysis, clash detection, and BOQ extraction.
 * Integrates with panel system to highlight elements and show detailed results.
 *
 * ★ Insight ─────────────────────────────────────
 * BIM tools often produce complex results with element references, charts,
 * and recommendations. This visualizer renders them in a compact card format
 * with the ability to expand for details or trigger panel actions.
 * ─────────────────────────────────────────────────
 */

import { useState, useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  AlertTriangle,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  TrendingDown,
  ExternalLink,
  Box,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import { BaseToolCard } from './BaseToolCard';
import type { ToolCallVisualization } from '@/lib/generative-ui/types';

// ============================================
// Types
// ============================================

export interface CarbonAnalysisResult {
  totalEmissions: number;
  unit: string;
  breakdown: Array<{
    category: string;
    value: number;
    percentage: number;
    color?: string;
  }>;
  hotspots: Array<{
    elementId: string;
    elementName: string;
    emissions: number;
    recommendation?: string;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    savingsPotential: number;
    impact: 'high' | 'medium' | 'low';
  }>;
  benchmark?: number;
}

export interface ClashDetectionResult {
  totalClashes: number;
  resolved: number;
  unresolved: number;
  clashes: Array<{
    id: string;
    type: 'hard' | 'soft' | 'clearance';
    elementA: { id: string; name: string };
    elementB: { id: string; name: string };
    severity: 'critical' | 'warning' | 'info';
    status: 'new' | 'reviewed' | 'resolved' | 'ignored';
  }>;
}

export interface BOQExtractionResult {
  totalItems: number;
  totalCost?: number;
  currency?: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitRate?: number;
    amount?: number;
    category?: string;
  }>;
}

export type BIMToolType = 'carbon_analysis' | 'clash_detection' | 'boq_extraction';

export interface BIMToolProps {
  /** Type of BIM tool */
  toolType: BIMToolType;
  /** Carbon analysis result */
  carbonResult?: CarbonAnalysisResult;
  /** Clash detection result */
  clashResult?: ClashDetectionResult;
  /** BOQ extraction result */
  boqResult?: BOQExtractionResult;
  /** Execution status */
  status: 'running' | 'success' | 'error';
  /** Error message if failed */
  error?: string;
  /** Callback to open panel with data */
  onOpenPanel?: (panelId: string, data: unknown) => void;
  /** Callback to highlight elements in 3D viewer */
  onHighlightElements?: (elementIds: string[]) => void;
}

// ============================================
// Tool Icons & Config
// ============================================

const TOOL_CONFIG: Record<BIMToolType, {
  icon: typeof Leaf;
  label: string;
  color: string;
  bgColor: string;
}> = {
  carbon_analysis: {
    icon: Leaf,
    label: 'Carbon Analysis',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  clash_detection: {
    icon: AlertTriangle,
    label: 'Clash Detection',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  boq_extraction: {
    icon: FileSpreadsheet,
    label: 'BOQ Extraction',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
};

// ============================================
// Sub-Components
// ============================================

/**
 * Carbon Analysis Mini Chart (Horizontal Bar)
 */
function CarbonBreakdownMini({
  breakdown,
}: {
  breakdown: CarbonAnalysisResult['breakdown'];
}) {
  const maxValue = Math.max(...breakdown.map(b => b.value));

  return (
    <div className="space-y-1.5">
      {breakdown.slice(0, 4).map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-20 truncate">
            {item.category}
          </span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor: item.color || `hsl(${idx * 60}, 70%, 50%)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            />
          </div>
          <span className="text-xs font-mono w-12 text-right">
            {item.percentage.toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Clash Summary Badges
 */
function ClashSummary({
  clashes,
}: {
  clashes: ClashDetectionResult['clashes'];
}) {
  const critical = clashes.filter(c => c.severity === 'critical').length;
  const warning = clashes.filter(c => c.severity === 'warning').length;
  const info = clashes.filter(c => c.severity === 'info').length;

  return (
    <div className="flex gap-2">
      {critical > 0 && (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
          {critical} Critical
        </span>
      )}
      {warning > 0 && (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          {warning} Warning
        </span>
      )}
      {info > 0 && (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
          {info} Info
        </span>
      )}
    </div>
  );
}

/**
 * BOQ Summary Table (compact)
 */
function BOQSummaryTable({
  items,
}: {
  items: BOQExtractionResult['items'];
  currency?: string;
}) {
  const { t } = useTranslation();
  const displayItems = items.slice(0, 3);

  return (
    <div className="text-xs">
      <div className="grid grid-cols-3 gap-2 font-medium text-muted-foreground mb-1">
        <span>{t('toolVisualizer.description')}</span>
        <span className="text-right">{t('toolVisualizer.qty')}</span>
        <span className="text-right">{t('toolVisualizer.amount')}</span>
      </div>
      {displayItems.map((item) => (
        <div key={item.id} className="grid grid-cols-3 gap-2 py-0.5">
          <span className="truncate">{item.description}</span>
          <span className="text-right font-mono">
            {item.quantity} {item.unit}
          </span>
          <span className="text-right font-mono">
            {item.amount?.toLocaleString() ?? '-'}
          </span>
        </div>
      ))}
      {items.length > 3 && (
        <div className="text-center text-muted-foreground mt-1">
          {t('toolVisualizer.moreItems', { count: items.length - 3 })}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function BIMToolVisualizer({
  toolType,
  carbonResult,
  clashResult,
  boqResult,
  status,
  error,
  onOpenPanel,
  onHighlightElements,
}: BIMToolProps) {
  const { t } = useTranslation();
  const uniqueId = useId();
  const [isExpanded, setIsExpanded] = useState(false);

  const config = TOOL_CONFIG[toolType];
  const Icon = config.icon;

  // Create ToolCallVisualization for BaseToolCard
  const toolCall: ToolCallVisualization = useMemo(
    () => ({
      id: `bim-tool-${uniqueId}`,
      name: toolType,
      status: status === 'running' ? 'running' : status === 'success' ? 'success' : 'error',
      startedAt: new Date(),
    }),
    [uniqueId, toolType, status]
  );

  // Render based on tool type
  const renderContent = () => {
    if (status === 'running') {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span>{t('toolVisualizer.analyzing')}</span>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="text-sm text-destructive">
          {error || t('toolVisualizer.analysisFailed')}
        </div>
      );
    }

    switch (toolType) {
      case 'carbon_analysis':
        if (!carbonResult) return null;
        return (
          <div className="space-y-3">
            {/* Total Emissions */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {carbonResult.totalEmissions.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                {carbonResult.unit}
              </span>
              {carbonResult.benchmark && (
                <span className="ml-auto flex items-center gap-1 text-xs">
                  <TrendingDown className="w-3 h-3 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">
                    {((1 - carbonResult.totalEmissions / carbonResult.benchmark) * 100).toFixed(0)}% below benchmark
                  </span>
                </span>
              )}
            </div>

            {/* Breakdown */}
            <CarbonBreakdownMini breakdown={carbonResult.breakdown} />

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onOpenPanel?.('carbon-dashboard', carbonResult)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View Dashboard
                <ExternalLink className="w-3 h-3" />
              </button>
              {carbonResult.hotspots.length > 0 && (
                <button
                  onClick={() =>
                    onHighlightElements?.(carbonResult.hotspots.map(h => h.elementId))
                  }
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Box className="w-3 h-3" />
                  Show Hotspots
                </button>
              )}
            </div>
          </div>
        );

      case 'clash_detection':
        if (!clashResult) return null;
        return (
          <div className="space-y-3">
            {/* Summary */}
            <div className="flex items-center gap-4">
              <div>
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {clashResult.totalClashes}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  clashes found
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {clashResult.resolved} resolved / {clashResult.unresolved} open
              </div>
            </div>

            {/* Severity breakdown */}
            <ClashSummary clashes={clashResult.clashes} />

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {isExpanded ? 'Hide Details' : 'View Clashes'}
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Expanded clash list */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 max-h-40 overflow-y-auto text-xs">
                    {clashResult.clashes.slice(0, 5).map((clash) => (
                      <div
                        key={clash.id}
                        className={cn(
                          'flex items-center gap-2 p-1.5 rounded',
                          clash.severity === 'critical' && 'bg-red-500/10',
                          clash.severity === 'warning' && 'bg-amber-500/10',
                          clash.severity === 'info' && 'bg-blue-500/10'
                        )}
                      >
                        <span className="font-medium truncate">
                          {clash.elementA.name}
                        </span>
                        <ArrowRight className="w-3 h-3 flex-shrink-0" />
                        <span className="font-medium truncate">
                          {clash.elementB.name}
                        </span>
                        <button
                          onClick={() =>
                            onHighlightElements?.([clash.elementA.id, clash.elementB.id])
                          }
                          className="ml-auto text-muted-foreground hover:text-foreground"
                        >
                          <Box className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'boq_extraction':
        if (!boqResult) return null;
        return (
          <div className="space-y-3">
            {/* Summary */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {boqResult.totalItems}
                </span>
                <span className="text-sm text-muted-foreground ml-1">items</span>
              </div>
              {boqResult.totalCost && (
                <div className="text-right">
                  <span className="text-lg font-semibold">
                    {boqResult.currency || 'THB'}{' '}
                    {boqResult.totalCost.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    Total Cost
                  </span>
                </div>
              )}
            </div>

            {/* Mini table */}
            <BOQSummaryTable items={boqResult.items} currency={boqResult.currency} />

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onOpenPanel?.('boq-table', boqResult)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Open BOQ Editor
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <BaseToolCard
      toolCall={toolCall}
      status={status === 'running' ? 'running' : status === 'success' ? 'success' : 'error'}
      icon={<Icon className={cn('w-4 h-4', config.color)} />}
    >
      <div className="space-y-2">
        {/* Tool label */}
        <div className="flex items-center gap-2">
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', config.bgColor, config.color)}>
            {config.label}
          </span>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </BaseToolCard>
  );
}

export default BIMToolVisualizer;
