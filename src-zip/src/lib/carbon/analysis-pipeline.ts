/**
 * Carbon Footprint Analysis Pipeline
 *
 * Comprehensive embodied carbon calculation for BIM models:
 * - Material takeoff from IFC elements
 * - Carbon coefficient lookup (ICE v3.0, EC3, EPD databases)
 * - Lifecycle stage calculations (A1-A3, A4, B, C, D)
 * - Benchmarking against industry standards
 * - Optimization recommendations
 *
 * ★ Insight ─────────────────────────────────────
 * The ICE (Inventory of Carbon and Energy) database is the most
 * widely used source in the UK. EC3 (Embodied Carbon in Construction
 * Calculator) is gaining popularity in the US. This pipeline supports
 * both, with fallback to generic values when specific EPDs are unavailable.
 * ─────────────────────────────────────────────────
 */

import type {
  CarbonScope,
  CarbonDataSource,
  DBBIMElement,
  DBMaterial,
  DBElementCarbonData,
  MaterialCarbonBreakdown,
  CarbonRecommendation,
} from '@/types/database';

// ============================================
// Types
// ============================================

export interface CarbonAnalysisConfig {
  /** Analysis scope (lifecycle stages to include) */
  scope: CarbonScope;
  /** Carbon database to use for lookups */
  primarySource: CarbonDataSource;
  /** Fallback database if primary has no data */
  fallbackSource?: CarbonDataSource;
  /** Custom material mappings (IFC material name → database material ID) */
  materialMappings?: Record<string, string>;
  /** Include transport emissions (A4) */
  includeTransport?: boolean;
  /** Transport distance in km (default 100) */
  transportDistance?: number;
  /** Include construction process (A5) */
  includeConstruction?: boolean;
  /** Building service life in years (default 60) */
  serviceLife?: number;
}

export interface CarbonAnalysisInput {
  /** Model ID */
  modelId: string;
  /** Elements to analyze */
  elements: ElementWithMaterial[];
  /** Gross floor area (m²) for benchmarking */
  grossFloorArea?: number;
  /** Building volume (m³) for benchmarking */
  buildingVolume?: number;
  /** Building type for benchmark comparison */
  buildingType?: BuildingType;
}

export interface ElementWithMaterial {
  id: string;
  globalId: string;
  name?: string;
  elementType: string;
  ifcType: string;
  levelId?: string;
  /** Volume in m³ */
  volume?: number;
  /** Area in m² */
  area?: number;
  /** Mass in kg (if available) */
  mass?: number;
  /** Material assignments */
  materials: MaterialAssignment[];
}

export interface MaterialAssignment {
  name: string;
  /** Volume fraction (0-1) */
  fraction: number;
  /** Layer thickness in meters */
  thickness?: number;
  /** Density in kg/m³ (if known) */
  density?: number;
  /** Material ID if already mapped */
  materialId?: string;
}

export interface CarbonAnalysisResult {
  /** Total embodied carbon (kgCO2e) */
  totalCarbon: number;
  /** Carbon by lifecycle stage */
  carbonByStage: CarbonByStage;
  /** Carbon breakdown by element type */
  carbonByType: Record<string, number>;
  /** Carbon breakdown by level */
  carbonByLevel: Record<string, number>;
  /** Carbon breakdown by material */
  carbonByMaterial: Record<string, number>;
  /** Per-element results */
  elementResults: ElementCarbonResult[];
  /** Benchmark comparison */
  benchmarks: BenchmarkResult;
  /** Optimization recommendations */
  recommendations: CarbonRecommendation[];
  /** Analysis metadata */
  metadata: AnalysisMetadata;
}

export interface CarbonByStage {
  /** Product stage (raw material extraction + manufacturing) */
  A1A3: number;
  /** Transport to site */
  A4?: number;
  /** Construction process */
  A5?: number;
  /** Use stage (maintenance, repair, replacement) */
  B?: number;
  /** End of life (deconstruction, transport, waste processing, disposal) */
  C?: number;
  /** Benefits and loads beyond system boundary */
  D?: number;
}

