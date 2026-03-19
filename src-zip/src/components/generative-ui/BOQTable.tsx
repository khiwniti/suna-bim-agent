'use client';

/**
 * Bill of Quantities (BOQ) Table Component
 *
 * Displays quantity takeoff data in a structured table format
 * Shows materials, quantities, units, and estimated costs
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table2, ChevronDown, ChevronUp, Download, DollarSign, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import type { BOQItem, BOQResult } from '@/lib/generative-ui/types';

interface BOQTableProps {
  result: BOQResult;
  className?: string;
}

export function BOQTable({ result, className }: BOQTableProps) {
  const { t } = useTranslation();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof BOQItem>('category');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { items, summary, categories } = result;
  const currency = summary.currency || 'THB';

  // Group items by category
  const groupedItems = items.reduce(
    (acc, item) => {
      const key = item.category || 'Uncategorized';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, BOQItem[]>
  );

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '-';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format quantity
  const formatQuantity = (value: number, unit: string) => {
    return `${value.toLocaleString()} ${unit}`;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50',
        'dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-violet-950/20',
        'border-blue-200 dark:border-blue-800',
        'p-4 space-y-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
            <Table2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{t('generativeUi.billOfQuantities')}</h3>
            <p className="text-sm text-muted-foreground">
              {summary.totalItems} {t('generativeUi.itemsAcross')} {categories.length} {t('generativeUi.categories')}
            </p>
          </div>
        </div>
        {summary.totalCost !== undefined && (
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(summary.totalCost)}
            </p>
            <p className="text-xs text-muted-foreground">{t('generativeUi.totalEstimatedCost')}</p>
          </div>
        )}
      </div>

      {/* Category Summary Pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
          return (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
                expandedCategory === category
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white/50 dark:bg-black/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              )}
            >
              <Package className="w-3.5 h-3.5" />
              <span>{category}</span>
              <span className="text-xs opacity-70">({categoryItems.length})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-blue-200/50 dark:border-blue-800/50 overflow-hidden">
        {/* Table Header */}
        <div className="bg-blue-100/50 dark:bg-blue-900/30 border-b border-blue-200/50 dark:border-blue-800/50">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
            <div className="col-span-4">{t('generativeUi.description')}</div>
            <div className="col-span-2 text-right">{t('generativeUi.quantity')}</div>
            <div className="col-span-3 text-right">{t('generativeUi.unitCost')}</div>
            <div className="col-span-3 text-right">{t('generativeUi.total')}</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="max-h-72 overflow-y-auto divide-y divide-blue-100 dark:divide-blue-900/30">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category}>
              {/* Category Row */}
              <button
                onClick={() => toggleCategory(category)}
                className={cn(
                  'w-full grid grid-cols-12 gap-2 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors',
                  'border-b border-blue-100 dark:border-blue-900/30'
                )}
              >
                <div className="col-span-9 flex items-center gap-2 text-left font-medium">
                  {expandedCategory === category ? (
                    <ChevronUp className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-blue-600" />
                  )}
                  <span>{category}</span>
                  <span className="text-xs text-muted-foreground">
                    ({categoryItems.length} items)
                  </span>
                </div>
                <div className="col-span-3 text-right font-semibold text-blue-700 dark:text-blue-400">
                  {formatCurrency(
                    categoryItems.reduce((sum, item) => sum + (item.totalCost || 0), 0)
                  )}
                </div>
              </button>

              {/* Category Items */}
              <AnimatePresence>
                {expandedCategory === category && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {categoryItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className={cn(
                          'grid grid-cols-12 gap-2 px-3 py-2 text-sm',
                          'bg-white/50 dark:bg-black/10',
                          idx !== categoryItems.length - 1 &&
                            'border-b border-blue-100/50 dark:border-blue-900/20'
                        )}
                      >
                        <div className="col-span-4 pl-6">
                          <p className="font-medium truncate">{item.description}</p>
                          {item.material && (
                            <p className="text-xs text-muted-foreground truncate">
                              {item.material}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2 text-right">
                          {formatQuantity(item.quantity, item.unit)}
                        </div>
                        <div className="col-span-3 text-right text-muted-foreground">
                          {formatCurrency(item.unitCost)}
                        </div>
                        <div className="col-span-3 text-right font-medium">
                          {formatCurrency(item.totalCost)}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-blue-200 dark:border-blue-800">
        <span>{t('generativeUi.clickToExpand')}</span>
        <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
          <Download className="w-3.5 h-3.5" />
          {t('generativeUi.exportBOQ')}
        </button>
      </div>
    </motion.div>
  );
}

/**
 * Compact BOQ Summary - For inline display
 */
export function BOQSummary({ result }: { result: BOQResult }) {
  const currency = result.summary.currency || 'THB';
  const formattedCost = result.summary.totalCost
    ? new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
      }).format(result.summary.totalCost)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
    >
      <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      <span className="text-sm font-medium">
        {result.summary.totalItems} items
        {formattedCost && ` • ${formattedCost}`}
      </span>
    </motion.div>
  );
}
