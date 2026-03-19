/**
 * IFC to Carbon Calculator Integration Service
 *
 * Bridges IFC model data from the BIM viewer to the carbon analysis pipeline.
 * Extracts materials and quantities from BIM elements and prepares them for
 * carbon footprint calculation using the Thai material database.
 *
 * ★ Insight ─────────────────────────────────────
 * This service is the critical link between 3D model visualization and
 * carbon analysis. It handles:
 * - Element quantity extraction (volume, area from geometry)
 * - Material mapping using fuzzy matching
 * - Density-based mass calculation when volume is known
 * - Uncertainty propagation for confidence scoring
 * ─────────────────────────────────────────────────
 */

import type { BIMModel, BIMElement, BIMElementType } from '@/types/bim';
import type { ExtractedMaterial, MaterialLayer } from '@/lib/ifc/extraction-pipeline';
import type {
  CarbonAnalysisInput,
  ElementWithMaterial,
  MaterialAssignment,
} from './analysis-pipeline';
import { mapIFCMaterial, type MaterialMapping } from './ifc-material-mapper';
import { THAI_MATERIALS, type ThaiMaterial } from './thai-materials';

// ============================================
// Types
// ============================================

export interface IFCCalculatorOptions {
  /** Include only selected elements (if any) */
  selectedElementIds?: string[];
  /** Filter by element types */
  elementTypes?: BIMElementType[];
  /** Filter by levels */
  levelIds?: string[];
  /** Use default densities when not available from IFC */
  useDefaultDensities?: boolean;
  /** Include zero-quantity elements (for reporting) */
  includeZeroQuantity?: boolean;
  /** Material mapping overrides */
  materialOverrides?: Record<string, string>;
  /** Confidence threshold for material mapping */
  minMappingConfidence?: number;
}

export interface IFCConversionResult {
  /** Analysis input ready for carbon calculation */
  analysisInput: CarbonAnalysisInput;
  /** Material mappings used */
  materialMappings: Map<string, MaterialMapping>;
  /** Elements that couldn't be processed */
  skippedElements: Array<{ id: string; reason: string }>;
  /** Warnings about data quality */
  warnings: string[];
  /** Summary statistics */
  statistics: ConversionStatistics;
}

export interface ConversionStatistics {
  totalElements: number;
  processedElements: number;
  skippedElements: number;
  uniqueMaterials: number;
  avgMappingConfidence: number;
  totalVolume: number;
  totalArea: number;
  totalMass: number;
  byElementType: Record<string, number>;
  byMaterial: Record<string, number>;
}

export interface ElementQuantities {
  /** Volume in m³ */
  volume?: number;
  /** Area in m² */
  area?: number;
  /** Mass in kg */
  mass?: number;
  /** Length in m (for linear elements) */
  length?: number;
  /** Source of quantities */
  source: 'geometry' | 'properties' | 'calculated' | 'estimated';
}

// ============================================
// Default Values
// ============================================

/**
 * Default element dimensions for estimation when geometry is unavailable
 * Based on typical Thai construction practices
 */
const DEFAULT_ELEMENT_DIMENSIONS: Record<BIMElementType, { thickness: number; height?: number }> = {
  wall: { thickness: 0.2, height: 3.0 },      // 200mm wall, 3m height
  slab: { thickness: 0.15 },                   // 150mm slab
  beam: { thickness: 0.3, height: 0.5 },       // 300x500mm beam
  column: { thickness: 0.3, height: 3.0 },     // 300x300mm column, 3m height
  roof: { thickness: 0.15 },                   // 150mm roof slab
  door: { thickness: 0.05, height: 2.1 },      // 50mm door, 2.1m height
  window: { thickness: 0.01, height: 1.5 },    // 10mm glass, 1.5m height
  stair: { thickness: 0.15 },                  // 150mm stair slab
  pipe: { thickness: 0.003 },                  // 3mm pipe wall
  duct: { thickness: 0.001 },                  // 1mm duct wall
  hvac: { thickness: 0.003 },                  // 3mm HVAC equipment
  furniture: { thickness: 0.02 },              // 20mm furniture panels
  equipment: { thickness: 0.01 },              // 10mm equipment shell
  space: { thickness: 0 },                     // Spaces have no physical material
  zone: { thickness: 0 },                      // Zones have no physical material
  other: { thickness: 0.1 },                   // 100mm default
};

// ============================================
// Quantity Extraction
// ============================================

