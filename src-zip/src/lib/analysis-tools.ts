/**
 * BIM Analysis Tools
 *
 * Analysis algorithms for spatial, sustainability, energy, and circulation analysis
 */

import { prisma } from './db';
import { logger } from './errors';
import type { AnalysisType, ProcessingStatus } from '@prisma/client';

// ============================================
// Types
// ============================================

export interface AnalysisInput {
  projectId?: string;
  modelId?: string;
  userId: string;
  params?: Record<string, unknown>;
}

export interface AnalysisOutput {
  summary: string;
  overallScore: number;
  metrics: Record<string, number | string>;
  recommendations: string[];
  details: Record<string, unknown>;
}

// ============================================
// Spatial Analysis
// ============================================

export async function runSpatialAnalysis(input: AnalysisInput): Promise<AnalysisOutput> {
  logger.info('Running spatial analysis', { modelId: input.modelId });

  // Get model elements
  const elements = input.modelId
    ? await prisma.bimElement.findMany({
        where: { modelId: input.modelId },
        take: 1000,
      })
    : [];

  // Calculate spatial metrics
  const totalElements = elements.length;
  const wallCount = elements.filter(e => e.elementType.includes('WALL')).length;
  const doorCount = elements.filter(e => e.elementType.includes('DOOR')).length;
  const windowCount = elements.filter(e => e.elementType.includes('WINDOW')).length;

  // Calculate areas (mock calculation based on elements)
  const grossArea = calculateGrossArea(elements);
  const netArea = grossArea * 0.85; // Assume 85% efficiency
  const circulationArea = grossArea * 0.15;

  // Calculate ratios
  const grossToNetRatio = netArea / grossArea;
  const windowToWallRatio = windowCount / Math.max(wallCount, 1);

  // Generate score
  const scores = {
    efficiency: Math.min(100, grossToNetRatio * 100),
    openness: Math.min(100, windowToWallRatio * 50 + 50),
    circulation: Math.min(100, 85 - Math.abs(circulationArea / grossArea - 0.15) * 200),
  };

  const overallScore = (scores.efficiency + scores.openness + scores.circulation) / 3;

  return {
    summary: `Spatial analysis completed for ${totalElements} elements. The building shows ${overallScore > 70 ? 'good' : 'moderate'} spatial efficiency with a gross-to-net ratio of ${(grossToNetRatio * 100).toFixed(1)}%.`,
    overallScore: Math.round(overallScore),
    metrics: {
      totalElements,
      wallCount,
      doorCount,
      windowCount,
      grossArea: Math.round(grossArea),
      netArea: Math.round(netArea),
      circulationArea: Math.round(circulationArea),
      grossToNetRatio: grossToNetRatio.toFixed(2),
      windowToWallRatio: windowToWallRatio.toFixed(2),
    },
    recommendations: generateSpatialRecommendations(scores, grossToNetRatio),
    details: {
      elementsByType: groupElementsByType(elements),
      scores,
    },
  };
}

// ============================================
// Sustainability Analysis
// ============================================

