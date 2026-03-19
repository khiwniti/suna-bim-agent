'use client';

/**
 * RecommendationsPanel - AI-powered low-carbon material recommendations
 *
 * Features:
 * - Prioritized recommendations (high/medium/low impact)
 * - Material swap suggestions with savings
 * - One-click apply optimizations
 */

import { motion } from 'framer-motion';
import {
  Lightbulb,
  ArrowRight,
  Leaf,
  TrendingDown,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ThaiMaterial } from '@/lib/carbon';

// ============================================
// Types
// ============================================

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

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  onApply?: (recommendation: Recommendation) => void;
  className?: string;
}

// ============================================
// Priority Config
// ============================================

const PRIORITY_CONFIG = {
  high: {
    label: 'High Impact',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    icon: '🔥',
  },
  medium: {
    label: 'Medium Impact',
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: '⚡',
  },
  low: {
    label: 'Low Impact',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: '💡',
  },
};

// ============================================
// Component
// ============================================

export function RecommendationsPanel({
  recommendations,
  onApply,
  className,
}: RecommendationsPanelProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Recommendations
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <Leaf className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="text-muted-foreground">
              Great job! Your material selections are already optimized.
            </p>
          </div>
        ) : (
          recommendations.map((rec, index) => {
            const priorityConfig = PRIORITY_CONFIG[rec.priority];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'p-4 rounded-xl border',
                  priorityConfig.bg,
                  priorityConfig.border
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{priorityConfig.icon}</span>
                    <div>
                      <div className="font-medium">{rec.title}</div>
                      <div
                        className={cn(
                          'text-xs font-medium',
                          priorityConfig.color
                        )}
                      >
                        {priorityConfig.label}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                      <TrendingDown className="w-4 h-4" />
                      {rec.savingsKgCO2e > 1000
                        ? `${(rec.savingsKgCO2e / 1000).toFixed(1)}t`
                        : `${Math.round(rec.savingsKgCO2e)}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      -{rec.savingsPercent.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-3">
                  {rec.description}
                </p>

                {/* Material Swap */}
                {rec.materialSwap && (
                  <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-0.5">
                        Current
                      </div>
                      <div className="text-sm font-medium truncate">
                        {rec.materialSwap.from.nameEn}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rec.materialSwap.from.emissionFactor} kgCO₂e/
                        {rec.materialSwap.from.unit}
                      </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-primary shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-green-600 dark:text-green-400 mb-0.5 flex items-center gap-1">
                        <Leaf className="w-3 h-3" />
                        Recommended
                      </div>
                      <div className="text-sm font-medium truncate">
                        {rec.materialSwap.to.nameEn}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {rec.materialSwap.to.emissionFactor} kgCO₂e/
                        {rec.materialSwap.to.unit}
                      </div>
                    </div>
                  </div>
                )}

                {/* Apply Button */}
                {onApply && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onApply(rec)}
                    className="w-full"
                  >
                    Apply This Change
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </motion.div>
            );
          })
        )}

        {/* Summary */}
        {recommendations.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Total potential savings
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {(() => {
                  const total = recommendations.reduce(
                    (sum, r) => sum + r.savingsKgCO2e,
                    0
                  );
                  return total > 1000
                    ? `${(total / 1000).toFixed(1)} tonnes CO₂e`
                    : `${Math.round(total)} kgCO₂e`;
                })()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecommendationsPanel;
