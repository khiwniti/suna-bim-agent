/**
 * TGO (Thailand Greenhouse Gas Management Organization) Report Templates
 *
 * Generates Thailand-specific carbon footprint reports:
 * - CFO (Carbon Footprint for Organization)
 * - CFP (Carbon Footprint of Product)
 * - TREES Certification Checklist
 *
 * @see https://tgo.or.th/ for official TGO guidelines
 */

import type { ThaiMaterial, ThaiMaterialCategory } from '@/lib/carbon/thai-materials';
import type { Report, ReportSection, ChartData, TableData } from './types';
import { nanoid } from 'nanoid';

// ============================================
// TGO Report Types
// ============================================

export type TGOReportType = 'cfo' | 'cfp' | 'trees';

export interface TGOProjectInfo {
  projectName: string;
  projectNameTh?: string;
  organization: string;
  organizationTh?: string;
  location: string;
  locationTh?: string;
  buildingType: string;
  totalArea: number; // m²
  floors: number;
  reportPeriod: {
    start: Date;
    end: Date;
  };
  preparedBy: string;
  certificationTarget?: 'cfp_standard' | 'cfp_reduction' | 'cfp_zero';
}

export interface MaterialEmission {
  material: ThaiMaterial;
  quantity: number;
  totalEmission: number; // kgCO2e
  category: ThaiMaterialCategory;
}

export interface TGOAnalysisInput {
  project: TGOProjectInfo;
  materials: MaterialEmission[];
  transportEmissions?: number; // kgCO2e
  constructionEmissions?: number; // kgCO2e
  operationalEmissions?: number; // kgCO2e/year
}

// ============================================
// TGO Constants
// ============================================

const TGO_BENCHMARKS = {
  residential: {
    excellent: 200, // kgCO2e/m²
    good: 300,
    average: 400,
    poor: 600,
  },
  commercial: {
    excellent: 300,
    good: 450,
    average: 600,
    poor: 900,
  },
  industrial: {
    excellent: 400,
    good: 600,
    average: 800,
    poor: 1200,
  },
};

const TREES_CREDITS = {
  carbonReduction10: 1,
  carbonReduction20: 2,
  carbonReduction30: 3,
  carbonReduction40: 4,
  carbonReduction50: 5,
  localMaterials: 2,
  recycledContent: 2,
  lowCarbonConcrete: 3,
  renewableEnergy: 4,
  waterEfficiency: 2,
};

// ============================================
// CFO Report Generator
// ============================================

export function generateCFOReport(input: TGOAnalysisInput): Report {
  const { project, materials } = input;
  const startTime = Date.now();

  // Calculate totals
  const totalMaterialEmissions = materials.reduce((sum, m) => sum + m.totalEmission, 0);
  const totalEmissions =
    totalMaterialEmissions +
    (input.transportEmissions || 0) +
    (input.constructionEmissions || 0);
  const carbonIntensity = totalEmissions / project.totalArea;

  // Group by category
  const categoryEmissions = groupByCategory(materials);

  // Generate sections
  const sections: ReportSection[] = [
    generateCFOCoverSection(project),
    generateCFOScopeSection(project),
    generateCFOBoundarySection(project),
    generateCFOEmissionsSection(totalEmissions, categoryEmissions, project),
    generateCFOInterpretationSection(carbonIntensity, project.buildingType),
    generateCFORecommendationsSection(categoryEmissions, carbonIntensity),
    generateCFOVerificationSection(project),
  ];

  return {
    id: nanoid(),
    type: 'comprehensive',
    title: `รายงานคาร์บอนฟุตพริ้นท์ขององค์กร (CFO)\n${project.projectName}`,
    description: `Carbon Footprint for Organization Report - ${project.projectName}`,
    generatedAt: new Date(),
    modelId: 'tgo-cfo',
    modelName: project.projectName,
    status: 'complete',
    sections,
    summary: {
      keyFindings: [
        `ปริมาณก๊าซเรือนกระจกทั้งหมด: ${formatNumber(totalEmissions)} kgCO₂e`,
        `ความเข้มข้นคาร์บอน: ${carbonIntensity.toFixed(1)} kgCO₂e/m²`,
        `พื้นที่โครงการ: ${formatNumber(project.totalArea)} m²`,
        `จำนวนชั้น: ${project.floors} ชั้น`,
      ],
      criticalIssues: carbonIntensity > 600 ? 1 : 0,
      warnings: carbonIntensity > 400 ? 1 : 0,
      recommendations: generateTopRecommendations(categoryEmissions, 3),
    },
    metadata: {
      generatedBy: 'BIM Carbon - TGO Report Generator',
      version: '1.0.0',
      analysisDepth: 'comprehensive',
      includedAnalyses: ['cfo', 'emissions', 'recommendations'],
      processingTimeMs: Date.now() - startTime,
    },
  };
}

// ============================================
// CFP Report Generator
// ============================================

export function generateCFPReport(input: TGOAnalysisInput): Report {
  const { project, materials } = input;
  const startTime = Date.now();

  const totalMaterialEmissions = materials.reduce((sum, m) => sum + m.totalEmission, 0);
  const categoryEmissions = groupByCategory(materials);
  const carbonIntensity = totalMaterialEmissions / project.totalArea;

  // Lifecycle assessment breakdown
  const lifecycleBreakdown = {
    a1_a3: totalMaterialEmissions * 0.65, // Product stage (extraction, manufacturing)
    a4: input.transportEmissions || totalMaterialEmissions * 0.08, // Transport
    a5: input.constructionEmissions || totalMaterialEmissions * 0.12, // Construction
    b1_b7: (input.operationalEmissions || 0) * 30, // 30-year operational
    c1_c4: totalMaterialEmissions * 0.15, // End of life
  };

  const sections: ReportSection[] = [
    generateCFPCoverSection(project),
    generateCFPProductDescriptionSection(project, materials),
    generateCFPLifecycleSection(lifecycleBreakdown),
    generateCFPEmissionsSection(totalMaterialEmissions, categoryEmissions),
    generateCFPComparisonSection(carbonIntensity, project.buildingType),
    generateCFPDeclarationSection(project),
  ];

  return {
    id: nanoid(),
    type: 'sustainability',
    title: `รายงานคาร์บอนฟุตพริ้นท์ของผลิตภัณฑ์ (CFP)\n${project.projectName}`,
    description: `Carbon Footprint of Product Report - ${project.projectName}`,
    generatedAt: new Date(),
    modelId: 'tgo-cfp',
    modelName: project.projectName,
    status: 'complete',
    sections,
    summary: {
      keyFindings: [
        `คาร์บอนฟุตพริ้นท์ผลิตภัณฑ์: ${formatNumber(totalMaterialEmissions)} kgCO₂e`,
        `คาร์บอนต่อตารางเมตร: ${carbonIntensity.toFixed(1)} kgCO₂e/m²`,
        `หน่วยวิเคราะห์: ${formatNumber(project.totalArea)} m² พื้นที่ใช้สอย`,
      ],
      criticalIssues: 0,
      warnings: carbonIntensity > 450 ? 1 : 0,
      recommendations: generateTopRecommendations(categoryEmissions, 3),
    },
    metadata: {
      generatedBy: 'BIM Carbon - TGO CFP Generator',
      version: '1.0.0',
      analysisDepth: 'comprehensive',
      includedAnalyses: ['cfp', 'lifecycle', 'comparison'],
      processingTimeMs: Date.now() - startTime,
    },
  };
}