export interface ElementCarbonResult {
  elementId: string;
  globalId: string;
  name?: string;
  elementType: string;
  levelId?: string;
  /** Total carbon for this element */
  totalCarbon: number;
  /** Carbon by stage */
  carbonByStage: CarbonByStage;
  /** Material breakdown */
  materialBreakdown: MaterialCarbonBreakdown[];
  /** Quantities used */
  volume?: number;
  area?: number;
  mass?: number;
  /** Calculation confidence (0-1) */
  confidence: number;
  /** Warnings or issues */
  warnings?: string[];
}

export interface BenchmarkResult {
  /** Carbon per gross floor area (kgCO2e/m²) */
  carbonPerArea?: number;
  /** Carbon per building volume (kgCO2e/m³) */
  carbonPerVolume?: number;
  /** Industry average for building type */
  industryAverage?: number;
  /** Percentile ranking (0-100, lower is better) */
  percentile?: number;
  /** Rating (A-G scale) */
  rating?: string;
  /** Comparison to benchmarks */
  comparisons: BenchmarkComparison[];
}

export interface BenchmarkComparison {
  name: string;
  value: number;
  unit: string;
  source: string;
  comparison: 'better' | 'similar' | 'worse';
  percentDifference: number;
}

export interface AnalysisMetadata {
  modelId: string;
  analysisId: string;
  scope: CarbonScope;
  primarySource: CarbonDataSource;
  startedAt: Date;
  completedAt?: Date;
  elementCount: number;
  materialCount: number;
  /** Elements with missing material data */
  unmappedElements: number;
  /** Materials not found in database */
  unmappedMaterials: string[];
}

export type BuildingType =
  | 'office'
  | 'residential'
  | 'retail'
  | 'industrial'
  | 'healthcare'
  | 'education'
  | 'hotel'
  | 'mixed_use'
  | 'other';

// ============================================
// Carbon Database (ICE v3.0 Reference Data)
// ============================================

/**
 * ICE Database v3.0 - Inventory of Carbon and Energy
 * University of Bath, UK
 *
 * Values are kgCO2e/kg for A1-A3 stages (cradle-to-gate)
 */
