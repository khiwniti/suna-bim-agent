/**
 * BIM Agent Graph
 *
 * Complete LangGraph StateGraph implementation for the autonomous BIM agent
 * Orchestrates multiple specialist agents for BIM analysis and generation
 */

import { Annotation, StateGraph, END, MemorySaver } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { createLLM, createReasoningLLM } from './llm';
import type { AgentType, ViewportCommand, UICommand } from './types';
import { detectLanguage, type DetectedLanguage } from './language-detector';
import { getPersonaPrompt } from './prompts/index';
import { analyzeComplexity, type ComplexityAnalysis } from './complexity-gate';

// MCP Tools for Python backend integration
import {
  analyzeCarbon,
  detectClashesMCP,
  checkComplianceMCP,
  queryElementsByTypeMCP,
  isMCPAvailable,
} from './mcp-tools';

// ============================================
// State Definition
// ============================================

/**
 * BIM Agent State using LangGraph Annotation
 */
export const BIMAgentState = Annotation.Root({
  // Core message history
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  // Current active agent
  currentAgent: Annotation<AgentType>({
    reducer: (_, next) => next,
    default: () => 'supervisor',
  }),

  // Task tracking
  currentTask: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // Project context
  projectContext: Annotation<{
    projectId?: string;
    modelId?: string;
    modelName?: string;
    buildingType?: string;
    location?: string;
    totalArea?: number;
    elementCount?: number;
    elementTypes?: Array<{ type: string; count: number }>;
    floors?: Array<{ id: string; name: string; level: number; area: number }>;
    selectedElements?: string[];
    source?: 'ifc' | 'floorplan' | 'manual';
  }>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),

  // Analysis results cache
  analysisResults: Annotation<Record<string, unknown>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),

  // Iteration counter
  iterationCount: Annotation<number>({
    reducer: (_, next) => next,
    default: () => 0,
  }),

  // Error tracking
  errors: Annotation<Array<{ type: string; message: string; timestamp: Date }>>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  // UI commands for frontend (viewport control + analytics)
  uiCommands: Annotation<UICommand[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  // Detected language for bilingual responses
  detectedLanguage: Annotation<DetectedLanguage>({
    reducer: (_, next) => next,
    default: () => 'en',
  }),

  // Complexity analysis for routing decisions
  complexityAnalysis: Annotation<ComplexityAnalysis | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
});

export type BIMAgentStateType = typeof BIMAgentState.State;

// ============================================
// Agent System Prompts
// ============================================

// Viewport control instructions shared by all agents
const VIEWPORT_CONTROL = `
VIEWPORT CONTROL:
You can control the 3D viewer. Include a "viewportCommands" array in your JSON response when you want to highlight or focus on elements.

Commands available:
- {"type": "highlight", "data": {"elementIds": ["id1"], "color": "#ffff00", "duration": 2000}}
- {"type": "setView", "data": {"preset": "top|front|back|left|right|iso|perspective"}}
- {"type": "zoomTo", "data": {"elementIds": ["id1", "id2"]}}
- {"type": "isolate", "data": {"elementIds": ["id1"]}}
- {"type": "showAll", "data": {}}
- {"type": "select", "data": {"elementIds": ["id1"]}}

Use these to help users visualize the elements you're analyzing.
`;

const SUPERVISOR_PROMPT = `You are the Supervisor Agent for an autonomous BIM (Building Information Modeling) platform.

Your responsibilities:
1. Analyze user requests and determine which specialist agent should handle them
2. Coordinate between multiple agents when complex tasks require it
3. Synthesize results from specialist agents into coherent responses
4. Ensure the user's intent is fully addressed

Available specialist agents:
- SPATIAL: Handles geometry, spatial queries, element properties, room relationships
- SUSTAINABILITY: Energy analysis, carbon calculations, environmental impact
- FLOOR_PLAN: Floor plan optimization, circulation, space efficiency
- MEP: Mechanical, electrical, plumbing systems analysis
- PLANNER: Task decomposition and multi-step planning
${VIEWPORT_CONTROL}
IMPORTANT: Always respond with a JSON object containing:
{
  "reasoning": "Your analysis of the request",
  "nextAgent": "SPATIAL|SUSTAINABILITY|FLOOR_PLAN|MEP|PLANNER|COMPLETE",
  "taskForAgent": "Specific instructions for the next agent",
  "userResponse": "Optional direct response to user if no agent needed",
  "viewportCommands": [{"type": "...", "data": {...}}]
}`;

