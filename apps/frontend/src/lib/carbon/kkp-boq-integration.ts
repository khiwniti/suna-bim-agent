/**
 * KKP BOQ Database Integration
 *
 * Maps KKP BOQ database items to carbon emission factors
 * Enables automatic carbon calculation from standard Thai BOQ formats
 *
 * BOQ Structure follows วศท. (EIT) standard format
 */

import type {
  BOQCarbonItem,
  MaterialCategory,
} from './types';
import type { BOQInput } from './calculator';
import {
  THAI_MATERIALS,
  TGO_CFP_EMISSION_FACTORS,
  getMaterial,
  searchMaterials,
} from './emission-factors';

// =============================================================================
// KKP BOQ STRUCTURE
// =============================================================================

/**
 * KKP BOQ work sections (หมวดงาน)
 */
export type BOQWorkSection =
  | '01'  // งานเตรียมการและงานชั่วคราว (Preliminaries & Temporaries)
  | '02'  // งานดินและงานถมดิน (Earthwork)
  | '03'  // งานเสาเข็ม (Piling)
  | '04'  // งานฐานราก (Foundation)
  | '05'  // งานโครงสร้างคอนกรีต (Concrete Structure)
  | '06'  // งานโครงสร้างเหล็ก (Steel Structure)
  | '07'  // งานหลังคา (Roofing)
  | '08'  // งานผนังภายนอก (External Walls)
  | '09'  // งานผนังภายใน (Internal Walls)
  | '10'  // งานประตู-หน้าต่าง (Doors & Windows)
  | '11'  // งานพื้น (Flooring)
  | '12'  // งานฝ้าเพดาน (Ceiling)
  | '13'  // งานสี (Painting)
  | '14'  // งานระบบไฟฟ้า (Electrical)
  | '15'  // งานระบบสุขาภิบาล (Sanitary)
  | '16'  // งานระบบปรับอากาศ (Air Conditioning)
  | '17'  // งานระบบป้องกันอัคคีภัย (Fire Protection)
  | '18'  // งานภูมิทัศน์ (Landscaping)
  | '99'; // งานอื่นๆ (Others)

/**
 * Work section metadata
 */
export const BOQ_WORK_SECTIONS: Record<BOQWorkSection, {
  name: string;
  nameTh: string;
  primaryCategory: MaterialCategory;
  carbonIntensive: boolean;  // High carbon impact section
}> = {
  '01': { name: 'Preliminaries', nameTh: 'งานเตรียมการ', primaryCategory: 'other', carbonIntensive: false },
  '02': { name: 'Earthwork', nameTh: 'งานดิน', primaryCategory: 'aggregate', carbonIntensive: false },
  '03': { name: 'Piling', nameTh: 'งานเสาเข็ม', primaryCategory: 'concrete', carbonIntensive: true },
  '04': { name: 'Foundation', nameTh: 'งานฐานราก', primaryCategory: 'concrete', carbonIntensive: true },
  '05': { name: 'Concrete Structure', nameTh: 'งานโครงสร้างคอนกรีต', primaryCategory: 'concrete', carbonIntensive: true },
  '06': { name: 'Steel Structure', nameTh: 'งานโครงสร้างเหล็ก', primaryCategory: 'steel', carbonIntensive: true },
  '07': { name: 'Roofing', nameTh: 'งานหลังคา', primaryCategory: 'roofing', carbonIntensive: false },
  '08': { name: 'External Walls', nameTh: 'งานผนังภายนอก', primaryCategory: 'brick', carbonIntensive: false },
  '09': { name: 'Internal Walls', nameTh: 'งานผนังภายใน', primaryCategory: 'brick', carbonIntensive: false },
  '10': { name: 'Doors & Windows', nameTh: 'งานประตู-หน้าต่าง', primaryCategory: 'aluminum', carbonIntensive: false },
  '11': { name: 'Flooring', nameTh: 'งานพื้น', primaryCategory: 'flooring', carbonIntensive: false },
  '12': { name: 'Ceiling', nameTh: 'งานฝ้าเพดาน', primaryCategory: 'finishes', carbonIntensive: false },
  '13': { name: 'Painting', nameTh: 'งานสี', primaryCategory: 'finishes', carbonIntensive: false },
  '14': { name: 'Electrical', nameTh: 'งานไฟฟ้า', primaryCategory: 'MEP', carbonIntensive: false },
  '15': { name: 'Sanitary', nameTh: 'งานสุขาภิบาล', primaryCategory: 'MEP', carbonIntensive: false },
  '16': { name: 'Air Conditioning', nameTh: 'งานแอร์', primaryCategory: 'MEP', carbonIntensive: false },
  '17': { name: 'Fire Protection', nameTh: 'งานดับเพลิง', primaryCategory: 'MEP', carbonIntensive: false },
  '18': { name: 'Landscaping', nameTh: 'งานภูมิทัศน์', primaryCategory: 'other', carbonIntensive: false },
  '99': { name: 'Others', nameTh: 'งานอื่นๆ', primaryCategory: 'other', carbonIntensive: false },
};

