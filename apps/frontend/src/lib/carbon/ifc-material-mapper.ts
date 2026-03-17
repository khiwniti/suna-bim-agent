/**
 * IFC to Thai Material Database Mapper
 *
 * Maps IFC material names to Thai material database entries using
 * fuzzy matching on names, categories, and tags.
 *
 * ★ Insight ─────────────────────────────────────
 * IFC models from different authoring tools (Revit, ArchiCAD, Tekla)
 * use inconsistent material naming conventions. This mapper uses
 * multi-strategy matching:
 * 1. Exact match on English/Thai names
 * 2. Keyword extraction and tag matching
 * 3. Category inference from IFC element type
 * 4. Levenshtein distance for fuzzy matches
 * ─────────────────────────────────────────────────
 */

import {
  THAI_MATERIALS,
  type ThaiMaterial,
  type ThaiMaterialCategory,
} from './thai-materials';

// ============================================
// Types
// ============================================

export interface MaterialMapping {
  /** IFC material name (original) */
  ifcName: string;
  /** Matched Thai material ID */
  thaiMaterialId: string;
  /** Matched Thai material */
  thaiMaterial: ThaiMaterial;
  /** Match confidence (0-1) */
  confidence: number;
  /** Match method used */
  matchMethod: 'exact' | 'keyword' | 'category' | 'fuzzy' | 'default';
  /** Alternative matches if any */
  alternatives?: ThaiMaterial[];
}

export interface MappingOptions {
  /** Element type hint for category inference */
  elementType?: string;
  /** IFC material category (if available) */
  ifcCategory?: string;
  /** Minimum confidence threshold (default 0.3) */
  minConfidence?: number;
  /** Include low-carbon alternatives in response */
  includeLowCarbonAlternatives?: boolean;
}

// ============================================
// Material Keyword Database
// ============================================

/**
 * Keyword mappings from common IFC terms to Thai material IDs
 * Ordered by specificity (more specific keywords first)
 */
