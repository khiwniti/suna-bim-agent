/**
 * Database Types - TypeScript type definitions for BIM database schema
 *
 * These types mirror the Prisma schema and can be used throughout
 * the application for type-safe database operations.
 *
 * ★ Insight ─────────────────────────────────────
 * These types are separate from the Prisma generated types to allow
 * for custom transformations and API serialization. Use Prisma types
 * in database operations, these types in API boundaries.
 * ─────────────────────────────────────────────────
 */

// ============================================
// Core Entity Types
// ============================================

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type ModelStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR';
export type AnalysisStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type CarbonScope = 'A1_A3' | 'A1_A5' | 'A_B' | 'A_C' | 'A_D';
export type CarbonDataSource = 'ICE' | 'EC3' | 'EPD' | 'OEKOBAUDAT' | 'CUSTOM';

export type DBElementType =
  | 'WALL'
  | 'SLAB'
  | 'ROOF'
  | 'DOOR'
  | 'WINDOW'
  | 'STAIR'
  | 'COLUMN'
  | 'BEAM'
  | 'FURNITURE'
  | 'EQUIPMENT'
  | 'SPACE'
  | 'ZONE'
  | 'HVAC'
  | 'PIPE'
  | 'DUCT'
  | 'OTHER';

// ============================================
// Project Types
// ============================================

