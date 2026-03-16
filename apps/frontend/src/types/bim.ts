/**
 * BIM (Building Information Modeling) Type Definitions
 * 
 * Core types for BIM model handling, analysis results, and viewer state
 * Used throughout the BIM integration in Suna platform
 */

// ============================================================================
// IFC Element Types
// ============================================================================

/**
 * IFC Element classification following IFC4 schema
 */
export type IFCElementType =
  | 'IfcWall'
  | 'IfcWallStandardCase'
  | 'IfcSlab'
  | 'IfcColumn'
  | 'IfcBeam'
  | 'IfcDoor'
  | 'IfcWindow'
  | 'IfcRoof'
  | 'IfcStair'
  | 'IfcRailing'
  | 'IfcCurtainWall'
  | 'IfcPlate'
  | 'IfcMember'
  | 'IfcFooting'
  | 'IfcPile'
  | 'IfcBuildingElementProxy'
  // MEP Elements
  | 'IfcPipeSegment'
  | 'IfcDuctSegment'
  | 'IfcCableCarrierSegment'
  | 'IfcFlowTerminal'
  | 'IfcFlowSegment'
  | 'IfcFlowFitting'
  | 'IfcFlowController'
  | 'IfcEnergyConversionDevice'
  | 'IfcFlowStorageDevice'
  | 'IfcFlowTreatmentDevice'
  | 'IfcFlowMovingDevice'
  // Spatial Elements
  | 'IfcSpace'
  | 'IfcBuildingStorey'
  | 'IfcBuilding'
  | 'IfcSite'
  | 'IfcProject';

/**
 * Material information for IFC elements
 */
export interface IFCMaterial {
  id: string;
  name: string;
  category?: string;
  thickness?: number; // in meters
  density?: number; // kg/m3
  thermalConductivity?: number; // W/(m*K)
  embodiedCarbon?: number; // kgCO2e/kg
}

/**
 * Property set data from IFC
 */
export interface IFCPropertySet {
  name: string;
  properties: Record<string, string | number | boolean>;
}

/**
 * Quantity data from IFC (Qto_*)
 */
export interface IFCQuantity {
  name: string;
  value: number;
  unit: string;
}

/**
 * Represents an IFC element with its properties
 */
export interface IFCElement {
  globalId: string;
  expressId: number;
  type: IFCElementType | string;
  name: string;
  description?: string;
  objectType?: string;
  tag?: string;
  
  // Spatial containment
  containedInStorey?: string;
  containedInSpace?: string;
  
  // Material and quantities
  materials: IFCMaterial[];
  quantities: IFCQuantity[];
  propertySets: IFCPropertySet[];
  
  // Geometry bounds (AABB)
  boundingBox?: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  
  // Calculated properties
  volume?: number; // m3
  area?: number; // m2
  length?: number; // m
}

// ============================================================================
// BIM Model Types
// ============================================================================

/**
 * BIM model metadata
 */
export interface BIMModelMetadata {
  fileName: string;
  fileSize: number; // bytes
  ifcSchema: 'IFC2X3' | 'IFC4' | 'IFC4X3';
  createdAt: string;
  lastModified: string;
  application?: string;
  author?: string;
  organization?: string;
  
  // Project information
  projectName?: string;
  projectPhase?: string;
  buildingName?: string;
  siteName?: string;
  
  // Location (if available)
  latitude?: number;
  longitude?: number;
  elevation?: number;
  
  // Statistics
  elementCount: number;
  storeyCount: number;
  spaceCount: number;
}

/**
 * Represents a loaded BIM model
 */
export interface BIMModel {
  id: string;
  filePath: string;
  metadata: BIMModelMetadata;
  loadedAt: string;
  
  // Spatial structure
  storeys: Array<{
    globalId: string;
    name: string;
    elevation: number;
    height?: number;
  }>;
  
  // Element summary by type
  elementSummary: Record<string, number>;
  
  // Model status
  status: 'loading' | 'ready' | 'error' | 'partial';
  errorMessage?: string;
}

// ============================================================================
// Analysis Result Types
// ============================================================================

/**
 * Analysis types available in the BIM platform
 */
export type BIMAnalysisType =
  | 'carbon_footprint'
  | 'clash_detection'
  | 'code_compliance'
  | 'mep_analysis'
  | 'cost_estimation'
  | 'knowledge_graph';

/**
 * Carbon footprint analysis result
 */