/**
 * Extract quantities from a BIM element
 */
function extractElementQuantities(element: BIMElement): ElementQuantities {
  const quantities: ElementQuantities = { source: 'estimated' };

  // Try to get from geometry bounding box
  if (element.geometry?.boundingBox) {
    const { min, max } = element.geometry.boundingBox;
    const width = Math.abs(max.x - min.x);
    const depth = Math.abs(max.y - min.y);
    const height = Math.abs(max.z - min.z);

    // Calculate volume from bounding box
    quantities.volume = width * depth * height;
    quantities.source = 'geometry';

    // Calculate area based on element type
    switch (element.type) {
      case 'wall':
        // Wall area is typically width * height (one side)
        quantities.area = Math.max(width, depth) * height;
        break;
      case 'slab':
      case 'roof':
        // Floor/roof area is width * depth
        quantities.area = width * depth;
        break;
      case 'door':
      case 'window':
        // Opening area
        quantities.area = width * height;
        break;
      default:
        // Default to largest face
        quantities.area = Math.max(width * depth, width * height, depth * height);
    }
  }

  // Try to get from properties (IFC Qto_* sets)
  const props = element.properties || {};

  if (props.NetVolume || props.GrossVolume || props.Volume) {
    quantities.volume = Number(props.NetVolume || props.GrossVolume || props.Volume);
    quantities.source = 'properties';
  }

  if (props.NetArea || props.GrossArea || props.Area) {
    quantities.area = Number(props.NetArea || props.GrossArea || props.Area);
    quantities.source = 'properties';
  }

  if (props.NetWeight || props.GrossWeight || props.Mass || props.Weight) {
    quantities.mass = Number(props.NetWeight || props.GrossWeight || props.Mass || props.Weight);
    quantities.source = 'properties';
  }

  if (props.Length) {
    quantities.length = Number(props.Length);
  }

  // Estimate if still missing
  if (!quantities.volume && !quantities.area && !quantities.mass) {
    const defaults = DEFAULT_ELEMENT_DIMENSIONS[element.type] || DEFAULT_ELEMENT_DIMENSIONS.other;

    // For elements without geometry, estimate based on element count
    // This is a rough approximation
    switch (element.type) {
      case 'wall':
        quantities.area = 10; // Assume 10m² wall section
        quantities.volume = quantities.area * defaults.thickness;
        break;
      case 'slab':
      case 'roof':
        quantities.area = 20; // Assume 20m² floor/roof section
        quantities.volume = quantities.area * defaults.thickness;
        break;
      case 'column':
        quantities.volume = defaults.thickness * defaults.thickness * (defaults.height || 3);
        quantities.area = defaults.thickness * defaults.thickness; // Cross-section
        break;
      case 'beam':
        quantities.volume = defaults.thickness * (defaults.height || 0.5) * 6; // Assume 6m span
        quantities.area = defaults.thickness * (defaults.height || 0.5);
        break;
      case 'door':
        quantities.area = 2.0; // Standard 1m x 2m door
        quantities.volume = quantities.area * defaults.thickness;
        break;
      case 'window':
        quantities.area = 2.0; // Standard window
        quantities.volume = quantities.area * defaults.thickness;
        break;
      default:
        quantities.volume = 0.1; // Minimal default
        quantities.area = 1.0;
    }

    quantities.source = 'estimated';
  }

  return quantities;
}

/**
 * Calculate mass from volume and material density
 */
function calculateMass(
  volume: number,
  thaiMaterial: ThaiMaterial,
  useDefaultDensity: boolean = true
): number | undefined {
  if (thaiMaterial.density) {
    return volume * thaiMaterial.density;
  }

  if (!useDefaultDensity) {
    return undefined;
  }

  // Default densities by category (kg/m³)
  const defaultDensities: Partial<Record<string, number>> = {
    concrete: 2400,
    steel: 7850,
    masonry: 1800,
    timber: 600,
    glass: 2500,
    insulation: 50,
    finishes: 1500,
    mep: 2000,
    roofing: 1800,
    waterproofing: 1100,
  };

  const density = defaultDensities[thaiMaterial.category];
  return density ? volume * density : undefined;
}

// ============================================
// Material Extraction
// ============================================

/**
 * Extract material name from BIM element
 */
