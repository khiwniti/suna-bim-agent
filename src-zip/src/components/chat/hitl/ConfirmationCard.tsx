'use client';

/**
 * ConfirmationCard - HITL confirmation component
 *
 * Travel-themed "Checkpoint" design for confirming actions before execution.
 * Features:
 * - Impact indicators (info/warning/danger)
 * - Loading state with spinner
 * - Accessible button states
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmationCardProps {
  /** Unique identifier */
  id: string;
  /** Title of the confirmation */
  title: string;
  /** Description of what will happen */
  description: string;
  /** Impact indicator */
  impact?: {
    type: 'info' | 'warning' | 'danger';
    message: string;
  };
  /** Label for confirm button */
  confirmLabel?: string;
  /** Label for cancel button */
  cancelLabel?: string;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Callback when cancelled */
  onCancel: () => void;
  /** Whether the action is in progress */
  isLoading?: boolean;
  /** Optional className */
  className?: string;
}

const impactConfig = {
  info: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
  },
  danger: {
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
  },
};

export const ConfirmationCard = memo(function ConfirmationCard({
  id: _id,
  title,
  description,
  impact,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  className,
}: ConfirmationCardProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    setIsConfirming(true);
    onConfirm();
  };

  const impactStyle = impact ? impactConfig[impact.type] : null;
  const ImpactIcon = impactStyle?.icon;
  const isDisabled = isLoading || isConfirming;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'rounded-lg border overflow-hidden',
        'bg-gradient-to-br from-emerald-50/50 to-teal-50/30',
        'dark:from-emerald-950/20 dark:to-teal-950/10',
        'border-emerald-200/50 dark:border-emerald-800/50',
        'shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-200/30 dark:border-emerald-800/30">
        <span className="text-lg">🚦</span>
        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
          Checkpoint
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        <div>
          <h4 className="font-medium text-sm text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        {/* Impact warning */}
        {impact && impactStyle && ImpactIcon && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              'flex items-start gap-2 p-2 rounded-md border',
              impactStyle.bg,
              impactStyle.border
            )}
          >
            <ImpactIcon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', impactStyle.text)} />
            <p className={cn('text-xs', impactStyle.text)}>{impact.message}</p>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            disabled={isDisabled}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted/50 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDisabled}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md',
              'bg-emerald-600 hover:bg-emerald-700 text-white',
              'transition-colors flex items-center gap-2',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

export default ConfirmationCard;
