/**
 * Thai Material Carbon Database
 *
 * Comprehensive emission factors for construction materials available in Thailand.
 * Sources:
 * - TGO (Thailand Greenhouse Gas Management Organization)
 * - MTEC (National Metal and Materials Technology Center)
 * - SCG EPDs (Environmental Product Declarations)
 * - TGBI (Thai Green Building Institute)
 * - Academic research from Thai universities
 *
 * ★ Insight ─────────────────────────────────────
 * This database provides Thailand-specific emission factors that differ from
 * international databases (ICE, EC3) due to:
 * - Local energy grid mix (high fossil fuel dependency)
 * - Regional manufacturing processes
 * - Transportation distances within Thailand
 * - Climate-specific building requirements
 * ─────────────────────────────────────────────────
 */

// ============================================
// Types
// ============================================

export type ThaiMaterialCategory =
  | 'concrete'
  | 'steel'
  | 'masonry'
  | 'timber'
  | 'glass'
  | 'insulation'
  | 'finishes'
  | 'mep'
  | 'roofing'
  | 'waterproofing';

export type EmissionSource =
  | 'TGO'           // Thailand Greenhouse Gas Management Organization
  | 'MTEC'          // National Metal and Materials Technology Center
  | 'SCG_EPD'       // SCG Environmental Product Declaration
  | 'CPAC_EPD'      // CPAC EPD
  | 'TGBI'          // Thai Green Building Institute
  | 'Research'      // Academic research
  | 'Calculated'    // Calculated from composition
  | 'Generic';      // Generic international data adapted

export type DataQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'estimated';

export interface ThaiMaterial {
  id: string;
  nameEn: string;
  nameTh: string;
  category: ThaiMaterialCategory;
  subcategory?: string;

  // Emission factors (kgCO2e per unit)
  emissionFactor: number;
  unit: 'kg' | 'm³' | 'm²' | 'm' | 'piece' | 'set';

  // Physical properties
  density?: number;        // kg/m³
  thickness?: number;      // mm (for sheet/panel materials)

  // Metadata
  source: EmissionSource;
  sourceYear?: number;
  sourceReference?: string;
  dataQuality: DataQuality;

  // Low-carbon alternative
  lowCarbonAlternativeId?: string;
  carbonReductionPotential?: number; // percentage

  // Additional info
  manufacturer?: string;
  certifications?: string[];
  locallyAvailable: boolean;
  region?: 'nationwide' | 'central' | 'north' | 'northeast' | 'south' | 'east';

  // Tags for search
  tags?: string[];
}

// ============================================
// Thai Material Database
// ============================================