function extractMaterialName(element: BIMElement): string {
  // Direct material property
  if (element.material) {
    return element.material;
  }

  // Check properties for material info
  const props = element.properties || {};
  if (props.Material) {
    return String(props.Material);
  }
  if (props.MaterialName) {
    return String(props.MaterialName);
  }
  if (props.StructuralMaterial) {
    return String(props.StructuralMaterial);
  }

  // Return empty to use element type default
  return '';
}

/**
 * Convert extracted IFC materials to material assignments
 */
function convertExtractedMaterials(
  extractedMaterial: ExtractedMaterial | undefined,
  elementType: BIMElementType,
  materialOverrides: Record<string, string>
): MaterialAssignment[] {
  if (!extractedMaterial) {
    // No material info, will use element type default
    return [];
  }

  const assignments: MaterialAssignment[] = [];

  // Handle layered materials (walls, floors)
  if (extractedMaterial.layers && extractedMaterial.layers.length > 0) {
    const totalThickness = extractedMaterial.layers.reduce((sum, l) => sum + l.thickness, 0);

    for (const layer of extractedMaterial.layers) {
      const mapping = mapIFCMaterial(layer.name, { elementType });
      assignments.push({
        name: layer.name,
        fraction: totalThickness > 0 ? layer.thickness / totalThickness : 1 / extractedMaterial.layers.length,
        thickness: layer.thickness / 1000, // Convert mm to m
        density: mapping.thaiMaterial.density,
        materialId: materialOverrides[layer.name] || mapping.thaiMaterialId,
      });
    }
  }
  // Handle constituent materials (concrete with rebar)
  else if (extractedMaterial.constituents && extractedMaterial.constituents.length > 0) {
    for (const constituent of extractedMaterial.constituents) {
      const mapping = mapIFCMaterial(constituent.name, { elementType });
      assignments.push({
        name: constituent.name,
        fraction: constituent.fraction,
        density: mapping.thaiMaterial.density,
        materialId: materialOverrides[constituent.name] || mapping.thaiMaterialId,
      });
    }
  }
  // Single material
  else {
    const mapping = mapIFCMaterial(extractedMaterial.name, { elementType });
    assignments.push({
      name: extractedMaterial.name,
      fraction: 1.0,
      density: extractedMaterial.density || mapping.thaiMaterial.density,
      materialId: materialOverrides[extractedMaterial.name] || mapping.thaiMaterialId,
    });
  }

  return assignments;
}

// ============================================
// Main Conversion Function
// ============================================

/**
 * Convert BIM model to carbon analysis input
 */
