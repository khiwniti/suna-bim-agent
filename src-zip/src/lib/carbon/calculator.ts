/**
 * Carbon Calculation Engine
 *
 * Core calculation functions for embodied carbon analysis
 * Implements Edge certification formulas and TGO CFP methodology
 *
 * Focus: 80% Embodied Carbon (30% of Total Building Carbon)
 */

import type {
  BOQCarbonItem,
  BOQCarbonAnalysis,
  EdgeCalculation,
  EdgeImprovement,
  TransportEmission,
  MaterialCategory,
  EmissionUnit,
} from './types';
import {
  TGO_CFP_EMISSION_FACTORS,
  THAI_MATERIALS,
  getEmissionFactor,
  getMaterial,
  getLowCarbonAlternatives,
} from './emission-factors';
import { TGO_TRANSPORT_EMISSION_FACTORS } from './types';

// =============================================================================
// BOQ CARBON CALCULATION
// =============================================================================

/**
 * BOQ input item for carbon calculation
 */
export interface BOQInput {
  id: string;
  description: string;
  descriptionTh?: string;
  quantity: number;
  unit: string;
  materialId?: string;         // Reference to THAI_MATERIALS
  emissionFactorId?: string;   // Reference to TGO_CFP_EMISSION_FACTORS
  category?: MaterialCategory;

  // Optional transport info
  transportDistance?: number;  // km from production to site
  transportVehicle?: 'van_4wheel' | 'truck_6wheel' | 'truck_10wheel' | 'truck_18wheel';
  transportLoadPercent?: number;
}

/**
 * Calculate embodied carbon for a single BOQ item
 */
export function calculateItemCarbon(item: BOQInput): BOQCarbonItem {
  // Get emission factor
  let emissionFactor = 0;
  let unit: EmissionUnit = 'kgCO2e/kg';

  if (item.emissionFactorId) {
    const ef = getEmissionFactor(item.emissionFactorId);
    if (ef) {
      emissionFactor = ef.emissionFactor;
      unit = ef.unit;
    }
  } else if (item.materialId) {
    const material = getMaterial(item.materialId);
    if (material) {
      emissionFactor = material.emissionFactor;
      unit = material.unit;
    }
  }

  // Calculate base carbon
  const embodiedCarbon = item.quantity * emissionFactor;

  // Calculate transport emissions (Scope 3)
  let transportEmissions = 0;
  if (item.transportDistance && item.transportVehicle) {
    const weight = estimateWeight(item);
    transportEmissions = calculateTransportEmissions({
      vehicleType: item.transportVehicle,
      loadingPercent: item.transportLoadPercent || 75,
      distance: item.transportDistance,
      weight: weight,
    });
  }

  // Scope breakdown (simplified)
  // Scope 1: Direct emissions (minimal for construction materials)
  // Scope 2: Electricity used in production
  // Scope 3: Supply chain, transport, etc. (largest)
  const scope1Emissions = embodiedCarbon * 0.05;  // ~5%
  const scope2Emissions = embodiedCarbon * 0.20;  // ~20%
  const scope3Emissions = embodiedCarbon * 0.75 + transportEmissions; // ~75% + transport

  return {
    id: `carbon-${item.id}`,
    boqItemId: item.id,
    description: item.description,
    descriptionTh: item.descriptionTh,
    quantity: item.quantity,
    unit: item.unit,
    unitCost: 0, // Cost not available in basic calculation
    materialId: item.materialId,
    materialCode: item.emissionFactorId,
    emissionFactorId: item.emissionFactorId || '',
    embodiedCarbon: embodiedCarbon + transportEmissions,
    carbonIntensity: emissionFactor,
    scope1Emissions,
    scope2Emissions,
    scope3Emissions,
    transportDistance: item.transportDistance,
    transportEmissions,
  };
}

/**
 * Calculate carbon for entire BOQ
 */
