/**
 * IFC Loader Service
 *
 * Handles loading and parsing of IFC files using @thatopen/components and web-ifc.
 * Converts IFC data to BIMModel format for use in the application.
 */

import * as OBC from '@thatopen/components';
import { FragmentsModel as ThatOpenFragmentsModel } from '@thatopen/fragments';
import * as THREE from 'three';
import * as WEBIFC from 'web-ifc';
import type { BIMModel, BIMElement, BIMElementType, BuildingLevel, Vector3 } from '@/types';
import { getExtractionPipeline, type ExtractedElement, type ExtractionResult } from './extraction-pipeline';

// Re-export the FragmentsModel type from @thatopen/fragments for convenience
export type { FragmentsModel as ThatOpenFragmentsModel } from '@thatopen/fragments';

// IFC Entity type mapping to BIMElementType
const IFC_TYPE_MAP: Record<number, BIMElementType> = {
  [WEBIFC.IFCWALL]: 'wall',
  [WEBIFC.IFCWALLSTANDARDCASE]: 'wall',
  [WEBIFC.IFCDOOR]: 'door',
  [WEBIFC.IFCWINDOW]: 'window',
  [WEBIFC.IFCSLAB]: 'slab',
  [WEBIFC.IFCROOF]: 'roof',
  [WEBIFC.IFCSTAIR]: 'stair',
  [WEBIFC.IFCSTAIRFLIGHT]: 'stair',
  [WEBIFC.IFCCOLUMN]: 'column',
  [WEBIFC.IFCBEAM]: 'beam',
  [WEBIFC.IFCFURNISHINGELEMENT]: 'furniture',
  [WEBIFC.IFCFLOWSEGMENT]: 'pipe',
  [WEBIFC.IFCFLOWFITTING]: 'pipe',
  [WEBIFC.IFCDUCTFITTING]: 'duct',
  [WEBIFC.IFCDUCTSEGMENT]: 'duct',
  [WEBIFC.IFCSPACE]: 'space',
  [WEBIFC.IFCZONE]: 'zone',
};

export interface IFCLoadResult {
  model: BIMModel;
  fragmentsGroup: unknown; // FragmentsGroup from @thatopen/fragments
  ifcApi: WEBIFC.IfcAPI;
  modelID: number;
}

export interface IFCLoadProgress {
  stage: 'initializing' | 'parsing' | 'extracting' | 'classifying' | 'building' | 'complete';
  progress: number; // 0-100
  message: string;
}

export type ProgressCallback = (progress: IFCLoadProgress) => void;

/**
 * Classification result from Classifier component
 */
export interface ClassificationResult {
  /** Elements grouped by IFC category (IfcWall, IfcDoor, etc.) */
  byCategory: Map<string, Set<string>>;
  /** Elements grouped by building storey */
  byStorey: Map<string, Set<string>>;
  /** Elements grouped by predefined type */
  byPredefinedType: Map<string, Set<string>>;
  /** Element relationships (spatial containment, bounds, etc.) */
  relationships: Map<string, ElementRelationship>;
}

/**
 * Relationship data for an element
 */
export interface ElementRelationship {
  expressId: number;
  containedIn?: string; // Parent spatial element (storey, space)
  bounds?: string[];    // Adjacent elements
  aggregates?: string[]; // Child elements
  connectedTo?: string[];// Connected elements (e.g., walls to walls)
}

/**
 * IFC Loader class for loading and parsing IFC files
 */
export class IFCLoader {
  private ifcApi: WEBIFC.IfcAPI | null = null;
  private initialized = false;