// ============================================
// TREES Certification Checklist Generator
// ============================================

export function generateTREESReport(input: TGOAnalysisInput): Report {
  const { project, materials } = input;
  const startTime = Date.now();

  const totalEmissions = materials.reduce((sum, m) => sum + m.totalEmission, 0);
  const carbonIntensity = totalEmissions / project.totalArea;
  const categoryEmissions = groupByCategory(materials);

  // Calculate TREES credits
  const credits = calculateTREESCredits(input, carbonIntensity);
  const totalCredits = Object.values(credits).reduce((sum, c) => sum + c, 0);

  const sections: ReportSection[] = [
    generateTREESCoverSection(project),
    generateTREESOverviewSection(project, totalCredits),
    generateTREESCarbonCreditsSection(credits, carbonIntensity),
    generateTREESMaterialCreditsSection(materials, categoryEmissions),
    generateTREESChecklistSection(input),
    generateTREESCertificationPathSection(totalCredits),
  ];

  return {
    id: nanoid(),
    type: 'compliance',
    title: `รายงานการประเมิน TREES\n${project.projectName}`,
    description: `TREES (Thai's Rating of Energy and Environmental Sustainability) Assessment - ${project.projectName}`,
    generatedAt: new Date(),
    modelId: 'trees',
    modelName: project.projectName,
    status: 'complete',
    sections,
    summary: {
      keyFindings: [
        `คะแนน TREES รวม: ${totalCredits} คะแนน`,
        `ระดับการรับรอง: ${getTREESLevel(totalCredits)}`,
        `การลดคาร์บอน: ${getReductionPercent(carbonIntensity, project.buildingType)}%`,
      ],
      criticalIssues: totalCredits < 30 ? 1 : 0,
      warnings: totalCredits < 40 ? 1 : 0,
      recommendations: [
        'เพิ่มการใช้วัสดุคาร์บอนต่ำ',
        'ใช้วัสดุรีไซเคิลมากขึ้น',
        'พิจารณาใช้คอนกรีตคาร์บอนต่ำ',
      ],
      complianceStatus: totalCredits >= 40 ? 'compliant' : 'partial',
    },
    metadata: {
      generatedBy: 'BIM Carbon - TREES Assessment',
      version: '1.0.0',
      analysisDepth: 'comprehensive',
      includedAnalyses: ['trees', 'credits', 'certification'],
      processingTimeMs: Date.now() - startTime,
    },
  };
}

// ============================================
// CFO Section Generators
// ============================================

function generateCFOCoverSection(project: TGOProjectInfo): ReportSection {
  return {
    id: 'cfo-cover',
    title: 'หน้าปก',
    content: `
# รายงานคาร์บอนฟุตพริ้นท์ขององค์กร
## Carbon Footprint for Organization (CFO)

---

**ชื่อโครงการ:** ${project.projectName}
${project.projectNameTh ? `**ชื่อโครงการ (ไทย):** ${project.projectNameTh}` : ''}

**องค์กร:** ${project.organization}
${project.organizationTh ? `**องค์กร (ไทย):** ${project.organizationTh}` : ''}

**ที่ตั้ง:** ${project.location}
${project.locationTh ? `**ที่ตั้ง (ไทย):** ${project.locationTh}` : ''}

**ระยะเวลารายงาน:**
- เริ่มต้น: ${formatDate(project.reportPeriod.start)}
- สิ้นสุด: ${formatDate(project.reportPeriod.end)}

**จัดทำโดย:** ${project.preparedBy}
**วันที่จัดทำ:** ${formatDate(new Date())}

---

*รายงานฉบับนี้จัดทำตามมาตรฐาน ISO 14064-1 และ
แนวทางการประเมินคาร์บอนฟุตพริ้นท์ขององค์กร ของ อบก.*

![TGO Logo](https://tgo.or.th/tgo-logo.png)
    `.trim(),
  };
}

function generateCFOScopeSection(project: TGOProjectInfo): ReportSection {
  return {
    id: 'cfo-scope',
    title: 'ขอบเขตการศึกษา',
    content: `
## 1. ขอบเขตการศึกษา (Scope)

### 1.1 ขอบเขตที่ 1 (Scope 1) - การปล่อยก๊าซเรือนกระจกทางตรง

การปล่อยก๊าซเรือนกระจกจากแหล่งที่องค์กรเป็นเจ้าของหรือควบคุม:
- การเผาไหม้เชื้อเพลิงในอาคาร
- ยานพาหนะขององค์กร
- ระบบทำความเย็น (สารทำความเย็น)
- กระบวนการอุตสาหกรรม (ถ้ามี)

### 1.2 ขอบเขตที่ 2 (Scope 2) - การปล่อยก๊าซเรือนกระจกทางอ้อมจากพลังงาน

การปล่อยก๊าซเรือนกระจกจากการใช้พลังงาน:
- การใช้ไฟฟ้า
- การใช้ความร้อน/ไอน้ำจากภายนอก
- การใช้ความเย็นจากภายนอก

### 1.3 ขอบเขตที่ 3 (Scope 3) - การปล่อยก๊าซเรือนกระจกทางอ้อมอื่นๆ

**รวมอยู่ในการศึกษานี้:**
- วัสดุก่อสร้าง (Embodied Carbon)
- การขนส่งวัสดุ
- การจัดการของเสีย
- การเดินทางของพนักงาน

**ไม่รวมอยู่ในการศึกษานี้:**
- การเช่าสินทรัพย์
- การลงทุน
- สินค้าและบริการอื่นๆ

### 1.4 ข้อมูลโครงการ

| รายการ | ค่า |
|--------|-----|
| ประเภทอาคาร | ${project.buildingType} |
| พื้นที่ทั้งหมด | ${formatNumber(project.totalArea)} m² |
| จำนวนชั้น | ${project.floors} |
    `.trim(),
  };
}