export const THAI_MATERIALS: Record<string, ThaiMaterial> = {
  // ============================================
  // CONCRETE (คอนกรีต)
  // ============================================

  // Ready-Mix Concrete
  'concrete_c15': {
    id: 'concrete_c15',
    nameEn: 'Ready-Mix Concrete C15/180',
    nameTh: 'คอนกรีตผสมเสร็จ C15/180',
    category: 'concrete',
    subcategory: 'ready_mix',
    emissionFactor: 215.0,
    unit: 'm³',
    density: 2350,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database 2023',
    dataQuality: 'good',
    lowCarbonAlternativeId: 'concrete_c15_lowcarbon',
    carbonReductionPotential: 20,
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['structural', 'foundation', 'ready-mix'],
  },

  'concrete_c20': {
    id: 'concrete_c20',
    nameEn: 'Ready-Mix Concrete C20/210',
    nameTh: 'คอนกรีตผสมเสร็จ C20/210',
    category: 'concrete',
    subcategory: 'ready_mix',
    emissionFactor: 228.0,
    unit: 'm³',
    density: 2400,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database 2023',
    dataQuality: 'good',
    lowCarbonAlternativeId: 'concrete_c20_lowcarbon',
    carbonReductionPotential: 20,
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['structural', 'slab', 'ready-mix'],
  },

  'concrete_c25': {
    id: 'concrete_c25',
    nameEn: 'Ready-Mix Concrete C25/240',
    nameTh: 'คอนกรีตผสมเสร็จ C25/240',
    category: 'concrete',
    subcategory: 'ready_mix',
    emissionFactor: 243.0,
    unit: 'm³',
    density: 2400,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database 2023',
    dataQuality: 'good',
    lowCarbonAlternativeId: 'concrete_c25_lowcarbon',
    carbonReductionPotential: 20,
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['structural', 'beam', 'column', 'ready-mix'],
  },

  'concrete_c30': {
    id: 'concrete_c30',
    nameEn: 'Ready-Mix Concrete C30/280',
    nameTh: 'คอนกรีตผสมเสร็จ C30/280',
    category: 'concrete',
    subcategory: 'ready_mix',
    emissionFactor: 268.6,
    unit: 'm³',
    density: 2400,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database 2023',
    dataQuality: 'good',
    lowCarbonAlternativeId: 'concrete_c30_lowcarbon',
    carbonReductionPotential: 25,
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['structural', 'high-rise', 'ready-mix'],
  },

  'concrete_c35': {
    id: 'concrete_c35',
    nameEn: 'Ready-Mix Concrete C35/320',
    nameTh: 'คอนกรีตผสมเสร็จ C35/320',
    category: 'concrete',
    subcategory: 'ready_mix',
    emissionFactor: 295.0,
    unit: 'm³',
    density: 2400,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database 2023',
    dataQuality: 'good',
    lowCarbonAlternativeId: 'concrete_c35_lowcarbon',
    carbonReductionPotential: 25,
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['structural', 'high-rise', 'ready-mix'],
  },

  'concrete_c40': {
    id: 'concrete_c40',
    nameEn: 'Ready-Mix Concrete C40/360',
    nameTh: 'คอนกรีตผสมเสร็จ C40/360',
    category: 'concrete',
    subcategory: 'ready_mix',
    emissionFactor: 320.0,
    unit: 'm³',
    density: 2450,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database 2023',
    dataQuality: 'good',
    lowCarbonAlternativeId: 'concrete_c40_lowcarbon',
    carbonReductionPotential: 25,
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['structural', 'high-strength', 'ready-mix'],
  },

  // Low-Carbon Concrete (SCG Green Cement alternatives)
  'concrete_c25_lowcarbon': {
    id: 'concrete_c25_lowcarbon',
    nameEn: 'Low Carbon Concrete C25 (30% fly ash)',
    nameTh: 'คอนกรีตคาร์บอนต่ำ C25 (เถ้าลอย 30%)',
    category: 'concrete',
    subcategory: 'low_carbon',
    emissionFactor: 196.0,
    unit: 'm³',
    density: 2400,
    source: 'SCG_EPD',
    sourceYear: 2023,
    sourceReference: 'SCG Green Cement EPD 2023',
    dataQuality: 'excellent',
    manufacturer: 'SCG',
    certifications: ['TGO CFP', 'EPD'],
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['green', 'sustainable', 'fly-ash', 'structural'],
  },

  'concrete_c30_lowcarbon': {
    id: 'concrete_c30_lowcarbon',
    nameEn: 'Low Carbon Concrete C30 (30% fly ash)',
    nameTh: 'คอนกรีตคาร์บอนต่ำ C30 (เถ้าลอย 30%)',
    category: 'concrete',
    subcategory: 'low_carbon',
    emissionFactor: 202.0,
    unit: 'm³',
    density: 2400,
    source: 'SCG_EPD',
    sourceYear: 2023,
    sourceReference: 'SCG Green Cement EPD 2023',
    dataQuality: 'excellent',
    manufacturer: 'SCG',
    certifications: ['TGO CFP', 'EPD'],
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['green', 'sustainable', 'fly-ash', 'high-rise'],
  },

  'concrete_c35_lowcarbon': {
    id: 'concrete_c35_lowcarbon',
    nameEn: 'Low Carbon Concrete C35 (GGBS blend)',
    nameTh: 'คอนกรีตคาร์บอนต่ำ C35 (ตะกรันเตาถลุงเหล็ก)',
    category: 'concrete',
    subcategory: 'low_carbon',
    emissionFactor: 220.0,
    unit: 'm³',
    density: 2400,
    source: 'SCG_EPD',
    sourceYear: 2023,
    sourceReference: 'SCG Green Cement EPD 2023',
    dataQuality: 'excellent',
    manufacturer: 'SCG',
    certifications: ['TGO CFP', 'EPD'],
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['green', 'sustainable', 'GGBS', 'high-strength'],
  },

  // Precast Concrete
  'concrete_precast_panel': {
    id: 'concrete_precast_panel',
    nameEn: 'Precast Concrete Wall Panel',
    nameTh: 'แผ่นผนังคอนกรีตสำเร็จรูป',
    category: 'concrete',
    subcategory: 'precast',
    emissionFactor: 310.0,
    unit: 'm³',
    density: 2400,
    source: 'CPAC_EPD',
    sourceYear: 2022,
    sourceReference: 'CPAC Precast EPD',
    dataQuality: 'good',
    manufacturer: 'CPAC',
    certifications: ['TGO CFP'],
    locallyAvailable: true,
    region: 'central',
    tags: ['precast', 'wall', 'industrialized'],
  },

  'concrete_precast_slab': {
    id: 'concrete_precast_slab',
    nameEn: 'Precast Concrete Floor Slab (Hollow Core)',
    nameTh: 'พื้นคอนกรีตสำเร็จรูปกลวง',
    category: 'concrete',
    subcategory: 'precast',
    emissionFactor: 285.0,
    unit: 'm³',
    density: 1800,
    source: 'CPAC_EPD',
    sourceYear: 2022,
    sourceReference: 'CPAC Precast EPD',
    dataQuality: 'good',
    manufacturer: 'CPAC',
    certifications: ['TGO CFP'],
    locallyAvailable: true,
    region: 'central',
    tags: ['precast', 'floor', 'hollow-core'],
  },

  // Cement
  'cement_portland_type1': {
    id: 'cement_portland_type1',
    nameEn: 'Portland Cement Type I',
    nameTh: 'ปูนซีเมนต์ปอร์ตแลนด์ประเภท 1',
    category: 'concrete',
    subcategory: 'cement',
    emissionFactor: 0.866,
    unit: 'kg',
    density: 1500,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database 2023',
    dataQuality: 'excellent',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['cement', 'binder', 'OPC'],
  },

  'cement_blended': {
    id: 'cement_blended',
    nameEn: 'Blended Cement (Portland Composite)',
    nameTh: 'ปูนซีเมนต์ผสม',
    category: 'concrete',
    subcategory: 'cement',
    emissionFactor: 0.650,
    unit: 'kg',
    density: 1500,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database 2023',
    dataQuality: 'excellent',
    lowCarbonAlternativeId: 'cement_green',
    carbonReductionPotential: 15,
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['cement', 'binder', 'blended'],
  },

  'cement_green': {
    id: 'cement_green',
    nameEn: 'SCG Green Cement (Low Carbon)',
    nameTh: 'ปูนซีเมนต์คาร์บอนต่ำ SCG',
    category: 'concrete',
    subcategory: 'cement',
    emissionFactor: 0.550,
    unit: 'kg',
    density: 1500,
    source: 'SCG_EPD',
    sourceYear: 2023,
    sourceReference: 'SCG Green Cement EPD',
    dataQuality: 'excellent',
    manufacturer: 'SCG',
    certifications: ['TGO CFP', 'EPD', 'Carbon Label'],
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['green', 'low-carbon', 'cement'],
  },

  // ============================================
  // STEEL (เหล็ก)
  // ============================================

  'steel_rebar_sd40': {
    id: 'steel_rebar_sd40',
    nameEn: 'Steel Deformed Bar SD40',
    nameTh: 'เหล็กข้ออ้อย SD40',
    category: 'steel',
    subcategory: 'reinforcement',
    emissionFactor: 1.060,
    unit: 'kg',
    density: 7850,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor - Steel Industry',
    dataQuality: 'good',
    lowCarbonAlternativeId: 'steel_rebar_recycled',
    carbonReductionPotential: 25,
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['rebar', 'reinforcement', 'structural'],
  },

  'steel_rebar_sd50': {
    id: 'steel_rebar_sd50',
    nameEn: 'Steel Deformed Bar SD50',
    nameTh: 'เหล็กข้ออ้อย SD50',
    category: 'steel',
    subcategory: 'reinforcement',
    emissionFactor: 1.120,
    unit: 'kg',
    density: 7850,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor - Steel Industry',
    dataQuality: 'good',
    lowCarbonAlternativeId: 'steel_rebar_recycled',
    carbonReductionPotential: 25,
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['rebar', 'high-strength', 'structural'],
  },

  'steel_rebar_recycled': {
    id: 'steel_rebar_recycled',
    nameEn: 'Recycled Steel Rebar (EAF)',
    nameTh: 'เหล็กข้ออ้อยรีไซเคิล (EAF)',
    category: 'steel',
    subcategory: 'reinforcement',
    emissionFactor: 0.780,
    unit: 'kg',
    density: 7850,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Millcon Steel EPD + Research',
    dataQuality: 'good',
    manufacturer: 'Millcon',
    certifications: ['TGO CFP'],
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['recycled', 'EAF', 'sustainable', 'rebar'],
  },

  'steel_structural_h': {
    id: 'steel_structural_h',
    nameEn: 'Structural Steel H-Beam',
    nameTh: 'เหล็กโครงสร้าง H-Beam',
    category: 'steel',
    subcategory: 'structural',
    emissionFactor: 1.850,
    unit: 'kg',
    density: 7850,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Steel Industry Analysis',
    dataQuality: 'good',
    lowCarbonAlternativeId: 'steel_structural_recycled',
    carbonReductionPotential: 30,
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['H-beam', 'structural', 'frame'],
  },

  'steel_structural_recycled': {
    id: 'steel_structural_recycled',
    nameEn: 'Recycled Structural Steel (70% recycled)',
    nameTh: 'เหล็กโครงสร้างรีไซเคิล (70%)',
    category: 'steel',
    subcategory: 'structural',
    emissionFactor: 1.295,
    unit: 'kg',
    density: 7850,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry average with recycled content',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['recycled', 'sustainable', 'structural'],
  },

  'steel_sheet_galvanized': {
    id: 'steel_sheet_galvanized',
    nameEn: 'Galvanized Steel Sheet',
    nameTh: 'แผ่นเหล็กชุบสังกะสี',
    category: 'steel',
    subcategory: 'sheet',
    emissionFactor: 2.750,
    unit: 'kg',
    density: 7850,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Material Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['galvanized', 'roofing', 'cladding'],
  },

  'steel_wire_mesh': {
    id: 'steel_wire_mesh',
    nameEn: 'Steel Welded Wire Mesh',
    nameTh: 'ตะแกรงเหล็กเชื่อม',
    category: 'steel',
    subcategory: 'reinforcement',
    emissionFactor: 1.150,
    unit: 'kg',
    density: 7850,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['wire-mesh', 'slab', 'reinforcement'],
  },

  // ============================================
  // MASONRY (งานก่อ)
  // ============================================

  'brick_clay_standard': {
    id: 'brick_clay_standard',
    nameEn: 'Clay Brick (Standard)',
    nameTh: 'อิฐมอญ (มาตรฐาน)',
    category: 'masonry',
    subcategory: 'brick',
    emissionFactor: 0.218,
    unit: 'kg',
    density: 1800,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    lowCarbonAlternativeId: 'brick_aac',
    carbonReductionPotential: 30,
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['clay', 'traditional', 'wall'],
  },

  'brick_clay_hollow': {
    id: 'brick_clay_hollow',
    nameEn: 'Hollow Clay Brick',
    nameTh: 'อิฐมอญกลวง',
    category: 'masonry',
    subcategory: 'brick',
    emissionFactor: 0.185,
    unit: 'kg',
    density: 1400,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['clay', 'hollow', 'lightweight'],
  },

  'block_concrete': {
    id: 'block_concrete',
    nameEn: 'Concrete Block (Solid)',
    nameTh: 'บล็อกคอนกรีตตัน',
    category: 'masonry',
    subcategory: 'block',
    emissionFactor: 0.095,
    unit: 'kg',
    density: 2000,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['concrete', 'block', 'wall'],
  },

  'block_concrete_hollow': {
    id: 'block_concrete_hollow',
    nameEn: 'Hollow Concrete Block',
    nameTh: 'บล็อกคอนกรีตกลวง',
    category: 'masonry',
    subcategory: 'block',
    emissionFactor: 0.073,
    unit: 'kg',
    density: 1500,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['concrete', 'hollow', 'lightweight'],
  },

  'brick_aac': {
    id: 'brick_aac',
    nameEn: 'Autoclaved Aerated Concrete (AAC) Block',
    nameTh: 'บล็อกมวลเบา (Q-CON, Super Block)',
    category: 'masonry',
    subcategory: 'lightweight',
    emissionFactor: 0.150,
    unit: 'kg',
    density: 550,
    source: 'SCG_EPD',
    sourceYear: 2023,
    sourceReference: 'SCG Q-CON EPD',
    dataQuality: 'excellent',
    manufacturer: 'SCG',
    certifications: ['TGO CFP', 'EPD', 'TREES'],
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['AAC', 'lightweight', 'thermal-insulation', 'green'],
  },

  'brick_clc': {
    id: 'brick_clc',
    nameEn: 'Cellular Lightweight Concrete (CLC) Block',
    nameTh: 'บล็อกคอนกรีตมวลเบา CLC',
    category: 'masonry',
    subcategory: 'lightweight',
    emissionFactor: 0.120,
    unit: 'kg',
    density: 600,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Kasetsart University Research',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'central',
    tags: ['CLC', 'lightweight', 'insulation'],
  },

  // ============================================
  // TIMBER (ไม้)
  // ============================================

  'timber_teak': {
    id: 'timber_teak',
    nameEn: 'Teak Wood (Plantation)',
    nameTh: 'ไม้สัก (สวนป่า)',
    category: 'timber',
    subcategory: 'hardwood',
    emissionFactor: 0.350,
    unit: 'kg',
    density: 650,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Thai Forestry Research',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'north',
    tags: ['hardwood', 'teak', 'premium', 'furniture'],
  },

  'timber_rubber': {
    id: 'timber_rubber',
    nameEn: 'Rubberwood (Para Rubber)',
    nameTh: 'ไม้ยางพารา',
    category: 'timber',
    subcategory: 'hardwood',
    emissionFactor: 0.280,
    unit: 'kg',
    density: 560,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Kasetsart University Research',
    dataQuality: 'good',
    certifications: ['FSC Available'],
    locallyAvailable: true,
    region: 'south',
    tags: ['sustainable', 'rubberwood', 'furniture', 'structural'],
  },

  'timber_eucalyptus': {
    id: 'timber_eucalyptus',
    nameEn: 'Eucalyptus Wood',
    nameTh: 'ไม้ยูคาลิปตัส',
    category: 'timber',
    subcategory: 'hardwood',
    emissionFactor: 0.310,
    unit: 'kg',
    density: 700,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Thai Forestry Research',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['fast-growing', 'structural', 'scaffold'],
  },

  'timber_plywood': {
    id: 'timber_plywood',
    nameEn: 'Plywood (General)',
    nameTh: 'ไม้อัด',
    category: 'timber',
    subcategory: 'engineered',
    emissionFactor: 0.450,
    unit: 'kg',
    density: 600,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Material Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['plywood', 'formwork', 'furniture'],
  },

  'timber_mdf': {
    id: 'timber_mdf',
    nameEn: 'Medium Density Fiberboard (MDF)',
    nameTh: 'ไม้อัดความหนาแน่นปานกลาง (MDF)',
    category: 'timber',
    subcategory: 'engineered',
    emissionFactor: 0.720,
    unit: 'kg',
    density: 750,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Material Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['MDF', 'furniture', 'interior'],
  },

  'timber_particle_board': {
    id: 'timber_particle_board',
    nameEn: 'Particle Board',
    nameTh: 'ไม้ปาร์ติเกิลบอร์ด',
    category: 'timber',
    subcategory: 'engineered',
    emissionFactor: 0.550,
    unit: 'kg',
    density: 650,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Material Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['particle-board', 'furniture', 'interior'],
  },

  // ============================================
  // GLASS (กระจก)
  // ============================================

  'glass_float_clear': {
    id: 'glass_float_clear',
    nameEn: 'Clear Float Glass (6mm)',
    nameTh: 'กระจกใส 6 มม.',
    category: 'glass',
    subcategory: 'float',
    emissionFactor: 1.440,
    unit: 'kg',
    density: 2500,
    thickness: 6,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['clear', 'window', 'facade'],
  },

  'glass_tinted': {
    id: 'glass_tinted',
    nameEn: 'Tinted Glass (6mm)',
    nameTh: 'กระจกสี 6 มม.',
    category: 'glass',
    subcategory: 'float',
    emissionFactor: 1.520,
    unit: 'kg',
    density: 2500,
    thickness: 6,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['tinted', 'solar-control', 'facade'],
  },

  'glass_tempered': {
    id: 'glass_tempered',
    nameEn: 'Tempered Glass (10mm)',
    nameTh: 'กระจกเทมเปอร์ 10 มม.',
    category: 'glass',
    subcategory: 'safety',
    emissionFactor: 1.850,
    unit: 'kg',
    density: 2500,
    thickness: 10,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry average',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['tempered', 'safety', 'facade', 'door'],
  },

  'glass_laminated': {
    id: 'glass_laminated',
    nameEn: 'Laminated Glass',
    nameTh: 'กระจกลามิเนต',
    category: 'glass',
    subcategory: 'safety',
    emissionFactor: 2.100,
    unit: 'kg',
    density: 2500,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry average',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['laminated', 'safety', 'acoustic'],
  },

  'glass_igunit': {
    id: 'glass_igunit',
    nameEn: 'Insulated Glass Unit (Double Glazed)',
    nameTh: 'กระจก 2 ชั้น (IGU)',
    category: 'glass',
    subcategory: 'insulated',
    emissionFactor: 35.0,
    unit: 'm²',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry average per m²',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['double-glazed', 'thermal', 'energy-saving'],
  },

  'glass_lowE': {
    id: 'glass_lowE',
    nameEn: 'Low-E Coated Glass',
    nameTh: 'กระจก Low-E',
    category: 'glass',
    subcategory: 'coated',
    emissionFactor: 1.950,
    unit: 'kg',
    density: 2500,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry average',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'central',
    tags: ['low-e', 'energy-saving', 'coating'],
  },

  // ============================================
  // FINISHES (วัสดุตกแต่ง)
  // ============================================

  'plaster_cement': {
    id: 'plaster_cement',
    nameEn: 'Cement Plaster',
    nameTh: 'ปูนฉาบ',
    category: 'finishes',
    subcategory: 'plaster',
    emissionFactor: 0.120,
    unit: 'kg',
    density: 1800,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['plaster', 'wall', 'ceiling'],
  },

  'plaster_gypsum': {
    id: 'plaster_gypsum',
    nameEn: 'Gypsum Plaster',
    nameTh: 'ปูนยิปซัม',
    category: 'finishes',
    subcategory: 'plaster',
    emissionFactor: 0.085,
    unit: 'kg',
    density: 1200,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['gypsum', 'interior', 'smooth'],
  },

  'gypsum_board': {
    id: 'gypsum_board',
    nameEn: 'Gypsum Board (12mm)',
    nameTh: 'แผ่นยิปซัม 12 มม.',
    category: 'finishes',
    subcategory: 'board',
    emissionFactor: 0.390,
    unit: 'kg',
    density: 800,
    thickness: 12,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['gypsum-board', 'partition', 'ceiling'],
  },

  'tile_ceramic_floor': {
    id: 'tile_ceramic_floor',
    nameEn: 'Ceramic Floor Tile',
    nameTh: 'กระเบื้องเซรามิกปูพื้น',
    category: 'finishes',
    subcategory: 'tile',
    emissionFactor: 0.780,
    unit: 'kg',
    density: 2000,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Material Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['ceramic', 'floor', 'interior'],
  },

  'tile_ceramic_wall': {
    id: 'tile_ceramic_wall',
    nameEn: 'Ceramic Wall Tile',
    nameTh: 'กระเบื้องเซรามิกบุผนัง',
    category: 'finishes',
    subcategory: 'tile',
    emissionFactor: 0.650,
    unit: 'kg',
    density: 1800,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Material Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['ceramic', 'wall', 'bathroom'],
  },

  'tile_porcelain': {
    id: 'tile_porcelain',
    nameEn: 'Porcelain Tile',
    nameTh: 'กระเบื้องพอร์ซเลน',
    category: 'finishes',
    subcategory: 'tile',
    emissionFactor: 0.950,
    unit: 'kg',
    density: 2400,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Material Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['porcelain', 'floor', 'premium'],
  },

  'granite_natural': {
    id: 'granite_natural',
    nameEn: 'Natural Granite',
    nameTh: 'หินแกรนิตธรรมชาติ',
    category: 'finishes',
    subcategory: 'stone',
    emissionFactor: 0.700,
    unit: 'kg',
    density: 2700,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['granite', 'stone', 'premium'],
  },

  'paint_emulsion': {
    id: 'paint_emulsion',
    nameEn: 'Emulsion Paint (Interior)',
    nameTh: 'สีน้ำอะคริลิก (ภายใน)',
    category: 'finishes',
    subcategory: 'paint',
    emissionFactor: 2.100,
    unit: 'kg',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'TOA Paint industry average',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['paint', 'interior', 'water-based'],
  },

  'paint_exterior': {
    id: 'paint_exterior',
    nameEn: 'Exterior Paint (Acrylic)',
    nameTh: 'สีอะคริลิก (ภายนอก)',
    category: 'finishes',
    subcategory: 'paint',
    emissionFactor: 2.500,
    unit: 'kg',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'TOA Paint industry average',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['paint', 'exterior', 'weatherproof'],
  },

  // ============================================
  // INSULATION (ฉนวน)
  // ============================================

  'insulation_glasswool': {
    id: 'insulation_glasswool',
    nameEn: 'Glass Wool Insulation',
    nameTh: 'ฉนวนใยแก้ว',
    category: 'insulation',
    subcategory: 'mineral',
    emissionFactor: 1.350,
    unit: 'kg',
    density: 24,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['thermal', 'acoustic', 'roof', 'wall'],
  },

  'insulation_rockwool': {
    id: 'insulation_rockwool',
    nameEn: 'Rock Wool Insulation',
    nameTh: 'ฉนวนใยหิน',
    category: 'insulation',
    subcategory: 'mineral',
    emissionFactor: 1.280,
    unit: 'kg',
    density: 100,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['thermal', 'fire-resistant', 'acoustic'],
  },

  'insulation_eps': {
    id: 'insulation_eps',
    nameEn: 'Expanded Polystyrene (EPS)',
    nameTh: 'โฟม EPS',
    category: 'insulation',
    subcategory: 'foam',
    emissionFactor: 3.290,
    unit: 'kg',
    density: 20,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    lowCarbonAlternativeId: 'insulation_glasswool',
    carbonReductionPotential: 60,
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['foam', 'lightweight', 'roof'],
  },

  'insulation_xps': {
    id: 'insulation_xps',
    nameEn: 'Extruded Polystyrene (XPS)',
    nameTh: 'โฟม XPS',
    category: 'insulation',
    subcategory: 'foam',
    emissionFactor: 4.390,
    unit: 'kg',
    density: 35,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    lowCarbonAlternativeId: 'insulation_glasswool',
    carbonReductionPotential: 70,
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['foam', 'moisture-resistant', 'foundation'],
  },

  'insulation_pu_spray': {
    id: 'insulation_pu_spray',
    nameEn: 'Spray Polyurethane Foam',
    nameTh: 'โฟม PU ฉีดพ่น',
    category: 'insulation',
    subcategory: 'foam',
    emissionFactor: 4.850,
    unit: 'kg',
    density: 35,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry average',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['spray-foam', 'roof', 'seamless'],
  },

  // ============================================
  // MEP (งานระบบ)
  // ============================================

  'copper_pipe': {
    id: 'copper_pipe',
    nameEn: 'Copper Pipe',
    nameTh: 'ท่อทองแดง',
    category: 'mep',
    subcategory: 'piping',
    emissionFactor: 2.710,
    unit: 'kg',
    density: 8900,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['plumbing', 'HVAC', 'refrigerant'],
  },

  'pvc_pipe': {
    id: 'pvc_pipe',
    nameEn: 'PVC Pipe',
    nameTh: 'ท่อ PVC',
    category: 'mep',
    subcategory: 'piping',
    emissionFactor: 2.410,
    unit: 'kg',
    density: 1400,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['plumbing', 'drainage', 'sanitary'],
  },

  'hdpe_pipe': {
    id: 'hdpe_pipe',
    nameEn: 'HDPE Pipe',
    nameTh: 'ท่อ HDPE',
    category: 'mep',
    subcategory: 'piping',
    emissionFactor: 1.930,
    unit: 'kg',
    density: 950,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['water-supply', 'underground', 'flexible'],
  },

  'ppr_pipe': {
    id: 'ppr_pipe',
    nameEn: 'PPR Pipe (Polypropylene)',
    nameTh: 'ท่อ PPR',
    category: 'mep',
    subcategory: 'piping',
    emissionFactor: 2.150,
    unit: 'kg',
    density: 900,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry average',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['hot-water', 'cold-water', 'fusion'],
  },

  'aluminium_duct': {
    id: 'aluminium_duct',
    nameEn: 'Aluminium Flexible Duct',
    nameTh: 'ท่อลมอลูมิเนียม',
    category: 'mep',
    subcategory: 'hvac',
    emissionFactor: 8.240,
    unit: 'kg',
    density: 2700,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Material Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['HVAC', 'air-duct', 'flexible'],
  },

  'gi_duct': {
    id: 'gi_duct',
    nameEn: 'Galvanized Iron Duct',
    nameTh: 'ท่อลมเหล็กชุบสังกะสี',
    category: 'mep',
    subcategory: 'hvac',
    emissionFactor: 2.750,
    unit: 'kg',
    density: 7850,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Material Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['HVAC', 'air-duct', 'rigid'],
  },

  'cable_copper': {
    id: 'cable_copper',
    nameEn: 'Electrical Cable (Copper)',
    nameTh: 'สายไฟทองแดง',
    category: 'mep',
    subcategory: 'electrical',
    emissionFactor: 3.150,
    unit: 'kg',
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['electrical', 'wiring', 'power'],
  },

  // ============================================
  // ROOFING (หลังคา)
  // ============================================

  'roof_tile_concrete': {
    id: 'roof_tile_concrete',
    nameEn: 'Concrete Roof Tile',
    nameTh: 'กระเบื้องหลังคาคอนกรีต',
    category: 'roofing',
    subcategory: 'tile',
    emissionFactor: 0.180,
    unit: 'kg',
    density: 2100,
    source: 'SCG_EPD',
    sourceYear: 2023,
    sourceReference: 'SCG Roofing EPD',
    dataQuality: 'excellent',
    manufacturer: 'SCG',
    certifications: ['TGO CFP', 'EPD'],
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['roofing', 'tile', 'durable'],
  },

  'roof_tile_clay': {
    id: 'roof_tile_clay',
    nameEn: 'Clay Roof Tile',
    nameTh: 'กระเบื้องหลังคาดินเผา',
    category: 'roofing',
    subcategory: 'tile',
    emissionFactor: 0.350,
    unit: 'kg',
    density: 1900,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['roofing', 'traditional', 'clay'],
  },

  'roof_metal_sheet': {
    id: 'roof_metal_sheet',
    nameEn: 'Metal Roofing Sheet',
    nameTh: 'หลังคาเมทัลชีท',
    category: 'roofing',
    subcategory: 'metal',
    emissionFactor: 2.850,
    unit: 'kg',
    density: 7850,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Material Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['roofing', 'metal', 'industrial'],
  },

  'roof_fiber_cement': {
    id: 'roof_fiber_cement',
    nameEn: 'Fiber Cement Roofing',
    nameTh: 'หลังคาไฟเบอร์ซีเมนต์',
    category: 'roofing',
    subcategory: 'composite',
    emissionFactor: 0.850,
    unit: 'kg',
    density: 1600,
    source: 'SCG_EPD',
    sourceYear: 2023,
    sourceReference: 'SCG Roofing EPD',
    dataQuality: 'good',
    manufacturer: 'SCG',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['roofing', 'fiber-cement', 'lightweight'],
  },

  // ============================================
  // WATERPROOFING (กันซึม)
  // ============================================

  'membrane_bitumen': {
    id: 'membrane_bitumen',
    nameEn: 'Bituminous Waterproofing Membrane',
    nameTh: 'แผ่นกันซึมบิทูเมน',
    category: 'waterproofing',
    subcategory: 'membrane',
    emissionFactor: 2.150,
    unit: 'kg',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry average',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['waterproofing', 'roof', 'basement'],
  },

  'membrane_tpo': {
    id: 'membrane_tpo',
    nameEn: 'TPO Roofing Membrane',
    nameTh: 'แผ่นกันซึม TPO',
    category: 'waterproofing',
    subcategory: 'membrane',
    emissionFactor: 3.850,
    unit: 'kg',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry average',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'central',
    tags: ['waterproofing', 'roof', 'reflective'],
  },

  'coating_pu_waterproof': {
    id: 'coating_pu_waterproof',
    nameEn: 'Polyurethane Waterproof Coating',
    nameTh: 'สารเคลือบกันซึม PU',
    category: 'waterproofing',
    subcategory: 'coating',
    emissionFactor: 4.200,
    unit: 'kg',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry average',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['waterproofing', 'coating', 'flexible'],
  },

  // ============================================
  // AGGREGATES & FILL (มวลรวม)
  // ============================================

  'aggregate_crushed_stone': {
    id: 'aggregate_crushed_stone',
    nameEn: 'Crushed Stone Aggregate',
    nameTh: 'หินย่อย',
    category: 'concrete',
    subcategory: 'aggregate',
    emissionFactor: 0.005,
    unit: 'kg',
    density: 1600,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['aggregate', 'foundation', 'concrete'],
  },

  'aggregate_sand': {
    id: 'aggregate_sand',
    nameEn: 'Construction Sand',
    nameTh: 'ทราย',
    category: 'concrete',
    subcategory: 'aggregate',
    emissionFactor: 0.005,
    unit: 'kg',
    density: 1500,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['sand', 'mortar', 'concrete'],
  },

  'aggregate_gravel': {
    id: 'aggregate_gravel',
    nameEn: 'Gravel',
    nameTh: 'กรวด',
    category: 'concrete',
    subcategory: 'aggregate',
    emissionFactor: 0.004,
    unit: 'kg',
    density: 1700,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['gravel', 'drainage', 'foundation'],
  },

  'fill_laterite': {
    id: 'fill_laterite',
    nameEn: 'Laterite Soil Fill',
    nameTh: 'ดินลูกรัง',
    category: 'concrete',
    subcategory: 'fill',
    emissionFactor: 0.003,
    unit: 'kg',
    density: 1800,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Local material estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['fill', 'subbase', 'road'],
  },

  // ============================================
  // MORTAR & GROUT (ปูนก่อ/ปูนฉาบ)
  // ============================================

  'mortar_cement': {
    id: 'mortar_cement',
    nameEn: 'Cement Mortar (1:3)',
    nameTh: 'ปูนก่อ (1:3)',
    category: 'masonry',
    subcategory: 'mortar',
    emissionFactor: 0.180,
    unit: 'kg',
    density: 2000,
    source: 'Calculated',
    sourceYear: 2023,
    sourceReference: 'Calculated from cement + sand',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['mortar', 'masonry', 'bedding'],
  },

  'mortar_plastering': {
    id: 'mortar_plastering',
    nameEn: 'Plastering Mortar (1:4)',
    nameTh: 'ปูนฉาบ (1:4)',
    category: 'finishes',
    subcategory: 'mortar',
    emissionFactor: 0.145,
    unit: 'kg',
    density: 1900,
    source: 'Calculated',
    sourceYear: 2023,
    sourceReference: 'Calculated from cement + sand',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['plaster', 'render', 'wall'],
  },

  'grout_cement': {
    id: 'grout_cement',
    nameEn: 'Cement Grout (Non-Shrink)',
    nameTh: 'กราวท์ซีเมนต์ไม่หดตัว',
    category: 'concrete',
    subcategory: 'grout',
    emissionFactor: 0.350,
    unit: 'kg',
    density: 2200,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['grout', 'anchoring', 'structural'],
  },

  'grout_epoxy': {
    id: 'grout_epoxy',
    nameEn: 'Epoxy Grout',
    nameTh: 'กราวท์อีพ็อกซี่',
    category: 'finishes',
    subcategory: 'grout',
    emissionFactor: 5.200,
    unit: 'kg',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['grout', 'tile', 'chemical-resistant'],
  },

  // ============================================
  // ADHESIVES & SEALANTS (กาว/ซีลแลนท์)
  // ============================================

  'adhesive_tile': {
    id: 'adhesive_tile',
    nameEn: 'Tile Adhesive (Cement-Based)',
    nameTh: 'กาวติดกระเบื้อง',
    category: 'finishes',
    subcategory: 'adhesive',
    emissionFactor: 0.650,
    unit: 'kg',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['adhesive', 'tile', 'cement-based'],
  },

  'adhesive_epoxy': {
    id: 'adhesive_epoxy',
    nameEn: 'Epoxy Adhesive (2-Component)',
    nameTh: 'กาวอีพ็อกซี่ 2 ส่วน',
    category: 'finishes',
    subcategory: 'adhesive',
    emissionFactor: 6.500,
    unit: 'kg',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['adhesive', 'structural', 'bonding'],
  },

  'sealant_silicone': {
    id: 'sealant_silicone',
    nameEn: 'Silicone Sealant',
    nameTh: 'ซิลิโคนยาแนว',
    category: 'finishes',
    subcategory: 'sealant',
    emissionFactor: 4.200,
    unit: 'kg',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['sealant', 'joint', 'weatherproof'],
  },

  'sealant_pu': {
    id: 'sealant_pu',
    nameEn: 'Polyurethane Sealant',
    nameTh: 'ซีลแลนท์โพลียูริเทน',
    category: 'finishes',
    subcategory: 'sealant',
    emissionFactor: 4.800,
    unit: 'kg',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['sealant', 'joint', 'flexible'],
  },

  // ============================================
  // ADDITIONAL CONCRETE MIXES
  // ============================================

  'concrete_c15_lowcarbon': {
    id: 'concrete_c15_lowcarbon',
    nameEn: 'Low Carbon Concrete C15 (25% fly ash)',
    nameTh: 'คอนกรีตคาร์บอนต่ำ C15 (เถ้าลอย 25%)',
    category: 'concrete',
    subcategory: 'low_carbon',
    emissionFactor: 172.0,
    unit: 'm³',
    density: 2350,
    source: 'SCG_EPD',
    sourceYear: 2023,
    sourceReference: 'SCG Green Cement EPD',
    dataQuality: 'excellent',
    manufacturer: 'SCG',
    certifications: ['TGO CFP', 'EPD'],
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['green', 'sustainable', 'fly-ash', 'foundation'],
  },

  'concrete_c20_lowcarbon': {
    id: 'concrete_c20_lowcarbon',
    nameEn: 'Low Carbon Concrete C20 (25% fly ash)',
    nameTh: 'คอนกรีตคาร์บอนต่ำ C20 (เถ้าลอย 25%)',
    category: 'concrete',
    subcategory: 'low_carbon',
    emissionFactor: 182.0,
    unit: 'm³',
    density: 2400,
    source: 'SCG_EPD',
    sourceYear: 2023,
    sourceReference: 'SCG Green Cement EPD',
    dataQuality: 'excellent',
    manufacturer: 'SCG',
    certifications: ['TGO CFP', 'EPD'],
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['green', 'sustainable', 'fly-ash', 'slab'],
  },

  'concrete_c40_lowcarbon': {
    id: 'concrete_c40_lowcarbon',
    nameEn: 'Low Carbon Concrete C40 (GGBS blend)',
    nameTh: 'คอนกรีตคาร์บอนต่ำ C40 (ตะกรันเตาถลุงเหล็ก)',
    category: 'concrete',
    subcategory: 'low_carbon',
    emissionFactor: 240.0,
    unit: 'm³',
    density: 2450,
    source: 'SCG_EPD',
    sourceYear: 2023,
    sourceReference: 'SCG Green Cement EPD',
    dataQuality: 'excellent',
    manufacturer: 'SCG',
    certifications: ['TGO CFP', 'EPD'],
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['green', 'sustainable', 'GGBS', 'high-strength'],
  },

  'concrete_lightweight': {
    id: 'concrete_lightweight',
    nameEn: 'Lightweight Structural Concrete',
    nameTh: 'คอนกรีตมวลเบาโครงสร้าง',
    category: 'concrete',
    subcategory: 'specialty',
    emissionFactor: 195.0,
    unit: 'm³',
    density: 1800,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'central',
    tags: ['lightweight', 'structural', 'high-rise'],
  },

  'concrete_self_compacting': {
    id: 'concrete_self_compacting',
    nameEn: 'Self-Compacting Concrete (SCC)',
    nameTh: 'คอนกรีตไหลเอง (SCC)',
    category: 'concrete',
    subcategory: 'specialty',
    emissionFactor: 290.0,
    unit: 'm³',
    density: 2400,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'central',
    tags: ['SCC', 'specialty', 'formwork'],
  },

  // ============================================
  // ADDITIONAL STEEL PRODUCTS
  // ============================================

  'steel_rebar_round': {
    id: 'steel_rebar_round',
    nameEn: 'Steel Round Bar (SR24)',
    nameTh: 'เหล็กเส้นกลม SR24',
    category: 'steel',
    subcategory: 'reinforcement',
    emissionFactor: 0.980,
    unit: 'kg',
    density: 7850,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['round-bar', 'stirrup', 'tie'],
  },

  'steel_plate': {
    id: 'steel_plate',
    nameEn: 'Steel Plate',
    nameTh: 'แผ่นเหล็ก',
    category: 'steel',
    subcategory: 'plate',
    emissionFactor: 1.950,
    unit: 'kg',
    density: 7850,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Material Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['plate', 'connection', 'structural'],
  },

  'steel_angle': {
    id: 'steel_angle',
    nameEn: 'Steel Angle',
    nameTh: 'เหล็กฉาก',
    category: 'steel',
    subcategory: 'structural',
    emissionFactor: 1.750,
    unit: 'kg',
    density: 7850,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Material Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['angle', 'frame', 'support'],
  },

  'steel_channel': {
    id: 'steel_channel',
    nameEn: 'Steel Channel (C-Section)',
    nameTh: 'เหล็กรางน้ำ',
    category: 'steel',
    subcategory: 'structural',
    emissionFactor: 1.800,
    unit: 'kg',
    density: 7850,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Material Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['channel', 'purlin', 'frame'],
  },

  'steel_hollow_section': {
    id: 'steel_hollow_section',
    nameEn: 'Steel Hollow Section (RHS/SHS)',
    nameTh: 'เหล็กกล่อง',
    category: 'steel',
    subcategory: 'structural',
    emissionFactor: 2.100,
    unit: 'kg',
    density: 7850,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Material Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['hollow-section', 'column', 'truss'],
  },

  'steel_decking': {
    id: 'steel_decking',
    nameEn: 'Steel Floor Decking',
    nameTh: 'เหล็กแผ่นพื้น (Metal Deck)',
    category: 'steel',
    subcategory: 'decking',
    emissionFactor: 2.650,
    unit: 'kg',
    density: 7850,
    source: 'MTEC',
    sourceYear: 2022,
    sourceReference: 'MTEC Material Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['decking', 'composite-floor', 'formwork'],
  },

  // ============================================
  // ADDITIONAL FINISHES
  // ============================================

  'ceiling_acoustic': {
    id: 'ceiling_acoustic',
    nameEn: 'Acoustic Ceiling Tile',
    nameTh: 'แผ่นฝ้าเพดานอะคูสติก',
    category: 'finishes',
    subcategory: 'ceiling',
    emissionFactor: 0.850,
    unit: 'kg',
    density: 350,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['ceiling', 'acoustic', 'mineral-fiber'],
  },

  'ceiling_metal': {
    id: 'ceiling_metal',
    nameEn: 'Metal Ceiling Panel',
    nameTh: 'แผ่นฝ้าเพดานอลูมิเนียม',
    category: 'finishes',
    subcategory: 'ceiling',
    emissionFactor: 8.500,
    unit: 'kg',
    density: 2700,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['ceiling', 'metal', 'modern'],
  },

  'floor_vinyl': {
    id: 'floor_vinyl',
    nameEn: 'Vinyl Floor Tile',
    nameTh: 'กระเบื้องยางไวนิล',
    category: 'finishes',
    subcategory: 'flooring',
    emissionFactor: 2.850,
    unit: 'kg',
    density: 1400,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['vinyl', 'floor', 'commercial'],
  },

  'floor_laminate': {
    id: 'floor_laminate',
    nameEn: 'Laminate Flooring',
    nameTh: 'พื้นลามิเนต',
    category: 'finishes',
    subcategory: 'flooring',
    emissionFactor: 1.250,
    unit: 'kg',
    density: 900,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['laminate', 'floor', 'residential'],
  },

  'floor_epoxy': {
    id: 'floor_epoxy',
    nameEn: 'Epoxy Floor Coating',
    nameTh: 'พื้นอีพ็อกซี่',
    category: 'finishes',
    subcategory: 'flooring',
    emissionFactor: 5.800,
    unit: 'kg',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['epoxy', 'floor', 'industrial'],
  },

  // ============================================
  // DOORS & WINDOWS (ประตู/หน้าต่าง)
  // ============================================

  'door_wood_solid': {
    id: 'door_wood_solid',
    nameEn: 'Solid Wood Door',
    nameTh: 'ประตูไม้ตัน',
    category: 'finishes',
    subcategory: 'door',
    emissionFactor: 25.0,
    unit: 'piece',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate per standard door',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['door', 'wood', 'interior'],
  },

  'door_hollow_core': {
    id: 'door_hollow_core',
    nameEn: 'Hollow Core Door',
    nameTh: 'ประตูกลวง',
    category: 'finishes',
    subcategory: 'door',
    emissionFactor: 12.0,
    unit: 'piece',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate per standard door',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['door', 'hollow-core', 'interior'],
  },

  'door_steel': {
    id: 'door_steel',
    nameEn: 'Steel Door',
    nameTh: 'ประตูเหล็ก',
    category: 'finishes',
    subcategory: 'door',
    emissionFactor: 85.0,
    unit: 'piece',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate per standard door',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['door', 'steel', 'fire-rated'],
  },

  'door_aluminum': {
    id: 'door_aluminum',
    nameEn: 'Aluminum Framed Glass Door',
    nameTh: 'ประตูอลูมิเนียมกระจก',
    category: 'finishes',
    subcategory: 'door',
    emissionFactor: 120.0,
    unit: 'piece',
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate per standard door',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['door', 'aluminum', 'glass'],
  },

  'window_aluminum': {
    id: 'window_aluminum',
    nameEn: 'Aluminum Window Frame',
    nameTh: 'กรอบหน้าต่างอลูมิเนียม',
    category: 'finishes',
    subcategory: 'window',
    emissionFactor: 18.5,
    unit: 'kg',
    density: 2700,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Calculated from aluminum',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['window', 'aluminum', 'frame'],
  },

  'window_upvc': {
    id: 'window_upvc',
    nameEn: 'uPVC Window Frame',
    nameTh: 'กรอบหน้าต่าง uPVC',
    category: 'finishes',
    subcategory: 'window',
    emissionFactor: 3.150,
    unit: 'kg',
    density: 1400,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['window', 'uPVC', 'thermal'],
  },

  // ============================================
  // LANDSCAPING (งานภูมิทัศน์)
  // ============================================

  'paver_concrete': {
    id: 'paver_concrete',
    nameEn: 'Concrete Paving Block',
    nameTh: 'บล็อกปูพื้นคอนกรีต',
    category: 'finishes',
    subcategory: 'paving',
    emissionFactor: 0.130,
    unit: 'kg',
    density: 2200,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['paving', 'walkway', 'driveway'],
  },

  'paver_grass': {
    id: 'paver_grass',
    nameEn: 'Grass Paver Block',
    nameTh: 'บล็อกปูพื้นหญ้า',
    category: 'finishes',
    subcategory: 'paving',
    emissionFactor: 0.095,
    unit: 'kg',
    density: 1800,
    source: 'Research',
    sourceYear: 2022,
    sourceReference: 'Industry estimate',
    dataQuality: 'fair',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['paving', 'permeable', 'green'],
  },

  'curb_concrete': {
    id: 'curb_concrete',
    nameEn: 'Concrete Curb',
    nameTh: 'ขอบคันหินคอนกรีต',
    category: 'concrete',
    subcategory: 'precast',
    emissionFactor: 0.120,
    unit: 'kg',
    density: 2300,
    source: 'TGO',
    sourceYear: 2023,
    sourceReference: 'TGO Emission Factor Database',
    dataQuality: 'good',
    locallyAvailable: true,
    region: 'nationwide',
    tags: ['curb', 'road', 'landscape'],
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get all materials in a category
 */
export function getMaterialsByCategory(category: ThaiMaterialCategory): ThaiMaterial[] {
  return Object.values(THAI_MATERIALS).filter((m) => m.category === category);
}

/**
 * Get all materials from a specific source
 */
export function getMaterialsBySource(source: EmissionSource): ThaiMaterial[] {
  return Object.values(THAI_MATERIALS).filter((m) => m.source === source);
}

/**
 * Get low-carbon alternatives for a material
 */
export function getLowCarbonAlternative(materialId: string): ThaiMaterial | null {
  const material = THAI_MATERIALS[materialId];
  if (!material?.lowCarbonAlternativeId) return null;
  return THAI_MATERIALS[material.lowCarbonAlternativeId] || null;
}

/**
 * Search materials by name or tags
 */
export function searchMaterials(query: string): ThaiMaterial[] {
  const normalizedQuery = query.toLowerCase().trim();
  return Object.values(THAI_MATERIALS).filter(
    (m) =>
      m.nameEn.toLowerCase().includes(normalizedQuery) ||
      m.nameTh.includes(query) ||
      m.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))
  );
}