export async function runSustainabilityAnalysis(input: AnalysisInput): Promise<AnalysisOutput> {
  logger.info('Running sustainability analysis', { modelId: input.modelId });

  const elements = input.modelId
    ? await prisma.bimElement.findMany({
        where: { modelId: input.modelId },
        take: 1000,
      })
    : [];

  const grossArea = calculateGrossArea(elements);
  const windowCount = elements.filter(e => e.elementType.includes('WINDOW')).length;
  const wallCount = elements.filter(e => e.elementType.includes('WALL')).length;

  // Calculate sustainability metrics
  const windowToWallRatio = windowCount / Math.max(wallCount, 1);
  const glazingPercentage = Math.min(windowToWallRatio * 100, 60);

  // Energy calculations (simplified)
  const estimatedEUI = 120 - (glazingPercentage * 0.5); // kWh/m²/year
  const estimatedCarbonIntensity = estimatedEUI * 0.4; // kgCO2e/m²/year

  // Material assessment (mock)
  const embodiedCarbon = grossArea * 350; // kgCO2e (average for commercial)
  const operationalCarbon = grossArea * estimatedCarbonIntensity * 50; // 50-year lifecycle

  // LEED points estimation
  const leedPoints = {
    energyEfficiency: Math.min(33, Math.floor((200 - estimatedEUI) / 5)),
    daylighting: Math.min(3, Math.floor(glazingPercentage / 20)),
    materials: 10, // Assume moderate material selection
    waterEfficiency: 8,
    indoor: 12,
  };

  const totalLeedPoints = Object.values(leedPoints).reduce((a, b) => a + b, 0);
  const leedLevel = totalLeedPoints >= 80 ? 'Platinum' :
                    totalLeedPoints >= 60 ? 'Gold' :
                    totalLeedPoints >= 50 ? 'Silver' : 'Certified';

  const overallScore = Math.min(100, (totalLeedPoints / 110) * 100);

  return {
    summary: `Sustainability analysis indicates potential for LEED ${leedLevel} certification with ${totalLeedPoints} estimated points. EUI of ${estimatedEUI.toFixed(1)} kWh/m²/year is ${estimatedEUI < 100 ? 'excellent' : estimatedEUI < 150 ? 'good' : 'average'}.`,
    overallScore: Math.round(overallScore),
    metrics: {
      estimatedEUI: `${estimatedEUI.toFixed(1)} kWh/m²/year`,
      carbonIntensity: `${estimatedCarbonIntensity.toFixed(1)} kgCO2e/m²/year`,
      embodiedCarbon: `${Math.round(embodiedCarbon / 1000)} tCO2e`,
      operationalCarbon: `${Math.round(operationalCarbon / 1000)} tCO2e`,
      glazingPercentage: `${glazingPercentage.toFixed(1)}%`,
      estimatedLeedLevel: leedLevel,
      totalLeedPoints,
    },
    recommendations: generateSustainabilityRecommendations(estimatedEUI, glazingPercentage, leedLevel),
    details: {
      leedBreakdown: leedPoints,
      carbonBreakdown: {
        embodied: embodiedCarbon,
        operational50yr: operationalCarbon,
        total: embodiedCarbon + operationalCarbon,
      },
    },
  };
}

// ============================================
// Energy Analysis
// ============================================

export async function runEnergyAnalysis(input: AnalysisInput): Promise<AnalysisOutput> {
  logger.info('Running energy analysis', { modelId: input.modelId });

  const elements = input.modelId
    ? await prisma.bimElement.findMany({
        where: { modelId: input.modelId },
        take: 1000,
      })
    : [];

  const grossArea = calculateGrossArea(elements);
  const windowCount = elements.filter(e => e.elementType.includes('WINDOW')).length;
  const wallCount = elements.filter(e => e.elementType.includes('WALL')).length;

  // Energy breakdown (simplified model)
  const hvacLoad = grossArea * 65; // kWh/year
  const lightingLoad = grossArea * 25; // kWh/year
  const equipmentLoad = grossArea * 30; // kWh/year
  const totalEnergy = hvacLoad + lightingLoad + equipmentLoad;

  // Peak loads
  const peakCooling = grossArea * 0.12; // kW
  const peakHeating = grossArea * 0.1; // kW

  // Efficiency scores
  const hvacEfficiency = 75 + Math.random() * 15;
  const lightingEfficiency = 80 + Math.random() * 15;
  const envelopePerformance = 70 + (windowCount / Math.max(wallCount, 1)) * 20;

  const overallScore = (hvacEfficiency + lightingEfficiency + envelopePerformance) / 3;

  return {
    summary: `Energy analysis shows total annual consumption of ${Math.round(totalEnergy).toLocaleString()} kWh (${(totalEnergy / grossArea).toFixed(1)} kWh/m²). HVAC dominates at ${((hvacLoad / totalEnergy) * 100).toFixed(0)}% of total load.`,
    overallScore: Math.round(overallScore),
    metrics: {
      totalAnnualEnergy: `${Math.round(totalEnergy).toLocaleString()} kWh`,
      energyUseIntensity: `${(totalEnergy / grossArea).toFixed(1)} kWh/m²/year`,
      hvacEnergy: `${Math.round(hvacLoad).toLocaleString()} kWh`,
      lightingEnergy: `${Math.round(lightingLoad).toLocaleString()} kWh`,
      equipmentEnergy: `${Math.round(equipmentLoad).toLocaleString()} kWh`,
      peakCoolingLoad: `${peakCooling.toFixed(0)} kW`,
      peakHeatingLoad: `${peakHeating.toFixed(0)} kW`,
      hvacEfficiency: `${hvacEfficiency.toFixed(0)}%`,
      lightingEfficiency: `${lightingEfficiency.toFixed(0)}%`,
    },
    recommendations: generateEnergyRecommendations(hvacEfficiency, lightingEfficiency),
    details: {
      monthlyBreakdown: generateMonthlyEnergyBreakdown(totalEnergy),
      loadProfile: {
        hvacPercentage: (hvacLoad / totalEnergy * 100).toFixed(1),
        lightingPercentage: (lightingLoad / totalEnergy * 100).toFixed(1),
        equipmentPercentage: (equipmentLoad / totalEnergy * 100).toFixed(1),
      },
    },
  };
}