function generateCFOBoundarySection(project: TGOProjectInfo): ReportSection {
  return {
    id: 'cfo-boundary',
    title: 'ขอบเขตองค์กร',
    content: `
## 2. ขอบเขตองค์กร (Organizational Boundary)

### 2.1 วิธีการกำหนดขอบเขต

การศึกษานี้ใช้วิธี **Operational Control** ในการกำหนดขอบเขตองค์กร
โดยรวมทุกกิจกรรมที่องค์กรมีอำนาจควบคุมการดำเนินงาน

### 2.2 สถานที่ที่รวมอยู่ในการศึกษา

| สถานที่ | ที่ตั้ง | พื้นที่ (m²) |
|---------|---------|-------------|
| ${project.projectName} | ${project.location} | ${formatNumber(project.totalArea)} |

### 2.3 ระยะเวลาฐาน

- **ปีฐาน:** ${project.reportPeriod.start.getFullYear()}
- **ระยะเวลาศึกษา:** ${formatDate(project.reportPeriod.start)} - ${formatDate(project.reportPeriod.end)}

### 2.4 หน่วยวิเคราะห์ (Functional Unit)

**หน่วยวิเคราะห์:** พื้นที่ใช้สอย 1 ตารางเมตร (m²) ตลอดอายุการใช้งาน 50 ปี
    `.trim(),
  };
}

function generateCFOEmissionsSection(
  totalEmissions: number,
  categoryEmissions: Map<ThaiMaterialCategory, number>,
  project: TGOProjectInfo
): ReportSection {
  const sortedCategories = Array.from(categoryEmissions.entries())
    .sort((a, b) => b[1] - a[1]);

  const charts: ChartData[] = [
    {
      type: 'pie',
      title: 'การปล่อยก๊าซเรือนกระจกตามหมวดวัสดุ',
      data: sortedCategories.slice(0, 6).map(([category, emission]) => ({
        label: translateCategory(category),
        value: emission,
        color: getCategoryColor(category),
      })),
    },
  ];

  const tables: TableData[] = [
    {
      title: 'สรุปการปล่อยก๊าซเรือนกระจก',
      headers: ['หมวดวัสดุ', 'ปริมาณ (kgCO₂e)', 'สัดส่วน (%)'],
      rows: sortedCategories.map(([category, emission]) => [
        translateCategory(category),
        formatNumber(emission),
        ((emission / totalEmissions) * 100).toFixed(1),
      ]),
    },
  ];

  return {
    id: 'cfo-emissions',
    title: 'ผลการประเมิน',
    content: `
## 3. ผลการประเมินคาร์บอนฟุตพริ้นท์

### 3.1 สรุปผลการปล่อยก๊าซเรือนกระจก

| ขอบเขต | ปริมาณ (kgCO₂e) | สัดส่วน (%) |
|--------|-----------------|-------------|
| Scope 3 - วัสดุก่อสร้าง | ${formatNumber(totalEmissions)} | 100% |

**ปริมาณก๊าซเรือนกระจกทั้งหมด: ${formatNumber(totalEmissions)} kgCO₂e**

**ความเข้มข้นคาร์บอน: ${(totalEmissions / project.totalArea).toFixed(1)} kgCO₂e/m²**

### 3.2 การปล่อยก๊าซเรือนกระจกตามหมวดวัสดุ

${sortedCategories.map(([category, emission]) =>
  `- **${translateCategory(category)}:** ${formatNumber(emission)} kgCO₂e (${((emission / totalEmissions) * 100).toFixed(1)}%)`
).join('\n')}

### 3.3 วัสดุที่มีการปล่อยสูงสุด 5 อันดับแรก

วัสดุที่มีส่วนในการปล่อยก๊าซเรือนกระจกสูงสุด ควรพิจารณาเป็นพิเศษ
ในการเลือกทางเลือกที่มีคาร์บอนต่ำกว่า
    `.trim(),
    charts,
    tables,
  };
}

function generateCFOInterpretationSection(
  carbonIntensity: number,
  buildingType: string
): ReportSection {
  const benchmarks = getBenchmarks(buildingType);
  const rating = getRating(carbonIntensity, benchmarks);

  return {
    id: 'cfo-interpretation',
    title: 'การตีความผลลัพธ์',
    content: `
## 4. การตีความผลลัพธ์

### 4.1 การเปรียบเทียบกับค่าเฉลี่ย

| ระดับ | ค่าอ้างอิง (kgCO₂e/m²) | สถานะ |
|-------|----------------------|-------|
| ดีเยี่ยม (Excellent) | < ${benchmarks.excellent} | ${carbonIntensity < benchmarks.excellent ? '✓ บรรลุ' : '○'} |
| ดี (Good) | < ${benchmarks.good} | ${carbonIntensity < benchmarks.good ? '✓ บรรลุ' : '○'} |
| ปานกลาง (Average) | < ${benchmarks.average} | ${carbonIntensity < benchmarks.average ? '✓ บรรลุ' : '○'} |
| ต่ำกว่ามาตรฐาน (Poor) | > ${benchmarks.poor} | ${carbonIntensity > benchmarks.poor ? '⚠️ ต่ำกว่ามาตรฐาน' : '○'} |

### 4.2 ผลการประเมิน

**ค่าความเข้มข้นคาร์บอนของโครงการ: ${carbonIntensity.toFixed(1)} kgCO₂e/m²**

**ระดับการประเมิน: ${rating}**

${carbonIntensity < benchmarks.good ?
  '✅ โครงการนี้มีประสิทธิภาพคาร์บอนที่ดีเมื่อเทียบกับค่าเฉลี่ยของอาคารประเภทเดียวกัน' :
  '⚠️ โครงการนี้มีค่าคาร์บอนสูงกว่าค่าเฉลี่ย ควรพิจารณามาตรการลดคาร์บอน'}

### 4.3 เป้าหมายการลดก๊าซเรือนกระจก

ตามนโยบาย Thailand NDC และเป้าหมาย Net Zero 2065:
- เป้าหมายระยะสั้น (2030): ลด 30% จากปีฐาน
- เป้าหมายระยะกลาง (2040): ลด 50% จากปีฐาน
- เป้าหมายระยะยาว (2065): Net Zero
    `.trim(),
  };
}

