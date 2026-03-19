/**
 * TREES Certification Automation
 *
 * Thai's Rating of Energy and Environmental Sustainability (TREES)
 * Automated credit calculation for green building certification
 *
 * Focus Areas:
 * - MR (Materials & Resources) Credits - aligned with carbon analysis
 * - EA (Energy & Atmosphere) - energy efficiency estimation
 * - WE (Water Efficiency) - water consumption metrics
 *
 * Standards Reference:
 * - TREES-NC (New Construction)
 * - TREES-EB (Existing Buildings)
 * - TREES-CS (Core & Shell)
 * - Thai Green Building Institute (TGBI) Guidelines
 */

import type {
  BOQCarbonItem,
  TREESCertification,
  TREESCredits,
  TREESLevel,
} from './types';

// =============================================================================
// TREES CREDIT THRESHOLDS
// =============================================================================

/**
 * TREES certification levels and point requirements
 */
export const TREES_LEVELS: Record<TREESLevel, {
  minPoints: number;
  maxPoints: number;
  description: string;
  descriptionTh: string;
}> = {
  certified: {
    minPoints: 30,
    maxPoints: 39,
    description: 'TREES Certified',
    descriptionTh: 'TREES รับรอง',
  },
  silver: {
    minPoints: 40,
    maxPoints: 49,
    description: 'TREES Silver',
    descriptionTh: 'TREES เงิน',
  },
  gold: {
    minPoints: 50,
    maxPoints: 59,
    description: 'TREES Gold',
    descriptionTh: 'TREES ทอง',
  },
  platinum: {
    minPoints: 60,
    maxPoints: 85,
    description: 'TREES Platinum',
    descriptionTh: 'TREES แพลตตินัม',
  },
};

/**
 * TREES credit categories with maximum points
 */
export const TREES_CATEGORIES = {
  // Building Management (BM) - max 6 points
  BM: {
    name: 'Building Management',
    nameTh: 'การบริหารจัดการอาคาร',
    maxPoints: 6,
    credits: {
      BM1: { name: 'Green Building Education', max: 2 },
      BM2: { name: 'Building Management Plan', max: 2 },
      BM3: { name: 'Commissioning', max: 2 },
    },
  },
  // Site & Landscape (SL) - max 14 points
  SL: {
    name: 'Site & Landscape',
    nameTh: 'ผังบริเวณและภูมิทัศน์',
    maxPoints: 14,
    credits: {
      SL1: { name: 'Site Selection', max: 3 },
      SL2: { name: 'Urban Heat Island', max: 2 },
      SL3: { name: 'Open Space', max: 3 },
      SL4: { name: 'Stormwater Management', max: 3 },
      SL5: { name: 'Light Pollution Reduction', max: 3 },
    },
  },
  // Water Efficiency (WE) - max 6 points
  WE: {
    name: 'Water Efficiency',
    nameTh: 'การประหยัดน้ำ',
    maxPoints: 6,
    credits: {
      WE1: { name: 'Water Efficient Fixtures', max: 3 },
      WE2: { name: 'Rainwater/Greywater', max: 3 },
    },
  },
  // Energy & Atmosphere (EA) - max 20 points
  EA: {
    name: 'Energy & Atmosphere',
    nameTh: 'พลังงานและบรรยากาศ',
    maxPoints: 20,
    credits: {
      EA1: { name: 'Energy Efficiency', max: 15 },
      EA2: { name: 'Renewable Energy', max: 3 },
      EA3: { name: 'Ozone Protection', max: 2 },
    },
  },
  // Materials & Resources (MR) - max 13 points - PRIMARY FOCUS FOR CARBON
  MR: {
    name: 'Materials & Resources',
    nameTh: 'วัสดุและทรัพยากร',
    maxPoints: 13,
    credits: {
      MR1: { name: 'Construction Waste Management', max: 2 },
      MR2: { name: 'Reused Materials', max: 2 },
      MR3: { name: 'Building Reuse', max: 2 },
      MR4: { name: 'Recycled Content Materials', max: 3 },
      MR5: { name: 'Local Materials', max: 3 },
      MR6: { name: 'Certified Wood', max: 1 },
    },
  },
  // Indoor Environmental Quality (IE) - max 17 points
  IE: {
    name: 'Indoor Environmental Quality',
    nameTh: 'คุณภาพสิ่งแวดล้อมภายในอาคาร',
    maxPoints: 17,
    credits: {
      IE1: { name: 'Minimum IAQ Performance', max: 2 },
      IE2: { name: 'Environmental Tobacco Smoke', max: 2 },
      IE3: { name: 'Outdoor Air Delivery', max: 2 },
      IE4: { name: 'Low-Emitting Materials', max: 4 },
      IE5: { name: 'Indoor Chemical Control', max: 2 },
      IE6: { name: 'Thermal Comfort', max: 2 },
      IE7: { name: 'Daylighting & Views', max: 3 },
    },
  },
  // Green Innovation (GI) - max 5 points
  GI: {
    name: 'Green Innovation',
    nameTh: 'นวัตกรรมสีเขียว',
    maxPoints: 5,
    credits: {
      GI1: { name: 'Innovation Credits', max: 4 },
      GI2: { name: 'TREES Accredited Professional', max: 1 },
    },
  },
  // Prerequisites (PR) - required, no points
  PR: {
    name: 'Prerequisites',
    nameTh: 'ข้อกำหนดเบื้องต้น',
    maxPoints: 0,
    credits: {
      PR1: { name: 'OTTV Compliance', max: 0 },
      PR2: { name: 'RTTV Compliance', max: 0 },
      PR3: { name: 'CFC Reduction', max: 0 },
      PR4: { name: 'Minimum Energy Performance', max: 0 },
    },
  },
};

