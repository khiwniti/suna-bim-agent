/**
 * useIFCCalculatorIntegration Hook
 *
 * React hook for integrating BIM viewer with carbon calculator.
 * Provides reactive state management for material mapping and
 * carbon analysis based on model/selection changes.
 *
 * ★ Insight ─────────────────────────────────────
 * This hook bridges the gap between the BIM viewer's visual
 * selection and the carbon calculator's analysis pipeline.
 * It automatically:
 * - Tracks element selection changes
 * - Maps materials to Thai database
 * - Calculates preliminary carbon estimates
 * - Provides UI-ready data for the calculator
 * ─────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useBIMStore } from '@/stores/bim-store';
import {
  convertBIMToAnalysisInput,
  convertSelectedElements,
  getMaterialSummary,
  type IFCConversionResult,
  type IFCCalculatorOptions,
} from '@/lib/carbon/ifc-calculator-integration';
import { mapIFCMaterial, type MaterialMapping } from '@/lib/carbon/ifc-material-mapper';
import {
  THAI_MATERIALS,
  calculateMaterialCarbon,
  type ThaiMaterial,
} from '@/lib/carbon/thai-materials';
import type { BIMModel, BIMElement, BIMElementType } from '@/types/bim';
import type { CarbonAnalysisInput, ElementWithMaterial } from '@/lib/carbon/analysis-pipeline';

// ============================================
// Types
// ============================================

export interface UseIFCCalculatorOptions {
  /** Auto-convert when model changes */
  autoConvert?: boolean;
  /** Auto-convert when selection changes */
  convertOnSelection?: boolean;
  /** Conversion options */
  conversionOptions?: Partial<IFCCalculatorOptions>;
}

export interface IFCCalculatorState {
  /** Whether conversion is in progress */
  isConverting: boolean;
  /** Conversion result */
  result: IFCConversionResult | null;
  /** Error if conversion failed */
  error: string | null;
  /** Quick carbon estimate (before full analysis) */
  quickEstimate: QuickCarbonEstimate | null;
  /** Material summary for the current model */
  materialSummary: MaterialSummaryItem[] | null;
}

export interface QuickCarbonEstimate {
  /** Total estimated carbon (kgCO2e) */
  totalCarbon: number;
  /** Carbon per m² (kgCO2e/m²) */
  carbonIntensity: number;
  /** Breakdown by material category */
  byCategory: Record<string, number>;
  /** Potential savings with low-carbon alternatives */
  potentialSavings: number;
  /** Confidence level (0-1) */
  confidence: number;
}

export interface MaterialSummaryItem {
  /** IFC material name */
  ifcMaterial: string;
  /** Mapped Thai material */
  thaiMaterial: ThaiMaterial;
  /** Element count */
  elementCount: number;
  /** Mapping confidence */
  confidence: number;
  /** Has low-carbon alternative */
  hasAlternative: boolean;
  /** Override material ID (if user changed mapping) */
  overrideId?: string;
}