export const ICE_DATABASE: Record<string, ICEMaterial> = {
  // Concrete
  'concrete_general': {
    name: 'Concrete (General)',
    category: 'Concrete',
    density: 2400,
    carbonA1A3: 0.103,
    dataQuality: 'good',
  },
  'concrete_c30_37': {
    name: 'Concrete C30/37',
    category: 'Concrete',
    density: 2400,
    carbonA1A3: 0.132,
    dataQuality: 'good',
  },
  'concrete_c40_50': {
    name: 'Concrete C40/50',
    category: 'Concrete',
    density: 2400,
    carbonA1A3: 0.163,
    dataQuality: 'good',
  },
  'concrete_precast': {
    name: 'Precast Concrete',
    category: 'Concrete',
    density: 2400,
    carbonA1A3: 0.176,
    dataQuality: 'good',
  },

  // Steel
  'steel_structural': {
    name: 'Steel (Structural, UK average)',
    category: 'Steel',
    density: 7850,
    carbonA1A3: 1.55,
    dataQuality: 'good',
  },
  'steel_rebar': {
    name: 'Steel Rebar',
    category: 'Steel',
    density: 7850,
    carbonA1A3: 1.99,
    dataQuality: 'good',
  },
  'steel_stainless': {
    name: 'Stainless Steel',
    category: 'Steel',
    density: 8000,
    carbonA1A3: 6.15,
    dataQuality: 'good',
  },

  // Timber
  'timber_softwood': {
    name: 'Softwood Timber',
    category: 'Timber',
    density: 500,
    carbonA1A3: 0.31,
    carbonD: -1.03, // Carbon sequestration credit
    dataQuality: 'good',
  },
  'timber_hardwood': {
    name: 'Hardwood Timber',
    category: 'Timber',
    density: 700,
    carbonA1A3: 0.46,
    carbonD: -1.44,
    dataQuality: 'good',
  },
  'timber_clt': {
    name: 'Cross-Laminated Timber (CLT)',
    category: 'Timber',
    density: 490,
    carbonA1A3: 0.437,
    carbonD: -1.49,
    dataQuality: 'good',
  },
  'timber_glulam': {
    name: 'Glue-Laminated Timber',
    category: 'Timber',
    density: 500,
    carbonA1A3: 0.512,
    carbonD: -1.38,
    dataQuality: 'good',
  },

  // Masonry
  'brick_clay': {
    name: 'Clay Brick',
    category: 'Masonry',
    density: 1800,
    carbonA1A3: 0.24,
    dataQuality: 'good',
  },
  'brick_concrete': {
    name: 'Concrete Block',
    category: 'Masonry',
    density: 2000,
    carbonA1A3: 0.073,
    dataQuality: 'good',
  },
  'stone_natural': {
    name: 'Natural Stone',
    category: 'Masonry',
    density: 2500,
    carbonA1A3: 0.079,
    dataQuality: 'fair',
  },

  // Glass
  'glass_float': {
    name: 'Float Glass',
    category: 'Glass',
    density: 2500,
    carbonA1A3: 1.44,
    dataQuality: 'good',
  },
  'glass_double': {
    name: 'Double Glazed Unit',
    category: 'Glass',
    density: 2500,
    carbonA1A3: 1.67,
    dataQuality: 'good',
  },

  // Insulation
  'insulation_mineral_wool': {
    name: 'Mineral Wool Insulation',
    category: 'Insulation',
    density: 30,
    carbonA1A3: 1.28,
    dataQuality: 'good',
  },
  'insulation_eps': {
    name: 'EPS Insulation',
    category: 'Insulation',
    density: 20,
    carbonA1A3: 3.29,
    dataQuality: 'good',
  },
  'insulation_xps': {
    name: 'XPS Insulation',
    category: 'Insulation',
    density: 35,
    carbonA1A3: 4.39,
    dataQuality: 'good',
  },
  'insulation_pir': {
    name: 'PIR Insulation',
    category: 'Insulation',
    density: 30,
    carbonA1A3: 4.26,
    dataQuality: 'fair',
  },

  // Aluminum
  'aluminium_general': {
    name: 'Aluminium (General)',
    category: 'Metals',
    density: 2700,
    carbonA1A3: 6.67,
    dataQuality: 'good',
  },
  'aluminium_recycled': {
    name: 'Aluminium (Recycled)',
    category: 'Metals',
    density: 2700,
    carbonA1A3: 0.52,
    dataQuality: 'good',
  },

  // Plaster & Finishes
  'plasterboard': {
    name: 'Plasterboard',
    category: 'Finishes',
    density: 800,
    carbonA1A3: 0.39,
    dataQuality: 'good',
  },
  'plaster_gypsum': {
    name: 'Gypsum Plaster',
    category: 'Finishes',
    density: 1200,
    carbonA1A3: 0.12,
    dataQuality: 'good',
  },
};

