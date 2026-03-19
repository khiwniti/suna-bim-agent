/**
 * Generative UI Zod Schemas
 *
 * Schemas for component prop validation and AI tool generation.
 * All schemas include .describe() annotations for AI tool generation.
 */

import { z } from 'zod';
import type { ComponentZone } from './types';

// ============================================================================
// Carbon Analysis Schema
// ============================================================================

/**
 * Hotspot in carbon analysis - element with significant carbon footprint
 */
const carbonHotspotSchema = z.object({
  element: z.string().describe('Name or ID of the element'),
  carbon: z.number().min(0).describe('Carbon footprint in kgCO2e'),
  percentage: z.number().min(0).max(100).describe('Percentage of total carbon'),
});

/**
 * Carbon breakdown by lifecycle phase
 */
const carbonBreakdownSchema = z.object({
  materials: z.number().min(0).describe('Embodied carbon from materials (A1-A3)'),
  construction: z.number().min(0).describe('Carbon from construction process (A4-A5)'),
  transport: z.number().min(0).describe('Carbon from transportation'),
});

/**
 * Carbon analysis result schema
 */
export const carbonResultSchema = z
  .object({
    totalCarbon: z.number().min(0).describe('Total carbon footprint in kgCO2e'),
    unit: z.literal('kgCO2e').describe('Unit of measurement'),
    breakdown: carbonBreakdownSchema.describe('Carbon breakdown by lifecycle phase'),
    hotspots: z.array(carbonHotspotSchema).describe('Elements with highest carbon impact'),
    recommendations: z.array(z.string()).describe('Suggestions for carbon reduction'),
  })
  .describe('Carbon analysis result showing total carbon footprint, breakdown, hotspots, and recommendations');

// ============================================================================
// Clash Detection Schema
// ============================================================================

/**
 * Location in 3D space
 */
const locationSchema = z.object({
  x: z.number().describe('X coordinate'),
  y: z.number().describe('Y coordinate'),
  z: z.number().describe('Z coordinate'),
});

/**
 * Single clash between two elements
 */
const clashItemSchema = z.object({
  elementA: z.string().describe('ID of first clashing element'),
  elementB: z.string().describe('ID of second clashing element'),
  type: z.enum(['hard', 'soft', 'clearance']).describe('Type of clash'),
  distance: z.number().min(0).describe('Distance between elements in meters'),
  location: locationSchema.describe('Location of the clash in 3D space'),
});

/**
 * Severity breakdown of clashes
 */
const severitySchema = z.object({
  critical: z.number().min(0).describe('Number of critical clashes'),
  high: z.number().min(0).describe('Number of high severity clashes'),
  medium: z.number().min(0).describe('Number of medium severity clashes'),
  low: z.number().min(0).describe('Number of low severity clashes'),
});

/**
 * Clash detection result schema
 */
export const clashDetectionSchema = z
  .object({
    clashCount: z.number().min(0).describe('Total number of clashes detected'),
    severity: severitySchema.describe('Breakdown of clashes by severity level'),
    clashes: z.array(clashItemSchema).describe('List of individual clashes'),
  })
  .describe('Clash detection result showing count, severity breakdown, and individual clash details');

// ============================================================================
// Compliance Result Schema
// ============================================================================

/**
 * Individual compliance check result
 */
const complianceCheckSchema = z.object({
  rule: z.string().describe('Name or code of the compliance rule'),
  status: z.enum(['pass', 'fail', 'warning', 'pending']).describe('Status of the check'),
  details: z.string().describe('Detailed explanation of the check result'),
  severity: z.enum(['critical', 'high', 'medium', 'low']).describe('Severity of non-compliance'),
});

/**
 * Compliance result schema
 */
export const complianceResultSchema = z
  .object({
    standard: z.string().describe('Name of the compliance standard (e.g., IBC 2021, ASHRAE 90.1)'),
    overallStatus: z.enum(['pass', 'fail', 'warning', 'pending']).describe('Overall compliance status'),
    checkResults: z.array(complianceCheckSchema).describe('Results of individual compliance checks'),
  })
  .describe('Compliance check result showing standard, overall status, and individual check details');

// ============================================================================
// BOQ (Bill of Quantities) Schema
// ============================================================================

/**
 * Single BOQ item
 */