const KEYWORD_MAPPINGS: Array<{ keywords: string[]; materialId: string; weight: number }> = [
  // Concrete - Specific grades
  { keywords: ['c40', '40mpa', 'high strength concrete'], materialId: 'concrete_c40', weight: 1.0 },
  { keywords: ['c35', '35mpa'], materialId: 'concrete_c35', weight: 1.0 },
  { keywords: ['c30', '30mpa', '280kg'], materialId: 'concrete_c30', weight: 1.0 },
  { keywords: ['c25', '25mpa', '240kg'], materialId: 'concrete_c25', weight: 1.0 },
  { keywords: ['c20', '20mpa', '210kg'], materialId: 'concrete_c20', weight: 1.0 },
  { keywords: ['c15', '15mpa', '180kg'], materialId: 'concrete_c15', weight: 1.0 },
  { keywords: ['precast', 'prefab', 'pc panel'], materialId: 'concrete_precast_panel', weight: 0.9 },
  { keywords: ['hollow core', 'hollowcore', 'hcs'], materialId: 'concrete_precast_slab', weight: 0.9 },
  { keywords: ['lightweight concrete', 'lwc'], materialId: 'concrete_lightweight', weight: 0.9 },
  { keywords: ['scc', 'self compacting'], materialId: 'concrete_self_compacting', weight: 0.9 },
  { keywords: ['concrete', 'คอนกรีต'], materialId: 'concrete_c25', weight: 0.5 },

  // Steel - Reinforcement
  { keywords: ['sd50', 'rebar sd50', 'fy500'], materialId: 'steel_rebar_sd50', weight: 1.0 },
  { keywords: ['sd40', 'rebar sd40', 'fy400', 'deformed bar'], materialId: 'steel_rebar_sd40', weight: 1.0 },
  { keywords: ['sr24', 'round bar', 'plain bar'], materialId: 'steel_rebar_round', weight: 1.0 },
  { keywords: ['recycled rebar', 'eaf rebar'], materialId: 'steel_rebar_recycled', weight: 1.0 },
  { keywords: ['wire mesh', 'welded mesh', 'brc'], materialId: 'steel_wire_mesh', weight: 0.9 },
  { keywords: ['rebar', 'reinforcement', 'เหล็กข้ออ้อย'], materialId: 'steel_rebar_sd40', weight: 0.6 },

  // Steel - Structural
  { keywords: ['h-beam', 'h beam', 'wide flange', 'wf'], materialId: 'steel_structural_h', weight: 1.0 },
  { keywords: ['hollow section', 'rhs', 'shs', 'box section'], materialId: 'steel_hollow_section', weight: 1.0 },
  { keywords: ['channel', 'c-section', 'purlin'], materialId: 'steel_channel', weight: 0.9 },
  { keywords: ['angle', 'l-section'], materialId: 'steel_angle', weight: 0.9 },
  { keywords: ['steel plate', 'plate steel'], materialId: 'steel_plate', weight: 0.9 },
  { keywords: ['metal deck', 'composite deck', 'floor deck'], materialId: 'steel_decking', weight: 0.9 },
  { keywords: ['galvanized', 'gi sheet'], materialId: 'steel_sheet_galvanized', weight: 0.8 },
  { keywords: ['structural steel', 'steel frame'], materialId: 'steel_structural_h', weight: 0.6 },
  { keywords: ['steel', 'เหล็ก'], materialId: 'steel_structural_h', weight: 0.4 },

  // Masonry
  { keywords: ['aac', 'q-con', 'qcon', 'superblock', 'autoclaved'], materialId: 'brick_aac', weight: 1.0 },
  { keywords: ['clc', 'cellular lightweight'], materialId: 'brick_clc', weight: 1.0 },
  { keywords: ['clay brick', 'red brick', 'อิฐมอญ'], materialId: 'brick_clay_standard', weight: 0.9 },
  { keywords: ['hollow brick', 'clay hollow'], materialId: 'brick_clay_hollow', weight: 0.9 },
  { keywords: ['concrete block', 'cmu', 'บล็อกคอนกรีต'], materialId: 'block_concrete', weight: 0.9 },
  { keywords: ['hollow block', 'hollow cmu'], materialId: 'block_concrete_hollow', weight: 0.9 },
  { keywords: ['brick', 'masonry', 'block'], materialId: 'brick_aac', weight: 0.5 },

  // Glass
  { keywords: ['low-e', 'lowe', 'low emissivity'], materialId: 'glass_lowE', weight: 1.0 },
  { keywords: ['igu', 'double glaz', 'insulated glass'], materialId: 'glass_igunit', weight: 1.0 },
  { keywords: ['tempered', 'toughened'], materialId: 'glass_tempered', weight: 0.9 },
  { keywords: ['laminated'], materialId: 'glass_laminated', weight: 0.9 },
  { keywords: ['tinted', 'solar control'], materialId: 'glass_tinted', weight: 0.9 },
  { keywords: ['clear glass', 'float glass'], materialId: 'glass_float_clear', weight: 0.8 },
  { keywords: ['glass', 'glazing', 'กระจก'], materialId: 'glass_float_clear', weight: 0.5 },

  // Timber
  { keywords: ['teak', 'สัก'], materialId: 'timber_teak', weight: 1.0 },
  { keywords: ['rubber', 'rubberwood', 'ยางพารา'], materialId: 'timber_rubber', weight: 1.0 },
  { keywords: ['eucalyptus', 'ยูคา'], materialId: 'timber_eucalyptus', weight: 1.0 },
  { keywords: ['plywood', 'ไม้อัด'], materialId: 'timber_plywood', weight: 0.9 },
  { keywords: ['mdf', 'medium density'], materialId: 'timber_mdf', weight: 0.9 },
  { keywords: ['particle board', 'chipboard'], materialId: 'timber_particle_board', weight: 0.9 },
  { keywords: ['wood', 'timber', 'ไม้'], materialId: 'timber_rubber', weight: 0.5 },

  // Finishes
  { keywords: ['gypsum board', 'drywall', 'plasterboard'], materialId: 'gypsum_board', weight: 1.0 },
  { keywords: ['porcelain tile', 'พอร์ซเลน'], materialId: 'tile_porcelain', weight: 1.0 },
  { keywords: ['ceramic floor', 'floor tile'], materialId: 'tile_ceramic_floor', weight: 0.9 },
  { keywords: ['ceramic wall', 'wall tile'], materialId: 'tile_ceramic_wall', weight: 0.9 },
  { keywords: ['granite'], materialId: 'granite_natural', weight: 0.9 },
  { keywords: ['cement plaster', 'render'], materialId: 'plaster_cement', weight: 0.9 },
  { keywords: ['gypsum plaster'], materialId: 'plaster_gypsum', weight: 0.9 },
  { keywords: ['vinyl floor', 'lvt'], materialId: 'floor_vinyl', weight: 0.9 },
  { keywords: ['laminate floor'], materialId: 'floor_laminate', weight: 0.9 },
  { keywords: ['epoxy floor', 'epoxy coating'], materialId: 'floor_epoxy', weight: 0.9 },
  { keywords: ['acoustic ceiling', 'mineral fiber'], materialId: 'ceiling_acoustic', weight: 0.9 },
  { keywords: ['metal ceiling', 'aluminum ceiling'], materialId: 'ceiling_metal', weight: 0.9 },
  { keywords: ['paint', 'emulsion'], materialId: 'paint_emulsion', weight: 0.7 },
  { keywords: ['tile', 'กระเบื้อง'], materialId: 'tile_ceramic_floor', weight: 0.5 },

  // Insulation
  { keywords: ['glass wool', 'glasswool', 'ใยแก้ว'], materialId: 'insulation_glasswool', weight: 1.0 },
  { keywords: ['rock wool', 'rockwool', 'ใยหิน'], materialId: 'insulation_rockwool', weight: 1.0 },
  { keywords: ['eps', 'expanded polystyrene'], materialId: 'insulation_eps', weight: 1.0 },
  { keywords: ['xps', 'extruded polystyrene'], materialId: 'insulation_xps', weight: 1.0 },
  { keywords: ['spray foam', 'pu spray', 'spray pu'], materialId: 'insulation_pu_spray', weight: 1.0 },
  { keywords: ['insulation', 'ฉนวน'], materialId: 'insulation_glasswool', weight: 0.5 },

  // MEP
  { keywords: ['copper pipe', 'copper tube'], materialId: 'copper_pipe', weight: 1.0 },
  { keywords: ['pvc pipe', 'pvc tube'], materialId: 'pvc_pipe', weight: 1.0 },
  { keywords: ['hdpe pipe', 'pe pipe'], materialId: 'hdpe_pipe', weight: 1.0 },
  { keywords: ['ppr pipe', 'polypropylene pipe'], materialId: 'ppr_pipe', weight: 1.0 },
  { keywords: ['gi duct', 'galvanized duct'], materialId: 'gi_duct', weight: 1.0 },
  { keywords: ['aluminum duct', 'flex duct'], materialId: 'aluminium_duct', weight: 1.0 },
  { keywords: ['electrical cable', 'power cable', 'copper cable'], materialId: 'cable_copper', weight: 1.0 },
  { keywords: ['pipe', 'piping', 'ท่อ'], materialId: 'pvc_pipe', weight: 0.4 },
  { keywords: ['duct', 'ductwork'], materialId: 'gi_duct', weight: 0.4 },

  // Roofing
  { keywords: ['concrete tile', 'concrete roof'], materialId: 'roof_tile_concrete', weight: 1.0 },
  { keywords: ['clay tile', 'clay roof'], materialId: 'roof_tile_clay', weight: 1.0 },
  { keywords: ['metal roof', 'metal sheet', 'เมทัลชีท'], materialId: 'roof_metal_sheet', weight: 1.0 },
  { keywords: ['fiber cement', 'fibre cement'], materialId: 'roof_fiber_cement', weight: 1.0 },
  { keywords: ['roof', 'roofing', 'หลังคา'], materialId: 'roof_tile_concrete', weight: 0.5 },

  // Waterproofing
  { keywords: ['bitumen membrane', 'bituminous'], materialId: 'membrane_bitumen', weight: 1.0 },
  { keywords: ['tpo membrane', 'tpo roof'], materialId: 'membrane_tpo', weight: 1.0 },
  { keywords: ['pu waterproof', 'polyurethane waterproof'], materialId: 'coating_pu_waterproof', weight: 1.0 },
  { keywords: ['waterproof', 'waterproofing', 'กันซึม'], materialId: 'membrane_bitumen', weight: 0.5 },

  // Cement
  { keywords: ['portland cement', 'opc', 'type i cement'], materialId: 'cement_portland_type1', weight: 1.0 },
  { keywords: ['blended cement', 'composite cement'], materialId: 'cement_blended', weight: 0.9 },
  { keywords: ['green cement', 'low carbon cement', 'scg green'], materialId: 'cement_green', weight: 1.0 },
  { keywords: ['cement', 'ปูน'], materialId: 'cement_blended', weight: 0.5 },

  // Aggregates
  { keywords: ['crushed stone', 'aggregate', 'หินย่อย'], materialId: 'aggregate_crushed_stone', weight: 0.8 },
  { keywords: ['sand', 'ทราย'], materialId: 'aggregate_sand', weight: 0.8 },
  { keywords: ['gravel', 'กรวด'], materialId: 'aggregate_gravel', weight: 0.8 },
  { keywords: ['laterite', 'ลูกรัง'], materialId: 'fill_laterite', weight: 0.8 },
];