export function calculateBOQCarbon(
  projectId: string,
  projectName: string,
  items: BOQInput[],
  grossFloorArea: number
): BOQCarbonAnalysis {
  // Calculate each item
  const carbonItems = items.map(calculateItemCarbon);

  // Total carbon
  const totalEmbodiedCarbon = carbonItems.reduce(
    (sum, item) => sum + item.embodiedCarbon,
    0
  );

  // Carbon per square meter
  const carbonPerSquareMeter = grossFloorArea > 0
    ? totalEmbodiedCarbon / grossFloorArea
    : 0;

  // Category breakdown
  const categoryMap = new Map<MaterialCategory, number>();
  for (const item of items) {
    const category = item.category || 'other';
    const carbonItem = carbonItems.find((c) => c.boqItemId === item.id);
    if (carbonItem) {
      categoryMap.set(
        category,
        (categoryMap.get(category) || 0) + carbonItem.embodiedCarbon
      );
    }
  }

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, totalCarbon]) => ({
      category,
      totalCarbon,
      percentage: (totalCarbon / totalEmbodiedCarbon) * 100,
    }))
    .sort((a, b) => b.totalCarbon - a.totalCarbon);

  // Scope breakdown
  const scopeBreakdown = {
    scope1: carbonItems.reduce((sum, item) => sum + item.scope1Emissions, 0),
    scope2: carbonItems.reduce((sum, item) => sum + item.scope2Emissions, 0),
    scope3: carbonItems.reduce((sum, item) => sum + item.scope3Emissions, 0),
  };

  // Identify hotspots (top 10 contributors)
  const hotspots = carbonItems
    .map((item) => ({
      itemId: item.boqItemId,
      description: item.description,
      carbon: item.embodiedCarbon,
      percentage: (item.embodiedCarbon / totalEmbodiedCarbon) * 100,
    }))
    .sort((a, b) => b.carbon - a.carbon)
    .slice(0, 10);

  return {
    projectId,
    projectName,
    totalEmbodiedCarbon,
    carbonPerSquareMeter,
    grossFloorArea,
    categoryBreakdown,
    scopeBreakdown,
    hotspots,
    items: carbonItems,
    calculatedAt: new Date(),
    methodology: 'tgo_cfp',
  };
}

// =============================================================================
// EDGE CERTIFICATION CALCULATION
// =============================================================================

/**
 * Edge baseline emission factors (global defaults)
 * Used when Thai-specific baseline is not available
 */
const EDGE_BASELINE_FACTORS: Record<MaterialCategory, number> = {
  concrete: 300,      // kgCO2e/m³
  steel: 1.8,         // kgCO2e/kg
  cement: 0.95,       // kgCO2e/kg
  brick: 0.25,        // kgCO2e/kg
  aggregate: 0.01,    // kgCO2e/kg
  timber: 0.5,        // kgCO2e/kg
  glass: 1.5,         // kgCO2e/kg
  aluminum: 10.0,     // kgCO2e/kg
  insulation: 3.0,    // kgCO2e/kg
  roofing: 2.0,       // kgCO2e/kg
  flooring: 1.5,      // kgCO2e/kg
  MEP: 5.0,           // kgCO2e/kg (estimated)
  finishes: 2.0,      // kgCO2e/kg
  other: 2.0,         // kgCO2e/kg
};

/**
 * Calculate Edge certification eligibility
 */
