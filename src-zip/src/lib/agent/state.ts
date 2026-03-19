/**
 * BIM Agent State Definition
 *
 * Simplified state factory for backwards compatibility
 * The main graph state is defined in graph.ts using LangGraph annotations
 */

import type { AgentType } from './types';

/**
 * Project Context Interface
 */
export interface ProjectContext {
  modelId: string;
  modelName: string;
  totalArea: number;
  floors: Array<{
    id: string;
    name: string;
    level: number;
    area: number;
  }>;
  selectedElements: string[];
  sustainabilityTarget: string;
  location?: {
    latitude: number;
    longitude: number;
    climateZone?: string;
  };
}

/**
 * Legacy BIM Agent State type for backwards compatibility
 */
export interface BIMAgentState {
  currentAgent: AgentType;
  projectContext: ProjectContext | null;
  analysisResults: Record<string, unknown>;
  iterationCount: number;
  finalResponse: string | null;
}

/**
 * Initial state factory
 */
export function createInitialState(
  projectContext?: Partial<ProjectContext>
): BIMAgentState {
  return {
    currentAgent: 'supervisor',
    projectContext: projectContext
      ? {
          modelId: projectContext.modelId || 'default',
          modelName: projectContext.modelName || 'Demo Building',
          totalArea: projectContext.totalArea || 3600,
          floors: projectContext.floors || [],
          selectedElements: projectContext.selectedElements || [],
          sustainabilityTarget: projectContext.sustainabilityTarget || 'LEED Gold',
          location: projectContext.location,
        }
      : null,
    analysisResults: {},
    iterationCount: 0,
    finalResponse: null,
  };
}
