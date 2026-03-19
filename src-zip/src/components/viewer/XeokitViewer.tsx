'use client';

/**
 * XeokitViewer - Professional BIM 3D Viewer using xeokit-sdk
 *
 * Primary viewer for all BIM visualization:
 * - Handles 10M+ elements with GPU-optimized rendering
 * - Native .xkt format support for fast loading
 * - Built-in NavCube, Section Planes, BCF support
 * - GPU-optimized rendering
 *
 * Controllable via AI chat commands through the BIM store.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useBIMStore } from '@/stores/bim-store';
import { cn } from '@/lib/utils';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Upload,
  FileUp,
  Maximize2,
  RotateCcw,
  Move,
  Focus,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  XeokitViewerProps,
  XeokitLoadProgress,
  XeokitTool,
  CameraFlightOptions,
} from '@/types/xeokit';
import type { ViewPreset, BIMElement } from '@/types/bim';

// ============================================
// Types for dynamic xeokit import
// ============================================

interface XeokitViewerInstance {
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

interface XKTLoaderPluginInstance {
  load: (config: { id: string; src: string; edges?: boolean }) => Promise<XeokitModel>;
}

interface NavCubePluginInstance {
  destroy: () => void;
}

interface SectionPlanesPluginInstance {
  createSectionPlane: (config: { id: string; pos: number[]; dir: number[] }) => void;
  destroy: () => void;
}

interface DistanceMeasurementsPluginInstance {
  destroy: () => void;
}

interface AnnotationsPluginInstance {
  destroy: () => void;
}

interface BCFViewpointsPluginInstance {
  getViewpoint: () => unknown;
  setViewpoint: (viewpoint: unknown) => void;
  destroy: () => void;
}

interface WebIFCLoaderPluginInstance {
  load: (config: { id: string; src?: string; ifc?: ArrayBuffer; edges?: boolean; excludeTypes?: string[] }) => XeokitModel;
  destroy: () => void;
}

interface GLTFLoaderPluginInstance {
  load: (config: { id: string; src?: string; gltf?: unknown; edges?: boolean }) => XeokitModel;
  destroy: () => void;
}

interface XeokitEntity {
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

interface XeokitMetaObject {
  id: string;
  name: string;
  type: string;
  parent?: XeokitMetaObject;
  propertysets?: Array<{ name: string; properties: Array<{ name: string; value: unknown }> }>;
}

interface XeokitModel {
  id: string;
  on: (event: string, callback: () => void) => void;
}

// ============================================
// View Presets
// ============================================

const VIEW_PRESETS: Record<ViewPreset, CameraFlightOptions> = {
  top: { eye: [0, 100, 0.001], look: [0, 0, 0], up: [0, 0, 1], projection: 'ortho' },
  bottom: { eye: [0, -100, 0.001], look: [0, 0, 0], up: [0, 0, -1], projection: 'ortho' },
  front: { eye: [0, 0, 100], look: [0, 0, 0], up: [0, 1, 0] },
  back: { eye: [0, 0, -100], look: [0, 0, 0], up: [0, 1, 0] },
  left: { eye: [-100, 0, 0], look: [0, 0, 0], up: [0, 1, 0] },
  right: { eye: [100, 0, 0], look: [0, 0, 0], up: [0, 1, 0] },
  iso: { eye: [50, 50, 50], look: [0, 0, 0], up: [0, 1, 0], projection: 'perspective' },
  perspective: { eye: [40, 30, 40], look: [0, 0, 0], up: [0, 1, 0], projection: 'perspective' },
};

// ============================================
// Component
// ============================================

export function XeokitViewer({
  className,
  modelUrl,
  modelFormat = 'xkt',
  onElementSelect,
  onElementHover,
  onModelLoaded,
  onViewChange,
  onError,
  initialView = 'perspective',
}: XeokitViewerProps) {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navCubeCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<XeokitViewerInstance | null>(null);
  const pluginsRef = useRef<{
    xktLoader?: XKTLoaderPluginInstance;
    webIfcLoader?: WebIFCLoaderPluginInstance;
    gltfLoader?: GLTFLoaderPluginInstance;
    navCube?: NavCubePluginInstance;
    sectionPlanes?: SectionPlanesPluginInstance;
    distanceMeasurements?: DistanceMeasurementsPluginInstance;
    annotations?: AnnotationsPluginInstance;
    bcfViewpoints?: BCFViewpointsPluginInstance;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'loading-model'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState<XeokitLoadProgress | null>(null);
  const [hasModel, setHasModel] = useState(false);
  const [activeTool, setActiveTool] = useState<XeokitTool>('orbit');
  const [ifcSupported, setIfcSupported] = useState(false);

  // BIM Store
  const setCurrentModel = useBIMStore((state) => state.setCurrentModel);
  const selectElements = useBIMStore((state) => state.selectElements);
  const viewportCommand = useBIMStore((state) => state.viewportCommand);
  const clearViewportCommand = useBIMStore((state) => state.clearViewportCommand);

  // ============================================
  // Initialize xeokit Viewer
  // ============================================

  useEffect(() => {
    // Guard against SSR - ensure we're in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (!canvasRef.current) return;

    const initViewer = async () => {
      try {
        // Dynamic import of xeokit-sdk (SSR-safe)
        const xeokit = await import('@xeokit/xeokit-sdk');

        // Create viewer
        const viewer = new xeokit.Viewer({
          canvasElement: canvasRef.current!,
          transparent: true,
        }) as unknown as XeokitViewerInstance;
        viewerRef.current = viewer;

        // Configure scene
        viewer.scene.gammaOutput = true;
        viewer.cameraControl.navMode = 'orbit';

        // Add basic lighting
        viewer.scene.clearLights();

        // Initialize XKT Loader (required for model loading)
        pluginsRef.current.xktLoader = new xeokit.XKTLoaderPlugin(viewer) as unknown as XKTLoaderPluginInstance;

        // Initialize glTF Loader for glTF/GLB files
        try {
          pluginsRef.current.gltfLoader = new xeokit.GLTFLoaderPlugin(viewer) as unknown as GLTFLoaderPluginInstance;
        } catch (gltfErr) {
          console.warn('GLTFLoaderPlugin initialization failed:', gltfErr);
        }

        // Initialize WebIFC Loader for IFC files (client-side IFC parsing)
        // Reference: https://github.com/IFCjs/web-ifc
        // Note: WebIFCLoaderPlugin is for small-to-medium IFC files only
        // For large files, convert to XKT format for best performance
        try {
          // web-ifc requires async initialization
          const WebIFC = await import('web-ifc');
          console.log('web-ifc module loaded successfully');

          const ifcApi = new WebIFC.IfcAPI();
          console.log('IfcAPI instance created');

          // Set WASM path using official web-ifc API:
          // SetWasmPath(path: string, absolute?: boolean)
          // Using absolute=true ensures the path is resolved from root, not bundle location
          ifcApi.SetWasmPath('/wasm/', true);
          console.log('WASM path set to: /wasm/ (absolute)');

          // Initialize the IFC API in single-threaded mode
          // Multi-threading in bundled environments (Next.js/webpack) is complex because:
          // 1. Worker needs to importScripts the main module
          // 2. Bundled module paths don't work with importScripts
          // Single-threaded mode is more reliable, though slower for large files
          // For large files, recommend converting to XKT format instead
          await ifcApi.Init(undefined, true);
          console.log('IfcAPI initialized (single-threaded mode)');

          // Use WebIFCLoaderPlugin from xeokit (it IS exported from the main bundle)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const WebIFCLoaderPlugin = (xeokit as any).WebIFCLoaderPlugin;

          if (!WebIFCLoaderPlugin) {
            throw new Error('WebIFCLoaderPlugin not found in xeokit-sdk bundle');
          }

          pluginsRef.current.webIfcLoader = new WebIFCLoaderPlugin(viewer, {
            WebIFC,
            IfcAPI: ifcApi,
          }) as unknown as WebIFCLoaderPluginInstance;

          setIfcSupported(true);
          console.log('WebIFCLoaderPlugin initialized successfully');
        } catch (ifcErr) {
          console.error('WebIFCLoaderPlugin initialization failed:', ifcErr);
          console.warn('IFC files will require server conversion');
          setIfcSupported(false);
        }

        // NavCube - provides 3D orientation navigation
        if (navCubeCanvasRef.current) {
          try {
            pluginsRef.current.navCube = new xeokit.NavCubePlugin(viewer, {
              canvasElement: navCubeCanvasRef.current,
              visible: true,
              cameraFly: true,
              cameraFitFOV: 45,
              cameraFlyDuration: 0.5,
              fitVisible: true,
              synchProjection: true,
            }) as unknown as NavCubePluginInstance;
          } catch (navCubeErr) {
            console.warn('NavCube plugin initialization failed:', navCubeErr);
          }
        }

        // Section Planes - for cutting through models
        try {
          pluginsRef.current.sectionPlanes = new xeokit.SectionPlanesPlugin(viewer) as unknown as SectionPlanesPluginInstance;
        } catch (sectionErr) {
          console.warn('SectionPlanes plugin initialization failed:', sectionErr);
        }

        // Distance Measurements - for measuring distances
        try {
          pluginsRef.current.distanceMeasurements = new xeokit.DistanceMeasurementsPlugin(viewer) as unknown as DistanceMeasurementsPluginInstance;
        } catch (measureErr) {
          console.warn('DistanceMeasurements plugin initialization failed:', measureErr);
        }

        // NOTE: AnnotationsPlugin disabled due to upstream bug in xeokit-sdk
        // Bug: createAnnotation() passes markerHTML instead of labelHTML
        // See: https://github.com/xeokit/xeokit-sdk/issues

        // BCF Viewpoints - for BIM Collaboration Format support
        try {
          pluginsRef.current.bcfViewpoints = new xeokit.BCFViewpointsPlugin(viewer) as unknown as BCFViewpointsPluginInstance;
        } catch (bcfErr) {
          console.warn('BCFViewpoints plugin initialization failed:', bcfErr);
        }

        // Set initial view
        const preset = VIEW_PRESETS[initialView];
        viewer.cameraFlight.jumpTo({
          ...preset,
          fit: true,
        });

        // Setup event handlers
        viewer.on('pick', (pickResult: unknown) => {
          const result = pickResult as { entity?: XeokitEntity };
          if (result.entity) {
            const metaObject = viewer.metaScene.metaObjects[result.entity.id];
            selectElements([result.entity.id]);
            onElementSelect?.(result.entity.id, metaObject ? mapMetaObjectToElement(metaObject) : undefined);
          }
        });

        viewer.on('hover', (hoverResult: unknown) => {
          const result = hoverResult as { entity?: XeokitEntity };
          onElementHover?.(result.entity?.id ?? null);
        });

        viewer.scene.camera.on('viewMatrix', () => {
          const camera = viewer.scene.camera;
          onViewChange?.({
            position: { x: camera.eye[0], y: camera.eye[1], z: camera.eye[2] },
            target: { x: camera.look[0], y: camera.look[1], z: camera.look[2] },
            zoom: 1,
            mode: viewer.cameraControl.navMode === 'firstPerson' ? 'firstPerson' : 'orbit',
          });
        });

        setStatus('ready');

        // Auto-load model if URL provided
        if (modelUrl) {
          await loadModel(modelUrl, modelFormat);
        }
      } catch (err) {
        console.error('Failed to initialize xeokit viewer:', err);
        setStatus('error');
        const message = err instanceof Error ? err.message : 'Failed to initialize viewer';
        setErrorMessage(message);
        onError?.(message);
      }
    };

    initViewer();

    return () => {
      // Cleanup plugins
      Object.values(pluginsRef.current).forEach((plugin) => {
        if (plugin && 'destroy' in plugin) {
          (plugin as { destroy: () => void }).destroy();
        }
      });
      pluginsRef.current = {};

      // Cleanup viewer
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // ============================================
  // Load Model
  // ============================================

  const loadModel = useCallback(
    async (urlOrData: string | ArrayBuffer, format: 'xkt' | 'ifc' | 'gltf' | 'glb' = 'xkt') => {
      const viewer = viewerRef.current;
      if (!viewer) return;

      try {
        setStatus('loading-model');
        setLoadProgress({ stage: 'downloading', percent: 0 });

        const modelId = `model-${Date.now()}`;

        // Handle XKT format (fastest, pre-converted)
        if (format === 'xkt') {
          if (typeof urlOrData !== 'string') {
            throw new Error('XKT format requires a URL, not ArrayBuffer');
          }
          const xktLoader = pluginsRef.current.xktLoader;
          if (!xktLoader) throw new Error('XKT loader not initialized');

          setLoadProgress({ stage: 'parsing', percent: 30 });

          const model = await xktLoader.load({
            id: modelId,
            src: urlOrData,
            edges: true,
          });

          setLoadProgress({ stage: 'building', percent: 70 });

          model.on('loaded', () => {
            finalizeModelLoad(viewer, modelId);
          });
        }
        // Handle IFC format (client-side parsing with web-ifc)
        else if (format === 'ifc') {
          const webIfcLoader = pluginsRef.current.webIfcLoader;
          if (!webIfcLoader) {
            throw new Error(
              'IFC loader not available. This may be due to:\n' +
              '1. Web-IFC WASM files missing from /public/wasm/\n' +
              '2. Browser compatibility issue\n' +
              '3. WASM initialization failed\n\n' +
              'Please convert your IFC file to XKT format for best compatibility, ' +
              'or check browser console for detailed error messages.'
            );
          }

          // IFC files should be passed as ArrayBuffer for reliable loading
          // Using the 'ifc' parameter instead of 'src' avoids blob URL issues
          if (!(urlOrData instanceof ArrayBuffer)) {
            throw new Error('IFC format requires ArrayBuffer data. Use file upload instead of URL.');
          }

          setLoadProgress({ stage: 'parsing', percent: 20, currentOperation: 'Parsing IFC file...' });

          const model = webIfcLoader.load({
            id: modelId,
            ifc: urlOrData,  // Pass ArrayBuffer directly
            edges: true,
            excludeTypes: ['IfcSpace'], // Exclude spaces for cleaner visualization
          });

          setLoadProgress({ stage: 'building', percent: 60, currentOperation: 'Building 3D geometry...' });

          model.on('loaded', () => {
            finalizeModelLoad(viewer, modelId);
          });
        }
        // Handle glTF/GLB format
        else if (format === 'gltf' || format === 'glb') {
          if (typeof urlOrData !== 'string') {
            throw new Error('glTF/GLB format requires a URL');
          }
          const gltfLoader = pluginsRef.current.gltfLoader;
          if (!gltfLoader) throw new Error('glTF loader not initialized');

          setLoadProgress({ stage: 'parsing', percent: 30 });

          const model = gltfLoader.load({
            id: modelId,
            src: urlOrData,
            edges: true,
          });

          setLoadProgress({ stage: 'building', percent: 70 });

          model.on('loaded', () => {
            finalizeModelLoad(viewer, modelId);
          });
        }
        else {
          throw new Error(`Unsupported format: ${format}`);
        }
      } catch (err) {
        console.error('Failed to load model:', err);
        const message = err instanceof Error ? err.message : 'Failed to load model';
        setErrorMessage(message);
        setStatus('error');
        onError?.(message);
      }
    },
    [onModelLoaded, onError]
  );

  // Helper function to finalize model loading
  const finalizeModelLoad = useCallback((viewer: XeokitViewerInstance, modelId: string) => {
    setLoadProgress({ stage: 'complete', percent: 100 });

    // Fly to model
    viewer.cameraFlight.flyTo({
      aabb: viewer.scene.aabb,
      duration: 0.5,
    });

    // Count elements
    const elementCount = Object.keys(viewer.scene.objects).length;
    setHasModel(true);
    setStatus('ready');
    onModelLoaded?.(modelId, elementCount);

    // Update BIM store
    updateBIMStore(viewer, modelId);
  }, [onModelLoaded]);

  // ============================================
  // Handle File Upload
  // ============================================

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const extension = file.name.split('.').pop()?.toLowerCase() as 'xkt' | 'ifc' | 'gltf' | 'glb' | undefined;
      const supportedFormats = ['xkt', 'gltf', 'glb'];

      // IFC support depends on WebIFCLoaderPlugin initialization
      if (ifcSupported) {
        supportedFormats.push('ifc');
      }

      // Warn about large IFC files
      const fileSizeMB = file.size / (1024 * 1024);
      if (extension === 'ifc' && fileSizeMB > 20) {
        console.warn(`Large IFC file detected (${fileSizeMB.toFixed(1)} MB). Consider converting to XKT format for better performance.`);
      }

      if (extension === 'ifc' && !ifcSupported) {
        setErrorMessage(
          'IFC format is not currently available. The WebIFC loader failed to initialize.\n\n' +
          'Options:\n' +
          '1. Convert your IFC file to XKT format using xeokit tools\n' +
          '2. Use glTF/GLB format instead\n' +
          '3. Check browser console for WebIFC initialization errors'
        );
        setStatus('error');
        return;
      }

      if (extension && supportedFormats.includes(extension)) {
        try {
          if (extension === 'ifc') {
            // For IFC files, convert to XKT server-side for best performance
            // This avoids browser freezing during single-threaded parsing
            setStatus('loading-model');
            setLoadProgress({ stage: 'downloading', percent: 0, currentOperation: 'Converting IFC to XKT...' });

            // Send to conversion API
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/models/convert', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Conversion failed' }));
              throw new Error(errorData.error || `Conversion failed: ${response.status}`);
            }

            setLoadProgress({ stage: 'parsing', percent: 50, currentOperation: 'Loading converted model...' });

            // Get the XKT file as blob
            const xktBlob = await response.blob();
            const xktUrl = URL.createObjectURL(xktBlob);

            try {
              // Load the converted XKT file
              await loadModel(xktUrl, 'xkt');
            } finally {
              // Cleanup blob URL after a delay
              setTimeout(() => URL.revokeObjectURL(xktUrl), 5000);
            }
          } else {
            // Other formats use blob URL
            const url = URL.createObjectURL(file);
            try {
              await loadModel(url, extension);
            } finally {
              // Cleanup blob URL after loading completes or fails
              // Note: The model may still be using this URL, so cleanup after a delay
              setTimeout(() => URL.revokeObjectURL(url), 5000);
            }
          }
        } catch (err) {
          // Error handling is done in loadModel
          console.error('File upload error:', err);
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load model');
          setStatus('error');
        }
      } else {
        const formatList = ifcSupported ? 'XKT, IFC, glTF, GLB' : 'XKT, glTF, GLB';
        setErrorMessage(`Unsupported file format: .${extension || 'unknown'}. Supported formats: ${formatList}`);
        setStatus('error');
      }
    },
    [loadModel, ifcSupported]
  );

  // ============================================
  // Viewport Commands
  // ============================================

  useEffect(() => {
    if (!viewportCommand || !viewerRef.current) return;

    const viewer = viewerRef.current;

    switch (viewportCommand.type) {
      case 'highlight': {
        const data = viewportCommand.data as { elementIds?: string[]; color?: string };
        if (data?.elementIds) {
          highlightElements(viewer, data.elementIds, data.color);
        }
        break;
      }

      case 'setView': {
        const data = viewportCommand.data as { preset?: ViewPreset };
        if (data?.preset && VIEW_PRESETS[data.preset]) {
          viewer.cameraFlight.flyTo({
            ...VIEW_PRESETS[data.preset],
            duration: 0.5,
          });
        }
        break;
      }

      case 'zoomTo': {
        const data = viewportCommand.data as { elementIds?: string[] };
        if (data?.elementIds?.length) {
          zoomToElements(viewer, data.elementIds);
        }
        break;
      }

      case 'isolate': {
        const data = viewportCommand.data as { elementIds?: string[] };
        if (data?.elementIds) {
          isolateElements(viewer, data.elementIds);
        }
        break;
      }

      case 'showAll': {
        showAllElements(viewer);
        break;
      }

      case 'select': {
        const data = viewportCommand.data as { elementIds?: string[] };
        if (data?.elementIds) {
          selectElementsInViewer(viewer, data.elementIds);
        }
        break;
      }
    }

    clearViewportCommand();
  }, [viewportCommand, clearViewportCommand]);

  // ============================================
  // Helper Functions
  // ============================================

  const highlightElements = (viewer: XeokitViewerInstance, elementIds: string[], color?: string) => {
    // Clear existing highlights
    Object.values(viewer.scene.objects).forEach((obj) => {
      obj.highlighted = false;
    });

    // Highlight selected elements
    const rgb = hexToRgb(color || '#ffff00');
    elementIds.forEach((id) => {
      const obj = viewer.scene.objects[id];
      if (obj) {
        obj.highlighted = true;
        obj.colorize = rgb;
      }
    });
  };

  const zoomToElements = (viewer: XeokitViewerInstance, elementIds: string[]) => {
    const aabb = calculateBoundingBox(viewer, elementIds);
    if (aabb) {
      viewer.cameraFlight.flyTo({ aabb, duration: 0.5, fit: true });
    }
  };

  const isolateElements = (viewer: XeokitViewerInstance, elementIds: string[]) => {
    const idSet = new Set(elementIds);
    Object.values(viewer.scene.objects).forEach((obj) => {
      obj.visible = idSet.has(obj.id);
    });
  };

  const showAllElements = (viewer: XeokitViewerInstance) => {
    Object.values(viewer.scene.objects).forEach((obj) => {
      obj.visible = true;
      obj.xrayed = false;
    });
  };

  const selectElementsInViewer = (viewer: XeokitViewerInstance, elementIds: string[]) => {
    // Clear existing selection
    Object.values(viewer.scene.objects).forEach((obj) => {
      obj.selected = false;
    });

    // Select new elements
    elementIds.forEach((id) => {
      const obj = viewer.scene.objects[id];
      if (obj) {
        obj.selected = true;
      }
    });

    selectElements(elementIds);
  };

  const calculateBoundingBox = (viewer: XeokitViewerInstance, elementIds: string[]): number[] | null => {
    const aabb = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    let found = false;

    elementIds.forEach((id) => {
      const obj = viewer.scene.objects[id];
      if (obj?.aabb) {
        found = true;
        aabb[0] = Math.min(aabb[0], obj.aabb[0]);
        aabb[1] = Math.min(aabb[1], obj.aabb[1]);
        aabb[2] = Math.min(aabb[2], obj.aabb[2]);
        aabb[3] = Math.max(aabb[3], obj.aabb[3]);
        aabb[4] = Math.max(aabb[4], obj.aabb[4]);
        aabb[5] = Math.max(aabb[5], obj.aabb[5]);
      }
    });

    return found ? aabb : null;
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
      : [1, 1, 0];
  };

  const mapMetaObjectToElement = (metaObj: XeokitMetaObject): BIMElement => {
    const properties: Record<string, string | number | boolean> = {};

    metaObj.propertysets?.forEach((pset) => {
      pset.properties.forEach((prop) => {
        properties[`${pset.name}.${prop.name}`] = prop.value as string | number | boolean;
      });
    });

    return {
      id: metaObj.id,
      globalId: metaObj.id,
      type: mapIfcTypeToElementType(metaObj.type),
      name: metaObj.name || metaObj.type,
      properties,
    };
  };

  const mapIfcTypeToElementType = (ifcType: string): import('@/types/bim').BIMElementType => {
    const typeMap: Record<string, import('@/types/bim').BIMElementType> = {
      IfcWall: 'wall',
      IfcWallStandardCase: 'wall',
      IfcDoor: 'door',
      IfcWindow: 'window',
      IfcSlab: 'slab',
      IfcRoof: 'roof',
      IfcStair: 'stair',
      IfcColumn: 'column',
      IfcBeam: 'beam',
      IfcFurnishingElement: 'furniture',
      IfcBuildingElementProxy: 'equipment',
      IfcSpace: 'space',
      IfcZone: 'zone',
      IfcFlowTerminal: 'hvac',
      IfcPipeSegment: 'pipe',
      IfcDuctSegment: 'duct',
    };
    return typeMap[ifcType] || 'other';
  };

  const updateBIMStore = (viewer: XeokitViewerInstance, modelId: string) => {
    const elements: BIMElement[] = [];

    Object.entries(viewer.metaScene.metaObjects).forEach(([, metaObj]) => {
      elements.push(mapMetaObjectToElement(metaObj));
    });

    setCurrentModel({
      id: modelId,
      name: `Model ${modelId}`,
      source: 'ifc',
      createdAt: new Date(),
      updatedAt: new Date(),
      elements,
      levels: [], // Would extract from spatial structure
      metadata: {
        elementCount: elements.length,
        levelCount: 0,
        boundingBox: {
          min: { x: viewer.scene.aabb[0], y: viewer.scene.aabb[1], z: viewer.scene.aabb[2] },
          max: { x: viewer.scene.aabb[3], y: viewer.scene.aabb[4], z: viewer.scene.aabb[5] },
        },
        units: 'metric',
      },
    });
  };

  // ============================================
  // Toolbar Actions
  // ============================================

  const handleZoomFit = useCallback(() => {
    if (viewerRef.current) {
      viewerRef.current.cameraFlight.flyTo({
        aabb: viewerRef.current.scene.aabb,
        duration: 0.5,
      });
    }
  }, []);

  const handleIsolate = useCallback(() => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;
    const selectedIds = viewer.scene.selectedObjectIds;

    // Don't change visibility if nothing is selected
    if (selectedIds.length === 0) return;

    // Use the existing isolateElements helper
    isolateElements(viewer, selectedIds);
  }, []);

  // ============================================
  // Render
  // ============================================

  return (
    <div className={cn('relative flex flex-col bg-muted', className)}>
      {/* Main Canvas */}
      <div className="flex-1 relative">
        <canvas
          id="xeokit-canvas"
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* NavCube Canvas (overlay) */}
        <canvas
          id="navCubeCanvas"
          ref={navCubeCanvasRef}
          className="absolute top-4 right-4 w-[100px] h-[100px] rounded-lg shadow-lg z-20"
          style={{ pointerEvents: 'auto' }}
        />

        {/* Loading Overlay */}
        <AnimatePresence>
          {(status === 'loading' || status === 'loading-model') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10"
            >
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <div className="text-center">
                  <p className="font-medium">
                    {status === 'loading' ? 'Initializing viewer...' : 'Loading model...'}
                  </p>
                  {loadProgress && (
                    <div className="mt-2 w-48">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${loadProgress.percent}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        {loadProgress.stage}...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Overlay */}
        <AnimatePresence>
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10"
            >
              <div className="flex flex-col items-center gap-4 p-6 max-w-md text-center">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Error</p>
                  <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State / Upload Prompt */}
        <AnimatePresence>
          {status === 'ready' && !hasModel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-10"
            >
              <div className="flex flex-col items-center gap-4 p-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileUp className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Load a BIM Model</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload XKT, IFC, glTF, or GLB files to start exploring
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Upload BIM Model
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xkt,.ifc,.gltf,.glb"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Navigation Bar */}
        {hasModel && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 p-1 bg-background/90 backdrop-blur-sm rounded-xl shadow-lg border border-border">
            <NavButton icon={Maximize2} label="Zoom Fit (F)" onClick={handleZoomFit} />
            <div className="w-8 h-px bg-border mx-auto" />
            <NavButton
              icon={RotateCcw}
              label="Orbit"
              active={activeTool === 'orbit'}
              onClick={() => setActiveTool('orbit')}
            />
            <NavButton
              icon={Move}
              label="Pan"
              active={activeTool === 'pan'}
              onClick={() => setActiveTool('pan')}
            />
            <div className="w-8 h-px bg-border mx-auto" />
            <NavButton icon={Focus} label="Isolate" onClick={handleIsolate} />
            <NavButton icon={Eye} label="Show All" onClick={() => viewerRef.current && showAllElements(viewerRef.current)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

interface NavButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function NavButton({ icon: Icon, label, active, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'p-2 rounded-lg transition-colors',
        'hover:bg-muted',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        active && 'bg-primary/10 text-primary'
      )}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

export default XeokitViewer;
