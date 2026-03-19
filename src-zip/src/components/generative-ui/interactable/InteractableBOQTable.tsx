'use client';

/**
 * Interactable BOQ Table
 *
 * Wraps BOQTable with withInteractable HOC to enable
 * AI-driven prop updates via ComponentUpdateBus.
 */

import { withInteractable } from '@/lib/generative-ui/interactable';
import { BOQTable } from '../BOQTable';
import type { BOQResult } from '@/lib/generative-ui/types';

/**
 * Props for the interactable BOQ table
 * Matches BOQTable's expected props structure
 */
export interface InteractableBOQTableProps {
  result: BOQResult;
  className?: string;
}

/**
 * Interactable version of BOQTable
 *
 * Use with componentId to enable AI-driven updates:
 * @example
 * ```tsx
 * <InteractableBOQTable
 *   componentId="boq-table-1"
 *   initialProps={{ result: boqData, className: 'my-class' }}
 *   onPropsUpdate={(newProps) => console.log('Updated:', newProps)}
 * />
 * ```
 */
export const InteractableBOQTable = withInteractable<InteractableBOQTableProps>(
  BOQTable,
  'bim.BOQTable'
);

export default InteractableBOQTable;