// Total maximum points: 85 (excluding prerequisites)

// =============================================================================
// MATERIAL CLASSIFICATION FOR MR CREDITS
// =============================================================================

/**
 * Recycled content classification for MR4 credit
 */
export interface RecycledMaterialData {
  materialType: string;
  postConsumerRecycled: number; // percentage (0-100)
  preConsumerRecycled: number; // percentage (0-100)
  totalRecycledContent: number; // weighted average
  cost: number; // THB
  quantity: number;
  unit: string;
}

/**
 * Local material classification for MR5 credit
 * Materials sourced within 500km of project site
 */
export interface LocalMaterialData {
  materialType: string;
  manufacturer: string;
  extractionLocation: string;
  distanceFromSite: number; // km
  isLocal: boolean; // true if within 500km
  cost: number; // THB
  quantity: number;
  unit: string;
}

/**
 * Common recycled content percentages for Thai construction materials
 */
export const TYPICAL_RECYCLED_CONTENT: Record<string, {
  postConsumer: number;
  preConsumer: number;
  notes: string;
}> = {
  'steel_rebar': { postConsumer: 25, preConsumer: 0, notes: 'Thai EAF steel typically 25% post-consumer' },
  'steel_structural': { postConsumer: 20, preConsumer: 10, notes: 'Mixed BOF/EAF production' },
  'aluminum': { postConsumer: 30, preConsumer: 20, notes: 'Thai aluminum recycling industry' },
  'glass': { postConsumer: 15, preConsumer: 10, notes: 'Float glass with cullet' },
  'concrete_precast': { postConsumer: 0, preConsumer: 5, notes: 'Recycled aggregate content' },
  'concrete_readymix': { postConsumer: 0, preConsumer: 10, notes: 'Fly ash/slag content' },
  'cement': { postConsumer: 0, preConsumer: 15, notes: 'Fly ash blended cement' },
  'gypsum_board': { postConsumer: 5, preConsumer: 80, notes: 'High pre-consumer recycled gypsum' },
  'ceramic_tile': { postConsumer: 20, preConsumer: 30, notes: 'Recycled ceramic content' },
  'brick': { postConsumer: 0, preConsumer: 0, notes: 'Clay brick, no recycled content' },
  'wood_mdf': { postConsumer: 70, preConsumer: 10, notes: 'Recycled wood fibers' },
  'insulation_mineral': { postConsumer: 20, preConsumer: 30, notes: 'Recycled glass/slag' },
  'asphalt': { postConsumer: 15, preConsumer: 0, notes: 'Recycled asphalt pavement (RAP)' },
  'copper': { postConsumer: 40, preConsumer: 10, notes: 'High recyclability of copper' },
  'plastic_pvc': { postConsumer: 0, preConsumer: 5, notes: 'Limited recycled PVC in construction' },
};

