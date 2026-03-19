/**
 * Bank-Ready Green Loan Documentation Generator
 *
 * Generates documentation for Thai financial institutions:
 * - ธอส. (Government Housing Bank)
 * - กรุงศรี (Krungsri/Bank of Ayudhya)
 * - SME D-Bank (SME Development Bank)
 *
 * Aligned with TGO CFP, Edge, and TREES certification requirements
 */

import type {
  BOQCarbonAnalysis,
  EdgeCalculation,
  GreenLoanDocument,
  TREESCertification,
  TVERProject,
} from './types';
import { formatCarbon, compareWithBenchmarks } from './calculator';

// =============================================================================
// BANK DOCUMENT TYPES
// =============================================================================

/**
 * Supported Thai banks for green loan applications
 */
export type ThaiBank = 'ghbank' | 'krungsri' | 'sme_dbank' | 'exim' | 'other';

/**
 * Bank-specific requirements
 */
export const BANK_REQUIREMENTS: Record<ThaiBank, {
  name: string;
  nameTh: string;
  requiredDocuments: string[];
  carbonReductionThreshold: number;  // Minimum % reduction for eligibility
  preferredCertifications: string[];
  interestBenefit: string;
}> = {
  ghbank: {
    name: 'Government Housing Bank',
    nameTh: 'ธนาคารอาคารสงเคราะห์ (ธอส.)',
    requiredDocuments: [
      'Carbon Analysis Report',
      'Material Specification with Carbon Data',
      'Green Building Certification (TREES/Edge)',
      'BOQ with Carbon Calculation',
    ],
    carbonReductionThreshold: 15,
    preferredCertifications: ['TREES', 'Edge'],
    interestBenefit: 'Up to 0.5% interest rate reduction',
  },
  krungsri: {
    name: 'Bank of Ayudhya (Krungsri)',
    nameTh: 'ธนาคารกรุงศรีอยุธยา',
    requiredDocuments: [
      'Sustainability Assessment Report',
      'Carbon Footprint Analysis',
      'ESG Compliance Documentation',
      'Green Building Pre-certification',
    ],
    carbonReductionThreshold: 20,
    preferredCertifications: ['Edge', 'TREES', 'TGO CFP'],
    interestBenefit: 'Green loan preferential rate',
  },
  sme_dbank: {
    name: 'SME Development Bank',
    nameTh: 'ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อมแห่งประเทศไทย',
    requiredDocuments: [
      'SME Green Business Plan',
      'Carbon Reduction Roadmap',
      'TGO CFP or CFO Documentation',
      'Material Efficiency Report',
    ],
    carbonReductionThreshold: 10,
    preferredCertifications: ['TGO CFP', 'TGO CFO', 'T-VER'],
    interestBenefit: 'SME Green Loan special rate',
  },
  exim: {
    name: 'Export-Import Bank of Thailand',
    nameTh: 'ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย',
    requiredDocuments: [
      'Green Project Assessment',
      'Carbon Footprint Report',
      'International Certification (Edge/LEED)',
      'ESG Integration Plan',
    ],
    carbonReductionThreshold: 20,
    preferredCertifications: ['Edge', 'LEED', 'ISO 14064'],
    interestBenefit: 'EXIM Green financing support',
  },
  other: {
    name: 'Other Financial Institution',
    nameTh: 'สถาบันการเงินอื่น',
    requiredDocuments: [
      'Carbon Analysis Report',
      'Green Building Documentation',
    ],
    carbonReductionThreshold: 15,
    preferredCertifications: ['TREES', 'Edge'],
    interestBenefit: 'Varies by institution',
  },
};

// =============================================================================
// DOCUMENT GENERATION
// =============================================================================

/**
 * Generate green loan documentation for Thai banks
 */
