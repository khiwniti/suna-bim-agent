'use client';

/**
 * Compliance Check Result Component
 *
 * Displays building code compliance check results
 * Shows pass/fail status with detailed check breakdown
 */

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Shield, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import type { ComplianceResult } from '@/lib/generative-ui/types';

interface ComplianceCardProps {
  result: ComplianceResult;
  className?: string;
}

const statusConfig = {
  pass: {
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    icon: CheckCircle2,
    label: 'Pass',
  },
  fail: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    icon: XCircle,
    label: 'Fail',
  },
  warning: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: AlertTriangle,
    label: 'Warning',
  },
};

export function ComplianceCard({ result, className }: ComplianceCardProps) {
  const { t } = useTranslation();
  const passCount = result.checks.filter((c) => c.status === 'pass').length;
  const failCount = result.checks.filter((c) => c.status === 'fail').length;
  const warnCount = result.checks.filter((c) => c.status === 'warning').length;
  const scorePercentage = Math.round(result.score * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border p-4 space-y-4',
        result.passed
          ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 border-green-200 dark:border-green-800'
          : 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 border-red-200 dark:border-red-800',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              result.passed
                ? 'bg-green-600 dark:bg-green-500'
                : 'bg-red-600 dark:bg-red-500'
            )}
          >
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{t('generativeUi.codeCompliance')}</h3>
            <p className="text-sm text-muted-foreground">
              {result.passed ? t('generativeUi.allRequirementsMet') : t('generativeUi.actionRequired')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={cn(
              'text-3xl font-bold',
              result.passed
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            )}
          >
            {scorePercentage}%
          </p>
          <p className="text-xs text-muted-foreground">{t('generativeUi.complianceScore')}</p>
        </div>
      </div>

      {/* Score Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t('generativeUi.progress')}</span>
          <span>{passCount}/{result.checks.length} {t('generativeUi.checksPassed')}</span>
        </div>
        <div className="h-2 rounded-full bg-white/50 dark:bg-black/20 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${scorePercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              result.passed
                ? 'bg-green-500'
                : scorePercentage >= 70
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            )}
          />
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className={cn('rounded-lg p-2.5 border text-center', statusConfig.pass.bg, statusConfig.pass.border)}>
          <CheckCircle2 className={cn('w-4 h-4 mx-auto mb-1', statusConfig.pass.color)} />
          <p className={cn('text-lg font-bold', statusConfig.pass.color)}>{passCount}</p>
          <p className="text-xs text-muted-foreground">{t('generativeUi.passed')}</p>
        </div>
        <div className={cn('rounded-lg p-2.5 border text-center', statusConfig.warning.bg, statusConfig.warning.border)}>
          <AlertTriangle className={cn('w-4 h-4 mx-auto mb-1', statusConfig.warning.color)} />
          <p className={cn('text-lg font-bold', statusConfig.warning.color)}>{warnCount}</p>
          <p className="text-xs text-muted-foreground">{t('generativeUi.warnings')}</p>
        </div>
        <div className={cn('rounded-lg p-2.5 border text-center', statusConfig.fail.bg, statusConfig.fail.border)}>
          <XCircle className={cn('w-4 h-4 mx-auto mb-1', statusConfig.fail.color)} />
          <p className={cn('text-lg font-bold', statusConfig.fail.color)}>{failCount}</p>
          <p className="text-xs text-muted-foreground">{t('generativeUi.failed')}</p>
        </div>
      </div>

      {/* Check Details */}
      {result.checks && result.checks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Scale className="w-4 h-4" />
            {t('generativeUi.complianceChecks')}
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {result.checks.map((check, idx) => {
              const config = statusConfig[check.status];
              const Icon = config.icon;
              return (
                <div
                  key={idx}
                  className={cn(
                    'flex items-start gap-3 p-2.5 rounded-lg border',
                    'bg-white/50 dark:bg-black/20',
                    config.border
                  )}
                >
                  <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                        {check.code}
                      </span>
                      <span
                        className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          config.bg,
                          config.color
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{check.requirement}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{check.details}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Compact Compliance Summary - For inline display
 */
export function ComplianceSummary({ result }: { result: ComplianceResult }) {
  const { t } = useTranslation();
  const scorePercentage = Math.round(result.score * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border',
        result.passed
          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
      )}
    >
      {result.passed ? (
        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
      ) : (
        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
      )}
      <span className="text-sm font-medium">
        {result.passed ? t('generativeUi.compliant', { score: scorePercentage }) : t('generativeUi.nonCompliant', { score: scorePercentage })}
      </span>
    </motion.div>
  );
}
