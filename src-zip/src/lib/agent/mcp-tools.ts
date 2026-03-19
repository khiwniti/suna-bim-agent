/**
 * MCP-Integrated BIM Agent Tools
 *
 * These tools call the Python backend via MCP for heavy BIM operations.
 * This bridges the gap between the TypeScript LangGraph agent and the
 * Python-based IFC parsing, carbon analysis, and clash detection.
 *
 * Architecture:
 *   TS Agent → MCP Tools (this file) → MCPClient → /api/mcp/tools/call → Python Backend
 */

import { getMCPClient, MCPClient } from '@/mcp/client';
import type { MCPToolResult } from '@/mcp/types';

// ============================================
// MCP Client Singleton
// ============================================

let mcpClient: MCPClient | null = null;

/**
 * Get or create the MCP client instance
 * Ensures connection is established before tool calls
 */
async function ensureMCPClient(): Promise<MCPClient> {
  if (!mcpClient) {
    mcpClient = getMCPClient();
  }

  if (mcpClient.getConnectionState() !== 'connected') {
    await mcpClient.connect();
  }

  return mcpClient;
}

/**
 * Helper to unwrap MCP results with error handling
 */
function unwrapResult<T>(result: MCPToolResult, defaultValue: T): T {
  if (result.isError) {
    console.warn('[MCP Tools] Tool call failed:', result.errorMessage);
    return defaultValue;
  }
  return result.content as T;
}

// ============================================
// IFC Query Tools (via Python Backend)
// ============================================

/**
 * Parse an IFC file via the Python backend
 * This is the entry point for loading IFC models
 */
export async function parseIFCModel(
  filePath: string,
  extractGeometry: boolean = false
): Promise<{
  modelId: string;
  name: string;
  schema: string;
  elementCount: number;
  elementSummary: Record<string, number>;
  floorCount: number;
  totalArea: number;
  buildingType: string;
  materials: string[];
}> {
  const client = await ensureMCPClient();

  const result = await client.callTool('parse_ifc', {
    file_path: filePath,
    extract_geometry: extractGeometry,
  });

  return unwrapResult(result, {
    modelId: '',
    name: 'Unknown Model',
    schema: 'IFC4',
    elementCount: 0,
    elementSummary: {},
    floorCount: 0,
    totalArea: 0,
    buildingType: 'Commercial',
    materials: [],
  });
}

/**
 * Query IFC elements by type via Python backend
 */
export async function queryElementsByTypeMCP(
  modelId: string,
  ifcType: string,
  options: { limit?: number; includeProperties?: boolean } = {}
): Promise<{
  count: number;
  elements: Array<{
    id: string;
    globalId: string;
    name: string;
    ifcType: string;
    properties?: Record<string, unknown>;
  }>;
}> {
  const client = await ensureMCPClient();

  const result = await client.callTool('query_elements', {
    model_id: modelId,
    ifc_type: ifcType,
    limit: options.limit ?? 100,
    include_properties: options.includeProperties ?? true,
  });

  const data = unwrapResult(result, { count: 0, elements: [] });

  // Map Python snake_case to TypeScript camelCase
  return {
    count: data.count || 0,
    elements: (data.elements || []).map((e: Record<string, unknown>) => ({
      id: e.id as string,
      globalId: (e.global_id || e.globalId) as string,
      name: e.name as string,
      ifcType: (e.type || e.ifcType) as string,
      properties: e.properties as Record<string, unknown> | undefined,
    })),
  };
}

/**
 * Get detailed element information
 */
