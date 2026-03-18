/**
 * Carbon Calculation Types
 *
 * Type definitions for Thai carbon footprint database and calculations
 * Aligned with TGO CFP, Edge, and ISO 14064 standards
 */

// =============================================================================
// EMISSION FACTORS
// =============================================================================

/**
 * Source of emission factor data
 */
export type EmissionFactorSource =
  | 'TGO_CFP'           // Thailand Greenhouse Gas Management Organization
  | 'THAI_LCI'          // Thai National Life Cycle Inventory (MTEC)
  | 'ICE_BATH'          // University of Bath Inventory of Carbon and Energy
  | 'EPD'               // Environmental Product Declaration
  | 'MANUFACTURER'      // Direct from manufacturer
  | 'ESTIMATED';        // Calculated/estimated

/**
 * Scope categories per ISO 14064
 */
export type EmissionScope = 'scope1' | 'scope2' | 'scope3';

/**
 * Material category for construction
 */
// Alias for Thai-specific context
export type ThaiMaterialCategory = MaterialCategory;
export type MaterialCategory =
  | 'concrete'
  | 'steel'
  | 'cement'
  | 'brick'
  | 'aggregate'
  | 'timber'
  | 'glass'
  | 'aluminum'
  | 'insulation'
  | 'roofing'
  | 'flooring'
  | 'MEP'
  | 'finishes'
  | 'other';

/**
 * Unit of measurement
 */
export type EmissionUnit =
  | 'kgCO2e/kg'
  | 'kgCO2e/m3'
  | 'kgCO2e/m2'
  | 'kgCO2e/unit'
  | 'kgCO2e/kWh'
  | 'kgCO2e/tkm'    // ton-kilometer for transportation
  | 'kgCO2e/MJ';

/**
 * Emission factor entry in the database
 */
export interface EmissionFactor {
  id: string;
  name: string;
  nameTh: string;                    // Thai name
  category: MaterialCategory;

  // Emission values
  emissionFactor: number;            // Primary emission factor
  unit: EmissionUnit;
  uncertainty?: number;              // Uncertainty percentage (±%)

  // Data source
  source: EmissionFactorSource;
  sourceReference?: string;          // Document/study reference
  sourceYear?: number;               // Year of data

  // Lifecycle boundary
  boundary: 'cradle-to-gate' | 'cradle-to-site' | 'cradle-to-grave';

  // Thai-specific
  isThaiSpecific: boolean;
  tgoRegistrationNumber?: string;    // TGO CFP registration number

  // Low-carbon alternative
  hasLowCarbonAlternative?: boolean;
  lowCarbonAlternativeId?: string;
  carbonReductionPotential?: number; // Percentage reduction

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// MATERIALS DATABASE
// =============================================================================

/**
 * Thai construction material with carbon data
 */
export interface ThaiMaterial {
  id: string;
  name: string;
  nameTh: string;
  description?: string;

  // Classification
  category: MaterialCategory;
  subcategory?: string;

  // BOQ mapping
  boqCode?: string;                  // Standard BOQ item code
  kkpCode?: string;                  // KKP database reference

  // Emission data
  emissionFactorId: string;
  emissionFactor: number;
  unit: EmissionUnit;

  // Supplier info (optional)
  manufacturers?: string[];
  isLocallyProduced: boolean;
  productionRegion?: string;         // Province or region in Thailand

  // Recycled content
  recycledContentPercent?: number;

  // Alternatives
  alternatives?: MaterialAlternative[];
}

/**
 * Low-carbon material alternative
 */
export interface MaterialAlternative {
  materialId: string;
  name: string;
  nameTh: string;
  emissionFactor: number;
  unit: EmissionUnit;
  carbonReduction: number;           // Percentage reduction vs. standard
  costImpact?: 'lower' | 'same' | 'higher';
  availabilityInThailand: 'available' | 'limited' | 'import_only';
}

// =============================================================================
// BOQ INTEGRATION
// =============================================================================

/**
 * BOQ line item with carbon calculation
 */
export interface BOQCarbonItem {
  id: string;
  boqItemId: string;

  // BOQ data
  description: string;
  descriptionTh?: string;
  quantity: number;
  unit: string;
  unitCost: number;                    // THB per unit

  // Material mapping
  materialId?: string;
  materialCode?: string;               // BOQ material code reference
  emissionFactorId: string;

  // Carbon calculation
  embodiedCarbon: number;            // Total kgCO2e
  carbonIntensity: number;           // kgCO2e per unit

  // Breakdown by scope
  scope1Emissions: number;
  scope2Emissions: number;
  scope3Emissions: number;

  // Transportation (if applicable)
  transportDistance?: number;        // km
  transportEmissions?: number;       // kgCO2e
}

/**
 * BOQ carbon analysis result
 */
export interface BOQCarbonAnalysis {
  projectId: string;
  projectName: string;

