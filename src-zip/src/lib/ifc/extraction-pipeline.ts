/**
 * IFC Property Extraction Pipeline
 *
 * Comprehensive IFC data extraction supporting:
 * - IFC2x3, IFC4, IFC4.3 schemas
 * - Full property sets (Pset_*, Qto_*, custom)
 * - Material associations (layers, constituents, profiles)
 * - Classification references (Uniclass, OmniClass, MasterFormat)
 * - Spatial relationships and hierarchy
 * - Performance-optimized with HashMap indexing
 *
 * @see Architecture: /claudedocs/bim-platform-architecture.md
 */

import * as WEBIFC from 'web-ifc';
import type { BIMElement, BIMElementType, BuildingLevel, BIMModel } from '@/types/bim';

// ============================================
// IFC Schema Constants
// ============================================

/** IFC Schema versions supported */
export type IFCSchemaVersion = 'IFC2X3' | 'IFC4' | 'IFC4X3';

/** IFC Relationship types for traversal */
const IFC_RELATIONSHIPS = {
  SPATIAL_CONTAINMENT: WEBIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE,
  AGGREGATES: WEBIFC.IFCRELAGGREGATES,
  DEFINES_BY_PROPERTIES: WEBIFC.IFCRELDEFINESBYPROPERTIES,
  ASSOCIATES_MATERIAL: WEBIFC.IFCRELASSOCIATESMATERIAL,
  DEFINES_BY_TYPE: WEBIFC.IFCRELDEFINESBYTYPE,
  ASSOCIATES_CLASSIFICATION: WEBIFC.IFCRELASSOCIATESCLASSIFICATION,
  VOIDS_ELEMENT: WEBIFC.IFCRELVOIDSELEMENT,
  FILLS_ELEMENT: WEBIFC.IFCRELFILLSELEMENT,
  CONNECTS_PATH_ELEMENTS: WEBIFC.IFCRELCONNECTSWITHREALIZINGELEMENTS,
} as const;

/** IFC Element types mapping */
const IFC_ELEMENT_TYPES: Record<number, BIMElementType> = {
  [WEBIFC.IFCWALL]: 'wall',
  [WEBIFC.IFCWALLSTANDARDCASE]: 'wall',
  [WEBIFC.IFCCURTAINWALL]: 'wall',
  [WEBIFC.IFCDOOR]: 'door',
  [WEBIFC.IFCWINDOW]: 'window',
  [WEBIFC.IFCSLAB]: 'slab',
  [WEBIFC.IFCROOF]: 'roof',
  [WEBIFC.IFCSTAIR]: 'stair',
  [WEBIFC.IFCSTAIRFLIGHT]: 'stair',
  [WEBIFC.IFCRAMP]: 'stair',
  [WEBIFC.IFCRAMPFLIGHT]: 'stair',
  [WEBIFC.IFCCOLUMN]: 'column',
  [WEBIFC.IFCBEAM]: 'beam',
  [WEBIFC.IFCMEMBER]: 'beam',
  [WEBIFC.IFCPLATE]: 'other',
  [WEBIFC.IFCFOOTING]: 'other',
  [WEBIFC.IFCPILE]: 'other',
  [WEBIFC.IFCFURNISHINGELEMENT]: 'furniture',
  [WEBIFC.IFCFLOWSEGMENT]: 'pipe',
  [WEBIFC.IFCFLOWFITTING]: 'pipe',
  [WEBIFC.IFCPIPESEGMENT]: 'pipe',
  [WEBIFC.IFCPIPEFITTING]: 'pipe',
  [WEBIFC.IFCDUCTSEGMENT]: 'duct',
  [WEBIFC.IFCDUCTFITTING]: 'duct',
  [WEBIFC.IFCFLOWTERMINAL]: 'hvac',
  [WEBIFC.IFCSPACE]: 'space',
  [WEBIFC.IFCZONE]: 'zone',
  [WEBIFC.IFCCOVERING]: 'other',
  [WEBIFC.IFCRAILING]: 'other',
  [WEBIFC.IFCBUILDINGELEMENTPROXY]: 'equipment',
};

// ============================================
// Property Set Definitions
// ============================================

/** Standard Pset properties for carbon calculation */
export const CARBON_RELEVANT_PSETS = [
  'Pset_WallCommon',
  'Pset_SlabCommon',
  'Pset_BeamCommon',
  'Pset_ColumnCommon',
  'Pset_DoorCommon',
  'Pset_WindowCommon',
  'Pset_RoofCommon',
  'Qto_WallBaseQuantities',
  'Qto_SlabBaseQuantities',
  'Qto_BeamBaseQuantities',
  'Qto_ColumnBaseQuantities',
  'Qto_DoorBaseQuantities',
  'Qto_WindowBaseQuantities',
  'Qto_RoofBaseQuantities',
] as const;

