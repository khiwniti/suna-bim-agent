/**
 * T-VER Registration Templates
 *
 * Auto-generate TGO T-VER program registration documents:
 * - Project Design Document (PDD)
 * - Activity Data (AD) formatting
 * - Emission Factor (EF) templates
 * - Monitoring plans
 * - Verification-ready documentation
 */

import type {
  BOQCarbonAnalysis,
  TVERProject,
  EdgeCalculation,
} from './types';
import { formatCarbon } from './calculator';

// =============================================================================
// T-VER PROJECT TYPES
// =============================================================================

/**
 * T-VER eligible project categories for construction
 */
export type TVERProjectCategory =
  | 'building_energy_efficiency'    // ประสิทธิภาพพลังงานในอาคาร
  | 'low_carbon_materials'          // วัสดุคาร์บอนต่ำ
  | 'waste_reduction'               // การลดของเสียในการก่อสร้าง
  | 'renewable_energy'              // พลังงานหมุนเวียน
  | 'sustainable_construction';     // การก่อสร้างยั่งยืน

/**
 * T-VER methodology types
 */
export type TVERMethodology =
  | 'T-VER-METH-BM-01'   // Building energy efficiency
  | 'T-VER-METH-EM-01'   // Energy management
  | 'T-VER-METH-WM-01'   // Waste management
  | 'T-VER-METH-RE-01';  // Renewable energy

/**
 * T-VER project status
 */
export type TVERStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'registered'
  | 'monitoring'
  | 'verification'
  | 'verified'
  | 'credits_issued';

// =============================================================================
// PROJECT DESIGN DOCUMENT (PDD)
// =============================================================================

/**
 * T-VER PDD structure
 */
export interface TVERProjectDesignDocument {
  // Section A: Project Description
  projectTitle: string;
  projectTitleTh: string;
  projectDescription: string;
  projectLocation: {
    province: string;
    district: string;
    coordinates?: { lat: number; lng: number };
  };
  projectDuration: {
    startDate: Date;
    endDate: Date;
    creditingPeriod: number; // years
  };
  projectCategory: TVERProjectCategory;
  methodology: TVERMethodology;

  // Section B: Baseline Scenario
  baselineScenario: {
    description: string;
    baselineEmissions: number; // tCO2e/year
    baselineCalculation: string;
    dataSource: string[];
  };

  // Section C: Project Scenario
  projectScenario: {
    description: string;
    projectEmissions: number; // tCO2e/year
    emissionReductions: number; // tCO2e/year
    technologyUsed: string[];
  };

  // Section D: Monitoring Plan
  monitoringPlan: {
    parameters: MonitoringParameter[];
    frequency: 'monthly' | 'quarterly' | 'annually';
    responsibleParty: string;
  };

  // Section E: Environmental Impact
  environmentalImpact: {
    positiveImpacts: string[];
    potentialNegativeImpacts: string[];
    mitigationMeasures: string[];
  };

  // Attachments
  attachments: {
    boqCarbonAnalysis?: BOQCarbonAnalysis;
    edgeCalculation?: EdgeCalculation;
    supportingDocuments: string[];
  };
}

/**
 * Monitoring parameter definition
 */
export interface MonitoringParameter {
  id: string;
  name: string;
  nameTh: string;
  unit: string;
  measurementMethod: string;
  frequency: string;
  responsibleParty: string;
  qcProcedure: string;
}

// =============================================================================
// PDD GENERATION
// =============================================================================

/**
 * Generate T-VER Project Design Document
 */
