'use client';

/**
 * Interactable Clash Result Card
 *
 * Wraps ClashResultCard with withInteractable HOC to enable
 * AI-driven prop updates via ComponentUpdateBus.
 */

import { withInteractable } from '@/lib/generative-ui/interactable';
import { ClashResultCard } from '../ClashResultCard';
import type { ClashDetectionResult } from '@/lib/generative-ui/types';

/**
 * Props for the interactable clash result card
 * Matches ClashResultCard's expected props structure
 */
export interface InteractableClashResultCardProps {
  result: ClashDetectionResult;
  className?: string;
}

/**
 * Interactable version of ClashResultCard
 *
 * Use with componentId to enable AI-driven updates:
 * @example
 * ```tsx
 * <InteractableClashResultCard
 *   componentId="clash-detection-1"
 *   initialProps={{ result: clashData, className: 'my-class' }}
 *   onPropsUpdate={(newProps) => console.log('Updated:', newProps)}
 * />
 * ```
 */
export const InteractableClashResultCard = withInteractable<InteractableClashResultCardProps>(
  ClashResultCard,
  'bim.ClashDetection'
);

export default InteractableClashResultCard;
