'use client';

/**
 * Interactable Carbon Result Card
 *
 * Wraps CarbonResultCard with withInteractable HOC to enable
 * AI-driven prop updates via ComponentUpdateBus.
 */

import { withInteractable } from '@/lib/generative-ui/interactable';
import { CarbonResultCard } from '../CarbonResultCard';
import type { CarbonAnalysisResult } from '@/lib/generative-ui/types';

/**
 * Props for the interactable carbon result card
 * Matches CarbonResultCard's expected props structure
 */
export interface InteractableCarbonResultCardProps {
  result: CarbonAnalysisResult;
  className?: string;
}

/**
 * Interactable version of CarbonResultCard
 *
 * Use with componentId to enable AI-driven updates:
 * @example
 * ```tsx
 * <InteractableCarbonResultCard
 *   componentId="carbon-analysis-1"
 *   initialProps={{ result: carbonData, className: 'my-class' }}
 *   onPropsUpdate={(newProps) => console.log('Updated:', newProps)}
 * />
 * ```
 */
export const InteractableCarbonResultCard = withInteractable<InteractableCarbonResultCardProps>(
  CarbonResultCard,
  'bim.CarbonResult'
);

export default InteractableCarbonResultCard;
