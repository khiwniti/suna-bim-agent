/**
 * Type declarations for @xeokit/xeokit-sdk
 *
 * ★ Insight ─────────────────────────────────────
 * xeokit-sdk is a JavaScript library without built-in TypeScript
 * types. This declaration provides minimal typing for the main
 * classes used in our BIM viewer integration.
 * ─────────────────────────────────────────────────
 */

declare module '@xeokit/xeokit-sdk' {
  export interface CameraFlightOptions {
    eye?: [number, number, number] | number[];
    look?: [number, number, number] | number[];
    up?: [number, number, number] | number[];
    aabb?: number[];
    projection?: 'perspective' | 'ortho';
    duration?: number;
    fit?: boolean;
    fitFOV?: number;
  }

  export interface XeokitEntity {
    id: string;
    visible: boolean;
    highlighted: boolean;
    selected: boolean;
    colorize: number[] | null;
    opacity: number;
    xrayed: boolean;
    edges: boolean;
    aabb: number[];
  }

  export interface XeokitMetaObject {
    id: string;
    name: string;
    type: string;
    parent?: XeokitMetaObject;
    propertysets?: Array<{
      name: string;
      properties: Array<{ name: string; value: unknown }>;
    }>;
  }

  export class Viewer {
    constructor(config: {
      canvasId?: string;
      canvasElement?: HTMLCanvasElement;
      transparent?: boolean;
      [key: string]: unknown;
    });

    scene: {
      camera: {
        eye: number[];
        look: number[];
        up: number[];
        projection: 'perspective' | 'ortho';
        on: (event: string, callback: (params: unknown) => void) => void;
      };
      objects: Record<string, XeokitEntity>;
      selectedObjectIds: string[];
      highlightedObjectIds: string[];
      aabb: number[];
      gammaOutput: boolean;
      clearLights: () => void;
    };

    cameraFlight: {
      flyTo: (options: CameraFlightOptions) => void;
      jumpTo: (options: CameraFlightOptions) => void;
      cancel: () => void;
    };

    cameraControl: {
      navMode: 'orbit' | 'planView' | 'firstPerson';
      pivotElement: HTMLElement | null;
    };

    metaScene: {
      metaObjects: Record<string, XeokitMetaObject>;
      getObjectIDsByType: (types: string[]) => string[];
    };

    on: (event: string, callback: (...args: unknown[]) => void) => void;
    off: (event: string, callback: (...args: unknown[]) => void) => void;
    destroy: () => void;
  }

  export interface XeokitModel {
    id: string;
    on: (event: string, callback: () => void) => void;
  }

  export class XKTLoaderPlugin {
    constructor(viewer: Viewer | unknown, config?: Record<string, unknown>);
    load(config: {
      id: string;
      src: string;
      edges?: boolean;
      [key: string]: unknown;
    }): Promise<XeokitModel>;
  }

  export class NavCubePlugin {
    constructor(viewer: Viewer | unknown, config?: {
      canvasId?: string;
      canvasElement?: HTMLCanvasElement;
      visible?: boolean;
      cameraFly?: boolean;
      cameraFitFOV?: number;
      cameraFlyDuration?: number;
      fitVisible?: boolean;
      synchProjection?: boolean;
      [key: string]: unknown;
    });
    destroy: () => void;
  }

  export class SectionPlanesPlugin {
    constructor(viewer: Viewer | unknown, config?: Record<string, unknown>);
    createSectionPlane: (config: {
      id: string;
      pos: number[];
      dir: number[];
    }) => void;
    destroy: () => void;
  }

  export class DistanceMeasurementsPlugin {
    constructor(viewer: Viewer | unknown, config?: Record<string, unknown>);
    destroy: () => void;
  }

  export class AnnotationsPlugin {
    constructor(viewer: Viewer | unknown, config?: {
      container?: HTMLElement;
      markerHTML?: string;
      labelHTML?: string;
      [key: string]: unknown;
    });
    destroy: () => void;
  }

  export class BCFViewpointsPlugin {
    constructor(viewer: Viewer | unknown, config?: Record<string, unknown>);
    getViewpoint: () => unknown;
    setViewpoint: (viewpoint: unknown) => void;
    destroy: () => void;
  }

  export class GLTFLoaderPlugin {
    constructor(viewer: Viewer | unknown, config?: Record<string, unknown>);
    load(config: {
      id: string;
      src?: string;
      gltf?: unknown;
      edges?: boolean;
      [key: string]: unknown;
    }): XeokitModel;
    destroy: () => void;
  }

  export class WebIFCLoaderPlugin {
    constructor(viewer: Viewer | unknown, config?: {
      WebIFC?: unknown;
      IfcAPI?: unknown;
      [key: string]: unknown;
    });
    load(config: {
      id: string;
      src?: string;
      ifc?: ArrayBuffer;
      edges?: boolean;
      excludeTypes?: string[];
      [key: string]: unknown;
    }): XeokitModel;
    destroy: () => void;
  }
}

// Module declaration for direct WebIFCLoaderPlugin import
// (not exported from main xeokit-sdk bundle)
declare module '@xeokit/xeokit-sdk/src/plugins/WebIFCLoaderPlugin/index.js' {
  import type { Viewer, XeokitModel } from '@xeokit/xeokit-sdk';

  export class WebIFCLoaderPlugin {
    constructor(viewer: Viewer | unknown, config?: {
      WebIFC?: unknown;
      IfcAPI?: unknown;
      [key: string]: unknown;
    });
    load(config: {
      id: string;
      src?: string;
      ifc?: ArrayBuffer;
      edges?: boolean;
      excludeTypes?: string[];
      [key: string]: unknown;
    }): XeokitModel;
    destroy: () => void;
  }
}