/**
 * Raw KKP BOQ item from database
 */
export interface KKPBOQItem {
  // Standard BOQ fields
  itemNo: string;              // Item number (e.g., "05.01.01")
  description: string;         // Description in Thai
  descriptionEn?: string;      // Description in English
  unit: string;                // Unit (m³, kg, m², etc.)
  quantity: number;            // Quantity
  unitPrice?: number;          // Unit price (THB)
  amount?: number;             // Total amount (THB)

  // KKP-specific fields
  kkpCode?: string;            // KKP database reference code
  materialSpec?: string;       // Material specification
  workSection: BOQWorkSection; // Work section category
}

/**
 * Material mapping entry for KKP items
 */
export interface KKPMaterialMapping {
  pattern: RegExp;             // Pattern to match in description
  materialId: string;          // Thai material database ID
  emissionFactorId: string;    // TGO emission factor ID
  category: MaterialCategory;
  confidence: number;          // Mapping confidence (0-1)
}

// =============================================================================
// MATERIAL MAPPING DATABASE
// =============================================================================

/**
 * Mapping rules for KKP BOQ items to carbon database
 */
export const KKP_MATERIAL_MAPPINGS: KKPMaterialMapping[] = [
  // Concrete
  {
    pattern: /คอนกรีต.*[Cc]\s*20|[Cc]20\/25|คอนกรีตผสมเสร็จ.*20/i,
    materialId: 'mat-concrete-c20',
    emissionFactorId: 'tgo-concrete-readymix-standard',
    category: 'concrete',
    confidence: 0.95,
  },
  {
    pattern: /คอนกรีต.*[Cc]\s*30|[Cc]30\/37/i,
    materialId: 'mat-concrete-c30',
    emissionFactorId: 'tgo-concrete-readymix-standard',
    category: 'concrete',
    confidence: 0.95,
  },
  {
    pattern: /คอนกรีตมวลเบา|lightweight.*concrete/i,
    materialId: 'mat-concrete-lightweight',
    emissionFactorId: 'tgo-concrete-lightweight',
    category: 'concrete',
    confidence: 0.90,
  },
  {
    pattern: /คอนกรีตสำเร็จรูป|precast/i,
    materialId: 'mat-concrete-precast',
    emissionFactorId: 'tgo-concrete-precast',
    category: 'concrete',
    confidence: 0.90,
  },

  // Steel
  {
    pattern: /เหล็กข้ออ้อย.*DB\s*12|DB12|เหล็กเสริม.*12\s*มม/i,
    materialId: 'mat-steel-db12',
    emissionFactorId: 'tgo-steel-rebar-deformed',
    category: 'steel',
    confidence: 0.95,
  },
  {
    pattern: /เหล็กข้ออ้อย.*DB\s*16|DB16|เหล็กเสริม.*16\s*มม/i,
    materialId: 'mat-steel-db16',
    emissionFactorId: 'tgo-steel-rebar-deformed',
    category: 'steel',
    confidence: 0.95,
  },
  {
    pattern: /เหล็กข้ออ้อย.*DB\s*20|DB20|เหล็กเสริม.*20\s*มม/i,
    materialId: 'mat-steel-db20',
    emissionFactorId: 'tgo-steel-rebar-deformed',
    category: 'steel',
    confidence: 0.95,
  },
  {
    pattern: /เหล็กข้ออ้อย|เหล็กเสริม|deformed.*bar|rebar/i,
    materialId: 'mat-steel-db16',
    emissionFactorId: 'tgo-steel-rebar-deformed',
    category: 'steel',
    confidence: 0.80,
  },
  {
    pattern: /เหล็กรูปพรรณ|เหล็กโครงสร้าง|structural.*steel/i,
    materialId: 'mat-steel-structural',
    emissionFactorId: 'tgo-steel-structural',
    category: 'steel',
    confidence: 0.85,
  },

  // Cement
  {
    pattern: /ปูนซีเมนต์.*ประเภท\s*1|portland.*type\s*[iI1]|ปูนปอร์ตแลนด์/i,
    materialId: 'mat-cement-type1',
    emissionFactorId: 'tgo-cement-type1',
    category: 'cement',
    confidence: 0.90,
  },
  {
    pattern: /ปูนซีเมนต์|cement/i,
    materialId: 'mat-cement-type1',
    emissionFactorId: 'tgo-cement-general',
    category: 'cement',
    confidence: 0.75,
  },

  // Bricks & Blocks
  {
    pattern: /อิฐมอญ|clay.*brick|อิฐดินเผา/i,
    materialId: 'mat-brick-clay',
    emissionFactorId: 'tgo-brick-clay',
    category: 'brick',
    confidence: 0.90,
  },
  {
    pattern: /บล็อก.*AAC|AAC.*block|คอนกรีตมวลเบา.*บล็อก|Q-?CON/i,
    materialId: 'mat-block-aac',
    emissionFactorId: 'tgo-block-lightweight',
    category: 'brick',
    confidence: 0.95,
  },
  {
    pattern: /บล็อกคอนกรีต|concrete.*block/i,
    materialId: 'mat-block-concrete',
    emissionFactorId: 'tgo-block-concrete',
    category: 'brick',
    confidence: 0.85,
  },

  // Aggregates
  {
    pattern: /หินย่อย|crushed.*stone|aggregate/i,
    materialId: 'mat-aggregate-crushed',
    emissionFactorId: 'tgo-aggregate-crushed',
    category: 'aggregate',
    confidence: 0.85,
  },
  {
    pattern: /ทราย|sand/i,
    materialId: 'mat-aggregate-sand',
    emissionFactorId: 'tgo-aggregate-sand',
    category: 'aggregate',
    confidence: 0.80,
  },

  // Timber
  {
    pattern: /ไม้เนื้อแข็ง|hardwood/i,
    materialId: 'mat-timber-hardwood',
    emissionFactorId: 'tgo-timber-hardwood',
    category: 'timber',
    confidence: 0.85,
  },
  {
    pattern: /ไม้อัด|plywood/i,
    materialId: 'mat-timber-plywood',
    emissionFactorId: 'tgo-timber-plywood',
    category: 'timber',
    confidence: 0.90,
  },

  // Glass
  {
    pattern: /กระจกนิรภัย|tempered.*glass/i,
    materialId: 'mat-glass-tempered',
    emissionFactorId: 'tgo-glass-tempered',
    category: 'glass',
    confidence: 0.90,
  },
  {
    pattern: /กระจก|glass/i,
    materialId: 'mat-glass-flat',
    emissionFactorId: 'tgo-glass-flat',
    category: 'glass',
    confidence: 0.75,
  },

  // Aluminum
  {
    pattern: /อลูมิเนียม|aluminum|aluminium/i,
    materialId: 'mat-aluminum-general',
    emissionFactorId: 'tgo-aluminum-general',
    category: 'aluminum',
    confidence: 0.85,
  },
];