export function calculateEdgeCertification(
  analysis: BOQCarbonAnalysis,
  items: BOQInput[]
): EdgeCalculation {
  // Calculate baseline carbon (using Edge global defaults)
  let baselineCarbon = 0;
  const materialBreakdown: EdgeCalculation['materialBreakdown'] = [];

  for (const item of items) {
    const category = item.category || 'other';
    const baselineEF = EDGE_BASELINE_FACTORS[category];
    const itemBaseline = item.quantity * baselineEF;
    baselineCarbon += itemBaseline;

    const carbonItem = analysis.items.find((c) => c.boqItemId === item.id);
    const optimized = carbonItem?.embodiedCarbon || 0;

    // Find or create category breakdown entry
    const existing = materialBreakdown.find((b) => b.category === category);
    if (existing) {
      existing.baseline += itemBaseline;
      existing.optimized += optimized;
      existing.savings += itemBaseline - optimized;
    } else {
      materialBreakdown.push({
        category,
        baseline: itemBaseline,
        optimized,
        savings: itemBaseline - optimized,
      });
    }
  }

  const optimizedCarbon = analysis.totalEmbodiedCarbon;
  const carbonReduction = ((baselineCarbon - optimizedCarbon) / baselineCarbon) * 100;

  // Determine certification level
  let certificationLevel: EdgeCalculation['certificationLevel'];
  let meetsEdgeThreshold = false;

  if (carbonReduction >= 100) {
    certificationLevel = 'edge_zero_carbon';
    meetsEdgeThreshold = true;
  } else if (carbonReduction >= 40) {
    certificationLevel = 'edge_advanced';
    meetsEdgeThreshold = true;
  } else if (carbonReduction >= 20) {
    certificationLevel = 'edge_certified';
    meetsEdgeThreshold = true;
  }

  // Generate improvement recommendations
  const improvements = generateEdgeImprovements(items, analysis);

  return {
    projectId: analysis.projectId,
    baselineCarbon,
    optimizedCarbon,
    carbonReduction,
    certificationLevel,
    meetsEdgeThreshold,
    improvements,
    materialBreakdown,
  };
}

/**
 * Generate Edge improvement recommendations
 */
function generateEdgeImprovements(
  items: BOQInput[],
  analysis: BOQCarbonAnalysis
): EdgeImprovement[] {
  const improvements: EdgeImprovement[] = [];

  for (const item of items) {
    const materialId = item.materialId;
    if (!materialId) continue;

    const alternatives = getLowCarbonAlternatives(materialId);
    const material = getMaterial(materialId);
    if (!material || alternatives.length === 0) continue;

    const carbonItem = analysis.items.find((c) => c.boqItemId === item.id);
    if (!carbonItem) continue;

    // Find best alternative
    const bestAlternative = alternatives.sort(
      (a, b) => b.carbonReduction - a.carbonReduction
    )[0];

    const carbonSavings =
      (carbonItem.embodiedCarbon * bestAlternative.carbonReduction) / 100;

    improvements.push({
      id: `improve-${item.id}`,
      category: material.category,
      currentMaterial: material.name,
      suggestedMaterial: bestAlternative.name,
      carbonSavings,
      percentageImprovement: bestAlternative.carbonReduction,
      implementationCost: bestAlternative.costImpact === 'lower'
        ? 'low'
        : bestAlternative.costImpact === 'higher'
          ? 'high'
          : 'medium',
      priority:
        bestAlternative.carbonReduction >= 25
          ? 'high'
          : bestAlternative.carbonReduction >= 15
            ? 'medium'
            : 'low',
    });
  }

  // Sort by carbon savings potential
  return improvements.sort((a, b) => b.carbonSavings - a.carbonSavings);
}

// =============================================================================
// TRANSPORT EMISSIONS
// =============================================================================

/**
 * Calculate transport emissions using TGO factors
 */
export function calculateTransportEmissions(
  input: Omit<TransportEmission, 'emissionFactor' | 'totalEmissions'>
): number {
  const factors = TGO_TRANSPORT_EMISSION_FACTORS[input.vehicleType];
  if (!factors) return 0;

  // Get emission factor based on loading percentage
  let loadKey = '100';
  if (input.loadingPercent <= 50) loadKey = '50';
  else if (input.loadingPercent <= 75) loadKey = '75';

  const emissionFactor = factors[loadKey] || 0.1;

  // Total emissions = EF × distance × weight (ton-km)
  return emissionFactor * input.distance * input.weight;
}

/**
 * Estimate weight for BOQ item (simplified)
 */