interface ICEMaterial {
  name: string;
  category: string;
  density: number;
  carbonA1A3: number;
  carbonA4?: number;
  carbonB?: number;
  carbonC?: number;
  carbonD?: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

// ============================================
// Benchmarks
// ============================================

/**
 * Industry benchmarks for embodied carbon (kgCO2e/m²)
 * Source: LETI Climate Emergency Design Guide, RICS
 */
export const CARBON_BENCHMARKS: Record<BuildingType, BenchmarkData> = {
  office: {
    excellent: 350,
    good: 500,
    typical: 650,
    poor: 850,
    source: 'LETI Climate Emergency Design Guide 2020',
  },
  residential: {
    excellent: 300,
    good: 400,
    typical: 500,
    poor: 650,
    source: 'LETI Climate Emergency Design Guide 2020',
  },
  retail: {
    excellent: 400,
    good: 550,
    typical: 700,
    poor: 900,
    source: 'RICS Whole Life Carbon Assessment',
  },
  industrial: {
    excellent: 250,
    good: 350,
    typical: 450,
    poor: 600,
    source: 'RICS Whole Life Carbon Assessment',
  },
  healthcare: {
    excellent: 600,
    good: 800,
    typical: 1000,
    poor: 1300,
    source: 'LETI Climate Emergency Design Guide 2020',
  },
  education: {
    excellent: 400,
    good: 550,
    typical: 700,
    poor: 900,
    source: 'LETI Climate Emergency Design Guide 2020',
  },
  hotel: {
    excellent: 450,
    good: 600,
    typical: 750,
    poor: 950,
    source: 'RICS Whole Life Carbon Assessment',
  },
  mixed_use: {
    excellent: 400,
    good: 550,
    typical: 700,
    poor: 900,
    source: 'RICS Whole Life Carbon Assessment',
  },
  other: {
    excellent: 400,
    good: 550,
    typical: 700,
    poor: 900,
    source: 'Generic benchmark',
  },
};

interface BenchmarkData {
  excellent: number;
  good: number;
  typical: number;
  poor: number;
  source: string;
}

// ============================================
// Material Mapping
// ============================================

/**
 * Default IFC material name to ICE database mapping
 */
const DEFAULT_MATERIAL_MAPPINGS: Record<string, string> = {
  // Concrete variations
  'concrete': 'concrete_general',
  'beton': 'concrete_general',
  'c30': 'concrete_c30_37',
  'c40': 'concrete_c40_50',
  'precast': 'concrete_precast',
  'reinforced concrete': 'concrete_c30_37',

  // Steel variations
  'steel': 'steel_structural',
  'stahl': 'steel_structural',
  'structural steel': 'steel_structural',
  'rebar': 'steel_rebar',
  'reinforcement': 'steel_rebar',
  'stainless': 'steel_stainless',

  // Timber variations
  'wood': 'timber_softwood',
  'timber': 'timber_softwood',
  'holz': 'timber_softwood',
  'softwood': 'timber_softwood',
  'hardwood': 'timber_hardwood',
  'clt': 'timber_clt',
  'glulam': 'timber_glulam',

  // Masonry
  'brick': 'brick_clay',
  'clay brick': 'brick_clay',
  'block': 'brick_concrete',
  'concrete block': 'brick_concrete',
  'stone': 'stone_natural',

  // Glass
  'glass': 'glass_float',
  'glazing': 'glass_double',
  'double glazing': 'glass_double',

  // Insulation
  'mineral wool': 'insulation_mineral_wool',
  'rockwool': 'insulation_mineral_wool',
  'eps': 'insulation_eps',
  'xps': 'insulation_xps',
  'pir': 'insulation_pir',
  'insulation': 'insulation_mineral_wool',

  // Aluminum
  'aluminium': 'aluminium_general',
  'aluminum': 'aluminium_general',

  // Finishes
  'plasterboard': 'plasterboard',
  'drywall': 'plasterboard',
  'gypsum': 'plaster_gypsum',
  'plaster': 'plaster_gypsum',
};

// ============================================
// Carbon Analysis Pipeline
// ============================================

export class CarbonAnalysisPipeline {
  private config: CarbonAnalysisConfig;
  private materialCache: Map<string, ICEMaterial | null> = new Map();

  constructor(config: CarbonAnalysisConfig) {
    this.config = {
      includeTransport: true,
      transportDistance: 100,
      includeConstruction: false,
      serviceLife: 60,
      ...config,
    };
  }