export function generateTVERPDD(
  projectInfo: {
    name: string;
    nameTh: string;
    description: string;
    location: TVERProjectDesignDocument['projectLocation'];
    startDate: Date;
    durationYears: number;
    category: TVERProjectCategory;
  },
  carbonAnalysis: BOQCarbonAnalysis,
  edgeCalc: EdgeCalculation | null
): TVERProjectDesignDocument {
  const methodology = selectMethodology(projectInfo.category);
  const monitoringParams = getMonitoringParameters(projectInfo.category);

  // Calculate baseline and project emissions
  const baselineEmissions = edgeCalc?.baselineCarbon
    ? edgeCalc.baselineCarbon / 1000 // Convert kg to tonnes
    : carbonAnalysis.totalEmbodiedCarbon / 1000 * 1.2; // Assume 20% higher baseline

  const projectEmissions = carbonAnalysis.totalEmbodiedCarbon / 1000;
  const emissionReductions = baselineEmissions - projectEmissions;

  return {
    projectTitle: projectInfo.name,
    projectTitleTh: projectInfo.nameTh,
    projectDescription: projectInfo.description,
    projectLocation: projectInfo.location,
    projectDuration: {
      startDate: projectInfo.startDate,
      endDate: new Date(projectInfo.startDate.getTime() + projectInfo.durationYears * 365 * 24 * 60 * 60 * 1000),
      creditingPeriod: projectInfo.durationYears,
    },
    projectCategory: projectInfo.category,
    methodology,

    baselineScenario: {
      description: generateBaselineDescription(projectInfo.category),
      baselineEmissions,
      baselineCalculation: 'Baseline = Σ(Material_i × EF_baseline_i) for all construction materials',
      dataSource: [
        'TGO CFP Database',
        'Thai National LCI Database',
        'Edge Global Baseline Factors',
      ],
    },

    projectScenario: {
      description: generateProjectDescription(projectInfo.category, edgeCalc),
      projectEmissions,
      emissionReductions,
      technologyUsed: extractTechnologies(edgeCalc),
    },

    monitoringPlan: {
      parameters: monitoringParams,
      frequency: 'annually',
      responsibleParty: 'Project Developer / บริษัทผู้พัฒนาโครงการ',
    },

    environmentalImpact: {
      positiveImpacts: [
        'Reduced GHG emissions from construction materials',
        'Promotion of low-carbon construction practices',
        'Support for Thai green building industry',
        'Contribution to Thailand NDC targets',
      ],
      potentialNegativeImpacts: [
        'Potential higher initial material costs',
        'Supply chain adjustments required',
      ],
      mitigationMeasures: [
        'Phased implementation of low-carbon materials',
        'Supplier engagement program',
        'Cost-benefit analysis for material selection',
      ],
    },

    attachments: {
      boqCarbonAnalysis: carbonAnalysis,
      edgeCalculation: edgeCalc || undefined,
      supportingDocuments: [
        'BOQ Carbon Analysis Report',
        'Material Specifications',
        'Edge Calculation (if applicable)',
        'Site Location Map',
        'Project Timeline',
      ],
    },
  };
}

/**
 * Select appropriate methodology based on project category
 */
function selectMethodology(category: TVERProjectCategory): TVERMethodology {
  const methodologyMap: Record<TVERProjectCategory, TVERMethodology> = {
    building_energy_efficiency: 'T-VER-METH-BM-01',
    low_carbon_materials: 'T-VER-METH-BM-01',
    waste_reduction: 'T-VER-METH-WM-01',
    renewable_energy: 'T-VER-METH-RE-01',
    sustainable_construction: 'T-VER-METH-EM-01',
  };

  return methodologyMap[category];
}

/**
 * Get monitoring parameters for project category
 */
