/**
 * Interactable Component Wrappers - Barrel Export
 *
 * All generative UI components wrapped with withInteractable HOC
 * for AI-driven prop updates via ComponentUpdateBus.
 *
 * These components can be updated in real-time by the AI agent
 * through the component_update streaming event.
 */

export {
  InteractableCarbonResultCard,
  type InteractableCarbonResultCardProps,
} from './InteractableCarbonResultCard';

export {
  InteractableClashResultCard,
  type InteractableClashResultCardProps,
} from './InteractableClashResultCard';

export {
  InteractableComplianceCard,
  type InteractableComplianceCardProps,
} from './InteractableComplianceCard';

export {
  InteractableBOQTable,
  type InteractableBOQTableProps,
} from './InteractableBOQTable';