  // Summary
  totalEmbodiedCarbon: number;       // Total kgCO2e
  carbonPerSquareMeter: number;      // kgCO2e/m²
  grossFloorArea: number;            // m²

  // Breakdown by category
  categoryBreakdown: {
    category: MaterialCategory;
    totalCarbon: number;
    percentage: number;
  }[];

  // Breakdown by scope
  scopeBreakdown: {
    scope1: number;
    scope2: number;
    scope3: number;
  };

  // Hotspots (top contributors)
  hotspots: {
    itemId: string;
    description: string;
    carbon: number;
    percentage: number;
  }[];

  // Items
  items: BOQCarbonItem[];

  // Metadata
  calculatedAt: Date;
  methodology: 'edge' | 'tgo_cfp' | 'iso14064';
}

// =============================================================================
// EDGE CERTIFICATION
// =============================================================================

/**
 * Edge certification levels
 */
export type EdgeCertificationLevel =
  | 'edge_certified'      // 20% improvement
  | 'edge_advanced'       // 40% improvement
  | 'edge_zero_carbon';   // Net zero embodied carbon

/**
 * Edge calculation result
 */
export interface EdgeCalculation {
  projectId: string;

  // Baseline vs. Optimized
  baselineCarbon: number;            // kgCO2e (standard construction)
  optimizedCarbon: number;           // kgCO2e (project design)
  carbonReduction: number;           // Percentage reduction

  // Certification eligibility
  certificationLevel?: EdgeCertificationLevel;
  meetsEdgeThreshold: boolean;

  // Improvement opportunities
  improvements: EdgeImprovement[];

  // Detailed breakdown
  materialBreakdown: {
    category: string;
    baseline: number;
    optimized: number;
    savings: number;
  }[];
}

/**
 * Edge improvement recommendation
 */
export interface EdgeImprovement {
  id: string;
  category: MaterialCategory;
  currentMaterial: string;
  suggestedMaterial: string;
  carbonSavings: number;             // kgCO2e
  percentageImprovement: number;
  implementationCost?: 'low' | 'medium' | 'high';
  priority: 'high' | 'medium' | 'low';
}

// =============================================================================
// CERTIFICATION & COMPLIANCE
// =============================================================================

/**
 * TGO T-VER project registration
 */
export interface TVERProject {
  projectId: string;
  projectName: string;

  // Registration data
  registrationStatus: 'draft' | 'submitted' | 'under_review' | 'registered' | 'verified';
  tgoProjectNumber?: string;

  // Emission reduction
  baselineEmissions: number;
  projectEmissions: number;
  emissionReductions: number;        // Credits (tCO2e)

  // Verification
  verificationBody?: string;
  verificationDate?: Date;
  creditsIssued?: number;
}

/**
 * TREES certification level
 */
export type TREESLevel = 'certified' | 'silver' | 'gold' | 'platinum';

/**
 * TREES credits breakdown
 */
export interface TREESCredits {
  mr4RecycledMaterial: number;     // Max 3 points
  mr5LocalMaterial: number;        // Max 3 points
  mr4Percentage?: number;          // Recycled content percentage
  mr5Percentage?: number;          // Local materials percentage
}

/**
 * TREES certification tracking
 */
export interface TREESCertification {
  projectId: string;
  assessmentDate: Date;

  // Target level
  targetLevel: TREESLevel;

  // Credits achieved
  credits?: {
    category: string;
    code: string;
    maxPoints: number;
    achievedPoints: number;
    autoCalculated: boolean;
  }[];

  // Category scores
  categoryScores: Record<string, number>;

  // Material & Resources (MR) credits
  mrCredits: TREESCredits;

  // Energy & Atmosphere (EA) credits
  eaCredits?: {
    ea1EnergyEfficiency: number;     // Max 15 points
  };

  totalPoints: number;
  pointsToNextLevel?: number;
  certificationStatus: 'eligible' | 'not_eligible';
  recommendations: string[];
}

// =============================================================================
// BANK DOCUMENTATION
// =============================================================================

/**
 * Green loan documentation
 */
export interface GreenLoanDocument {
  projectId: string;
  projectName: string;

  // Bank target
  targetBank: 'ghbank' | 'krungsri' | 'sme_dbank' | 'exim' | 'other';

  // Carbon metrics
  totalEmbodiedCarbon: number;
  carbonReductionPercent: number;
  baselineComparison: number;

  // Certification status
  edgeCertification?: EdgeCertificationLevel;
  treesCertification?: string;
  tverRegistration?: string;

  // Financial impact
  estimatedGreenPremium?: number;    // Additional loan amount/rate benefit

  // Document sections
  sections: {
    executiveSummary: string;
    projectOverview: string;
    carbonAnalysis: string;
    certificationStatus: string;
    sustainabilityMetrics: string;
  };

