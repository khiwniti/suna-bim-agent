/**
 * Panel Control Tools for AI
 *
 * Zod-based tool definitions that AI can use to control panels.
 * All schemas include .describe() annotations for AI tool generation.
 */

import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

/**
 * All available panel IDs in the BIM Agent UI
 */
export const PANEL_IDS = [
  '3d-viewer',
  'boq-table',
  'carbon-dashboard',
  'floorplan-viewer',
  'document-editor',
  'clash-report',
] as const;

/**
 * All available export formats
 */
export const EXPORT_FORMATS = ['pdf', 'excel', 'json'] as const;

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Valid panel ID type
 */
export type PanelId = (typeof PANEL_IDS)[number];

/**
 * Valid export format type
 */
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

// ============================================================================
// Tool Schemas
// ============================================================================

/**
 * Schema for activating and switching to a specific panel
 */
export const activatePanelSchema = z
  .object({
    panelId: z
      .enum(PANEL_IDS)
      .describe('ID of the panel to activate'),
    autoExpand: z
      .boolean()
      .optional()
      .describe('Whether to expand the panel after activation'),
  })
  .describe('Activate and switch to a specific panel');

/**
 * Schema for enabling a previously disabled panel tab
 */
export const enableTabSchema = z
  .object({
    tabId: z
      .enum(PANEL_IDS)
      .describe('ID of the tab to enable'),
  })
  .describe('Enable a previously disabled panel tab');

/**
 * Schema for updating data displayed in a panel
 */
export const updatePanelDataSchema = z
  .object({
    panelId: z
      .enum(PANEL_IDS)
      .describe('ID of the panel to update'),
    data: z
      .record(z.unknown())
      .describe('Data to update in the panel'),
  })
  .describe('Update data displayed in a panel');

/**
 * Schema for exporting panel data to a file
 */
export const exportPanelSchema = z
  .object({
    panelId: z
      .enum(PANEL_IDS)
      .optional()
      .describe('ID of the panel to export (optional, defaults to current panel)'),
    format: z
      .enum(EXPORT_FORMATS)
      .describe('Export format'),
  })
  .describe('Export panel data to a file');

// ============================================================================
// Tool Registry Entry Type
// ============================================================================

/**
 * Registry entry for a panel control tool
 */
export interface PanelToolEntry {
  schema: z.ZodSchema;
  description: string;
}

// ============================================================================
// Tool Registry
// ============================================================================

/**
 * Registry of all panel control tools for AI
 */
export const panelTools: Record<string, PanelToolEntry> = {
  activate_panel: {
    schema: activatePanelSchema,
    description: 'Activate and switch to a specific panel',
  },
  enable_tab: {
    schema: enableTabSchema,
    description: 'Enable a previously disabled panel tab',
  },
  update_panel_data: {
    schema: updatePanelDataSchema,
    description: 'Update data displayed in a panel',
  },
  export_panel: {
    schema: exportPanelSchema,
    description: 'Export panel data to a file',
  },
};

// ============================================================================
// Type Exports for Inferred Types
// ============================================================================

/**
 * Type for activate_panel tool input
 */
export type ActivatePanelInput = z.infer<typeof activatePanelSchema>;

/**
 * Type for enable_tab tool input
 */
export type EnableTabInput = z.infer<typeof enableTabSchema>;

/**
 * Type for update_panel_data tool input
 */
export type UpdatePanelDataInput = z.infer<typeof updatePanelDataSchema>;

/**
 * Type for export_panel tool input
 */
export type ExportPanelInput = z.infer<typeof exportPanelSchema>;
