/**
 * IFC Data Extraction Service
 *
 * Server-side utilities for extracting and analyzing IFC model data.
 * These functions work with model data passed from the client via projectContext.
 */

import type { BIMModel, BIMElement, BIMElementType, BuildingLevel } from '@/types';

// ============================================
// Types
// ============================================

export interface SpatialAnalysis {
  totalArea: number;
  totalVolume: number;
  netToGrossRatio: number;
  floorCount: number;
  averageFloorArea: number;
  circulationArea: number;
  spaceUtilization: number;
}

export interface ElementSummary {
  totalCount: number;
  byType: Record<BIMElementType, number>;
  byLevel: Record<string, number>;
  byMaterial: Record<string, number>;
}

export interface EgressAnalysis {
  occupantLoad: number;
  requiredExits: number;
  actualExits: number;
  maxTravelDistance: number;
  compliant: boolean;
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location?: string;
  }>;
}

export interface SustainabilityMetrics {
  estimatedEmbodiedCarbon: number; // kgCO2e
  carbonPerSquareMeter: number; // kgCO2e/m²
  energyUseIntensity: number; // kWh/m²/year (estimated)
  materialBreakdown: Array<{
    material: string;
    volume: number;
    estimatedCarbon: number;
    percentage: number;
  }>;
  recommendations: Array<{
    category: string;
    suggestion: string;
    potentialSavings: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

// ============================================
// Carbon Factors (ICE Database simplified)
// ============================================

const CARBON_FACTORS: Record<string, number> = {
  // kgCO2e per m³
  concrete: 240,
  steel: 1850,
  timber: -500, // Negative due to carbon sequestration
  brick: 230,
  glass: 1500,
  aluminum: 8240,
  gypsum: 120,
  insulation: 50,
  default: 150,
};

// Occupant load factors (m² per person)
const OCCUPANT_LOAD_FACTORS: Record<string, number> = {
  office: 10,
  retail: 3,
  assembly: 0.65,
  residential: 20,
  educational: 2,
  storage: 45,
  default: 10,
};

// ============================================
// Analysis Functions
// ============================================

/**
 * Analyze spatial characteristics of a building model
 */
export function analyzeSpatialStructure(model: BIMModel): SpatialAnalysis {
  const spaces = model.elements.filter(el => el.type === 'space');
  const slabs = model.elements.filter(el => el.type === 'slab');

  const totalArea = model.metadata.totalArea || 0;
  const totalVolume = model.metadata.totalVolume || totalArea * 3; // Estimate with 3m ceiling

  // Calculate circulation area (corridors, stairs, etc.)
  const circulationElements = model.elements.filter(
    el => el.type === 'stair' || el.name.toLowerCase().includes('corridor')
  );
  const circulationArea = circulationElements.length * 50; // Rough estimate

  const netArea = totalArea - circulationArea;
  const netToGrossRatio = totalArea > 0 ? netArea / totalArea : 0.85;

  return {
    totalArea,
    totalVolume,
    netToGrossRatio,
    floorCount: model.levels.length,
    averageFloorArea: model.levels.length > 0 ? totalArea / model.levels.length : totalArea,
    circulationArea,
    spaceUtilization: netToGrossRatio,
  };
}

/**
 * Summarize elements in the model
 */
export function summarizeElements(model: BIMModel): ElementSummary {
  const byType: Record<string, number> = {};
  const byLevel: Record<string, number> = {};
  const byMaterial: Record<string, number> = {};

  for (const element of model.elements) {
    // Count by type
    byType[element.type] = (byType[element.type] || 0) + 1;

    // Count by level
    const level = element.level || 'Unknown';
    byLevel[level] = (byLevel[level] || 0) + 1;

    // Count by material
    const material = element.material || 'Unknown';
    byMaterial[material] = (byMaterial[material] || 0) + 1;
  }

  return {
    totalCount: model.elements.length,
    byType: byType as Record<BIMElementType, number>,
    byLevel,
    byMaterial,
  };
}

/**
 * Analyze egress compliance
 */
export function analyzeEgress(
  model: BIMModel,
  buildingType: string = 'office'
): EgressAnalysis {
  const totalArea = model.metadata.totalArea || 0;
  const loadFactor = OCCUPANT_LOAD_FACTORS[buildingType] || OCCUPANT_LOAD_FACTORS.default;
  const occupantLoad = Math.ceil(totalArea / loadFactor);

  // Count exits (doors with exit-related names or exterior doors)
  const doors = model.elements.filter(el => el.type === 'door');
  const exitDoors = doors.filter(
    d =>
      d.name.toLowerCase().includes('exit') ||
      d.name.toLowerCase().includes('egress') ||
      d.properties?.isExterior === true
  );
  const actualExits = Math.max(exitDoors.length, 1); // Assume at least 1

  // Calculate required exits based on occupant load
  let requiredExits = 1;
  if (occupantLoad > 500) requiredExits = 3;
  else if (occupantLoad > 49) requiredExits = 2;

  // Estimate max travel distance (would need geometry for accurate calculation)
  const maxTravelDistance = Math.sqrt(totalArea) * 1.5;
  const allowedTravelDistance = 60; // meters, typical for sprinklered office

  const issues: EgressAnalysis['issues'] = [];

  if (actualExits < requiredExits) {
    issues.push({
      type: 'insufficient_exits',
      severity: 'critical',
      description: `Building has ${actualExits} exit(s) but requires ${requiredExits} based on occupant load of ${occupantLoad}`,
    });
  }

  if (maxTravelDistance > allowedTravelDistance) {
    issues.push({
      type: 'excessive_travel_distance',
      severity: 'high',
      description: `Estimated travel distance (${maxTravelDistance.toFixed(1)}m) may exceed allowed ${allowedTravelDistance}m`,
    });
  }

  // Check for dead-end corridors
  const stairs = model.elements.filter(el => el.type === 'stair');
  if (model.levels.length > 1 && stairs.length < model.levels.length - 1) {
    issues.push({
      type: 'insufficient_stairs',
      severity: 'medium',
      description: `Multi-story building may need additional stair cores for proper egress`,
    });
  }

  return {
    occupantLoad,
    requiredExits,
    actualExits,
    maxTravelDistance,
    compliant: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
  };
}

/**
 * Calculate sustainability metrics
 */
export function calculateSustainability(model: BIMModel): SustainabilityMetrics {
  const totalArea = model.metadata.totalArea || 100;
  const elements = model.elements;

  // Estimate volumes by element type
  const volumeByMaterial: Record<string, number> = {};

  for (const element of elements) {
    const material = element.material?.toLowerCase() || 'default';
    // Rough volume estimates based on element type
    let volume = 1; // m³

    if (element.type === 'wall') {
      volume = 0.2 * 3 * 5; // thickness * height * length estimate
    } else if (element.type === 'slab') {
      volume = 0.3 * 50; // thickness * area per slab
    } else if (element.type === 'column') {
      volume = 0.4 * 0.4 * 3; // cross-section * height
    } else if (element.type === 'beam') {
      volume = 0.3 * 0.5 * 6; // cross-section * length
    }

    volumeByMaterial[material] = (volumeByMaterial[material] || 0) + volume;
  }

  // Calculate carbon by material
  const materialBreakdown: SustainabilityMetrics['materialBreakdown'] = [];
  let totalCarbon = 0;

  for (const [material, volume] of Object.entries(volumeByMaterial)) {
    const factor = CARBON_FACTORS[material] || CARBON_FACTORS.default;
    const carbon = volume * factor;
    totalCarbon += carbon;

    materialBreakdown.push({
      material,
      volume,
      estimatedCarbon: Math.round(carbon),
      percentage: 0, // Will calculate after total
    });
  }

  // Calculate percentages
  for (const item of materialBreakdown) {
    item.percentage = totalCarbon > 0 ? (item.estimatedCarbon / totalCarbon) * 100 : 0;
  }

  // Sort by carbon contribution
  materialBreakdown.sort((a, b) => b.estimatedCarbon - a.estimatedCarbon);

  // Energy use intensity estimate (based on building type)
  const energyUseIntensity = 120; // kWh/m²/year typical office

  // Generate recommendations
  const recommendations: SustainabilityMetrics['recommendations'] = [];

  if (materialBreakdown.find(m => m.material === 'concrete' && m.percentage > 30)) {
    recommendations.push({
      category: 'Materials',
      suggestion: 'Consider low-carbon concrete alternatives (GGBS, PFA)',
      potentialSavings: '20-40% reduction in concrete carbon',
      priority: 'high',
    });
  }

  if (materialBreakdown.find(m => m.material === 'steel' && m.volume > 50)) {
    recommendations.push({
      category: 'Materials',
      suggestion: 'Specify recycled steel content (>70%)',
      potentialSavings: '30-50% reduction in steel carbon',
      priority: 'high',
    });
  }

  recommendations.push({
    category: 'Energy',
    suggestion: 'Install high-efficiency HVAC systems and LED lighting',
    potentialSavings: '15-25% reduction in operational energy',
    priority: 'medium',
  });

  recommendations.push({
    category: 'Renewables',
    suggestion: 'Consider rooftop solar PV installation',
    potentialSavings: '10-30% of electricity demand',
    priority: 'medium',
  });

  return {
    estimatedEmbodiedCarbon: Math.round(totalCarbon),
    carbonPerSquareMeter: totalArea > 0 ? Math.round(totalCarbon / totalArea) : 0,
    energyUseIntensity,
    materialBreakdown,
    recommendations,
  };
}

/**
 * Get elements by type from model
 */
export function getElementsByType(
  model: BIMModel,
  type: BIMElementType
): BIMElement[] {
  return model.elements.filter(el => el.type === type);
}

/**
 * Get elements by level
 */
export function getElementsByLevel(
  model: BIMModel,
  levelId: string
): BIMElement[] {
  return model.elements.filter(el => el.level === levelId);
}

/**
 * Find elements by name pattern
 */
export function findElementsByName(
  model: BIMModel,
  pattern: string
): BIMElement[] {
  const regex = new RegExp(pattern, 'i');
  return model.elements.filter(el => regex.test(el.name));
}

/**
 * Get level statistics
 */
export function getLevelStatistics(model: BIMModel): Array<{
  level: BuildingLevel;
  elementCount: number;
  elementsByType: Record<string, number>;
}> {
  return model.levels.map(level => {
    const elements = model.elements.filter(el => el.level === level.id);
    const elementsByType: Record<string, number> = {};

    for (const el of elements) {
      elementsByType[el.type] = (elementsByType[el.type] || 0) + 1;
    }

    return {
      level,
      elementCount: elements.length,
      elementsByType,
    };
  });
}

/**
 * Generate a natural language summary of the model
 */
export function generateModelSummary(model: BIMModel): string {
  const spatial = analyzeSpatialStructure(model);
  const elements = summarizeElements(model);
  const sustainability = calculateSustainability(model);

  const typeDescriptions = Object.entries(elements.byType)
    .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
    .join(', ');

  return `
**${model.name}**

📐 **Spatial Summary:**
- Total Area: ${spatial.totalArea.toLocaleString()}m²
- Floors: ${spatial.floorCount}
- Net-to-Gross Ratio: ${(spatial.netToGrossRatio * 100).toFixed(1)}%

🏗️ **Elements:** ${elements.totalCount} total
${typeDescriptions}

🌱 **Sustainability Estimate:**
- Embodied Carbon: ${sustainability.estimatedEmbodiedCarbon.toLocaleString()} kgCO2e
- Carbon Intensity: ${sustainability.carbonPerSquareMeter} kgCO2e/m²
- Energy Use Intensity: ${sustainability.energyUseIntensity} kWh/m²/year

${sustainability.recommendations.length > 0 ? '**Top Recommendations:**\n' + sustainability.recommendations.slice(0, 3).map(r => `- ${r.suggestion}`).join('\n') : ''}
  `.trim();
}