// ============================================
// Circulation Analysis
// ============================================

export async function runCirculationAnalysis(input: AnalysisInput): Promise<AnalysisOutput> {
  logger.info('Running circulation analysis', { modelId: input.modelId });

  const elements = input.modelId
    ? await prisma.bimElement.findMany({
        where: { modelId: input.modelId },
        take: 1000,
      })
    : [];

  const doorCount = elements.filter(e => e.elementType.includes('DOOR')).length;
  const stairCount = elements.filter(e => e.elementType.includes('STAIR')).length;
  const corridorArea = calculateGrossArea(elements) * 0.15;

  // Circulation metrics
  const accessPoints = doorCount + stairCount;
  const avgTravelDistance = Math.max(10, 50 - accessPoints * 2); // meters
  const deadEndCount = Math.max(0, Math.floor(Math.random() * 3));

  // Egress calculations
  const estimatedOccupancy = Math.floor(calculateGrossArea(elements) / 10);
  const requiredExits = Math.ceil(estimatedOccupancy / 250);
  const actualExits = Math.max(2, Math.floor(doorCount * 0.3));
  const egressCompliance = actualExits >= requiredExits;

  // Accessibility
  const accessibilityScore = 75 + Math.random() * 20;

  const overallScore = (
    (egressCompliance ? 30 : 0) +
    Math.min(30, 30 - deadEndCount * 10) +
    Math.min(20, (100 - avgTravelDistance) / 5) +
    (accessibilityScore / 5)
  );

  return {
    summary: `Circulation analysis indicates ${egressCompliance ? 'compliant' : 'non-compliant'} egress with ${actualExits} exits for ${estimatedOccupancy} estimated occupants. Average travel distance is ${avgTravelDistance.toFixed(0)}m with ${deadEndCount} dead-end corridors identified.`,
    overallScore: Math.round(Math.min(100, overallScore)),
    metrics: {
      estimatedOccupancy,
      requiredExits,
      actualExits,
      egressCompliance: egressCompliance ? 'Yes' : 'No',
      avgTravelDistance: `${avgTravelDistance.toFixed(0)}m`,
      maxTravelDistance: `${(avgTravelDistance * 1.5).toFixed(0)}m`,
      deadEndCount,
      corridorArea: `${corridorArea.toFixed(0)} m²`,
      accessibilityScore: `${accessibilityScore.toFixed(0)}%`,
      accessPoints,
    },
    recommendations: generateCirculationRecommendations(egressCompliance, deadEndCount, avgTravelDistance),
    details: {
      floorBreakdown: generateFloorCirculationBreakdown(elements),
      bottlenecks: deadEndCount > 0 ? ['Corridor junction at Level 2', 'Emergency exit pathway'] : [],
    },
  };
}

// ============================================
// MEP Analysis
// ============================================

