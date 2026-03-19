/**
 * 3D Geometry Types
 *
 * Type definitions for Three.js-compatible geometry generation
 */

import type { Point3D } from '../vision/types';

// ============================================
// Mesh Definitions
// ============================================

export interface MeshData {
  id: string;
  type: 'wall' | 'floor' | 'ceiling' | 'door' | 'window' | 'room_label';
  geometry: GeometryData;
  material: MaterialData;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  userData: Record<string, unknown>;
}

export interface GeometryData {
  type: 'box' | 'extrude' | 'plane' | 'custom';
  vertices?: number[];
  indices?: number[];
  normals?: number[];
  uvs?: number[];
  // For box geometry
  width?: number;
  height?: number;
  depth?: number;
  // For extrude geometry
  shape?: Point2D[];
  extrudeSettings?: {
    depth: number;
    bevelEnabled: boolean;
  };
}

export interface Point2D {
  x: number;
  y: number;
}

export interface MaterialData {
  type: 'standard' | 'basic' | 'lambert' | 'phong';
  color: string;
  opacity: number;
  transparent: boolean;
  roughness?: number;
  metalness?: number;
  side?: 'front' | 'back' | 'double';
}

// ============================================
// Scene Structure
// ============================================

export interface Scene3D {
  id: string;
  meshes: MeshData[];
  lights: LightData[];
  camera: CameraData;
  boundingBox: {
    min: Point3D;
    max: Point3D;
  };
  metadata: {
    generatedAt: string;
    sourceAnalysisId: string;
    totalWalls: number;
    totalRooms: number;
    totalOpenings: number;
    floorArea: number;
    wallHeight: number;
  };
}

export interface LightData {
  type: 'ambient' | 'directional' | 'point' | 'spot';
  color: string;
  intensity: number;
  position?: [number, number, number];
  target?: [number, number, number];
}

export interface CameraData {
  type: 'perspective' | 'orthographic';
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
  near: number;
  far: number;
}

// ============================================
// Generation Options
// ============================================

export interface GenerationOptions {
  wallHeight: number;
  wallThickness: number;
  floorThickness: number;
  doorHeight: number;
  windowHeight: number;
  windowSillHeight: number;
  generateFloor: boolean;
  generateCeiling: boolean;
  generateLabels: boolean;
  colorScheme: ColorScheme;
}

export interface ColorScheme {
  exteriorWall: string;
  interiorWall: string;
  partition: string;
  floor: string;
  ceiling: string;
  door: string;
  window: string;
  roomLabels: Record<string, string>;
}

// ============================================
// Processing State
// ============================================

export interface GenerationProgress {
  step: 'parsing' | 'walls' | 'openings' | 'floors' | 'labels' | 'complete';
  progress: number; // 0-100
  currentItem: string;
  totalItems: number;
  processedItems: number;
}

export type GenerationCallback = (progress: GenerationProgress) => void;
