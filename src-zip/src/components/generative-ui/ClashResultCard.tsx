'use client';

/**
 * Clash Detection Result Component
 *
 * Visualizes BIM clash detection results with severity breakdown
 * Shows conflict locations between building elements
 */

import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import type { ClashDetectionResult } from '@/lib/generative-ui/types';

interface ClashResultCardProps {
  result: ClashDetectionResult;
  className?: string;
  /** Optional callback to open the clash report panel */
  onOpenPanel?: () => void;
  /** Show the "Open Panel →" CTA button */
  showPanelCTA?: boolean;
}

const severityConfig = {
  critical: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    icon: AlertTriangle,
  },
  high: {
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-200 dark:border-orange-800',
    icon: AlertCircle,
  },
  medium: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: Info,
  },
  low: {
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Info,
  },
};

export function ClashResultCard({ result, className, onOpenPanel, showPanelCTA = false }: ClashResultCardProps) {
  const { t } = useTranslation();
  const hasClashes = result.totalClashes > 0;
  const criticalCount = result.severity.critical + result.severity.high;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border p-4 space-y-4',
        hasClashes
          ? criticalCount > 0
            ? 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 border-red-200 dark:border-red-800'
            : 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/20 dark:via-amber-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800'
          : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              hasClashes
                ? criticalCount > 0
                  ? 'bg-red-600 dark:bg-red-500'
                  : 'bg-yellow-600 dark:bg-yellow-500'
                : 'bg-green-600 dark:bg-green-500'
            )}
          >
            {hasClashes ? (
              <AlertTriangle className="w-6 h-6 text-white" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{t('generativeUi.clashDetection')}</h3>
            <p className="text-sm text-muted-foreground">
              {hasClashes ? t('generativeUi.issuesFound') : t('generativeUi.noClashesDetected')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={cn(
              'text-3xl font-bold',
              hasClashes
                ? criticalCount > 0
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-yellow-700 dark:text-yellow-400'
                : 'text-green-700 dark:text-green-400'
            )}
          >
            {result.totalClashes}
          </p>
          <p className="text-xs text-muted-foreground">{t('generativeUi.totalClashes')}</p>
        </div>
      </div>

      {/* Severity Breakdown */}
      {hasClashes && (
        <div className="grid grid-cols-4 gap-2">
          {(Object.entries(result.severity) as [keyof typeof severityConfig, number][]).map(
            ([severity, count]) => {
              const config = severityConfig[severity];
              const Icon = config.icon;
              return (
                <div
                  key={severity}
                  className={cn(
                    'rounded-lg p-3 border text-center',
                    config.bg,
                    config.border
                  )}
                >
                  <Icon className={cn('w-4 h-4 mx-auto mb-1', config.color)} />
                  <p className={cn('text-xl font-bold', config.color)}>{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{severity}</p>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Clash List */}
      {result.clashes && result.clashes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {t('generativeUi.topIssues')} ({Math.min(result.clashes.length, 5)} {t('generativeUi.shown')})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {result.clashes.slice(0, 5).map((clash) => {
              const config = severityConfig[clash.severity];
              const Icon = config.icon;
              return (
                <div
                  key={clash.id}
                  className={cn(
                    'flex items-start gap-3 p-2.5 rounded-lg border',
                    'bg-white/50 dark:bg-black/20',
                    config.border
                  )}
                >
                  <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', config.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{clash.type}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {clash.elements.join(' ↔ ')}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                      config.bg,
                      config.color
                    )}
                  >
                    {clash.severity}
                  </span>
                </div>
              );
            })}
          </div>
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
 * Compact Clash Summary - For inline display
 */
export function ClashSummary({ result }: { result: ClashDetectionResult }) {
  const { t } = useTranslation();
  const hasClashes = result.totalClashes > 0;
  const criticalCount = result.severity.critical + result.severity.high;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border',
        hasClashes
          ? criticalCount > 0
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
            : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
          : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
      )}
    >
      {hasClashes ? (
        <AlertTriangle
          className={cn(
            'w-4 h-4',
            criticalCount > 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-yellow-600 dark:text-yellow-400'
          )}
        />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
      )}
      <span className="text-sm font-medium">
        {hasClashes ? t('generativeUi.clashesFound', { count: result.totalClashes }) : t('generativeUi.noClashes')}
      </span>
    </motion.div>
  );
}
