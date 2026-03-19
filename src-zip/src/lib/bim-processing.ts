/**
 * BIM File Processing Pipeline
 *
 * Handles IFC/GLTF file parsing, element extraction, and 3D model processing
 */

import { prisma } from './db';
import { logger, FileProcessingError } from './errors';
import type { ProcessingStatus, ModelFormat } from '@prisma/client';

// ============================================
// Types
// ============================================

export interface BimElementData {
  ifcId?: string;
  globalId?: string;
  elementType: string;
  name?: string;
  geometry?: {
    vertices?: number[];
    indices?: number[];
    normals?: number[];
  };
  boundingBox?: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  centroid?: { x: number; y: number; z: number };
  properties?: Record<string, unknown>;
  materials?: Array<{
    name: string;
    color?: string;
    transparency?: number;
  }>;
  floor?: number;
  levelName?: string;
  containedIn?: string;
}

export interface ParsedBimModel {
  name: string;
  metadata: {
    author?: string;
    organization?: string;
    application?: string;
    timestamp?: string;
    schema?: string;
  };
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  elements: BimElementData[];
  spatialStructure: {
    site?: string;
    buildings: Array<{
      id: string;
      name: string;
      floors: Array<{
        id: string;
        name: string;
        elevation: number;
      }>;
    }>;
  };
}

export interface ProcessingResult {
  success: boolean;
  modelId: string;
  elementsCount: number;
  processingTime: number;
  errors?: string[];
}

// ============================================
// File Format Detectors
// ============================================

export function detectModelFormat(filename: string, mimeType: string): ModelFormat {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'ifc':
      return 'IFC';
    case 'gltf':
    case 'glb':
      return 'GLTF';
    case 'fbx':
      return 'FBX';
    case 'obj':
      return 'OBJ';
    case 'rvt':
      return 'REVIT';
    case 'step':
    case 'stp':
      return 'STEP';
    default:
      // Try to detect from mime type
      if (mimeType.includes('ifc')) return 'IFC';
      if (mimeType.includes('gltf')) return 'GLTF';
      return 'IFC'; // Default to IFC
  }
}

// ============================================
// IFC Parser (Simplified)
// ============================================

export async function parseIFCFile(
  fileBuffer: Buffer,
  filename: string
): Promise<ParsedBimModel> {
  logger.info('Parsing IFC file', { filename, size: fileBuffer.length });

  try {
    const content = fileBuffer.toString('utf-8');
    const lines = content.split('\n');

    // Extract header info
    const metadata: ParsedBimModel['metadata'] = {};
    const elements: BimElementData[] = [];
    const buildings: ParsedBimModel['spatialStructure']['buildings'] = [];

    // Simple IFC parser - extracts basic entity information
    // In production, use web-ifc or IFC.js for full parsing
    let currentBuilding: { id: string; name: string; floors: Array<{ id: string; name: string; elevation: number }> } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Parse FILE_NAME for metadata
      if (trimmed.startsWith('FILE_NAME')) {
        const match = trimmed.match(/FILE_NAME\s*\(\s*'([^']*)'/);
        if (match) {
          metadata.author = match[1];
        }
      }

      // Parse IFCAPPLICATION for software info
      if (trimmed.includes('IFCAPPLICATION')) {
        const match = trimmed.match(/'([^']+)'/g);
        if (match && match.length >= 2) {
          metadata.application = match[1]?.replace(/'/g, '');
        }
      }

      // Parse building elements
      if (trimmed.includes('IFCWALL') || trimmed.includes('IFCDOOR') ||
          trimmed.includes('IFCWINDOW') || trimmed.includes('IFCSLAB') ||
          trimmed.includes('IFCCOLUMN') || trimmed.includes('IFCBEAM') ||
          trimmed.includes('IFCSTAIR') || trimmed.includes('IFCROOF')) {

        const idMatch = trimmed.match(/^#(\d+)/);
        const typeMatch = trimmed.match(/IFC(\w+)/);
        const nameMatch = trimmed.match(/'([^']+)'/);

        if (idMatch && typeMatch) {
          const element: BimElementData = {
            ifcId: `#${idMatch[1]}`,
            globalId: `elem_${idMatch[1]}`,
            elementType: `IFC${typeMatch[1]}`,
            name: nameMatch ? nameMatch[1] : undefined,
            properties: {},
          };

          // Generate mock bounding box based on element type
          const baseSize = getElementBaseSize(element.elementType);
          element.boundingBox = {
            min: { x: 0, y: 0, z: 0 },
            max: baseSize,
          };
          element.centroid = {
            x: baseSize.x / 2,
            y: baseSize.y / 2,
            z: baseSize.z / 2,
          };

          elements.push(element);
        }
      }

      // Parse building storeys
      if (trimmed.includes('IFCBUILDINGSTOREY')) {
        const idMatch = trimmed.match(/^#(\d+)/);
        const nameMatch = trimmed.match(/'([^']+)'/);
        const elevMatch = trimmed.match(/,(\d+\.?\d*)\)/);

        if (idMatch) {
          if (!currentBuilding) {
            currentBuilding = {
              id: 'building_1',
              name: 'Main Building',
              floors: [],
            };
            buildings.push(currentBuilding);
          }

          currentBuilding.floors.push({
            id: `floor_${idMatch[1]}`,
            name: nameMatch ? nameMatch[1] : `Level ${currentBuilding.floors.length}`,
            elevation: elevMatch ? parseFloat(elevMatch[1]) : currentBuilding.floors.length * 3,
          });
        }
      }
    }

    // Assign floor levels to elements
    const floors = buildings[0]?.floors || [];
    elements.forEach((element, index) => {
      if (floors.length > 0) {
        const floorIndex = index % floors.length;
        element.floor = floorIndex;
        element.levelName = floors[floorIndex]?.name;
      }
    });

    // Calculate overall bounding box
    const boundingBox = calculateOverallBoundingBox(elements);

    logger.info('IFC parsing completed', {
      filename,
      elementsCount: elements.length,
      buildingsCount: buildings.length,
    });

    return {
      name: filename.replace(/\.[^/.]+$/, ''),
      metadata,
      boundingBox,
      elements,
      spatialStructure: {
        buildings,
      },
    };
  } catch (error) {
    logger.error('IFC parsing failed', error as Error, { filename });
    throw new FileProcessingError(filename, 'Failed to parse IFC file');
  }
}

