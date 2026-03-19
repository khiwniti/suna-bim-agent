/**
 * BIM Generative UI Catalog
 *
 * Registry of all generative UI components that can be rendered inline in chat
 * Pattern from: second-brain-research-dashboard A2UI system
 *
 * Includes both regular components and interactable versions:
 * - Regular: Static rendering (e.g., 'bim.CarbonResultCard')
 * - Interactable: AI-updateable via ComponentUpdateBus (e.g., 'bim.CarbonResult')
 */

import React from 'react';
import { ToolCallCard, ThinkingIndicator } from '@/components/generative-ui/ToolCallCard';
import { CarbonResultCard, CarbonSummary } from '@/components/generative-ui/CarbonResultCard';
import { ClashResultCard, ClashSummary } from '@/components/generative-ui/ClashResultCard';
import { ComplianceCard, ComplianceSummary } from '@/components/generative-ui/ComplianceCard';
import { ElementListCard, ElementSummary } from '@/components/generative-ui/ElementListCard';
import { BOQTable, BOQSummary } from '@/components/generative-ui/BOQTable';
import {
  InteractableCarbonResultCard,
  InteractableClashResultCard,
  InteractableComplianceCard,
  InteractableBOQTable,
} from '@/components/generative-ui/interactable';
import type { ComponentRenderer } from '@/lib/generative-ui/types';
import type { InteractableProps } from '@/lib/generative-ui/interactable';

/**
 * BIM Component Catalog
 * Maps component type strings to React component renderers
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Dynamic props for generative UI component catalog */
export const bimComponentCatalog: Record<string, ComponentRenderer> = {
  // ===== TOOL CALL COMPONENTS =====
  'bim.ToolCallCard': (props: any) => <ToolCallCard {...props} />,
  'bim.ThinkingIndicator': (props: any) => <ThinkingIndicator {...props} />,

  // ===== CARBON ANALYSIS COMPONENTS =====
  'bim.CarbonResultCard': (props: any) => <CarbonResultCard {...props} />,
  'bim.CarbonSummary': (props: any) => <CarbonSummary {...props} />,

  // ===== CLASH DETECTION COMPONENTS =====
  'bim.ClashResultCard': (props: any) => <ClashResultCard {...props} />,
  'bim.ClashSummary': (props: any) => <ClashSummary {...props} />,

  // ===== COMPLIANCE COMPONENTS =====
  'bim.ComplianceCard': (props: any) => <ComplianceCard {...props} />,
  'bim.ComplianceSummary': (props: any) => <ComplianceSummary {...props} />,

  // ===== ELEMENT LIST COMPONENTS =====
  'bim.ElementListCard': (props: any) => <ElementListCard {...props} />,
  'bim.ElementSummary': (props: any) => <ElementSummary {...props} />,

  // ===== BOQ / DATA COMPONENTS =====
  'bim.BOQTable': (props: any) => <BOQTable {...props} />,
  'bim.BOQSummary': (props: any) => <BOQSummary {...props} />,

  // ===== GENERIC TOOL RESULT =====
  'bim.ToolResultCard': (props: any) => <ToolCallCard {...props} />,

  // ===== CERTIFICATION COMPONENTS =====
  // Future: CertificationCard and BankEligibilityCard components planned for certification feature
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Interactable Component Catalog
 *
 * Components wrapped with withInteractable HOC for AI-driven updates.
 * These are used when the AI needs to update component props in real-time
 * via the component_update streaming event.
 *
 * Component types match schema definitions in schemas.ts:
 * - 'bim.CarbonResult' -> InteractableCarbonResultCard
 * - 'bim.ClashDetection' -> InteractableClashResultCard
 * - 'bim.ComplianceResult' -> InteractableComplianceCard
 * - 'bim.BOQTable' -> InteractableBOQTable
 */
export const interactableComponentCatalog: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.FC<InteractableProps<any>>
> = {
  'bim.CarbonResult': InteractableCarbonResultCard,
  'bim.ClashDetection': InteractableClashResultCard,
  'bim.ComplianceResult': InteractableComplianceCard,
  'bim.BOQTable': InteractableBOQTable,
};

/**
 * Get interactable component by type
 * Returns the withInteractable-wrapped version for AI-updateable components
 */
export function getInteractableComponent(
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): React.FC<InteractableProps<any>> | null {
  return interactableComponentCatalog[type] || null;
}

/**
 * Check if an interactable version exists for a component type
 */
export function hasInteractableVersion(type: string): boolean {
  return type in interactableComponentCatalog;
}

/**
 * Get component renderer by type
 */
export function getComponentRenderer(type: string): ComponentRenderer | null {
  return bimComponentCatalog[type] || null;
}

/**
 * Check if component type is registered
 */
export function isComponentRegistered(type: string): boolean {
  return type in bimComponentCatalog;
}

/**
 * Get all registered component types
 */
export function getRegisteredComponentTypes(): string[] {
  return Object.keys(bimComponentCatalog);
}

/**
 * Register a new component dynamically
 */
export function registerComponent(type: string, renderer: ComponentRenderer): void {
  bimComponentCatalog[type] = renderer;
}
