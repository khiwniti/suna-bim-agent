/**
 * Carbon Analysis Pipeline
 * 
 * Orchestrates the complete carbon analysis workflow:
 * 1. Input validation
 * 2. Material breakdown analysis
 * 3. Emission calculations
 * 4. Report generation
 */

import type {
  BIMModel,
  BIMElement,
  MaterialCategory,
  CarbonScope,
  AnalysisStatus,
  MaterialCarbonBreakdown,
  CarbonRecommendation,
} from './types';
import { calculateEmbodiedCarbon, calculateScopeBreakdown, identifyHotspots } from './calculator';
import { mapIFCMaterials, extractMaterialsFromIFC } from './ifc-material-mapper';

// =============================================================================
// PIPELINE CONFIGURATION
// =============================================================================

export interface AnalysisPipelineConfig {
  projectId: string;
  projectName: string;
  
  // Analysis scope
  scope: CarbonScope;
  includeTransport: boolean;
  includeConstruction: boolean;
  includeEndOfLife: boolean;
  
  // Regional settings
  projectRegion: string;
  transportDistance?: number; // km to site
  
  // Certification targets
  targetCertifications?: ('EDGE' | 'TREES' | 'T-VER')[];
  edgeTarget?: 'certified' | 'advanced' | 'zero_carbon';
  treesTarget?: 'certified' | 'silver' | 'gold' | 'platinum';
  
  // Comparison
  baselineProject?: string;
  
  // Output options
  generateReport: boolean;
  reportFormat?: 'summary' | 'detailed' | 'bank';
}

// =============================================================================
// PIPELINE RESULT
// =============================================================================

export interface AnalysisPipelineResult {
  projectId: string;
  status: AnalysisStatus;
  
  // Summary metrics
  totalEmbodiedCarbon: number; // kgCO2e
  carbonPerSquareMeter: number; // kgCO2e/m²
  grossFloorArea: number; // m²
  
  // Scope breakdown
  scopeBreakdown: {
    A1_A3: number; // Product stage
    A4_A5: number; // Construction stage
    B?: number; // Use stage
    C?: number; // End of life
  };
  
  // Material breakdown
  materialBreakdown: MaterialCarbonBreakdown[];
  
  // Category breakdown
  categoryBreakdown: {
    category: MaterialCategory;
    totalCarbon: number;
    percentage: number;
    elements: number;
  }[];
  
  // Hotspots
  hotspots: {
    elementId: string;
    elementName: string;
    carbon: number;
    percentage: number;
    category: MaterialCategory;
  }[];
  
  // Recommendations
  recommendations: CarbonRecommendation[];
  
  // Certification assessment
  certifications?: {
    edge?: {
      eligible: boolean;
      level?: string;
      reduction: number;
    };
    trees?: {
      eligible: boolean;
      level?: string;
      points: number;
    };
    tver?: {
      eligible: boolean;
      credits: number;
    };
  };
  
  // Comparison with baseline
  comparison?: {
    baselineCarbon: number;
    reduction: number;
    reductionPercent: number;
  };
  
  // Metadata
  analyzedAt: Date;
  processingTimeMs: number;
}