/**
 * Major Thai material manufacturers and their typical extraction locations
 */
export const THAI_MATERIAL_SOURCES: Record<string, {
  manufacturers: string[];
  typicalDistance: number; // km from Bangkok
  regions: string[];
}> = {
  'cement': {
    manufacturers: ['SCG', 'TPI Polene', 'INSEE', 'Asia Cement'],
    typicalDistance: 150,
    regions: ['Saraburi', 'Ratchaburi', 'Nakhon Si Thammarat'],
  },
  'concrete': {
    manufacturers: ['CPAC', 'Q-Mix', 'Thai Ready Mix', 'Unique'],
    typicalDistance: 50,
    regions: ['Local batching plants'],
  },
  'steel': {
    manufacturers: ['Siam Yamato', 'SSI', 'Millcon', 'G Steel'],
    typicalDistance: 100,
    regions: ['Rayong', 'Chonburi', 'Prachinburi'],
  },
  'brick': {
    manufacturers: ['Wienerberger', 'CPAC', 'Local kilns'],
    typicalDistance: 80,
    regions: ['Ayutthaya', 'Nakhon Pathom', 'Suphan Buri'],
  },
  'glass': {
    manufacturers: ['AGC', 'Thai-Asahi', 'Cardinal Glass'],
    typicalDistance: 100,
    regions: ['Rayong', 'Samut Prakan'],
  },
  'aluminum': {
    manufacturers: ['Alcan', 'Hindalco', 'Thai Metal Aluminium'],
    typicalDistance: 150,
    regions: ['Imported + processed locally'],
  },
  'wood': {
    manufacturers: ['STA Group', 'Thai MDF', 'Vanachai'],
    typicalDistance: 200,
    regions: ['Prachinburi', 'Kanchanaburi', 'Northern Thailand'],
  },
  'ceramic_tile': {
    manufacturers: ['Cotto', 'Dynasty', 'Sosuco'],
    typicalDistance: 120,
    regions: ['Saraburi', 'Lamphun'],
  },
  'gypsum': {
    manufacturers: ['Siam Gypsum', 'Knauf', 'Gyproc'],
    typicalDistance: 100,
    regions: ['Saraburi', 'Imported gypsum'],
  },
  'insulation': {
    manufacturers: ['ISOVER', 'Rockwool', 'Knauf Insulation'],
    typicalDistance: 200,
    regions: ['Imported + distributed locally'],
  },
};

// =============================================================================
// TREES CREDIT CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate MR4 credit (Recycled Content Materials)
 * Based on cost-weighted recycled content percentage
 */