export function generateGreenLoanDocument(
  analysis: BOQCarbonAnalysis,
  edgeCalc: EdgeCalculation | null,
  treesCert: TREESCertification | null,
  tverProject: TVERProject | null,
  targetBank: ThaiBank = 'ghbank'
): GreenLoanDocument {
  const bankReq = BANK_REQUIREMENTS[targetBank];
  const benchmark = compareWithBenchmarks(analysis.carbonPerSquareMeter);

  // Generate sections
  const executiveSummary = generateExecutiveSummary(
    analysis,
    edgeCalc,
    benchmark,
    bankReq
  );

  const projectOverview = generateProjectOverview(analysis);

  const carbonAnalysis = generateCarbonAnalysisSection(
    analysis,
    edgeCalc,
    benchmark
  );

  const certificationStatus = generateCertificationStatus(
    edgeCalc,
    treesCert,
    tverProject
  );

  const sustainabilityMetrics = generateSustainabilityMetrics(
    analysis,
    edgeCalc,
    treesCert
  );

  // Calculate green premium potential
  const estimatedGreenPremium = calculateGreenPremium(
    analysis,
    edgeCalc,
    targetBank
  );

  return {
    projectId: analysis.projectId,
    projectName: analysis.projectName,
    targetBank,
    totalEmbodiedCarbon: analysis.totalEmbodiedCarbon,
    carbonReductionPercent: edgeCalc?.carbonReduction || 0,
    baselineComparison: benchmark.difference,
    edgeCertification: edgeCalc?.certificationLevel,
    treesCertification: treesCert?.targetLevel,
    tverRegistration: tverProject?.tgoProjectNumber,
    estimatedGreenPremium,
    sections: {
      executiveSummary,
      projectOverview,
      carbonAnalysis,
      certificationStatus,
      sustainabilityMetrics,
    },
    generatedAt: new Date(),
  };
}

/**
 * Generate executive summary section
 */
function generateExecutiveSummary(
  analysis: BOQCarbonAnalysis,
  edgeCalc: EdgeCalculation | null,
  benchmark: ReturnType<typeof compareWithBenchmarks>,
  bankReq: typeof BANK_REQUIREMENTS.ghbank
): string {
  const lines: string[] = [];

  lines.push('# Executive Summary / บทสรุปผู้บริหาร');
  lines.push('');

  // Key metrics
  lines.push('## Key Sustainability Metrics / ตัวชี้วัดความยั่งยืนหลัก');
  lines.push('');
  lines.push(`| Metric | Value | Benchmark |`);
  lines.push(`|--------|-------|-----------|`);
  lines.push(`| Total Embodied Carbon | ${formatCarbon(analysis.totalEmbodiedCarbon)} | - |`);
  lines.push(`| Carbon Intensity | ${analysis.carbonPerSquareMeter.toFixed(1)} kgCO2e/m² | ${benchmark.benchmark} |`);
  lines.push(`| Performance vs. Benchmark | ${benchmark.difference >= 0 ? '+' : ''}${benchmark.difference.toFixed(1)}% | ${benchmark.rating} |`);

  if (edgeCalc) {
    lines.push(`| Carbon Reduction (vs. Baseline) | ${edgeCalc.carbonReduction.toFixed(1)}% | ${bankReq.carbonReductionThreshold}% required |`);
    if (edgeCalc.certificationLevel) {
      lines.push(`| Edge Certification Level | ${edgeCalc.certificationLevel.replace('_', ' ').toUpperCase()} | - |`);
    }
  }

  lines.push('');

  // Eligibility statement
  const meetsThreshold = (edgeCalc?.carbonReduction || 0) >= bankReq.carbonReductionThreshold;

  lines.push('## Green Loan Eligibility / คุณสมบัติสินเชื่อสีเขียว');
  lines.push('');

  if (meetsThreshold) {
    lines.push(`✅ **This project MEETS the green loan eligibility criteria for ${bankReq.nameTh}**`);
    lines.push('');
    lines.push(`- Carbon reduction: ${edgeCalc?.carbonReduction.toFixed(1)}% (threshold: ${bankReq.carbonReductionThreshold}%)`);
    lines.push(`- Potential benefit: ${bankReq.interestBenefit}`);
  } else {
    lines.push(`⚠️ **This project does NOT YET meet the minimum threshold for ${bankReq.nameTh}**`);
    lines.push('');
    lines.push(`- Current reduction: ${edgeCalc?.carbonReduction.toFixed(1) || '0'}%`);
    lines.push(`- Required: ${bankReq.carbonReductionThreshold}%`);
    lines.push(`- Gap: ${(bankReq.carbonReductionThreshold - (edgeCalc?.carbonReduction || 0)).toFixed(1)}%`);
  }

  return lines.join('\n');
}

