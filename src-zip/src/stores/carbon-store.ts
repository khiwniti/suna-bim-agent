/**
 * Carbon Analysis Store
 *
 * Zustand store for managing carbon calculation state,
 * certification assessments, and bank documentation.
 *
 * ★ Insight ─────────────────────────────────────
 * This store centralizes carbon-related state:
 * - BOQ carbon analysis results
 * - Edge/TREES certification assessments
 * - Bank documentation state
 * - T-VER project registration
 * ─────────────────────────────────────────────────
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  BOQCarbonAnalysis,
  EdgeCalculation,
  MaterialCategory,
  ThaiBank,
} from '@/lib/carbon';

// =============================================================================
// TYPES
// =============================================================================

/** Carbon analysis status */
export type CarbonAnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

/** Certification level */
export type CertificationLevel =
  | 'none'
  | 'edge_certified'
  | 'edge_advanced'
  | 'edge_zero_carbon'
  | 'trees_certified'
  | 'trees_silver'
  | 'trees_gold'
  | 'trees_platinum';

/** TREES assessment state */
export interface TREESAssessment {
  projectId: string;
  targetLevel: 'certified' | 'silver' | 'gold' | 'platinum';
  totalPoints: number;
  categoryScores: Record<string, number>;
  mrCredits: {
    mr4RecycledMaterial: number;
    mr5LocalMaterial: number;
    mr4Percentage?: number;
    mr5Percentage?: number;
  };
  recommendations: string[];
  certificationStatus: 'eligible' | 'not_eligible';
  assessmentDate: Date;
}

/** Bank documentation state */
export interface BankDocumentState {
  targetBank: ThaiBank | null;
  isGenerating: boolean;
  document: {
    projectId: string;
    projectName: string;
    totalEmbodiedCarbon: number;
    carbonReductionPercent: number;
    generatedAt: Date;
    sections: {
      executiveSummary: string;
      projectOverview: string;
      carbonAnalysis: string;
      certificationStatus: string;
      sustainabilityMetrics: string;
    };
  } | null;
  error: string | null;
}

/** T-VER registration state */
export interface TVERState {
  projectId: string | null;
  registrationStatus: 'draft' | 'submitted' | 'under_review' | 'registered' | 'verified';
  pddGenerated: boolean;
  baselineEmissions: number;
  projectEmissions: number;
  emissionReductions: number;
}

// =============================================================================
// STORE STATE
// =============================================================================

export interface CarbonState {
  // Analysis state
  analysis: BOQCarbonAnalysis | null;
  analysisStatus: CarbonAnalysisStatus;
  analysisError: string | null;

  // Edge certification
  edgeCalculation: EdgeCalculation | null;
  edgeStatus: CarbonAnalysisStatus;

  // TREES certification
  treesAssessment: TREESAssessment | null;
  treesStatus: CarbonAnalysisStatus;

  // Bank documentation
  bankDocument: BankDocumentState;

  // T-VER registration
  tver: TVERState;

  // UI state
  selectedCategory: MaterialCategory | 'all';
  showHotspots: boolean;
  comparisonMode: boolean;

  // Actions - Analysis
  setAnalysis: (analysis: BOQCarbonAnalysis | null) => void;
  setAnalysisStatus: (status: CarbonAnalysisStatus) => void;
  setAnalysisError: (error: string | null) => void;
  clearAnalysis: () => void;

  // Actions - Edge
  setEdgeCalculation: (calc: EdgeCalculation | null) => void;
  setEdgeStatus: (status: CarbonAnalysisStatus) => void;

  // Actions - TREES
  setTREESAssessment: (assessment: TREESAssessment | null) => void;
  setTREESStatus: (status: CarbonAnalysisStatus) => void;

  // Actions - Bank
  setTargetBank: (bank: ThaiBank | null) => void;
  setBankDocument: (doc: BankDocumentState['document']) => void;
  setBankGenerating: (generating: boolean) => void;
  setBankError: (error: string | null) => void;

  // Actions - T-VER
  setTVERProject: (project: Partial<TVERState>) => void;

  // Actions - UI
  setSelectedCategory: (category: MaterialCategory | 'all') => void;
  toggleHotspots: () => void;
  toggleComparisonMode: () => void;

  // Computed values
  getTotalCarbon: () => number;
  getCarbonReduction: () => number;
  getCurrentCertificationLevel: () => CertificationLevel;
  getTopHotspots: (count: number) => BOQCarbonAnalysis['hotspots'];
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useCarbonStore = create<CarbonState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        analysis: null,
        analysisStatus: 'idle',
        analysisError: null,

        edgeCalculation: null,
        edgeStatus: 'idle',

        treesAssessment: null,
        treesStatus: 'idle',

