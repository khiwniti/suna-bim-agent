/**
 * Tambo Panel Schemas
 *
 * Zod schemas for all workspace panels. These define the prop structure
 * that Tambo uses to understand and update each panel.
 */

import { z } from 'zod';

// ============================================
// Carbon Dashboard
// ============================================

export const CarbonDashboardSchema = z.object({
  totalCarbon: z.number().optional().describe('Total carbon footprint in kgCO2e'),
  unit: z.string().optional().describe('Unit of measurement'),
  materialBreakdown: z
    .array(
      z.object({
        name: z.string(),
        value: z.number(),
        percentage: z.number().optional(),
      })
    )
    .optional()
    .describe('Carbon by material type'),
  categoryBreakdown: z
    .array(
      z.object({
        category: z.string(),
        value: z.number(),
      })
    )
    .optional()
    .describe('Carbon by building category'),
  recommendations: z.array(z.string()).optional().describe('Sustainability recommendations'),
});

export type CarbonDashboardProps = z.infer<typeof CarbonDashboardSchema>;

// ============================================
// BOQ Table
// ============================================

export const BOQTableSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        item: z.string(),
        description: z.string(),
        quantity: z.number(),
        unit: z.string(),
        unitCost: z.number(),
        totalCost: z.number(),
      })
    )
    .optional()
    .describe('Bill of quantities line items'),
  totalCost: z.number().optional().describe('Total project cost'),
  currency: z.string().optional().describe('Currency code (USD, THB, etc.)'),
});

export type BOQTableProps = z.infer<typeof BOQTableSchema>;

// ============================================
// Clash Report
// ============================================

export const ClashReportSchema = z.object({
  clashes: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        severity: z.enum(['critical', 'major', 'minor']),
        elements: z.array(z.string()),
        description: z.string(),
        status: z.enum(['open', 'resolved', 'ignored']).optional(),
      })
    )
    .optional()
    .describe('Detected clash items'),
  summary: z
    .object({
      total: z.number(),
      critical: z.number(),
      major: z.number(),
      minor: z.number(),
    })
    .optional()
    .describe('Clash count summary'),
});

export type ClashReportProps = z.infer<typeof ClashReportSchema>;

// ============================================
// Floor Plan Viewer
// ============================================

export const FloorPlanViewerSchema = z.object({
  imageUrl: z.string().optional().describe('Floor plan image URL'),
  floorLevel: z.string().optional().describe('Floor level name'),
  annotations: z
    .array(
      z.object({
        id: z.string(),
        x: z.number(),
        y: z.number(),
        label: z.string(),
      })
    )
    .optional()
    .describe('Floor plan annotations'),
  scale: z.number().optional().describe('Display scale factor'),
});

export type FloorPlanViewerProps = z.infer<typeof FloorPlanViewerSchema>;

// ============================================
// Document Editor
// ============================================

export const DocumentEditorSchema = z.object({
  content: z.string().optional().describe('Document content (markdown/text)'),
  title: z.string().optional().describe('Document title'),
  sections: z
    .array(
      z.object({
        id: z.string(),
        heading: z.string(),
        content: z.string(),
      })
    )
    .optional()
    .describe('Document sections'),
});

export type DocumentEditorProps = z.infer<typeof DocumentEditorSchema>;

// ============================================
// BIM Viewer
// ============================================

export const BIMViewerSchema = z.object({
  modelId: z.string().optional().describe('Currently loaded IFC model ID'),
  highlightedIds: z.array(z.string()).optional().describe('Currently highlighted element IDs'),
  isolatedIds: z.array(z.string()).optional().describe('Currently isolated element IDs'),
  selectedId: z.string().optional().describe('User-selected element ID'),
  viewPreset: z
    .enum(['top', 'front', 'side', 'isometric', 'custom'])
    .optional()
    .describe('Camera view preset'),
});

export type BIMViewerProps = z.infer<typeof BIMViewerSchema>;