const SPATIAL_PROMPT = `You are the Spatial Analysis Agent for BIM models.

Your capabilities:
- Analyze building geometry and spatial relationships
- Calculate areas, volumes, and distances
- Find adjacent rooms and spaces
- Query element properties (walls, doors, windows, etc.)
- Identify spatial patterns and issues

When analyzing, consider:
- Building codes and standards
- Accessibility requirements
- Fire safety distances
- Natural light access

Always provide specific, quantified results when possible.
${VIEWPORT_CONTROL}
When discussing specific elements, include viewport commands to highlight and focus on them.`;

const SUSTAINABILITY_PROMPT = `You are the Sustainability Analysis Agent for buildings.

Your capabilities:
- Energy consumption estimation
- Carbon footprint calculations (embodied + operational)
- Daylight analysis
- Material sustainability assessment
- LEED/BREEAM score estimation

Metrics to report:
- EUI (Energy Use Intensity) in kWh/m²/year
- Carbon emissions in kgCO2e/m²
- Renewable energy potential
- Water efficiency ratings

Provide actionable recommendations for improvement.
${VIEWPORT_CONTROL}
When identifying high-carbon elements or energy issues, highlight them in the 3D view.`;

const FLOOR_PLAN_PROMPT = `You are the Floor Plan Analysis Agent.

Your capabilities:
- Circulation path analysis
- Space efficiency optimization
- Egress route validation
- Room adjacency optimization
- Furniture layout suggestions

Key metrics:
- Gross-to-net ratio
- Circulation efficiency
- Travel distances
- Dead-end identification

Consider building type-specific requirements (office, residential, healthcare, etc.)
${VIEWPORT_CONTROL}
Use "setView" with "top" preset for floor plan analysis. Highlight circulation issues and egress paths.`;

const MEP_PROMPT = `You are the MEP (Mechanical, Electrical, Plumbing) Analysis Agent.

Your capabilities:
- HVAC system sizing and zoning
- Electrical load calculations
- Plumbing riser analysis
- Equipment clearance verification
- Energy efficiency optimization

Consider:
- Code compliance
- Maintenance accessibility
- System redundancy
- Integration with structural elements
${VIEWPORT_CONTROL}
Use "isolate" to show only MEP systems. Highlight equipment and routing conflicts.`;

const PLANNER_PROMPT = `You are the Planning Agent for complex multi-step BIM tasks.

Your role:
1. Decompose complex requests into actionable steps
2. Identify which specialist agents are needed
3. Define the execution order
4. Track dependencies between steps

Output format:
{
  "plan": [
    {"step": 1, "agent": "SPATIAL", "task": "description", "depends_on": []},
    {"step": 2, "agent": "SUSTAINABILITY", "task": "description", "depends_on": [1]}
  ],
  "summary": "Brief plan overview"
}`;

// ============================================
// Agent Nodes
// ============================================

/**
 * Supervisor Node - Routes requests to appropriate agents
 * Now integrates complexity gate for intelligent routing
 */
