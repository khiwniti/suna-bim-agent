/**
 * useCarbonData Hook
 *
 * React hook for managing carbon analysis workflow.
 * Provides methods for running analysis, managing state, and generating reports.
 */

import { useCallback, useMemo } from 'react';
import {
  useCarbonStore,
  selectActiveProject,
  selectIsAnalyzing,
  selectHasResults,
  selectTopHotspots,
  selectCarbonIntensity,
  selectReductionPotential,
  type CarbonProject,
} from '@/stores/carbon-store';
import {
  runCarbonAnalysis,
  generateCarbonReport,
  validateAnalysisInput,
  type AnalysisPipelineConfig,
  type AnalysisPipelineResult,
} from '@/lib/carbon/analysis-pipeline';
import { convertBIMToAnalysisInput } from '@/lib/carbon/ifc-calculator-integration';
import type { BIMModel, MaterialCategory } from '@/lib/carbon/types';

// =============================================================================
// TYPES
// =============================================================================

export interface UseCarbonDataReturn {
  // State
  activeProject: CarbonProject | undefined;
  isAnalyzing: boolean;
  hasResults: boolean;
  status: 'idle' | 'configuring' | 'analyzing' | 'completed' | 'error';
  error: string | null;

  // Results
  results: AnalysisPipelineResult | null;
  totalCarbon: number;
  carbonIntensity: number;
  topHotspots: AnalysisPipelineResult['hotspots'];
  reductionPotential: number;
  materialBreakdown: AnalysisPipelineResult['materialBreakdown'];
  categoryBreakdown: AnalysisPipelineResult['categoryBreakdown'];
  recommendations: AnalysisPipelineResult['recommendations'];

  // Configuration
  config: Partial<AnalysisPipelineConfig>;
  updateConfig: (updates: Partial<AnalysisPipelineConfig>) => void;
  resetConfig: () => void;

  // Project management
  createProject: (name: string, modelId?: string) => string;
  setActiveProject: (projectId: string | null) => void;
  deleteProject: (projectId: string) => void;

  // Analysis operations
  runAnalysis: (model: BIMModel) => Promise<AnalysisPipelineResult | null>;
  validateModel: (model: BIMModel) => { valid: boolean; errors: string[]; warnings: string[] };
  clearResults: () => void;

  // Report generation
  generateReport: (format?: 'summary' | 'detailed' | 'bank') => string | null;

  // Material selection
  selectedMaterialId: string | null;
  selectMaterial: (materialId: string | null) => void;
  expandedCategories: Set<MaterialCategory>;
  toggleCategory: (category: MaterialCategory) => void;

  // Filtering
  filters: {
    categories: MaterialCategory[];
    minCarbonThreshold: number;
    showRecommendationsOnly: boolean;
    sortBy: 'carbon' | 'percentage' | 'name' | 'reduction';
    sortOrder: 'asc' | 'desc';
  };
  setFilters: (updates: Partial<UseCarbonDataReturn['filters']>) => void;
  resetFilters: () => void;
  getFilteredBreakdown: () => AnalysisPipelineResult['materialBreakdown'];
  getSortedRecommendations: () => AnalysisPipelineResult['recommendations'];