export async function getElementByIdMCP(
  modelId: string,
  globalId: string
): Promise<{
  id: string;
  globalId: string;
  ifcType: string;
  name: string;
  description?: string;
  properties: Record<string, unknown>;
} | null> {
  const client = await ensureMCPClient();

  const result = await client.callTool('get_element', {
    model_id: modelId,
    global_id: globalId,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = unwrapResult<any>(result, null);

  if (!data || data.error) {
    return null;
  }

  return {
    id: data.id,
    globalId: data.global_id || data.globalId,
    ifcType: data.type || data.ifcType,
    name: data.name,
    description: data.description,
    properties: data.properties || {},
  };
}

/**
 * Calculate quantities via Python backend
 */
export async function calculateQuantitiesMCP(
  modelId: string,
  elementTypes?: string[]
): Promise<{
  quantities: Record<
    string,
    {
      count: number;
      volume?: number;
      area?: number;
      length?: number;
    }
  >;
}> {
  const client = await ensureMCPClient();

  const result = await client.callTool('calculate_quantities', {
    model_id: modelId,
    element_types: elementTypes,
  });

  return unwrapResult(result, { quantities: {} });
}

// ============================================
// Analysis Tools (via Python Backend)
// ============================================

/**
 * Analyze embodied carbon footprint via Python backend
 */
export async function analyzeCarbon(
  elementQuantities: Record<string, number>,
  buildingArea?: number
): Promise<{
  totalEmbodiedCarbon: number; // kgCO2e
  carbonPerSquareMeter: number; // kgCO2e/m²
  byMaterial: Array<{
    material: string;
    volume: number;
    carbonFactor: number;
    totalCarbon: number;
    percentage: number;
  }>;
  byElement: Array<{
    elementType: string;
    totalCarbon: number;
    percentage: number;
  }>;
  recommendations: Array<{
    current: string;
    alternative: string;
    potentialSavings: number;
    percentReduction: number;
  }>;
}> {
  const client = await ensureMCPClient();

  const result = await client.callTool('analyze_carbon', {
    element_quantities: elementQuantities,
    building_area: buildingArea || 0,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = unwrapResult<any>(result, {
    total_embodied_carbon: 0,
    carbon_per_sqm: 0,
    by_material: [],
    by_element: [],
    recommendations: [],
  });

  // Map Python snake_case to TypeScript camelCase
  return {
    totalEmbodiedCarbon: data.total_embodied_carbon || data.totalEmbodiedCarbon || 0,
    carbonPerSquareMeter: data.carbon_per_sqm || data.carbonPerSquareMeter || 0,
    byMaterial: (data.by_material || data.byMaterial || []).map(
      (m: Record<string, unknown>) => ({
        material: m.material as string,
        volume: m.volume as number,
        carbonFactor: (m.carbon_factor || m.carbonFactor) as number,
        totalCarbon: (m.total_carbon || m.totalCarbon) as number,
        percentage: m.percentage as number,
      })
    ),
    byElement: (data.by_element || data.byElement || []).map(
      (e: Record<string, unknown>) => ({
        elementType: (e.element_type || e.elementType) as string,
        totalCarbon: (e.total_carbon || e.totalCarbon) as number,
        percentage: e.percentage as number,
      })
    ),
    recommendations: (data.recommendations || []).map((r: Record<string, unknown>) => ({
      current: r.current as string,
      alternative: r.alternative as string,
      potentialSavings: (r.potential_savings || r.potentialSavings) as number,
      percentReduction: (r.percent_reduction || r.percentReduction) as number,
    })),
  };
}

/**
 * Detect clashes between elements via Python backend
 */
export async function detectClashesMCP(
  elements: Array<{
    id: string;
    type: string;
    boundingBox: {
      min: [number, number, number];
      max: [number, number, number];
    };
  }>,
  checkClearances: boolean = true
): Promise<{
  statistics: {
    total: number;
    hard: number;
    soft: number;
    critical: number;
  };
  clashes: Array<{
    id: string;
    type: 'hard' | 'soft';
    severity: 'low' | 'medium' | 'high' | 'critical';
    elementA: { id: string; type: string };
    elementB: { id: string; type: string };
    location: [number, number, number];
  }>;
}> {
  const client = await ensureMCPClient();

  const result = await client.callTool('detect_clashes', {
    elements: elements,
    check_clearances: checkClearances,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = unwrapResult<any>(result, {
    statistics: { total: 0, hard: 0, soft: 0, critical: 0 },
    clashes: [],
  });

  return {
    statistics: data.statistics || { total: 0, hard: 0, soft: 0, critical: 0 },
    clashes: (data.clashes || []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      type: c.type as 'hard' | 'soft',
      severity: c.severity as 'low' | 'medium' | 'high' | 'critical',
      elementA: (c.element_a || c.elementA) as { id: string; type: string },
      elementB: (c.element_b || c.elementB) as { id: string; type: string },
      location: c.location as [number, number, number],
    })),
  };
}

/**
 * Check compliance via Python backend
 */
export async function checkComplianceMCP(
  modelData: {
    spaces?: Array<{ id: string; name: string; area: number }>;
    doors?: Array<{ id: string; width: number; clearWidth: number }>;
    corridors?: Array<{ id: string; width: number; length: number }>;
    stairs?: Array<{ id: string; riserHeight: number; treadDepth: number }>;
  },
  categories?: Array<'egress' | 'accessibility' | 'fire_safety' | 'ventilation'>
): Promise<{
  statistics: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  results: Array<{
    category: string;
    rule: string;
    status: 'passed' | 'failed' | 'warning';
    message: string;
    affectedElements?: string[];
  }>;
}> {
  const client = await ensureMCPClient();

  const result = await client.callTool('check_compliance', {
    model_data: modelData,
    categories: categories,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = unwrapResult<any>(result, {
    statistics: { total: 0, passed: 0, failed: 0, warnings: 0 },
    results: [],
  });

  return {
    statistics: data.statistics || { total: 0, passed: 0, failed: 0, warnings: 0 },
    results: (data.results || []).map((r: Record<string, unknown>) => ({
      category: r.category as string,
      rule: r.rule as string,
      status: r.status as 'passed' | 'failed' | 'warning',
      message: r.message as string,
      affectedElements: (r.affected_elements || r.affectedElements) as string[] | undefined,
    })),
  };
}

// ============================================
// BCF Tools (via Python Backend)
// ============================================

/**
 * Create BCF topic via Python backend
 */
export async function createBCFTopicMCP(data: {
  title: string;
  description: string;
  topicType?: 'clash' | 'design' | 'compliance' | 'rfi' | 'issue';
  priority?: 'low' | 'normal' | 'high' | 'critical';
  componentIds?: string[];
}): Promise<{
  guid: string;
  title: string;
  status: string;
  created: string;
}> {
  const client = await ensureMCPClient();

  const result = await client.callTool('create_bcf_topic', {
    title: data.title,
    description: data.description,
    topic_type: data.topicType || 'issue',
    priority: data.priority || 'normal',
    component_ids: data.componentIds || [],
  });

  return unwrapResult(result, {
    guid: '',
    title: data.title,
    status: 'open',
    created: new Date().toISOString(),
  });
}

/**
 * List BCF topics via Python backend
 */
export async function listBCFTopicsMCP(filters?: {
  topicType?: string;
  status?: string;
  priority?: string;
  limit?: number;
}): Promise<{
  count: number;
  topics: Array<{
    guid: string;
    title: string;
    status: string;
    topicType: string;
    priority: string;
    createdAt: string;
  }>;
}> {
  const client = await ensureMCPClient();

  const result = await client.callTool('list_bcf_topics', {
    topic_type: filters?.topicType,
    status: filters?.status,
    priority: filters?.priority,
    limit: filters?.limit || 50,
  });

  const data = unwrapResult(result, { count: 0, topics: [] });

  return {
    count: data.count || 0,
    topics: (data.topics || []).map((t: Record<string, unknown>) => ({
      guid: t.guid as string,
      title: t.title as string,
      status: (t.topic_status || t.status) as string,
      topicType: (t.topic_type || t.topicType) as string,
      priority: t.priority as string,
      createdAt: (t.creation_date || t.createdAt) as string,
    })),
  };
}

/**
 * Add comment to BCF topic via Python backend
 */
export async function addBCFCommentMCP(
  topicGuid: string,
  text: string
): Promise<{
  guid: string;
  text: string;
  created: string;
} | null> {
  const client = await ensureMCPClient();

  const result = await client.callTool('add_bcf_comment', {
    topic_guid: topicGuid,
    text: text,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = unwrapResult<any>(result, null);

  if (!data || data.error) {
    return null;
  }

  return {
    guid: data.guid,
    text: data.text,
    created: data.created,
  };
}

// ============================================
// Tool Registry for Agent Integration
// ============================================

/**
 * MCP Tools Registry - for integration with LangGraph agent
 */
export const MCP_TOOLS = {
  // IFC Operations (Python backend)
  parseIFCModel,
  queryElementsByTypeMCP,
  getElementByIdMCP,
  calculateQuantitiesMCP,

  // Analysis Operations (Python backend)
  analyzeCarbon,
  detectClashesMCP,
  checkComplianceMCP,

  // BCF Operations (Python backend)
  createBCFTopicMCP,
  listBCFTopicsMCP,
  addBCFCommentMCP,
};

export type MCPToolName = keyof typeof MCP_TOOLS;

// ============================================
// Connection Management
// ============================================

/**
 * Check if MCP backend is available
 */
export async function isMCPAvailable(): Promise<boolean> {
  try {
    const client = await ensureMCPClient();
    const tools = await client.listTools();
    return tools.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get list of available MCP tools from backend
 */
export async function getMCPToolList(): Promise<
  Array<{ name: string; description: string }>
> {
  try {
    const client = await ensureMCPClient();
    const tools = await client.listTools();
    return tools.map((t) => ({ name: t.name, description: t.description }));
  } catch {
    return [];
  }
}

/**
 * Reset MCP client (useful for reconnection)
 */
export function resetMCPTools(): void {
  if (mcpClient) {
    mcpClient.close();
    mcpClient = null;
  }
}