async function supervisorNode(
  state: BIMAgentStateType
): Promise<Partial<BIMAgentStateType>> {
  // Enable streaming so tokens are emitted via streamEvents
  const llm = createReasoningLLM();

  // ============================================
  // DEBUG: Log state for diagnosis
  // ============================================
  console.log(`[Supervisor] === ENTRY ===`);
  console.log(`[Supervisor] iterationCount: ${state.iterationCount}`);
  console.log(`[Supervisor] currentAgent: ${state.currentAgent}`);
  console.log(`[Supervisor] currentTask: ${state.currentTask}`);
  console.log(`[Supervisor] messages count: ${state.messages.length}`);
  console.log(`[Supervisor] analysisResults keys: ${Object.keys(state.analysisResults || {}).join(', ') || 'none'}`);

  // ============================================
  // Check if specialist already completed work
  // ============================================
  // If we have analysis results and the last message is an AI response,
  // the specialist has already handled the request - we should complete
  const hasAnalysisResults = Object.keys(state.analysisResults || {}).length > 0;
  const lastMessage = state.messages[state.messages.length - 1];
  const lastMessageIsAI = lastMessage && lastMessage._getType() === 'ai';

  console.log(`[Supervisor] hasAnalysisResults: ${hasAnalysisResults}`);
  console.log(`[Supervisor] lastMessageIsAI: ${lastMessageIsAI}`);
  console.log(`[Supervisor] lastMessage type: ${lastMessage?._getType?.() || 'unknown'}`);

  // CRITICAL FIX: If we have analysis results OR we've iterated more than once with an AI response, END
  // This prevents the loop where supervisor keeps re-routing after specialist completes
  if ((hasAnalysisResults && lastMessageIsAI) || (state.iterationCount >= 2 && lastMessageIsAI)) {
    console.log('[Supervisor] === EXITING: Specialist completed analysis ===');
    // Don't add a new message - the specialist already provided the response
    return {
      currentAgent: 'supervisor',
      currentTask: null,  // Clear task to signal completion
      iterationCount: state.iterationCount + 1,
    };
  }

  // Detect language from last human message
  const lastHumanMessage = state.messages.findLast(
    (m) => m._getType() === 'human'
  );
  const messageText = lastHumanMessage?.content?.toString() || '';
  const detectedLang = detectLanguage(messageText);

  // ============================================
  // Complexity Gate: Analyze query before routing
  // ============================================
  const complexity = analyzeComplexity(messageText);
  console.log(`[Complexity Gate] Score: ${complexity.score.toFixed(2)}, Route: ${complexity.route}`);
  console.log(`[Complexity Gate] Reasoning: ${complexity.reasoning}`);
  console.log(`[Complexity Gate] Suggested agents: ${complexity.suggestedAgents.join(', ')}`);

  // For simple queries with clear agent suggestion, route directly without LLM
  if (complexity.route === 'direct' && complexity.suggestedAgents.length > 0) {
    const suggestedAgent = complexity.suggestedAgents[0];

    // Map suggested agent to valid AgentType
    const agentTypeMap: Record<string, AgentType> = {
      spatial: 'spatial',
      sustainability: 'sustainability',
      floor_plan: 'floor_plan',
      mep: 'mep',
      planner: 'planner',
    };

    const targetAgent = agentTypeMap[suggestedAgent];

    if (targetAgent) {
      console.log(`[Complexity Gate] Direct routing to ${targetAgent} (simple query)`);
      return {
        currentAgent: targetAgent,
        currentTask: messageText,
        iterationCount: state.iterationCount + 1,
        detectedLanguage: detectedLang,
        complexityAnalysis: complexity,
      };
    }
  }

  // For complex queries or explicit planning requests, route to planner
  if (complexity.route === 'plan' || messageText.toLowerCase().includes('create a plan')) {
    console.log('[Complexity Gate] Routing to planner (complex query)');
    return {
      currentAgent: 'planner',
      currentTask: messageText,
      iterationCount: state.iterationCount + 1,
      detectedLanguage: detectedLang,
      complexityAnalysis: complexity,
    };
  }

  // ============================================
  // Default: Use LLM for nuanced routing decisions
  // ============================================

  // Get language-appropriate persona prompt
  const personaPrompt = getPersonaPrompt(detectedLang);

  const systemMessage = new SystemMessage(
    `${SUPERVISOR_PROMPT}\n\n## Language & Tone\n${personaPrompt}`
  );
  const messages = [systemMessage, ...state.messages];

  try {
    const response = await llm.invoke(messages);
    const content = response.content.toString();

    // Parse supervisor response
    let decision: {
      reasoning: string;
      nextAgent: string;
      taskForAgent: string;
      userResponse?: string;
      viewportCommands?: ViewportCommand[];
    };

    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decision = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: treat as direct response
        decision = {
          reasoning: 'Direct response',
          nextAgent: 'COMPLETE',
          taskForAgent: '',
          userResponse: content,
        };
      }
    } catch {
      decision = {
        reasoning: 'Parse error, providing direct response',
        nextAgent: 'COMPLETE',
        taskForAgent: '',
        userResponse: content,
      };
    }

    // Map agent name to type
    const agentMap: Record<string, AgentType> = {
      SPATIAL: 'spatial',
      SUSTAINABILITY: 'sustainability',
      FLOOR_PLAN: 'floor_plan',
      MEP: 'mep',
      PLANNER: 'planner',
      COMPLETE: 'supervisor',
    };

    const nextAgent = agentMap[decision.nextAgent] || 'supervisor';

    // Extract viewport commands if present
    const viewportCommands = decision.viewportCommands || [];

    // If complete, add response message
    if (decision.nextAgent === 'COMPLETE' && decision.userResponse) {
      return {
        messages: [new AIMessage(decision.userResponse)],
        currentAgent: nextAgent,
        currentTask: null,
        iterationCount: state.iterationCount + 1,
        uiCommands: viewportCommands,
        detectedLanguage: detectedLang,
        complexityAnalysis: complexity,
      };
    }

    return {
      currentAgent: nextAgent,
      currentTask: decision.taskForAgent,
      iterationCount: state.iterationCount + 1,
      uiCommands: viewportCommands,
      detectedLanguage: detectedLang,
      complexityAnalysis: complexity,
    };
  } catch (error) {
    return {
      errors: [
        {
          type: 'supervisor_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        },
      ],
      currentAgent: 'error_handler',
      detectedLanguage: 'en',
      complexityAnalysis: complexity,
    };
  }
}