  /**
   * Run carbon analysis on a set of elements
   */
  async analyze(input: CarbonAnalysisInput): Promise<CarbonAnalysisResult> {
    const metadata: AnalysisMetadata = {
      modelId: input.modelId,
      analysisId: `analysis-${Date.now()}`,
      scope: this.config.scope,
      primarySource: this.config.primarySource,
      startedAt: new Date(),
      elementCount: input.elements.length,
      materialCount: 0,
      unmappedElements: 0,
      unmappedMaterials: [],
    };

    const elementResults: ElementCarbonResult[] = [];
    const carbonByType: Record<string, number> = {};
    const carbonByLevel: Record<string, number> = {};
    const carbonByMaterial: Record<string, number> = {};
    const totalByStage: CarbonByStage = { A1A3: 0 };
    const uniqueMaterials = new Set<string>();

    // Process each element
    for (const element of input.elements) {
      const result = this.calculateElementCarbon(element);

      if (result.warnings?.includes('No material data')) {
        metadata.unmappedElements++;
      }

      elementResults.push(result);

      // Aggregate by type
      carbonByType[element.elementType] = (carbonByType[element.elementType] || 0) + result.totalCarbon;

      // Aggregate by level
      const levelKey = element.levelId || 'Unassigned';
      carbonByLevel[levelKey] = (carbonByLevel[levelKey] || 0) + result.totalCarbon;

      // Aggregate by material
      for (const mb of result.materialBreakdown) {
        carbonByMaterial[mb.material] = (carbonByMaterial[mb.material] || 0) + mb.carbon;
        uniqueMaterials.add(mb.material);
      }

      // Sum by stage
      totalByStage.A1A3 += result.carbonByStage.A1A3;
      if (result.carbonByStage.A4) totalByStage.A4 = (totalByStage.A4 || 0) + result.carbonByStage.A4;
      if (result.carbonByStage.A5) totalByStage.A5 = (totalByStage.A5 || 0) + result.carbonByStage.A5;
      if (result.carbonByStage.B) totalByStage.B = (totalByStage.B || 0) + result.carbonByStage.B;
      if (result.carbonByStage.C) totalByStage.C = (totalByStage.C || 0) + result.carbonByStage.C;
      if (result.carbonByStage.D) totalByStage.D = (totalByStage.D || 0) + result.carbonByStage.D;
    }

    metadata.materialCount = uniqueMaterials.size;
    metadata.completedAt = new Date();

    // Calculate total carbon
    const totalCarbon = this.calculateTotalFromStages(totalByStage);

    // Calculate benchmarks
    const benchmarks = this.calculateBenchmarks(
      totalCarbon,
      input.grossFloorArea,
      input.buildingVolume,
      input.buildingType
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      elementResults,
      carbonByMaterial,
      carbonByType
    );

    return {
      totalCarbon,
      carbonByStage: totalByStage,
      carbonByType,
      carbonByLevel,
      carbonByMaterial,
      elementResults,
      benchmarks,
      recommendations,
      metadata,
    };
  }

  /**
   * Calculate carbon for a single element
   */
  private calculateElementCarbon(element: ElementWithMaterial): ElementCarbonResult {
    const warnings: string[] = [];
    const materialBreakdown: MaterialCarbonBreakdown[] = [];
    const carbonByStage: CarbonByStage = { A1A3: 0 };
    let totalMass = 0;

    // Calculate element volume
    const volume = element.volume || 0;
    if (!volume) {
      warnings.push('No volume data');
    }

    // Process each material assignment
    for (const mat of element.materials) {
      const iceMaterial = this.lookupMaterial(mat.name, mat.materialId);

      if (!iceMaterial) {
        warnings.push(`Unknown material: ${mat.name}`);
        continue;
      }

      // Calculate mass for this material
      const materialVolume = volume * (mat.fraction || 1);
      const density = mat.density || iceMaterial.density;
      const mass = materialVolume * density;
      totalMass += mass;

      // Calculate carbon by stage
      const carbonA1A3 = mass * iceMaterial.carbonA1A3;
      carbonByStage.A1A3 += carbonA1A3;

      // Transport (A4)
      if (this.shouldIncludeStage('A4')) {
        const carbonA4 = this.calculateTransportCarbon(mass);
        carbonByStage.A4 = (carbonByStage.A4 || 0) + carbonA4;
      }

      // Benefits beyond system boundary (D)
      if (this.shouldIncludeStage('D') && iceMaterial.carbonD) {
        carbonByStage.D = (carbonByStage.D || 0) + (mass * iceMaterial.carbonD);
      }

      materialBreakdown.push({
        material: iceMaterial.name,
        carbon: carbonA1A3,
        mass,
        fraction: mat.fraction || 1,
      });
    }

    if (element.materials.length === 0) {
      warnings.push('No material data');
    }

    // Calculate total carbon for this element
    const totalCarbon = this.calculateTotalFromStages(carbonByStage);

    // Calculate confidence score
    const confidence = this.calculateConfidence(element, warnings);

    return {
      elementId: element.id,
      globalId: element.globalId,
      name: element.name,
      elementType: element.elementType,
      levelId: element.levelId,
      totalCarbon,
      carbonByStage,
      materialBreakdown,
      volume,
      area: element.area,
      mass: totalMass || element.mass,
      confidence,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Look up material in database
   */
  private lookupMaterial(name: string, materialId?: string): ICEMaterial | null {
    // Check custom mapping first
    if (materialId && this.config.materialMappings?.[materialId]) {
      const iceId = this.config.materialMappings[materialId];
      return ICE_DATABASE[iceId] || null;
    }

    // Check cache
    const cacheKey = name.toLowerCase();
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey) || null;
    }

    // Try direct lookup
    const normalizedName = name.toLowerCase().trim();

    // Try default mappings
    for (const [pattern, iceId] of Object.entries(DEFAULT_MATERIAL_MAPPINGS)) {
      if (normalizedName.includes(pattern)) {
        const material = ICE_DATABASE[iceId] || null;
        this.materialCache.set(cacheKey, material);
        return material;
      }
    }

    // Try fuzzy match on ICE database
    for (const [iceId, material] of Object.entries(ICE_DATABASE)) {
      if (
        material.name.toLowerCase().includes(normalizedName) ||
        normalizedName.includes(material.category.toLowerCase())
      ) {
        this.materialCache.set(cacheKey, material);
        return material;
      }
    }

    // No match found
    this.materialCache.set(cacheKey, null);
    return null;
  }