// ============================================
// GLTF Parser (Simplified)
// ============================================

export async function parseGLTFFile(
  fileBuffer: Buffer,
  filename: string
): Promise<ParsedBimModel> {
  logger.info('Parsing GLTF file', { filename, size: fileBuffer.length });

  try {
    const content = fileBuffer.toString('utf-8');
    const gltf = JSON.parse(content);

    const elements: BimElementData[] = [];
    const metadata: ParsedBimModel['metadata'] = {
      application: gltf.asset?.generator,
    };

    // Parse meshes as elements
    if (gltf.meshes) {
      for (let i = 0; i < gltf.meshes.length; i++) {
        const mesh = gltf.meshes[i];
        elements.push({
          globalId: `mesh_${i}`,
          elementType: 'MESH',
          name: mesh.name || `Mesh ${i}`,
          properties: {
            primitiveCount: mesh.primitives?.length || 0,
          },
        });
      }
    }

    // Parse nodes as potential elements
    if (gltf.nodes) {
      for (let i = 0; i < gltf.nodes.length; i++) {
        const node = gltf.nodes[i];
        if (node.mesh !== undefined) {
          continue; // Already processed as mesh
        }

        if (node.name) {
          elements.push({
            globalId: `node_${i}`,
            elementType: 'NODE',
            name: node.name,
            properties: {
              translation: node.translation,
              rotation: node.rotation,
              scale: node.scale,
            },
          });
        }
      }
    }

    const boundingBox = calculateOverallBoundingBox(elements);

    logger.info('GLTF parsing completed', {
      filename,
      elementsCount: elements.length,
    });

    return {
      name: filename.replace(/\.[^/.]+$/, ''),
      metadata,
      boundingBox,
      elements,
      spatialStructure: {
        buildings: [],
      },
    };
  } catch (error) {
    logger.error('GLTF parsing failed', error as Error, { filename });
    throw new FileProcessingError(filename, 'Failed to parse GLTF file');
  }
}

// ============================================
// Processing Pipeline
// ============================================