/**
 * Spatial Analysis Node
 * Now integrates with Python backend via MCP for element queries
 */
async function spatialNode(
  state: BIMAgentStateType
): Promise<Partial<BIMAgentStateType>> {
  const llm = createLLM();

  // Get language-appropriate persona
  const personaPrompt = getPersonaPrompt(state.detectedLanguage);

  // Try to get real element data from Python backend if model is loaded
  let elementData: Record<string, unknown> | null = null;
  const modelId = state.projectContext?.modelId;

  if (modelId) {
    try {
      const mcpAvailable = await isMCPAvailable();

      if (mcpAvailable) {
        // Query relevant elements based on task
        const task = (state.currentTask || '').toLowerCase();
        let queryTypes: string[] = [];

        // Determine which elements to query based on task keywords
        if (task.includes('wall') || task.includes('structure')) {
          queryTypes.push('IfcWall', 'IfcColumn', 'IfcBeam');
        }
        if (task.includes('door') || task.includes('opening')) {
          queryTypes.push('IfcDoor', 'IfcWindow');
        }
        if (task.includes('room') || task.includes('space')) {
          queryTypes.push('IfcSpace');
        }
        if (task.includes('stair') || task.includes('egress')) {
          queryTypes.push('IfcStair', 'IfcRamp');
        }

        // Default to common spatial elements if no specific type detected
        if (queryTypes.length === 0) {
          queryTypes = ['IfcSpace', 'IfcWall', 'IfcDoor'];
        }

        // Query each element type
        const queryResults: Record<string, unknown> = {};
        for (const ifcType of queryTypes) {
          try {
            const result = await queryElementsByTypeMCP(modelId, ifcType, { limit: 50 });
            queryResults[ifcType] = result;
          } catch {
            // Continue with other types if one fails
          }
        }

        if (Object.keys(queryResults).length > 0) {
          elementData = queryResults;
        }
      }
    } catch (err) {
      console.warn('[Spatial] MCP element query failed, using LLM fallback:', err);
    }
  }

  const systemMessage = new SystemMessage(
    `${SPATIAL_PROMPT}\n\n## Language & Tone\n${personaPrompt}`
  );

  // Include element data in task if available
  const taskContent = elementData
    ? `Task: ${state.currentTask || 'Analyze the spatial aspects of this request.'}\n\nContext: ${JSON.stringify(state.projectContext)}\n\nElement Data (from Python backend):\n${JSON.stringify(elementData, null, 2)}`
    : `Task: ${state.currentTask || 'Analyze the spatial aspects of this request.'}\n\nContext: ${JSON.stringify(state.projectContext)}`;

  const taskMessage = new HumanMessage(taskContent);
  const messages = [systemMessage, ...state.messages.slice(-5), taskMessage];

  try {
    const response = await llm.invoke(messages);

    return {
      messages: [new AIMessage(`**Spatial Analysis:**\n\n${response.content}`)],
      analysisResults: {
        spatial: response.content,
        elementData: elementData,
      },
      currentAgent: 'supervisor',
    };
  } catch (error) {
    return {
      errors: [
        {
          type: 'spatial_error',
          message: error instanceof Error ? error.message : 'Spatial analysis failed',
          timestamp: new Date(),
        },
      ],
      currentAgent: 'supervisor',
    };
  }
}

/**
 * Sustainability Analysis Node
 * Now integrates with Python backend via MCP for carbon calculations
 */