// =============================================================================
// BOQ PARSING & MAPPING
// =============================================================================

/**
 * Parse KKP BOQ items and map to carbon database
 */
export function parseKKPBOQ(items: KKPBOQItem[]): BOQInput[] {
  return items.map((item) => mapKKPItemToCarbon(item));
}

/**
 * Map single KKP BOQ item to carbon calculation input
 */
export function mapKKPItemToCarbon(item: KKPBOQItem): BOQInput {
  // Try to find matching material mapping
  const mapping = findBestMapping(item.description);

  // Get work section info for fallback category
  const workSection = BOQ_WORK_SECTIONS[item.workSection];

  return {
    id: item.itemNo,
    description: item.descriptionEn || item.description,
    descriptionTh: item.description,
    quantity: item.quantity,
    unit: item.unit,
    materialId: mapping?.materialId,
    emissionFactorId: mapping?.emissionFactorId,
    category: mapping?.category || workSection.primaryCategory,
  };
}

/**
 * Find best matching material mapping for description
 */
function findBestMapping(description: string): KKPMaterialMapping | null {
  let bestMatch: KKPMaterialMapping | null = null;
  let highestConfidence = 0;

  for (const mapping of KKP_MATERIAL_MAPPINGS) {
    if (mapping.pattern.test(description)) {
      if (mapping.confidence > highestConfidence) {
        bestMatch = mapping;
        highestConfidence = mapping.confidence;
      }
    }
  }

  return bestMatch;
}

/**
 * Analyze BOQ for carbon calculation readiness
 */
