'use client';

/**
 * EmissionsChart - Visual breakdown of carbon emissions by category
 *
 * Features:
 * - Horizontal bar chart with animated bars
 * - Category breakdown with percentages
 * - Color-coded by material category
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ThaiMaterialCategory } from '@/lib/carbon';

// ============================================
// Types
// ============================================

interface MaterialEmission {
  material: {
    id: string;
    nameEn: string;
    category: ThaiMaterialCategory;
  };
  quantity: number;
  emissions: number;
}

interface CategoryBreakdown {
  category: ThaiMaterialCategory;
  emissions: number;
  percentage: number;
  materials: MaterialEmission[];
}

interface EmissionsChartProps {
  breakdown: CategoryBreakdown[];
  className?: string;
}

// ============================================
// Category Colors
// ============================================

const CATEGORY_COLORS: Record<ThaiMaterialCategory, string> = {
  concrete: 'bg-slate-500',
  steel: 'bg-blue-500',
  masonry: 'bg-orange-500',
  timber: 'bg-amber-600',
  glass: 'bg-cyan-500',
  insulation: 'bg-purple-500',
  finishes: 'bg-pink-500',
  mep: 'bg-yellow-500',
  roofing: 'bg-red-500',
  waterproofing: 'bg-teal-500',
};

const CATEGORY_ICONS: Record<ThaiMaterialCategory, string> = {
  concrete: '🏗️',
  steel: '🔩',
  masonry: '🧱',
  timber: '🪵',
  glass: '🪟',
  insulation: '🧊',
  finishes: '🎨',
  mep: '⚡',
  roofing: '🏠',
  waterproofing: '💧',
};

const CATEGORY_LABELS: Record<ThaiMaterialCategory, string> = {
  concrete: 'Concrete',
  steel: 'Steel',
  masonry: 'Masonry',
  timber: 'Timber',
  glass: 'Glass',
  insulation: 'Insulation',
  finishes: 'Finishes',
  mep: 'MEP',
  roofing: 'Roofing',
  waterproofing: 'Waterproofing',
};

// ============================================
// Component
// ============================================

export function EmissionsChart({ breakdown, className }: EmissionsChartProps) {
  // Find max for scaling
  const maxEmissions = useMemo(
    () => Math.max(...breakdown.map((b) => b.emissions), 1),
    [breakdown]
  );

  // Total emissions
  const totalEmissions = useMemo(
    () => breakdown.reduce((sum, b) => sum + b.emissions, 0),
    [breakdown]
  );

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Emissions by Category
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {breakdown.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No emission data to display
          </div>
        ) : (
          breakdown.map((cat, index) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              {/* Category Label */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{CATEGORY_ICONS[cat.category]}</span>
                  <span className="font-medium">{CATEGORY_LABELS[cat.category]}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>
                    {cat.emissions > 1000
                      ? `${(cat.emissions / 1000).toFixed(1)}t`
                      : `${Math.round(cat.emissions)}`}{' '}
                    kgCO₂e
                  </span>
                  <span className="w-12 text-right font-medium text-foreground">
                    {cat.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="h-6 bg-muted rounded-lg overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-lg',
                    CATEGORY_COLORS[cat.category]
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${(cat.emissions / maxEmissions) * 100}%` }}
                  transition={{
                    type: 'spring',
                    damping: 20,
                    stiffness: 100,
                    delay: index * 0.1,
                  }}
                />
              </div>

              {/* Sub-materials (collapsed by default, could add expand) */}
              {cat.materials.length > 1 && (
                <div className="pl-6 text-xs text-muted-foreground space-y-1">
                  {cat.materials.slice(0, 3).map((m) => (
                    <div key={m.material.id} className="flex justify-between">
                      <span>{m.material.nameEn}</span>
                      <span>
                        {m.emissions > 1000
                          ? `${(m.emissions / 1000).toFixed(1)}t`
                          : `${Math.round(m.emissions)}`}
                      </span>
                    </div>
                  ))}
                  {cat.materials.length > 3 && (
                    <div className="text-muted-foreground/60">
                      +{cat.materials.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))
        )}

        {/* Legend */}
        {breakdown.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-3 text-xs">
              {breakdown.slice(0, 5).map((cat) => (
                <div key={cat.category} className="flex items-center gap-1.5">
                  <div
                    className={cn('w-3 h-3 rounded', CATEGORY_COLORS[cat.category])}
                  />
                  <span>{CATEGORY_LABELS[cat.category]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EmissionsChart;