/** Standard quantity properties */
export const QUANTITY_PROPERTIES = [
  'Length', 'Width', 'Height', 'Depth', 'Thickness',
  'Perimeter', 'Area', 'GrossArea', 'NetArea',
  'GrossFootprintArea', 'NetFootprintArea',
  'GrossSideArea', 'NetSideArea',
  'GrossVolume', 'NetVolume',
  'GrossWeight', 'NetWeight',
  'CrossSectionArea', 'OuterSurfaceArea',
] as const;

// ============================================
// Extracted Data Types
// ============================================

export interface ExtractedPropertySet {
  id: number;
  name: string;
  type: 'pset' | 'qto' | 'custom';
  properties: ExtractedProperty[];
}

export interface ExtractedProperty {
  name: string;
  value: string | number | boolean | null;
  type: string;
  unit?: string;
}

export interface ExtractedMaterial {
  id: number;
  name: string;
  category: string;
  layers?: MaterialLayer[];
  constituents?: MaterialConstituent[];
  totalThickness?: number;
  density?: number;
}

export interface MaterialLayer {
  name: string;
  thickness: number;
  isVentilated: boolean;
  priority?: number;
}

export interface MaterialConstituent {
  name: string;
  fraction: number;
  category?: string;
}

export interface ExtractedClassification {
  system: string;
  code: string;
  title: string;
  location?: string;
}

export interface SpatialRelationship {
  containedIn?: number;
  aggregatedBy?: number;
  voids?: number[];
  fills?: number;
  connectedTo?: number[];
}

export interface ExtractedElement {
  expressId: number;
  globalId: string;
  ifcType: string;
  elementType: BIMElementType;
  name: string;
  description?: string;
  objectType?: string;
  tag?: string;
  levelId?: number;
  propertySets: ExtractedPropertySet[];
  materials: ExtractedMaterial[];
  classifications: ExtractedClassification[];
  relationships: SpatialRelationship;
  quantities: Record<string, number>;
}

export interface ExtractedLevel {
  expressId: number;
  globalId: string;
  name: string;
  elevation: number;
  height?: number;
  elementCount: number;
}

export interface ExtractionResult {
  schema: IFCSchemaVersion;
  projectName: string;
  siteName?: string;
  buildingName?: string;
  elements: ExtractedElement[];
  levels: ExtractedLevel[];
  elementIndex: Map<number, ExtractedElement>;
  elementsByType: Map<BIMElementType, Set<number>>;
  elementsByLevel: Map<number, Set<number>>;
  totalQuantities: {
    wallArea: number;
    floorArea: number;
    volume: number;
    openingArea: number;
  };
  materialSummary: Map<string, { volume: number; mass: number }>;
}

export interface ExtractionProgress {
  stage: 'init' | 'schema' | 'spatial' | 'elements' | 'properties' | 'materials' | 'relationships' | 'complete';
  percent: number;
  message: string;
  elementsCurrent?: number;
  elementsTotal?: number;
}

export type ExtractionProgressCallback = (progress: ExtractionProgress) => void;

// ============================================
// IFC Extraction Pipeline
// ============================================

export class IFCExtractionPipeline {
  private api: WEBIFC.IfcAPI;
  private modelId: number = -1;
  private schema: IFCSchemaVersion = 'IFC4';
  private initialized = false;

  constructor() {
    this.api = new WEBIFC.IfcAPI();
  }

  /**
   * Initialize the web-ifc WASM module
   */
  async initialize(wasmPath = '/wasm/'): Promise<void> {
    if (this.initialized) return;

    this.api.SetWasmPath(wasmPath);
    await this.api.Init();
    this.initialized = true;
  }

  /**
   * Extract all data from an IFC file
   */
  async extract(
    data: Uint8Array,
    onProgress?: ExtractionProgressCallback
  ): Promise<ExtractionResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    onProgress?.({ stage: 'init', percent: 0, message: 'Opening IFC model...' });

    // Open model
    this.modelId = this.api.OpenModel(data);

    // Detect schema
    onProgress?.({ stage: 'schema', percent: 5, message: 'Detecting IFC schema...' });
    this.schema = this.detectSchema();

    // Extract spatial structure
    onProgress?.({ stage: 'spatial', percent: 10, message: 'Extracting spatial structure...' });
    const { projectName, siteName, buildingName, levels } = await this.extractSpatialStructure();

    // Get all element IDs to extract
    const elementIds = this.getAllElementIds();
    const totalElements = elementIds.length;

    onProgress?.({
      stage: 'elements',
      percent: 15,
      message: `Extracting ${totalElements} elements...`,
      elementsTotal: totalElements,
    });

    // Extract elements with properties
    const elements: ExtractedElement[] = [];
    const elementIndex = new Map<number, ExtractedElement>();
    const elementsByType = new Map<BIMElementType, Set<number>>();
    const elementsByLevel = new Map<number, Set<number>>();

