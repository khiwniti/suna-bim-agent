/**
 * Floor Plan Types
 *
 * Type definitions for floor plan analysis and 3D generation
 */

// ============================================
// Room Types
// ============================================

export type RoomType =
  | 'bedroom'
  | 'bathroom'
  | 'kitchen'
  | 'living'
  | 'dining'
  | 'office'
  | 'hallway'
  | 'closet'
  | 'balcony'
  | 'elevator'
  | 'stairs'
  | 'storage'
  | 'utility'
  | 'unknown';

// ============================================
// Basic Geometry Types
// ============================================

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// ============================================
// Floor Plan Elements
// ============================================

export interface Wall {
  id: string;
  start: Point2D;
  end: Point2D;
  thickness: number;
  height: number;
  type: 'exterior' | 'interior' | 'partition';
}

export interface Opening {
  id: string;
  type: 'door' | 'window' | 'archway';
  position: Point2D;
  width: number;
  height: number;
  wallId: string;
  swingDirection?: 'left' | 'right' | 'double' | 'sliding';
}

export interface Room {
  id: string;
  type: RoomType;
  polygon: Point2D[];
  centroid: Point2D;
  areaSquareMeters: number;
  label?: string;
}

export interface Furniture {
  id: string;
  type: string;
  position: Point2D;
  rotation: number;
  boundingBox: BoundingBox;
}

// ============================================
// Floor Plan Analysis Result
// ============================================

export interface FloorPlanScale {
  pixelsPerMeter: number;
  detected: boolean;
  referenceLength?: number;
}

export interface FloorPlanAnalysis {
  id: string;
  imageUrl: string;
  imageDimensions: {
    width: number;
    height: number;
  };
  scale: FloorPlanScale;
  walls: Wall[];
  openings: Opening[];
  rooms: Room[];
  furniture: Furniture[];
  metadata: {
    analyzedAt: string;
    modelUsed: string;
    confidence: number;
    processingTimeMs: number;
  };
}

// ============================================
// 3D Model Types
// ============================================

export interface Wall3D {
  id: string;
  vertices: Point3D[];
  faces: number[][];
  material: {
    color: string;
    roughness: number;
    metalness: number;
  };
  openings: Opening3D[];
}

export interface Opening3D {
  id: string;
  type: 'door' | 'window' | 'archway';
  position: Point3D;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
}

export interface Room3D {
  id: string;
  type: RoomType;
  floor: {
    vertices: Point3D[];
    material: {
      color: string;
      texture?: string;
    };
  };
  ceiling?: {
    height: number;
    material: {
      color: string;
    };
  };
  label: {
    text: string;
    position: Point3D;
  };
}

export interface FloorPlan3D {
  id: string;
  sourceAnalysis: FloorPlanAnalysis;
  walls: Wall3D[];
  rooms: Room3D[];
  boundingBox: {
    min: Point3D;
    max: Point3D;
  };
  metadata: {
    generatedAt: string;
    totalFloorArea: number;
    wallHeight: number;
  };
}

// ============================================
// Processing Pipeline Types
// ============================================

export interface ProcessingStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface FloorPlanProcessingState {
  sessionId: string;
  imageUrl: string;
  currentStep: string;
  steps: ProcessingStep[];
  analysis?: FloorPlanAnalysis;
  model3D?: FloorPlan3D;
  error?: string;
}

// ============================================
// Vision LLM Response Types
// ============================================

export interface VisionAnalysisRequest {
  imageBase64?: string;
  imageUrl?: string;
  analysisType: 'full' | 'walls_only' | 'rooms_only' | 'openings_only';
  scale?: {
    knownDimension?: number;
    unit: 'meters' | 'feet';
  };
}

export interface VisionAnalysisResponse {
  success: boolean;
  analysis?: FloorPlanAnalysis;
  rawResponse?: object;
  error?: string;
}
