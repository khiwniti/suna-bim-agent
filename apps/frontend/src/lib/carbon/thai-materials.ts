/**
 * Thai Construction Materials Database
 * 
 * Extended database of Thai construction materials with:
 * - BOQ codes and standard references
 * - Manufacturer information
 * - Regional production data
 * - Carbon alternatives
 */

import type { MaterialCategory, EmissionUnit } from './types';

// =============================================================================
// THAI CONSTRUCTION MATERIAL TYPES
// =============================================================================

export interface ThaiConstructionMaterial {
  id: string;
  code: string; // Standard BOQ code
  name: string;
  nameTh: string;
  
  // Classification
  category: MaterialCategory;
  subcategory?: string;
  
  // Specifications
  specifications?: {
    grade?: string;
    size?: string;
    strength?: string;
    thickness?: string;
  };
  
  // Carbon data
  emissionFactor: number;
  emissionUnit: EmissionUnit;
  emissionFactorId: string;
  
  // Physical properties
  density?: number; // kg/m³
  weight?: number; // kg per unit
  
  // Supplier info
  producers: ThaiMaterialProducer[];
  isLocallyAvailable: boolean;
  
  // Regional availability
  availableRegions: ThaiRegion[];
  
  // Alternatives
  lowCarbonAlternatives?: LowCarbonAlternative[];
  
  // Standards compliance
  thaiStandard?: string;
  internationalStandard?: string;
}

export interface ThaiMaterialProducer {
  id: string;
  name: string;
  nameTh: string;
  province: string;
  products: string[];
  website?: string;
  certifications?: string[];
}

export interface LowCarbonAlternative {
  materialId: string;
  name: string;
  nameTh: string;
  emissionFactor: number;
  emissionUnit: EmissionUnit;
  carbonReduction: number; // Percentage
  costDifference: 'lower' | 'same' | 'higher' | 'premium';
  availability: 'widely_available' | 'available' | 'limited' | 'special_order';
}

export type ThaiRegion =
  | 'central'
  | 'eastern'
  | 'northern'
  | 'northeastern'
  | 'southern'
  | 'western';

// =============================================================================
// THAI PRODUCERS DATABASE
// =============================================================================

export const THAI_PRODUCERS: ThaiMaterialProducer[] = [
  // Concrete
  {
    id: 'producer-cpac',
    name: 'CPAC (Thai Concrete Products)',
    nameTh: 'ซีแพค',
    province: 'Saraburi',
    products: ['ready-mix-concrete', 'precast'],
    website: 'https://www.cpac.co.th',
    certifications: ['ISO 14001', 'TGO CFP'],
  },
  {
    id: 'producer-tpi',
    name: 'TPI Polene',
    nameTh: 'ทีพีไอ โพลีน',
    province: 'Saraburi',
    products: ['cement', 'ready-mix-concrete'],
    website: 'https://www.tpipolene.com',
    certifications: ['ISO 14001'],
  },
  {
    id: 'producer-insee',
    name: 'INSEE (Siam City Cement)',
    nameTh: 'อินซี',
    province: 'Saraburi',
    products: ['cement', 'ready-mix-concrete'],
    website: 'https://www.insee.co.th',
    certifications: ['ISO 14001', 'TGO CFP'],
  },
  
  // Steel
  {
    id: 'producer-millcon',
    name: 'Millcon Steel',
    nameTh: 'มิลล์คอน สตีล',
    province: 'Chonburi',
    products: ['rebar', 'structural-steel'],
    website: 'https://www.millcon.com',
    certifications: ['ISO 14001', 'TGO CFP'],
  },
  {
    id: 'producer-tata',
    name: 'Tata Steel Thailand',
    nameTh: 'ทาทา สตีล',
    province: 'Rayong',
    products: ['rebar'],
    website: 'https://www.tatasteelth.com',
    certifications: ['ISO 14001'],
  },
  
  // Cement
  {
    id: 'producer-scg',
    name: 'SCG Cement',
    nameTh: 'ปูนซีเมนต์ไทย',
    province: 'Saraburi',
    products: ['cement', 'low-carbon-cement'],
    website: 'https://www.scg.com',
    certifications: ['ISO 14001', 'TGO CFP'],
  },
  
  // Blocks
  {
    id: 'producer-qcon',
    name: 'Q-CON (Aerated Concrete)',
    nameTh: 'คิวคอน',
    province: 'Pathum Thani',
    products: ['aac-blocks'],
    website: 'https://www.qcon.co.th',
    certifications: ['ISO 14001', 'TGO CFP'],
  },
  {
    id: 'producer-superblock',
    name: 'Superblock',
    nameTh: 'ซุปเปอร์บล็อก',
    province: 'Ayutthaya',
    products: ['aac-blocks'],
    certifications: ['ISO 14001'],
  },
  
  // Glass
  {
    id: 'producer-asahi',
    name: 'Asahi Glass Thailand',
    nameTh: 'อาซาฮิ กลาส',
    province: 'Chonburi',
    products: ['flat-glass', 'tempered-glass'],
    website: 'https://www.agc.co.th',
    certifications: ['ISO 14001'],
  },
];