    // Initialize type sets
    Object.values(IFC_ELEMENT_TYPES).forEach((type) => {
      if (!elementsByType.has(type)) {
        elementsByType.set(type, new Set());
      }
    });

    // Process elements in batches for performance
    const BATCH_SIZE = 100;
    for (let i = 0; i < elementIds.length; i += BATCH_SIZE) {
      const batch = elementIds.slice(i, i + BATCH_SIZE);

      for (const expressId of batch) {
        try {
          const element = await this.extractElement(expressId);
          if (element) {
            elements.push(element);
            elementIndex.set(expressId, element);

            // Index by type
            const typeSet = elementsByType.get(element.elementType);
            if (typeSet) {
              typeSet.add(expressId);
            }

            // Index by level
            if (element.levelId) {
              if (!elementsByLevel.has(element.levelId)) {
                elementsByLevel.set(element.levelId, new Set());
              }
              elementsByLevel.get(element.levelId)!.add(expressId);
            }
          }
        } catch (error) {
          console.warn(`Failed to extract element ${expressId}:`, error);
        }
      }

      // Progress update
      const percent = 15 + Math.floor((i / totalElements) * 70);
      onProgress?.({
        stage: 'elements',
        percent,
        message: `Extracted ${Math.min(i + BATCH_SIZE, totalElements)} of ${totalElements} elements`,
        elementsCurrent: Math.min(i + BATCH_SIZE, totalElements),
        elementsTotal: totalElements,
      });
    }

    // Update level element counts
    for (const level of levels) {
      const levelElements = elementsByLevel.get(level.expressId);
      level.elementCount = levelElements?.size ?? 0;
    }

    // Calculate totals
    onProgress?.({ stage: 'complete', percent: 95, message: 'Calculating summaries...' });
    const totalQuantities = this.calculateTotalQuantities(elements);
    const materialSummary = this.calculateMaterialSummary(elements);

    onProgress?.({ stage: 'complete', percent: 100, message: 'Extraction complete' });