function generateCFORecommendationsSection(
  categoryEmissions: Map<ThaiMaterialCategory, number>,
  carbonIntensity: number
): ReportSection {
  const topCategories = Array.from(categoryEmissions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return {
    id: 'cfo-recommendations',
    title: 'ข้อเสนอแนะ',
    content: `
## 5. ข้อเสนอแนะในการลดก๊าซเรือนกระจก

### 5.1 มาตรการลดคาร์บอนระยะสั้น (Quick Wins)

${topCategories.map(([category], i) => {
  const recommendations = getCategoryRecommendations(category);
  return `
#### ${i + 1}. ${translateCategory(category)}
${recommendations.map(r => `- ${r}`).join('\n')}
`;
}).join('\n')}

### 5.2 มาตรการลดคาร์บอนระยะยาว

1. **การใช้คอนกรีตคาร์บอนต่ำ**
   - พิจารณาใช้ SCG Green Series หรือ CPAC Low Carbon
   - ศักยภาพลดได้: 20-35% ของคาร์บอนจากคอนกรีต

2. **การใช้เหล็กรีไซเคิล**
   - ใช้เหล็กที่มีส่วนผสมรีไซเคิลสูง (>80%)
   - ศักยภาพลดได้: 30-50% ของคาร์บอนจากเหล็ก

3. **การใช้วัสดุทดแทน**
   - ใช้อิฐมวลเบา (AAC) แทนอิฐมอญ
   - ใช้ไม้จากสวนป่าที่ได้รับการรับรอง FSC
   - ศักยภาพลดได้: 15-25% ของคาร์บอนรวม

### 5.3 การติดตามผล

1. ติดตามการใช้พลังงานรายเดือน
2. จัดทำรายงานคาร์บอนประจำปี
3. กำหนดเป้าหมายลดคาร์บอนประจำปี (5-10%)
4. พิจารณาการขอรับรอง Carbon Footprint จาก อบก.
    `.trim(),
  };
}

function generateCFOVerificationSection(project: TGOProjectInfo): ReportSection {
  return {
    id: 'cfo-verification',
    title: 'การทวนสอบ',
    content: `
## 6. การทวนสอบและการรับรอง

### 6.1 ข้อมูลที่ใช้ในการคำนวณ

- **แหล่งข้อมูล Emission Factor:**
  - องค์การบริหารจัดการก๊าซเรือนกระจก (อบก./TGO)
  - ศูนย์เทคโนโลยีโลหะและวัสดุแห่งชาติ (MTEC)
  - Environmental Product Declaration (EPD) ของผู้ผลิต
  - งานวิจัยในประเทศไทย

- **วิธีการคำนวณ:**
  - ใช้ตามแนวทาง ISO 14064-1:2018
  - ใช้ค่า Global Warming Potential (GWP) 100 ปี ตาม IPCC AR5

### 6.2 ขั้นตอนการขอรับรอง

1. **เตรียมเอกสาร**
   - รายงาน CFO ฉบับสมบูรณ์
   - หลักฐานข้อมูลกิจกรรม
   - หลักฐาน Emission Factor

2. **ยื่นขอรับรอง**
   - ยื่นผ่านระบบออนไลน์ของ อบก.
   - รอการตรวจสอบเบื้องต้น

3. **การทวนสอบ**
   - ผู้ทวนสอบภายนอกตรวจสอบข้อมูล
   - แก้ไขข้อบกพร่อง (ถ้ามี)

4. **การรับรอง**
   - รับใบรับรอง Carbon Footprint
   - ขึ้นทะเบียนในฐานข้อมูล อบก.

### 6.3 ข้อมูลผู้จัดทำรายงาน

- **ผู้จัดทำ:** ${project.preparedBy}
- **วันที่จัดทำ:** ${formatDate(new Date())}
- **เครื่องมือที่ใช้:** BIM Carbon Platform

---

*รายงานฉบับนี้จัดทำโดยระบบ BIM Carbon ตามมาตรฐาน ISO 14064-1
สำหรับการขอรับรองอย่างเป็นทางการ กรุณาติดต่อ อบก. โดยตรง*
    `.trim(),
  };
}

// ============================================
// CFP Section Generators
// ============================================

function generateCFPCoverSection(project: TGOProjectInfo): ReportSection {
  return {
    id: 'cfp-cover',
    title: 'หน้าปก',
    content: `
# รายงานคาร์บอนฟุตพริ้นท์ของผลิตภัณฑ์
## Carbon Footprint of Product (CFP)

---

**ผลิตภัณฑ์:** ${project.projectName}
**ประเภท:** อาคาร${project.buildingType}

**หน่วยวิเคราะห์:** พื้นที่ใช้สอย ${formatNumber(project.totalArea)} m²

**องค์กร:** ${project.organization}
**ที่ตั้ง:** ${project.location}

**ระยะเวลาศึกษา:**
${formatDate(project.reportPeriod.start)} - ${formatDate(project.reportPeriod.end)}

**วันที่จัดทำ:** ${formatDate(new Date())}

---

*จัดทำตามมาตรฐาน ISO 14067 และ
แนวทางการประเมินคาร์บอนฟุตพริ้นท์ของผลิตภัณฑ์ ของ อบก.*
    `.trim(),
  };
}

function generateCFPProductDescriptionSection(
  project: TGOProjectInfo,
  materials: MaterialEmission[]
): ReportSection {
  const uniqueCategories = new Set(materials.map(m => m.category));

  return {
    id: 'cfp-product',
    title: 'รายละเอียดผลิตภัณฑ์',
    content: `
## 1. รายละเอียดผลิตภัณฑ์

### 1.1 ข้อมูลทั่วไป

| รายการ | ค่า |
|--------|-----|
| ชื่อผลิตภัณฑ์ | ${project.projectName} |
| ประเภทอาคาร | ${project.buildingType} |
| พื้นที่ทั้งหมด | ${formatNumber(project.totalArea)} m² |
| จำนวนชั้น | ${project.floors} |

### 1.2 หน่วยวิเคราะห์ (Functional Unit)

**1 ตารางเมตรพื้นที่ใช้สอย (1 m² GFA)**

อายุการใช้งานอ้างอิง: 50 ปี

### 1.3 หมวดวัสดุหลัก

${Array.from(uniqueCategories).map(c => `- ${translateCategory(c)}`).join('\n')}

### 1.4 ขอบเขตการศึกษา (System Boundary)

การศึกษานี้ครอบคลุมวงจรชีวิตผลิตภัณฑ์ตั้งแต่:
- A1-A3: ขั้นตอนผลิตภัณฑ์ (Product Stage)
- A4: การขนส่งไปยังหน่วยก่อสร้าง
- A5: การก่อสร้าง
    `.trim(),
  };
}

function generateCFPLifecycleSection(lifecycle: {
  a1_a3: number;
  a4: number;
  a5: number;
  b1_b7: number;
  c1_c4: number;
}): ReportSection {
  const total = lifecycle.a1_a3 + lifecycle.a4 + lifecycle.a5;

  const charts: ChartData[] = [
    {
      type: 'bar',
      title: 'การปล่อยก๊าซเรือนกระจกตามขั้นตอนวงจรชีวิต',
      data: [
        { label: 'A1-A3 ผลิต', value: lifecycle.a1_a3, color: '#ef4444' },
        { label: 'A4 ขนส่ง', value: lifecycle.a4, color: '#f59e0b' },
        { label: 'A5 ก่อสร้าง', value: lifecycle.a5, color: '#22c55e' },
      ],
    },
  ];

  return {
    id: 'cfp-lifecycle',
    title: 'วงจรชีวิตผลิตภัณฑ์',
    content: `
## 2. การประเมินวงจรชีวิต (Life Cycle Assessment)

### 2.1 ขั้นตอนวงจรชีวิต

| ขั้นตอน | รหัส | ปริมาณ (kgCO₂e) | สัดส่วน (%) |
|---------|------|-----------------|-------------|
| ขั้นตอนผลิตภัณฑ์ | A1-A3 | ${formatNumber(lifecycle.a1_a3)} | ${((lifecycle.a1_a3 / total) * 100).toFixed(1)} |
| การขนส่ง | A4 | ${formatNumber(lifecycle.a4)} | ${((lifecycle.a4 / total) * 100).toFixed(1)} |
| การก่อสร้าง | A5 | ${formatNumber(lifecycle.a5)} | ${((lifecycle.a5 / total) * 100).toFixed(1)} |
| **รวม** | **A1-A5** | **${formatNumber(total)}** | **100** |

### 2.2 รายละเอียดแต่ละขั้นตอน

**A1-A3: ขั้นตอนผลิตภัณฑ์ (Product Stage)**
- A1: การสกัดและจัดหาวัตถุดิบ
- A2: การขนส่งวัตถุดิบไปยังโรงงาน
- A3: การผลิตผลิตภัณฑ์

**A4: การขนส่ง (Transport)**
- การขนส่งวัสดุจากโรงงานไปยังหน่วยก่อสร้าง
- ระยะทางเฉลี่ย: 50-100 กม.

**A5: การก่อสร้าง (Construction)**
- การใช้พลังงานในการก่อสร้าง
- ของเสียจากการก่อสร้าง
    `.trim(),
    charts,
  };
}

function generateCFPEmissionsSection(
  totalEmissions: number,
  categoryEmissions: Map<ThaiMaterialCategory, number>
): ReportSection {
  const sortedCategories = Array.from(categoryEmissions.entries())
    .sort((a, b) => b[1] - a[1]);

  return {
    id: 'cfp-emissions',
    title: 'ผลการประเมิน',
    content: `
## 3. ผลการประเมินคาร์บอนฟุตพริ้นท์

### 3.1 สรุปผล

**คาร์บอนฟุตพริ้นท์รวม: ${formatNumber(totalEmissions)} kgCO₂e**

### 3.2 การแบ่งตามหมวดวัสดุ

${sortedCategories.map(([category, emission]) =>
  `| ${translateCategory(category)} | ${formatNumber(emission)} | ${((emission / totalEmissions) * 100).toFixed(1)}% |`
).join('\n')}

### 3.3 ก๊าซเรือนกระจกที่พิจารณา

- CO₂ (คาร์บอนไดออกไซด์)
- CH₄ (มีเทน)
- N₂O (ไนตรัสออกไซด์)

แสดงผลในหน่วย kgCO₂e (CO₂ equivalent) โดยใช้ค่า GWP 100 ปี
    `.trim(),
  };
}

function generateCFPComparisonSection(
  carbonIntensity: number,
  buildingType: string
): ReportSection {
  const benchmarks = getBenchmarks(buildingType);

  return {
    id: 'cfp-comparison',
    title: 'การเปรียบเทียบ',
    content: `
## 4. การเปรียบเทียบกับค่าอ้างอิง

### 4.1 ค่าเปรียบเทียบ

| ระดับ | kgCO₂e/m² | สถานะโครงการ |
|-------|-----------|--------------|
| ดีเยี่ยม | < ${benchmarks.excellent} | ${carbonIntensity < benchmarks.excellent ? '✓' : '-'} |
| ดี | < ${benchmarks.good} | ${carbonIntensity < benchmarks.good ? '✓' : '-'} |
| ปานกลาง | < ${benchmarks.average} | ${carbonIntensity < benchmarks.average ? '✓' : '-'} |

**ค่าของโครงการ: ${carbonIntensity.toFixed(1)} kgCO₂e/m²**

### 4.2 มาตรฐานอ้างอิง

- **RIBA 2030 Target:** 300 kgCO₂e/m² (อาคารทั่วไป)
- **LEED v4.1:** ลด 5% จาก baseline
- **BREEAM:** ลด 10% จาก baseline
- **TREES:** ลด 10-50% จาก baseline (1-5 คะแนน)
    `.trim(),
  };
}

function generateCFPDeclarationSection(project: TGOProjectInfo): ReportSection {
  return {
    id: 'cfp-declaration',
    title: 'คำประกาศ',
    content: `
## 5. คำประกาศคาร์บอนฟุตพริ้นท์

### ข้อมูลการรับรอง

| รายการ | ค่า |
|--------|-----|
| ประเภทการรับรอง | ${project.certificationTarget || 'CFP Standard'} |
| ผู้ขอรับรอง | ${project.organization} |
| ผลิตภัณฑ์ | ${project.projectName} |
| วันที่ประเมิน | ${formatDate(new Date())} |
| ระยะเวลาใช้ได้ | 3 ปี |

### หมายเหตุ

1. ค่าคาร์บอนฟุตพริ้นท์นี้คำนวณจากข้อมูล ณ วันที่ประเมิน
2. การเปลี่ยนแปลงวัสดุหรือกระบวนการอาจส่งผลต่อค่าคาร์บอนฟุตพริ้นท์
3. สำหรับการขอรับรองอย่างเป็นทางการ กรุณาติดต่อ อบก.

---

**ผู้จัดทำรายงาน:** ${project.preparedBy}
**วันที่:** ${formatDate(new Date())}
    `.trim(),
  };
}

// ============================================
// TREES Section Generators
// ============================================

function generateTREESCoverSection(project: TGOProjectInfo): ReportSection {
  return {
    id: 'trees-cover',
    title: 'หน้าปก',
    content: `
# รายงานการประเมิน TREES
## Thai's Rating of Energy and Environmental Sustainability

---

**โครงการ:** ${project.projectName}
**ประเภท:** อาคาร${project.buildingType}

**ที่ตั้ง:** ${project.location}
**พื้นที่:** ${formatNumber(project.totalArea)} m²

**องค์กร:** ${project.organization}

**วันที่ประเมิน:** ${formatDate(new Date())}

---

*จัดทำตามเกณฑ์ TREES-NC (New Construction) Version 2.0
โดยสถาบันอาคารเขียวไทย (Thai Green Building Institute)*
    `.trim(),
  };
}

function generateTREESOverviewSection(
  project: TGOProjectInfo,
  totalCredits: number
): ReportSection {
  return {
    id: 'trees-overview',
    title: 'ภาพรวม',
    content: `
## 1. ภาพรวมการประเมิน TREES

### 1.1 ระดับการรับรอง TREES

| ระดับ | คะแนนขั้นต่ำ | สถานะ |
|-------|------------|-------|
| Certified | 40-49 | ${totalCredits >= 40 && totalCredits < 50 ? '✓ บรรลุ' : '-'} |
| Silver | 50-59 | ${totalCredits >= 50 && totalCredits < 60 ? '✓ บรรลุ' : '-'} |
| Gold | 60-74 | ${totalCredits >= 60 && totalCredits < 75 ? '✓ บรรลุ' : '-'} |
| Platinum | ≥ 75 | ${totalCredits >= 75 ? '✓ บรรลุ' : '-'} |

### 1.2 ผลการประเมินเบื้องต้น

**คะแนนรวม: ${totalCredits} คะแนน**
**ระดับที่คาดว่าจะได้รับ: ${getTREESLevel(totalCredits)}**

### 1.3 หมวดที่ประเมิน

การประเมินนี้เน้นที่หมวด **MA: Materials & Resources**
และ **EN: Energy & Atmosphere** ที่เกี่ยวข้องกับคาร์บอน
    `.trim(),
  };
}

function generateTREESCarbonCreditsSection(
  credits: Record<string, number>,
  carbonIntensity: number
): ReportSection {
  const reductionPercent = getReductionPercent(carbonIntensity, 'commercial');

  return {
    id: 'trees-carbon',
    title: 'คะแนนคาร์บอน',
    content: `
## 2. คะแนนหมวดคาร์บอน

### 2.1 MA: Materials & Resources

| เกณฑ์ | คะแนนเต็ม | คะแนนที่ได้ |
|-------|----------|------------|
| MA-1: การลดคาร์บอนจากวัสดุ (${reductionPercent}%) | 5 | ${credits.carbonReduction || 0} |
| MA-2: การใช้วัสดุในท้องถิ่น | 2 | ${credits.localMaterials || 0} |
| MA-3: วัสดุรีไซเคิล | 2 | ${credits.recycledContent || 0} |
| MA-4: คอนกรีตคาร์บอนต่ำ | 3 | ${credits.lowCarbonConcrete || 0} |

### 2.2 การคำนวณคะแนนการลดคาร์บอน

**ค่าคาร์บอนโครงการ:** ${carbonIntensity.toFixed(1)} kgCO₂e/m²
**ค่า Baseline:** 450 kgCO₂e/m² (อาคารพาณิชย์ทั่วไป)
**การลด:** ${reductionPercent}%

| ระดับการลด | คะแนน |
|------------|-------|
| ลด 10% | 1 |
| ลด 20% | 2 |
| ลด 30% | 3 |
| ลด 40% | 4 |
| ลด 50%+ | 5 |
    `.trim(),
  };
}

function generateTREESMaterialCreditsSection(
  materials: MaterialEmission[],
  categoryEmissions: Map<ThaiMaterialCategory, number>
): ReportSection {
  // Calculate local materials percentage
  const localMaterials = materials.filter(m =>
    m.material.source === 'TGO' ||
    m.material.source === 'SCG_EPD' ||
    m.material.source === 'CPAC_EPD'
  );
  const localPercent = (localMaterials.length / materials.length) * 100;

  // Calculate recycled content
  const recycledMaterials = materials.filter(m =>
    m.material.nameEn.toLowerCase().includes('recycl') ||
    m.material.nameEn.toLowerCase().includes('reuse')
  );
  const recycledPercent = (recycledMaterials.length / materials.length) * 100;

  return {
    id: 'trees-materials',
    title: 'คะแนนวัสดุ',
    content: `
## 3. คะแนนหมวดวัสดุ

### 3.1 MA-2: การใช้วัสดุในท้องถิ่น

**เกณฑ์:** ใช้วัสดุที่ผลิตในประเทศไทย > 20% ของมูลค่าวัสดุทั้งหมด

**สถานะโครงการ:**
- วัสดุในประเทศ: ${localPercent.toFixed(0)}%
- เกณฑ์: 20%
- **สถานะ:** ${localPercent >= 20 ? '✓ ผ่าน (1-2 คะแนน)' : '✗ ไม่ผ่าน'}

### 3.2 MA-3: วัสดุรีไซเคิล

**เกณฑ์:** ใช้วัสดุรีไซเคิล > 10% ของมูลค่าวัสดุทั้งหมด

**สถานะโครงการ:**
- วัสดุรีไซเคิล: ${recycledPercent.toFixed(0)}%
- เกณฑ์: 10%
- **สถานะ:** ${recycledPercent >= 10 ? '✓ ผ่าน (1-2 คะแนน)' : '✗ ไม่ผ่าน'}

### 3.3 MA-4: คอนกรีตคาร์บอนต่ำ

**เกณฑ์:** ใช้คอนกรีตที่มี EPD หรือคอนกรีตคาร์บอนต่ำ

**ทางเลือกคอนกรีตคาร์บอนต่ำในประเทศไทย:**
- SCG Green Series (Low Carbon Concrete)
- CPAC Green Concrete
- คอนกรีตผสม Fly Ash > 20%
- คอนกรีตผสม GGBS > 30%
    `.trim(),
  };
}

function generateTREESChecklistSection(input: TGOAnalysisInput): ReportSection {
  return {
    id: 'trees-checklist',
    title: 'รายการตรวจสอบ',
    content: `
## 4. รายการตรวจสอบ TREES

### 4.1 เอกสารที่ต้องเตรียม

| รายการ | สถานะ | หมายเหตุ |
|--------|-------|----------|
| รายงานการวิเคราะห์คาร์บอน | ✓ | รายงานฉบับนี้ |
| Bill of Quantities (BOQ) | ⬜ | ต้องจัดเตรียม |
| ข้อมูล Emission Factor | ✓ | ใช้ข้อมูลจาก TGO/MTEC |
| EPD ของวัสดุหลัก | ⬜ | ต้องรวบรวม |
| ใบรับรองวัสดุรีไซเคิล | ⬜ | ต้องรวบรวม |

### 4.2 ขั้นตอนการขอรับรอง TREES

1. **Pre-Assessment (ประเมินเบื้องต้น)**
   - ✓ วิเคราะห์คาร์บอนของวัสดุ
   - ⬜ ประเมินคะแนนเบื้องต้นทุกหมวด
   - ⬜ ระบุช่องว่างและโอกาสในการปรับปรุง

2. **Documentation (จัดเตรียมเอกสาร)**
   - ⬜ รวบรวมเอกสารประกอบทุกหมวด
   - ⬜ จัดทำรายงานสรุป
   - ⬜ เตรียมหลักฐานการคำนวณ

3. **Submission (ยื่นขอรับรอง)**
   - ⬜ ยื่นเอกสารต่อ TGBI
   - ⬜ ชำระค่าธรรมเนียม
   - ⬜ รอการตรวจสอบ

4. **Verification (การทวนสอบ)**
   - ⬜ ตรวจสอบเอกสาร
   - ⬜ ตรวจสอบหน้างาน (ถ้าจำเป็น)
   - ⬜ แก้ไขข้อบกพร่อง

5. **Certification (การรับรอง)**
   - ⬜ รับใบรับรอง TREES
   - ⬜ รับโลโก้ TREES สำหรับใช้งาน
    `.trim(),
  };
}

function generateTREESCertificationPathSection(totalCredits: number): ReportSection {
  const currentLevel = getTREESLevel(totalCredits);
  const nextLevel = getNextTREESLevel(totalCredits);
  const pointsToNext = getPointsToNextLevel(totalCredits);

  return {
    id: 'trees-path',
    title: 'เส้นทางการรับรอง',
    content: `
## 5. เส้นทางสู่การรับรอง TREES

### 5.1 สถานะปัจจุบัน

**คะแนนปัจจุบัน:** ${totalCredits} คะแนน
**ระดับที่คาดว่าจะได้รับ:** ${currentLevel}

${nextLevel !== 'Platinum' ? `
### 5.2 การเลื่อนระดับเป็น ${nextLevel}

**ต้องการเพิ่ม:** ${pointsToNext} คะแนน

**แนะนำ:**
${getUpgradeRecommendations(totalCredits).map((r, i) => `${i + 1}. ${r}`).join('\n')}
` : `
### 5.2 ระดับ Platinum

✓ โครงการนี้มีศักยภาพได้รับการรับรองระดับ Platinum
`}

### 5.3 ประโยชน์ของการรับรอง TREES

1. **ด้านการเงิน**
   - ได้รับส่วนลดอัตราดอกเบี้ยสินเชื่อสีเขียว
   - เพิ่มมูลค่าอสังหาริมทรัพย์ 5-15%
   - ลดค่าใช้จ่ายด้านพลังงาน 20-40%

2. **ด้านการตลาด**
   - สร้างภาพลักษณ์องค์กรสีเขียว
   - ตอบโจทย์ผู้เช่า/ผู้ซื้อที่ใส่ใจสิ่งแวดล้อม
   - ได้เปรียบในการประมูลงาน

3. **ด้านกฎระเบียบ**
   - เตรียมพร้อมสำหรับกฎระเบียบในอนาคต
   - รองรับการรายงาน ESG
   - สอดคล้องกับนโยบาย Net Zero

---

**ติดต่อสถาบันอาคารเขียวไทย (TGBI):**
- เว็บไซต์: https://tgbi.or.th
- อีเมล: info@tgbi.or.th
- โทร: 02-xxx-xxxx
    `.trim(),
  };
}

// ============================================
// Helper Functions
// ============================================

function formatNumber(num: number): string {
  return num.toLocaleString('th-TH', { maximumFractionDigits: 0 });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function groupByCategory(materials: MaterialEmission[]): Map<ThaiMaterialCategory, number> {
  const map = new Map<ThaiMaterialCategory, number>();
  for (const m of materials) {
    const current = map.get(m.category) || 0;
    map.set(m.category, current + m.totalEmission);
  }
  return map;
}

function translateCategory(category: ThaiMaterialCategory): string {
  const translations: Record<ThaiMaterialCategory, string> = {
    concrete: 'คอนกรีต',
    steel: 'เหล็ก',
    masonry: 'วัสดุก่ออิฐ',
    timber: 'ไม้',
    glass: 'กระจก',
    insulation: 'ฉนวน',
    roofing: 'หลังคา',
    finishes: 'วัสดุตกแต่ง',
    mep: 'ระบบ MEP',
    waterproofing: 'กันซึม',
  };
  return translations[category] || category;
}

function getCategoryColor(category: ThaiMaterialCategory): string {
  const colors: Record<ThaiMaterialCategory, string> = {
    concrete: '#6b7280',
    steel: '#3b82f6',
    masonry: '#f59e0b',
    timber: '#22c55e',
    glass: '#06b6d4',
    insulation: '#ec4899',
    roofing: '#8b5cf6',
    finishes: '#f97316',
    mep: '#14b8a6',
    waterproofing: '#a3a3a3',
  };
  return colors[category] || '#6b7280';
}

function getBenchmarks(buildingType: string): typeof TGO_BENCHMARKS.commercial {
  const type = buildingType.toLowerCase();
  if (type.includes('residential') || type.includes('บ้าน') || type.includes('ที่พัก')) {
    return TGO_BENCHMARKS.residential;
  }
  if (type.includes('industrial') || type.includes('โรงงาน') || type.includes('อุตสาหกรรม')) {
    return TGO_BENCHMARKS.industrial;
  }
  return TGO_BENCHMARKS.commercial;
}

function getRating(carbonIntensity: number, benchmarks: typeof TGO_BENCHMARKS.commercial): string {
  if (carbonIntensity < benchmarks.excellent) return '⭐⭐⭐⭐⭐ ดีเยี่ยม (Excellent)';
  if (carbonIntensity < benchmarks.good) return '⭐⭐⭐⭐ ดี (Good)';
  if (carbonIntensity < benchmarks.average) return '⭐⭐⭐ ปานกลาง (Average)';
  return '⭐⭐ ต่ำกว่ามาตรฐาน (Below Average)';
}

function generateTopRecommendations(
  categoryEmissions: Map<ThaiMaterialCategory, number>,
  count: number
): string[] {
  const recommendations: string[] = [];
  const sortedCategories = Array.from(categoryEmissions.entries())
    .sort((a, b) => b[1] - a[1]);

  for (const [category] of sortedCategories.slice(0, count)) {
    const catRecs = getCategoryRecommendations(category);
    if (catRecs.length > 0) {
      recommendations.push(catRecs[0]);
    }
  }

  return recommendations;
}

function getCategoryRecommendations(category: ThaiMaterialCategory): string[] {
  const recommendations: Record<ThaiMaterialCategory, string[]> = {
    concrete: [
      'ใช้คอนกรีตคาร์บอนต่ำ (Low Carbon Concrete)',
      'เพิ่มสัดส่วน Fly Ash หรือ GGBS ในส่วนผสม',
      'พิจารณาใช้คอนกรีตสำเร็จรูป (Precast) เพื่อลดของเสีย',
    ],
    steel: [
      'ใช้เหล็กที่มีส่วนผสมรีไซเคิลสูง (>80%)',
      'เลือกซัพพลายเออร์ที่มี EPD',
      'ออกแบบให้ใช้เหล็กน้อยลงโดยการปรับโครงสร้าง',
    ],
    masonry: [
      'ใช้อิฐมวลเบา (AAC) แทนอิฐมอญ',
      'พิจารณาใช้บล็อกคอนกรีตแทนอิฐ',
      'ใช้วัสดุจากผู้ผลิตในท้องถิ่นเพื่อลดการขนส่ง',
    ],
    timber: [
      'ใช้ไม้จากสวนป่าที่ได้รับการรับรอง FSC',
      'พิจารณาใช้ไม้ลามิเนต (GLT/CLT)',
      'ใช้ไม้แทนวัสดุที่มีคาร์บอนสูงกว่า',
    ],
    glass: [
      'ใช้กระจก Low-E เพื่อลดการใช้พลังงานทำความเย็น',
      'เลือกกระจกที่มีส่วนผสมรีไซเคิล',
      'ลดพื้นที่กระจกให้เหมาะสมกับภูมิอากาศ',
    ],
    insulation: [
      'ใช้ฉนวนจากวัสดุรีไซเคิล',
      'พิจารณาฉนวนจากวัสดุธรรมชาติ',
      'เพิ่มความหนาฉนวนเพื่อลดพลังงานระยะยาว',
    ],
    roofing: [
      'ใช้หลังคาสีอ่อนเพื่อลดความร้อน',
      'พิจารณาหลังคาเขียว (Green Roof)',
      'ใช้วัสดุหลังคาที่มีอายุการใช้งานยาว',
    ],
    finishes: [
      'ใช้สีและวัสดุที่มี VOC ต่ำ',
      'เลือกวัสดุจากผู้ผลิตที่มี EPD',
      'ลดการใช้วัสดุตกแต่งที่ไม่จำเป็น',
    ],
    mep: [
      'ใช้อุปกรณ์ประสิทธิภาพสูง',
      'ออกแบบระบบให้เหมาะสมกับโหลด',
      'พิจารณาใช้พลังงานหมุนเวียน',
    ],
    waterproofing: [
      'เลือกระบบกันซึมที่ทนทานยาวนาน',
      'พิจารณาใช้วัสดุกันซึมรีไซเคิล',
      'ลดการใช้สารเคมีที่เป็นอันตราย',
    ],
  };

  return recommendations[category] || recommendations.concrete;
}

function calculateTREESCredits(
  input: TGOAnalysisInput,
  carbonIntensity: number
): Record<string, number> {
  const credits: Record<string, number> = {};

  // Carbon reduction credits (MA-1)
  const reductionPercent = getReductionPercent(carbonIntensity, input.project.buildingType);
  if (reductionPercent >= 50) credits.carbonReduction = 5;
  else if (reductionPercent >= 40) credits.carbonReduction = 4;
  else if (reductionPercent >= 30) credits.carbonReduction = 3;
  else if (reductionPercent >= 20) credits.carbonReduction = 2;
  else if (reductionPercent >= 10) credits.carbonReduction = 1;
  else credits.carbonReduction = 0;

  // Local materials (MA-2) - simplified calculation
  const localMaterials = input.materials.filter(m =>
    m.material.source === 'TGO' ||
    m.material.source === 'SCG_EPD' ||
    m.material.source === 'CPAC_EPD'
  );
  const localPercent = (localMaterials.length / Math.max(input.materials.length, 1)) * 100;
  credits.localMaterials = localPercent >= 30 ? 2 : localPercent >= 20 ? 1 : 0;

  // Recycled content (MA-3)
  const recycledMaterials = input.materials.filter(m =>
    m.material.nameEn.toLowerCase().includes('recycl')
  );
  const recycledPercent = (recycledMaterials.length / Math.max(input.materials.length, 1)) * 100;
  credits.recycledContent = recycledPercent >= 20 ? 2 : recycledPercent >= 10 ? 1 : 0;

  // Low carbon concrete (MA-4)
  const lowCarbonConcrete = input.materials.filter(m =>
    m.category === 'concrete' &&
    (m.material.nameEn.toLowerCase().includes('low carbon') ||
     m.material.nameEn.toLowerCase().includes('green'))
  );
  credits.lowCarbonConcrete = lowCarbonConcrete.length > 0 ? 3 : 0;

  return credits;
}

function getReductionPercent(carbonIntensity: number, buildingType: string): number {
  const benchmarks = getBenchmarks(buildingType);
  const baseline = benchmarks.average;
  const reduction = ((baseline - carbonIntensity) / baseline) * 100;
  return Math.max(0, Math.round(reduction));
}

function getTREESLevel(credits: number): string {
  if (credits >= 75) return 'Platinum';
  if (credits >= 60) return 'Gold';
  if (credits >= 50) return 'Silver';
  if (credits >= 40) return 'Certified';
  return 'ยังไม่ผ่านเกณฑ์ (< 40 คะแนน)';
}

function getNextTREESLevel(credits: number): string {
  if (credits >= 75) return 'Platinum';
  if (credits >= 60) return 'Platinum';
  if (credits >= 50) return 'Gold';
  if (credits >= 40) return 'Silver';
  return 'Certified';
}

function getPointsToNextLevel(credits: number): number {
  if (credits >= 75) return 0;
  if (credits >= 60) return 75 - credits;
  if (credits >= 50) return 60 - credits;
  if (credits >= 40) return 50 - credits;
  return 40 - credits;
}

function getUpgradeRecommendations(credits: number): string[] {
  const recommendations: string[] = [];

  if (credits < 40) {
    recommendations.push('เพิ่มการใช้คอนกรีตคาร์บอนต่ำ (+3 คะแนน)');
    recommendations.push('ใช้วัสดุในประเทศมากขึ้น (+2 คะแนน)');
    recommendations.push('เพิ่มวัสดุรีไซเคิล (+2 คะแนน)');
  } else if (credits < 50) {
    recommendations.push('ปรับปรุงการลดคาร์บอนเพิ่มเติม');
    recommendations.push('เพิ่มการใช้วัสดุรีไซเคิล');
  } else if (credits < 60) {
    recommendations.push('พิจารณาติดตั้งพลังงานหมุนเวียน');
    recommendations.push('เพิ่มประสิทธิภาพระบบ MEP');
  } else {
    recommendations.push('เพิ่มการจัดการน้ำและของเสีย');
    recommendations.push('ปรับปรุงคุณภาพอากาศภายใน');
  }

  return recommendations;
}

// ============================================
// Export Functions
// ============================================

export function generateTGOReport(
  type: TGOReportType,
  input: TGOAnalysisInput
): Report {
  switch (type) {
    case 'cfo':
      return generateCFOReport(input);
    case 'cfp':
      return generateCFPReport(input);
    case 'trees':
      return generateTREESReport(input);
    default:
      return generateCFOReport(input);
  }
}

export function tgoReportToMarkdown(report: Report): string {
  const lines: string[] = [];

  // Add each section's content
  for (const section of report.sections) {
    lines.push(section.content);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}