        bankDocument: {
          targetBank: null,
          isGenerating: false,
          document: null,
          error: null,
        },

        tver: {
          projectId: null,
          registrationStatus: 'draft',
          pddGenerated: false,
          baselineEmissions: 0,
          projectEmissions: 0,
          emissionReductions: 0,
        },

        selectedCategory: 'all',
        showHotspots: true,
        comparisonMode: false,

        // Analysis actions
        setAnalysis: (analysis) =>
          set({ analysis, analysisStatus: analysis ? 'success' : 'idle' }),

        setAnalysisStatus: (analysisStatus) => set({ analysisStatus }),

        setAnalysisError: (analysisError) =>
          set({ analysisError, analysisStatus: analysisError ? 'error' : 'idle' }),

        clearAnalysis: () =>
          set({
            analysis: null,
            analysisStatus: 'idle',
            analysisError: null,
            edgeCalculation: null,
            edgeStatus: 'idle',
            treesAssessment: null,
            treesStatus: 'idle',
          }),

        // Edge actions
        setEdgeCalculation: (edgeCalculation) =>
          set({ edgeCalculation, edgeStatus: edgeCalculation ? 'success' : 'idle' }),

        setEdgeStatus: (edgeStatus) => set({ edgeStatus }),

        // TREES actions
        setTREESAssessment: (treesAssessment) =>
          set({ treesAssessment, treesStatus: treesAssessment ? 'success' : 'idle' }),

        setTREESStatus: (treesStatus) => set({ treesStatus }),

        // Bank actions
        setTargetBank: (targetBank) =>
          set((state) => ({
            bankDocument: { ...state.bankDocument, targetBank },
          })),

        setBankDocument: (document) =>
          set((state) => ({
            bankDocument: { ...state.bankDocument, document, isGenerating: false },
          })),

        setBankGenerating: (isGenerating) =>
          set((state) => ({
            bankDocument: { ...state.bankDocument, isGenerating },
          })),

        setBankError: (error) =>
          set((state) => ({
            bankDocument: { ...state.bankDocument, error, isGenerating: false },
          })),

        // T-VER actions
        setTVERProject: (project) =>
          set((state) => ({
            tver: { ...state.tver, ...project },
          })),

        // UI actions
        setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

        toggleHotspots: () =>
          set((state) => ({ showHotspots: !state.showHotspots })),

        toggleComparisonMode: () =>
          set((state) => ({ comparisonMode: !state.comparisonMode })),

        // Computed values
        getTotalCarbon: () => {
          const { analysis } = get();
          return analysis?.totalEmbodiedCarbon ?? 0;
        },

        getCarbonReduction: () => {
          const { edgeCalculation } = get();
          return edgeCalculation?.carbonReduction ?? 0;
        },

        getCurrentCertificationLevel: (): CertificationLevel => {
          const { edgeCalculation, treesAssessment } = get();

          // Check Edge first
          if (edgeCalculation?.certificationLevel) {
            return edgeCalculation.certificationLevel as CertificationLevel;
          }

          // Then check TREES
          if (treesAssessment?.certificationStatus === 'eligible') {
            return `trees_${treesAssessment.targetLevel}` as CertificationLevel;
          }

          return 'none';
        },

        getTopHotspots: (count: number) => {
          const { analysis } = get();
          return analysis?.hotspots?.slice(0, count) ?? [];
        },
      }),
      {
        name: 'carbon-store',
        partialize: (state) => ({
          // Only persist certain fields
          bankDocument: {
            targetBank: state.bankDocument.targetBank,
          },
          selectedCategory: state.selectedCategory,
          showHotspots: state.showHotspots,
        }),
      }
    ),
    { name: 'CarbonStore' }
  )
);

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

/** Select analysis state */
export const useCarbonAnalysis = () =>
  useCarbonStore((state) => ({
    analysis: state.analysis,
    status: state.analysisStatus,
    error: state.analysisError,
  }));

/** Select Edge certification state */
export const useEdgeCertification = () =>
  useCarbonStore((state) => ({
    calculation: state.edgeCalculation,
    status: state.edgeStatus,
    reduction: state.getCarbonReduction(),
  }));

/** Select TREES assessment state */
export const useTREESAssessment = () =>
  useCarbonStore((state) => ({
    assessment: state.treesAssessment,
    status: state.treesStatus,
  }));

/** Select bank documentation state */
export const useBankDocument = () =>
  useCarbonStore((state) => state.bankDocument);

/** Select certification level */
export const useCertificationLevel = () =>
  useCarbonStore((state) => state.getCurrentCertificationLevel());

/** Select hotspots */
export const useCarbonHotspots = (count = 5) =>
  useCarbonStore((state) => state.getTopHotspots(count));

export default useCarbonStore;