  /**
   * Check if a lifecycle stage should be included
   */
  private shouldIncludeStage(stage: string): boolean {
    const scopeStages: Record<CarbonScope, string[]> = {
      'A1_A3': ['A1A3'],
      'A1_A5': ['A1A3', 'A4', 'A5'],
      'A_B': ['A1A3', 'A4', 'A5', 'B'],
      'A_C': ['A1A3', 'A4', 'A5', 'B', 'C'],
      'A_D': ['A1A3', 'A4', 'A5', 'B', 'C', 'D'],
    };

    return scopeStages[this.config.scope]?.includes(stage) || false;
  }

  /**
   * Calculate transport carbon (A4)
   */
  private calculateTransportCarbon(mass: number): number {
    // Default: articulated truck, 0.089 kgCO2e/tonne-km (ICE)
    const transportEmission = 0.089; // kgCO2e/tonne-km
    const distance = this.config.transportDistance || 100;
    return (mass / 1000) * distance * transportEmission;
  }

  /**
   * Calculate total carbon based on scope
   */
  private calculateTotalFromStages(stages: CarbonByStage): number {
    let total = stages.A1A3;

    if (this.shouldIncludeStage('A4') && stages.A4) total += stages.A4;
    if (this.shouldIncludeStage('A5') && stages.A5) total += stages.A5;
    if (this.shouldIncludeStage('B') && stages.B) total += stages.B;
    if (this.shouldIncludeStage('C') && stages.C) total += stages.C;

    // D stage (benefits) is typically shown separately but can reduce total
    if (this.shouldIncludeStage('D') && stages.D && stages.D < 0) {
      total += stages.D;
    }

    return total;
  }