/**
 * Generate project overview section
 */
function generateProjectOverview(analysis: BOQCarbonAnalysis): string {
  const lines: string[] = [];

  lines.push('# Project Overview / ภาพรวมโครงการ');
  lines.push('');
  lines.push(`**Project Name:** ${analysis.projectName}`);
  lines.push(`**Project ID:** ${analysis.projectId}`);
  lines.push(`**Gross Floor Area:** ${analysis.grossFloorArea.toLocaleString()} m²`);
  lines.push(`**Analysis Date:** ${analysis.calculatedAt.toLocaleDateString('th-TH')}`);
  lines.push(`**Methodology:** ${analysis.methodology.toUpperCase()}`);
  lines.push('');

  // Category breakdown
  lines.push('## Material Category Distribution / การกระจายตามหมวดวัสดุ');
  lines.push('');
  lines.push('| Category | Carbon (kgCO2e) | Percentage |');
  lines.push('|----------|-----------------|------------|');

  for (const cat of analysis.categoryBreakdown.slice(0, 8)) {
    lines.push(`| ${cat.category} | ${formatCarbon(cat.totalCarbon)} | ${cat.percentage.toFixed(1)}% |`);
  }

  return lines.join('\n');
}

/**
 * Generate carbon analysis section
 */
function generateCarbonAnalysisSection(
  analysis: BOQCarbonAnalysis,
  edgeCalc: EdgeCalculation | null,
  benchmark: ReturnType<typeof compareWithBenchmarks>
): string {
  const lines: string[] = [];

  lines.push('# Carbon Analysis / การวิเคราะห์คาร์บอน');
  lines.push('');

  // Scope breakdown
  lines.push('## Emission Scope Breakdown (ISO 14064) / การแบ่งตามขอบเขตการปล่อยก๊าซ');
  lines.push('');
  lines.push('| Scope | Description | Emissions |');
  lines.push('|-------|-------------|-----------|');
  lines.push(`| Scope 1 | Direct emissions | ${formatCarbon(analysis.scopeBreakdown.scope1)} |`);
  lines.push(`| Scope 2 | Energy indirect | ${formatCarbon(analysis.scopeBreakdown.scope2)} |`);
  lines.push(`| Scope 3 | Supply chain | ${formatCarbon(analysis.scopeBreakdown.scope3)} |`);
  lines.push(`| **Total** | **All scopes** | **${formatCarbon(analysis.totalEmbodiedCarbon)}** |`);
  lines.push('');

  // Hotspots
  lines.push('## Carbon Hotspots / จุดปล่อยคาร์บอนหลัก');
  lines.push('');
  lines.push('The following items contribute the most to the project carbon footprint:');
  lines.push('');

  for (let i = 0; i < Math.min(5, analysis.hotspots.length); i++) {
    const hotspot = analysis.hotspots[i];
    lines.push(`${i + 1}. **${hotspot.description}**: ${formatCarbon(hotspot.carbon)} (${hotspot.percentage.toFixed(1)}%)`);
  }

  lines.push('');

  // Benchmark comparison
  lines.push('## Benchmark Comparison / เปรียบเทียบกับค่ามาตรฐาน');
  lines.push('');
  lines.push(`- **Project Carbon Intensity:** ${analysis.carbonPerSquareMeter.toFixed(1)} kgCO2e/m²`);
  lines.push(`- **Thai Building Benchmark:** ${benchmark.benchmark}`);
  lines.push(`- **Performance Rating:** ${benchmark.rating.toUpperCase()}`);

  if (benchmark.difference >= 0) {
    lines.push(`- **Better than benchmark by:** ${benchmark.difference.toFixed(1)}%`);
  } else {
    lines.push(`- **Above benchmark by:** ${Math.abs(benchmark.difference).toFixed(1)}%`);
  }

  return lines.join('\n');
}

