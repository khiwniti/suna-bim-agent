/**
 * Tambo Tools
 *
 * Tools that the AI can invoke via Tambo. These enable:
 * - Viewport control (highlight, isolate, zoom, camera presets)
 * - BIM analysis (carbon, BOQ, clash detection, element queries)
 *
 * Each tool is defined with:
 * - name: Snake_case identifier for the AI
 * - description: What the tool does (used by AI for routing)
 * - inputSchema: Zod schema for input validation
 * - outputSchema: Zod schema for output typing
 * - tool: The function that executes the tool logic
 */

import { z } from 'zod';
import { defineTool } from '@tambo-ai/react';
import { useBIMStore } from '@/stores/bim-store';
import { usePanelStore } from '@/stores/panel-store';
import { panelEventBus } from '@/lib/panel/event-bus';
import { useAnalysisResultsStore } from '@/stores/analysis-results-store';

// ============================================
// Tool Type Definition (compatible with Tambo)
// ============================================

// Using Tambo's defineTool helper for proper type inference and schema conversion

// ============================================
// Viewport Tools
// ============================================

/**
 * Highlight elements in the 3D viewer.
 * Makes specified elements visually prominent without hiding others.
 */
export const highlightElementsTool = defineTool({
  name: 'highlight_elements',
  description:
    'Highlight specific BIM elements in the 3D viewer. Highlighted elements become visually prominent. Use this to draw attention to elements when discussing them.',
  inputSchema: z.object({
    elementIds: z
      .array(z.string())
      .describe('Array of element IDs to highlight in the viewer'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    highlightedCount: z.number(),
    message: z.string().optional(),
  }),
  tool: async ({ elementIds }) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tambo Tool] highlight_elements called:', { elementIds });
    }

    const store = useBIMStore.getState();

    if (process.env.NODE_ENV === 'development') {
      console.log('[Tambo Tool] highlight_elements store before:', {
        pendingCommandsCount: store.pendingCommands?.length ?? 0,
        selectedIdsCount: store.selection?.selectedIds?.length ?? 0,
      });
    }

    // Also update selection state for other subscribers
    store.selectElements(elementIds);
    // Send command to viewer via pendingCommands queue
    store.addPendingCommand({
      type: 'highlight',
      data: { elementIds },
    });

    if (process.env.NODE_ENV === 'development') {
      const updatedStore = useBIMStore.getState();
      console.log('[Tambo Tool] highlight_elements store after:', {
        pendingCommandsCount: updatedStore.pendingCommands?.length ?? 0,
        selectedIdsCount: updatedStore.selection?.selectedIds?.length ?? 0,
      });
    }

    return {
      success: true,
      highlightedCount: elementIds.length,
      message:
        elementIds.length > 0
          ? `Highlighted ${elementIds.length} element(s)`
          : 'Cleared all highlights',
    };
  },
});

/**
 * Isolate elements in the 3D viewer.
 * Shows only specified elements, hiding all others.
 */
export const isolateElementsTool = defineTool({
  name: 'isolate_elements',
  description:
    'Isolate specific BIM elements in the 3D viewer. Only isolated elements will be visible, all others are hidden. Use this to focus on specific elements without distractions.',
  inputSchema: z.object({
    elementIds: z
      .array(z.string())
      .describe('Array of element IDs to isolate (show only these)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    isolatedCount: z.number(),
    message: z.string().optional(),
  }),
  tool: async ({ elementIds }) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tambo Tool] isolate_elements called:', { elementIds });
    }

    const store = useBIMStore.getState();

    if (process.env.NODE_ENV === 'development') {
      console.log('[Tambo Tool] isolate_elements store before:', {
        pendingCommandsCount: store.pendingCommands?.length ?? 0,
        isolatedIdsCount: store.selection?.isolatedIds?.length ?? 0,
      });
    }

    // Also update selection state for other subscribers
    store.isolateElements(elementIds);
    // Send command to viewer via pendingCommands queue
    store.addPendingCommand({
      type: 'isolate',
      data: { elementIds },
    });

    if (process.env.NODE_ENV === 'development') {
      const updatedStore = useBIMStore.getState();
      console.log('[Tambo Tool] isolate_elements store after:', {
        pendingCommandsCount: updatedStore.pendingCommands?.length ?? 0,
        isolatedIdsCount: updatedStore.selection?.isolatedIds?.length ?? 0,
      });
    }

    return {
      success: true,
      isolatedCount: elementIds.length,
      message: `Isolated ${elementIds.length} element(s)`,
    };
  },
});

