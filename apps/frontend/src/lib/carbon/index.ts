/**
 * Carbon Library - Main Entry Point
 *
 * Thai Carbon Footprint Calculation Library
 * Aligned with TGO CFP, TREES, T-VER, and EDGE standards
 */

// Types
export type {
  EmissionFactorSource,
  EmissionScope,
  MaterialCategory,
  ThaiMaterialCategory,
  EmissionUnit,
  EmissionFactor,
  ThaiMaterial,
  MaterialAlternative,
  BOQCarbonItem,
  BOQCarbonAnalysis,
  EdgeCertificationLevel,
  EdgeCalculation,
  EdgeImprovement,
  TVERProject,
  TREESLevel,
  TREESCredits,
  TREESCertification,
  GreenLoanDocument,
  StandardNode,
  StandardRelationship,
  StandardsKnowledgeGraph,
  TransportEmission,
  CarbonScope,
  CarbonDataSource,
  AnalysisStatus,
  MaterialCarbonBreakdown,
  CarbonRecommendation,
  BIMElementType,
  BIMGeometry,
  BIMElement,
  BIMModelMetadata,
  BIMModel,
  ExtractedMaterial,
  MaterialLayer,
} from './types';

export { TGO_TRANSPORT_EMISSION_FACTORS } from './types';

// Emission factors database
export {
  TGO_CFP_EMISSION_FACTORS,
  THAI_MATERIALS,
  getEmissionFactor,
  getEmissionFactorsByCategory,
  getMaterial,
  getMaterialsByCategory,
  getLowCarbonAlternatives,
  getLowCarbonAlternative,
  calculateCarbonReduction,
  calculateMaterialCarbon,
  getThaiSpecificFactors,
  searchMaterials,
} from './emission-factors';

// Calculator functions
export {
  calculateItemCarbon,
  calculateBOQCarbon,
  calculateEdgeCertification,
  calculateTransportEmissions,
  generateCarbonSummary,
  formatCarbon,
  compareWithBenchmarks,
  calculateEmbodiedCarbon,
  identifyHotspots,
  calculateScopeBreakdown,
  type BOQInput,
  type EmbodiedCarbonInput,
  type HotspotInput,
  type CarbonHotspot,
  type ScopeBreakdown,
} from './calculator';

// TREES certification
export {
  TREES_LEVELS,
  TREES_CATEGORIES,
  TYPICAL_RECYCLED_CONTENT,
  THAI_MATERIAL_SOURCES,
  calculateMR4Credit,
  calculateMR5Credit,
  estimateMRCreditsFromBOQ,
  estimateEA1Credit,
  assessTREESCertification,
  generateTREESReport,
  analyzeGapToLevel,
  type RecycledMaterialData,
  type LocalMaterialData,
} from './trees-certification';

// T-VER templates
export {
  generateTVERPDD,
  exportPDDAsMarkdown,
  createTVERProject,
  generatePreAuditChecklist,
  type TVERProjectCategory,
  type TVERMethodology,
  type TVERStatus,
  type TVERProjectDesignDocument,
  type MonitoringParameter,
} from './tver-templates';

// BOQ Integration (KKP)
export {
  BOQ_WORK_SECTIONS,
  KKP_MATERIAL_MAPPINGS,
  parseKKPBOQ,
  mapKKPItemToCarbon,
  analyzeBOQReadiness,
  importBOQFromArray,
  exportBOQWithCarbon,
  summarizeBOQBySection,
  type BOQWorkSection,
  type KKPBOQItem,
  type KKPMaterialMapping,
} from './kkp-boq-integration';

// IFC Material Mapper
export {
  mapIFCMaterial,
  mapIFCMaterials,
  getThaiMaterialsByCategory,
  searchThaiMaterials as searchThaiMaterialsFromIFC,
  extractMaterialsFromIFC,
  type MaterialMapping,
  type MappingOptions,
  type MaterialExtractionResult,
} from './ifc-material-mapper';

// IFC Calculator Integration
export {
  convertBIMToAnalysisInput,
  convertSelectedElements,
  getMaterialSummary,
  type IFCCalculatorOptions,
  type IFCConversionResult,
  type ConversionStatistics,
  type ElementQuantities,
} from './ifc-calculator-integration';

// Knowledge Graph
export {
  STANDARD_NODES,
  STANDARD_RELATIONSHIPS,
  createKnowledgeGraph,
  getComplianceRequirements,
  mapBOQToCertifications,
} from './knowledge-graph';

// Analysis Pipeline
export {
  validateAnalysisInput,
  analyzeMaterialBreakdown,
  analyzeCategoryBreakdown,
  generateCarbonReport,
  type AnalysisPipelineConfig,
  type AnalysisPipelineResult,
  type CarbonAnalysisInput,
  type ElementWithMaterial,
  type MaterialAssignment,
  type ValidationResult,
  type MaterialBreakdownResult,
  type CategoryBreakdownResult,
} from './analysis-pipeline';

// Bank Reports
export {
  BANK_REQUIREMENTS,
  generateGreenLoanDocument,
  generateFullReport,
  analyzeBankRequirements,
  type ThaiBank,
} from './bank-reports';

// Thai Materials (extended)
export {
  THAI_CONSTRUCTION_MATERIALS,
  THAI_PRODUCERS,
  getThaiMaterialByCode,
  searchThaiMaterials,
  getMaterialProducers,
  getMaterialsByRegion,
  calculateCarbonSavings,
  type ThaiConstructionMaterial,
  type ThaiMaterialProducer,
  type LowCarbonAlternative,
  type ThaiRegion,
} from './thai-materials';
