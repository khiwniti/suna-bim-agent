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
  calculateCarbonReduction,
  getThaiSpecificFactors,
  searchMaterials,
} from './emission-factors';

// Calculator functions
export {
  calculateEmbodiedCarbon,
  calculateCarbonPerArea,
  calculateScopeBreakdown,
  calculateTransportEmissions,
  calculateProjectTotal,
  calculateEdgeScore,
  identifyHotspots,
  generateRecommendations,
  compareWithBaseline,
  type CarbonCalculationInput,
  type CarbonCalculationResult,
  type TransportCalculationInput,
} from './calculator';

// TREES certification
export {
  TREES_CREDIT_REQUIREMENTS,
  calculateTREESCredits,
  assessTREESLevel,
  generateTREESReport,
  type TREESAssessment,
} from './trees-certification';

// T-VER templates
export {
  TVER_TEMPLATES,
  generateTVERProject,
  calculateTVERCredits,
  getTVERTemplate,
  type TVERTemplate,
  type TVERProjectData,
} from './tver-templates';

// BOQ Integration
export {
  mapBOQToCarbon,
  analyzeBOQCarbon,
  getKKPMapping,
  generateCarbonBOQReport,
  type BOQMappingResult,
  type BOQAnalysisConfig,
} from './kkp-boq-integration';

// IFC Material Mapper
export {
  mapIFCMaterials,
  extractMaterialsFromIFC,
  getIFCMaterialMapping,
  calculateIFCCarbon,
  type IFCMaterialMapping,
  type IFCExtractionResult,
} from './ifc-material-mapper';

// IFC Calculator Integration
export {
  integrateIFCWithCalculator,
  createCarbonAnalysisFromIFC,
  enrichIFCWithCarbon,
  type IFCCarbonIntegration,
  type IFCAnalysisConfig,
} from './ifc-calculator-integration';

// Knowledge Graph
export {
  CARBON_STANDARDS_GRAPH,
  getRelatedStandards,
  getDataRequirements,
  getCompliancePath,
  type CompliancePathResult,
} from './knowledge-graph';

// Analysis Pipeline
export {
  runCarbonAnalysis,
  analyzeMaterialBreakdown,
  generateCarbonReport,
  validateAnalysisInput,
  type AnalysisPipelineConfig,
  type AnalysisPipelineResult,
} from './analysis-pipeline';

// Bank Reports
export {
  generateGreenLoanDocument,
  generateBankReport,
  getBankRequirements,
  type BankType,
  type BankReportConfig,
  type BankReportResult,
} from './bank-reports';

// Thai Materials (extended)
export {
  THAI_CONSTRUCTION_MATERIALS,
  getThaiMaterialByCode,
  searchThaiMaterials,
  getMaterialProducers,
  type ThaiConstructionMaterial,
} from './thai-materials';