/**
 * Element type to default material category mapping
 */
const ELEMENT_TYPE_DEFAULTS: Record<string, string> = {
  wall: 'brick_aac',
  slab: 'concrete_c25',
  beam: 'concrete_c30',
  column: 'concrete_c35',
  roof: 'roof_tile_concrete',
  door: 'door_aluminum',
  window: 'glass_float_clear',
  stair: 'concrete_c25',
  pipe: 'pvc_pipe',
  duct: 'gi_duct',
  hvac: 'aluminium_duct',
  furniture: 'timber_plywood',
  equipment: 'steel_structural_h',
  other: 'concrete_c25',
};

// ============================================
// Matching Functions
// ============================================

/**
 * Normalize material name for matching
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Calculate string similarity (0-1)
 */
function stringSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLength;
}

/**
 * Try exact match against Thai materials
 */
function tryExactMatch(ifcName: string): MaterialMapping | null {
  const normalized = normalizeName(ifcName);

  for (const material of Object.values(THAI_MATERIALS)) {
    if (
      normalizeName(material.nameEn) === normalized ||
      material.nameTh === ifcName ||
      material.id === normalized.replace(/\s/g, '_')
    ) {
      return {
        ifcName,
        thaiMaterialId: material.id,
        thaiMaterial: material,
        confidence: 1.0,
        matchMethod: 'exact',
      };
    }
  }

  return null;
}