function getMonitoringParameters(category: TVERProjectCategory): MonitoringParameter[] {
  const baseParams: MonitoringParameter[] = [
    {
      id: 'param-01',
      name: 'Material Quantities Used',
      nameTh: 'ปริมาณวัสดุที่ใช้จริง',
      unit: 'kg or m³',
      measurementMethod: 'Invoice records, delivery receipts',
      frequency: 'Monthly',
      responsibleParty: 'Site Manager',
      qcProcedure: 'Cross-check with BOQ and supplier invoices',
    },
    {
      id: 'param-02',
      name: 'Material Carbon Certifications',
      nameTh: 'ใบรับรองคาร์บอนของวัสดุ',
      unit: 'EPD/CFP documents',
      measurementMethod: 'Supplier documentation',
      frequency: 'Per delivery',
      responsibleParty: 'Procurement Manager',
      qcProcedure: 'Verify TGO CFP registration numbers',
    },
    {
      id: 'param-03',
      name: 'Transport Distances',
      nameTh: 'ระยะทางขนส่ง',
      unit: 'km',
      measurementMethod: 'GPS tracking, delivery records',
      frequency: 'Per delivery',
      responsibleParty: 'Logistics Coordinator',
      qcProcedure: 'Verify with supplier location data',
    },
  ];

  // Add category-specific parameters
  if (category === 'low_carbon_materials') {
    baseParams.push({
      id: 'param-04',
      name: 'Low-Carbon Material Percentage',
      nameTh: 'สัดส่วนวัสดุคาร์บอนต่ำ',
      unit: '%',
      measurementMethod: 'BOQ comparison with baseline',
      frequency: 'Monthly',
      responsibleParty: 'Project Engineer',
      qcProcedure: 'Third-party verification of material specs',
    });
  }

  if (category === 'building_energy_efficiency') {
    baseParams.push({
      id: 'param-05',
      name: 'Building Envelope Performance',
      nameTh: 'ประสิทธิภาพผนังอาคาร',
      unit: 'U-value (W/m²K)',
      measurementMethod: 'Thermal testing',
      frequency: 'Annually',
      responsibleParty: 'Energy Consultant',
      qcProcedure: 'Third-party thermal testing',
    });
  }

  return baseParams;
}

/**
 * Generate baseline scenario description
 */
function generateBaselineDescription(category: TVERProjectCategory): string {
  const descriptions: Record<TVERProjectCategory, string> = {
    building_energy_efficiency:
      'The baseline scenario represents conventional construction practices in Thailand using standard materials without carbon optimization. Material selection follows cost-minimization without consideration of environmental impact.',

    low_carbon_materials:
      'The baseline scenario uses conventional construction materials with standard carbon footprints as defined by Thai National LCI Database average values. No low-carbon material substitutions are considered.',

    waste_reduction:
      'The baseline scenario represents typical construction waste generation rates in Thailand (approximately 25-30% of materials), with standard disposal practices.',

    renewable_energy:
      'The baseline scenario uses grid electricity from the Thai national grid with emission factor of 0.4999 kgCO2e/kWh.',

    sustainable_construction:
      'The baseline scenario represents business-as-usual construction practices without sustainability considerations or green building certification requirements.',
  };

  return descriptions[category];
}

/**
 * Generate project scenario description
 */
function generateProjectDescription(
  category: TVERProjectCategory,
  edgeCalc: EdgeCalculation | null
): string {
  let description = `This project implements ${category.replace(/_/g, ' ')} measures to reduce greenhouse gas emissions below the baseline scenario.`;

  if (edgeCalc && edgeCalc.meetsEdgeThreshold) {
    description += ` The project achieves Edge ${edgeCalc.certificationLevel?.replace('_', ' ')} certification with ${edgeCalc.carbonReduction.toFixed(1)}% carbon reduction.`;
  }

  if (edgeCalc && edgeCalc.improvements.length > 0) {
    const topImprovements = edgeCalc.improvements.slice(0, 3);
    description += ` Key interventions include: ${topImprovements.map((i) => i.suggestedMaterial).join(', ')}.`;
  }

  return description;
}

/**
 * Extract technologies used from Edge calculation
 */
function extractTechnologies(edgeCalc: EdgeCalculation | null): string[] {
  const technologies: string[] = [];

  if (edgeCalc) {
    for (const improvement of edgeCalc.improvements.slice(0, 5)) {
      technologies.push(improvement.suggestedMaterial);
    }
  }

  if (technologies.length === 0) {
    technologies.push(
      'Low-carbon concrete',
      'Recycled steel',
      'Local materials',
      'Optimized structural design'
    );
  }

  return technologies;
}

// =============================================================================
// DOCUMENT EXPORT
// =============================================================================

/**
 * Generate PDD as Markdown document
 */