    return {
      schema: this.schema,
      projectName,
      siteName,
      buildingName,
      elements,
      levels,
      elementIndex,
      elementsByType,
      elementsByLevel,
      totalQuantities,
      materialSummary,
    };
  }

  /**
   * Detect IFC schema version
   */
  private detectSchema(): IFCSchemaVersion {
    try {
      const header = this.api.GetHeaderLine(this.modelId, WEBIFC.FILE_SCHEMA);
      if (header?.arguments?.[0]?.[0]?.value) {
        const schemaStr = header.arguments[0][0].value as string;
        if (schemaStr.includes('IFC4X3')) return 'IFC4X3';
        if (schemaStr.includes('IFC4')) return 'IFC4';
        if (schemaStr.includes('IFC2X3')) return 'IFC2X3';
      }
    } catch {
      // Default to IFC4
    }
    return 'IFC4';
  }

  /**
   * Extract spatial structure (Project → Site → Building → Storeys)
   */
  private async extractSpatialStructure(): Promise<{
    projectName: string;
    siteName?: string;
    buildingName?: string;
    levels: ExtractedLevel[];
  }> {
    let projectName = 'Unknown Project';
    let siteName: string | undefined;
    let buildingName: string | undefined;
    const levels: ExtractedLevel[] = [];

    // Extract Project
    const projectIds = this.api.GetLineIDsWithType(this.modelId, WEBIFC.IFCPROJECT);
    if (projectIds.size() > 0) {
      const project = this.api.GetLine(this.modelId, projectIds.get(0));
      projectName = project?.Name?.value || projectName;
    }

    // Extract Site
    const siteIds = this.api.GetLineIDsWithType(this.modelId, WEBIFC.IFCSITE);
    if (siteIds.size() > 0) {
      const site = this.api.GetLine(this.modelId, siteIds.get(0));
      siteName = site?.Name?.value;
    }

    // Extract Building
    const buildingIds = this.api.GetLineIDsWithType(this.modelId, WEBIFC.IFCBUILDING);
    if (buildingIds.size() > 0) {
      const building = this.api.GetLine(this.modelId, buildingIds.get(0));
      buildingName = building?.Name?.value;
    }

    // Extract Building Storeys
    const storeyIds = this.api.GetLineIDsWithType(this.modelId, WEBIFC.IFCBUILDINGSTOREY);
    for (let i = 0; i < storeyIds.size(); i++) {
      const expressId = storeyIds.get(i);
      const storey = this.api.GetLine(this.modelId, expressId);

      if (storey) {
        levels.push({
          expressId,
          globalId: storey.GlobalId?.value || `storey-${expressId}`,
          name: storey.Name?.value || `Level ${i + 1}`,
          elevation: storey.Elevation?.value || 0,
          height: undefined, // Calculated from geometry
          elementCount: 0,
        });
      }
    }

    // Sort by elevation
    levels.sort((a, b) => a.elevation - b.elevation);

    return { projectName, siteName, buildingName, levels };
  }

  /**
   * Get all element IDs to extract
   */
  private getAllElementIds(): number[] {
    const ids: number[] = [];
    const processedTypes = new Set<number>();

    for (const ifcType of Object.keys(IFC_ELEMENT_TYPES).map(Number)) {
      if (processedTypes.has(ifcType)) continue;
      processedTypes.add(ifcType);

      try {
        const typeIds = this.api.GetLineIDsWithType(this.modelId, ifcType);
        for (let i = 0; i < typeIds.size(); i++) {
          ids.push(typeIds.get(i));
        }
      } catch {
        // Type not present in this schema
      }
    }

    return ids;
  }

  /**
   * Extract a single element with all its data
   */
  private async extractElement(expressId: number): Promise<ExtractedElement | null> {
    try {
      const entity = this.api.GetLine(this.modelId, expressId, true);
      if (!entity) return null;

      const ifcType = this.api.GetLineType(this.modelId, expressId);
      const elementType = IFC_ELEMENT_TYPES[ifcType] || 'other';

      // Extract property sets
      const propertySets = await this.extractPropertySets(expressId);

      // Extract materials
      const materials = await this.extractMaterials(expressId);

      // Extract classifications
      const classifications = await this.extractClassifications(expressId);

      // Extract relationships
      const relationships = await this.extractRelationships(expressId);

      // Calculate quantities from property sets
      const quantities = this.extractQuantitiesFromPsets(propertySets);

      // Get level from spatial containment
      const levelId = await this.findContainingLevel(expressId);

      return {
        expressId,
        globalId: entity.GlobalId?.value || `exp-${expressId}`,
        ifcType: this.getIfcTypeName(ifcType),
        elementType,
        name: entity.Name?.value || `${this.getIfcTypeName(ifcType)} ${expressId}`,
        description: entity.Description?.value,
        objectType: entity.ObjectType?.value,
        tag: entity.Tag?.value,
        levelId,
        propertySets,
        materials,
        classifications,
        relationships,
        quantities,
      };
    } catch (error) {
      console.warn(`Error extracting element ${expressId}:`, error);
      return null;
    }
  }

  /**
   * Extract property sets for an element
   */
  private async extractPropertySets(expressId: number): Promise<ExtractedPropertySet[]> {
    const psets: ExtractedPropertySet[] = [];

    try {
      // Find IfcRelDefinesByProperties relationships
      const relIds = this.api.GetLineIDsWithType(this.modelId, IFC_RELATIONSHIPS.DEFINES_BY_PROPERTIES);

      for (let i = 0; i < relIds.size(); i++) {
        const rel = this.api.GetLine(this.modelId, relIds.get(i));
        if (!rel?.RelatedObjects) continue;

        // Check if this relationship applies to our element
        const relatedIds = this.getExpressIds(rel.RelatedObjects);
        if (!relatedIds.includes(expressId)) continue;

        // Get the property set definition
        const psetDef = rel.RelatingPropertyDefinition;
        if (!psetDef?.value) continue;

        const psetEntity = this.api.GetLine(this.modelId, psetDef.value);
        if (!psetEntity) continue;

        const psetName = psetEntity.Name?.value || 'Unknown';
        const psetType = this.classifyPsetType(psetName);

        // Extract properties
        const properties: ExtractedProperty[] = [];

        if (psetEntity.HasProperties) {
          // IfcPropertySet
          for (const propRef of psetEntity.HasProperties) {
            const prop = this.api.GetLine(this.modelId, propRef.value);
            if (prop) {
              properties.push(this.extractProperty(prop));
            }
          }
        } else if (psetEntity.Quantities) {
          // IfcElementQuantity
          for (const qtoRef of psetEntity.Quantities) {
            const qto = this.api.GetLine(this.modelId, qtoRef.value);
            if (qto) {
              properties.push(this.extractQuantity(qto));
            }
          }
        }

        psets.push({
          id: psetDef.value,
          name: psetName,
          type: psetType,
          properties,
        });
      }
    } catch (error) {
      console.warn(`Error extracting property sets for ${expressId}:`, error);
    }

    return psets;
  }

  /**
   * Classify property set type
   */
  private classifyPsetType(name: string): 'pset' | 'qto' | 'custom' {
    if (name.startsWith('Pset_')) return 'pset';
    if (name.startsWith('Qto_')) return 'qto';
    return 'custom';
  }

  /**
   * Extract a single property value
   */
  private extractProperty(prop: Record<string, unknown>): ExtractedProperty {
    const name = (prop.Name as { value?: string })?.value || 'Unknown';
    let value: string | number | boolean | null = null;
    let type = 'unknown';
    let unit: string | undefined;

    // IfcPropertySingleValue
    if (prop.NominalValue) {
      const nomVal = prop.NominalValue as { value?: unknown; type?: number };
      value = nomVal.value as string | number | boolean | null;
      type = this.getValueType(nomVal.type);
    }

    // IfcPropertyEnumeratedValue
    if (prop.EnumerationValues) {
      const enumVals = prop.EnumerationValues as Array<{ value?: unknown }>;
      value = enumVals.map((v) => v.value).join(', ');
      type = 'enumeration';
    }

    // IfcPropertyBoundedValue
    if (prop.UpperBoundValue || prop.LowerBoundValue) {
      const upper = (prop.UpperBoundValue as { value?: number })?.value;
      const lower = (prop.LowerBoundValue as { value?: number })?.value;
      value = `${lower ?? '?'} - ${upper ?? '?'}`;
      type = 'bounded';
    }

    // Unit
    if (prop.Unit) {
      unit = this.extractUnit(prop.Unit);
    }

    return { name, value, type, unit };
  }

  /**
   * Extract a quantity value
   */
  private extractQuantity(qto: Record<string, unknown>): ExtractedProperty {
    const name = (qto.Name as { value?: string })?.value || 'Unknown';
    let value: number | null = null;
    let type = 'quantity';
    let unit: string | undefined;

    // Different quantity types
    if (qto.LengthValue) {
      value = (qto.LengthValue as { value?: number })?.value ?? null;
      unit = 'm';
      type = 'length';
    } else if (qto.AreaValue) {
      value = (qto.AreaValue as { value?: number })?.value ?? null;
      unit = 'm²';
      type = 'area';
    } else if (qto.VolumeValue) {
      value = (qto.VolumeValue as { value?: number })?.value ?? null;
      unit = 'm³';
      type = 'volume';
    } else if (qto.WeightValue) {
      value = (qto.WeightValue as { value?: number })?.value ?? null;
      unit = 'kg';
      type = 'weight';
    } else if (qto.CountValue) {
      value = (qto.CountValue as { value?: number })?.value ?? null;
      type = 'count';
    }

    return { name, value, type, unit };
  }

  /**
   * Extract materials for an element
   */
  private async extractMaterials(expressId: number): Promise<ExtractedMaterial[]> {
    const materials: ExtractedMaterial[] = [];

    try {
      // Find IfcRelAssociatesMaterial relationships
      const relIds = this.api.GetLineIDsWithType(this.modelId, IFC_RELATIONSHIPS.ASSOCIATES_MATERIAL);

      for (let i = 0; i < relIds.size(); i++) {
        const rel = this.api.GetLine(this.modelId, relIds.get(i));
        if (!rel?.RelatedObjects) continue;

        const relatedIds = this.getExpressIds(rel.RelatedObjects);
        if (!relatedIds.includes(expressId)) continue;

        const matSelect = rel.RelatingMaterial;
        if (!matSelect?.value) continue;

        const matEntity = this.api.GetLine(this.modelId, matSelect.value);
        if (!matEntity) continue;

        // Determine material type and extract accordingly
        const material = this.extractMaterialEntity(matEntity);
        if (material) {
          materials.push(material);
        }
      }
    } catch (error) {
      console.warn(`Error extracting materials for ${expressId}:`, error);
    }

    return materials;
  }

  /**
   * Extract material from entity (handles different material types)
   */
  private extractMaterialEntity(entity: Record<string, unknown>): ExtractedMaterial | null {
    const expressId = (entity.expressID as number) || 0;

    // IfcMaterial (simple)
    if (entity.Name && !entity.MaterialLayers && !entity.MaterialConstituents) {
      return {
        id: expressId,
        name: (entity.Name as { value?: string })?.value || 'Unknown',
        category: (entity.Category as { value?: string })?.value || 'General',
      };
    }

    // IfcMaterialLayerSetUsage or IfcMaterialLayerSet
    if (entity.ForLayerSet || entity.MaterialLayers) {
      const layerSet = entity.ForLayerSet
        ? this.api.GetLine(this.modelId, (entity.ForLayerSet as { value: number }).value)
        : entity;

      if (layerSet?.MaterialLayers) {
        const layers: MaterialLayer[] = [];
        let totalThickness = 0;

        for (const layerRef of layerSet.MaterialLayers as Array<{ value: number }>) {
          const layer = this.api.GetLine(this.modelId, layerRef.value);
          if (layer) {
            const thickness = (layer.LayerThickness as { value?: number })?.value || 0;
            const material = layer.Material
              ? this.api.GetLine(this.modelId, (layer.Material as { value: number }).value)
              : null;

            layers.push({
              name: material?.Name?.value || 'Unknown',
              thickness: thickness * 1000, // Convert to mm
              isVentilated: (layer.IsVentilated as { value?: boolean })?.value || false,
              priority: (layer.Priority as { value?: number })?.value,
            });
            totalThickness += thickness;
          }
        }

        return {
          id: expressId,
          name: (layerSet.LayerSetName as { value?: string })?.value || 'Layer Set',
          category: 'Layered',
          layers,
          totalThickness: totalThickness * 1000, // mm
        };
      }
    }

    // IfcMaterialConstituentSet
    if (entity.MaterialConstituents) {
      const constituents: MaterialConstituent[] = [];

      for (const constRef of entity.MaterialConstituents as Array<{ value: number }>) {
        const constituent = this.api.GetLine(this.modelId, constRef.value);
        if (constituent) {
          const material = constituent.Material
            ? this.api.GetLine(this.modelId, (constituent.Material as { value: number }).value)
            : null;

          constituents.push({
            name: material?.Name?.value || (constituent.Name as { value?: string })?.value || 'Unknown',
            fraction: (constituent.Fraction as { value?: number })?.value || 0,
            category: (constituent.Category as { value?: string })?.value,
          });
        }
      }

      return {
        id: expressId,
        name: (entity.Name as { value?: string })?.value || 'Constituent Set',
        category: 'Composite',
        constituents,
      };
    }

    return null;
  }

  /**
   * Extract classification references
   */
  private async extractClassifications(expressId: number): Promise<ExtractedClassification[]> {
    const classifications: ExtractedClassification[] = [];

    try {
      const relIds = this.api.GetLineIDsWithType(this.modelId, IFC_RELATIONSHIPS.ASSOCIATES_CLASSIFICATION);

      for (let i = 0; i < relIds.size(); i++) {
        const rel = this.api.GetLine(this.modelId, relIds.get(i));
        if (!rel?.RelatedObjects) continue;

        const relatedIds = this.getExpressIds(rel.RelatedObjects);
        if (!relatedIds.includes(expressId)) continue;

        const classRef = rel.RelatingClassification;
        if (!classRef?.value) continue;

        const classEntity = this.api.GetLine(this.modelId, classRef.value);
        if (classEntity) {
          // Get the classification system
          let system = 'Unknown';
          if (classEntity.ReferencedSource) {
            const source = this.api.GetLine(this.modelId, (classEntity.ReferencedSource as { value: number }).value);
            system = source?.Name?.value || system;
          }

          classifications.push({
            system,
            code: (classEntity.Identification as { value?: string })?.value ||
                  (classEntity.ItemReference as { value?: string })?.value || '',
            title: (classEntity.Name as { value?: string })?.value || '',
            location: (classEntity.Location as { value?: string })?.value,
          });
        }
      }
    } catch (error) {
      console.warn(`Error extracting classifications for ${expressId}:`, error);
    }

    return classifications;
  }

  /**
   * Extract spatial relationships
   */
  private async extractRelationships(expressId: number): Promise<SpatialRelationship> {
    const relationships: SpatialRelationship = {};

    try {
      // Spatial containment
      const containmentIds = this.api.GetLineIDsWithType(this.modelId, IFC_RELATIONSHIPS.SPATIAL_CONTAINMENT);
      for (let i = 0; i < containmentIds.size(); i++) {
        const rel = this.api.GetLine(this.modelId, containmentIds.get(i));
        if (!rel?.RelatedElements) continue;

        const relatedIds = this.getExpressIds(rel.RelatedElements);
        if (relatedIds.includes(expressId) && rel.RelatingStructure?.value) {
          relationships.containedIn = rel.RelatingStructure.value;
          break;
        }
      }

      // Aggregation
      const aggregateIds = this.api.GetLineIDsWithType(this.modelId, IFC_RELATIONSHIPS.AGGREGATES);
      for (let i = 0; i < aggregateIds.size(); i++) {
        const rel = this.api.GetLine(this.modelId, aggregateIds.get(i));
        if (!rel?.RelatedObjects) continue;

        const relatedIds = this.getExpressIds(rel.RelatedObjects);
        if (relatedIds.includes(expressId) && rel.RelatingObject?.value) {
          relationships.aggregatedBy = rel.RelatingObject.value;
          break;
        }
      }

      // Voids (openings)
      const voidIds = this.api.GetLineIDsWithType(this.modelId, IFC_RELATIONSHIPS.VOIDS_ELEMENT);
      const voids: number[] = [];
      for (let i = 0; i < voidIds.size(); i++) {
        const rel = this.api.GetLine(this.modelId, voidIds.get(i));
        if (rel?.RelatingBuildingElement?.value === expressId && rel.RelatedOpeningElement?.value) {
          voids.push(rel.RelatedOpeningElement.value);
        }
      }
      if (voids.length > 0) {
        relationships.voids = voids;
      }

      // Fills (element filling an opening)
      const fillIds = this.api.GetLineIDsWithType(this.modelId, IFC_RELATIONSHIPS.FILLS_ELEMENT);
      for (let i = 0; i < fillIds.size(); i++) {
        const rel = this.api.GetLine(this.modelId, fillIds.get(i));
        if (rel?.RelatedBuildingElement?.value === expressId && rel.RelatingOpeningElement?.value) {
          relationships.fills = rel.RelatingOpeningElement.value;
          break;
        }
      }
    } catch (error) {
      console.warn(`Error extracting relationships for ${expressId}:`, error);
    }

    return relationships;
  }

  /**
   * Find the containing level for an element
   */
  private async findContainingLevel(expressId: number): Promise<number | undefined> {
    try {
      const containmentIds = this.api.GetLineIDsWithType(this.modelId, IFC_RELATIONSHIPS.SPATIAL_CONTAINMENT);

      for (let i = 0; i < containmentIds.size(); i++) {
        const rel = this.api.GetLine(this.modelId, containmentIds.get(i));
        if (!rel?.RelatedElements) continue;

        const relatedIds = this.getExpressIds(rel.RelatedElements);
        if (relatedIds.includes(expressId) && rel.RelatingStructure?.value) {
          const structure = this.api.GetLine(this.modelId, rel.RelatingStructure.value);
          const structureType = this.api.GetLineType(this.modelId, rel.RelatingStructure.value);

          // Check if it's a storey
          if (structureType === WEBIFC.IFCBUILDINGSTOREY) {
            return rel.RelatingStructure.value;
          }

          // If it's a space, find the space's containing storey
          if (structureType === WEBIFC.IFCSPACE && structure) {
            // Recurse to find storey
            return this.findContainingLevel(rel.RelatingStructure.value);
          }
        }
      }
    } catch (error) {
      console.warn(`Error finding level for ${expressId}:`, error);
    }

    return undefined;
  }

  /**
   * Extract quantities from property sets
   */
  private extractQuantitiesFromPsets(psets: ExtractedPropertySet[]): Record<string, number> {
    const quantities: Record<string, number> = {};

    for (const pset of psets) {
      if (pset.type !== 'qto') continue;

      for (const prop of pset.properties) {
        if (typeof prop.value === 'number' && QUANTITY_PROPERTIES.includes(prop.name as any)) {
          quantities[prop.name] = prop.value;
        }
      }
    }

    return quantities;
  }

  /**
   * Calculate total quantities from all elements
   */
  private calculateTotalQuantities(elements: ExtractedElement[]): {
    wallArea: number;
    floorArea: number;
    volume: number;
    openingArea: number;
  } {
    let wallArea = 0;
    let floorArea = 0;
    let volume = 0;
    let openingArea = 0;

    for (const element of elements) {
      switch (element.elementType) {
        case 'wall':
          wallArea += element.quantities['GrossSideArea'] || element.quantities['NetSideArea'] || 0;
          volume += element.quantities['GrossVolume'] || element.quantities['NetVolume'] || 0;
          break;
        case 'slab':
          floorArea += element.quantities['GrossArea'] || element.quantities['NetArea'] || 0;
          volume += element.quantities['GrossVolume'] || element.quantities['NetVolume'] || 0;
          break;
        case 'door':
        case 'window':
          openingArea += element.quantities['GrossArea'] || element.quantities['Area'] || 0;
          break;
        default:
          volume += element.quantities['GrossVolume'] || element.quantities['NetVolume'] || 0;
      }
    }

    return { wallArea, floorArea, volume, openingArea };
  }

  /**
   * Calculate material summary
   */
  private calculateMaterialSummary(elements: ExtractedElement[]): Map<string, { volume: number; mass: number }> {
    const summary = new Map<string, { volume: number; mass: number }>();

    for (const element of elements) {
      const elementVolume = element.quantities['GrossVolume'] || element.quantities['NetVolume'] || 0;

      for (const material of element.materials) {
        const name = material.name;
        const current = summary.get(name) || { volume: 0, mass: 0 };

        if (material.layers) {
          // For layered materials, distribute volume by layer thickness
          const totalThickness = material.totalThickness || 1;
          for (const layer of material.layers) {
            const layerFraction = layer.thickness / totalThickness;
            const layerVolume = elementVolume * layerFraction;
            const layerEntry = summary.get(layer.name) || { volume: 0, mass: 0 };
            layerEntry.volume += layerVolume;
            summary.set(layer.name, layerEntry);
          }
        } else if (material.constituents) {
          // For constituent sets, distribute by fraction
          for (const constituent of material.constituents) {
            const constVolume = elementVolume * constituent.fraction;
            const constEntry = summary.get(constituent.name) || { volume: 0, mass: 0 };
            constEntry.volume += constVolume;
            summary.set(constituent.name, constEntry);
          }
        } else {
          // Simple material
          current.volume += elementVolume;
          summary.set(name, current);
        }
      }
    }

    return summary;
  }

  // ============================================
  // Helper Methods
  // ============================================

  private getExpressIds(refs: Array<{ value: number }> | { value: number }): number[] {
    if (Array.isArray(refs)) {
      return refs.map((r) => r.value);
    }
    return [refs.value];
  }

  private getIfcTypeName(typeId: number): string {
    // This is a simplified version - in production, use a proper mapping
    const typeNames: Record<number, string> = {
      [WEBIFC.IFCWALL]: 'IfcWall',
      [WEBIFC.IFCWALLSTANDARDCASE]: 'IfcWallStandardCase',
      [WEBIFC.IFCDOOR]: 'IfcDoor',
      [WEBIFC.IFCWINDOW]: 'IfcWindow',
      [WEBIFC.IFCSLAB]: 'IfcSlab',
      [WEBIFC.IFCROOF]: 'IfcRoof',
      [WEBIFC.IFCCOLUMN]: 'IfcColumn',
      [WEBIFC.IFCBEAM]: 'IfcBeam',
      [WEBIFC.IFCSTAIR]: 'IfcStair',
      [WEBIFC.IFCSPACE]: 'IfcSpace',
    };
    return typeNames[typeId] || `IfcType_${typeId}`;
  }

  private getValueType(typeId: number | undefined): string {
    if (!typeId) return 'unknown';
    // Map IFC value types
    const valueTypes: Record<number, string> = {
      [WEBIFC.IFCTEXT]: 'text',
      [WEBIFC.IFCLABEL]: 'label',
      [WEBIFC.IFCIDENTIFIER]: 'identifier',
      [WEBIFC.IFCINTEGER]: 'integer',
      [WEBIFC.IFCREAL]: 'real',
      [WEBIFC.IFCBOOLEAN]: 'boolean',
      [WEBIFC.IFCLOGICAL]: 'logical',
    };
    return valueTypes[typeId] || 'unknown';
  }

  private extractUnit(unit: unknown): string | undefined {
    // Simplified unit extraction
    if (typeof unit === 'object' && unit !== null) {
      const unitObj = unit as { value?: number };
      if (unitObj.value) {
        const unitEntity = this.api.GetLine(this.modelId, unitObj.value);
        return unitEntity?.Name?.value;
      }
    }
    return undefined;
  }

  /**
   * Convert extraction result to BIMModel format
   */
  toBIMModel(result: ExtractionResult, fileName: string): BIMModel {
    const elements: BIMElement[] = result.elements.map((el) => {
      // Flatten property sets into properties record
      const properties: Record<string, string | number | boolean> = {};

      for (const pset of el.propertySets) {
        for (const prop of pset.properties) {
          if (prop.value !== null) {
            const key = `${pset.name}.${prop.name}`;
            properties[key] = prop.value;
          }
        }
      }

      // Add quantities
      for (const [key, value] of Object.entries(el.quantities)) {
        properties[`Quantities.${key}`] = value;
      }

      // Add material names
      if (el.materials.length > 0) {
        properties['Materials'] = el.materials.map((m) => m.name).join(', ');
      }

      // Add classifications
      for (const cls of el.classifications) {
        properties[`Classification.${cls.system}`] = `${cls.code}: ${cls.title}`;
      }

      return {
        id: `${el.expressId}`,
        globalId: el.globalId,
        type: el.elementType,
        name: el.name,
        level: el.levelId ? `${el.levelId}` : undefined,
        material: el.materials[0]?.name,
        properties,
      };
    });

    const levels: BuildingLevel[] = result.levels.map((level) => ({
      id: `${level.expressId}`,
      name: level.name,
      elevation: level.elevation,
      height: level.height || 3.0,
    }));

    return {
      id: `ifc-${Date.now()}`,
      name: result.projectName || fileName.replace(/\.ifc$/i, ''),
      description: `Imported from ${fileName}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'ifc',
      elements,
      levels,
      metadata: {
        elementCount: elements.length,
        levelCount: levels.length,
        boundingBox: {
          min: { x: -50, y: 0, z: -50 },
          max: { x: 50, y: 30, z: 50 },
        },
        units: 'metric',
      },
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.modelId >= 0) {
      try {
        this.api.CloseModel(this.modelId);
      } catch {
        // Ignore
      }
      this.modelId = -1;
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let pipelineInstance: IFCExtractionPipeline | null = null;

export function getExtractionPipeline(): IFCExtractionPipeline {
  if (!pipelineInstance) {
    pipelineInstance = new IFCExtractionPipeline();
  }
  return pipelineInstance;
}