/**
 * Try keyword-based matching
 */
function tryKeywordMatch(ifcName: string): MaterialMapping | null {
  const normalized = normalizeName(ifcName);
  let bestMatch: { materialId: string; weight: number } | null = null;

  for (const mapping of KEYWORD_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        if (!bestMatch || mapping.weight > bestMatch.weight) {
          bestMatch = { materialId: mapping.materialId, weight: mapping.weight };
        }
      }
    }
  }

  if (bestMatch) {
    const material = THAI_MATERIALS[bestMatch.materialId];
    if (material) {
      return {
        ifcName,
        thaiMaterialId: material.id,
        thaiMaterial: material,
        confidence: Math.min(0.95, bestMatch.weight),
        matchMethod: 'keyword',
      };
    }
  }

  return null;
}

/**
 * Try category-based default matching
 */
function tryCategoryMatch(ifcName: string, elementType?: string): MaterialMapping | null {
  if (!elementType) return null;

  const defaultMaterialId = ELEMENT_TYPE_DEFAULTS[elementType];
  if (!defaultMaterialId) return null;

  const material = THAI_MATERIALS[defaultMaterialId];
  if (!material) return null;

  return {
    ifcName,
    thaiMaterialId: material.id,
    thaiMaterial: material,
    confidence: 0.5,
    matchMethod: 'category',
  };
}

/**
 * Try fuzzy matching against all materials
 */