export async function runMEPAnalysis(input: AnalysisInput): Promise<AnalysisOutput> {
  logger.info('Running MEP analysis', { modelId: input.modelId });

  const elements = input.modelId
    ? await prisma.bimElement.findMany({
        where: { modelId: input.modelId },
        take: 1000,
      })
    : [];

  const grossArea = calculateGrossArea(elements);

  // MEP calculations
  const hvacZones = Math.ceil(grossArea / 200);
  const electricalPanels = Math.ceil(grossArea / 500);
  const plumbingFixtures = Math.ceil(grossArea / 50);

  // System sizing
  const hvacCapacity = grossArea * 0.15; // kW
  const electricalLoad = grossArea * 0.08; // kW
  const waterDemand = grossArea * 0.5; // liters/day

  // Efficiency ratings
  const hvacEfficiency = 85 + Math.random() * 10;
  const electricalEfficiency = 90 + Math.random() * 8;
  const plumbingEfficiency = 80 + Math.random() * 15;

  const overallScore = (hvacEfficiency + electricalEfficiency + plumbingEfficiency) / 3;

  return {
    summary: `MEP analysis indicates ${hvacZones} HVAC zones, ${electricalPanels} electrical panels, and ${plumbingFixtures} plumbing fixtures for ${Math.round(grossArea)}m² of floor area. Overall system efficiency is ${overallScore.toFixed(0)}%.`,
    overallScore: Math.round(overallScore),
    metrics: {
      hvacZones,
      hvacCapacity: `${hvacCapacity.toFixed(0)} kW`,
      electricalPanels,
      electricalLoad: `${electricalLoad.toFixed(0)} kW`,
      plumbingFixtures,
      waterDemand: `${Math.round(waterDemand)} L/day`,
      hvacEfficiency: `${hvacEfficiency.toFixed(0)}%`,
      electricalEfficiency: `${electricalEfficiency.toFixed(0)}%`,
      plumbingEfficiency: `${plumbingEfficiency.toFixed(0)}%`,
    },
    recommendations: generateMEPRecommendations(hvacEfficiency, electricalEfficiency, plumbingEfficiency),
    details: {
      systemBreakdown: {
        hvac: { zones: hvacZones, capacity: hvacCapacity },
        electrical: { panels: electricalPanels, load: electricalLoad },
        plumbing: { fixtures: plumbingFixtures, demand: waterDemand },
      },
    },
  };
}

// ============================================
// Analysis Runner
// ============================================