export async function processModelFile(
  modelId: string,
  fileBuffer: Buffer,
  filename: string,
  format: ModelFormat
): Promise<ProcessingResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Update status to processing
    await prisma.bimModel.update({
      where: { id: modelId },
      data: { status: 'PROCESSING' as ProcessingStatus },
    });

    // Parse based on format
    let parsed: ParsedBimModel;

    switch (format) {
      case 'IFC':
        parsed = await parseIFCFile(fileBuffer, filename);
        break;
      case 'GLTF':
        parsed = await parseGLTFFile(fileBuffer, filename);
        break;
      default:
        // For other formats, create minimal structure
        parsed = {
          name: filename,
          metadata: {},
          boundingBox: {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 100, y: 100, z: 30 },
          },
          elements: [],
          spatialStructure: { buildings: [] },
        };
    }

    // Store elements in database
    const elementCreateData = parsed.elements.map((element) => ({
      modelId,
      ifcId: element.ifcId || null,
      globalId: element.globalId || null,
      elementType: element.elementType,
      name: element.name || null,
      geometry: element.geometry ? (element.geometry as object) : undefined,
      boundingBox: element.boundingBox ? (element.boundingBox as object) : undefined,
      centroid: element.centroid ? (element.centroid as object) : undefined,
      properties: element.properties ? (element.properties as object) : undefined,
      materials: element.materials ? (element.materials as object) : undefined,
      floor: element.floor || null,
      levelName: element.levelName || null,
      containedIn: element.containedIn || null,
    }));

    // Batch insert elements
    await prisma.bimElement.createMany({
      data: elementCreateData,
      skipDuplicates: true,
    });

    // Update model with parsed data
    await prisma.bimModel.update({
      where: { id: modelId },
      data: {
        status: 'COMPLETED' as ProcessingStatus,
        metadata: parsed.metadata,
        boundingBox: parsed.boundingBox,
        elementsCount: parsed.elements.length,
        processedAt: new Date(),
      },
    });

    const processingTime = Date.now() - startTime;

    logger.info('Model processing completed', {
      modelId,
      elementsCount: parsed.elements.length,
      processingTime,
    });

    return {
      success: true,
      modelId,
      elementsCount: parsed.elements.length,
      processingTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    // Update model with error
    await prisma.bimModel.update({
      where: { id: modelId },
      data: {
        status: 'FAILED' as ProcessingStatus,
        errorMessage,
      },
    });

    logger.error('Model processing failed', error as Error, { modelId });

    return {
      success: false,
      modelId,
      elementsCount: 0,
      processingTime: Date.now() - startTime,
      errors,
    };
  }
}

// ============================================
// Helper Functions
// ============================================

function getElementBaseSize(elementType: string): { x: number; y: number; z: number } {
  const sizes: Record<string, { x: number; y: number; z: number }> = {
    IFCWALL: { x: 5, y: 0.3, z: 3 },
    IFCDOOR: { x: 1, y: 0.1, z: 2.1 },
    IFCWINDOW: { x: 1.2, y: 0.1, z: 1.5 },
    IFCSLAB: { x: 10, y: 10, z: 0.3 },
    IFCCOLUMN: { x: 0.4, y: 0.4, z: 3 },
    IFCBEAM: { x: 5, y: 0.3, z: 0.5 },
    IFCSTAIR: { x: 3, y: 1.2, z: 3 },
    IFCROOF: { x: 12, y: 12, z: 0.5 },
  };

  return sizes[elementType] || { x: 1, y: 1, z: 1 };
}

function calculateOverallBoundingBox(
  elements: BimElementData[]
): { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } } {
  if (elements.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 100, y: 100, z: 30 },
    };
  }

  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };

  for (const element of elements) {
    if (element.boundingBox) {
      min.x = Math.min(min.x, element.boundingBox.min.x);
      min.y = Math.min(min.y, element.boundingBox.min.y);
      min.z = Math.min(min.z, element.boundingBox.min.z);
      max.x = Math.max(max.x, element.boundingBox.max.x);
      max.y = Math.max(max.y, element.boundingBox.max.y);
      max.z = Math.max(max.z, element.boundingBox.max.z);
    }
  }

  // Handle case where no valid bounding boxes found
  if (!isFinite(min.x)) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 100, y: 100, z: 30 },
    };
  }

  return { min, max };
}

// ============================================
// Element Queries
// ============================================

export async function queryElements(
  modelId: string,
  options: {
    elementType?: string;
    floor?: number;
    limit?: number;
    offset?: number;
  }
): Promise<BimElementData[]> {
  const elements = await prisma.bimElement.findMany({
    where: {
      modelId,
      ...(options.elementType && { elementType: options.elementType }),
      ...(options.floor !== undefined && { floor: options.floor }),
    },
    take: options.limit || 100,
    skip: options.offset || 0,
  });

  return elements.map((el) => ({
    ifcId: el.ifcId || undefined,
    globalId: el.globalId || undefined,
    elementType: el.elementType,
    name: el.name || undefined,
    geometry: el.geometry as BimElementData['geometry'],
    boundingBox: el.boundingBox as BimElementData['boundingBox'],
    centroid: el.centroid as BimElementData['centroid'],
    properties: el.properties as Record<string, unknown>,
    materials: el.materials as BimElementData['materials'],
    floor: el.floor || undefined,
    levelName: el.levelName || undefined,
    containedIn: el.containedIn || undefined,
  }));
}

export async function getElementStats(modelId: string): Promise<{
  totalElements: number;
  byType: Record<string, number>;
  byFloor: Record<number, number>;
}> {
  const elements = await prisma.bimElement.findMany({
    where: { modelId },
    select: {
      elementType: true,
      floor: true,
    },
  });

  const byType: Record<string, number> = {};
  const byFloor: Record<number, number> = {};

  for (const element of elements) {
    byType[element.elementType] = (byType[element.elementType] || 0) + 1;
    if (element.floor !== null) {
      byFloor[element.floor] = (byFloor[element.floor] || 0) + 1;
    }
  }

  return {
    totalElements: elements.length,
    byType,
    byFloor,
  };
}
