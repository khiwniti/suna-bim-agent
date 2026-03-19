/**
 * Type definitions for the BIM Agent system
 */

// =============================================================================
// AGENT STATE TYPES
// =============================================================================

export interface ProjectContext {
  modelId: string;
  modelName: string;
  totalArea: number;
  floors: Floor[];
  selectedElements: string[];
  sustainabilityTarget: string;
  location?: {
    latitude: number;
    longitude: number;
    climateZone?: string;
  };
}

export interface Floor {
  id: string;
  name: string;
  level: number;
  area: number;
  rooms: Room[];
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  area: number;
  height: number;
  adjacentRooms: string[];
}

export type RoomType =
  | 'office'
  | 'meeting'
  | 'corridor'
  | 'lobby'
  | 'restroom'
  | 'kitchen'
  | 'storage'
  | 'mechanical'
  | 'electrical'
  | 'stairwell'
  | 'elevator'
  | 'other';

// =============================================================================
// EXECUTION PLAN TYPES
// =============================================================================

export interface ExecutionPlan {
  id: string;
  goal: string;
  steps: PlanStep[];
  currentStep: number;
  completedSteps: string[];
  status: PlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanStep {
  id: string;
  description: string;
  agent: AgentType;
  tools: string[];
  dependencies: string[];
  status: StepStatus;
  result?: unknown;
  error?: string;
}

export type PlanStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export type AgentType =
  | 'supervisor'
  | 'planner'
  // Design & Analysis Specialists
  | 'architectural'
  | 'structural'
  | 'mep'
  | 'sustainability'
  | 'cost_estimator'
  | 'code_compliance'
  | 'clash_detection'
  // Coordination
  | 'coordination'
  // Operations & Facility Management
  | 'facility_manager'
  | 'maintenance'
  | 'asset_tracker'
  // System
  | 'aggregator'
  | 'human_review'
  | 'error_handler'
  // Legacy aliases
  | 'spatial'
  | 'spatial_analyzer'
  | 'sustainability_calc'
  | 'floor_plan'
  | 'floor_plan_analyzer'
  | 'mep_analyzer';

// =============================================================================
// ANALYSIS RESULT TYPES
// =============================================================================

export interface AnalysisResult {
  type: string;
  agent: AgentType;
  timestamp: Date;
  data: unknown;
  confidence: number;
  recommendations?: Recommendation[];
}

export interface SpatialAnalysisResult extends AnalysisResult {
  type: 'spatial';
  data: {
    elementsFound: number;
    elements: BIMElement[];
    distances?: DistanceMeasurement[];
    adjacencies?: AdjacencyInfo[];
  };
}

export interface SustainabilityResult extends AnalysisResult {
  type: 'sustainability';
  data: {
    embodiedCarbon: CarbonMetrics;
    operationalCarbon?: CarbonMetrics;
    energyMetrics: EnergyMetrics;
    rating: SustainabilityRating;
  };
}

export interface FloorPlanResult extends AnalysisResult {
  type: 'floor_plan';
  data: {
    circulationScore: number;
    spaceEfficiency: number;
    accessibilityCompliant: boolean;
    egressCompliant: boolean;
    issues: FloorPlanIssue[];
  };
}

// =============================================================================
// BIM ELEMENT TYPES
// =============================================================================

export interface BIMElement {
  id: string;
  type: string;
  name: string;
  geometry: {
    position: [number, number, number];
    dimensions: [number, number, number];
    rotation?: [number, number, number];
  };
  properties: Record<string, unknown>;
  materials?: MaterialInfo[];
}

export interface MaterialInfo {
  id: string;
  name: string;
  category: string;
  volume: number;
  carbonFactor: number; // kgCO2e per m³
}

export interface DistanceMeasurement {
  from: string;
  to: string;
  euclidean: number;
  walkingDistance?: number;
  unit: 'meters';
}

export interface AdjacencyInfo {
  roomId: string;
  adjacentRooms: string[];
  connections: ConnectionInfo[];
}

export interface ConnectionInfo {
  type: 'door' | 'window' | 'opening' | 'wall';
  elementId: string;
  connectedRoomId: string;
}

// =============================================================================
// SUSTAINABILITY TYPES
// =============================================================================

export interface CarbonMetrics {
  total: number;
  perSquareMeter: number;
  unit: 'kgCO2e';
  breakdown: Record<string, number>;
  hotspots: CarbonHotspot[];
}

export interface CarbonHotspot {
  elementType: string;
  contribution: number;
  percentage: number;
  recommendation: string;
}

export interface EnergyMetrics {
  annualEnergy: number;
  energyUseIntensity: number;
  unit: 'kWh';
  breakdown: {
    heating: number;
    cooling: number;
    lighting: number;
    equipment: number;
  };
  peakDemand: number;
}

export type SustainabilityRating = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

// =============================================================================
// FLOOR PLAN TYPES
// =============================================================================

export interface FloorPlanIssue {
  id: string;
  type: 'circulation' | 'accessibility' | 'egress' | 'efficiency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    floorId: string;
    roomId?: string;
    position?: [number, number, number];
  };
  description: string;
  recommendation: string;
}