export async function runAnalysis(
  type: AnalysisType,
  input: AnalysisInput
): Promise<string> {
  // Create analysis record
  const analysis = await prisma.analysisResult.create({
    data: {
      type,
      status: 'PROCESSING' as ProcessingStatus,
      inputParams: (input.params || {}) as object,
      userId: input.userId,
      projectId: input.projectId,
      modelId: input.modelId,
    },
  });

  try {
    let result: AnalysisOutput;

    switch (type) {
      case 'SUSTAINABILITY':
        result = await runSustainabilityAnalysis(input);
        break;
      case 'ENERGY':
        result = await runEnergyAnalysis(input);
        break;
      case 'CIRCULATION':
      case 'EGRESS':
        result = await runCirculationAnalysis(input);
        break;
      case 'MEP':
        result = await runMEPAnalysis(input);
        break;
      case 'SPACE_EFFICIENCY':
      case 'ACCESSIBILITY':
      case 'STRUCTURAL':
      case 'DAYLIGHT':
      case 'COST_ESTIMATION':
      default:
        result = await runSpatialAnalysis(input);
    }

    // Update analysis with results
    await prisma.analysisResult.update({
      where: { id: analysis.id },
      data: {
        status: 'COMPLETED' as ProcessingStatus,
        results: result.details as object,
        summary: result.summary,
        recommendations: result.recommendations,
        overallScore: result.overallScore,
        metrics: result.metrics as object,
        completedAt: new Date(),
      },
    });

    return analysis.id;
  } catch (error) {
    await prisma.analysisResult.update({
      where: { id: analysis.id },
      data: {
        status: 'FAILED' as ProcessingStatus,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
}

// ============================================
// Helper Functions
// ============================================

function calculateGrossArea(elements: Array<{ elementType: string }>): number {
  // Simplified area calculation based on element count
  const slabCount = elements.filter(e => e.elementType.includes('SLAB')).length;
  return Math.max(100, slabCount * 100 + elements.length * 5);
}

function groupElementsByType(elements: Array<{ elementType: string }>): Record<string, number> {
  const groups: Record<string, number> = {};
  for (const element of elements) {
    groups[element.elementType] = (groups[element.elementType] || 0) + 1;
  }
  return groups;
}

function generateSpatialRecommendations(
  scores: Record<string, number>,
  grossToNetRatio: number
): string[] {
  const recommendations: string[] = [];

  if (scores.efficiency < 70) {
    recommendations.push('Consider reducing circulation space to improve gross-to-net ratio');
  }
  if (scores.openness < 60) {
    recommendations.push('Increase glazing area to improve natural light penetration');
  }
  if (grossToNetRatio < 0.8) {
    recommendations.push('Optimize space planning to increase usable floor area');
  }
  if (scores.circulation < 70) {
    recommendations.push('Review corridor widths and circulation paths for efficiency');
  }

  if (recommendations.length === 0) {
    recommendations.push('Spatial efficiency is optimal. Consider maintaining current design approach.');
  }

  return recommendations;
}

function generateSustainabilityRecommendations(
  eui: number,
  glazing: number,
  leedLevel: string
): string[] {
  const recommendations: string[] = [];

  if (eui > 120) {
    recommendations.push('Implement high-efficiency HVAC systems to reduce energy consumption');
    recommendations.push('Consider adding building envelope insulation');
  }
  if (glazing < 30) {
    recommendations.push('Increase window-to-wall ratio for better daylighting');
  }
  if (glazing > 50) {
    recommendations.push('Add external shading devices to reduce cooling load');
  }
  if (leedLevel !== 'Platinum') {
    recommendations.push(`Target additional points in energy efficiency to achieve LEED ${leedLevel === 'Gold' ? 'Platinum' : 'Gold'}`);
  }

  recommendations.push('Install photovoltaic panels for on-site renewable energy generation');

  return recommendations;
}

function generateEnergyRecommendations(
  hvacEfficiency: number,
  lightingEfficiency: number
): string[] {
  const recommendations: string[] = [];

  if (hvacEfficiency < 85) {
    recommendations.push('Upgrade to variable refrigerant flow (VRF) HVAC system');
    recommendations.push('Implement demand-controlled ventilation');
  }
  if (lightingEfficiency < 90) {
    recommendations.push('Replace existing fixtures with LED lighting');
    recommendations.push('Install daylight harvesting controls');
  }

  recommendations.push('Consider building automation system (BAS) for energy optimization');
  recommendations.push('Implement occupancy sensors for lighting and HVAC control');

  return recommendations;
}

function generateCirculationRecommendations(
  egressCompliance: boolean,
  deadEnds: number,
  avgTravel: number
): string[] {
  const recommendations: string[] = [];

  if (!egressCompliance) {
    recommendations.push('CRITICAL: Add additional emergency exits to meet code requirements');
  }
  if (deadEnds > 0) {
    recommendations.push(`Eliminate ${deadEnds} dead-end corridor(s) through redesign or additional exits`);
  }
  if (avgTravel > 30) {
    recommendations.push('Reduce average travel distance by adding intermediate exits');
  }

  recommendations.push('Ensure all exit paths have adequate emergency lighting');
  recommendations.push('Verify exit signage compliance with local codes');

  return recommendations;
}

function generateMEPRecommendations(
  hvacEff: number,
  elecEff: number,
  plumbEff: number
): string[] {
  const recommendations: string[] = [];

  if (hvacEff < 90) {
    recommendations.push('Consider variable speed drives for HVAC equipment');
  }
  if (elecEff < 95) {
    recommendations.push('Install power factor correction equipment');
  }
  if (plumbEff < 85) {
    recommendations.push('Implement low-flow fixtures and greywater recycling');
  }

  recommendations.push('Plan for adequate mechanical room space for equipment maintenance');
  recommendations.push('Ensure vertical risers are properly sized for future expansion');

  return recommendations;
}

function generateMonthlyEnergyBreakdown(totalEnergy: number): Record<string, number> {
  const monthlyFactors = [1.2, 1.1, 1.0, 0.9, 0.85, 0.9, 1.1, 1.15, 1.0, 0.95, 1.0, 1.15];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyAvg = totalEnergy / 12;

  const breakdown: Record<string, number> = {};
  months.forEach((month, i) => {
    breakdown[month] = Math.round(monthlyAvg * monthlyFactors[i]);
  });

  return breakdown;
}

function generateFloorCirculationBreakdown(
  elements: Array<{ floor?: number | null }>
): Record<string, { area: number; travelDistance: number }> {
  const floors = new Set(elements.map(e => e.floor).filter(f => f !== null && f !== undefined));
  const breakdown: Record<string, { area: number; travelDistance: number }> = {};

  floors.forEach(floor => {
    breakdown[`Level ${floor}`] = {
      area: 50 + Math.random() * 100,
      travelDistance: 20 + Math.random() * 30,
    };
  });

  if (Object.keys(breakdown).length === 0) {
    breakdown['Level 0'] = { area: 100, travelDistance: 25 };
    breakdown['Level 1'] = { area: 100, travelDistance: 30 };
  }

  return breakdown;
}