/**
 * Zoom the camera to fit specified elements.
 */
export const zoomToElementsTool = defineTool({
  name: 'zoom_to_elements',
  description:
    'Zoom the 3D camera to fit specified elements in view. The camera will move to frame the elements. Use this after highlighting or isolating to ensure elements are visible.',
  inputSchema: z.object({
    elementIds: z
      .array(z.string())
      .describe('Array of element IDs to zoom to'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string().optional(),
  }),
  tool: async ({ elementIds }) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tambo Tool] zoom_to_elements called:', { elementIds });
    }

    const store = useBIMStore.getState();

    if (process.env.NODE_ENV === 'development') {
      console.log('[Tambo Tool] zoom_to_elements store before:', {
        pendingCommandsCount: store.pendingCommands?.length ?? 0,
      });
    }

    // Send command to viewer via pendingCommands queue
    store.addPendingCommand({
      type: 'zoomTo',
      data: { elementIds },
    });

    if (process.env.NODE_ENV === 'development') {
      const updatedStore = useBIMStore.getState();
      console.log('[Tambo Tool] zoom_to_elements store after:', {
        pendingCommandsCount: updatedStore.pendingCommands?.length ?? 0,
      });
    }

    return {
      success: true,
      message: `Zooming to ${elementIds.length} element(s)`,
    };
  },
});

/**
 * Set camera to a preset view angle.
 */
export const setViewPresetTool = defineTool({
  name: 'set_view_preset',
  description:
    'Set the 3D camera to a preset view angle. Available presets: top (plan view), front (front elevation), side (side elevation), isometric (3D angled view). Use this to show the model from standard architectural viewpoints.',
  inputSchema: z.object({
    preset: z
      .enum(['top', 'front', 'side', 'isometric'])
      .describe('The camera preset to apply'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    viewPreset: z.string(),
    message: z.string().optional(),
  }),
  tool: async ({ preset }) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tambo Tool] set_view_preset called:', { preset });
    }

    const store = useBIMStore.getState();

    if (process.env.NODE_ENV === 'development') {
      console.log('[Tambo Tool] set_view_preset store before:', {
        pendingCommandsCount: store.pendingCommands?.length ?? 0,
      });
    }

    // Send command to viewer via pendingCommands queue
    store.addPendingCommand({
      type: 'setView',
      data: { preset },
    });

    if (process.env.NODE_ENV === 'development') {
      const updatedStore = useBIMStore.getState();
      console.log('[Tambo Tool] set_view_preset store after:', {
        pendingCommandsCount: updatedStore.pendingCommands?.length ?? 0,
      });
    }

    return {
      success: true,
      viewPreset: preset,
      message: `Camera set to ${preset} view`,
    };
  },
});

/**
 * Clear all viewer state (highlights, isolation).
 */
export const clearViewerStateTool = defineTool({
  name: 'clear_viewer_state',
  description:
    'Clear all viewer state including highlights and isolation. Shows all elements normally. Use this to reset the viewer after focusing on specific elements.',
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string().optional(),
  }),
  tool: async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tambo Tool] clear_viewer_state called');
    }

    const store = useBIMStore.getState();

    if (process.env.NODE_ENV === 'development') {
      console.log('[Tambo Tool] clear_viewer_state store before:', {
        pendingCommandsCount: store.pendingCommands?.length ?? 0,
        selectedIdsCount: store.selection?.selectedIds?.length ?? 0,
        isolatedIdsCount: store.selection?.isolatedIds?.length ?? 0,
      });
    }

    // Clear selection state
    store.selectElements([]);
    store.showAllElements();
    // Send command to viewer via pendingCommands queue
    store.addPendingCommand({
      type: 'showAll',
      data: {},
    });

    if (process.env.NODE_ENV === 'development') {
      const updatedStore = useBIMStore.getState();
      console.log('[Tambo Tool] clear_viewer_state store after:', {
        pendingCommandsCount: updatedStore.pendingCommands?.length ?? 0,
        selectedIdsCount: updatedStore.selection?.selectedIds?.length ?? 0,
        isolatedIdsCount: updatedStore.selection?.isolatedIds?.length ?? 0,
      });
    }

    return {
      success: true,
      message: 'Viewer state cleared',
    };
  },
});

// ============================================
// BIM Analysis Tools
// ============================================