export function calculateMR4Credit(
  materials: RecycledMaterialData[],
  totalMaterialCost: number
): {
  credit: number;
  maxCredit: number;
  recycledContentPercentage: number;
  qualifyingMaterialsCost: number;
  analysis: string[];
} {
  const analysis: string[] = [];
  let qualifyingCost = 0;
  let weightedRecycledValue = 0;

  for (const material of materials) {
    // TREES uses: Recycled Value = (PostConsumer × 1.0) + (PreConsumer × 0.5)
    const recycledValue =
      material.totalRecycledContent ||
      material.postConsumerRecycled + (material.preConsumerRecycled * 0.5);

    if (recycledValue > 0) {
      const materialValue = material.cost * (recycledValue / 100);
      weightedRecycledValue += materialValue;
      qualifyingCost += material.cost;

      analysis.push(
        `${material.materialType}: ${recycledValue.toFixed(1)}% recycled, ฿${material.cost.toLocaleString()}`
      );
    }
  }

  const recycledContentPercentage = totalMaterialCost > 0
    ? (weightedRecycledValue / totalMaterialCost) * 100
    : 0;

  // MR4 credit thresholds (TREES-NC)
  // 5% = 1 point, 10% = 2 points, 15% = 3 points
  let credit = 0;
  if (recycledContentPercentage >= 15) {
    credit = 3;
  } else if (recycledContentPercentage >= 10) {
    credit = 2;
  } else if (recycledContentPercentage >= 5) {
    credit = 1;
  }

  return {
    credit,
    maxCredit: 3,
    recycledContentPercentage,
    qualifyingMaterialsCost: qualifyingCost,
    analysis,
  };
}

/**
 * Calculate MR5 credit (Local Materials)
 * Based on cost of materials sourced within 500km of project site
 */
export function calculateMR5Credit(
  materials: LocalMaterialData[],
  totalMaterialCost: number
): {
  credit: number;
  maxCredit: number;
  localContentPercentage: number;
  localMaterialsCost: number;
  analysis: string[];
} {
  const analysis: string[] = [];
  let localMaterialsCost = 0;

  for (const material of materials) {
    if (material.isLocal || material.distanceFromSite <= 500) {
      localMaterialsCost += material.cost;
      analysis.push(
        `${material.materialType} from ${material.extractionLocation}: ${material.distanceFromSite}km, ฿${material.cost.toLocaleString()}`
      );
    }
  }

  const localContentPercentage = totalMaterialCost > 0
    ? (localMaterialsCost / totalMaterialCost) * 100
    : 0;

  // MR5 credit thresholds (TREES-NC)
  // 10% = 1 point, 20% = 2 points, 30% = 3 points
  let credit = 0;
  if (localContentPercentage >= 30) {
    credit = 3;
  } else if (localContentPercentage >= 20) {
    credit = 2;
  } else if (localContentPercentage >= 10) {
    credit = 1;
  }

  return {
    credit,
    maxCredit: 3,
    localContentPercentage,
    localMaterialsCost,
    analysis,
  };
}

/**
 * Estimate MR credits from BOQ carbon items
 * Auto-classification based on material types
 */
export function estimateMRCreditsFromBOQ(
  boqItems: BOQCarbonItem[],
  projectLocation: { lat: number; lng: number } = { lat: 13.7563, lng: 100.5018 } // Bangkok default
): TREESCredits {
  // Estimate recycled content based on material types
  let totalCost = 0;
  let recycledWeightedValue = 0;
  let localMaterialsCost = 0;

  for (const item of boqItems) {
    const itemCost = item.unitCost * item.quantity;
    totalCost += itemCost;

    // Check for recycled content
    const materialKey = item.materialCode?.toLowerCase() || item.description.toLowerCase();
    for (const [key, recycledData] of Object.entries(TYPICAL_RECYCLED_CONTENT)) {
      if (materialKey.includes(key.replace('_', ' ')) || materialKey.includes(key.replace('_', ''))) {
        const recycledValue = recycledData.postConsumer + (recycledData.preConsumer * 0.5);
        recycledWeightedValue += itemCost * (recycledValue / 100);
        break;
      }
    }

    // Check for local materials (assume Bangkok-based for simplicity)
    for (const [key, sourceData] of Object.entries(THAI_MATERIAL_SOURCES)) {
      if (materialKey.includes(key)) {
        if (sourceData.typicalDistance <= 500) {
          localMaterialsCost += itemCost;
        }
        break;
      }
    }
  }

  // Calculate MR4 (Recycled Content)
  const recycledContentPercentage = totalCost > 0
    ? (recycledWeightedValue / totalCost) * 100
    : 0;

  let mr4Points = 0;
  if (recycledContentPercentage >= 15) mr4Points = 3;
  else if (recycledContentPercentage >= 10) mr4Points = 2;
  else if (recycledContentPercentage >= 5) mr4Points = 1;

  // Calculate MR5 (Local Materials)
  const localContentPercentage = totalCost > 0
    ? (localMaterialsCost / totalCost) * 100
    : 0;

  let mr5Points = 0;
  if (localContentPercentage >= 30) mr5Points = 3;
  else if (localContentPercentage >= 20) mr5Points = 2;
  else if (localContentPercentage >= 10) mr5Points = 1;

  return {
    mr4RecycledMaterial: mr4Points,
    mr5LocalMaterial: mr5Points,
    mr4Percentage: recycledContentPercentage,
    mr5Percentage: localContentPercentage,
  };
}