/**
 * Generate certification status section
 */
function generateCertificationStatus(
  edgeCalc: EdgeCalculation | null,
  treesCert: TREESCertification | null,
  tverProject: TVERProject | null
): string {
  const lines: string[] = [];

  lines.push('# Certification Status / สถานะการรับรอง');
  lines.push('');

  // Edge
  lines.push('## Edge Certification');
  if (edgeCalc && edgeCalc.meetsEdgeThreshold) {
    lines.push(`✅ **Eligible for:** ${edgeCalc.certificationLevel?.replace('_', ' ').toUpperCase()}`);
    lines.push(`- Carbon reduction: ${edgeCalc.carbonReduction.toFixed(1)}%`);
    lines.push(`- Baseline: ${formatCarbon(edgeCalc.baselineCarbon)}`);
    lines.push(`- Optimized: ${formatCarbon(edgeCalc.optimizedCarbon)}`);
  } else if (edgeCalc) {
    lines.push(`⚠️ **Not yet eligible** (${edgeCalc.carbonReduction.toFixed(1)}% reduction, need 20%+)`);
  } else {
    lines.push('❌ **Not calculated**');
  }
  lines.push('');

  // TREES
  lines.push('## TREES Certification (Thai Green Building)');
  if (treesCert) {
    lines.push(`🎯 **Target Level:** ${treesCert.targetLevel.toUpperCase()}`);
    lines.push(`- Total Points: ${treesCert.totalPoints}`);
    lines.push(`- MR Credits: ${treesCert.mrCredits.mr4RecycledMaterial + treesCert.mrCredits.mr5LocalMaterial} points`);
  } else {
    lines.push('❌ **Not evaluated**');
  }
  lines.push('');

  // T-VER
  lines.push('## T-VER Registration (Carbon Credits)');
  if (tverProject) {
    lines.push(`📋 **Status:** ${tverProject.registrationStatus.toUpperCase()}`);
    if (tverProject.tgoProjectNumber) {
      lines.push(`- TGO Project Number: ${tverProject.tgoProjectNumber}`);
    }
    lines.push(`- Estimated Credits: ${tverProject.emissionReductions.toLocaleString()} tCO2e`);
  } else {
    lines.push('❌ **Not registered**');
  }

  return lines.join('\n');
}

/**
 * Generate sustainability metrics section
 */