  /**
   * Initialize the web-ifc WASM module
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.ifcApi = new WEBIFC.IfcAPI();

    // Set WASM path - web-ifc expects the WASM files in the public directory
    this.ifcApi.SetWasmPath('/wasm/');

    await this.ifcApi.Init();
    this.initialized = true;
  }

  /**
   * Load an IFC file from a File object
   */
  async loadFromFile(
    file: File,
    onProgress?: ProgressCallback
  ): Promise<IFCLoadResult> {
    onProgress?.({
      stage: 'initializing',
      progress: 0,
      message: 'Initializing IFC parser...',
    });

    await this.initialize();

    if (!this.ifcApi) {
      throw new Error('IFC API not initialized');
    }

    onProgress?.({
      stage: 'parsing',
      progress: 20,
      message: 'Reading IFC file...',
    });

    // Read file as ArrayBuffer
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);

    // Open the model
    const modelID = this.ifcApi.OpenModel(data);

    onProgress?.({
      stage: 'extracting',
      progress: 40,
      message: 'Extracting building elements...',
    });

    // Extract elements
    const elements = await this.extractElements(this.ifcApi, modelID);

    onProgress?.({
      stage: 'extracting',
      progress: 60,
      message: 'Extracting building levels...',
    });

    // Extract levels
    const levels = await this.extractLevels(this.ifcApi, modelID);

    onProgress?.({
      stage: 'building',
      progress: 80,
      message: 'Building 3D model...',
    });