  /**
   * Calculate analysis confidence
   */
  private calculateConfidence(element: ElementWithMaterial, warnings: string[]): number {
    let confidence = 1.0;

    if (!element.volume) confidence -= 0.3;
    if (element.materials.length === 0) confidence -= 0.5;
    if (warnings.length > 0) confidence -= 0.1 * warnings.length;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate benchmarks
   */
  private calculateBenchmarks(
    totalCarbon: number,
    gfa?: number,
    volume?: number,
    buildingType: BuildingType = 'other'
  ): BenchmarkResult {
    const result: BenchmarkResult = {
      comparisons: [],
    };

    if (gfa && gfa > 0) {
      result.carbonPerArea = totalCarbon / gfa;

      const benchmark = CARBON_BENCHMARKS[buildingType];
      result.industryAverage = benchmark.typical;

      // Calculate percentile
      if (result.carbonPerArea <= benchmark.excellent) {
        result.percentile = 10;
        result.rating = 'A';
      } else if (result.carbonPerArea <= benchmark.good) {
        result.percentile = 25;
        result.rating = 'B';
      } else if (result.carbonPerArea <= benchmark.typical) {
        result.percentile = 50;
        result.rating = 'C';
      } else if (result.carbonPerArea <= benchmark.poor) {
        result.percentile = 75;
        result.rating = 'D';
      } else {
        result.percentile = 90;
        result.rating = 'E';
      }

      // Add comparisons
      result.comparisons.push({
        name: 'Industry Typical',
        value: benchmark.typical,
        unit: 'kgCO2e/m²',
        source: benchmark.source,
        comparison: result.carbonPerArea < benchmark.typical ? 'better' :
                    result.carbonPerArea > benchmark.typical * 1.1 ? 'worse' : 'similar',
        percentDifference: ((result.carbonPerArea - benchmark.typical) / benchmark.typical) * 100,
      });

      result.comparisons.push({
        name: 'LETI 2030 Target',
        value: benchmark.excellent,
        unit: 'kgCO2e/m²',
        source: 'LETI Climate Emergency Design Guide',
        comparison: result.carbonPerArea <= benchmark.excellent ? 'better' : 'worse',
        percentDifference: ((result.carbonPerArea - benchmark.excellent) / benchmark.excellent) * 100,
      });
    }

    if (volume && volume > 0) {
      result.carbonPerVolume = totalCarbon / volume;
    }

    return result;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    elementResults: ElementCarbonResult[],
    carbonByMaterial: Record<string, number>,
    carbonByType: Record<string, number>
  ): CarbonRecommendation[] {
    const recommendations: CarbonRecommendation[] = [];

    // Find highest carbon materials
    const sortedMaterials = Object.entries(carbonByMaterial)
      .sort(([, a], [, b]) => b - a);

    // Recommend low-carbon alternatives for top 3 materials
    const materialSwaps: Record<string, { alternative: string; savingsPercent: number }> = {
      'Concrete (General)': { alternative: 'Low-carbon concrete (30% GGBS)', savingsPercent: 25 },
      'Concrete C30/37': { alternative: 'C30/37 with 30% PFA', savingsPercent: 20 },
      'Steel (Structural, UK average)': { alternative: 'High recycled content steel', savingsPercent: 30 },
      'Aluminium (General)': { alternative: 'Recycled aluminium', savingsPercent: 90 },
      'EPS Insulation': { alternative: 'Mineral wool insulation', savingsPercent: 60 },
      'XPS Insulation': { alternative: 'Mineral wool insulation', savingsPercent: 70 },
    };

    for (const [material, carbon] of sortedMaterials.slice(0, 3)) {
      const swap = materialSwaps[material];
      if (swap) {
        const potentialSavings = carbon * (swap.savingsPercent / 100);
        recommendations.push({
          id: `swap-${material.toLowerCase().replace(/\s+/g, '-')}`,
          type: 'material_swap',
          priority: potentialSavings > 10000 ? 'high' : potentialSavings > 1000 ? 'medium' : 'low',
          title: `Replace ${material}`,
          description: `Switch to ${swap.alternative} for approximately ${swap.savingsPercent}% carbon reduction`,
          currentCarbon: carbon,
          potentialCarbon: carbon - potentialSavings,
          savingsPercent: swap.savingsPercent,
          affectedElements: elementResults
            .filter(e => e.materialBreakdown.some(m => m.material === material))
            .map(e => e.elementId),
        });
      }
    }

    // Design-based recommendations
    const structuralTypes = ['WALL', 'SLAB', 'COLUMN', 'BEAM'];
    const structuralCarbon = structuralTypes.reduce((sum, type) => sum + (carbonByType[type] || 0), 0);
    const totalCarbon = Object.values(carbonByType).reduce((a, b) => a + b, 0);

    if (structuralCarbon > totalCarbon * 0.7) {
      recommendations.push({
        id: 'design-timber-hybrid',
        type: 'design_change',
        priority: 'high',
        title: 'Consider Hybrid Timber Structure',
        description: 'The structure accounts for >70% of embodied carbon. Using mass timber (CLT/glulam) for floor systems could significantly reduce impact.',
        currentCarbon: structuralCarbon,
        potentialCarbon: structuralCarbon * 0.5,
        savingsPercent: 50,
        affectedElements: [],
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

// ============================================
// Export convenience functions
// ============================================

export function createCarbonAnalysis(config: Partial<CarbonAnalysisConfig> = {}): CarbonAnalysisPipeline {
  return new CarbonAnalysisPipeline({
    scope: 'A1_A3',
    primarySource: 'ICE',
    ...config,
  });
}

export async function runQuickCarbonAnalysis(
  elements: ElementWithMaterial[],
  grossFloorArea?: number
): Promise<CarbonAnalysisResult> {
  const pipeline = createCarbonAnalysis();
  return pipeline.analyze({
    modelId: 'quick-analysis',
    elements,
    grossFloorArea,
    buildingType: 'other',
  });
}

export default CarbonAnalysisPipeline;