// =============================================================================
// APPROVAL TYPES
// =============================================================================

export interface Approval {
  id: string;
  type: ApprovalType;
  description: string;
  data: unknown;
  requestedBy: AgentType;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  resolution?: {
    decidedAt: Date;
    decision: 'approved' | 'rejected';
    comment?: string;
  };
}

export type ApprovalType =
  | 'model_modification'
  | 'high_cost_recommendation'
  | 'structural_change'
  | 'safety_override'
  | 'data_export';

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface AgentError {
  id: string;
  type: string;
  agent: AgentType;
  action: string;
  message: string;
  context?: Record<string, unknown>;
  timestamp: Date;
  handled: boolean;
  recovered?: boolean;
  resolution?: string;
  retryCount: number;
}

// =============================================================================
// RECOMMENDATION TYPES
// =============================================================================

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  potentialSavings?: {
    carbon?: number;
    energy?: number;
    cost?: number;
    paybackYears?: number;
  };
  implementationSteps?: string[];
}

export type RecommendationCategory =
  | 'materials'
  | 'energy'
  | 'layout'
  | 'systems'
  | 'envelope'
  | 'operations';

// =============================================================================
// QUOTE TYPES
// =============================================================================

export interface Quote {
  id: string;
  modelId: string;
  totalCost: number;
  currency: string;
  costPerSquareFoot: number;
  breakdown: QuoteBreakdown;
  assumptions: string[];
  contingency: number;
  timeline: TimelineEstimate;
  confidence: number;
  generatedAt: Date;
}

export interface QuoteBreakdown {
  structure: number;
  envelope: number;
  interior: number;
  mep: number;
  sitework: number;
  softCosts: number;
}

export interface TimelineEstimate {
  totalWeeks: number;
  phases: {
    name: string;
    durationWeeks: number;
    dependencies: string[];
  }[];
}

// =============================================================================
// TOOL CALL TYPES
// =============================================================================

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: unknown;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

// =============================================================================
// MESSAGE TYPES
// =============================================================================

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
  timestamp: Date;
  metadata?: {
    agent?: AgentType;
    tokens?: number;
    latencyMs?: number;
  };
}

// Alias for backwards compatibility
export type Message = AgentMessage;

// =============================================================================
// VIEWPORT COMMAND TYPES
// =============================================================================

export type ViewportCommandType =
  | 'highlight'
  | 'setView'
  | 'zoomTo'
  | 'isolate'
  | 'showAll'
  | 'select'
  | 'focus';

export type ViewPreset = 'top' | 'front' | 'back' | 'left' | 'right' | 'iso' | 'perspective';

export interface ViewportCommand {
  type: ViewportCommandType;
  data?: {
    elementIds?: string[];
    preset?: ViewPreset;
    color?: string;
    duration?: number;
  };
}

// =============================================================================
// UI COMMAND TYPES (superset includes viewport + analytics)
// =============================================================================

export type UICommandType = ViewportCommandType | 'updateAnalytics';

export interface UICommand {
  type: UICommandType;
  data?: Record<string, unknown>;
}

// =============================================================================
// TOOL RESULT TYPES
// =============================================================================

export interface ToolResult {
  toolCallId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}