export interface CarbonAnalysisResult {
  type: 'carbon_footprint';
  totalEmbodiedCarbon: number; // kgCO2e
  totalOperationalCarbon?: number; // kgCO2e/year
  totalGWP: number; // Global Warming Potential
  
  // Breakdown by element type
  byElementType: Array<{
    elementType: string;
    count: number;
    totalCarbon: number;
    percentage: number;
  }>;
  
  // Breakdown by material
  byMaterial: Array<{
    materialName: string;
    mass: number; // kg
    embodiedCarbon: number; // kgCO2e
    percentage: number;
  }>;
  
  // Breakdown by life cycle stage (A1-A5, B1-B7, C1-C4)
  byLifeCycleStage?: Record<string, number>;
  
  // Recommendations
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    description: string;
    potentialSavings: number; // kgCO2e
    affectedElements: string[]; // globalIds
  }>;
  
  // Thai building context
  thaiContext?: {
    complianceWithEITStandards: boolean;
    benchmarkComparison: 'below_average' | 'average' | 'above_average' | 'excellent';
    localMaterialAlternatives: Array<{
      currentMaterial: string;
      alternative: string;
      carbonReduction: number;
    }>;
  };
}

/**
 * Clash detection result
 */
export interface ClashDetectionResult {
  type: 'clash_detection';
  totalClashes: number;
  
  clashes: Array<{
    id: string;
    severity: 'hard' | 'soft' | 'warning';
    clashType: 'intersection' | 'clearance' | 'duplicate';
    
    element1: {
      globalId: string;
      name: string;
      type: string;
      discipline: 'architectural' | 'structural' | 'mep' | 'other';
    };
    
    element2: {
      globalId: string;
      name: string;
      type: string;
      discipline: 'architectural' | 'structural' | 'mep' | 'other';
    };
    
    location: {
      x: number;
      y: number;
      z: number;
      storey?: string;
    };
    
    distance?: number; // for clearance clashes
    overlapVolume?: number; // for intersections
    
    status: 'new' | 'active' | 'reviewed' | 'resolved' | 'approved';
    assignedTo?: string;
    comments?: string[];
  }>;
  
  summary: {
    bySeverity: Record<'hard' | 'soft' | 'warning', number>;
    byDisciplinePair: Record<string, number>;
    byStorey: Record<string, number>;
  };
}

/**
 * Thai building code compliance result
 */
export interface CodeComplianceResult {
  type: 'code_compliance';
  overallCompliance: 'compliant' | 'non_compliant' | 'needs_review';
  complianceScore: number; // 0-100
  
  // Thai building codes checked
  codesChecked: Array<{
    code: string; // e.g., 'มยผ. 1301', 'พ.ร.บ. ควบคุมอาคาร'
    name: string;
    nameEn: string;
    version: string;
    status: 'pass' | 'fail' | 'warning' | 'not_applicable';
    details?: string;
  }>;
  
  violations: Array<{
    id: string;
    severity: 'critical' | 'major' | 'minor';
    code: string;
    requirement: string;
    requirementThai: string;
    actualValue: string | number;
    requiredValue: string | number;
    affectedElements: string[];
    recommendation: string;
    recommendationThai: string;
  }>;
  
  // EIT (วิศวกรรมสถานแห่งประเทศไทย) standards
  eitCompliance?: {
    structuralCode: 'มยผ. 1301' | 'มยผ. 1302';
    seismicZone: string;
    windZone: string;
    status: 'compliant' | 'non_compliant';
  };
  
  // Fire safety (ความปลอดภัยด้านอัคคีภัย)
  fireSafety?: {
    egressWidth: { required: number; actual: number; pass: boolean };
    exitCount: { required: number; actual: number; pass: boolean };
    travelDistance: { max: number; actual: number; pass: boolean };
    fireRating: { required: string; actual: string; pass: boolean };
  };
}

/**
 * MEP Analysis result
 */
export interface MEPAnalysisResult {
  type: 'mep_analysis';
  
  hvac?: {
    totalCoolingLoad: number; // kW
    totalHeatingLoad: number; // kW
    airflowRate: number; // m3/h
    ductworkLength: number; // m
    equipmentCount: number;
    efficiency?: number;
  };
  
  plumbing?: {
    pipeLength: number; // m
    fixtureCount: number;
    waterDemand: number; // L/day
    drainageCapacity: number; // L/min
  };
  
  electrical?: {
    totalLoad: number; // kW
    panelCount: number;
    cableLength: number; // m
    lightingPowerDensity?: number; // W/m2
  };
  