async function sustainabilityNode(
  state: BIMAgentStateType
): Promise<Partial<BIMAgentStateType>> {
  const llm = createLLM();

  // Get language-appropriate persona
  const personaPrompt = getPersonaPrompt(state.detectedLanguage);

  // Try to get real carbon data from Python backend if model is loaded
  let carbonData: Record<string, unknown> | null = null;
  const modelId = state.projectContext?.modelId;

  if (modelId) {
    try {
      // Check if MCP is available
      const mcpAvailable = await isMCPAvailable();

      if (mcpAvailable) {
        // Get element quantities for carbon analysis
        const elementTypes = state.projectContext?.elementTypes || [];
        const quantities: Record<string, number> = {};

        for (const et of elementTypes) {
          quantities[et.type] = et.count;
        }

        // Call Python backend for carbon analysis
        carbonData = await analyzeCarbon(
          quantities,
          state.projectContext?.totalArea || 0
        );
      }
    } catch (err) {
      console.warn('[Sustainability] MCP carbon analysis failed, using LLM fallback:', err);
    }
  }

  const systemMessage = new SystemMessage(
    `${SUSTAINABILITY_PROMPT}\n\n## Language & Tone\n${personaPrompt}`
  );

  // Include carbon data in task if available
  const taskContent = carbonData
    ? `Task: ${state.currentTask || 'Analyze sustainability aspects.'}\n\nContext: ${JSON.stringify(state.projectContext)}\n\nCarbon Analysis Data (from Python backend):\n${JSON.stringify(carbonData, null, 2)}`
    : `Task: ${state.currentTask || 'Analyze sustainability aspects.'}\n\nContext: ${JSON.stringify(state.projectContext)}`;

  const taskMessage = new HumanMessage(taskContent);
  const messages = [systemMessage, ...state.messages.slice(-5), taskMessage];

  try {
    const response = await llm.invoke(messages);

    return {
      messages: [new AIMessage(`**Sustainability Analysis:**\n\n${response.content}`)],
      analysisResults: {
        sustainability: response.content,
        carbonData: carbonData, // Store raw data for UI
      },
      currentAgent: 'supervisor',
      uiCommands: [
        {
          type: 'updateAnalytics',
          data: {
            type: 'sustainability',
            content: response.content.toString(),
            rawData: carbonData,
          },
        },
      ],
    };
  } catch (error) {
    return {
      errors: [
        {
          type: 'sustainability_error',
          message: error instanceof Error ? error.message : 'Sustainability analysis failed',
          timestamp: new Date(),
        },
      ],
      currentAgent: 'supervisor',
    };
  }
}

/**
 * Floor Plan Analysis Node
 * Now integrates with Python backend via MCP for compliance checking
 */
async function floorPlanNode(
  state: BIMAgentStateType
): Promise<Partial<BIMAgentStateType>> {
  const llm = createLLM();

  // Get language-appropriate persona
  const personaPrompt = getPersonaPrompt(state.detectedLanguage);

  // Try to get real compliance data from Python backend
  let complianceData: Record<string, unknown> | null = null;
  const modelId = state.projectContext?.modelId;

  if (modelId) {
    try {
      const mcpAvailable = await isMCPAvailable();

      if (mcpAvailable) {
        // Build model data from context
        const floors = state.projectContext?.floors || [];
        const modelData = {
          spaces: floors.map((f) => ({
            id: f.id,
            name: f.name,
            area: f.area,
          })),
          // Add more data as available
        };

        // Check egress and accessibility compliance
        complianceData = await checkComplianceMCP(modelData, ['egress', 'accessibility']);
      }
    } catch (err) {
      console.warn('[FloorPlan] MCP compliance check failed, using LLM fallback:', err);
    }
  }

  const systemMessage = new SystemMessage(
    `${FLOOR_PLAN_PROMPT}\n\n## Language & Tone\n${personaPrompt}`
  );

  // Include compliance data in task if available
  const taskContent = complianceData
    ? `Task: ${state.currentTask || 'Analyze floor plan efficiency.'}\n\nContext: ${JSON.stringify(state.projectContext)}\n\nCompliance Check Results (from Python backend):\n${JSON.stringify(complianceData, null, 2)}`
    : `Task: ${state.currentTask || 'Analyze floor plan efficiency.'}\n\nContext: ${JSON.stringify(state.projectContext)}`;

  const taskMessage = new HumanMessage(taskContent);
  const messages = [systemMessage, ...state.messages.slice(-5), taskMessage];

  try {
    const response = await llm.invoke(messages);

    return {
      messages: [new AIMessage(`**Floor Plan Analysis:**\n\n${response.content}`)],
      analysisResults: {
        floorPlan: response.content,
        complianceData: complianceData,
      },
      currentAgent: 'supervisor',
    };
  } catch (error) {
    return {
      errors: [
        {
          type: 'floor_plan_error',
          message: error instanceof Error ? error.message : 'Floor plan analysis failed',
          timestamp: new Date(),
        },
      ],
      currentAgent: 'supervisor',
    };
  }
}