/**
 * Estimate EA1 credit (Energy Efficiency)
 * Based on building envelope and system specifications
 */
export function estimateEA1Credit(
  ottv: number, // Overall Thermal Transfer Value (W/m²)
  rttv: number, // Roof Thermal Transfer Value (W/m²)
  lightingPowerDensity: number, // W/m²
  acEfficiency: number // COP or EER
): {
  credit: number;
  maxCredit: number;
  energySavingsPercentage: number;
  analysis: string[];
} {
  const analysis: string[] = [];

  // Thai building code requirements (baseline)
  const baselineOTTV = 50; // W/m² for office buildings
  const baselineRTTV = 15; // W/m²
  const baselineLPD = 16; // W/m² for office
  const baselineCOP = 2.5;

  // Calculate improvement percentages
  const ottvImprovement = Math.max(0, (baselineOTTV - ottv) / baselineOTTV * 100);
  const rttvImprovement = Math.max(0, (baselineRTTV - rttv) / baselineRTTV * 100);
  const lpdImprovement = Math.max(0, (baselineLPD - lightingPowerDensity) / baselineLPD * 100);
  const copImprovement = Math.max(0, (acEfficiency - baselineCOP) / baselineCOP * 100);

  analysis.push(`OTTV: ${ottv} W/m² (${ottvImprovement.toFixed(1)}% better than code)`);
  analysis.push(`RTTV: ${rttv} W/m² (${rttvImprovement.toFixed(1)}% better than code)`);
  analysis.push(`Lighting: ${lightingPowerDensity} W/m² (${lpdImprovement.toFixed(1)}% better than code)`);
  analysis.push(`A/C Efficiency: COP ${acEfficiency} (${copImprovement.toFixed(1)}% better than code)`);

  // Weighted energy savings estimate
  const energySavingsPercentage =
    ottvImprovement * 0.3 +
    rttvImprovement * 0.1 +
    lpdImprovement * 0.3 +
    copImprovement * 0.3;

  // EA1 credit calculation (simplified)
  // TREES uses simulation-based method, this is an estimate
  // 10% savings = 2 points, each additional 5% = 1 point, max 15 points
  let credit = 0;
  if (energySavingsPercentage >= 10) {
    credit = 2 + Math.min(13, Math.floor((energySavingsPercentage - 10) / 5));
  }

  return {
    credit: Math.min(credit, 15),
    maxCredit: 15,
    energySavingsPercentage,
    analysis,
  };
}

// =============================================================================
// TREES CERTIFICATION ASSESSMENT
// =============================================================================

/**
 * Perform comprehensive TREES certification assessment
 */