  // Generated files
  generatedAt: Date;
  documentUrl?: string;
}

// =============================================================================
// KNOWLEDGE GRAPH
// =============================================================================

/**
 * Standard/framework node in knowledge graph
 */
export interface StandardNode {
  id: string;
  name: string;
  nameTh: string;
  type: 'international' | 'thai' | 'certification' | 'guideline';
  organization: string;

  // Connections
  relatedStandards: string[];        // IDs of related standards
  dataRequirements: string[];        // What data is needed
  outputDocuments: string[];         // What documents it produces
}

/**
 * Relationship between standards
 */
export interface StandardRelationship {
  fromId: string;
  toId: string;
  relationshipType: 'requires' | 'supports' | 'alternative' | 'extends';
  description: string;
}

/**
 * Knowledge graph structure
 */
export interface StandardsKnowledgeGraph {
  nodes: StandardNode[];
  relationships: StandardRelationship[];

  // Quick lookups
  getRelatedStandards(standardId: string): StandardNode[];
  getDataRequirements(standardId: string): string[];
  getPath(fromId: string, toId: string): StandardNode[];
}

// =============================================================================
// TRANSPORTATION EMISSIONS
// =============================================================================

/**
 * Transportation emission calculation
 */
export interface TransportEmission {
  vehicleType: 'van_4wheel' | 'truck_6wheel' | 'truck_10wheel' | 'truck_18wheel';
  loadingPercent: number;            // 0-100
  distance: number;                  // km
  weight: number;                    // tons

  // Emission factors from TGO
  emissionFactor: number;            // kgCO2e/tkm
  totalEmissions: number;            // kgCO2e
}

/**
 * TGO transportation emission factors
 */
export const TGO_TRANSPORT_EMISSION_FACTORS: Record<string, Record<string, number>> = {
  // kgCO2e per ton-kilometer at different loading percentages
  van_4wheel: {
    '100': 0.2154,
    '75': 0.2872,
    '50': 0.4308,
  },
  truck_6wheel: {
    '100': 0.1077,
    '75': 0.1436,
    '50': 0.2154,
  },
  truck_10wheel: {
    '100': 0.0646,
    '75': 0.0862,
    '50': 0.1292,
  },
  truck_18wheel: {
    '100': 0.0431,
    '75': 0.0574,
    '50': 0.0862,
  },
};

// =============================================================================
// DATABASE TYPES (Shared types for carbon analysis)
// =============================================================================

/**
 * Carbon scope for analysis
 */
export type CarbonScope =
  | 'A1_A3'    // Product stage (raw material + manufacturing)
  | 'A1_A5'    // Product + construction stage
  | 'A_B'      // Product + construction + use stage
  | 'A_C'      // Product + construction + use + end of life
  | 'A_D';     // Full lifecycle including benefits

/**
 * Carbon data source
 */
export type CarbonDataSource =
  | 'ICE'           // Inventory of Carbon and Energy (Bath)
  | 'EC3'           // Embodied Carbon in Construction Calculator
  | 'EPD'           // Environmental Product Declaration
  | 'TGO_CFP'       // Thai TGO Carbon Footprint
  | 'Generic';      // Generic/default values

/**
 * Analysis status
 */
export type AnalysisStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

/**
 * Material carbon breakdown
 */
export interface MaterialCarbonBreakdown {
  material: string;
  carbon: number;
  mass: number;
  fraction: number;
}

/**
 * Carbon recommendation
 */
export interface CarbonRecommendation {
  id: string;
  type: 'material_swap' | 'design_change' | 'optimization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentCarbon: number;
  potentialCarbon: number;
  savingsPercent: number;
  affectedElements: string[];
}

// =============================================================================
// BIM TYPES (Stub types for standalone carbon library)
// =============================================================================

/**
 * BIM element types
 */
export type BIMElementType =
  | 'wall'
  | 'slab'
  | 'beam'
  | 'column'
  | 'roof'
  | 'door'
  | 'window'
  | 'stair'
  | 'pipe'
  | 'duct'
  | 'hvac'
  | 'furniture'
  | 'equipment'
  | 'space'
  | 'zone'
  | 'other';

/**
 * BIM element geometry
 */
export interface BIMGeometry {
  boundingBox?: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
}

/**
 * BIM element
 */
export interface BIMElement {
  id: string;
  globalId: string;
  name?: string;
  type: BIMElementType;
  level?: string;
  material?: string;
  properties?: Record<string, unknown>;
  geometry?: BIMGeometry;
}

/**
 * BIM model metadata
 */
export interface BIMModelMetadata {
  totalArea?: number;
  totalVolume?: number;
}

/**
 * BIM model
 */
export interface BIMModel {
  id: string;
  elements: BIMElement[];
  metadata?: BIMModelMetadata;
}

/**
 * Extracted material from IFC
 */
export interface ExtractedMaterial {
  name: string;
  density?: number;
  layers?: { name: string; thickness: number }[];
  constituents?: { name: string; fraction: number }[];
}

/**
 * Material layer
 */
export interface MaterialLayer {
  name: string;
  thickness: number;
}