// =============================================================================
// THAI CONSTRUCTION MATERIALS DATABASE
// =============================================================================

export const THAI_CONSTRUCTION_MATERIALS: ThaiConstructionMaterial[] = [
  // -------------------------------------------------------------------------
  // READY-MIX CONCRETE
  // -------------------------------------------------------------------------
  {
    id: 'th-mat-c20-25',
    code: '05.01.01.01',
    name: 'Ready-mix Concrete C20/25',
    nameTh: 'คอนกรีตผสมเสร็จ C20/25',
    category: 'concrete',
    subcategory: 'ready-mix',
    specifications: {
      grade: 'C20/25',
      strength: '20 MPa',
    },
    emissionFactor: 268.6,
    emissionUnit: 'kgCO2e/m3',
    emissionFactorId: 'tgo-concrete-readymix-standard',
    density: 2400,
    producers: [
      THAI_PRODUCERS.find(p => p.id === 'producer-cpac')!,
      THAI_PRODUCERS.find(p => p.id === 'producer-tpi')!,
      THAI_PRODUCERS.find(p => p.id === 'producer-insee')!,
    ],
    isLocallyAvailable: true,
    availableRegions: ['central', 'eastern', 'northern', 'northeastern', 'southern', 'western'],
    lowCarbonAlternatives: [
      {
        materialId: 'th-mat-lowcarbon-concrete',
        name: 'CPAC Low Carbon Concrete',
        nameTh: 'คอนกรีตคาร์บอนต่ำ CPAC',
        emissionFactor: 214.9,
        emissionUnit: 'kgCO2e/m3',
        carbonReduction: 20,
        costDifference: 'higher',
        availability: 'available',
      },
    ],
    thaiStandard: 'TIS 213-2549',
  },
  {
    id: 'th-mat-c25-30',
    code: '05.01.01.02',
    name: 'Ready-mix Concrete C25/30',
    nameTh: 'คอนกรีตผสมเสร็จ C25/30',
    category: 'concrete',
    subcategory: 'ready-mix',
    specifications: {
      grade: 'C25/30',
      strength: '25 MPa',
    },
    emissionFactor: 285.0,
    emissionUnit: 'kgCO2e/m3',
    emissionFactorId: 'tgo-concrete-readymix-standard',
    density: 2400,
    producers: [
      THAI_PRODUCERS.find(p => p.id === 'producer-cpac')!,
      THAI_PRODUCERS.find(p => p.id === 'producer-insee')!,
    ],
    isLocallyAvailable: true,
    availableRegions: ['central', 'eastern', 'northern', 'southern'],
    lowCarbonAlternatives: [
      {
        materialId: 'th-mat-lowcarbon-concrete',
        name: 'CPAC Low Carbon Concrete',
        nameTh: 'คอนกรีตคาร์บอนต่ำ CPAC',
        emissionFactor: 229.0,
        emissionUnit: 'kgCO2e/m3',
        carbonReduction: 20,
        costDifference: 'higher',
        availability: 'available',
      },
    ],
    thaiStandard: 'TIS 213-2549',
  },
  {
    id: 'th-mat-c30-37',
    code: '05.01.01.03',
    name: 'Ready-mix Concrete C30/37',
    nameTh: 'คอนกรีตผสมเสร็จ C30/37',
    category: 'concrete',
    subcategory: 'ready-mix',
    specifications: {
      grade: 'C30/37',
      strength: '30 MPa',
    },
    emissionFactor: 295.0,
    emissionUnit: 'kgCO2e/m3',
    emissionFactorId: 'tgo-concrete-readymix-standard',
    density: 2400,
    producers: [
      THAI_PRODUCERS.find(p => p.id === 'producer-cpac')!,
    ],
    isLocallyAvailable: true,
    availableRegions: ['central', 'eastern'],
    thaiStandard: 'TIS 213-2549',
  },
  
  // -------------------------------------------------------------------------
  // REINFORCEMENT STEEL
  // -------------------------------------------------------------------------
  {
    id: 'th-mat-db12',
    code: '05.02.01.01',
    name: 'Deformed Bar DB12',
    nameTh: 'เหล็กข้ออ้อย DB12',
    category: 'steel',
    subcategory: 'reinforcement',
    specifications: {
      grade: 'SD40',
      size: '12mm',
    },
    emissionFactor: 1.16,
    emissionUnit: 'kgCO2e/kg',
    emissionFactorId: 'tgo-steel-rebar-deformed',
    density: 7850,
    weight: 0.888, // kg/m
    producers: [
      THAI_PRODUCERS.find(p => p.id === 'producer-millcon')!,
      THAI_PRODUCERS.find(p => p.id === 'producer-tata')!,
    ],
    isLocallyAvailable: true,
    availableRegions: ['central', 'eastern', 'northern', 'southern'],
    lowCarbonAlternatives: [
      {
        materialId: 'th-mat-recycled-steel',
        name: 'EAF Recycled Steel Rebar',
        nameTh: 'เหล็กข้ออ้อยรีไซเคิล (EAF)',
        emissionFactor: 0.81,
        emissionUnit: 'kgCO2e/kg',
        carbonReduction: 30,
        costDifference: 'same',
        availability: 'available',
      },
    ],
    thaiStandard: 'TIS 24-2548',
  },
  {
    id: 'th-mat-db16',
    code: '05.02.01.02',
    name: 'Deformed Bar DB16',
    nameTh: 'เหล็กข้ออ้อย DB16',
    category: 'steel',
    subcategory: 'reinforcement',
    specifications: {
      grade: 'SD40',
      size: '16mm',
    },
    emissionFactor: 1.16,
    emissionUnit: 'kgCO2e/kg',
    emissionFactorId: 'tgo-steel-rebar-deformed',
    density: 7850,
    weight: 1.58, // kg/m
    producers: [
      THAI_PRODUCERS.find(p => p.id === 'producer-millcon')!,
      THAI_PRODUCERS.find(p => p.id === 'producer-tata')!,
    ],
    isLocallyAvailable: true,
    availableRegions: ['central', 'eastern', 'northern', 'southern'],
    lowCarbonAlternatives: [
      {
        materialId: 'th-mat-recycled-steel',
        name: 'EAF Recycled Steel Rebar',
        nameTh: 'เหล็กข้ออ้อยรีไซเคิล (EAF)',
        emissionFactor: 0.81,
        emissionUnit: 'kgCO2e/kg',
        carbonReduction: 30,
        costDifference: 'same',
        availability: 'available',
      },
    ],
    thaiStandard: 'TIS 24-2548',
  },
  {
    id: 'th-mat-db20',
    code: '05.02.01.03',
    name: 'Deformed Bar DB20',
    nameTh: 'เหล็กข้ออ้อย DB20',
    category: 'steel',
    subcategory: 'reinforcement',
    specifications: {
      grade: 'SD40',
      size: '20mm',
    },
    emissionFactor: 1.16,
    emissionUnit: 'kgCO2e/kg',
    emissionFactorId: 'tgo-steel-rebar-deformed',
    density: 7850,
    weight: 2.47, // kg/m
    producers: [
      THAI_PRODUCERS.find(p => p.id === 'producer-millcon')!,
      THAI_PRODUCERS.find(p => p.id === 'producer-tata')!,
    ],
    isLocallyAvailable: true,
    availableRegions: ['central', 'eastern', 'northern', 'southern'],
    thaiStandard: 'TIS 24-2548',
  },
  {
    id: 'th-mat-db25',
    code: '05.02.01.04',
    name: 'Deformed Bar DB25',
    nameTh: 'เหล็กข้ออ้อย DB25',
    category: 'steel',
    subcategory: 'reinforcement',
    specifications: {
      grade: 'SD40',
      size: '25mm',
    },
    emissionFactor: 1.16,
    emissionUnit: 'kgCO2e/kg',
    emissionFactorId: 'tgo-steel-rebar-deformed',
    density: 7850,
    weight: 3.85, // kg/m
    producers: [
      THAI_PRODUCERS.find(p => p.id === 'producer-millcon')!,
    ],
    isLocallyAvailable: true,
    availableRegions: ['central', 'eastern'],
    thaiStandard: 'TIS 24-2548',
  },
  
  // -------------------------------------------------------------------------
  // CEMENT
  // -------------------------------------------------------------------------
  {
    id: 'th-mat-cement-type1',
    code: '05.03.01.01',
    name: 'Portland Cement Type I',
    nameTh: 'ปูนซีเมนต์ปอร์ตแลนด์ ประเภท 1',
    category: 'cement',
    subcategory: 'portland',
    specifications: {
      grade: 'Type I',
    },
    emissionFactor: 0.93,
    emissionUnit: 'kgCO2e/kg',
    emissionFactorId: 'tgo-cement-type1',
    density: 1440,
    weight: 50, // kg per bag
    producers: [
      THAI_PRODUCERS.find(p => p.id === 'producer-scg')!,
      THAI_PRODUCERS.find(p => p.id === 'producer-tpi')!,
      THAI_PRODUCERS.find(p => p.id === 'producer-insee')!,
    ],
    isLocallyAvailable: true,
    availableRegions: ['central', 'eastern', 'northern', 'northeastern', 'southern', 'western'],
    lowCarbonAlternatives: [
      {
        materialId: 'th-mat-cement-lowcarbon',
        name: 'SCG Low Carbon Cement Gen 2',
        nameTh: 'ปูนซีเมนต์คาร์บอนต่ำ SCG รุ่น 2',
        emissionFactor: 0.74,
        emissionUnit: 'kgCO2e/kg',
        carbonReduction: 20,
        costDifference: 'same',
        availability: 'available',
      },
    ],
    thaiStandard: 'TIS 15-2535',
  },
  
  // -------------------------------------------------------------------------
  // BRICKS & BLOCKS
  // -------------------------------------------------------------------------
  {
    id: 'th-mat-clay-brick',
    code: '04.01.01.01',
    name: 'Clay Brick (Standard)',
    nameTh: 'อิฐมอญ (มาตรฐาน)',
    category: 'brick',
    subcategory: 'clay',
    specifications: {
      size: '6.5 x 10 x 20 cm',
    },
    emissionFactor: 0.218,
    emissionUnit: 'kgCO2e/kg',
    emissionFactorId: 'tgo-brick-clay',
    density: 1800,
    weight: 2.3, // kg per brick
    producers: [],
    isLocallyAvailable: true,
    availableRegions: ['central', 'northern', 'northeastern'],
    lowCarbonAlternatives: [
      {
        materialId: 'th-mat-aac-block',
        name: 'AAC Lightweight Block',
        nameTh: 'บล็อกมวลเบา AAC',
        emissionFactor: 0.157,
        emissionUnit: 'kgCO2e/kg',
        carbonReduction: 28,
        costDifference: 'higher',
        availability: 'widely_available',
      },
    ],
    thaiStandard: 'TIS 77-2530',
  },
  {
    id: 'th-mat-aac-block',
    code: '04.01.02.01',
    name: 'AAC Block (Lightweight)',
    nameTh: 'บล็อกมวลเบา AAC',
    category: 'brick',
    subcategory: 'aac',
    specifications: {
      size: '7.5 x 20 x 60 cm',
    },
    emissionFactor: 0.157,
    emissionUnit: 'kgCO2e/kg',
    emissionFactorId: 'tgo-block-lightweight',
    density: 550,
    weight: 5.0, // kg per block
    producers: [
      THAI_PRODUCERS.find(p => p.id === 'producer-qcon')!,
      THAI_PRODUCERS.find(p => p.id === 'producer-superblock')!,
    ],
    isLocallyAvailable: true,
    availableRegions: ['central', 'eastern', 'northern', 'southern'],
    thaiStandard: 'TIS 1505-2541',
  },
  {
    id: 'th-mat-concrete-block',
    code: '04.01.03.01',
    name: 'Concrete Block (Hollow)',
    nameTh: 'บล็อกคอนกรีต (กลวง)',
    category: 'brick',
    subcategory: 'concrete',
    specifications: {
      size: '7.5 x 20 x 40 cm',
    },
    emissionFactor: 0.12,
    emissionUnit: 'kgCO2e/kg',
    emissionFactorId: 'tgo-block-concrete',
    density: 1800,
    weight: 12.0, // kg per block
    producers: [],
    isLocallyAvailable: true,
    availableRegions: ['central', 'eastern', 'northern', 'northeastern', 'southern', 'western'],
    thaiStandard: 'TIS 109-2535',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get material by BOQ code
 */
export function getThaiMaterialByCode(code: string): ThaiConstructionMaterial | undefined {
  return THAI_CONSTRUCTION_MATERIALS.find(m => m.code === code);
}

/**
 * Search materials by name (Thai or English)
 */
export function searchThaiMaterials(query: string): ThaiConstructionMaterial[] {
  const lowerQuery = query.toLowerCase();
  return THAI_CONSTRUCTION_MATERIALS.filter(m =>
    m.name.toLowerCase().includes(lowerQuery) ||
    m.nameTh.includes(query) ||
    m.code.includes(query)
  );
}

/**
 * Get material producers
 */
export function getMaterialProducers(materialId: string): ThaiMaterialProducer[] {
  const material = THAI_CONSTRUCTION_MATERIALS.find(m => m.id === materialId);
  return material?.producers || [];
}

/**
 * Get materials by category
 */
export function getMaterialsByCategory(category: MaterialCategory): ThaiConstructionMaterial[] {
  return THAI_CONSTRUCTION_MATERIALS.filter(m => m.category === category);
}

/**
 * Get materials available in a region
 */
export function getMaterialsByRegion(region: ThaiRegion): ThaiConstructionMaterial[] {
  return THAI_CONSTRUCTION_MATERIALS.filter(m => m.availableRegions.includes(region));
}

/**
 * Get low-carbon alternatives
 */
export function getLowCarbonAlternatives(materialId: string): LowCarbonAlternative[] {
  const material = THAI_CONSTRUCTION_MATERIALS.find(m => m.id === materialId);
  return material?.lowCarbonAlternatives || [];
}

/**
 * Calculate potential carbon savings from alternative
 */
export function calculateCarbonSavings(
  materialId: string,
  alternativeId: string,
  quantity: number,
  unit: 'volume' | 'mass'
): number {
  const material = THAI_CONSTRUCTION_MATERIALS.find(m => m.id === materialId);
  const alternative = material?.lowCarbonAlternatives?.find(a => a.materialId === alternativeId);
  
  if (!material || !alternative) return 0;
  
  const currentEmission = material.emissionFactor * quantity;
  const alternativeEmission = alternative.emissionFactor * quantity;
  
  return currentEmission - alternativeEmission;
}