export interface DBProject {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  status: ProjectStatus;
  ownerId: string;
  teamId: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export interface DBProjectWithModels extends DBProject {
  models: DBBIMModel[];
}

export interface DBProjectWithAnalyses extends DBProject {
  analyses: DBCarbonAnalysis[];
}

// ============================================
// BIM Model Types
// ============================================

export interface DBBIMModel {
  id: string;
  name: string;
  filename: string;
  fileSize: number;
  fileHash: string | null;
  storageUrl: string;
  ifcSchema: string | null;
  ifcAuthor: string | null;
  ifcApplication: string | null;
  ifcVersion: string | null;
  elementCount: number;
  levelCount: number;
  minX: number | null;
  minY: number | null;
  minZ: number | null;
  maxX: number | null;
  maxY: number | null;
  maxZ: number | null;
  status: ModelStatus;
  processedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
}

export interface DBBIMModelWithElements extends DBBIMModel {
  elements: DBBIMElement[];
  levels: DBBuildingLevel[];
}

// ============================================
// Building Level Types
// ============================================

export interface DBBuildingLevel {
  id: string;
  globalId: string;
  name: string;
  elevation: number;
  height: number | null;
  parentId: string | null;
  modelId: string;
}

// ============================================
// BIM Element Types
// ============================================

export interface DBBIMElement {
  id: string;
  globalId: string;
  name: string | null;
  objectType: string | null;
  elementType: DBElementType;
  ifcType: string;
  levelId: string | null;
  minX: number | null;
  minY: number | null;
  minZ: number | null;
  maxX: number | null;
  maxY: number | null;
  maxZ: number | null;
  properties: Record<string, PropertyValue>;
  quantities: Record<string, QuantityValue>;
  volume: number | null;
  area: number | null;
  length: number | null;
  weight: number | null;
  createdAt: Date;
  updatedAt: Date;
  modelId: string;
}

export interface PropertyValue {
  value: string | number | boolean;
  type?: string;
  unit?: string;
}

export interface QuantityValue {
  value: number;
  type: string;
  unit: string;
}

export interface DBBIMElementWithRelations extends DBBIMElement {
  level: DBBuildingLevel | null;
  materials: DBMaterialAssociation[];
  classifications: DBClassification[];
}

// ============================================
// Material Types
// ============================================

export interface DBMaterial {
  id: string;
  name: string;
  category: string | null;
  density: number | null;
  embodiedCarbonA1A3: number | null;
  embodiedCarbonA4: number | null;
  embodiedCarbonB1B5: number | null;
  embodiedCarbonC1C4: number | null;
  embodiedCarbonD: number | null;
  dataSource: CarbonDataSource;
  sourceId: string | null;
  sourceVersion: string | null;
  verified: boolean;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBMaterialAssociation {
  id: string;
  fraction: number | null;
  thickness: number | null;
  volume: number | null;
  mass: number | null;
  layerIndex: number | null;
  layerName: string | null;
  elementId: string;
  materialId: string;
  modelId: string;
}

export interface DBMaterialAssociationWithMaterial extends DBMaterialAssociation {
  material: DBMaterial;
}

// ============================================
// Classification Types
// ============================================

export interface DBClassification {
  id: string;
  system: string;
  code: string;
  name: string | null;
  description: string | null;
  elementId: string;
}

// ============================================
// Carbon Analysis Types
// ============================================

export interface DBCarbonAnalysis {
  id: string;
  name: string | null;
  description: string | null;
  scope: CarbonScope;
  totalCarbon: number | null;
  carbonByType: Record<string, number> | null;
  carbonByLevel: Record<string, number> | null;
  carbonByMaterial: Record<string, number> | null;
  carbonPerArea: number | null;
  carbonPerVolume: number | null;
  grossFloorArea: number | null;
  buildingVolume: number | null;
  status: AnalysisStatus;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  modelId: string;
}

export interface DBCarbonAnalysisWithElements extends DBCarbonAnalysis {
  elements: DBElementCarbonData[];
}

export interface DBElementCarbonData {
  id: string;
  carbonA1A3: number | null;
  carbonA4: number | null;
  carbonB1B5: number | null;
  carbonC1C4: number | null;
  carbonD: number | null;
  totalCarbon: number | null;
  volume: number | null;
  area: number | null;
  mass: number | null;
  materialBreakdown: MaterialCarbonBreakdown[] | null;
  elementId: string;
  analysisId: string;
}

export interface MaterialCarbonBreakdown {
  material: string;
  carbon: number;
  mass: number;
  fraction: number;
}

// ============================================
// Comment Types
// ============================================

export interface DBComment {
  id: string;
  content: string;
  viewpoint: BCFViewpoint | null;
  elementIds: string[];
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  authorId: string;
}

export interface BCFViewpoint {
  guid: string;
  camera: {
    viewPoint: { x: number; y: number; z: number };
    direction: { x: number; y: number; z: number };
    upVector: { x: number; y: number; z: number };
  };
  clippingPlanes?: Array<{
    location: { x: number; y: number; z: number };
    direction: { x: number; y: number; z: number };
  }>;
  lines?: Array<{
    startPoint: { x: number; y: number; z: number };
    endPoint: { x: number; y: number; z: number };
  }>;
  snapshot?: string; // Base64 image
}

export interface DBCommentWithReplies extends DBComment {
  replies: DBComment[];
}

// ============================================
// Carbon Material Reference Types
// ============================================

export interface DBCarbonMaterialRef {
  id: string;
  source: CarbonDataSource;
  sourceId: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  gwpA1A3: number;
  gwpA4: number | null;
  gwpA5: number | null;
  gwpB1: number | null;
  gwpB2: number | null;
  gwpB3: number | null;
  gwpB4: number | null;
  gwpB5: number | null;
  gwpC1: number | null;
  gwpC2: number | null;
  gwpC3: number | null;
  gwpC4: number | null;
  gwpD: number | null;
  density: number | null;
  dataQuality: string | null;
  geography: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  importedAt: Date;
  updatedAt: Date;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateProjectRequest {
  name: string;
  description?: string;
  thumbnail?: string;
  teamId?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  thumbnail?: string;
  status?: ProjectStatus;
}

export interface UploadModelRequest {
  projectId: string;
  name: string;
  file: File;
}

export interface RunCarbonAnalysisRequest {
  modelId: string;
  name?: string;
  description?: string;
  scope?: CarbonScope;
  materialMappings?: Record<string, string>; // elementType -> materialId
}

export interface CarbonAnalysisResult {
  analysis: DBCarbonAnalysis;
  summary: {
    totalCarbon: number;
    carbonByType: Record<string, number>;
    carbonByLevel: Record<string, number>;
    carbonByMaterial: Record<string, number>;
    benchmarks: {
      carbonPerArea: number;
      carbonPerVolume: number;
      industryAverage: number;
      percentile: number;
    };
  };
  recommendations: CarbonRecommendation[];
}

export interface CarbonRecommendation {
  id: string;
  type: 'material_swap' | 'design_change' | 'specification';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentCarbon: number;
  potentialCarbon: number;
  savingsPercent: number;
  affectedElements: string[];
}

// ============================================
// Query Filter Types
// ============================================

export interface ElementFilter {
  modelId?: string;
  levelId?: string;
  elementTypes?: DBElementType[];
  ifcTypes?: string[];
  hasCarbon?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface MaterialFilter {
  category?: string;
  dataSource?: CarbonDataSource;
  verified?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AnalysisFilter {
  projectId?: string;
  modelId?: string;
  status?: AnalysisStatus;
  scope?: CarbonScope;
  limit?: number;
  offset?: number;
}
