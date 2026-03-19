'use client';

/**
 * Interactable Compliance Card
 *
 * Wraps ComplianceCard with withInteractable HOC to enable
 * AI-driven prop updates via ComponentUpdateBus.
 */

import { withInteractable } from '@/lib/generative-ui/interactable';
import { ComplianceCard } from '../ComplianceCard';
import type { ComplianceResult } from '@/lib/generative-ui/types';

/**
 * Props for the interactable compliance card
 * Matches ComplianceCard's expected props structure
 */
export interface InteractableComplianceCardProps {
  result: ComplianceResult;
  className?: string;
}

/**
 * Interactable version of ComplianceCard
 *
 * Use with componentId to enable AI-driven updates:
 * @example
 * ```tsx
 * <InteractableComplianceCard
 *   componentId="compliance-check-1"
 *   initialProps={{ result: complianceData, className: 'my-class' }}
 *   onPropsUpdate={(newProps) => console.log('Updated:', newProps)}
 * />
 * ```
 */
export const InteractableComplianceCard = withInteractable<InteractableComplianceCardProps>(
  ComplianceCard,
  'bim.ComplianceResult'
);

export default InteractableComplianceCard;
