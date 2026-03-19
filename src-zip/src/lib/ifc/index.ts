/**
 * IFC Loading and Parsing Module
 *
 * Provides utilities for loading IFC files using @thatopen/components and web-ifc.
 */

export {
  IFCLoader,
  getIFCLoader,
  loadIFCWithComponents,
  type IFCLoadResult,
  type IFCLoadProgress,
  type ProgressCallback,
  type FragmentsModel,
  type ThatOpenFragmentsModel,
  type ClassificationResult,
  type ElementRelationship,
} from './loader';

export {
  analyzeSpatialStructure,
  summarizeElements,
  analyzeEgress,
  calculateSustainability,
  getElementsByType,
  getElementsByLevel,
  findElementsByName,
  getLevelStatistics,
  generateModelSummary,
  type SpatialAnalysis,
  type ElementSummary,
  type EgressAnalysis,
  type SustainabilityMetrics,
} from './extraction';

// Deep IFC extraction pipeline with full property sets, materials, and classifications
export {
  IFCExtractionPipeline,
  type IFCSchemaVersion,
  type ExtractionResult,
  type ExtractionProgress,
  type ExtractionProgressCallback,
  type ExtractedElement,
  type ExtractedPropertySet,
  type ExtractedProperty,
  type ExtractedMaterial,
  type MaterialLayer,
  type MaterialConstituent,
  type ExtractedClassification,
  type SpatialRelationship,
  type ExtractedLevel,
} from './extraction-pipeline';

// Type aliases for backward compatibility with PropertiesPanel
// These map the Extracted* types to more generic names
export type { ExtractedPropertySet as PropertySet } from './extraction-pipeline';
export type { ExtractedMaterial as MaterialInfo } from './extraction-pipeline';
export type { ExtractedClassification as ClassificationReference } from './extraction-pipeline';