function generateSustainabilityMetrics(
  analysis: BOQCarbonAnalysis,
  edgeCalc: EdgeCalculation | null,
  treesCert: TREESCertification | null
): string {
  const lines: string[] = [];

  lines.push('# Sustainability Metrics / ตัวชี้วัดความยั่งยืน');
  lines.push('');

  // Core metrics
  lines.push('## Core Environmental Metrics');
  lines.push('');
  lines.push('| Metric | Value | Unit |');
  lines.push('|--------|-------|------|');
  lines.push(`| Total Embodied Carbon | ${formatCarbon(analysis.totalEmbodiedCarbon)} | - |`);
  lines.push(`| Carbon per Floor Area | ${analysis.carbonPerSquareMeter.toFixed(1)} | kgCO2e/m² |`);
  lines.push(`| Gross Floor Area | ${analysis.grossFloorArea.toLocaleString()} | m² |`);

  if (edgeCalc) {
    lines.push(`| Carbon Reduction | ${edgeCalc.carbonReduction.toFixed(1)} | % vs baseline |`);
    lines.push(`| Carbon Savings | ${formatCarbon(edgeCalc.baselineCarbon - edgeCalc.optimizedCarbon)} | - |`);
  }

  lines.push('');

  // Improvement opportunities
  if (edgeCalc && edgeCalc.improvements.length > 0) {
    lines.push('## Recommended Improvements / ข้อเสนอแนะในการปรับปรุง');
    lines.push('');

    for (const improvement of edgeCalc.improvements.slice(0, 5)) {
      lines.push(`### ${improvement.currentMaterial} → ${improvement.suggestedMaterial}`);
      lines.push(`- Carbon savings: ${formatCarbon(improvement.carbonSavings)}`);
      lines.push(`- Reduction: ${improvement.percentageImprovement.toFixed(1)}%`);
      lines.push(`- Priority: ${improvement.priority.toUpperCase()}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Calculate estimated green premium/benefit
 */
function calculateGreenPremium(
  analysis: BOQCarbonAnalysis,
  edgeCalc: EdgeCalculation | null,
  targetBank: ThaiBank
): number | undefined {
  const bankReq = BANK_REQUIREMENTS[targetBank];
  const carbonReduction = edgeCalc?.carbonReduction || 0;

  if (carbonReduction < bankReq.carbonReductionThreshold) {
    return undefined;
  }

  // Estimated benefit calculation (simplified)
  // Assume loan amount correlates with building size
  const estimatedLoanPerM2 = 30000; // THB per m² (rough estimate)
  const estimatedLoan = analysis.grossFloorArea * estimatedLoanPerM2;

  // Interest rate reduction benefit (0.25-0.5% depending on reduction)
  const interestReductionPercent = carbonReduction >= 40 ? 0.5 : carbonReduction >= 25 ? 0.375 : 0.25;

  // 20-year loan benefit estimate
  const annualSavings = (estimatedLoan * interestReductionPercent) / 100;
  const totalBenefit = annualSavings * 20;

  return Math.round(totalBenefit);
}

/**
 * Generate full report as Markdown string
 */
export function generateFullReport(doc: GreenLoanDocument): string {
  const lines: string[] = [];

  // Header
  lines.push('---');
  lines.push(`title: "Green Loan Documentation - ${doc.projectName}"`);
  lines.push(`date: "${doc.generatedAt.toISOString()}"`);
  lines.push(`bank: "${BANK_REQUIREMENTS[doc.targetBank].nameTh}"`);
  lines.push('---');
  lines.push('');

  // Add all sections
  lines.push(doc.sections.executiveSummary);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(doc.sections.projectOverview);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(doc.sections.carbonAnalysis);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(doc.sections.certificationStatus);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(doc.sections.sustainabilityMetrics);

  // Footer
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Document Information / ข้อมูลเอกสาร');
  lines.push('');
  lines.push(`- **Generated:** ${doc.generatedAt.toLocaleDateString('th-TH')} ${doc.generatedAt.toLocaleTimeString('th-TH')}`);
  lines.push(`- **Platform:** BIM Agent (bim.getintheq.space)`);
  lines.push(`- **Methodology:** TGO CFP / Edge Certification`);
  lines.push('');
  lines.push('*This document is generated automatically and should be verified by a qualified sustainability consultant before submission.*');

  return lines.join('\n');
}

/**
 * Check bank requirements and return gap analysis
 */
export function analyzeBankRequirements(
  targetBank: ThaiBank,
  carbonReduction: number,
  certifications: string[]
): {
  meetsRequirements: boolean;
  gaps: string[];
  recommendations: string[];
} {
  const bankReq = BANK_REQUIREMENTS[targetBank];
  const gaps: string[] = [];
  const recommendations: string[] = [];

  // Check carbon reduction threshold
  if (carbonReduction < bankReq.carbonReductionThreshold) {
    gaps.push(`Carbon reduction (${carbonReduction.toFixed(1)}%) below threshold (${bankReq.carbonReductionThreshold}%)`);
    recommendations.push(`Increase carbon reduction by ${(bankReq.carbonReductionThreshold - carbonReduction).toFixed(1)}% to meet minimum requirement`);
  }

  // Check certifications
  const hasCert = bankReq.preferredCertifications.some((c) =>
    certifications.map((cert) => cert.toLowerCase()).includes(c.toLowerCase())
  );

  if (!hasCert) {
    gaps.push(`Missing preferred certification (${bankReq.preferredCertifications.join(', ')})`);
    recommendations.push(`Pursue ${bankReq.preferredCertifications[0]} certification to strengthen application`);
  }

  return {
    meetsRequirements: gaps.length === 0,
    gaps,
    recommendations,
  };
}