function tryFuzzyMatch(ifcName: string): MaterialMapping | null {
  const normalized = normalizeName(ifcName);
  let bestMatch: { material: ThaiMaterial; similarity: number } | null = null;

  for (const material of Object.values(THAI_MATERIALS)) {
    // Check against English name
    const similarity = stringSimilarity(normalized, normalizeName(material.nameEn));
    if (!bestMatch || similarity > bestMatch.similarity) {
      bestMatch = { material, similarity };
    }

    // Check against tags
    if (material.tags) {
      for (const tag of material.tags) {
        const tagSimilarity = stringSimilarity(normalized, tag.toLowerCase());
        if (tagSimilarity > (bestMatch?.similarity || 0)) {
          bestMatch = { material, similarity: tagSimilarity };
        }
      }
    }
  }

  if (bestMatch && bestMatch.similarity >= 0.4) {
    return {
      ifcName,
      thaiMaterialId: bestMatch.material.id,
      thaiMaterial: bestMatch.material,
      confidence: bestMatch.similarity * 0.8, // Scale down fuzzy matches
      matchMethod: 'fuzzy',
    };
  }

  return null;
}

// ============================================
// Main Mapping Function
// ============================================

/**
 * Map an IFC material name to a Thai material database entry
 */
export function mapIFCMaterial(
  ifcMaterialName: string,
  options: MappingOptions = {}
): MaterialMapping {
  const { elementType, minConfidence = 0.3, includeLowCarbonAlternatives = true } = options;

  // Skip empty names
  if (!ifcMaterialName || ifcMaterialName.trim() === '') {
    const defaultMaterial = THAI_MATERIALS[ELEMENT_TYPE_DEFAULTS[elementType || 'other']];
    return {
      ifcName: ifcMaterialName || 'Unknown',
      thaiMaterialId: defaultMaterial.id,
      thaiMaterial: defaultMaterial,
      confidence: 0.3,
      matchMethod: 'default',
    };
  }

  // Try matching strategies in order of confidence
  let mapping =
    tryExactMatch(ifcMaterialName) ||
    tryKeywordMatch(ifcMaterialName) ||
    tryCategoryMatch(ifcMaterialName, elementType) ||
    tryFuzzyMatch(ifcMaterialName);

  // If no match found or confidence too low, use element type default
  if (!mapping || mapping.confidence < minConfidence) {
    const defaultMaterial = THAI_MATERIALS[ELEMENT_TYPE_DEFAULTS[elementType || 'other']];
    mapping = {
      ifcName: ifcMaterialName,
      thaiMaterialId: defaultMaterial.id,
      thaiMaterial: defaultMaterial,
      confidence: 0.3,
      matchMethod: 'default',
    };
  }

  // Add low-carbon alternatives if requested
  if (includeLowCarbonAlternatives && mapping.thaiMaterial.lowCarbonAlternativeId) {
    const alternative = THAI_MATERIALS[mapping.thaiMaterial.lowCarbonAlternativeId];
    if (alternative) {
      mapping.alternatives = [alternative];
    }
  }

  return mapping;
}

/**
 * Map multiple IFC materials at once
 */
export function mapIFCMaterials(
  materials: Array<{ name: string; elementType?: string }>,
  options: Omit<MappingOptions, 'elementType'> = {}
): MaterialMapping[] {
  return materials.map((mat) =>
    mapIFCMaterial(mat.name, { ...options, elementType: mat.elementType })
  );
}

/**
 * Get all available Thai materials for a category
 */
export function getThaiMaterialsByCategory(category: ThaiMaterialCategory): ThaiMaterial[] {
  return Object.values(THAI_MATERIALS).filter((m) => m.category === category);
}

/**
 * Search Thai materials by query
 */
export function searchThaiMaterials(query: string): ThaiMaterial[] {
  const normalized = normalizeName(query);
  return Object.values(THAI_MATERIALS).filter(
    (m) =>
      normalizeName(m.nameEn).includes(normalized) ||
      m.nameTh.includes(query) ||
      m.tags?.some((tag) => tag.toLowerCase().includes(normalized))
  );
}

export default {
  mapIFCMaterial,
  mapIFCMaterials,
  getThaiMaterialsByCategory,
  searchThaiMaterials,
};