export function analyzeBOQReadiness(items: KKPBOQItem[]): {
  totalItems: number;
  mappedItems: number;
  unmappedItems: number;
  mappingRate: number;
  carbonIntensiveItems: number;
  unmappedList: { itemNo: string; description: string; suggestion: string }[];
} {
  let mappedItems = 0;
  let carbonIntensiveItems = 0;
  const unmappedList: { itemNo: string; description: string; suggestion: string }[] = [];

  for (const item of items) {
    const mapping = findBestMapping(item.description);
    const workSection = BOQ_WORK_SECTIONS[item.workSection];

    if (mapping) {
      mappedItems++;
    } else {
      // Try to suggest a mapping
      const suggestion = suggestMapping(item);
      unmappedList.push({
        itemNo: item.itemNo,
        description: item.description,
        suggestion,
      });
    }

    if (workSection.carbonIntensive) {
      carbonIntensiveItems++;
    }
  }

  return {
    totalItems: items.length,
    mappedItems,
    unmappedItems: items.length - mappedItems,
    mappingRate: items.length > 0 ? (mappedItems / items.length) * 100 : 0,
    carbonIntensiveItems,
    unmappedList,
  };
}

/**
 * Suggest material mapping for unmapped item
 */
function suggestMapping(item: KKPBOQItem): string {
  const workSection = BOQ_WORK_SECTIONS[item.workSection];

  // Search Thai materials database
  const searchTerms = item.description.split(/\s+/).slice(0, 3).join(' ');
  const matches = searchMaterials(searchTerms);

  if (matches.length > 0) {
    return `Consider mapping to: ${matches[0].name} (${matches[0].nameTh})`;
  }

  return `Use default for ${workSection.nameTh} (${workSection.primaryCategory})`;
}

// =============================================================================
// BOQ IMPORT/EXPORT
// =============================================================================

/**
 * Import BOQ from Excel/CSV format
 * Expected columns: ItemNo, Description, Unit, Quantity, UnitPrice, Amount
 */
export function importBOQFromArray(
  data: string[][],
  workSection: BOQWorkSection = '05'
): KKPBOQItem[] {
  const items: KKPBOQItem[] = [];

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.length < 4) continue;

    const itemNo = row[0]?.trim() || `${workSection}.${String(i).padStart(3, '0')}`;
    const description = row[1]?.trim() || '';
    const unit = row[2]?.trim() || '';
    const quantity = parseFloat(row[3]) || 0;
    const unitPrice = row[4] ? parseFloat(row[4]) : undefined;
    const amount = row[5] ? parseFloat(row[5]) : undefined;

    if (description && quantity > 0) {
      // Auto-detect work section from item number
      const detectedSection = itemNo.split('.')[0].padStart(2, '0') as BOQWorkSection;

      items.push({
        itemNo,
        description,
        unit,
        quantity,
        unitPrice,
        amount,
        workSection: BOQ_WORK_SECTIONS[detectedSection] ? detectedSection : workSection,
      });
    }
  }

  return items;
}

/**
 * Export mapped BOQ with carbon data
 */
export function exportBOQWithCarbon(
  items: KKPBOQItem[],
  carbonItems: BOQCarbonItem[]
): {
  itemNo: string;
  description: string;
  unit: string;
  quantity: number;
  emissionFactor: number;
  embodiedCarbon: number;
  materialId: string;
}[] {
  return items.map((item, index) => {
    const carbonItem = carbonItems.find((c) => c.boqItemId === item.itemNo);

    return {
      itemNo: item.itemNo,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      emissionFactor: carbonItem?.carbonIntensity || 0,
      embodiedCarbon: carbonItem?.embodiedCarbon || 0,
      materialId: carbonItem?.materialId || '',
    };
  });
}

/**
 * Generate BOQ carbon summary by work section
 */
export function summarizeBOQBySection(
  items: KKPBOQItem[],
  carbonItems: BOQCarbonItem[]
): {
  section: BOQWorkSection;
  name: string;
  nameTh: string;
  itemCount: number;
  totalCarbon: number;
  percentage: number;
}[] {
  const sectionMap = new Map<BOQWorkSection, { items: number; carbon: number }>();

  for (const item of items) {
    const carbonItem = carbonItems.find((c) => c.boqItemId === item.itemNo);
    const current = sectionMap.get(item.workSection) || { items: 0, carbon: 0 };

    sectionMap.set(item.workSection, {
      items: current.items + 1,
      carbon: current.carbon + (carbonItem?.embodiedCarbon || 0),
    });
  }

  const totalCarbon = Array.from(sectionMap.values()).reduce((sum, v) => sum + v.carbon, 0);

  return Array.from(sectionMap.entries())
    .map(([section, data]) => ({
      section,
      name: BOQ_WORK_SECTIONS[section].name,
      nameTh: BOQ_WORK_SECTIONS[section].nameTh,
      itemCount: data.items,
      totalCarbon: data.carbon,
      percentage: totalCarbon > 0 ? (data.carbon / totalCarbon) * 100 : 0,
    }))
    .sort((a, b) => b.totalCarbon - a.totalCarbon);
}