/**
 * Get material statistics
 */
export function getMaterialStatistics() {
  const materials = Object.values(THAI_MATERIALS);

  const byCategory = materials.reduce(
    (acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const bySource = materials.reduce(
    (acc, m) => {
      acc[m.source] = (acc[m.source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const withLowCarbonAlternative = materials.filter(
    (m) => m.lowCarbonAlternativeId
  ).length;

  return {
    totalMaterials: materials.length,
    byCategory,
    bySource,
    withLowCarbonAlternative,
    excellent: materials.filter((m) => m.dataQuality === 'excellent').length,
    good: materials.filter((m) => m.dataQuality === 'good').length,
    fair: materials.filter((m) => m.dataQuality === 'fair').length,
  };
}

/**
 * Calculate carbon for a quantity of material
 */
export function calculateMaterialCarbon(
  materialId: string,
  quantity: number
): { carbon: number; unit: string; material: ThaiMaterial } | null {
  const material = THAI_MATERIALS[materialId];
  if (!material) return null;

  return {
    carbon: material.emissionFactor * quantity,
    unit: 'kgCO2e',
    material,
  };
}

/**
 * Compare materials for carbon optimization
 */
export function compareMaterials(
  currentId: string,
  alternativeId: string,
  quantity: number
): {
  current: number;
  alternative: number;
  savings: number;
  savingsPercent: number;
} | null {
  const current = THAI_MATERIALS[currentId];
  const alternative = THAI_MATERIALS[alternativeId];

  if (!current || !alternative) return null;

  const currentCarbon = current.emissionFactor * quantity;
  const alternativeCarbon = alternative.emissionFactor * quantity;
  const savings = currentCarbon - alternativeCarbon;

  return {
    current: currentCarbon,
    alternative: alternativeCarbon,
    savings,
    savingsPercent: (savings / currentCarbon) * 100,
  };
}

export default THAI_MATERIALS;