export function exportPDDAsMarkdown(pdd: TVERProjectDesignDocument): string {
  const lines: string[] = [];

  // Title
  lines.push('# T-VER Project Design Document (PDD)');
  lines.push('# เอกสารออกแบบโครงการ T-VER');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Section A: Project Description
  lines.push('## Section A: Project Description / ส่วน ก: รายละเอียดโครงการ');
  lines.push('');
  lines.push(`**Project Title (EN):** ${pdd.projectTitle}`);
  lines.push(`**Project Title (TH):** ${pdd.projectTitleTh}`);
  lines.push('');
  lines.push('**Description:**');
  lines.push(pdd.projectDescription);
  lines.push('');
  lines.push('**Location / สถานที่:**');
  lines.push(`- Province: ${pdd.projectLocation.province}`);
  lines.push(`- District: ${pdd.projectLocation.district}`);
  if (pdd.projectLocation.coordinates) {
    lines.push(`- Coordinates: ${pdd.projectLocation.coordinates.lat}, ${pdd.projectLocation.coordinates.lng}`);
  }
  lines.push('');
  lines.push('**Project Duration / ระยะเวลาโครงการ:**');
  lines.push(`- Start Date: ${pdd.projectDuration.startDate.toLocaleDateString('th-TH')}`);
  lines.push(`- End Date: ${pdd.projectDuration.endDate.toLocaleDateString('th-TH')}`);
  lines.push(`- Crediting Period: ${pdd.projectDuration.creditingPeriod} years`);
  lines.push('');
  lines.push(`**Category:** ${pdd.projectCategory.replace(/_/g, ' ')}`);
  lines.push(`**Methodology:** ${pdd.methodology}`);
  lines.push('');

  // Section B: Baseline Scenario
  lines.push('---');
  lines.push('');
  lines.push('## Section B: Baseline Scenario / ส่วน ข: สถานการณ์ฐาน');
  lines.push('');
  lines.push('**Description:**');
  lines.push(pdd.baselineScenario.description);
  lines.push('');
  lines.push(`**Baseline Emissions:** ${pdd.baselineScenario.baselineEmissions.toFixed(2)} tCO2e`);
  lines.push('');
  lines.push('**Calculation Method:**');
  lines.push(`\`${pdd.baselineScenario.baselineCalculation}\``);
  lines.push('');
  lines.push('**Data Sources:**');
  for (const source of pdd.baselineScenario.dataSource) {
    lines.push(`- ${source}`);
  }
  lines.push('');

  // Section C: Project Scenario
  lines.push('---');
  lines.push('');
  lines.push('## Section C: Project Scenario / ส่วน ค: สถานการณ์โครงการ');
  lines.push('');
  lines.push('**Description:**');
  lines.push(pdd.projectScenario.description);
  lines.push('');
  lines.push(`**Project Emissions:** ${pdd.projectScenario.projectEmissions.toFixed(2)} tCO2e`);
  lines.push(`**Emission Reductions:** ${pdd.projectScenario.emissionReductions.toFixed(2)} tCO2e`);
  lines.push('');
  lines.push('**Technologies Used:**');
  for (const tech of pdd.projectScenario.technologyUsed) {
    lines.push(`- ${tech}`);
  }
  lines.push('');

  // Section D: Monitoring Plan
  lines.push('---');
  lines.push('');
  lines.push('## Section D: Monitoring Plan / ส่วน ง: แผนการติดตาม');
  lines.push('');
  lines.push(`**Monitoring Frequency:** ${pdd.monitoringPlan.frequency}`);
  lines.push(`**Responsible Party:** ${pdd.monitoringPlan.responsibleParty}`);
  lines.push('');
  lines.push('**Monitoring Parameters:**');
  lines.push('');
  lines.push('| ID | Parameter | Unit | Method | Frequency |');
  lines.push('|----|-----------|------|--------|-----------|');
  for (const param of pdd.monitoringPlan.parameters) {
    lines.push(`| ${param.id} | ${param.name} | ${param.unit} | ${param.measurementMethod} | ${param.frequency} |`);
  }
  lines.push('');

  // Section E: Environmental Impact
  lines.push('---');
  lines.push('');
  lines.push('## Section E: Environmental Impact / ส่วน จ: ผลกระทบต่อสิ่งแวดล้อม');
  lines.push('');
  lines.push('**Positive Impacts:**');
  for (const impact of pdd.environmentalImpact.positiveImpacts) {
    lines.push(`- ✅ ${impact}`);
  }
  lines.push('');
  lines.push('**Potential Negative Impacts:**');
  for (const impact of pdd.environmentalImpact.potentialNegativeImpacts) {
    lines.push(`- ⚠️ ${impact}`);
  }
  lines.push('');
  lines.push('**Mitigation Measures:**');
  for (const measure of pdd.environmentalImpact.mitigationMeasures) {
    lines.push(`- 🛡️ ${measure}`);
  }
  lines.push('');

  // Attachments
  lines.push('---');
  lines.push('');
  lines.push('## Attachments / เอกสารแนบ');
  lines.push('');
  for (const doc of pdd.attachments.supportingDocuments) {
    lines.push(`- [ ] ${doc}`);
  }
  lines.push('');

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*This document was generated by BIM Agent (bim.getintheq.space)*');
  lines.push('*เอกสารนี้สร้างโดยระบบ BIM Agent*');

  return lines.join('\n');
}

