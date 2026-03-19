'use client';

/**
 * Element List Card Component
 *
 * Displays a list of BIM elements with properties
 * Supports grouping by type and interactive selection
 */

import { motion } from 'framer-motion';
import { Layers, Box, ChevronRight, Building2, DoorOpen, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import type { BIMElement, ElementListResult } from '@/lib/generative-ui/types';

interface ElementListCardProps {
  result: ElementListResult;
  onElementClick?: (elementId: string) => void;
  className?: string;
}

const typeIcons: Record<string, typeof Box> = {
  wall: Building2,
  door: DoorOpen,
  window: DoorOpen,
  slab: Layers,
  beam: Gauge,
  column: Gauge,
  default: Box,
};

function getIcon(type: string) {
  return typeIcons[type.toLowerCase()] || typeIcons.default;
}

export function ElementListCard({ result, onElementClick, className }: ElementListCardProps) {
  const { t } = useTranslation();
  const { elements, totalCount, groupBy = 'type' } = result;

  // Group elements by type if requested
  const groupedElements =
    groupBy === 'type'
      ? elements.reduce(
          (acc, el) => {
            const key = el.type;
            if (!acc[key]) acc[key] = [];
            acc[key].push(el);
            return acc;
          },
          {} as Record<string, BIMElement[]>
        )
      : groupBy === 'material'
        ? elements.reduce(
            (acc, el) => {
              const key = el.material || 'Unknown';
              if (!acc[key]) acc[key] = [];
              acc[key].push(el);
              return acc;
            },
            {} as Record<string, BIMElement[]>
          )
        : { All: elements };

  const groups = Object.entries(groupedElements);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50',
        'dark:from-slate-950/20 dark:via-gray-950/20 dark:to-zinc-950/20',
        'border-slate-200 dark:border-slate-800',
        'p-4 space-y-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-600 dark:bg-slate-500 flex items-center justify-center">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{t('elementList.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {groupBy !== 'none' ? t('elementList.groupedBy', { groupBy }) : t('elementList.allElements')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-slate-700 dark:text-slate-400">
            {totalCount}
          </p>
          <p className="text-xs text-muted-foreground">{t('elementList.totalElements')}</p>
        </div>
      </div>

      {/* Element Groups */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {groups.map(([group, groupElements]) => {
          const Icon = getIcon(group);
          return (
            <div key={group} className="space-y-1.5">
              {/* Group Header */}
              <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-900/40 rounded-lg">
                <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium capitalize">{group}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {t('elementList.itemsCount', { count: groupElements.length })}
                </span>
              </div>

              {/* Group Elements */}
              <div className="space-y-1 pl-2">
                {groupElements.slice(0, 10).map((element) => (
                  <motion.button
                    key={element.id}
                    onClick={() => onElementClick?.(element.id)}
                    whileHover={{ x: 4 }}
                    className={cn(
                      'w-full flex items-center gap-2 p-2 rounded-lg text-left',
                      'bg-white/50 dark:bg-black/20 border border-slate-200/50 dark:border-slate-800/50',
                      'hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors',
                      'group'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{element.name}</p>
                      {element.material && (
                        <p className="text-xs text-muted-foreground truncate">
                          {element.material}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))}
                {groupElements.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    {t('elementList.moreElements', { count: groupElements.length - 10 })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with summary */}
      {elements.length < totalCount && (
        <div className="text-center text-xs text-muted-foreground pt-2 border-t border-slate-200 dark:border-slate-800">
          {t('elementList.showing', { shown: elements.length, total: totalCount })}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Compact Element Summary - For inline display
 */
export function ElementSummary({ result }: { result: ElementListResult }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800"
    >
      <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      <span className="text-sm font-medium">{t('elementList.elementsCount', { count: result.totalCount })}</span>
    </motion.div>
  );
}