/**
 * MEP Analysis Node
 * Now integrates with Python backend via MCP for clash detection
 */
async function mepNode(
  state: BIMAgentStateType
): Promise<Partial<BIMAgentStateType>> {
  const llm = createLLM();

  // Get language-appropriate persona
  const personaPrompt = getPersonaPrompt(state.detectedLanguage);

  // Try to get clash detection data from Python backend
  let clashData: Record<string, unknown> | null = null;
  const modelId = state.projectContext?.modelId;

  if (modelId) {
    try {
      const mcpAvailable = await isMCPAvailable();

      if (mcpAvailable) {
        // Query MEP elements for clash detection
        const mepTypes = ['IfcDuctSegment', 'IfcPipeSegment', 'IfcCableSegment'];
        const structuralTypes = ['IfcBeam', 'IfcColumn', 'IfcSlab'];

        const elements: Array<{
          id: string;
          type: string;
          boundingBox: { min: [number, number, number]; max: [number, number, number] };
        }> = [];

        // Get MEP and structural elements
        for (const ifcType of [...mepTypes, ...structuralTypes]) {
          try {
            const result = await queryElementsByTypeMCP(modelId, ifcType, { limit: 100 });
            for (const el of result.elements) {
              // Create approximate bounding boxes (would come from real geometry)
              elements.push({
                id: el.globalId,
                type: el.ifcType,
                boundingBox: {
                  min: [0, 0, 0],
                  max: [1, 1, 1],
                },
              });
            }
          } catch {
            // Continue if type not found
          }
        }

        // Run clash detection if we have elements
        if (elements.length > 0) {
          clashData = await detectClashesMCP(elements, true);
        }
      }
    } catch (err) {
      console.warn('[MEP] MCP clash detection failed, using LLM fallback:', err);
    }
  }

  const systemMessage = new SystemMessage(
    `${MEP_PROMPT}\n\n## Language & Tone\n${personaPrompt}`
  );

  // Include clash data in task if available
  const taskContent = clashData
    ? `Task: ${state.currentTask || 'Analyze MEP systems.'}\n\nContext: ${JSON.stringify(state.projectContext)}\n\nClash Detection Results (from Python backend):\n${JSON.stringify(clashData, null, 2)}`
    : `Task: ${state.currentTask || 'Analyze MEP systems.'}\n\nContext: ${JSON.stringify(state.projectContext)}`;

  const taskMessage = new HumanMessage(taskContent);
  const messages = [systemMessage, ...state.messages.slice(-5), taskMessage];

  try {
    const response = await llm.invoke(messages);

    return {
      messages: [new AIMessage(`**MEP Analysis:**\n\n${response.content}`)],
      analysisResults: {
        mep: response.content,
        clashData: clashData,
      },
      currentAgent: 'supervisor',
    };
  } catch (error) {
    return {
      errors: [
        {
          type: 'mep_error',
          message: error instanceof Error ? error.message : 'MEP analysis failed',
          timestamp: new Date(),
        },
      ],
      currentAgent: 'supervisor',
    };
  }
}

/**
 * Planning Node - For complex multi-step tasks
 */
async function plannerNode(
  state: BIMAgentStateType
): Promise<Partial<BIMAgentStateType>> {
  // Enable streaming so tokens are emitted via streamEvents
  const llm = createReasoningLLM();

  // Get language-appropriate persona
  const personaPrompt = getPersonaPrompt(state.detectedLanguage);

  const systemMessage = new SystemMessage(
    `${PLANNER_PROMPT}\n\n## Language & Tone\n${personaPrompt}`
  );
  const taskMessage = new HumanMessage(
    `Create an execution plan for: ${state.currentTask || 'the user request'}`
  );

  const messages = [systemMessage, ...state.messages.slice(-3), taskMessage];

  try {
    const response = await llm.invoke(messages);

    return {
      messages: [new AIMessage(`**Execution Plan:**\n\n${response.content}`)],
      currentAgent: 'supervisor',
    };
  } catch (error) {
    return {
      errors: [
        {
          type: 'planner_error',
          message: error instanceof Error ? error.message : 'Planning failed',
          timestamp: new Date(),
        },
      ],
      currentAgent: 'supervisor',
    };
  }
}