export function assessTREESCertification(
  boqItems: BOQCarbonItem[],
  buildingData: {
    grossFloorArea: number;
    buildingType: string;
    ottv?: number;
    rttv?: number;
    lightingPowerDensity?: number;
    acEfficiency?: number;
    hasRainwaterHarvesting?: boolean;
    hasGreenRoof?: boolean;
    hasCommissioning?: boolean;
    certifiedWoodPercentage?: number;
    constructionWasteRecycled?: number;
  }
): TREESCertification {
  // Calculate MR credits from BOQ
  const mrCredits = estimateMRCreditsFromBOQ(boqItems);

  // Estimate EA1 if building performance data is provided
  let ea1Credit = 0;
  if (
    buildingData.ottv !== undefined &&
    buildingData.lightingPowerDensity !== undefined &&
    buildingData.acEfficiency !== undefined
  ) {
    const ea1Result = estimateEA1Credit(
      buildingData.ottv,
      buildingData.rttv || 12,
      buildingData.lightingPowerDensity,
      buildingData.acEfficiency
    );
    ea1Credit = ea1Result.credit;
  }

  // Calculate other credits (simplified estimates)
  const credits: Record<string, number> = {
    // BM - Building Management
    BM1: buildingData.hasCommissioning ? 2 : 0,
    BM2: 1, // Assume basic management plan
    BM3: buildingData.hasCommissioning ? 2 : 0,

    // SL - Site & Landscape (estimated)
    SL1: 1,
    SL2: buildingData.hasGreenRoof ? 2 : 0,
    SL3: 1,
    SL4: buildingData.hasRainwaterHarvesting ? 2 : 0,
    SL5: 1,

    // WE - Water Efficiency
    WE1: 2, // Assume efficient fixtures
    WE2: buildingData.hasRainwaterHarvesting ? 2 : 0,

    // EA - Energy & Atmosphere
    EA1: ea1Credit,
    EA2: 0, // Renewable energy - needs specific data
    EA3: 2, // CFC reduction - assume compliance

    // MR - Materials & Resources (from BOQ analysis)
    MR1: Math.min(2, Math.floor((buildingData.constructionWasteRecycled || 50) / 50)),
    MR2: 0, // Reused materials - needs specific data
    MR3: 0, // Building reuse - typically 0 for new construction
    MR4: mrCredits.mr4RecycledMaterial,
    MR5: mrCredits.mr5LocalMaterial,
    MR6: buildingData.certifiedWoodPercentage && buildingData.certifiedWoodPercentage >= 50 ? 1 : 0,

    // IE - Indoor Environmental Quality (estimated)
    IE1: 2,
    IE2: 2,
    IE3: 1,
    IE4: 2,
    IE5: 1,
    IE6: 1,
    IE7: 2,

    // GI - Green Innovation
    GI1: 0, // Innovation credits - needs specific innovations
    GI2: 0, // TREES AP - needs professional engagement
  };

  // Calculate total points by category
  const categoryTotals: Record<string, number> = {};
  for (const [category, data] of Object.entries(TREES_CATEGORIES)) {
    categoryTotals[category] = Object.keys(data.credits)
      .reduce((sum, creditId) => sum + (credits[creditId] || 0), 0);
  }

  // Total points
  const totalPoints = Object.values(categoryTotals).reduce((sum, pts) => sum + pts, 0);

  // Determine certification level
  let targetLevel: TREESLevel = 'certified';
  if (totalPoints >= 60) targetLevel = 'platinum';
  else if (totalPoints >= 50) targetLevel = 'gold';
  else if (totalPoints >= 40) targetLevel = 'silver';
  else if (totalPoints >= 30) targetLevel = 'certified';

  // Generate recommendations
  const recommendations: string[] = [];

  if (mrCredits.mr4RecycledMaterial < 3) {
    recommendations.push(
      `Increase recycled content materials to 15% for additional ${3 - mrCredits.mr4RecycledMaterial} MR4 points`
    );
  }

  if (mrCredits.mr5LocalMaterial < 3) {
    recommendations.push(
      `Source more materials locally (within 500km) for additional ${3 - mrCredits.mr5LocalMaterial} MR5 points`
    );
  }

  if (ea1Credit < 10) {
    recommendations.push(
      `Improve building envelope (OTTV) and systems efficiency for additional EA1 points`
    );
  }

  if (!buildingData.hasRainwaterHarvesting) {
    recommendations.push(`Add rainwater harvesting system for WE2 and SL4 credits`);
  }

  if (!buildingData.hasGreenRoof) {
    recommendations.push(`Consider green roof for SL2 urban heat island credit`);
  }

  // Points needed for next level
  const currentLevelData = TREES_LEVELS[targetLevel];
  let pointsToNextLevel: number | undefined;
  let nextLevel: TREESLevel | undefined;

  if (targetLevel === 'certified' && totalPoints < 40) {
    pointsToNextLevel = 40 - totalPoints;
    nextLevel = 'silver';
  } else if (targetLevel === 'silver' && totalPoints < 50) {
    pointsToNextLevel = 50 - totalPoints;
    nextLevel = 'gold';
  } else if (targetLevel === 'gold' && totalPoints < 60) {
    pointsToNextLevel = 60 - totalPoints;
    nextLevel = 'platinum';
  }

  return {
    projectId: '', // To be filled by caller
    assessmentDate: new Date(),
    targetLevel,
    totalPoints,
    categoryScores: categoryTotals,
    mrCredits,
    eaCredits: {
      ea1EnergyEfficiency: ea1Credit,
    },
    recommendations,
    pointsToNextLevel,
    certificationStatus: totalPoints >= 30 ? 'eligible' : 'not_eligible',
  };
}

