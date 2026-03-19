/**
 * That Open (@thatopen/components) TypeScript Types
 *
 * Type definitions for That Open BIM components integration
 */

import type * as THREE from 'three';

// ============================================
// Core Types
// ============================================

export interface ThatOpenViewerState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  activeModel: string | null;
}

export interface ThatOpenLoadProgress {
  stage: 'downloading' | 'parsing' | 'processing' | 'ready';
  percent: number;
  currentOperation: string;
}

// ============================================
// Model Types
// ============================================

export interface FragmentsModelData {
  fragmentsData: ArrayBuffer;
  properties: FragmentsProperties;
}

export interface FragmentsProperties {
  elements: FragmentElement[];
  levels: FragmentLevel[];
  materials: string[];
  metadata: FragmentsMetadata;
  spatialTree: SpatialTreeNode;
}

export interface FragmentElement {
  expressID: number;
  globalId: string;
  type: string;
  name: string;
  level?: string;
  material?: string;
  properties: Record<string, string | number | boolean>;
  quantities?: ElementQuantities;
}

export interface FragmentLevel {
  id: string;
  name: string;
  elevation: number;
}

export interface FragmentsMetadata {
  elementCount: number;
  levelCount: number;
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  ifcSchema: string;
  projectName?: string;
  siteName?: string;
}

export interface ElementQuantities {
  length?: number;
  area?: number;
  volume?: number;
  weight?: number;
}

// ============================================
// Spatial Tree Types
// ============================================

export interface SpatialTreeNode {
  id: string;
  name: string;
  type: 'project' | 'site' | 'building' | 'storey' | 'space' | 'element';
  expressID?: number;
  children: SpatialTreeNode[];
  elementCount?: number;
}

// ============================================
// Tool Types
// ============================================

export type ThatOpenTool =
  | 'select'
  | 'orbit'
  | 'pan'
  | 'zoom'
  | 'measure-length'
  | 'measure-area'
  | 'measure-volume'
  | 'section'
  | 'none';

export interface MeasurementResult {
  type: 'length' | 'area' | 'volume';
  value: number;
  unit: string;
  points?: THREE.Vector3[];
}

export interface SectionPlane {
  id: string;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  active: boolean;
}

// ============================================
// Camera Types
// ============================================

export type CameraMode = 'orbit' | 'plan' | 'firstPerson';

export interface CameraViewpoint {
  eye: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  projection: 'perspective' | 'orthographic';
}

// ============================================
// Selection Types
// ============================================

export interface ThatOpenSelection {
  expressIDs: number[];
  fragmentIDs: string[];
}

// ============================================
// Event Types
// ============================================

export interface ThatOpenElementClickEvent {
  expressID: number;
  fragmentID: string;
  point: THREE.Vector3;
}

export interface ThatOpenViewerEvents {
  onElementClick?: (event: ThatOpenElementClickEvent) => void;
  onElementHover?: (expressID: number | null) => void;
  onSelectionChange?: (selection: ThatOpenSelection) => void;
  onModelLoaded?: (modelId: string) => void;
  onError?: (error: Error) => void;
}
