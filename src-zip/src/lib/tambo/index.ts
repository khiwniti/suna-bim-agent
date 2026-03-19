// src/lib/tambo/index.ts
/**
 * Tambo Integration - Main exports
 *
 * Unified Generative UI system for bidirectional state sync
 * between agent chat UI and workspace panels.
 */

export { tamboComponents } from './components';
export { tamboTools } from './tools';
export {
  ConfirmationCard,
  ChoiceCard,
  ParameterInputCard,
  hitlComponentRegistry,
  type ConfirmationCardProps,
  type ChoiceCardProps,
  type ParameterInputCardProps,
  type Choice,
  type Parameter,
  type HITLComponentName,
} from './hitl-components';
export {
  CarbonArtifactCard,
  ClashArtifactCard,
  BOQArtifactCard,
  carbonArtifactCardPropsSchema,
  clashArtifactCardPropsSchema,
  boqArtifactCardPropsSchema,
  type CarbonArtifactCardProps,
  type ClashArtifactCardProps,
  type BOQArtifactCardProps,
} from './artifact-cards';
export { tamboContextHelpers } from './context-helpers';
export {
  useTamboContextState,
  syncContextState,
  getContextStateSnapshot,
} from './context-state';
export * from './schemas';
