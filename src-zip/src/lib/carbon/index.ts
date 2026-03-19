/**
 * Carbon Analysis Library - Entry Point
 *
 * Comprehensive embodied carbon calculation for BIM elements
 * using ICE Database v3.0 and industry benchmarks.
 *
 * ★ Insight ─────────────────────────────────────
 * This module provides lifecycle carbon assessment following:
 * - EN 15978 Life Cycle Assessment standard
 * - RICS Whole Life Carbon Assessment methodology
 * - LETI Climate Emergency Design Guide targets
 * ─────────────────────────────────────────────────
 */

// Main analysis pipeline
export {
  CarbonAnalysisPipeline,
  createCarbonAnalysis,
  type CarbonAnalysisConfig,
  type CarbonAnalysisInput,
  type CarbonAnalysisResult,
  type ElementWithMaterial,
  type MaterialAssignment,
  type ElementCarbonResult,
  type CarbonByStage,
  type BenchmarkResult,
  type BenchmarkComparison,
  type AnalysisMetadata,
  type BuildingType,
} from './analysis-pipeline';

// ICE Database reference data
export {
  ICE_DATABASE,
  CARBON_BENCHMARKS,
} from './analysis-pipeline';

// Re-export utility types from database
export type {
  CarbonScope,
  CarbonDataSource,
  AnalysisStatus,
} from '@/types/database';

// Thai Material Database
export {
  THAI_MATERIALS,
  getMaterialsByCategory,
  getMaterialsBySource,
  getLowCarbonAlternative,
  searchMaterials,
  getMaterialStatistics,
  calculateMaterialCarbon,
  compareMaterials,
  type ThaiMaterial,
  type ThaiMaterialCategory,
  type EmissionSource,
  type DataQuality,
} from './thai-materials';

// IFC Material Mapper
export {
  mapIFCMaterial,
  mapIFCMaterials,
  getThaiMaterialsByCategory,
  searchThaiMaterials,
  type MaterialMapping,
  type MappingOptions,
} from './ifc-material-mapper';

// IFC to Calculator Integration
export {
  convertBIMToAnalysisInput,
  convertSelectedElements,
  getMaterialSummary,
  type IFCCalculatorOptions,
  type IFCConversionResult,
  type ConversionStatistics,
  type ElementQuantities,
} from './ifc-calculator-integration';

// =============================================================================
// TGO CFP & EDGE CERTIFICATION (Thai-specific)
// =============================================================================

// TGO CFP Types
export * from './types';

// TGO CFP Emission Factors Database
export {
  TGO_CFP_EMISSION_FACTORS,
  THAI_MATERIALS as TGO_MATERIALS,
  getEmissionFactor,
  getEmissionFactorsByCategory,
  getMaterial,
  getMaterialsByCategory as getTGOMaterialsByCategory,
  getLowCarbonAlternatives,
  calculateCarbonReduction,
  getThaiSpecificFactors,
  searchMaterials as searchTGOMaterials,
} from './emission-factors';

// TGO CFP Calculator & Edge Certification
export {
  calculateItemCarbon,
  calculateBOQCarbon,
  calculateEdgeCertification,
  calculateTransportEmissions,
  generateCarbonSummary,
  formatCarbon,
  compareWithBenchmarks,
  type BOQInput,
} from './calculator';

// =============================================================================
// KKP BOQ DATABASE INTEGRATION
// =============================================================================

export {
  BOQ_WORK_SECTIONS,
  KKP_MATERIAL_MAPPINGS,
  parseKKPBOQ,
  mapKKPItemToCarbon,
  importBOQFromArray,
  exportBOQWithCarbon,
  summarizeBOQBySection,
  analyzeBOQReadiness,
  type KKPBOQItem,
  type BOQWorkSection,
  type KKPMaterialMapping,
} from './kkp-boq-integration';

// =============================================================================
// STANDARDS KNOWLEDGE GRAPH
// =============================================================================

export {
  STANDARD_NODES,
  STANDARD_RELATIONSHIPS,
  createKnowledgeGraph,
  getComplianceRequirements,
  mapBOQToCertifications,
} from './knowledge-graph';

// =============================================================================
// BANK-READY GREEN LOAN DOCUMENTATION
// =============================================================================

export {
  BANK_REQUIREMENTS,
  generateGreenLoanDocument,
  generateFullReport,
  analyzeBankRequirements,
  type ThaiBank,
} from './bank-reports';

// =============================================================================
// T-VER REGISTRATION TEMPLATES
// =============================================================================

export {
  generateTVERPDD,
  exportPDDAsMarkdown,
  generatePreAuditChecklist,
  createTVERProject,
  type TVERProjectDesignDocument,
  type TVERMethodology,
  type TVERProjectCategory,
  type TVERStatus,
} from './tver-templates';

// =============================================================================
// TREES CERTIFICATION AUTOMATION
// =============================================================================

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
