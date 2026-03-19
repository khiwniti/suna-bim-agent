// BIM Types - Core data structures for the BIM Agent Platform

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  min: Vector3;
  max: Vector3;
}

// Building Elements
export interface BIMElement {
  id: string;
  globalId: string;  // IFC GlobalId
  type: BIMElementType;
  name: string;
  level?: string;
  material?: string;
  properties: Record<string, string | number | boolean>;
  geometry?: {
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
    boundingBox: BoundingBox;
  };
  sustainability?: SustainabilityData;
}

export type BIMElementType =
  | 'wall'
  | 'door'
  | 'window'
  | 'slab'
  | 'roof'
  | 'stair'
  | 'column'
  | 'beam'
  | 'furniture'
  | 'equipment'
  | 'space'
  | 'zone'
  | 'hvac'
  | 'pipe'
  | 'duct'
  | 'other';

// Building Model
export interface BIMModel {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  source: 'ifc' | 'floorplan' | 'manual';
  fileUrl?: string;
  thumbnailUrl?: string;
  elements: BIMElement[];
  levels: BuildingLevel[];
  metadata: ModelMetadata;
  sustainability?: BuildingSustainability;
}

export interface BuildingLevel {
  id: string;
  name: string;
  elevation: number;
  height: number;
}

export interface ModelMetadata {
  totalArea?: number;           // m² (typically floor area)
  totalVolume?: number;         // m³
  elementCount: number;
  levelCount: number;
  boundingBox: BoundingBox;
  units: 'metric' | 'imperial';
  // Extended quantities for carbon analysis
  wallArea?: number;            // m² total wall surface area
  floorArea?: number;           // m² floor/slab area
  openingArea?: number;         // m² doors + windows
  roofArea?: number;            // m² roof area
}

// Sustainability Analytics
export interface SustainabilityData {
  embodiedCarbon?: number;      // kgCO2e
  operationalCarbon?: number;   // kgCO2e/year
  energyConsumption?: number;   // kWh/year
  waterConsumption?: number;    // L/year
  material?: MaterialData;
}

export interface MaterialData {
  type: string;
  quantity: number;
  unit: string;
  carbonFactor: number;         // kgCO2e per unit
  source: string;               // EPD source
  recyclable: boolean;
  recycledContent: number;      // percentage
}

export interface BuildingSustainability {
  totalEmbodiedCarbon: number;
  totalOperationalCarbon: number;
  energyUseIntensity: number;   // kWh/m²/year
  carbonIntensity: number;      // kgCO2e/m²
  certifications: string[];
  rating?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  recommendations: SustainabilityRecommendation[];
}

export interface SustainabilityRecommendation {
  id: string;
  category: 'energy' | 'materials' | 'water' | 'waste' | 'indoor-quality';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialSavings?: {
    carbon: number;
    cost: number;
    paybackYears: number;
  };
}

// Floor Plan Processing
export interface FloorPlan {
  id: string;
  name: string;
  imageUrl: string;
  status: 'uploading' | 'processing' | 'detected' | 'ready' | 'error';
  detectedElements?: DetectedElement[];
  processedModel?: BIMModel;
  error?: string;
}

export interface DetectedElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'room' | 'stair' | 'fixture';
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  properties?: Record<string, unknown>;
}

// Chat & Agent Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    elementRefs?: string[];     // Referenced BIM element IDs
    commands?: ViewportCommand[];
    sources?: string[];
    confidence?: number;
    isStreaming?: boolean;
    agentPhase?: 'idle' | 'thinking' | 'reasoning' | 'tool_calling' | 'tool_executing' | 'synthesizing' | 'responding';
    currentTask?: string;           // What the agent is currently working on
    conversationId?: string;
    error?: boolean;
    // Agent response metadata
    agentName?: string;         // Which specialist agent handled this
    viewportCommands?: ViewportCommand[];  // 3D viewer commands from agent;
    reasoning?: {               // Agent reasoning/thinking
      reasoning: string;
      nextAgent?: string;
      taskForAgent?: string;
      userResponse?: string;
    };
    // Generative UI Support
    uiComponents?: Array<{
      id: string;
      type: string; // e.g., "bim.CarbonResultCard", "bim.ToolCallCard"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      props: Record<string, any>;
      zone?: string;
    }>;
    toolCalls?: Array<{
      id: string;
      name: string;
      status: 'pending' | 'running' | 'success' | 'error';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      arguments?: Record<string, any>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result?: any;
      error?: string;
      progress?: number;
      description?: string;
    }>;
    // Summary of tools used in this message
    toolsUsed?: string[];
  };
}

export type ViewportCommandType =
  | 'highlight'
  | 'setView'
  | 'zoomTo'
  | 'isolate'
  | 'showAll'
  | 'select'
  | 'focus'
  | 'section';

export type ViewPreset = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right' | 'iso' | 'perspective';

export interface ViewportCommand {
  type: ViewportCommandType;
  data?: Record<string, unknown>;
}

// Quick Actions
export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  prompt: string;
  category: 'analysis' | 'navigation' | 'sustainability' | 'report';
}

// Project
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  models: BIMModel[];
  settings: ProjectSettings;
}

export interface ProjectSettings {
  defaultUnits: 'metric' | 'imperial';
  carbonDatabase: 'ice' | 'ec3' | 'custom';
  theme: 'light' | 'dark' | 'system';
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
  };
}

// Camera State
export interface CameraState {
  position: Vector3;
  target: Vector3;
  zoom: number;
  mode: 'orbit' | 'pan' | 'firstPerson';
}

// Selection State
export interface SelectionState {
  selectedIds: string[];
  hoveredId: string | null;
  isolatedIds: string[];
  hiddenIds: string[];
}
