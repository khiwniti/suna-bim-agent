'use client';

/**
 * HITLContainer - Container for managing HITL cards
 *
 * Subscribes to shared state store for pending HITL requests,
 * renders appropriate card based on request type,
 * and handles response callbacks with smooth transitions.
 */

import { memo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSharedStateStore, type HITLRequest } from '@/stores/shared-state-store';
import { ConfirmationCard, type ConfirmationCardProps } from './ConfirmationCard';
import { MultiChoiceCard, type MultiChoiceCardProps } from './MultiChoiceCard';
import { ParameterInputCard, type ParameterInputCardProps } from './ParameterInputCard';

export interface HITLContainerProps {
  /** Callback when user responds to HITL request */
  onResponse?: (requestId: string, accepted: boolean, data?: unknown) => void;
  /** Optional className */
  className?: string;
}

export const HITLContainer = memo(function HITLContainer({
  onResponse,
  className,
}: HITLContainerProps) {
  const pendingHITL = useSharedStateStore((s) => s.chatContext.pendingHITL);
  const clearPendingHITL = useSharedStateStore((s) => s.clearPendingHITL);

  const handleResponse = useCallback(
    (accepted: boolean, data?: unknown) => {
      if (!pendingHITL) return;
      onResponse?.(pendingHITL.requestId, accepted, data);
      clearPendingHITL();
    },
    [pendingHITL, onResponse, clearPendingHITL]
  );

  const renderCard = useCallback(
    (request: HITLRequest) => {
      switch (request.type) {
        case 'confirmation': {
          const props = request.payload as Omit<
            ConfirmationCardProps,
            'onConfirm' | 'onCancel'
          >;
          return (
            <ConfirmationCard
              {...props}
              onConfirm={() => handleResponse(true)}
              onCancel={() => handleResponse(false)}
            />
          );
        }
        case 'choice': {
          const props = request.payload as Omit<MultiChoiceCardProps, 'onSelect'>;
          return (
            <MultiChoiceCard
              {...props}
              onSelect={(selectedIds) => handleResponse(true, { selectedIds })}
            />
          );
        }
        case 'parameter': {
          const props = request.payload as Omit<
            ParameterInputCardProps,
            'onSubmit' | 'onCancel'
          >;
          return (
            <ParameterInputCard
              {...props}
              onSubmit={(values) => handleResponse(true, { values })}
              onCancel={() => handleResponse(false)}
            />
          );
        }
        default:
          return null;
      }
    },
    [handleResponse]
  );

  return (
    <AnimatePresence mode="wait">
      {pendingHITL && (
        <motion.div
          key={pendingHITL.requestId}
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={className}
        >
          {renderCard(pendingHITL)}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default HITLContainer;