  // Comparison
  comparison: {
    enabled: boolean;
    baselineProjectId?: string;
    reduction?: number;
    reductionPercent?: number;
  };
  setComparison: (updates: Partial<UseCarbonDataReturn['comparison']>) => void;
  clearComparison: () => void;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useCarbonData(): UseCarbonDataReturn {
  // Get store state and actions
  const store = useCarbonStore();

  // Selectors
  const activeProject = useCarbonStore(selectActiveProject);
  const isAnalyzing = useCarbonStore(selectIsAnalyzing);
  const hasResults = useCarbonStore(selectHasResults);
  const topHotspots = useCarbonStore(state => selectTopHotspots(state, 5));
  const carbonIntensity = useCarbonStore(selectCarbonIntensity);
  const reductionPotential = useCarbonStore(selectReductionPotential);

  // Run carbon analysis
  const runAnalysis = useCallback(async (model: BIMModel): Promise<AnalysisPipelineResult | null> => {
    const config = store.currentConfig as AnalysisPipelineConfig;

    // Validate first
    const validation = validateAnalysisInput(model, config);
    if (!validation.valid) {
      store.setError(validation.errors.join('; '));
      return null;
    }

    // Start analysis
    store.startAnalysis();

    try {
      // Convert BIM model to analysis input
      const conversionResult = convertBIMToAnalysisInput(model, {
        useDefaultDensities: true,
        includeZeroQuantity: false,
        minMappingConfidence: 0.3,
      });

      // Log warnings
      if (conversionResult.warnings.length > 0) {
        console.warn('[Carbon Analysis] Warnings:', conversionResult.warnings);
      }

      // Run the analysis pipeline
      const results = await runCarbonAnalysis(model, config);

      // Store results
      store.setAnalysisResults(results);

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';
      store.setError(errorMessage);
      return null;
    }
  }, [store]);

  // Validate model before analysis
  const validateModel = useCallback((model: BIMModel) => {
    const config = store.currentConfig as AnalysisPipelineConfig;
    return validateAnalysisInput(model, config);
  }, [store.currentConfig]);

  // Generate report
  const generateReport = useCallback((format: 'summary' | 'detailed' | 'bank' = 'summary'): string | null => {
    if (!store.analysisResults) {
      return null;
    }
    return generateCarbonReport(store.analysisResults, format);
  }, [store.analysisResults]);

  // Memoized derived data
  const materialBreakdown = useMemo(() => {
    return store.analysisResults?.materialBreakdown || [];
  }, [store.analysisResults]);

  const categoryBreakdown = useMemo(() => {
    return store.analysisResults?.categoryBreakdown || [];
  }, [store.analysisResults]);

  const recommendations = useMemo(() => {
    return store.analysisResults?.recommendations || [];
  }, [store.analysisResults]);

  return {
    // State
    activeProject,
    isAnalyzing,
    hasResults,
    status: store.status,
    error: store.error,

    // Results
    results: store.analysisResults,
    totalCarbon: store.getTotalCarbon(),
    carbonIntensity,
    topHotspots,
    reductionPotential,
    materialBreakdown,
    categoryBreakdown,
    recommendations,

    // Configuration
    config: store.currentConfig,
    updateConfig: store.updateConfig,
    resetConfig: store.resetConfig,

    // Project management
    createProject: store.createProject,
    setActiveProject: store.setActiveProject,
    deleteProject: store.deleteProject,

    // Analysis operations
    runAnalysis,
    validateModel,
    clearResults: store.clearResults,

    // Report generation
    generateReport,

    // Material selection
    selectedMaterialId: store.selectedMaterialId,
    selectMaterial: store.selectMaterial,
    expandedCategories: store.expandedCategories,
    toggleCategory: store.toggleCategory,

    // Filtering
    filters: store.filters,
    setFilters: store.setFilters,
    resetFilters: store.resetFilters,
    getFilteredBreakdown: store.getFilteredBreakdown,
    getSortedRecommendations: store.getSortedRecommendations,

    // Comparison
    comparison: store.comparison,
    setComparison: store.setComparison,
    clearComparison: store.clearComparison,
  };
}

// =============================================================================
// ADDITIONAL HOOKS
// =============================================================================

/**
 * Hook for carbon analysis status only (lightweight)
 */
export function useCarbonStatus() {
  const status = useCarbonStore(state => state.status);
  const error = useCarbonStore(state => state.error);
  const hasResults = useCarbonStore(selectHasResults);

  return { status, error, hasResults };
}

/**
 * Hook for carbon results summary (for dashboards)
 */
export function useCarbonSummary() {
  const totalCarbon = useCarbonStore(state => state.getTotalCarbon());
  const carbonIntensity = useCarbonStore(selectCarbonIntensity);
  const reductionPotential = useCarbonStore(selectReductionPotential);
  const topHotspots = useCarbonStore(state => selectTopHotspots(state, 3));
  const hasResults = useCarbonStore(selectHasResults);

  return {
    totalCarbon,
    carbonIntensity,
    reductionPotential,
    topHotspots,
    hasResults,
  };
}

/**
 * Hook for carbon recommendations only
 */
export function useCarbonRecommendations() {
  const recommendations = useCarbonStore(state => state.recommendations);
  const getSortedRecommendations = useCarbonStore(state => state.getSortedRecommendations);

  return {
    recommendations,
    sortedRecommendations: getSortedRecommendations(),
    count: recommendations.length,
    highPriorityCount: recommendations.filter(r => r.priority === 'high').length,
  };
}

/**
 * Hook for material breakdown with filtering
 */
export function useMaterialBreakdown() {
  const materialBreakdown = useCarbonStore(state => state.materialBreakdown);
  const filters = useCarbonStore(state => state.filters);
  const setFilters = useCarbonStore(state => state.setFilters);
  const getFilteredBreakdown = useCarbonStore(state => state.getFilteredBreakdown);
  const selectedMaterialId = useCarbonStore(state => state.selectedMaterialId);
  const selectMaterial = useCarbonStore(state => state.selectMaterial);

  return {
    materials: materialBreakdown,
    filteredMaterials: getFilteredBreakdown(),
    filters,
    setFilters,
    selectedMaterialId,
    selectMaterial,
    totalMaterials: materialBreakdown.length,
  };
}

export default useCarbonData;