  // Coordination issues between MEP disciplines
  coordinationIssues: Array<{
    description: string;
    affectedSystems: string[];
    severity: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Cost estimation result
 */
export interface CostEstimationResult {
  type: 'cost_estimation';
  currency: 'THB' | 'USD';
  
  totalCost: number;
  costPerSquareMeter: number;
  
  breakdown: Array<{
    category: string;
    categoryThai: string;
    cost: number;
    percentage: number;
    unitCost?: number;
    quantity?: number;
    unit?: string;
  }>;
  
  // Thai market context
  marketContext?: {
    priceDate: string;
    region: string; // Bangkok, Central, North, etc.
    buildingType: string;
    benchmarkRange: { low: number; high: number };
  };
}

/**
 * Knowledge graph query result
 */
export interface KnowledgeGraphResult {
  type: 'knowledge_graph';
  query: string;
  
  nodes: Array<{
    id: string;
    type: string;
    name: string;
    properties: Record<string, unknown>;
  }>;
  
  relationships: Array<{
    source: string;
    target: string;
    type: string;
    properties?: Record<string, unknown>;
  }>;
  
  insights: string[];
}

/**
 * Union type for all analysis results
 */
export type BIMAnalysisResult =
  | CarbonAnalysisResult
  | ClashDetectionResult
  | CodeComplianceResult
  | MEPAnalysisResult
  | CostEstimationResult
  | KnowledgeGraphResult;

/**
 * Wrapper for analysis result with metadata
 */
export interface BIMAnalysisResultWrapper {
  id: string;
  modelId: string;
  analysisType: BIMAnalysisType;
  result: BIMAnalysisResult;
  createdAt: string;
  duration: number; // ms
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

// ============================================================================
// Viewer State Types
// ============================================================================

/**
 * 3D Viewer settings and state
 */
export interface BIMViewerState {
  // Display options
  showGrid: boolean;
  showAxes: boolean;
  backgroundColor: string;
  
  // Selection colors
  selectionColor: string;
  highlightColor: string;
  
  // Visibility
  transparencyEnabled: boolean;
  hiddenElements: string[]; // globalIds of hidden elements
  isolatedElements: string[]; // if not empty, only these are visible
  
  // Section plane
  sectionPlaneEnabled: boolean;
  sectionPlane?: {
    position: { x: number; y: number; z: number };
    normal: { x: number; y: number; z: number };
  };
  
  // Measurement mode
  measurementMode: boolean;
  measurements?: Array<{
    id: string;
    type: 'distance' | 'angle' | 'area';
    value: number;
    unit: string;
    points: Array<{ x: number; y: number; z: number }>;
  }>;
  
  // Camera state
  camera?: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    up: { x: number; y: number; z: number };
    projection: 'perspective' | 'orthographic';
  };
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request to analyze a BIM model
 */
export interface BIMAnalysisRequest {
  modelId: string;
  analysisType: BIMAnalysisType;
  options?: {
    // Carbon analysis options
    lifeCycleStages?: string[];
    includeOperational?: boolean;
    
    // Clash detection options
    tolerance?: number;
    disciplines?: string[];
    
    // Compliance options
    codes?: string[];
    
    // Common options
    elementFilter?: {
      types?: string[];
      storeys?: string[];
      spaces?: string[];
    };
  };
  
  // Language preference
  locale?: 'en' | 'th';
}

/**
 * Response from BIM analysis endpoint
 */
export interface BIMAnalysisResponse {
  success: boolean;
  analysisId: string;
  result?: BIMAnalysisResultWrapper;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Request to load a BIM model
 */
export interface BIMModelLoadRequest {
  filePath: string;
  options?: {
    loadGeometry?: boolean;
    loadProperties?: boolean;
    loadRelationships?: boolean;
    coordinateSystem?: 'local' | 'wcs';
  };
}

/**
 * Response from model load endpoint
 */
export interface BIMModelLoadResponse {
  success: boolean;
  model?: BIMModel;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * BIM viewer events
 */
export interface BIMViewerEvents {
  onElementSelect: (elementIds: string[]) => void;
  onElementHover: (elementId: string | null) => void;
  onElementDoubleClick: (elementId: string) => void;
  onViewerReady: () => void;
  onModelLoad: (model: BIMModel) => void;
  onModelError: (error: Error) => void;
  onMeasurementComplete: (measurement: BIMViewerState['measurements'][0]) => void;
}