export interface IFCCalculatorActions {
  /** Convert current model to analysis input */
  convertModel: (options?: Partial<IFCCalculatorOptions>) => Promise<IFCConversionResult>;
  /** Convert selected elements only */
  convertSelection: () => Promise<IFCConversionResult>;
  /** Calculate quick estimate without full conversion */
  calculateQuickEstimate: () => QuickCarbonEstimate | null;
  /** Override material mapping for an IFC material */
  overrideMaterial: (ifcMaterial: string, thaiMaterialId: string) => void;
  /** Clear material override */
  clearOverride: (ifcMaterial: string) => void;
  /** Clear all overrides */
  clearAllOverrides: () => void;
  /** Get analysis input for calculator */
  getAnalysisInput: () => CarbonAnalysisInput | null;
  /** Refresh material summary */
  refreshMaterialSummary: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export function useIFCCalculatorIntegration(
  options: UseIFCCalculatorOptions = {}
): [IFCCalculatorState, IFCCalculatorActions] {
  const { autoConvert = false, convertOnSelection = false, conversionOptions = {} } = options;

  // BIM Store
  const currentModel = useBIMStore((state) => state.currentModel);
  const selection = useBIMStore((state) => state.selection);
  const elementIndexes = useBIMStore((state) => state.elementIndexes);
  const selectedIds = selection.selectedIds;

  // Local state
  const [state, setState] = useState<IFCCalculatorState>({
    isConverting: false,
    result: null,
    error: null,
    quickEstimate: null,
    materialSummary: null,
  });

  const [materialOverrides, setMaterialOverrides] = useState<Record<string, string>>({});

  // ============================================
  // Material Summary Calculation
  // ============================================

  const refreshMaterialSummary = useCallback(() => {
    if (!currentModel) {
      setState((prev) => ({ ...prev, materialSummary: null }));
      return;
    }

    const summary = getMaterialSummary(currentModel);
    const materialSummaryItems: MaterialSummaryItem[] = summary.map((item) => ({
      ifcMaterial: item.material,
      thaiMaterial: item.mapping.thaiMaterial,
      elementCount: item.count,
      confidence: item.mapping.confidence,
      hasAlternative: !!item.mapping.thaiMaterial.lowCarbonAlternativeId,
      overrideId: materialOverrides[item.material],
    }));

    // Sort by element count descending
    materialSummaryItems.sort((a, b) => b.elementCount - a.elementCount);

    setState((prev) => ({ ...prev, materialSummary: materialSummaryItems }));
  }, [currentModel, materialOverrides]);

  // ============================================
  // Quick Estimate Calculation
  // ============================================

  const calculateQuickEstimate = useCallback((): QuickCarbonEstimate | null => {
    if (!currentModel || !state.materialSummary) {
      return null;
    }

    let totalCarbon = 0;
    let potentialSavings = 0;
    let totalConfidence = 0;
    const byCategory: Record<string, number> = {};

    for (const item of state.materialSummary) {
      // Estimate volume based on element count and typical sizes
      const estimatedVolumePerElement = getEstimatedVolume(item.thaiMaterial.category);
      const totalVolume = item.elementCount * estimatedVolumePerElement;

      // Get material from override or mapping
      const materialId = item.overrideId || item.thaiMaterial.id;
      const material = THAI_MATERIALS[materialId];

      if (material) {
        // Calculate carbon based on material unit
        let carbon = 0;
        if (material.unit === 'm³') {
          carbon = totalVolume * material.emissionFactor;
        } else if (material.unit === 'kg' && material.density) {
          const mass = totalVolume * material.density;
          carbon = mass * material.emissionFactor;
        } else if (material.unit === 'm²') {
          // Estimate area from volume assuming typical thickness
          const area = totalVolume / 0.15; // Assume 150mm thickness
          carbon = area * material.emissionFactor;
        } else {
          // Fallback: estimate based on typical values
          carbon = item.elementCount * 50; // 50 kgCO2e per element fallback
        }

        totalCarbon += carbon;
        totalConfidence += item.confidence;

        // Track by category
        byCategory[material.category] = (byCategory[material.category] || 0) + carbon;

        // Calculate potential savings if low-carbon alternative exists
        if (material.carbonReductionPotential) {
          potentialSavings += carbon * (material.carbonReductionPotential / 100);
        }
      }
    }

    const avgConfidence = state.materialSummary.length > 0
      ? totalConfidence / state.materialSummary.length
      : 0;

    // Calculate intensity (kgCO2e/m²)
    const floorArea = currentModel.metadata?.totalArea || currentModel.metadata?.floorArea || 1000;
    const carbonIntensity = totalCarbon / floorArea;

    const estimate: QuickCarbonEstimate = {
      totalCarbon,
      carbonIntensity,
      byCategory,
      potentialSavings,
      confidence: avgConfidence,
    };

    setState((prev) => ({ ...prev, quickEstimate: estimate }));
    return estimate;
  }, [currentModel, state.materialSummary]);

  // ============================================
  // Model Conversion
  // ============================================

  const convertModel = useCallback(
    async (additionalOptions: Partial<IFCCalculatorOptions> = {}): Promise<IFCConversionResult> => {
      if (!currentModel) {
        throw new Error('No model loaded');
      }

      setState((prev) => ({ ...prev, isConverting: true, error: null }));

      try {
        const result = convertBIMToAnalysisInput(currentModel, {
          ...conversionOptions,
          ...additionalOptions,
          materialOverrides: {
            ...conversionOptions.materialOverrides,
            ...additionalOptions.materialOverrides,
            ...materialOverrides,
          },
        });

        setState((prev) => ({
          ...prev,
          isConverting: false,
          result,
          error: null,
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
        setState((prev) => ({
          ...prev,
          isConverting: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [currentModel, conversionOptions, materialOverrides]
  );

  const convertSelection = useCallback(async (): Promise<IFCConversionResult> => {
    if (!currentModel) {
      throw new Error('No model loaded');
    }

    if (selectedIds.length === 0) {
      throw new Error('No elements selected');
    }

    setState((prev) => ({ ...prev, isConverting: true, error: null }));

    try {
      const result = convertSelectedElements(currentModel, selectedIds, {
        ...conversionOptions,
        materialOverrides,
      });

      setState((prev) => ({
        ...prev,
        isConverting: false,
        result,
        error: null,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
      setState((prev) => ({
        ...prev,
        isConverting: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [currentModel, selectedIds, conversionOptions, materialOverrides]);

  // ============================================
  // Material Override Management
  // ============================================

  const overrideMaterial = useCallback((ifcMaterial: string, thaiMaterialId: string) => {
    setMaterialOverrides((prev) => ({
      ...prev,
      [ifcMaterial]: thaiMaterialId,
    }));
  }, []);

  const clearOverride = useCallback((ifcMaterial: string) => {
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      delete next[ifcMaterial];
      return next;
    });
  }, []);

  const clearAllOverrides = useCallback(() => {
    setMaterialOverrides({});
  }, []);

  // ============================================
  // Get Analysis Input
  // ============================================

  const getAnalysisInput = useCallback((): CarbonAnalysisInput | null => {
    return state.result?.analysisInput || null;
  }, [state.result]);

  // ============================================
  // Effects
  // ============================================

  // Refresh material summary when model changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: sync state from external model data
    refreshMaterialSummary();
  }, [refreshMaterialSummary]);

  // Auto-convert when model changes
  useEffect(() => {
    if (autoConvert && currentModel) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: trigger conversion on model change
      convertModel().catch((error) => {
        console.error('Auto-convert failed:', error);
      });
    }
  }, [autoConvert, currentModel, convertModel]);

  // Convert on selection change
  useEffect(() => {
    if (convertOnSelection && currentModel && selectedIds.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: trigger conversion on selection change
      convertSelection().catch((error) => {
        console.error('Selection convert failed:', error);
      });
    }
  }, [convertOnSelection, currentModel, selectedIds, convertSelection]);

  // Recalculate quick estimate when material summary or overrides change
  useEffect(() => {
    if (state.materialSummary) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: recalculate derived state
      calculateQuickEstimate();
    }
  }, [state.materialSummary, calculateQuickEstimate]);

  // ============================================
  // Return
  // ============================================

  const actions: IFCCalculatorActions = useMemo(
    () => ({
      convertModel,
      convertSelection,
      calculateQuickEstimate,
      overrideMaterial,
      clearOverride,
      clearAllOverrides,
      getAnalysisInput,
      refreshMaterialSummary,
    }),
    [
      convertModel,
      convertSelection,
      calculateQuickEstimate,
      overrideMaterial,
      clearOverride,
      clearAllOverrides,
      getAnalysisInput,
      refreshMaterialSummary,
    ]
  );

  return [state, actions];
}

// ============================================
// Helper Functions
// ============================================

/**
 * Estimate typical volume per element by material category
 */
function getEstimatedVolume(category: string): number {
  const estimates: Record<string, number> = {
    concrete: 2.0,      // 2 m³ per concrete element (slab, beam, column average)
    steel: 0.05,        // 0.05 m³ per steel element (rebar, structural)
    masonry: 0.5,       // 0.5 m³ per masonry element (wall segment)
    timber: 0.1,        // 0.1 m³ per timber element
    glass: 0.02,        // 0.02 m³ per glass element (window/door)
    insulation: 0.3,    // 0.3 m³ per insulation area
    finishes: 0.05,     // 0.05 m³ per finish element
    mep: 0.01,          // 0.01 m³ per MEP element
    roofing: 0.1,       // 0.1 m³ per roofing element
    waterproofing: 0.01, // 0.01 m³ per waterproofing element
  };

  return estimates[category] || 0.5;
}

export default useIFCCalculatorIntegration;
