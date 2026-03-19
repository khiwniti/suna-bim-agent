'use client';

/**
 * Carbon Analysis Result Component
 *
 * Beautiful inline visualization of carbon footprint analysis
 * Displays total carbon, breakdown, hotspots, and recommendations
 */

import { motion } from 'framer-motion';
import { Leaf, TrendingDown, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import type { CarbonAnalysisResult } from '@/lib/generative-ui/types';

interface CarbonResultCardProps {
  result: CarbonAnalysisResult;
  className?: string;
  /** Optional callback to open the carbon dashboard panel */
  onOpenPanel?: () => void;
  /** Show the "Open Panel →" CTA button */
  showPanelCTA?: boolean;
}

export function CarbonResultCard({ result, className, onOpenPanel, showPanelCTA = false }: CarbonResultCardProps) {
  const { t } = useTranslation();
  const totalCarbon = result.totalCarbon;
  const formattedCarbon = totalCarbon.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50',
        'dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20',
        'border-green-200 dark:border-green-800',
        'p-4 space-y-4',
        className
      )}
    >
      {/* Header - Total Carbon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{t('generativeUi.carbonFootprint')}</h3>
            <p className="text-sm text-muted-foreground">{t('generativeUi.buildingAnalysis')}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-green-700 dark:text-green-400">
            {formattedCarbon}
          </p>
          <p className="text-xs text-muted-foreground">{result.unit}</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">{t('generativeUi.breakdown')}</h4>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(result.breakdown).map(([category, value]) => {
            const percentage = (value / totalCarbon) * 100;
            return (
              <div
                key={category}
                className="bg-white/50 dark:bg-black/20 rounded-lg p-3 border border-green-200/50 dark:border-green-800/50"
              >
                <p className="text-xs text-muted-foreground capitalize mb-1">
                  {category}
                </p>
                <p className="text-lg font-semibold">
                  {value.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {percentage.toFixed(1)}%
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hotspots */}
      {result.hotspots && result.hotspots.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <h4 className="text-sm font-medium">{t('generativeUi.carbonHotspots')}</h4>
          </div>
          <div className="space-y-2">
            {result.hotspots.slice(0, 3).map((hotspot, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-white/50 dark:bg-black/20 rounded-lg p-2 border border-orange-200/50 dark:border-orange-800/50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{hotspot.element}</p>
                  <p className="text-xs text-muted-foreground">
                    {hotspot.carbon.toLocaleString()} {result.unit}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    {hotspot.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-medium">{t('generativeUi.recommendations')}</h4>
          </div>
          <ul className="space-y-1.5">
            {result.recommendations.slice(0, 3).map((rec, idx) => (
              <li
                key={idx}
                className="text-sm text-muted-foreground pl-3 border-l-2 border-blue-600/30 dark:border-blue-400/30"
              >
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Open Panel CTA */}
      {showPanelCTA && onOpenPanel && (
        <button
          onClick={onOpenPanel}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-2"
        >
          {t('generativeUi.openPanel')} <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

/**
 * Compact Carbon Summary - For inline display
 */
export function CarbonSummary({ result }: { result: CarbonAnalysisResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
    >
      <Leaf className="w-4 h-4 text-green-600 dark:text-green-400" />
      <span className="text-sm font-medium">
        {result.totalCarbon.toLocaleString()} {result.unit}
      </span>
    </motion.div>
  );
}
