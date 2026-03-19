/**
 * BIM Agent Tools
 *
 * Tool definitions and implementations for the BIM agent to interact with
 * the building model, run analyses, and control the 3D viewport
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { prisma } from './db';
import { queryElements, getElementStats } from './bim-processing';
import {
  runSpatialAnalysis,
  runSustainabilityAnalysis,
  runEnergyAnalysis,
  runCirculationAnalysis,
  runMEPAnalysis,
} from './analysis-tools';
import { logger } from './errors';

// ============================================
// Spatial Query Tools
// ============================================

export const getElementsByTypeTool = tool(
  async ({ modelId, elementType, limit }) => {
    try {
      const elements = await queryElements(modelId, {
        elementType,
        limit: limit || 50,
      });

      return JSON.stringify({
        success: true,
        count: elements.length,
        elements: elements.map((e) => ({
          id: e.globalId,
          type: e.elementType,
          name: e.name,
          floor: e.floor,
          levelName: e.levelName,
        })),
      });
    } catch (error) {
      logger.error('getElementsByType error', error as Error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: 'get_elements_by_type',
    description:
      'Query BIM elements by type (e.g., IFCWALL, IFCDOOR, IFCWINDOW). Returns element IDs, names, and floor information.',
    schema: z.object({
      modelId: z.string().describe('The BIM model ID to query'),
      elementType: z
        .string()
        .describe('The IFC element type to filter by (e.g., IFCWALL, IFCDOOR)'),
      limit: z
        .number()
        .optional()
        .describe('Maximum number of elements to return (default: 50)'),
    }),
  }
);

export const getElementsByFloorTool = tool(
  async ({ modelId, floor, limit }) => {
    try {
      const elements = await queryElements(modelId, {
        floor,
        limit: limit || 100,
      });

      return JSON.stringify({
        success: true,
        count: elements.length,
        floor,
        elements: elements.map((e) => ({
          id: e.globalId,
          type: e.elementType,
          name: e.name,
        })),
      });
    } catch (error) {
      logger.error('getElementsByFloor error', error as Error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: 'get_elements_by_floor',
    description:
      'Query all BIM elements on a specific floor level. Returns element types and names.',
    schema: z.object({
      modelId: z.string().describe('The BIM model ID to query'),
      floor: z.number().describe('The floor number (0-indexed)'),
      limit: z
        .number()
        .optional()
        .describe('Maximum number of elements to return (default: 100)'),
    }),
  }
);

export const getModelStatsTool = tool(
  async ({ modelId }) => {
    try {
      const stats = await getElementStats(modelId);

      return JSON.stringify({
        success: true,
        totalElements: stats.totalElements,
        elementsByType: stats.byType,
        elementsByFloor: stats.byFloor,
      });
    } catch (error) {
      logger.error('getModelStats error', error as Error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: 'get_model_stats',
    description:
      'Get statistics about a BIM model including element counts by type and floor.',
    schema: z.object({
      modelId: z.string().describe('The BIM model ID to analyze'),
    }),
  }
);

// ============================================
// Analysis Tools
// ============================================

export const runSpatialAnalysisTool = tool(
  async ({ modelId, projectId }) => {
    try {
      const result = await runSpatialAnalysis({
        modelId,
        projectId,
        userId: 'system', // Will be overridden by actual user context
      });

      return JSON.stringify({
        success: true,
        summary: result.summary,
        score: result.overallScore,
        metrics: result.metrics,
        recommendations: result.recommendations,
      });
    } catch (error) {
      logger.error('runSpatialAnalysis tool error', error as Error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: 'analyze_spatial',
    description:
      'Run spatial analysis on a BIM model. Analyzes areas, efficiency, and spatial relationships.',
    schema: z.object({
      modelId: z.string().optional().describe('The BIM model ID to analyze'),
      projectId: z.string().optional().describe('The project ID'),
    }),
  }
);

export const runSustainabilityAnalysisTool = tool(
  async ({ modelId, projectId, targetCertification }) => {
    try {
      const result = await runSustainabilityAnalysis({
        modelId,
        projectId,
        userId: 'system',
        params: { targetCertification },
      });

      return JSON.stringify({
        success: true,
        summary: result.summary,
        score: result.overallScore,
        metrics: result.metrics,
        recommendations: result.recommendations,
      });
    } catch (error) {
      logger.error('runSustainabilityAnalysis tool error', error as Error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: 'analyze_sustainability',
    description:
      'Run sustainability analysis. Evaluates energy use, carbon footprint, and LEED certification potential.',
    schema: z.object({
      modelId: z.string().optional().describe('The BIM model ID'),
      projectId: z.string().optional().describe('The project ID'),
      targetCertification: z
        .enum(['LEED', 'BREEAM', 'WELL', 'PASSIVHAUS'])
        .optional()
        .describe('Target sustainability certification'),
    }),
  }
);

export const runEnergyAnalysisTool = tool(
  async ({ modelId, projectId }) => {
    try {
      const result = await runEnergyAnalysis({
        modelId,
        projectId,
        userId: 'system',
      });

      return JSON.stringify({
        success: true,
        summary: result.summary,
        score: result.overallScore,
        metrics: result.metrics,
        recommendations: result.recommendations,
      });
    } catch (error) {
      logger.error('runEnergyAnalysis tool error', error as Error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: 'analyze_energy',
    description:
      'Run energy analysis. Calculates consumption, peak loads, and efficiency ratings.',
    schema: z.object({
      modelId: z.string().optional().describe('The BIM model ID'),
      projectId: z.string().optional().describe('The project ID'),
    }),
  }
);

export const runCirculationAnalysisTool = tool(
  async ({ modelId, projectId }) => {
    try {
      const result = await runCirculationAnalysis({
        modelId,
        projectId,
        userId: 'system',
      });

      return JSON.stringify({
        success: true,
        summary: result.summary,
        score: result.overallScore,
        metrics: result.metrics,
        recommendations: result.recommendations,
      });
    } catch (error) {
      logger.error('runCirculationAnalysis tool error', error as Error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: 'analyze_circulation',
    description:
      'Run circulation and egress analysis. Evaluates travel distances, dead ends, and emergency exits.',
    schema: z.object({
      modelId: z.string().optional().describe('The BIM model ID'),
      projectId: z.string().optional().describe('The project ID'),
    }),
  }
);

export const runMEPAnalysisTool = tool(
  async ({ modelId, projectId }) => {
    try {
      const result = await runMEPAnalysis({
        modelId,
        projectId,
        userId: 'system',
      });

      return JSON.stringify({
        success: true,
        summary: result.summary,
        score: result.overallScore,
        metrics: result.metrics,
        recommendations: result.recommendations,
      });
    } catch (error) {
      logger.error('runMEPAnalysis tool error', error as Error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: 'analyze_mep',
    description:
      'Run MEP (Mechanical, Electrical, Plumbing) analysis. Evaluates system sizing and efficiency.',
    schema: z.object({
      modelId: z.string().optional().describe('The BIM model ID'),
      projectId: z.string().optional().describe('The project ID'),
    }),
  }
);

// ============================================
// Viewport Control Tools
// ============================================

export const highlightElementsTool = tool(
  async ({ elementIds, color, duration }) => {
    // This tool generates a UI command that will be sent to the frontend
    return JSON.stringify({
      success: true,
      uiCommand: {
        type: 'highlight',
        data: {
          elementIds,
          color: color || '#ffff00',
          duration: duration || 2000,
        },
      },
    });
  },
  {
    name: 'highlight_elements',
    description:
      'Highlight specific elements in the 3D viewport. Use this to draw attention to elements being discussed.',
    schema: z.object({
      elementIds: z
        .array(z.string())
        .describe('Array of element IDs to highlight'),
      color: z
        .string()
        .optional()
        .describe('Highlight color in hex format (default: #ffff00)'),
      duration: z
        .number()
        .optional()
        .describe('Duration of highlight in milliseconds (default: 2000, use 0 for permanent)'),
    }),
  }
);

export const zoomToElementsTool = tool(
  async ({ elementIds }) => {
    return JSON.stringify({
      success: true,
      uiCommand: {
        type: 'zoomTo',
        data: {
          elementIds,
        },
      },
    });
  },
  {
    name: 'zoom_to_elements',
    description:
      'Zoom the 3D camera to focus on specific elements. Use this to show details of elements being discussed.',
    schema: z.object({
      elementIds: z.array(z.string()).describe('Array of element IDs to zoom to'),
    }),
  }
);

export const setViewTool = tool(
  async ({ preset }) => {
    return JSON.stringify({
      success: true,
      uiCommand: {
        type: 'setView',
        data: { preset },
      },
    });
  },
  {
    name: 'set_view',
    description:
      'Set the 3D viewport to a predefined camera angle. Options: top (bird\'s eye), front, back, left, right, iso (isometric 3D), perspective.',
    schema: z.object({
      preset: z
        .enum(['top', 'front', 'back', 'left', 'right', 'iso', 'perspective'])
        .describe('The camera view preset to set'),
    }),
  }
);

export const isolateElementsTool = tool(
  async ({ elementIds }) => {
    return JSON.stringify({
      success: true,
      uiCommand: {
        type: 'isolate',
        data: {
          elementIds,
        },
      },
    });
  },
  {
    name: 'isolate_elements',
    description:
      'Isolate specific elements in the 3D view, hiding all other elements. Use this to focus on specific parts of the model.',
    schema: z.object({
      elementIds: z.array(z.string()).describe('Array of element IDs to isolate (all others will be hidden)'),
    }),
  }
);

export const showAllElementsTool = tool(
  async () => {
    return JSON.stringify({
      success: true,
      uiCommand: {
        type: 'showAll',
        data: {},
      },
    });
  },
  {
    name: 'show_all_elements',
    description:
      'Show all elements in the 3D viewport. Use this to reset visibility after isolating elements.',
    schema: z.object({}),
  }
);

export const selectElementsTool = tool(
  async ({ elementIds }) => {
    return JSON.stringify({
      success: true,
      uiCommand: {
        type: 'select',
        data: {
          elementIds,
        },
      },
    });
  },
  {
    name: 'select_elements',
    description:
      'Select specific elements in the 3D viewport. Selected elements will be visually marked.',
    schema: z.object({
      elementIds: z.array(z.string()).describe('Array of element IDs to select'),
    }),
  }
);

// ============================================
// Project Context Tools
// ============================================

export const getProjectInfoTool = tool(
  async ({ projectId }) => {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          bimModels: {
            select: {
              id: true,
              name: true,
              format: true,
              status: true,
              elementsCount: true,
            },
          },
          _count: {
            select: {
              conversations: true,
              analyses: true,
            },
          },
        },
      });

      if (!project) {
        return JSON.stringify({
          success: false,
          error: 'Project not found',
        });
      }

      return JSON.stringify({
        success: true,
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          location: project.location,
          buildingType: project.buildingType,
          totalArea: project.totalArea,
          floors: project.floors,
          models: project.bimModels,
          conversationCount: project._count.conversations,
          analysisCount: project._count.analyses,
        },
      });
    } catch (error) {
      logger.error('getProjectInfo error', error as Error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: 'get_project_info',
    description:
      'Get detailed information about a project including its BIM models and statistics.',
    schema: z.object({
      projectId: z.string().describe('The project ID to get information about'),
    }),
  }
);

export const getAnalysisHistoryTool = tool(
  async ({ projectId, modelId, type, limit }) => {
    try {
      const analyses = await prisma.analysisResult.findMany({
        where: {
          ...(projectId && { projectId }),
          ...(modelId && { modelId }),
          ...(type && { type: type as never }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit || 10,
        select: {
          id: true,
          type: true,
          status: true,
          overallScore: true,
          summary: true,
          createdAt: true,
        },
      });

      return JSON.stringify({
        success: true,
        count: analyses.length,
        analyses,
      });
    } catch (error) {
      logger.error('getAnalysisHistory error', error as Error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: 'get_analysis_history',
    description:
      'Get historical analysis results for a project or model. Useful for comparing past analyses.',
    schema: z.object({
      projectId: z.string().optional().describe('Filter by project ID'),
      modelId: z.string().optional().describe('Filter by model ID'),
      type: z
        .string()
        .optional()
        .describe('Filter by analysis type (e.g., SUSTAINABILITY, ENERGY)'),
      limit: z.number().optional().describe('Maximum results to return (default: 10)'),
    }),
  }
);

// ============================================
// Export All Tools
// ============================================

export const bimAgentTools = [
  // Spatial queries
  getElementsByTypeTool,
  getElementsByFloorTool,
  getModelStatsTool,

  // Analysis
  runSpatialAnalysisTool,
  runSustainabilityAnalysisTool,
  runEnergyAnalysisTool,
  runCirculationAnalysisTool,
  runMEPAnalysisTool,

  // Viewport control (for AI to control 3D viewer)
  highlightElementsTool,
  zoomToElementsTool,
  setViewTool,
  isolateElementsTool,
  showAllElementsTool,
  selectElementsTool,

  // Project context
  getProjectInfoTool,
  getAnalysisHistoryTool,
];