function estimateWeight(item: BOQInput): number {
  // Get material density estimates (ton/unit)
  const densities: Record<MaterialCategory, number> = {
    concrete: 2.4,      // ton/m³
    steel: 7.85,        // ton/m³ (but usually in kg, so 0.001 ton/kg)
    cement: 0.001,      // ton/kg
    brick: 0.001,       // ton/kg
    aggregate: 0.001,   // ton/kg
    timber: 0.0006,     // ton/kg
    glass: 0.0025,      // ton/kg
    aluminum: 0.0027,   // ton/kg
    insulation: 0.0003, // ton/kg
    roofing: 0.001,     // ton/kg
    flooring: 0.001,    // ton/kg
    MEP: 0.001,         // ton/kg
    finishes: 0.001,    // ton/kg
    other: 0.001,       // ton/kg
  };

  const category = item.category || 'other';
  const density = densities[category] || 0.001;

  // For volumetric units (m³), use density directly
  // For weight units (kg, ton), convert appropriately
  if (item.unit.includes('m3') || item.unit.includes('m³')) {
    return item.quantity * density;
  } else if (item.unit.includes('ton')) {
    return item.quantity;
  } else {
    // Assume kg
    return item.quantity * density;
  }
}

// =============================================================================
// SUMMARY & REPORTING
// =============================================================================

/**
 * Generate carbon summary for reporting
 */
export function generateCarbonSummary(analysis: BOQCarbonAnalysis): string {
  const lines: string[] = [
    `# Carbon Analysis Report: ${analysis.projectName}`,
    '',
    '## Summary',
    `- **Total Embodied Carbon:** ${formatCarbon(analysis.totalEmbodiedCarbon)}`,
    `- **Carbon Intensity:** ${analysis.carbonPerSquareMeter.toFixed(1)} kgCO2e/m²`,
    `- **Gross Floor Area:** ${analysis.grossFloorArea.toLocaleString()} m²`,
    '',
    '## Category Breakdown',
  ];

  for (const cat of analysis.categoryBreakdown) {
    lines.push(
      `- **${cat.category}:** ${formatCarbon(cat.totalCarbon)} (${cat.percentage.toFixed(1)}%)`
    );
  }

  lines.push('', '## Scope Breakdown (ISO 14064)');
  lines.push(`- **Scope 1 (Direct):** ${formatCarbon(analysis.scopeBreakdown.scope1)}`);
  lines.push(`- **Scope 2 (Energy):** ${formatCarbon(analysis.scopeBreakdown.scope2)}`);
  lines.push(`- **Scope 3 (Supply Chain):** ${formatCarbon(analysis.scopeBreakdown.scope3)}`);

  lines.push('', '## Top Carbon Hotspots');
  for (const hotspot of analysis.hotspots.slice(0, 5)) {
    lines.push(
      `- ${hotspot.description}: ${formatCarbon(hotspot.carbon)} (${hotspot.percentage.toFixed(1)}%)`
    );
  }

  return lines.join('\n');
}

/**
 * Format carbon value with appropriate units
 */
export function formatCarbon(kgCO2e: number): string {
  if (kgCO2e >= 1000000) {
    return `${(kgCO2e / 1000000).toFixed(2)} ktCO2e`;
  } else if (kgCO2e >= 1000) {
    return `${(kgCO2e / 1000).toFixed(2)} tCO2e`;
  } else {
    return `${kgCO2e.toFixed(2)} kgCO2e`;
  }
}

/**
 * Calculate comparison with Thai building benchmarks
 */
export function compareWithBenchmarks(carbonPerM2: number): {
  benchmark: string;
  difference: number;
  rating: 'excellent' | 'good' | 'average' | 'poor';
} {
  // Thai building carbon benchmarks (kgCO2e/m² for embodied carbon)
  const benchmarks = {
    lowRise: 350,       // Low-rise residential
    midRise: 450,       // Mid-rise residential
    highRise: 550,      // High-rise residential/commercial
    industrial: 400,    // Industrial buildings
  };

  const avgBenchmark = 450; // Average Thai building

  const difference = ((avgBenchmark - carbonPerM2) / avgBenchmark) * 100;

  let rating: 'excellent' | 'good' | 'average' | 'poor';
  if (difference >= 30) rating = 'excellent';
  else if (difference >= 15) rating = 'good';
  else if (difference >= 0) rating = 'average';
  else rating = 'poor';

  return {
    benchmark: `${avgBenchmark} kgCO2e/m² (Thai Average)`,
    difference,
    rating,
  };
}
