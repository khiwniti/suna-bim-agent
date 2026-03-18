/**
 * Carbon Analysis Store
 *
 * Zustand store for managing carbon footprint analysis state.
 * Handles project selection, analysis configuration, results, and reporting.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  AnalysisPipelineConfig,
  AnalysisPipelineResult,
} from '@/lib/carbon/analysis-pipeline';
import type {
  BIMModel,
  MaterialCarbonBreakdown,
  CarbonRecommendation,
  MaterialCategory,
} from '@/lib/carbon/types';

// =============================================================================
// TYPES
// =============================================================================

export type AnalysisStatus = 'idle' | 'configuring' | 'analyzing' | 'completed' | 'error';

export interface CarbonProject {
  id: string;
  name: string;
  modelId?: string;
  createdAt: Date;
  updatedAt: Date;
  status: AnalysisStatus;
  config?: AnalysisPipelineConfig;
  results?: AnalysisPipelineResult;
}

export interface ComparisonState {
  enabled: boolean;
  baselineProjectId?: string;
  baselineResults?: AnalysisPipelineResult;
  reduction?: number;
  reductionPercent?: number;
}

export interface FilterState {
  categories: MaterialCategory[];
  minCarbonThreshold: number;
  showRecommendationsOnly: boolean;
  sortBy: 'carbon' | 'percentage' | 'name' | 'reduction';
  sortOrder: 'asc' | 'desc';
}

export interface CarbonStore {
  // === STATE ===

  // Active project
  activeProjectId: string | null;
  projects: Map<string, CarbonProject>;

  // Analysis configuration
  currentConfig: Partial<AnalysisPipelineConfig>;

  // Analysis results (cached from current project)
  analysisResults: AnalysisPipelineResult | null;
  materialBreakdown: MaterialCarbonBreakdown[];
  recommendations: CarbonRecommendation[];

  // UI state
  status: AnalysisStatus;
  error: string | null;
  selectedMaterialId: string | null;
  expandedCategories: Set<MaterialCategory>;

  // Comparison
  comparison: ComparisonState;

  // Filtering
  filters: FilterState;

  // BIM model reference
  bimModel: BIMModel | null;

  // === ACTIONS ===

  // Project management
  createProject: (name: string, modelId?: string) => string;
  setActiveProject: (projectId: string | null) => void;
  updateProject: (projectId: string, updates: Partial<CarbonProject>) => void;
  deleteProject: (projectId: string) => void;

  // Configuration
  setConfig: (config: Partial<AnalysisPipelineConfig>) => void;
  updateConfig: (updates: Partial<AnalysisPipelineConfig>) => void;
  resetConfig: () => void;

  // Analysis
  startAnalysis: () => void;
  setAnalysisResults: (results: AnalysisPipelineResult) => void;
  setError: (error: string) => void;
  clearResults: () => void;

  // Material selection
  selectMaterial: (materialId: string | null) => void;
  toggleCategory: (category: MaterialCategory) => void;

  // Comparison
  setComparison: (state: Partial<ComparisonState>) => void;
  clearComparison: () => void;

  // Filters
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  // BIM integration
  setBimModel: (model: BIMModel | null) => void;

  // Utilities
  getFilteredBreakdown: () => MaterialCarbonBreakdown[];
  getSortedRecommendations: () => CarbonRecommendation[];
  getTotalCarbon: () => number;
  getCarbonByCategory: () => Map<MaterialCategory, number>;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const defaultConfig: Partial<AnalysisPipelineConfig> = {
  scope: 'A1_A3',
  includeTransport: true,
  includeConstruction: true,
  includeEndOfLife: false,
  projectRegion: 'central',
  transportDistance: 100,
  targetCertifications: [],
  generateReport: true,
  reportFormat: 'summary',
};

const defaultFilters: FilterState = {
  categories: [],
  minCarbonThreshold: 0,
  showRecommendationsOnly: false,
  sortBy: 'carbon',
  sortOrder: 'desc',
};

const defaultComparison: ComparisonState = {
  enabled: false,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useCarbonStore = create<CarbonStore>()(
  devtools(
    persist(
      (set, get) => ({
        // === INITIAL STATE ===
        activeProjectId: null,
        projects: new Map(),
        currentConfig: { ...defaultConfig },
        analysisResults: null,
        materialBreakdown: [],
        recommendations: [],
        status: 'idle',
        error: null,
        selectedMaterialId: null,
        expandedCategories: new Set<MaterialCategory>(),
        comparison: { ...defaultComparison },
        filters: { ...defaultFilters },
        bimModel: null,

        // === PROJECT MANAGEMENT ===

        createProject: (name: string, modelId?: string) => {
          const id = `project-${Date.now()}`;
          const project: CarbonProject = {
            id,
            name,
            modelId,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'idle',
          };

          set(state => ({
            projects: new Map(state.projects).set(id, project),
            activeProjectId: id,
          }));

          return id;
        },

        setActiveProject: (projectId: string | null) => {
          const state = get();
          if (projectId && state.projects.has(projectId)) {
            const project = state.projects.get(projectId)!;
            set({
              activeProjectId: projectId,
              currentConfig: project.config || { ...defaultConfig },
              analysisResults: project.results || null,
              materialBreakdown: project.results?.materialBreakdown || [],
              recommendations: project.results?.recommendations || [],
              status: project.status,
            });
          } else {
            set({
              activeProjectId: null,
              currentConfig: { ...defaultConfig },
              analysisResults: null,
              materialBreakdown: [],
              recommendations: [],
              status: 'idle',
            });
          }
        },

        updateProject: (projectId: string, updates: Partial<CarbonProject>) => {
          const state = get();
          const project = state.projects.get(projectId);
          if (project) {
            const updatedProject = {
              ...project,
              ...updates,
              updatedAt: new Date(),
            };
            set({
              projects: new Map(state.projects).set(projectId, updatedProject),
            });
          }
        },

        deleteProject: (projectId: string) => {
          const state = get();
          const newProjects = new Map(state.projects);
          newProjects.delete(projectId);
          set({
            projects: newProjects,
            ...(state.activeProjectId === projectId ? {
              activeProjectId: null,
              currentConfig: { ...defaultConfig },
              analysisResults: null,
              materialBreakdown: [],
              recommendations: [],
              status: 'idle',
            } : {}),
          });
        },

        // === CONFIGURATION ===

        setConfig: (config: Partial<AnalysisPipelineConfig>) => {
          set({ currentConfig: config, status: 'configuring' });
        },

        updateConfig: (updates: Partial<AnalysisPipelineConfig>) => {
          set(state => ({
            currentConfig: { ...state.currentConfig, ...updates },
          }));
        },

        resetConfig: () => {
          set({ currentConfig: { ...defaultConfig } });
        },

        // === ANALYSIS ===

        startAnalysis: () => {
          set({ status: 'analyzing', error: null });
        },

        setAnalysisResults: (results: AnalysisPipelineResult) => {
          const state = get();
          set({
            analysisResults: results,
            materialBreakdown: results.materialBreakdown,
            recommendations: results.recommendations,
            status: 'completed',
            error: null,
          });

          // Update project if active
          if (state.activeProjectId) {
            state.updateProject(state.activeProjectId, {
              results,
              status: 'completed',
              config: state.currentConfig as AnalysisPipelineConfig,
            });
          }
        },

        setError: (error: string) => {
          const state = get();
          set({ status: 'error', error });

          if (state.activeProjectId) {
            state.updateProject(state.activeProjectId, { status: 'error' });
          }
        },

        clearResults: () => {
          set({
            analysisResults: null,
            materialBreakdown: [],
            recommendations: [],
            status: 'idle',
            error: null,
          });
        },

        // === MATERIAL SELECTION ===

        selectMaterial: (materialId: string | null) => {
          set({ selectedMaterialId: materialId });
        },

        toggleCategory: (category: MaterialCategory) => {
          set(state => {
            const newExpanded = new Set(state.expandedCategories);
            if (newExpanded.has(category)) {
              newExpanded.delete(category);
            } else {
              newExpanded.add(category);
            }
            return { expandedCategories: newExpanded };
          });
        },

        // === COMPARISON ===

        setComparison: (updates: Partial<ComparisonState>) => {
          set(state => ({
            comparison: { ...state.comparison, ...updates },
          }));
        },

        clearComparison: () => {
          set({ comparison: { ...defaultComparison } });
        },

        // === FILTERS ===

        setFilters: (updates: Partial<FilterState>) => {
          set(state => ({
            filters: { ...state.filters, ...updates },
          }));
        },

        resetFilters: () => {
          set({ filters: { ...defaultFilters } });
        },

        // === BIM INTEGRATION ===

        setBimModel: (model: BIMModel | null) => {
          set({ bimModel: model });
        },

        // === UTILITIES ===

        getFilteredBreakdown: () => {
          const state = get();
          let filtered = [...state.materialBreakdown];

          // Filter by categories
          if (state.filters.categories.length > 0) {
            filtered = filtered.filter(m =>
              // Assuming material has a category property - may need adjustment
              state.filters.categories.includes('concrete' as MaterialCategory) // Placeholder
            );
          }

          // Filter by carbon threshold
          if (state.filters.minCarbonThreshold > 0) {
            filtered = filtered.filter(m => m.carbon >= state.filters.minCarbonThreshold);
          }

          // Sort
          const sortKey = state.filters.sortBy;
          const sortOrder = state.filters.sortOrder === 'asc' ? 1 : -1;

          filtered.sort((a, b) => {
            if (sortKey === 'carbon') return (a.carbon - b.carbon) * sortOrder;
            if (sortKey === 'percentage') return (a.fraction - b.fraction) * sortOrder;
            if (sortKey === 'name') return a.material.localeCompare(b.material) * sortOrder;
            return 0;
          });

          return filtered;
        },

        getSortedRecommendations: () => {
          const state = get();
          const recommendations = [...state.recommendations];

          // Sort by priority and potential savings
          recommendations.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return b.savingsPercent - a.savingsPercent;
          });

          return recommendations;
        },

        getTotalCarbon: () => {
          const state = get();
          return state.analysisResults?.totalEmbodiedCarbon || 0;
        },

        getCarbonByCategory: () => {
          const state = get();
          const categoryMap = new Map<MaterialCategory, number>();

          if (state.analysisResults?.categoryBreakdown) {
            for (const cat of state.analysisResults.categoryBreakdown) {
              categoryMap.set(cat.category, cat.totalCarbon);
            }
          }

          return categoryMap;
        },
      }),
      {
        name: 'carbon-analysis-store',
        partialize: (state) => ({
          // Only persist essential state
          activeProjectId: state.activeProjectId,
          projects: Array.from(state.projects.entries()),
          currentConfig: state.currentConfig,
          filters: state.filters,
        }),
        onRehydrateStorage: () => (state) => {
          // Convert projects array back to Map
          if (state && Array.isArray(state.projects)) {
            state.projects = new Map(state.projects as unknown as Array<[string, CarbonProject]>);
          }
        },
      }
    ),
    { name: 'CarbonStore' }
  )
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectActiveProject = (state: CarbonStore): CarbonProject | undefined => {
  if (!state.activeProjectId) return undefined;
  return state.projects.get(state.activeProjectId);
};

export const selectIsAnalyzing = (state: CarbonStore): boolean => {
  return state.status === 'analyzing';
};

export const selectHasResults = (state: CarbonStore): boolean => {
  return state.analysisResults !== null;
};

export const selectTopHotspots = (state: CarbonStore, count: number = 5) => {
  return state.analysisResults?.hotspots.slice(0, count) || [];
};

export const selectCarbonIntensity = (state: CarbonStore): number => {
  return state.analysisResults?.carbonPerSquareMeter || 0;
};

export const selectReductionPotential = (state: CarbonStore): number => {
  if (!state.recommendations.length) return 0;
  return state.recommendations.reduce((sum, rec) => sum + rec.savingsPercent, 0);
};