/**
 * Analyze embodied carbon emissions.
 *
 * ★ Insight: This tool transforms API response to match CarbonArtifactCard schema.
 * API returns: { totalCarbon, materials[], categories[] }
 * Component expects: { totalCarbon, breakdown: { materials, construction, transport }, hotspots[], recommendations[] }
 */
export const analyzeCarbonTool = defineTool({
  name: 'analyze_carbon',
  description:
    'Analyze embodied carbon emissions for the BIM model. Returns total carbon footprint, material breakdown, and category breakdown. Use this for sustainability analysis and LEED/BREEAM compliance.',
  inputSchema: z.object({
    modelId: z
      .string()
      .optional()
      .describe('Model ID to analyze. Uses current model if not specified.'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    // Output schema matches CarbonArtifactCard props for direct rendering
    totalCarbon: z.number().optional(),
    unit: z.literal('kgCO2e').optional(),
    breakdown: z.object({
      materials: z.number(),
      construction: z.number(),
      transport: z.number(),
    }).optional(),
    hotspots: z.array(z.object({
      element: z.string(),
      carbon: z.number(),
      percentage: z.number(),
    })).optional(),
    recommendations: z.array(z.string()).optional(),
    error: z.string().optional(),
  }),
  tool: async ({ modelId }) => {
    console.log('[Tambo Tool] analyze_carbon called:', { modelId });
    const store = useBIMStore.getState();
    const targetModelId = modelId || store.currentModel?.id;

    if (!targetModelId) {
      return {
        success: false,
        error: 'No model loaded. Please load a BIM model first.',
      };
    }

    try {
      const response = await fetch(`/api/bim/carbon/${targetModelId}`);

      if (!response.ok) {
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`,
        };
      }

      // API returns: { totalCarbon, unit, materials[], categories[], modelId, generatedAt }
      const apiData = await response.json() as {
        totalCarbon: number;
        unit: string;
        materials: Array<{ name: string; carbon: number; percentage: number }>;
        categories: Array<{ category: string; carbon: number }>;
      };

      // Transform API response to match CarbonArtifactCard expected format
      // Map categories to breakdown structure
      const categoryMap = new Map(apiData.categories.map(c => [c.category.toLowerCase(), c.carbon]));
      const materialsTotal = apiData.materials.reduce((sum, m) => sum + m.carbon, 0);

      const breakdown = {
        materials: materialsTotal,
        construction: categoryMap.get('structure') || categoryMap.get('facade') || Math.round(apiData.totalCarbon * 0.2),
        transport: categoryMap.get('mep') || Math.round(apiData.totalCarbon * 0.1),
      };

      // Generate hotspots from top materials
      const hotspots = apiData.materials
        .sort((a, b) => b.carbon - a.carbon)
        .slice(0, 3)
        .map(m => ({
          element: m.name,
          carbon: m.carbon,
          percentage: m.percentage,
        }));

      // Generate recommendations based on analysis
      const recommendations = [
        `Consider low-carbon concrete alternatives to reduce ${apiData.materials[0]?.name || 'concrete'} emissions`,
        'Use recycled steel to lower embodied carbon by 30-50%',
        'Optimize structural design to reduce material quantities',
      ];

      // Auto-push to panel: Update carbon dashboard with analysis data
      panelEventBus.publish('chat', {
        type: 'UPDATE_PANEL_DATA',
        panelId: 'carbon-dashboard',
        data: {
          totalCarbon: apiData.totalCarbon,
          unit: 'kgCO2e',
          breakdown,
          hotspots,
          recommendations,
        },
      });

      // Auto-push to panel: Activate carbon dashboard panel
      panelEventBus.publish('chat', {
        type: 'ACTIVATE_PANEL',
        panelId: 'carbon-dashboard',
        autoExpand: true,
      });

      // Write results to analysis-results-store (single source of truth)
      useAnalysisResultsStore.getState().setCarbonResults({
        totalCarbon: apiData.totalCarbon,
        unit: 'kgCO2e',
        breakdown,
        hotspots,
        recommendations,
      });

      return {
        success: true,
        totalCarbon: apiData.totalCarbon,
        unit: 'kgCO2e' as const,
        breakdown,
        hotspots,
        recommendations,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Generate Bill of Quantities.
 */
export const generateBOQTool = defineTool({
  name: 'generate_boq',
  description:
    'Generate a Bill of Quantities (BOQ) for the BIM model. Returns itemized quantities, costs, and totals. Use this for cost estimation and procurement planning.',
  inputSchema: z.object({
    modelId: z
      .string()
      .optional()
      .describe('Model ID to analyze. Uses current model if not specified.'),
    category: z
      .string()
      .optional()
      .describe('Filter by category (e.g., "structure", "mep", "finishes")'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z
      .object({
        items: z.array(z.object({
          id: z.string(),
          item: z.string(),
          description: z.string(),
          quantity: z.number(),
          unit: z.string(),
          unitCost: z.number(),
          totalCost: z.number(),
        })).optional(),
        totalCost: z.number().optional(),
        currency: z.string().optional(),
      })
      .optional(),
    error: z.string().optional(),
  }),
  tool: async ({ modelId, category }) => {
    console.log('[Tambo Tool] generate_boq called:', { modelId, category });
    const store = useBIMStore.getState();
    const targetModelId = modelId || store.currentModel?.id;

    if (!targetModelId) {
      return {
        success: false,
        error: 'No model loaded. Please load a BIM model first.',
      };
    }

    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);

      const url = `/api/bim/boq/${targetModelId}${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json() as {
        items: Array<{
          id: string;
          item: string;
          description: string;
          quantity: number;
          unit: string;
          unitCost: number;
          totalCost: number;
        }>;
        totalCost: number;
        currency: string;
      };

      // Auto-push to panel: Update BOQ table with generated data
      panelEventBus.publish('chat', {
        type: 'UPDATE_PANEL_DATA',
        panelId: 'boq-table',
        data: {
          items: data.items,
          totalCost: data.totalCost,
          currency: data.currency || 'THB',
        },
      });

      // Auto-push to panel: Activate BOQ table panel
      panelEventBus.publish('chat', {
        type: 'ACTIVATE_PANEL',
        panelId: 'boq-table',
        autoExpand: true,
      });

      // Write results to analysis-results-store (single source of truth)
      useAnalysisResultsStore.getState().setBOQResults({
        items: data.items.map(item => ({
          ...item,
          category: item.description || 'Uncategorized',
        })),
        totalCost: data.totalCost,
        currency: data.currency || 'THB',
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Detect clashes between elements.
 */
export const detectClashesTool = defineTool({
  name: 'detect_clashes',
  description:
    'Detect geometric clashes between BIM elements. Returns clash locations, severity, and involved elements. Use this for coordination and quality assurance.',
  inputSchema: z.object({
    modelId: z
      .string()
      .optional()
      .describe('Model ID to analyze. Uses current model if not specified.'),
    disciplines: z
      .array(z.string())
      .optional()
      .describe('Filter by disciplines (e.g., ["mep", "structural"])'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z
      .object({
        clashes: z.array(z.object({
          id: z.string(),
          type: z.string(),
          severity: z.enum(['critical', 'major', 'minor']),
          elements: z.array(z.string()),
          description: z.string(),
          status: z.enum(['open', 'resolved', 'ignored']).optional(),
        })).optional(),
        summary: z.object({
          total: z.number(),
          critical: z.number(),
          major: z.number(),
          minor: z.number(),
        }).optional(),
      })
      .optional(),
    error: z.string().optional(),
  }),
  tool: async ({ modelId, disciplines }) => {
    console.log('[Tambo Tool] detect_clashes called:', { modelId, disciplines });
    const store = useBIMStore.getState();
    const targetModelId = modelId || store.currentModel?.id;

    if (!targetModelId) {
      return {
        success: false,
        error: 'No model loaded. Please load a BIM model first.',
      };
    }

    try {
      const params = new URLSearchParams();
      if (disciplines?.length) params.append('disciplines', disciplines.join(','));

      const url = `/api/bim/clash/${targetModelId}${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json() as {
        clashes: Array<{
          id: string;
          type: string;
          severity: 'critical' | 'major' | 'minor';
          elements: string[];
          description: string;
          status?: 'open' | 'resolved' | 'ignored';
        }>;
        summary: {
          total: number;
          critical: number;
          major: number;
          minor: number;
        };
      };

      // Auto-push to panel: Update clash report with detection data
      panelEventBus.publish('chat', {
        type: 'UPDATE_PANEL_DATA',
        panelId: 'clash-report',
        data: {
          clashes: data.clashes,
          summary: data.summary,
        },
      });

      // Auto-push to panel: Activate clash report panel
      panelEventBus.publish('chat', {
        type: 'ACTIVATE_PANEL',
        panelId: 'clash-report',
        autoExpand: true,
      });

      // Write results to analysis-results-store (single source of truth)
      // Map severity values from API (critical/major/minor) to store format (critical/high/medium/low)
      useAnalysisResultsStore.getState().setClashResults({
        clashes: data.clashes.map(clash => ({
          id: clash.id,
          elements: clash.elements,
          type: clash.type,
          // Map API severity to store severity
          severity: clash.severity === 'major' ? 'high' : clash.severity === 'minor' ? 'medium' : clash.severity as 'critical' | 'high' | 'medium' | 'low',
          status: clash.status,
        })),
        summary: {
          total: data.summary.total,
          critical: data.summary.critical,
          high: data.summary.major,
          medium: data.summary.minor,
          low: 0,
        },
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Query elements by type, floor, or material.
 */
export const queryElementsTool = defineTool({
  name: 'query_elements',
  description:
    'Query BIM elements by type, floor, or material. Returns matching elements with properties. Use this to find specific elements before highlighting or analyzing them.',
  inputSchema: z.object({
    modelId: z
      .string()
      .optional()
      .describe('Model ID to query. Uses current model if not specified.'),
    elementType: z
      .string()
      .optional()
      .describe('Filter by IFC type (e.g., "IfcWall", "IfcBeam", "IfcDoor")'),
    floor: z.string().optional().describe('Filter by floor/level name'),
    material: z.string().optional().describe('Filter by material name'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z
      .object({
        elements: z.array(z.object({
          id: z.string(),
          type: z.string(),
          name: z.string().optional(),
          floor: z.string().optional(),
          material: z.string().optional(),
        })).optional(),
        count: z.number().optional(),
      })
      .optional(),
    error: z.string().optional(),
  }),
  tool: async ({ modelId, elementType, floor, material }) => {
    console.log('[Tambo Tool] query_elements called:', { modelId, elementType, floor, material });
    const store = useBIMStore.getState();
    const targetModelId = modelId || store.currentModel?.id;

    if (!targetModelId) {
      return {
        success: false,
        error: 'No model loaded. Please load a BIM model first.',
      };
    }

    try {
      const params = new URLSearchParams();
      if (elementType) params.append('type', elementType);
      if (floor) params.append('floor', floor);
      if (material) params.append('material', material);

      const url = `/api/bim/query/${targetModelId}${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

// ============================================
// Panel Control Tools
// ============================================

/**
 * Available panel IDs that can be activated
 */
const PANEL_IDS = [
  '3d-viewer',
  'boq-table',
  'carbon-dashboard',
  'floorplan-viewer',
  'document-editor',
  'clash-report',
] as const;

/**
 * Activate and switch to a specific panel.
 * Use this to show relevant panels when discussing specific topics.
 */
export const activatePanelTool = defineTool({
  name: 'activate_panel',
  description:
    'Activate and switch to a specific panel. Use this when discussing specific analysis (carbon → carbon-dashboard, quantities → boq-table, 3D view → 3d-viewer, clashes → clash-report, floor plans → floorplan-viewer, documents → document-editor).',
  inputSchema: z.object({
    panelId: z
      .enum(PANEL_IDS)
      .describe('ID of the panel to activate: 3d-viewer, boq-table, carbon-dashboard, floorplan-viewer, document-editor, clash-report'),
    autoExpand: z
      .boolean()
      .optional()
      .describe('Whether to expand the panel (default: true)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    panelId: z.string(),
    message: z.string().optional(),
  }),
  tool: async ({ panelId, autoExpand = true }) => {
    console.log('[Tambo Tool] activate_panel called:', { panelId, autoExpand });
    try {
      const panelStore = usePanelStore.getState();

      // Enable the tab if not already enabled
      panelStore.enableTab(panelId);

      // Set as active tab
      panelStore.setActiveTab(panelId);

      // Emit panel activation event for other listeners
      panelEventBus.publish('chat', {
        type: 'ACTIVATE_PANEL',
        panelId,
        autoExpand,
      });

      return {
        success: true,
        panelId,
        message: `Activated ${panelId} panel`,
      };
    } catch (error) {
      return {
        success: false,
        panelId,
        message: error instanceof Error ? error.message : 'Failed to activate panel',
      };
    }
  },
});

/**
 * Update data displayed in a panel.
 * Use this to send analysis results or data to a specific panel.
 */
export const updatePanelDataTool = defineTool({
  name: 'update_panel_data',
  description:
    'Update the data displayed in a specific panel. Use this to send analysis results, BOQ data, or other content to panels for visualization.',
  inputSchema: z.object({
    panelId: z
      .enum(PANEL_IDS)
      .describe('ID of the panel to update'),
    dataJson: z
      .string()
      .describe('JSON-stringified data object to send to the panel'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    panelId: z.string(),
    message: z.string().optional(),
  }),
  tool: async ({ panelId, dataJson }) => {
    console.log('[Tambo Tool] update_panel_data called:', { panelId, dataJson: dataJson.substring(0, 100) });
    try {
      const panelStore = usePanelStore.getState();

      // Parse JSON data
      const data = JSON.parse(dataJson) as Record<string, unknown>;
      console.log('[Tambo Tool] update_panel_data parsed data:', data);

      // Update panel data in store
      panelStore.updatePanelData(panelId, data);
      console.log('[Tambo Tool] update_panel_data store updated');

      // Emit update event
      panelEventBus.publish('chat', {
        type: 'UPDATE_PANEL_DATA',
        panelId,
        data,
      });
      console.log('[Tambo Tool] update_panel_data event published');

      return {
        success: true,
        panelId,
        message: `Updated ${panelId} panel with new data`,
      };
    } catch (error) {
      console.error('[Tambo Tool] update_panel_data error:', error);
      return {
        success: false,
        panelId,
        message: error instanceof Error ? error.message : 'Failed to update panel data',
      };
    }
  },
});

/**
 * Show analysis results in the appropriate panel.
 * Combines activating a panel and updating its data.
 */
export const showAnalysisResultsTool = defineTool({
  name: 'show_analysis_results',
  description:
    'Show analysis results in the appropriate panel. Automatically activates the correct panel and displays the data. Use this after completing an analysis.',
  inputSchema: z.object({
    analysisType: z
      .enum(['carbon', 'boq', 'clash', 'query'])
      .describe('Type of analysis: carbon, boq, clash, or query'),
    dataJson: z
      .string()
      .describe('JSON-stringified analysis results data to display'),
    highlightElements: z
      .array(z.string())
      .optional()
      .describe('Element IDs to highlight in the 3D viewer'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    panelId: z.string(),
    highlightedCount: z.number().optional(),
    message: z.string().optional(),
  }),
  tool: async ({ analysisType, dataJson, highlightElements }) => {
    console.log('[Tambo Tool] show_analysis_results called:', { analysisType, highlightElements });
    try {
      const panelStore = usePanelStore.getState();
      const bimStore = useBIMStore.getState();

      // Parse JSON data
      const data = JSON.parse(dataJson) as Record<string, unknown>;

      // Map analysis type to panel ID
      const panelMap: Record<string, typeof PANEL_IDS[number]> = {
        carbon: 'carbon-dashboard',
        boq: 'boq-table',
        clash: 'clash-report',
        query: '3d-viewer',
      };

      const panelId = panelMap[analysisType];

      // Enable and activate the panel
      panelStore.enableTab(panelId);
      panelStore.setActiveTab(panelId);

      // Update panel with analysis data
      panelStore.updatePanelData(panelId, data);

      // Emit events
      panelEventBus.publish('chat', {
        type: 'ACTIVATE_PANEL',
        panelId,
        autoExpand: true,
      });

      panelEventBus.publish('chat', {
        type: 'UPDATE_PANEL_DATA',
        panelId,
        data,
      });

      // Highlight elements if provided
      let highlightedCount = 0;
      if (highlightElements?.length) {
        bimStore.selectElements(highlightElements);
        bimStore.addPendingCommand({
          type: 'highlight',
          data: { elementIds: highlightElements },
        });
        highlightedCount = highlightElements.length;
      }

      return {
        success: true,
        panelId,
        highlightedCount,
        message: `Showing ${analysisType} analysis in ${panelId}${highlightedCount ? ` with ${highlightedCount} highlighted elements` : ''}`,
      };
    } catch (error) {
      return {
        success: false,
        panelId: '',
        message: error instanceof Error ? error.message : 'Failed to show analysis results',
      };
    }
  },
});

// ============================================
// Export all tools as array for TamboProvider
// ============================================

export const tamboTools = [
  // Viewport tools
  highlightElementsTool,
  isolateElementsTool,
  zoomToElementsTool,
  setViewPresetTool,
  clearViewerStateTool,
  // BIM analysis tools
  analyzeCarbonTool,
  generateBOQTool,
  detectClashesTool,
  queryElementsTool,
  // Panel control tools
  activatePanelTool,
  updatePanelDataTool,
  showAnalysisResultsTool,
];
