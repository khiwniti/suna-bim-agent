/**
 * Generative UI System Exports
 *
 * Central export point for all generative UI components, schemas, and utilities.
 * This module provides the public API surface for the generative UI system.
 */

// ============================================================================
// Core Types
// ============================================================================

export * from './types';

// ============================================================================
// Zod Schemas for AI Tool Generation
// ============================================================================

export {
  // Component prop schemas
  carbonResultSchema,
  clashDetectionSchema,
  complianceResultSchema,
  boqResultSchema,
  elementListSchema,
  toolCallSchema,
  // Schema registry
  componentSchemas,
  // Schema entry type
  type ComponentSchemaEntry,
  // Inferred prop types
  type CarbonResultProps,
  type ClashDetectionProps,
  type ComplianceResultProps,
  type BOQResultProps,
  type ElementListProps,
  type ToolCallProps,
} from './schemas';

// ============================================================================
// Component Update Bus (Targeted Prop Updates)
// ============================================================================

export {
  ComponentUpdateBus,
  componentUpdateBus,
  type ComponentUpdate,
  type UpdateAction,
  type UpdateCallback,
} from './update-bus';

// ============================================================================
// Component Registry (Instance Tracking)
// ============================================================================

export {
  ComponentRegistry,
  componentRegistry,
  type ComponentInstance,
  type RegistryChangeCallback,
} from './registry';

// ============================================================================
// Interactable HOC (AI-Updateable Components)
// ============================================================================

export {
  withInteractable,
  useInteractable,
  type InteractableProps,
  type WithInteractableOptions,
} from './interactable';

// ============================================================================
// Panel Control Tools for AI
// ============================================================================

export {
  // Tool schemas
  activatePanelSchema,
  enableTabSchema,
  updatePanelDataSchema,
  exportPanelSchema,
  // Tool registry
  panelTools,
  // Constants
  PANEL_IDS,
  EXPORT_FORMATS,
  // Tool entry type
  type PanelToolEntry,
  // Type exports
  type PanelId,
  type ExportFormat,
  type ActivatePanelInput,
  type EnableTabInput,
  type UpdatePanelDataInput,
  type ExportPanelInput,
} from './panel-tools';

// ============================================================================
// Component Catalog & Renderer
// ============================================================================

export {
  // Regular component catalog
  bimComponentCatalog,
  // Interactable component catalog
  interactableComponentCatalog,
  // Component lookup functions
  getComponentRenderer,
  getInteractableComponent,
  isComponentRegistered,
  hasInteractableVersion,
  getRegisteredComponentTypes,
  registerComponent,
} from './catalog';

// ============================================================================
// React Components (Re-exports)
// ============================================================================

export { GenerativeUIRenderer, GenerativeUIRendererList } from '@/components/generative-ui/GenerativeUIRenderer';

// BIM-Specific Components
export { ToolCallCard, ThinkingIndicator } from '@/components/generative-ui/ToolCallCard';
export { CarbonResultCard, CarbonSummary } from '@/components/generative-ui/CarbonResultCard';
export { ClashResultCard, ClashSummary } from '@/components/generative-ui/ClashResultCard';
export { ComplianceCard, ComplianceSummary } from '@/components/generative-ui/ComplianceCard';
export { ElementListCard, ElementSummary } from '@/components/generative-ui/ElementListCard';
export { BOQTable, BOQSummary } from '@/components/generative-ui/BOQTable';

// Interactable Component Wrappers
export {
  InteractableCarbonResultCard,
  InteractableClashResultCard,
  InteractableComplianceCard,
  InteractableBOQTable,
} from '@/components/generative-ui/interactable';

// Backwards compatibility alias (componentCatalog → bimComponentCatalog)
export { bimComponentCatalog as componentCatalog } from './catalog';