// =============================================================================
// INPUT VALIDATION
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateAnalysisInput(
  model: BIMModel,
  config: AnalysisPipelineConfig
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!model.id) {
    errors.push('Model ID is required');
  }
  
  if (!model.elements || model.elements.length === 0) {
    errors.push('Model must contain at least one element');
  }
  
  if (!model.metadata?.totalArea && !model.metadata?.totalVolume) {
    warnings.push('Model metadata missing total area/volume - carbon intensity metrics will be unavailable');
  }
  
  const elementsWithoutMaterials = model.elements.filter(e => !e.material);
  if (elementsWithoutMaterials.length > 0) {
    warnings.push(`${elementsWithoutMaterials.length} elements have no material assigned`);
  }
  
  if (config.includeTransport && !config.transportDistance) {
    warnings.push('Transport enabled but no distance specified - using default 100km');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// MATERIAL BREAKDOWN ANALYSIS
// =============================================================================

export interface MaterialBreakdownResult {
  materials: Map<string, {
    name: string;
    mass: number;
    carbon: number;
    elements: string[];
  }>;
  totalMass: number;
  totalCarbon: number;
}

export function analyzeMaterialBreakdown(
  elements: BIMElement[]
): MaterialBreakdownResult {
  const materials = new Map<string, {
    name: string;
    mass: number;
    carbon: number;
    elements: string[];
  }>();
  
  let totalMass = 0;
  let totalCarbon = 0;
  
  for (const element of elements) {
    const materialName = element.material || 'Unknown';
    const extraction = extractMaterialsFromIFC(element);
    
    for (const extracted of extraction.materials) {
      const existing = materials.get(extracted.name) || {
        name: extracted.name,
        mass: 0,
        carbon: 0,
        elements: [],
      };
      
      const mass = extracted.estimatedMass || 0;
      const carbon = calculateEmbodiedCarbon({
        material: extracted.name,
        mass,
        scope: 'A1_A3',
      });
      
      existing.mass += mass;
      existing.carbon += carbon;
      existing.elements.push(element.id);
      
      materials.set(extracted.name, existing);
      totalMass += mass;
      totalCarbon += carbon;
    }
  }
  
  return {
    materials,
    totalMass,
    totalCarbon,
  };
}

// =============================================================================
// CATEGORY BREAKDOWN
// =============================================================================

export interface CategoryBreakdownResult {
  categories: Map<MaterialCategory, {
    totalCarbon: number;
    elements: number;
  }>;
  totalCarbon: number;
}

function inferCategory(material: string): MaterialCategory {
  const lowerMaterial = material.toLowerCase();
  
  if (lowerMaterial.includes('concrete') || lowerMaterial.includes('คอนกรีต')) {
    return 'concrete';
  }
  if (lowerMaterial.includes('steel') || lowerMaterial.includes('เหล็ก')) {
    return 'steel';
  }
  if (lowerMaterial.includes('cement') || lowerMaterial.includes('ปูน')) {
    return 'cement';
  }
  if (lowerMaterial.includes('brick') || lowerMaterial.includes('block') || lowerMaterial.includes('อิฐ') || lowerMaterial.includes('บล็อก')) {
    return 'brick';
  }
  if (lowerMaterial.includes('glass') || lowerMaterial.includes('กระจก')) {
    return 'glass';
  }
  if (lowerMaterial.includes('aluminum') || lowerMaterial.includes('อลูมิเนียม')) {
    return 'aluminum';
  }
  if (lowerMaterial.includes('timber') || lowerMaterial.includes('wood') || lowerMaterial.includes('ไม้')) {
    return 'timber';
  }
  if (lowerMaterial.includes('aggregate') || lowerMaterial.includes('sand') || lowerMaterial.includes('หิน') || lowerMaterial.includes('ทราย')) {
    return 'aggregate';
  }
  
  return 'other';
}

export function analyzeCategoryBreakdown(
  elements: BIMElement[]
): CategoryBreakdownResult {
  const categories = new Map<MaterialCategory, {
    totalCarbon: number;
    elements: number;
  }>();
  
  let totalCarbon = 0;
  
  for (const element of elements) {
    const material = element.material || 'Unknown';
    const category = inferCategory(material);
    const extraction = extractMaterialsFromIFC(element);
    
    for (const extracted of extraction.materials) {
      const mass = extracted.estimatedMass || 0;
      const carbon = calculateEmbodiedCarbon({
        material: extracted.name,
        mass,
        scope: 'A1_A3',
      });
      
      const existing = categories.get(category) || {
        totalCarbon: 0,
        elements: 0,
      };
      
      existing.totalCarbon += carbon;
      existing.elements += 1;
      
      categories.set(category, existing);
      totalCarbon += carbon;
    }
  }
  
  return {
    categories,
    totalCarbon,
  };
}

// =============================================================================
// MAIN PIPELINE
// =============================================================================

export async function runCarbonAnalysis(
  model: BIMModel,
  config: AnalysisPipelineConfig
): Promise<AnalysisPipelineResult> {
  const startTime = Date.now();
  
  const validation = validateAnalysisInput(model, config);
  if (!validation.valid) {
    return {
      projectId: config.projectId,
      status: 'failed',
      totalEmbodiedCarbon: 0,
      carbonPerSquareMeter: 0,
      grossFloorArea: model.metadata?.totalArea || 0,
      scopeBreakdown: { A1_A3: 0, A4_A5: 0 },
      materialBreakdown: [],
      categoryBreakdown: [],
      hotspots: [],
      recommendations: [],
      analyzedAt: new Date(),
      processingTimeMs: Date.now() - startTime,
    };
  }
  
  const materialResult = analyzeMaterialBreakdown(model.elements);
  const categoryResult = analyzeCategoryBreakdown(model.elements);
  
  const materialBreakdown: MaterialCarbonBreakdown[] = Array.from(
    materialResult.materials.entries()
  ).map(([name, data]) => ({
    material: name,
    carbon: data.carbon,
    mass: data.mass,
    fraction: data.mass / materialResult.totalMass,
  }));
  
  const categoryBreakdown = Array.from(
    categoryResult.categories.entries()
  ).map(([category, data]) => ({
    category,
    totalCarbon: data.totalCarbon,
    percentage: (data.totalCarbon / categoryResult.totalCarbon) * 100,
    elements: data.elements,
  }));
  
  const grossFloorArea = model.metadata?.totalArea || 0;
  const totalEmbodiedCarbon = materialResult.totalCarbon;
  const carbonPerSquareMeter = grossFloorArea > 0
    ? totalEmbodiedCarbon / grossFloorArea
    : 0;
  
  const hotspots = identifyHotspots(
    model.elements.map(e => ({
      id: e.id,
      name: e.name || e.id,
      carbon: calculateEmbodiedCarbon({
        material: e.material || 'Unknown',
        mass: extractMaterialsFromIFC(e).materials[0]?.estimatedMass || 0,
        scope: 'A1_A3',
      }),
      category: inferCategory(e.material || 'Unknown'),
    }))
  );
  
  const recommendations = generateRecommendations(
    categoryBreakdown,
    hotspots,
    config
  );
  
  return {
    projectId: config.projectId,
    status: 'completed',
    totalEmbodiedCarbon,
    carbonPerSquareMeter,
    grossFloorArea,
    scopeBreakdown: {
      A1_A3: totalEmbodiedCarbon * 0.95,
      A4_A5: totalEmbodiedCarbon * 0.05,
    },
    materialBreakdown,
    categoryBreakdown,
    hotspots: hotspots.slice(0, 10).map(h => ({
      elementId: h.id,
      elementName: h.name,
      carbon: h.carbon,
      percentage: (h.carbon / totalEmbodiedCarbon) * 100,
      category: h.category,
    })),
    recommendations,
    analyzedAt: new Date(),
    processingTimeMs: Date.now() - startTime,
  };
}

// =============================================================================
// RECOMMENDATION GENERATION
// =============================================================================

function generateRecommendations(
  categoryBreakdown: { category: MaterialCategory; totalCarbon: number; percentage: number }[],
  hotspots: { id: string; name: string; carbon: number; category: MaterialCategory }[],
  config: AnalysisPipelineConfig
): CarbonRecommendation[] {
  const recommendations: CarbonRecommendation[] = [];
  
  const concreteCategory = categoryBreakdown.find(c => c.category === 'concrete');
  if (concreteCategory && concreteCategory.percentage > 50) {
    recommendations.push({
      id: 'rec-concrete-lowcarbon',
      type: 'material_swap',
      priority: 'high',
      title: 'Switch to Low-Carbon Concrete',
      description: 'Concrete accounts for over 50% of embodied carbon. Consider using low-carbon concrete alternatives like CPAC Low Carbon or adding supplementary cementitious materials (SCMs).',
      currentCarbon: concreteCategory.totalCarbon,
      potentialCarbon: concreteCategory.totalCarbon * 0.8,
      savingsPercent: 20,
      affectedElements: hotspots
        .filter(h => h.category === 'concrete')
        .slice(0, 5)
        .map(h => h.id),
    });
  }
  
  const steelCategory = categoryBreakdown.find(c => c.category === 'steel');
  if (steelCategory && steelCategory.percentage > 20) {
    recommendations.push({
      id: 'rec-steel-recycled',
      type: 'material_swap',
      priority: 'high',
      title: 'Use Recycled Steel',
      description: 'Consider EAF (Electric Arc Furnace) recycled steel which has 30% lower embodied carbon than conventional steel.',
      currentCarbon: steelCategory.totalCarbon,
      potentialCarbon: steelCategory.totalCarbon * 0.7,
      savingsPercent: 30,
      affectedElements: hotspots
        .filter(h => h.category === 'steel')
        .slice(0, 5)
        .map(h => h.id),
    });
  }
  
  if (config.targetCertifications?.includes('EDGE')) {
    const totalCarbon = categoryBreakdown.reduce((sum, c) => sum + c.totalCarbon, 0);
    if (totalCarbon > 0) {
      recommendations.push({
        id: 'rec-edge-optimization',
        type: 'optimization',
        priority: 'medium',
        title: 'EDGE Certification Optimization',
        description: 'To achieve EDGE certification, target 20% reduction in embodied carbon through material optimization and efficient design.',
        currentCarbon: totalCarbon,
        potentialCarbon: totalCarbon * 0.8,
        savingsPercent: 20,
        affectedElements: [],
      });
    }
  }
  
  return recommendations;
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

export function generateCarbonReport(
  result: AnalysisPipelineResult,
  format: 'summary' | 'detailed' | 'bank' = 'summary'
): string {
  const lines: string[] = [];
  
  lines.push('# Carbon Analysis Report');
  lines.push(`**Project ID:** ${result.projectId}`);
  lines.push(`**Analysis Date:** ${result.analyzedAt.toISOString()}`);
  lines.push('');
  
  lines.push('## Summary');
  lines.push(`- **Total Embodied Carbon:** ${result.totalEmbodiedCarbon.toFixed(0)} kgCO2e`);
  lines.push(`- **Carbon Intensity:** ${result.carbonPerSquareMeter.toFixed(1)} kgCO2e/m²`);
  lines.push(`- **Gross Floor Area:** ${result.grossFloorArea.toFixed(0)} m²`);
  lines.push('');
  
  lines.push('## Category Breakdown');
  for (const cat of result.categoryBreakdown) {
    lines.push(`- **${cat.category}:** ${cat.totalCarbon.toFixed(0)} kgCO2e (${cat.percentage.toFixed(1)}%)`);
  }
  lines.push('');
  
  if (format === 'detailed' || format === 'bank') {
    lines.push('## Top Hotspots');
    for (const hotspot of result.hotspots.slice(0, 5)) {
      lines.push(`- **${hotspot.elementName}:** ${hotspot.carbon.toFixed(0)} kgCO2e (${hotspot.percentage.toFixed(1)}%)`);
    }
    lines.push('');
    
    lines.push('## Recommendations');
    for (const rec of result.recommendations) {
      lines.push(`### ${rec.title}`);
      lines.push(`- Priority: ${rec.priority}`);
      lines.push(`- Potential savings: ${rec.savingsPercent}%`);
      lines.push(`- ${rec.description}`);
      lines.push('');
    }
  }
  
  if (format === 'bank') {
    lines.push('## Certification Eligibility');
    if (result.certifications?.edge) {
      lines.push(`- **EDGE:** ${result.certifications.edge.eligible ? 'Eligible' : 'Not eligible'}`);
      if (result.certifications.edge.level) {
        lines.push(`  - Level: ${result.certifications.edge.level}`);
      }
    }
    lines.push('');
    
    lines.push('## Financial Impact');
    lines.push(`- Estimated carbon reduction potential: ${result.recommendations.reduce((sum, r) => sum + r.savingsPercent, 0)}%`);
    lines.push('- Recommended for green financing consideration');
  }
  
  return lines.join('\n');
}
