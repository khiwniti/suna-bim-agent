// xeokit-sdk TypeScript declarations and configuration types

import type { CameraState, SelectionState, BIMElement, ViewPreset } from './bim';

// ============================================
// xeokit Plugin Types
// ============================================

export interface XeokitPluginConfig {
  // Navigation
  navCube: {
    enabled: boolean;
    canvasId: string;
    size: number;
    alignment: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft';
    fitVisible: boolean;
    synchProjection: boolean;
  };

  // Tree View
  treeView: {
    enabled: boolean;
    containerElement: HTMLElement | null;
    autoExpandDepth: number;
    hierarchy: 'containment' | 'storeys' | 'types';
  };

  // Section Planes
  sectionPlanes: {
    enabled: boolean;
    overviewVisible: boolean;
  };

  // BCF Viewpoints
  bcfViewpoints: {
    enabled: boolean;
    originatingSystem: string;
  };

  // Measurements
  distanceMeasurements: {
    enabled: boolean;
    defaultVisible: boolean;
    defaultLabelsVisible: boolean;
    defaultAxisVisible: boolean;
    defaultColor: string;
  };

  angleMeasurements: {
    enabled: boolean;
  };

  // Annotations
  annotations: {
    enabled: boolean;
    markerHTML: string;
    labelHTML: string;
  };
}

// ============================================
// Viewer State Types
// ============================================

export interface XeokitViewerState {
  // Scene state
  isInitialized: boolean;
  isLoading: boolean;
  loadProgress: XeokitLoadProgress | null;
  error: string | null;

  // Model state
  models: XeokitModel[];
  activeModelId: string | null;

  // Navigation state
  cameraState: CameraState;
  activeTool: XeokitTool;

  // Selection state
  selection: SelectionState;

  // Display state
  visualStyle: VisualStyle;
  shadows: boolean;
  edges: boolean;
  saoEnabled: boolean;
}

export interface XeokitLoadProgress {
  stage: 'downloading' | 'parsing' | 'building' | 'complete';
  percent: number;
  currentOperation?: string;
}

export interface XeokitModel {
  id: string;
  src: string;
  name: string;
  format: 'xkt' | 'ifc' | 'gltf';
  visible: boolean;
  loaded: boolean;
  metadata?: {
    elementCount: number;
    ifcSchema?: string;
  };
}

export type XeokitTool =
  | 'orbit'
  | 'pan'
  | 'firstPerson'
  | 'select'
  | 'measure'
  | 'section'
  | 'distanceMeasurement'
  | 'angleMeasurement'
  | 'sectionPlane'
  | 'annotation';

export type VisualStyle =
  | 'wireframe'
  | 'hiddenLine'
  | 'shaded'
  | 'shadedWithEdges'
  | 'realistic';

// ============================================
// Camera Types
// ============================================

export interface XeokitCameraFlight {
  flyTo: (options: CameraFlightOptions) => void;
  jumpTo: (options: CameraFlightOptions) => void;
  cancel: () => void;
}

export interface CameraFlightOptions {
  eye?: [number, number, number];
  look?: [number, number, number];
  up?: [number, number, number];
  aabb?: number[]; // [minX, minY, minZ, maxX, maxY, maxZ]
  projection?: 'perspective' | 'ortho';
  duration?: number;
  fit?: boolean;
  fitFOV?: number;
}

// View preset configurations
export const XEOKIT_VIEW_PRESETS: Record<ViewPreset, CameraFlightOptions> = {
  top: {
    eye: [0, 100, 0.001],
    look: [0, 0, 0],
    up: [0, 0, 1],
    projection: 'ortho',
  },
  bottom: {
    eye: [0, -100, 0.001],
    look: [0, 0, 0],
    up: [0, 0, -1],
    projection: 'ortho',
  },
  front: {
    eye: [0, 0, 100],
    look: [0, 0, 0],
    up: [0, 1, 0],
  },
  back: {
    eye: [0, 0, -100],
    look: [0, 0, 0],
    up: [0, 1, 0],
  },
  left: {
    eye: [-100, 0, 0],
    look: [0, 0, 0],
    up: [0, 1, 0],
  },
  right: {
    eye: [100, 0, 0],
    look: [0, 0, 0],
    up: [0, 1, 0],
  },
  iso: {
    eye: [50, 50, 50],
    look: [0, 0, 0],
    up: [0, 1, 0],
    projection: 'perspective',
  },
  perspective: {
    eye: [40, 30, 40],
    look: [0, 0, 0],
    up: [0, 1, 0],
    projection: 'perspective',
  },
};

// ============================================
// Element/Object Types
// ============================================