const boqItemSchema = z.object({
  id: z.string().describe('Unique identifier for the BOQ item'),
  category: z.string().describe('Category of the item (e.g., Concrete, Steel, MEP)'),
  description: z.string().describe('Detailed description of the item'),
  quantity: z.number().min(0).describe('Quantity of the item'),
  unit: z.string().describe('Unit of measurement (e.g., m³, kg, pcs)'),
  unitPrice: z.number().min(0).optional().describe('Price per unit'),
  totalPrice: z.number().min(0).optional().describe('Total price (quantity × unitPrice)'),
});

/**
 * BOQ summary
 */
const boqSummarySchema = z.object({
  totalItems: z.number().min(0).describe('Total number of items in BOQ'),
  totalCost: z.number().min(0).optional().describe('Total cost of all items'),
  currency: z.string().optional().describe('Currency code (e.g., USD, THB, EUR)'),
});

/**
 * BOQ result schema
 */
export const boqResultSchema = z
  .object({
    items: z.array(boqItemSchema).describe('List of BOQ items'),
    summary: boqSummarySchema.describe('Summary of the BOQ'),
  })
  .describe('BOQ (Bill of Quantities) result showing items, quantities, prices, and summary');

// ============================================================================
// Element List Schema
// ============================================================================

/**
 * BIM element properties
 */
const elementPropertiesSchema = z.record(z.union([z.string(), z.number()])).optional();

/**
 * Single BIM element
 */
const elementItemSchema = z.object({
  id: z.string().describe('Unique identifier for the element'),
  type: z.string().describe('IFC type of the element (e.g., IfcWall, IfcDoor)'),
  name: z.string().describe('Name of the element'),
  properties: elementPropertiesSchema.describe('Additional properties of the element'),
});

/**
 * Element list schema
 */
export const elementListSchema = z
  .object({
    elements: z.array(elementItemSchema).describe('List of BIM elements'),
    totalCount: z.number().min(0).describe('Total count of elements'),
  })
  .describe('List of BIM elements with their properties and total count');

// ============================================================================
// Tool Call Schema
// ============================================================================

/**
 * Tool call visualization schema
 */
export const toolCallSchema = z
  .object({
    toolName: z.string().describe('Name of the tool being called'),
    status: z.enum(['pending', 'running', 'success', 'error']).describe('Current status of the tool call'),
    input: z.record(z.any()).describe('Input parameters passed to the tool'),
    output: z.record(z.any()).optional().describe('Output from the tool (if completed)'),
    duration: z.number().min(0).optional().describe('Duration of the tool call in milliseconds'),
  })
  .describe('Tool call visualization showing tool name, status, inputs, outputs, and duration');

// ============================================================================
// Component Schemas Registry
// ============================================================================

/**
 * Registry entry for a component schema
 */
export interface ComponentSchemaEntry {
  schema: z.ZodSchema;
  description: string;
  zone: ComponentZone;
}

/**
 * Registry mapping component type strings to their schemas with descriptions and zones
 */
export const componentSchemas: Record<string, ComponentSchemaEntry> = {
  'bim.CarbonResult': {
    schema: carbonResultSchema,
    description: 'Displays carbon analysis results with breakdown, hotspots, and recommendations',
    zone: 'analysis',
  },
  'bim.ClashDetection': {
    schema: clashDetectionSchema,
    description: 'Shows clash detection results with severity breakdown and clash details',
    zone: 'analysis',
  },
  'bim.ComplianceResult': {
    schema: complianceResultSchema,
    description: 'Displays compliance check results against building codes and standards',
    zone: 'analysis',
  },
  'bim.BOQTable': {
    schema: boqResultSchema,
    description: 'Shows Bill of Quantities table with items, quantities, and costs',
    zone: 'data',
  },
  'bim.ElementList': {
    schema: elementListSchema,
    description: 'Lists BIM elements with their properties and metadata',
    zone: 'model',
  },
  'bim.ToolCall': {
    schema: toolCallSchema,
    description: 'Visualizes tool execution status, inputs, and outputs',
    zone: 'tool-call',
  },
};

// ============================================================================
// Type exports for use in other modules
// ============================================================================

export type CarbonResultProps = z.infer<typeof carbonResultSchema>;
export type ClashDetectionProps = z.infer<typeof clashDetectionSchema>;
export type ComplianceResultProps = z.infer<typeof complianceResultSchema>;
export type BOQResultProps = z.infer<typeof boqResultSchema>;
export type ElementListProps = z.infer<typeof elementListSchema>;
export type ToolCallProps = z.infer<typeof toolCallSchema>;