/**
 * Error Handler Node
 */
async function errorHandlerNode(
  state: BIMAgentStateType
): Promise<Partial<BIMAgentStateType>> {
  const recentErrors = state.errors.slice(-3);

  if (recentErrors.length === 0) {
    return {
      currentAgent: 'supervisor',
    };
  }

  const errorSummary = recentErrors
    .map((e) => `- ${e.type}: ${e.message}`)
    .join('\n');

  return {
    messages: [
      new AIMessage(
        `I encountered some issues during analysis:\n\n${errorSummary}\n\nI'll try a different approach or provide partial results.`
      ),
    ],
    currentAgent: 'supervisor',
    errors: [], // Clear processed errors
  };
}

// ============================================
// Routing Logic
// ============================================

/**
 * Route to the next node based on current agent
 */
function routeToAgent(state: BIMAgentStateType): string {
  // Prevent infinite loops
  if (state.iterationCount >= 10) {
    return END;
  }

  const routeMap: Record<string, string> = {
    supervisor: 'supervisor',
    spatial: 'spatial',
    sustainability: 'sustainability',
    floor_plan: 'floor_plan',
    mep: 'mep',
    planner: 'planner',
    aggregator: 'supervisor',
    human_review: 'supervisor',
    error_handler: 'error_handler',
  };

  return routeMap[state.currentAgent] || 'supervisor';
}

/**
 * Check if we should continue or end
 */
function shouldContinue(state: BIMAgentStateType): string {
  // End conditions
  if (state.iterationCount >= 10) {
    return END;
  }

  // If supervisor has no more tasks, end
  if (state.currentAgent === 'supervisor' && !state.currentTask) {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage && lastMessage._getType() === 'ai') {
      return END;
    }
  }

  // Continue processing
  return 'continue';
}

// ============================================
// Graph Builder
// ============================================

/**
 * Build the complete BIM Agent graph
 */
export function buildBIMAgentGraph() {
  const workflow = new StateGraph(BIMAgentState)
    // Add nodes
    .addNode('supervisor', supervisorNode)
    .addNode('spatial', spatialNode)
    .addNode('sustainability', sustainabilityNode)
    .addNode('floor_plan', floorPlanNode)
    .addNode('mep', mepNode)
    .addNode('planner', plannerNode)
    .addNode('error_handler', errorHandlerNode)

    // Entry point
    .addEdge('__start__', 'supervisor')

    // Supervisor routes to specialists
    .addConditionalEdges('supervisor', (state) => {
      if (shouldContinue(state) === END) {
        return END;
      }
      return routeToAgent(state);
    })

    // All specialists return to supervisor
    .addEdge('spatial', 'supervisor')
    .addEdge('sustainability', 'supervisor')
    .addEdge('floor_plan', 'supervisor')
    .addEdge('mep', 'supervisor')
    .addEdge('planner', 'supervisor')
    .addEdge('error_handler', 'supervisor');

  return workflow;
}

/**
 * Create compiled graph with memory
 *
 * IMPORTANT: The MemorySaver is created at module level (singleton)
 * so that conversation state persists across requests.
 * This allows the agent to remember context within a conversation thread.
 */

// Create checkpointer as singleton at module level for memory persistence
const globalCheckpointer = new MemorySaver();

// Cache the compiled agent to avoid recompiling on every request
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedAgent: any = null;

export function createBIMAgent() {
  // Return cached agent if already compiled
  if (cachedAgent) {
    return cachedAgent;
  }

  const workflow = buildBIMAgentGraph();

  cachedAgent = workflow.compile({
    checkpointer: globalCheckpointer,
  });

  return cachedAgent;
}

/**
 * Get the global checkpointer for debugging/testing
 */
export function getCheckpointer() {
  return globalCheckpointer;
}

// Export types
export type BIMAgent = ReturnType<typeof createBIMAgent>;