export interface XeokitEntity {
  id: string;
  visible: boolean;
  highlighted: boolean;
  selected: boolean;
  colorize: number[] | null; // [r, g, b] 0-1
  opacity: number;
  pickable: boolean;
  culled: boolean;
  clippable: boolean;
  collidable: boolean;
  xrayed: boolean;
  edges: boolean;
  aabb: number[]; // [minX, minY, minZ, maxX, maxY, maxZ]
}

export interface XeokitMetaObject {
  id: string;
  name: string;
  type: string; // IFC type
  parent?: XeokitMetaObject;
  children?: XeokitMetaObject[];
  propertySets?: XeokitPropertySet[];
}

export interface XeokitPropertySet {
  id: string;
  originalSystemId: string;
  name: string;
  type: string;
  properties: XeokitProperty[];
}

export interface XeokitProperty {
  name: string;
  type: number;
  value: string | number | boolean;
  valueType: string;
  description?: string;
}

// ============================================
// Section Plane Types
// ============================================

export interface XeokitSectionPlane {
  id: string;
  pos: [number, number, number];
  dir: [number, number, number];
  active: boolean;
}

// ============================================
// BCF Types
// ============================================

export interface BCFViewpoint {
  perspective_camera?: {
    camera_view_point: { x: number; y: number; z: number };
    camera_direction: { x: number; y: number; z: number };
    camera_up_vector: { x: number; y: number; z: number };
    field_of_view: number;
  };
  orthogonal_camera?: {
    camera_view_point: { x: number; y: number; z: number };
    camera_direction: { x: number; y: number; z: number };
    camera_up_vector: { x: number; y: number; z: number };
    view_to_world_scale: number;
  };
  components?: {
    selection?: { ifc_guid: string }[];
    visibility?: {
      default_visibility: boolean;
      exceptions?: { ifc_guid: string }[];
    };
  };
  clipping_planes?: {
    location: { x: number; y: number; z: number };
    direction: { x: number; y: number; z: number };
  }[];
}

// ============================================
// Measurement Types
// ============================================

export interface XeokitMeasurement {
  id: string;
  type: 'distance' | 'angle' | 'area';
  value: number;
  unit: string;
  origin?: [number, number, number];
  target?: [number, number, number];
  visible: boolean;
  labelVisible: boolean;
}

// ============================================
// Event Types
// ============================================

export interface XeokitPickResult {
  entity: XeokitEntity;
  metaObject?: XeokitMetaObject;
  worldPos?: [number, number, number];
  worldNormal?: [number, number, number];
  primIndex?: number;
}

export interface XeokitViewerEvents {
  onPick: (result: XeokitPickResult) => void;
  onHover: (result: XeokitPickResult | null) => void;
  onDoublePick: (result: XeokitPickResult) => void;
  onModelLoaded: (modelId: string, metadata: { elementCount: number }) => void;
  onModelUnloaded: (modelId: string) => void;
  onCameraChange: (cameraState: CameraState) => void;
  onSelectionChange: (selection: SelectionState) => void;
}

// ============================================
// Component Props
// ============================================

export interface XeokitViewerProps {
  className?: string;
  // Model loading
  modelUrl?: string;
  modelFormat?: 'xkt' | 'ifc';
  // Plugin configuration
  plugins?: Partial<XeokitPluginConfig>;
  // Event handlers
  onElementSelect?: (elementId: string, element?: BIMElement) => void;
  onElementHover?: (elementId: string | null) => void;
  onModelLoaded?: (modelId: string, elementCount: number) => void;
  onViewChange?: (cameraState: CameraState) => void;
  onError?: (error: string) => void;
  // Initial state
  initialView?: ViewPreset;
  initialVisualStyle?: VisualStyle;
}

// ============================================
// Configuration Defaults
// ============================================

export const DEFAULT_PLUGIN_CONFIG: XeokitPluginConfig = {
  navCube: {
    enabled: true,
    canvasId: 'navCubeCanvas',
    size: 100,
    alignment: 'topRight',
    fitVisible: true,
    synchProjection: true,
  },
  treeView: {
    enabled: true,
    containerElement: null,
    autoExpandDepth: 2,
    hierarchy: 'containment',
  },
  sectionPlanes: {
    enabled: true,
    overviewVisible: true,
  },
  bcfViewpoints: {
    enabled: true,
    originatingSystem: 'SCG BIM Platform',
  },
  distanceMeasurements: {
    enabled: true,
    defaultVisible: true,
    defaultLabelsVisible: true,
    defaultAxisVisible: false,
    defaultColor: '#00BBFF',
  },
  angleMeasurements: {
    enabled: true,
  },
  annotations: {
    enabled: true,
    markerHTML: '<div class="annotation-marker">📍</div>',
    labelHTML: '<div class="annotation-label">{{title}}</div>',
  },
};