    // Create BIMModel
    const model: BIMModel = {
      id: `ifc-${Date.now()}`,
      name: file.name.replace(/\.ifc$/i, ''),
      description: `Imported from ${file.name}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'ifc',
      elements,
      levels,
      metadata: {
        elementCount: elements.length,
        levelCount: levels.length,
        boundingBox: this.calculateBoundingBox(elements),
        units: 'metric',
      },
    };

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'IFC model loaded successfully',
    });

    return {
      model,
      fragmentsGroup: null, // Will be populated by the viewer
      ifcApi: this.ifcApi,
      modelID,
    };
  }

  /**
   * Load an IFC file from a URL
   */
  async loadFromUrl(
    url: string,
    onProgress?: ProgressCallback
  ): Promise<IFCLoadResult> {
    onProgress?.({
      stage: 'initializing',
      progress: 0,
      message: 'Downloading IFC file...',
    });

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch IFC file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const file = new File([blob], url.split('/').pop() || 'model.ifc');

    return this.loadFromFile(file, onProgress);
  }

  /**
   * Extract BIM elements from the IFC model
   */
  private async extractElements(
    api: WEBIFC.IfcAPI,
    modelID: number
  ): Promise<BIMElement[]> {
    const elements: BIMElement[] = [];

    // Get all spatial structure elements
    const ifcTypes = Object.keys(IFC_TYPE_MAP).map(Number);

    for (const ifcType of ifcTypes) {
      const ids = api.GetLineIDsWithType(modelID, ifcType);

      for (let i = 0; i < ids.size(); i++) {
        const expressID = ids.get(i);
        const element = await this.extractElement(api, modelID, expressID, ifcType);
        if (element) {
          elements.push(element);
        }
      }
    }

    return elements;
  }

  /**
   * Extract a single BIM element
   */
  private async extractElement(
    api: WEBIFC.IfcAPI,
    modelID: number,
    expressID: number,
    ifcType: number
  ): Promise<BIMElement | null> {
    try {
      const props = api.GetLine(modelID, expressID);

      if (!props) return null;

      const globalId = props.GlobalId?.value || `exp-${expressID}`;
      const name = props.Name?.value || `Element ${expressID}`;
      const type = IFC_TYPE_MAP[ifcType] || 'other';

      // Extract properties
      const properties: Record<string, string | number | boolean> = {};

      if (props.Description?.value) {
        properties.description = props.Description.value;
      }
      if (props.ObjectType?.value) {
        properties.objectType = props.ObjectType.value;
      }

      return {
        id: `${expressID}`,
        globalId,
        type,
        name,
        properties,
      };
    } catch (error) {
      console.warn(`Failed to extract element ${expressID}:`, error);
      return null;
    }
  }

  /**
   * Extract building levels/storeys
   */
  private async extractLevels(
    api: WEBIFC.IfcAPI,
    modelID: number
  ): Promise<BuildingLevel[]> {
    const levels: BuildingLevel[] = [];

    try {
      const storeyIds = api.GetLineIDsWithType(modelID, WEBIFC.IFCBUILDINGSTOREY);

      for (let i = 0; i < storeyIds.size(); i++) {
        const expressID = storeyIds.get(i);
        const storey = api.GetLine(modelID, expressID);

        if (storey) {
          levels.push({
            id: `${expressID}`,
            name: storey.Name?.value || `Level ${i + 1}`,
            elevation: storey.Elevation?.value || 0,
            height: 3.0, // Default height, would need to calculate from geometry
          });
        }
      }
    } catch (error) {
      console.warn('Failed to extract levels:', error);
    }

    // Sort by elevation
    levels.sort((a, b) => a.elevation - b.elevation);

    return levels;
  }

  /**
   * Calculate bounding box from elements
   */
  private calculateBoundingBox(elements: BIMElement[]): {
    min: Vector3;
    max: Vector3;
  } {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const el of elements) {
      if (el.geometry?.boundingBox) {
        const { min, max } = el.geometry.boundingBox;
        minX = Math.min(minX, min.x);
        minY = Math.min(minY, min.y);
        minZ = Math.min(minZ, min.z);
        maxX = Math.max(maxX, max.x);
        maxY = Math.max(maxY, max.y);
        maxZ = Math.max(maxZ, max.z);
      }
    }

    // If no geometry found, return default
    if (!isFinite(minX)) {
      return {
        min: { x: -10, y: 0, z: -10 },
        max: { x: 10, y: 10, z: 10 },
      };
    }

    return {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.ifcApi) {
      // web-ifc doesn't have a dispose method, but we can clear references
      this.ifcApi = null;
      this.initialized = false;
    }
  }
}

// Singleton instance
let loaderInstance: IFCLoader | null = null;

export function getIFCLoader(): IFCLoader {
  if (!loaderInstance) {
    loaderInstance = new IFCLoader();
  }
  return loaderInstance;
}

/**
 * FragmentsModel interface for our application
 * Matches the essential properties of @thatopen/fragments FragmentsModel
 */
export interface FragmentsModel {
  /** Unique identifier for the model (maps to modelId getter in library) */
  modelId: string;
  /** The THREE.Object3D that can be added to a scene */
  object: THREE.Object3D;
  /** Connect camera for LOD updates */
  useCamera: (camera: THREE.Camera) => void;
  /** Get serialized buffer for export */
  getBuffer: (includeProperties?: boolean) => Promise<Uint8Array>;
}

/**
 * Find a mesh by IFC expressID in the scene hierarchy
 * Used for extracting bounding box geometry per element
 */
function findMeshByExpressId(object: THREE.Object3D, expressId: number): THREE.Mesh | null {
  let foundMesh: THREE.Mesh | null = null;

  object.traverse((child) => {
    if (foundMesh) return; // Already found
    if (child instanceof THREE.Mesh) {
      // Check userData for expressID
      if (child.userData?.expressID === expressId) {
        foundMesh = child;
      }
      // Also check fragment data if available
      if (child.userData?.ids?.has?.(expressId)) {
        foundMesh = child;
      }
    }
  });

  return foundMesh;
}

/**
 * Load IFC using @thatopen/components (for use with the viewer)
 * This provides better 3D rendering with fragments
 *
 * Based on official ThatOpen documentation:
 * https://docs.thatopen.com/Tutorials/Components/Core/IfcLoader
 *
 * Enhanced to extract complete BIM data using:
 * - Classifier: Groups elements by category, type, and storey
 * - IfcRelationsIndexer: Extracts spatial relationships
 * - Property extraction via web-ifc
 */
export async function loadIFCWithComponents(
  components: OBC.Components,
  file: File,
  onProgress?: ProgressCallback,
  world?: OBC.SimpleWorld<OBC.SimpleScene, OBC.SimpleCamera, OBC.SimpleRenderer>
): Promise<{ fragmentsGroup: ThatOpenFragmentsModel | null; model: BIMModel; classifications: ClassificationResult }> {
  onProgress?.({
    stage: 'initializing',
    progress: 0,
    message: 'Initializing IFC loader...',
  });

  // Get FragmentsManager from components
  const fragments = components.get(OBC.FragmentsManager);

  // Fetch and initialize the worker from the official ThatOpen CDN
  // CRITICAL: Worker must be initialized before loading any IFC files
  const workerGithubUrl = 'https://thatopen.github.io/engine_fragment/resources/worker.mjs';

  try {
    const fetchedWorker = await fetch(workerGithubUrl);
    if (!fetchedWorker.ok) {
      throw new Error(`Failed to fetch worker: ${fetchedWorker.status}`);
    }
    const workerBlob = await fetchedWorker.blob();
    const workerFile = new File([workerBlob], 'worker.mjs', { type: 'text/javascript' });
    const workerUrl = URL.createObjectURL(workerFile);
    fragments.init(workerUrl);
  } catch (workerError) {
    console.warn('Failed to load worker from CDN, proceeding without worker:', workerError);
  }

  // Set up camera update listener for LOD updates (required for proper rendering)
  if (world) {
    world.camera.controls.addEventListener('update', () => {
      fragments.core.update();
    });
  }

  // Set up event handler for when models are added to fragments list
  // This handles the scene integration when ifcLoader.load() completes
  fragments.list.onItemSet.add(({ value }) => {
    const loadedModel = value as ThatOpenFragmentsModel;

    if (world && loadedModel) {
      // CRITICAL: Connect camera for LOD (Level of Detail) updates
      // This must be done before adding to scene
      if (typeof loadedModel.useCamera === 'function') {
        loadedModel.useCamera(world.camera.three);
      }

      // Add the model's Object3D to the scene
      // The model.object property is the proper THREE.Object3D
      if (loadedModel.object instanceof THREE.Object3D) {
        world.scene.three.add(loadedModel.object);
      }

      // Trigger a full update of the fragments core
      fragments.core.update(true);
    }
  });

  // Set up material fix for z-fighting (polygon offset)
  // This prevents visual artifacts when surfaces overlap
  fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
    const mat = material as THREE.Material & {
      isLodMaterial?: boolean;
      polygonOffset?: boolean;
      polygonOffsetUnits?: number;
      polygonOffsetFactor?: number;
    };

    if (!('isLodMaterial' in mat && mat.isLodMaterial)) {
      mat.polygonOffset = true;
      mat.polygonOffsetUnits = 1;
      mat.polygonOffsetFactor = Math.random();
    }
  });

  // Get the IFC loader from components
  const ifcLoader = components.get(OBC.IfcLoader);

  onProgress?.({
    stage: 'initializing',
    progress: 10,
    message: 'Setting up IFC configuration...',
  });

  // Configure the loader with the correct WASM path
  // CRITICAL: Use web-ifc@0.0.74 as specified in the official documentation
  await ifcLoader.setup({
    autoSetWasm: false,
    wasm: {
      path: 'https://unpkg.com/web-ifc@0.0.74/',
      absolute: true,
    },
  });

  onProgress?.({
    stage: 'parsing',
    progress: 30,
    message: 'Loading IFC file...',
  });

  // Load the file
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  const modelName = file.name.replace(/\.ifc$/i, '');

  onProgress?.({
    stage: 'parsing',
    progress: 40,
    message: 'Parsing IFC data...',
  });

  // Load the IFC data using the official API
  // Parameters: data buffer, coordinate to origin, model name, settings
  await ifcLoader.load(data, true, modelName, {
    processData: {
      progressCallback: (progress: number) => {
        // Map IFC parsing progress (0-1) to our progress range (40-60)
        const mappedProgress = 40 + Math.round(progress * 20);
        onProgress?.({
          stage: 'parsing',
          progress: mappedProgress,
          message: `Parsing IFC: ${Math.round(progress * 100)}%`,
        });
      },
    },
  });

  onProgress?.({
    stage: 'extracting',
    progress: 65,
    message: 'Extracting model data...',
  });

  // Get the loaded model from FragmentsManager
  // The model is automatically added to fragments.list by the onItemSet handler
  let loadedFragmentsModel: ThatOpenFragmentsModel | null = null;

  // Find the model we just loaded
  for (const [, value] of fragments.list) {
    const model = value as ThatOpenFragmentsModel;
    // Check if this model matches (we take the last one added)
    if (model && model.object) {
      loadedFragmentsModel = model;
    }
  }

  // Initialize classification result
  const classifications: ClassificationResult = {
    byCategory: new Map(),
    byStorey: new Map(),
    byPredefinedType: new Map(),
    relationships: new Map(),
  };

  onProgress?.({
    stage: 'classifying',
    progress: 70,
    message: 'Classifying BIM elements...',
  });

  // Use Classifier to group elements
  const classifier = components.get(OBC.Classifier);

  // Extract classifications from the loaded model
  if (loadedFragmentsModel) {
    try {
      // Extract classification data from the classifier's list
      // The Classifier maintains a list of classification groups
      for (const [key, fragmentIdMap] of Object.entries(classifier.list)) {
        // fragmentIdMap is Map<fragmentId, Set<expressIds>>
        if (fragmentIdMap && typeof fragmentIdMap === 'object') {
          const elementIds = new Set<string>();

          for (const [, ids] of Object.entries(fragmentIdMap as Record<string, Set<number>>)) {
            if (ids && ids instanceof Set) {
              ids.forEach((id: number) => elementIds.add(String(id)));
            }
          }

          // Categorize by the classification key pattern
          if (key.startsWith('entities:')) {
            // IFC category (e.g., "entities:IfcWall")
            const category = key.replace('entities:', '');
            classifications.byCategory.set(category, elementIds);
          } else if (key.startsWith('Levels:')) {
            // Building storey
            const storey = key.replace('Levels:', '');
            classifications.byStorey.set(storey, elementIds);
          } else if (key.startsWith('predefinedTypes:')) {
            // Predefined type
            const predefinedType = key.replace('predefinedTypes:', '');
            classifications.byPredefinedType.set(predefinedType, elementIds);
          }
        }
      }
    } catch (classifierError) {
      console.warn('Classification failed, continuing with basic extraction:', classifierError);
    }
  }

  onProgress?.({
    stage: 'extracting',
    progress: 70,
    message: 'Running deep extraction pipeline...',
  });

  // Run deep extraction pipeline to get quantities, materials, and properties
  let extractionResult: ExtractionResult | null = null;
  const extractedElementMap = new Map<number, ExtractedElement>();

  try {
    const pipeline = getExtractionPipeline();
    extractionResult = await pipeline.extract(data, (progress) => {
      // Map pipeline progress to our 70-85 range
      const mappedProgress = 70 + Math.round(progress.percent * 0.15);
      onProgress?.({
        stage: 'extracting',
        progress: mappedProgress,
        message: progress.message,
      });
    });

    // Build lookup map for merging with OBC classifications
    for (const el of extractionResult.elements) {
      extractedElementMap.set(el.expressId, el);
    }

    console.log('Deep extraction complete:', {
      elements: extractionResult.elements.length,
      levels: extractionResult.levels.length,
      totalQuantities: extractionResult.totalQuantities,
      materialSummary: extractionResult.materialSummary,
    });
  } catch (extractionError) {
    console.warn('Deep extraction failed, using basic extraction:', extractionError);
  }

  onProgress?.({
    stage: 'extracting',
    progress: 85,
    message: 'Merging element data...',
  });

  // Build elements with enhanced data from deep extraction
  const elements: BIMElement[] = [];
  const levels: BuildingLevel[] = [];

  // Use classifications from OBC Classifier as primary source
  for (const [category, elementIds] of classifications.byCategory) {
    const elementType = mapIFCCategoryToType(category);

    for (const expressId of elementIds) {
      const numericId = parseInt(expressId, 10);
      const extractedElement = extractedElementMap.get(numericId);

      // Build element with merged data
      // Build properties, filtering out undefined values
      const properties: Record<string, string | number | boolean> = {
        ifcCategory: category,
        source: 'IFC Import',
      };

      // Add extracted quantities if available
      if (extractedElement?.quantities?.GrossVolume != null) {
        properties.volume = extractedElement.quantities.GrossVolume;
      } else if (extractedElement?.quantities?.NetVolume != null) {
        properties.volume = extractedElement.quantities.NetVolume;
      }

      if (extractedElement?.quantities?.GrossArea != null) {
        properties.area = extractedElement.quantities.GrossArea;
      } else if (extractedElement?.quantities?.NetArea != null) {
        properties.area = extractedElement.quantities.NetArea;
      }

      if (extractedElement?.quantities?.Length != null) {
        properties.length = extractedElement.quantities.Length;
      }
      if (extractedElement?.quantities?.Width != null) {
        properties.width = extractedElement.quantities.Width;
      }
      if (extractedElement?.quantities?.Height != null) {
        properties.height = extractedElement.quantities.Height;
      }

      // Add material info if available
      if (extractedElement?.materials?.[0]?.name) {
        properties.materialName = extractedElement.materials[0].name;
      }
      if (extractedElement?.materials?.[0]?.category) {
        properties.materialCategory = extractedElement.materials[0].category;
      }

      const element: BIMElement = {
        id: expressId,
        globalId: extractedElement?.globalId || `${loadedFragmentsModel?.modelId || 'model'}-${expressId}`,
        type: extractedElement?.elementType || elementType,
        name: extractedElement?.name || `${category} ${expressId}`,
        material: extractedElement?.materials?.[0]?.name,
        properties,
      };

      // Add geometry bounding box if available from THREE.js
      if (loadedFragmentsModel?.object) {
        const elementMesh = findMeshByExpressId(loadedFragmentsModel.object, numericId);
        if (elementMesh) {
          const bbox = new THREE.Box3().setFromObject(elementMesh);
          if (!bbox.isEmpty()) {
            element.geometry = {
              position: {
                x: elementMesh.position.x,
                y: elementMesh.position.y,
                z: elementMesh.position.z,
              },
              rotation: {
                x: elementMesh.rotation.x,
                y: elementMesh.rotation.y,
                z: elementMesh.rotation.z,
              },
              scale: {
                x: elementMesh.scale.x,
                y: elementMesh.scale.y,
                z: elementMesh.scale.z,
              },
              boundingBox: {
                min: { x: bbox.min.x, y: bbox.min.y, z: bbox.min.z },
                max: { x: bbox.max.x, y: bbox.max.y, z: bbox.max.z },
              },
            };
          }
        }
      }

      // Find which storey this element belongs to
      for (const [storeyName, storeyIds] of classifications.byStorey) {
        if (storeyIds.has(expressId)) {
          element.level = storeyName;
          break;
        }
      }

      // Find predefined type
      for (const [typeName, typeIds] of classifications.byPredefinedType) {
        if (typeIds.has(expressId)) {
          element.properties = {
            ...element.properties,
            predefinedType: typeName,
          };
          break;
        }
      }

      elements.push(element);
    }
  }

  // Use levels from deep extraction if available (has elevation data)
  if (extractionResult?.levels?.length) {
    for (const level of extractionResult.levels) {
      levels.push({
        id: `storey-${level.name}`,
        name: level.name,
        elevation: level.elevation || 0,
        height: level.height || 3.0,
      });
    }
  } else {
    // Fallback to basic level extraction
    for (const [storeyName] of classifications.byStorey) {
      levels.push({
        id: `storey-${storeyName}`,
        name: storeyName,
        elevation: 0,
        height: 3.0,
      });
    }
  }

  // If no classifications found, create basic element entry
  if (elements.length === 0 && loadedFragmentsModel) {
    elements.push({
      id: loadedFragmentsModel.modelId || 'ifc-model-root',
      globalId: loadedFragmentsModel.modelId || 'ifc-model-root',
      type: 'other',
      name: modelName,
      properties: {
        source: 'IFC Import',
        filename: file.name,
      },
    });
  }

  onProgress?.({
    stage: 'building',
    progress: 90,
    message: 'Building model...',
  });

  // Calculate bounding box from the loaded model
  let boundingBox = {
    min: { x: -50, y: 0, z: -50 },
    max: { x: 50, y: 30, z: 50 },
  };

  if (loadedFragmentsModel?.object) {
    const box = new THREE.Box3().setFromObject(loadedFragmentsModel.object);
    if (box.isEmpty() === false) {
      boundingBox = {
        min: { x: box.min.x, y: box.min.y, z: box.min.z },
        max: { x: box.max.x, y: box.max.y, z: box.max.z },
      };
    }
  }

  const model: BIMModel = {
    id: loadedFragmentsModel?.modelId || `ifc-${Date.now()}`,
    name: modelName,
    description: `Imported from ${file.name}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: 'ifc',
    elements,
    levels,
    metadata: {
      elementCount: elements.length,
      levelCount: levels.length,
      boundingBox,
      units: 'metric',
      // Add total quantities from deep extraction (use correct property names)
      totalArea: extractionResult?.totalQuantities?.floorArea, // Floor area as total area
      totalVolume: extractionResult?.totalQuantities?.volume,
      wallArea: extractionResult?.totalQuantities?.wallArea,
      floorArea: extractionResult?.totalQuantities?.floorArea,
      openingArea: extractionResult?.totalQuantities?.openingArea,
    },
    // Note: Sustainability analysis will be computed by the AI agent using
    // element quantities and materials from the projectContext
  };