/**
 * Create T-VER project from analysis
 */
export function createTVERProject(
  pdd: TVERProjectDesignDocument
): TVERProject {
  return {
    projectId: `tver-${Date.now()}`,
    projectName: pdd.projectTitle,
    registrationStatus: 'draft',
    baselineEmissions: pdd.baselineScenario.baselineEmissions,
    projectEmissions: pdd.projectScenario.projectEmissions,
    emissionReductions: pdd.projectScenario.emissionReductions,
  };
}

/**
 * Pre-audit checklist for T-VER registration
 */
export function generatePreAuditChecklist(pdd: TVERProjectDesignDocument): {
  category: string;
  items: { item: string; status: 'complete' | 'incomplete' | 'na'; notes: string }[];
}[] {
  return [
    {
      category: 'Project Documentation',
      items: [
        {
          item: 'Project Design Document (PDD) completed',
          status: pdd.projectTitle ? 'complete' : 'incomplete',
          notes: '',
        },
        {
          item: 'BOQ with carbon calculations',
          status: pdd.attachments.boqCarbonAnalysis ? 'complete' : 'incomplete',
          notes: '',
        },
        {
          item: 'Edge/TREES certification documents',
          status: pdd.attachments.edgeCalculation ? 'complete' : 'incomplete',
          notes: 'Optional but recommended',
        },
        {
          item: 'Site location and project boundaries defined',
          status: pdd.projectLocation.province ? 'complete' : 'incomplete',
          notes: '',
        },
      ],
    },
    {
      category: 'Baseline Calculations',
      items: [
        {
          item: 'Baseline emissions calculated',
          status: pdd.baselineScenario.baselineEmissions > 0 ? 'complete' : 'incomplete',
          notes: '',
        },
        {
          item: 'Data sources documented',
          status: pdd.baselineScenario.dataSource.length > 0 ? 'complete' : 'incomplete',
          notes: '',
        },
        {
          item: 'Calculation methodology specified',
          status: pdd.methodology ? 'complete' : 'incomplete',
          notes: '',
        },
      ],
    },
    {
      category: 'Monitoring Plan',
      items: [
        {
          item: 'Monitoring parameters defined',
          status: pdd.monitoringPlan.parameters.length > 0 ? 'complete' : 'incomplete',
          notes: '',
        },
        {
          item: 'Responsible parties identified',
          status: pdd.monitoringPlan.responsibleParty ? 'complete' : 'incomplete',
          notes: '',
        },
        {
          item: 'QC procedures documented',
          status: pdd.monitoringPlan.parameters.every((p) => p.qcProcedure) ? 'complete' : 'incomplete',
          notes: '',
        },
      ],
    },
    {
      category: 'Environmental Assessment',
      items: [
        {
          item: 'Environmental impacts assessed',
          status: pdd.environmentalImpact.positiveImpacts.length > 0 ? 'complete' : 'incomplete',
          notes: '',
        },
        {
          item: 'Mitigation measures proposed',
          status: pdd.environmentalImpact.mitigationMeasures.length > 0 ? 'complete' : 'incomplete',
          notes: '',
        },
      ],
    },
  ];
}