export function convertBIMToAnalysisInput(
  model: BIMModel,
  options: IFCCalculatorOptions = {}
): IFCConversionResult {
  const {
    selectedElementIds,
    elementTypes,
    levelIds,
    useDefaultDensities = true,
    includeZeroQuantity = false,
    materialOverrides = {},
    minMappingConfidence = 0.3,
  } = options;

  const result: IFCConversionResult = {
    analysisInput: {
      modelId: model.id,
      elements: [],
      grossFloorArea: model.metadata?.totalArea,
      buildingVolume: model.metadata?.totalVolume,
    },
    materialMappings: new Map(),
    skippedElements: [],
    warnings: [],
    statistics: {
      totalElements: model.elements.length,
      processedElements: 0,
      skippedElements: 0,
      uniqueMaterials: 0,
      avgMappingConfidence: 0,
      totalVolume: 0,
      totalArea: 0,
      totalMass: 0,
      byElementType: {},
      byMaterial: {},
    },
  };

  let totalConfidence = 0;
  let materialCount = 0;

  // Filter elements
  let elementsToProcess = model.elements;

  if (selectedElementIds && selectedElementIds.length > 0) {
    const selectedSet = new Set(selectedElementIds);
    elementsToProcess = elementsToProcess.filter((e) => selectedSet.has(e.id));
  }

  if (elementTypes && elementTypes.length > 0) {
    const typeSet = new Set(elementTypes);
    elementsToProcess = elementsToProcess.filter((e) => typeSet.has(e.type));
  }

  if (levelIds && levelIds.length > 0) {
    const levelSet = new Set(levelIds);
    elementsToProcess = elementsToProcess.filter((e) => e.level && levelSet.has(e.level));
  }

  // Process each element
  for (const element of elementsToProcess) {
    // Skip non-physical elements
    if (element.type === 'space' || element.type === 'zone') {
      result.skippedElements.push({ id: element.id, reason: 'Non-physical element type' });
      continue;
    }

    // Extract quantities
    const quantities = extractElementQuantities(element);

    if (!includeZeroQuantity && !quantities.volume && !quantities.area && !quantities.mass) {
      result.skippedElements.push({ id: element.id, reason: 'No quantity data available' });
      continue;
    }

    // Extract and map materials
    const materialName = extractMaterialName(element);
    const mapping = mapIFCMaterial(materialName, { elementType: element.type });

    if (mapping.confidence < minMappingConfidence) {
      result.warnings.push(
        `Low confidence mapping for ${element.name || element.id}: "${materialName}" → ${mapping.thaiMaterialId} (${(mapping.confidence * 100).toFixed(0)}%)`
      );
    }

    // Track mapping
    if (!result.materialMappings.has(materialName)) {
      result.materialMappings.set(materialName, mapping);
      materialCount++;
    }
    totalConfidence += mapping.confidence;

    // Create material assignment
    const materialAssignment: MaterialAssignment = {
      name: materialName || mapping.thaiMaterial.nameEn,
      fraction: 1.0,
      thickness: element.properties?.Thickness
        ? Number(element.properties.Thickness) / 1000
        : undefined,
      density: mapping.thaiMaterial.density,
      materialId: materialOverrides[materialName] || mapping.thaiMaterialId,
    };

    // Calculate mass if needed
    if (!quantities.mass && quantities.volume && useDefaultDensities) {
      quantities.mass = calculateMass(quantities.volume, mapping.thaiMaterial, true);
    }

    // Create element with material
    const elementWithMaterial: ElementWithMaterial = {
      id: element.id,
      globalId: element.globalId,
      name: element.name,
      elementType: element.type,
      ifcType: String(element.properties?.IFCType || element.type),
      levelId: element.level,
      volume: quantities.volume,
      area: quantities.area,
      mass: quantities.mass,
      materials: [materialAssignment],
    };

    result.analysisInput.elements.push(elementWithMaterial);

    // Update statistics
    result.statistics.processedElements++;
    result.statistics.totalVolume += quantities.volume || 0;
    result.statistics.totalArea += quantities.area || 0;
    result.statistics.totalMass += quantities.mass || 0;

    result.statistics.byElementType[element.type] =
      (result.statistics.byElementType[element.type] || 0) + 1;

    const matId = mapping.thaiMaterialId;
    result.statistics.byMaterial[matId] = (result.statistics.byMaterial[matId] || 0) + 1;
  }

  // Finalize statistics
  result.statistics.skippedElements = result.skippedElements.length;
  result.statistics.uniqueMaterials = result.materialMappings.size;
  result.statistics.avgMappingConfidence =
    materialCount > 0 ? totalConfidence / materialCount : 0;

  // Add warnings for data quality issues
  if (result.statistics.avgMappingConfidence < 0.6) {
    result.warnings.push(
      `Average material mapping confidence is low (${(result.statistics.avgMappingConfidence * 100).toFixed(0)}%). Consider reviewing material mappings.`
    );
  }

  if (result.statistics.skippedElements > result.statistics.processedElements * 0.2) {
    result.warnings.push(
      `${result.statistics.skippedElements} elements (${((result.statistics.skippedElements / result.statistics.totalElements) * 100).toFixed(0)}%) were skipped. This may affect accuracy.`
    );
  }

  return result;
}

/**
 * Quick conversion for a subset of elements
 */
export function convertSelectedElements(
  model: BIMModel,
  elementIds: string[],
  options: Omit<IFCCalculatorOptions, 'selectedElementIds'> = {}
): IFCConversionResult {
  return convertBIMToAnalysisInput(model, {
    ...options,
    selectedElementIds: elementIds,
  });
}

/**
 * Get material summary for a model without full conversion
 */
export function getMaterialSummary(
  model: BIMModel
): Array<{ material: string; count: number; mapping: MaterialMapping }> {
  const materialCounts = new Map<string, { count: number; elementType: BIMElementType }>();

  for (const element of model.elements) {
    if (element.type === 'space' || element.type === 'zone') continue;

    const materialName = extractMaterialName(element);
    const key = materialName || `default_${element.type}`;

    const existing = materialCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      materialCounts.set(key, { count: 1, elementType: element.type });
    }
  }

  return Array.from(materialCounts.entries()).map(([material, data]) => ({
    material,
    count: data.count,
    mapping: mapIFCMaterial(material, { elementType: data.elementType }),
  }));
}

export default {
  convertBIMToAnalysisInput,
  convertSelectedElements,
  getMaterialSummary,
  extractElementQuantities,
};