/**
 * Generate TREES certification report as markdown
 */
export function generateTREESReport(certification: TREESCertification): string {
  const lines: string[] = [];

  lines.push('# TREES Certification Assessment Report');
  lines.push('# รายงานการประเมินมาตรฐาน TREES');
  lines.push('');
  lines.push(`**Assessment Date / วันที่ประเมิน:** ${certification.assessmentDate.toLocaleDateString('th-TH')}`);
  lines.push(`**Target Level / ระดับเป้าหมาย:** ${TREES_LEVELS[certification.targetLevel].descriptionTh}`);
  lines.push(`**Total Points / คะแนนรวม:** ${certification.totalPoints} / 85`);
  lines.push('');

  // Certification status
  if (certification.certificationStatus === 'eligible') {
    lines.push(`✅ **Eligible for ${TREES_LEVELS[certification.targetLevel].description}**`);
  } else {
    lines.push(`⚠️ **Not yet eligible for TREES certification (minimum 30 points required)**`);
  }
  lines.push('');

  // Category breakdown
  lines.push('## Category Scores / คะแนนแต่ละหมวด');
  lines.push('');
  lines.push('| Category | Score | Max | Percentage |');
  lines.push('|----------|-------|-----|------------|');

  for (const [category, data] of Object.entries(TREES_CATEGORIES)) {
    if (category === 'PR') continue; // Skip prerequisites
    const score = certification.categoryScores[category] || 0;
    const percentage = data.maxPoints > 0 ? ((score / data.maxPoints) * 100).toFixed(0) : '-';
    lines.push(`| ${data.nameTh} (${category}) | ${score} | ${data.maxPoints} | ${percentage}% |`);
  }
  lines.push('');

  // MR Credits Detail (Carbon-related)
  lines.push('## Materials & Resources Analysis / วิเคราะห์วัสดุและทรัพยากร');
  lines.push('');
  lines.push('### MR4 - Recycled Content Materials / วัสดุรีไซเคิล');
  lines.push(`- **Credit Points / คะแนน:** ${certification.mrCredits.mr4RecycledMaterial} / 3`);
  lines.push(`- **Recycled Content / ปริมาณรีไซเคิล:** ${certification.mrCredits.mr4Percentage?.toFixed(1) || 'N/A'}%`);
  lines.push('');
  lines.push('### MR5 - Local Materials / วัสดุท้องถิ่น');
  lines.push(`- **Credit Points / คะแนน:** ${certification.mrCredits.mr5LocalMaterial} / 3`);
  lines.push(`- **Local Content / ปริมาณวัสดุท้องถิ่น:** ${certification.mrCredits.mr5Percentage?.toFixed(1) || 'N/A'}%`);
  lines.push('');

  // Energy credits
  if (certification.eaCredits?.ea1EnergyEfficiency !== undefined) {
    lines.push('## Energy & Atmosphere / พลังงานและบรรยากาศ');
    lines.push('');
    lines.push(`- **EA1 Energy Efficiency / ประหยัดพลังงาน:** ${certification.eaCredits.ea1EnergyEfficiency} / 15 points`);
    lines.push('');
  }

  // Recommendations
  if (certification.recommendations.length > 0) {
    lines.push('## Recommendations / ข้อเสนอแนะ');
    lines.push('');
    for (const rec of certification.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }

  // Path to next level
  if (certification.pointsToNextLevel !== undefined) {
    lines.push('## Path to Next Level / เส้นทางสู่ระดับถัดไป');
    lines.push('');
    lines.push(`Need **${certification.pointsToNextLevel} more points** to achieve next certification level.`);
    lines.push(`ต้องการอีก **${certification.pointsToNextLevel} คะแนน** เพื่อขึ้นไประดับถัดไป`);
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*This assessment is based on available data and should be verified by a TREES Accredited Professional (TREES AP).*');
  lines.push('*การประเมินนี้อ้างอิงจากข้อมูลที่มี และควรได้รับการตรวจสอบโดยผู้เชี่ยวชาญ TREES AP*');

  return lines.join('\n');
}

/**
 * Compare project against TREES requirements for specific level
 */
export function analyzeGapToLevel(
  currentCertification: TREESCertification,
  targetLevel: TREESLevel
): {
  gapPoints: number;
  achievable: boolean;
  prioritizedActions: { action: string; potentialPoints: number; effort: 'low' | 'medium' | 'high' }[];
} {
  const targetPoints = TREES_LEVELS[targetLevel].minPoints;
  const gapPoints = Math.max(0, targetPoints - currentCertification.totalPoints);

  const prioritizedActions: { action: string; potentialPoints: number; effort: 'low' | 'medium' | 'high' }[] = [];

  // MR4 - Recycled content (relatively easy)
  const mr4Gap = 3 - currentCertification.mrCredits.mr4RecycledMaterial;
  if (mr4Gap > 0) {
    prioritizedActions.push({
      action: 'Increase recycled content materials to 15%',
      potentialPoints: mr4Gap,
      effort: 'low',
    });
  }

  // MR5 - Local materials (easy in Thailand)
  const mr5Gap = 3 - currentCertification.mrCredits.mr5LocalMaterial;
  if (mr5Gap > 0) {
    prioritizedActions.push({
      action: 'Source materials from within 500km',
      potentialPoints: mr5Gap,
      effort: 'low',
    });
  }

  // EA1 - Energy efficiency (high impact but medium effort)
  const ea1Current = currentCertification.eaCredits?.ea1EnergyEfficiency || 0;
  if (ea1Current < 10) {
    prioritizedActions.push({
      action: 'Improve building envelope and HVAC efficiency',
      potentialPoints: 10 - ea1Current,
      effort: 'medium',
    });
  }

  // WE2 - Rainwater harvesting
  if ((currentCertification.categoryScores['WE'] || 0) < 4) {
    prioritizedActions.push({
      action: 'Add rainwater harvesting system',
      potentialPoints: 2,
      effort: 'medium',
    });
  }

  // GI - Innovation credits
  if ((currentCertification.categoryScores['GI'] || 0) < 2) {
    prioritizedActions.push({
      action: 'Implement green innovations for GI credits',
      potentialPoints: 4,
      effort: 'high',
    });
  }

  // Sort by effort (low first) then by potential points (high first)
  prioritizedActions.sort((a, b) => {
    const effortOrder = { low: 0, medium: 1, high: 2 };
    if (effortOrder[a.effort] !== effortOrder[b.effort]) {
      return effortOrder[a.effort] - effortOrder[b.effort];
    }
    return b.potentialPoints - a.potentialPoints;
  });

  // Calculate if achievable
  const totalPotential = prioritizedActions.reduce((sum, action) => sum + action.potentialPoints, 0);
  const achievable = (currentCertification.totalPoints + totalPotential) >= targetPoints;

  return {
    gapPoints,
    achievable,
    prioritizedActions,
  };
}