  onProgress?.({
    stage: 'complete',
    progress: 100,
    message: 'Model loaded successfully',
  });

  return { fragmentsGroup: loadedFragmentsModel, model, classifications };
}

/**
 * Map IFC category names to BIMElementType
 */
function mapIFCCategoryToType(category: string): BIMElementType {
  const categoryMap: Record<string, BIMElementType> = {
    'IfcWall': 'wall',
    'IfcWallStandardCase': 'wall',
    'IfcCurtainWall': 'wall',
    'IfcDoor': 'door',
    'IfcWindow': 'window',
    'IfcSlab': 'slab',
    'IfcRoof': 'roof',
    'IfcStair': 'stair',
    'IfcStairFlight': 'stair',
    'IfcRamp': 'stair',
    'IfcColumn': 'column',
    'IfcBeam': 'beam',
    'IfcMember': 'beam',
    'IfcFurnishingElement': 'furniture',
    'IfcFurniture': 'furniture',
    'IfcFlowSegment': 'pipe',
    'IfcFlowFitting': 'pipe',
    'IfcPipeSegment': 'pipe',
    'IfcPipeFitting': 'pipe',
    'IfcDuctSegment': 'duct',
    'IfcDuctFitting': 'duct',
    'IfcSpace': 'space',
    'IfcZone': 'zone',
    'IfcCovering': 'other',
    'IfcRailing': 'other',
    'IfcBuildingElementProxy': 'other',
  };

  return categoryMap[category] || 'other';
}
