/**
 * Thai Carbon Emission Factors Database
 *
 * Comprehensive emission factors for Thai construction materials
 * Sources: TGO CFP, Thai National LCI (MTEC), Research studies
 *
 * Key Focus: 80% of Embodied Carbon (30% of Total Carbon)
 * - Ready-mix concrete: 70-90% of project emissions
 * - Reinforcement steel: Major contributor
 * - Cement: 5% of Thai GHG emissions
 */

import type {
  EmissionFactor,
  ThaiMaterial,
  MaterialCategory,
  EmissionUnit,
  MaterialAlternative,
} from './types';

// =============================================================================
// TGO CFP EMISSION FACTORS
// Thai-specific emission factors from TGO Carbon Footprint of Product program
// =============================================================================

export const TGO_CFP_EMISSION_FACTORS: EmissionFactor[] = [
  // -------------------------------------------------------------------------
  // CONCRETE (Major hotspot: 70-90% of embodied carbon)
  // -------------------------------------------------------------------------
  {
    id: 'tgo-concrete-readymix-standard',
    name: 'Ready-mix Concrete (Standard)',
    nameTh: 'คอนกรีตผสมเสร็จ (มาตรฐาน)',
    category: 'concrete',
    emissionFactor: 268.6,
    unit: 'kgCO2e/m3',
    uncertainty: 10,
    source: 'TGO_CFP',
    sourceReference: 'TGO CFP Database 2023',
    sourceYear: 2023,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    hasLowCarbonAlternative: true,
    lowCarbonAlternativeId: 'tgo-concrete-lowcarbon-scg',
    carbonReductionPotential: 20,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-concrete-readymix-min',
    name: 'Ready-mix Concrete (Minimum)',
    nameTh: 'คอนกรีตผสมเสร็จ (ต่ำสุด)',
    category: 'concrete',
    emissionFactor: 243.0,
    unit: 'kgCO2e/m3',
    uncertainty: 10,
    source: 'TGO_CFP',
    sourceReference: 'TGO CFP Database 2023',
    sourceYear: 2023,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    hasLowCarbonAlternative: true,
    lowCarbonAlternativeId: 'tgo-concrete-lowcarbon-scg',
    carbonReductionPotential: 15,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-concrete-lowcarbon-scg',
    name: 'Low Carbon Concrete (SCG CPAC)',
    nameTh: 'คอนกรีตคาร์บอนต่ำ (CPAC)',
    category: 'concrete',
    emissionFactor: 214.9,
    unit: 'kgCO2e/m3',
    uncertainty: 8,
    source: 'MANUFACTURER',
    sourceReference: 'SCG CPAC Low Carbon Concrete EPD',
    sourceYear: 2024,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    tgoRegistrationNumber: 'CFP-2024-CPAC-001',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-concrete-lightweight',
    name: 'Lightweight Concrete',
    nameTh: 'คอนกรีตมวลเบา',
    category: 'concrete',
    emissionFactor: 220.0,
    unit: 'kgCO2e/m3',
    uncertainty: 12,
    source: 'THAI_LCI',
    sourceReference: 'Thai National LCI Database',
    sourceYear: 2022,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-concrete-precast',
    name: 'Precast Concrete',
    nameTh: 'คอนกรีตสำเร็จรูป',
    category: 'concrete',
    emissionFactor: 285.0,
    unit: 'kgCO2e/m3',
    uncertainty: 15,
    source: 'TGO_CFP',
    sourceReference: 'Precast Concrete Yard CFP Study',
    sourceYear: 2023,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // -------------------------------------------------------------------------
  // STEEL (Second major contributor)
  // -------------------------------------------------------------------------
  {
    id: 'tgo-steel-rebar-deformed',
    name: 'Deformed Reinforcement Steel',
    nameTh: 'เหล็กเสริมข้ออ้อย',
    category: 'steel',
    emissionFactor: 1.16,
    unit: 'kgCO2e/kg',
    uncertainty: 8,
    source: 'TGO_CFP',
    sourceReference: 'Millcon Steel CFP',
    sourceYear: 2023,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    tgoRegistrationNumber: 'CFP-2023-MILLCON-001',
    hasLowCarbonAlternative: true,
    lowCarbonAlternativeId: 'tgo-steel-rebar-recycled',
    carbonReductionPotential: 30,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-steel-rebar-min',
    name: 'Deformed Steel (Minimum)',
    nameTh: 'เหล็กเสริมข้ออ้อย (ต่ำสุด)',
    category: 'steel',
    emissionFactor: 1.06,
    unit: 'kgCO2e/kg',
    uncertainty: 8,
    source: 'TGO_CFP',
    sourceReference: 'TGO CFP Database',
    sourceYear: 2023,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-steel-rebar-recycled',
    name: 'Recycled Steel Rebar (EAF)',
    nameTh: 'เหล็กเสริมรีไซเคิล (EAF)',
    category: 'steel',
    emissionFactor: 0.81,
    unit: 'kgCO2e/kg',
    uncertainty: 10,
    source: 'TGO_CFP',
    sourceReference: 'Electric Arc Furnace Steel CFP',
    sourceYear: 2023,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-steel-structural',
    name: 'Structural Steel Section',
    nameTh: 'เหล็กโครงสร้างรูปพรรณ',
    category: 'steel',
    emissionFactor: 1.55,
    unit: 'kgCO2e/kg',
    uncertainty: 10,
    source: 'TGO_CFP',
    sourceReference: 'TGO CFP Database',
    sourceYear: 2023,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // -------------------------------------------------------------------------
  // CEMENT (5% of Thai GHG emissions)
  // -------------------------------------------------------------------------
  {
    id: 'tgo-cement-type1',
    name: 'Portland Cement Type I',
    nameTh: 'ปูนซีเมนต์ปอร์ตแลนด์ ประเภท 1',
    category: 'cement',
    emissionFactor: 0.93,
    unit: 'kgCO2e/kg',
    uncertainty: 5,
    source: 'TGO_CFP',
    sourceReference: 'TGO CFP Database 2023',
    sourceYear: 2023,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    hasLowCarbonAlternative: true,
    lowCarbonAlternativeId: 'tgo-cement-lowcarbon-scg',
    carbonReductionPotential: 20,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-cement-general',
    name: 'General Purpose Cement',
    nameTh: 'ปูนซีเมนต์อเนกประสงค์',
    category: 'cement',
    emissionFactor: 0.49,
    unit: 'kgCO2e/kg',
    uncertainty: 8,
    source: 'THAI_LCI',
    sourceReference: 'Thai National LCI Database',
    sourceYear: 2022,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-cement-lowcarbon-scg',
    name: 'Low Carbon Cement (SCG Gen 2)',
    nameTh: 'ปูนซีเมนต์คาร์บอนต่ำ (SCG รุ่น 2)',
    category: 'cement',
    emissionFactor: 0.74,
    unit: 'kgCO2e/kg',
    uncertainty: 5,
    source: 'MANUFACTURER',
    sourceReference: 'SCG Low Carbon Cement Gen 2 EPD',
    sourceYear: 2024,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    tgoRegistrationNumber: 'CFP-2024-SCG-CEMENT-001',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // -------------------------------------------------------------------------
  // BRICKS & BLOCKS
  // -------------------------------------------------------------------------
  {
    id: 'tgo-brick-clay',
    name: 'Clay Brick',
    nameTh: 'อิฐมอญ',
    category: 'brick',
    emissionFactor: 0.218,
    unit: 'kgCO2e/kg',
    uncertainty: 15,
    source: 'THAI_LCI',
    sourceReference: 'Thai National LCI Database',
    sourceYear: 2022,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    hasLowCarbonAlternative: true,
    lowCarbonAlternativeId: 'tgo-block-lightweight',
    carbonReductionPotential: 28,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-block-concrete',
    name: 'Concrete Block',
    nameTh: 'บล็อกคอนกรีต',
    category: 'brick',
    emissionFactor: 0.12,
    unit: 'kgCO2e/kg',
    uncertainty: 12,
    source: 'THAI_LCI',
    sourceReference: 'Thai National LCI Database',
    sourceYear: 2022,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-block-lightweight',
    name: 'Lightweight Concrete Block (AAC)',
    nameTh: 'บล็อกมวลเบา (AAC)',
    category: 'brick',
    emissionFactor: 0.157,
    unit: 'kgCO2e/kg',
    uncertainty: 10,
    source: 'TGO_CFP',
    sourceReference: 'AAC Block CFP Study',
    sourceYear: 2023,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // -------------------------------------------------------------------------
  // AGGREGATES
  // -------------------------------------------------------------------------
  {
    id: 'tgo-aggregate-crushed',
    name: 'Crushed Stone Aggregate',
    nameTh: 'หินย่อย',
    category: 'aggregate',
    emissionFactor: 0.0048,
    unit: 'kgCO2e/kg',
    uncertainty: 20,
    source: 'THAI_LCI',
    sourceReference: 'Thai National LCI Database',
    sourceYear: 2022,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-aggregate-sand',
    name: 'Construction Sand',
    nameTh: 'ทรายก่อสร้าง',
    category: 'aggregate',
    emissionFactor: 0.0051,
    unit: 'kgCO2e/kg',
    uncertainty: 20,
    source: 'THAI_LCI',
    sourceReference: 'Thai National LCI Database',
    sourceYear: 2022,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // -------------------------------------------------------------------------
  // TIMBER
  // -------------------------------------------------------------------------
  {
    id: 'tgo-timber-hardwood',
    name: 'Hardwood Timber (Domestic)',
    nameTh: 'ไม้เนื้อแข็ง (ในประเทศ)',
    category: 'timber',
    emissionFactor: 0.46,
    unit: 'kgCO2e/kg',
    uncertainty: 25,
    source: 'THAI_LCI',
    sourceReference: 'Thai Forestry LCI',
    sourceYear: 2022,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-timber-plywood',
    name: 'Plywood',
    nameTh: 'ไม้อัด',
    category: 'timber',
    emissionFactor: 0.68,
    unit: 'kgCO2e/kg',
    uncertainty: 20,
    source: 'THAI_LCI',
    sourceReference: 'Thai National LCI Database',
    sourceYear: 2022,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // -------------------------------------------------------------------------
  // GLASS
  // -------------------------------------------------------------------------
  {
    id: 'tgo-glass-flat',
    name: 'Flat Glass',
    nameTh: 'กระจกแผ่นเรียบ',
    category: 'glass',
    emissionFactor: 1.44,
    unit: 'kgCO2e/kg',
    uncertainty: 15,
    source: 'TGO_CFP',
    sourceReference: 'Thai Glass CFP Study',
    sourceYear: 2023,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-glass-tempered',
    name: 'Tempered Glass',
    nameTh: 'กระจกนิรภัย',
    category: 'glass',
    emissionFactor: 1.67,
    unit: 'kgCO2e/kg',
    uncertainty: 15,
    source: 'TGO_CFP',
    sourceReference: 'Thai Glass CFP Study',
    sourceYear: 2023,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // -------------------------------------------------------------------------
  // ALUMINUM
  // -------------------------------------------------------------------------
  {
    id: 'tgo-aluminum-general',
    name: 'Aluminum (General)',
    nameTh: 'อลูมิเนียม (ทั่วไป)',
    category: 'aluminum',
    emissionFactor: 8.24,
    unit: 'kgCO2e/kg',
    uncertainty: 12,
    source: 'TGO_CFP',
    sourceReference: 'TGO CFP Database',
    sourceYear: 2023,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    hasLowCarbonAlternative: true,
    lowCarbonAlternativeId: 'tgo-aluminum-recycled',
    carbonReductionPotential: 85,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-aluminum-recycled',
    name: 'Recycled Aluminum',
    nameTh: 'อลูมิเนียมรีไซเคิล',
    category: 'aluminum',
    emissionFactor: 1.28,
    unit: 'kgCO2e/kg',
    uncertainty: 15,
    source: 'TGO_CFP',
    sourceReference: 'Recycled Aluminum CFP Study',
    sourceYear: 2023,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // -------------------------------------------------------------------------
  // ENERGY (Grid Electricity)
  // -------------------------------------------------------------------------
  {
    id: 'tgo-electricity-grid',
    name: 'Thailand Grid Electricity',
    nameTh: 'ไฟฟ้าจากกริด (ประเทศไทย)',
    category: 'other',
    emissionFactor: 0.4999,
    unit: 'kgCO2e/kWh',
    uncertainty: 3,
    source: 'TGO_CFP',
    sourceReference: 'TGO Grid Emission Factor 2023',
    sourceYear: 2023,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tgo-electricity-solar',
    name: 'Solar Electricity (Onsite)',
    nameTh: 'ไฟฟ้าพลังงานแสงอาทิตย์',
    category: 'other',
    emissionFactor: 0.041,
    unit: 'kgCO2e/kWh',
    uncertainty: 10,
    source: 'TGO_CFP',
    sourceReference: 'TGO Renewable Energy CFP',
    sourceYear: 2023,
    boundary: 'cradle-to-gate',
    isThaiSpecific: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// =============================================================================
// THAI CONSTRUCTION MATERIALS DATABASE
// =============================================================================

export const THAI_MATERIALS: ThaiMaterial[] = [
  // -------------------------------------------------------------------------
  // CONCRETE PRODUCTS
  // -------------------------------------------------------------------------
  {
    id: 'mat-concrete-c20',
    name: 'Ready-mix Concrete C20/25',
    nameTh: 'คอนกรีตผสมเสร็จ C20/25',
    description: 'Standard structural concrete for general construction',
    category: 'concrete',
    subcategory: 'ready-mix',
    boqCode: '05.01.01',
    emissionFactorId: 'tgo-concrete-readymix-standard',
    emissionFactor: 268.6,
    unit: 'kgCO2e/m3',
    manufacturers: ['CPAC', 'TPI', 'INSEE'],
    isLocallyProduced: true,
    productionRegion: 'Central Thailand',
    alternatives: [
      {
        materialId: 'mat-concrete-lowcarbon',
        name: 'CPAC Low Carbon Concrete',
        nameTh: 'คอนกรีตคาร์บอนต่ำ CPAC',
        emissionFactor: 214.9,
        unit: 'kgCO2e/m3',
        carbonReduction: 20,
        costImpact: 'higher',
        availabilityInThailand: 'available',
      },
    ],
  },
  {
    id: 'mat-concrete-c30',
    name: 'Ready-mix Concrete C30/37',
    nameTh: 'คอนกรีตผสมเสร็จ C30/37',
    description: 'High-strength structural concrete',
    category: 'concrete',
    subcategory: 'ready-mix',
    boqCode: '05.01.02',
    emissionFactorId: 'tgo-concrete-readymix-standard',
    emissionFactor: 295.0,
    unit: 'kgCO2e/m3',
    manufacturers: ['CPAC', 'TPI', 'INSEE'],
    isLocallyProduced: true,
    productionRegion: 'Central Thailand',
  },

  // -------------------------------------------------------------------------
  // STEEL PRODUCTS
  // -------------------------------------------------------------------------
  {
    id: 'mat-steel-db12',
    name: 'Deformed Bar DB12',
    nameTh: 'เหล็กข้ออ้อย DB12',
    description: 'Deformed reinforcement bar 12mm diameter',
    category: 'steel',
    subcategory: 'reinforcement',
    boqCode: '05.02.01',
    emissionFactorId: 'tgo-steel-rebar-deformed',
    emissionFactor: 1.16,
    unit: 'kgCO2e/kg',
    manufacturers: ['Millcon Steel', 'Tata Steel Thailand', 'SSI'],
    isLocallyProduced: true,
    productionRegion: 'Eastern Thailand',
    recycledContentPercent: 25,
    alternatives: [
      {
        materialId: 'mat-steel-recycled',
        name: 'EAF Recycled Steel Rebar',
        nameTh: 'เหล็กข้ออ้อยรีไซเคิล',
        emissionFactor: 0.81,
        unit: 'kgCO2e/kg',
        carbonReduction: 30,
        costImpact: 'same',
        availabilityInThailand: 'available',
      },
    ],
  },
  {
    id: 'mat-steel-db16',
    name: 'Deformed Bar DB16',
    nameTh: 'เหล็กข้ออ้อย DB16',
    description: 'Deformed reinforcement bar 16mm diameter',
    category: 'steel',
    subcategory: 'reinforcement',
    boqCode: '05.02.02',
    emissionFactorId: 'tgo-steel-rebar-deformed',
    emissionFactor: 1.16,
    unit: 'kgCO2e/kg',
    manufacturers: ['Millcon Steel', 'Tata Steel Thailand', 'SSI'],
    isLocallyProduced: true,
    productionRegion: 'Eastern Thailand',
    recycledContentPercent: 25,
  },
  {
    id: 'mat-steel-db20',
    name: 'Deformed Bar DB20',
    nameTh: 'เหล็กข้ออ้อย DB20',
    description: 'Deformed reinforcement bar 20mm diameter',
    category: 'steel',
    subcategory: 'reinforcement',
    boqCode: '05.02.03',
    emissionFactorId: 'tgo-steel-rebar-deformed',
    emissionFactor: 1.16,
    unit: 'kgCO2e/kg',
    manufacturers: ['Millcon Steel', 'Tata Steel Thailand', 'SSI'],
    isLocallyProduced: true,
    productionRegion: 'Eastern Thailand',
    recycledContentPercent: 25,
  },

  // -------------------------------------------------------------------------
  // CEMENT PRODUCTS
  // -------------------------------------------------------------------------
  {
    id: 'mat-cement-type1',
    name: 'Portland Cement Type I (50kg)',
    nameTh: 'ปูนซีเมนต์ปอร์ตแลนด์ ประเภท 1 (50 กก.)',
    description: 'Standard Portland cement for general construction',
    category: 'cement',
    subcategory: 'portland',
    boqCode: '05.03.01',
    emissionFactorId: 'tgo-cement-type1',
    emissionFactor: 0.93,
    unit: 'kgCO2e/kg',
    manufacturers: ['SCG', 'TPI', 'INSEE', 'Jalaprathan'],
    isLocallyProduced: true,
    productionRegion: 'Saraburi',
    alternatives: [
      {
        materialId: 'mat-cement-lowcarbon',
        name: 'SCG Low Carbon Cement',
        nameTh: 'ปูนซีเมนต์คาร์บอนต่ำ SCG',
        emissionFactor: 0.74,
        unit: 'kgCO2e/kg',
        carbonReduction: 20,
        costImpact: 'same',
        availabilityInThailand: 'available',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // BRICKS & BLOCKS
  // -------------------------------------------------------------------------
  {
    id: 'mat-brick-clay',
    name: 'Clay Brick (Standard)',
    nameTh: 'อิฐมอญ (มาตรฐาน)',
    description: 'Traditional clay brick for walls',
    category: 'brick',
    subcategory: 'clay',
    boqCode: '04.01.01',
    emissionFactorId: 'tgo-brick-clay',
    emissionFactor: 0.218,
    unit: 'kgCO2e/kg',
    isLocallyProduced: true,
    productionRegion: 'Ayutthaya',
    alternatives: [
      {
        materialId: 'mat-block-aac',
        name: 'AAC Lightweight Block',
        nameTh: 'บล็อก AAC มวลเบา',
        emissionFactor: 0.157,
        unit: 'kgCO2e/kg',
        carbonReduction: 28,
        costImpact: 'higher',
        availabilityInThailand: 'available',
      },
    ],
  },
  {
    id: 'mat-block-aac',
    name: 'AAC Block (Lightweight)',
    nameTh: 'บล็อก AAC มวลเบา',
    description: 'Autoclaved Aerated Concrete block for walls',
    category: 'brick',
    subcategory: 'aac',
    boqCode: '04.01.02',
    emissionFactorId: 'tgo-block-lightweight',
    emissionFactor: 0.157,
    unit: 'kgCO2e/kg',
    manufacturers: ['Q-CON', 'Superblock', 'Diamond Brand'],
    isLocallyProduced: true,
    productionRegion: 'Central Thailand',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get emission factor by ID
 */
export function getEmissionFactor(id: string): EmissionFactor | undefined {
  return TGO_CFP_EMISSION_FACTORS.find((ef) => ef.id === id);
}

/**
 * Get emission factors by category
 */
export function getEmissionFactorsByCategory(
  category: MaterialCategory
): EmissionFactor[] {
  return TGO_CFP_EMISSION_FACTORS.filter((ef) => ef.category === category);
}

/**
 * Get material by ID
 */
export function getMaterial(id: string): ThaiMaterial | undefined {
  return THAI_MATERIALS.find((m) => m.id === id);
}

/**
 * Get materials by category
 */
export function getMaterialsByCategory(category: MaterialCategory): ThaiMaterial[] {
  return THAI_MATERIALS.filter((m) => m.category === category);
}

/**
 * Get low-carbon alternatives for a material
 */
export function getLowCarbonAlternatives(
  materialId: string
): MaterialAlternative[] {
  const material = getMaterial(materialId);
  return material?.alternatives || [];
}

/**
 * Calculate carbon reduction potential
 */
export function calculateCarbonReduction(
  currentEmission: number,
  alternativeEmission: number
): number {
  return ((currentEmission - alternativeEmission) / currentEmission) * 100;
}

/**
 * Get all Thai-specific emission factors
 */
export function getThaiSpecificFactors(): EmissionFactor[] {
  return TGO_CFP_EMISSION_FACTORS.filter((ef) => ef.isThaiSpecific);
}

/**
 * Search materials by name (Thai or English)
 */
export function searchMaterials(query: string): ThaiMaterial[] {
  const lowerQuery = query.toLowerCase();
  return THAI_MATERIALS.filter(
    (m) =>
      m.name.toLowerCase().includes(lowerQuery) ||
      m.nameTh.includes(query) ||
      m.description?.toLowerCase().includes(lowerQuery)
  );
}
