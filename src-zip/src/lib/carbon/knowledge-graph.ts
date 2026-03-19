/**
 * Standards Knowledge Graph
 *
 * Visual mapping of relationships between carbon standards:
 * - Edge (Global certification)
 * - TGO CFP (Thai Carbon Footprint of Product)
 * - ISO 14064 (GHG Quantification)
 * - TREES (Thai Green Building Rating)
 * - T-VER (Thai Voluntary Emission Reduction)
 *
 * Purpose: Help users understand how data flows between standards
 * for validation with วศท. and สมาคมรับสร้างบ้าน
 */

import type {
  StandardNode,
  StandardRelationship,
  StandardsKnowledgeGraph,
} from './types';

// =============================================================================
// STANDARD NODES
// =============================================================================

export const STANDARD_NODES: StandardNode[] = [
  // -------------------------------------------------------------------------
  // International Standards
  // -------------------------------------------------------------------------
  {
    id: 'iso-14064',
    name: 'ISO 14064',
    nameTh: 'ISO 14064 การวัดปริมาณก๊าซเรือนกระจก',
    type: 'international',
    organization: 'ISO',
    relatedStandards: ['iso-14067', 'tgo-cfo', 'tgo-cfp'],
    dataRequirements: [
      'Scope 1 emissions (direct)',
      'Scope 2 emissions (energy indirect)',
      'Scope 3 emissions (other indirect)',
      'Organizational boundaries',
      'Activity data',
      'Emission factors',
    ],
    outputDocuments: [
      'GHG Inventory Report',
      'Verification Statement',
      'Emission Reduction Report',
    ],
  },
  {
    id: 'iso-14067',
    name: 'ISO 14067',
    nameTh: 'ISO 14067 คาร์บอนฟุตพริ้นท์ผลิตภัณฑ์',
    type: 'international',
    organization: 'ISO',
    relatedStandards: ['iso-14064', 'tgo-cfp', 'epd'],
    dataRequirements: [
      'Product lifecycle stages',
      'Material inputs',
      'Energy consumption',
      'Transport data',
      'Functional unit definition',
    ],
    outputDocuments: [
      'Product Carbon Footprint Report',
      'Environmental Product Declaration (EPD)',
    ],
  },
  {
    id: 'epd',
    name: 'Environmental Product Declaration',
    nameTh: 'ฉลากสิ่งแวดล้อมประเภท 3 (EPD)',
    type: 'international',
    organization: 'Various Program Operators',
    relatedStandards: ['iso-14067', 'tgo-cfp', 'edge'],
    dataRequirements: [
      'LCA study (ISO 14044 compliant)',
      'Product category rules (PCR)',
      'Manufacturing data',
      'Third-party verification',
    ],
    outputDocuments: [
      'Environmental Product Declaration',
      'LCA Report',
    ],
  },
  {
    id: 'edge',
    name: 'Edge Certification',
    nameTh: 'Edge (มาตรฐานอาคารเขียวระดับโลก)',
    type: 'certification',
    organization: 'IFC (World Bank Group)',
    relatedStandards: ['iso-14064', 'trees', 'tgo-cfp'],
    dataRequirements: [
      'Energy efficiency measures (20% min reduction)',
      'Water efficiency measures (20% min reduction)',
      'Embodied energy in materials (20% min reduction)',
      'Building design specifications',
      'Material specifications',
      'BOQ with material quantities',
    ],
    outputDocuments: [
      'Edge Preliminary Certificate',
      'Edge Final Certificate',
      'Embodied Carbon Report',
    ],
  },

  // -------------------------------------------------------------------------
  // Thai Standards (TGO)
  // -------------------------------------------------------------------------
  {
    id: 'tgo-cfo',
    name: 'TGO CFO (Carbon Footprint for Organization)',
    nameTh: 'TGO CFO คาร์บอนฟุตพริ้นท์องค์กร',
    type: 'thai',
    organization: 'Thailand Greenhouse Gas Management Organization (TGO)',
    relatedStandards: ['iso-14064', 't-ver', 't-vets'],
    dataRequirements: [
      'Organization boundaries',
      'Activity data (fuel, electricity, materials)',
      'Thai grid emission factors',
      'Process emissions',
      'Fugitive emissions',
    ],
    outputDocuments: [
      'CFO Report',
      'TGO CFO Certificate',
      'Emission Inventory',
    ],
  },
  {
    id: 'tgo-cfp',
    name: 'TGO CFP (Carbon Footprint of Product)',
    nameTh: 'TGO CFP คาร์บอนฟุตพริ้นท์ผลิตภัณฑ์',
    type: 'thai',
    organization: 'Thailand Greenhouse Gas Management Organization (TGO)',
    relatedStandards: ['iso-14067', 'edge', 'trees', 'epd'],
    dataRequirements: [
      'Product lifecycle boundary',
      'Thai National LCI data',
      'Material composition',
      'Manufacturing energy',
      'Transport emissions',
    ],
    outputDocuments: [
      'CFP Report',
      'TGO CFP Label',
      'Carbon Footprint Certificate',
    ],
  },
  {
    id: 't-ver',
    name: 'T-VER (Thailand Voluntary Emission Reduction)',
    nameTh: 'T-VER โครงการลดก๊าซเรือนกระจกภาคสมัครใจ',
    type: 'thai',
    organization: 'Thailand Greenhouse Gas Management Organization (TGO)',
    relatedStandards: ['tgo-cfo', 't-vets', 'iso-14064'],
    dataRequirements: [
      'Baseline emissions calculation',
      'Project emissions calculation',
      'Emission reduction methodology',
      'Monitoring plan',
      'Third-party verification',
    ],
    outputDocuments: [
      'T-VER Project Design Document (PDD)',
      'Monitoring Report',
      'Verification Report',
      'Carbon Credits (tCO2e)',
    ],
  },
  {
    id: 't-vets',
    name: 'T-VETS (Thailand Voluntary Emission Trading Scheme)',
    nameTh: 'T-VETS ระบบซื้อขายสิทธิ์การปล่อยก๊าซเรือนกระจก',
    type: 'thai',
    organization: 'Thailand Greenhouse Gas Management Organization (TGO)',
    relatedStandards: ['t-ver', 'tgo-cfo'],
    dataRequirements: [
      'Emission allowances',
      'Verified carbon credits',
      'Trading account',
      'Compliance reporting',
    ],
    outputDocuments: [
      'Trading Registry Records',
      'Offset Certificates',
    ],
  },
  {
    id: 'trees',
    name: 'TREES (Thai Rating of Energy and Environmental Sustainability)',
    nameTh: 'TREES มาตรฐานอาคารเขียวไทย',
    type: 'certification',
    organization: 'Thai Green Building Institute (TGBI)',
    relatedStandards: ['edge', 'tgo-cfp', 'iso-14064'],
    dataRequirements: [
      'Site & Landscape data',
      'Energy consumption data',
      'Water consumption data',
      'Material specifications (recycled content, local materials)',
      'Indoor environmental quality',
      'Green construction management',
    ],
    outputDocuments: [
      'TREES Scorecard',
      'TREES Certificate (Certified/Silver/Gold/Platinum)',
      'Credit Documentation',
    ],
  },

  // -------------------------------------------------------------------------
  // Supporting Frameworks
  // -------------------------------------------------------------------------
  {
    id: 'thai-lci',
    name: 'Thai National LCI Database',
    nameTh: 'ฐานข้อมูล LCI แห่งชาติ',
    type: 'guideline',
    organization: 'MTEC / TGO',
    relatedStandards: ['tgo-cfp', 'tgo-cfo', 'iso-14067'],
    dataRequirements: [
      'Industry sector data',
      'Material production data',
      'Energy grid data',
      'Transport data',
    ],
    outputDocuments: [
      'Emission Factors Database',
      'LCI Data Sheets',
    ],
  },
  {
    id: 'boq-standard',
    name: 'Thai BOQ Standard (วสท.)',
    nameTh: 'มาตรฐาน BOQ (วิศวกรรมสถานแห่งประเทศไทย)',
    type: 'guideline',
    organization: 'Engineering Institute of Thailand (EIT)',
    relatedStandards: ['edge', 'trees', 'tgo-cfp'],
    dataRequirements: [
      'Work breakdown structure',
      'Material quantities',
      'Unit costs',
      'Labor requirements',
    ],
    outputDocuments: [
      'Bill of Quantities',
      'Cost Estimate',
      'Material Schedule',
    ],
  },
];

// =============================================================================
// STANDARD RELATIONSHIPS
// =============================================================================

export const STANDARD_RELATIONSHIPS: StandardRelationship[] = [
  // ISO 14064 relationships
  {
    fromId: 'iso-14064',
    toId: 'tgo-cfo',
    relationshipType: 'extends',
    description: 'TGO CFO is aligned with ISO 14064-1 for organizational carbon footprint',
  },
  {
    fromId: 'iso-14064',
    toId: 't-ver',
    relationshipType: 'supports',
    description: 'ISO 14064 methodology supports T-VER project calculations',
  },

  // ISO 14067 relationships
  {
    fromId: 'iso-14067',
    toId: 'tgo-cfp',
    relationshipType: 'extends',
    description: 'TGO CFP follows ISO 14067 methodology with Thai-specific data',
  },
  {
    fromId: 'iso-14067',
    toId: 'epd',
    relationshipType: 'requires',
    description: 'EPD requires ISO 14067 compliant carbon footprint calculation',
  },

  // TGO relationships
  {
    fromId: 'tgo-cfp',
    toId: 'thai-lci',
    relationshipType: 'requires',
    description: 'TGO CFP requires emission factors from Thai National LCI',
  },
  {
    fromId: 'tgo-cfp',
    toId: 'edge',
    relationshipType: 'supports',
    description: 'TGO CFP data supports Edge embodied carbon calculations',
  },
  {
    fromId: 'tgo-cfp',
    toId: 'trees',
    relationshipType: 'supports',
    description: 'TGO CFP data supports TREES material credits (MR4, MR5)',
  },
  {
    fromId: 'tgo-cfo',
    toId: 't-ver',
    relationshipType: 'requires',
    description: 'T-VER projects require CFO baseline calculations',
  },
  {
    fromId: 't-ver',
    toId: 't-vets',
    relationshipType: 'supports',
    description: 'T-VER credits can be traded in T-VETS market',
  },

  // Edge relationships
  {
    fromId: 'edge',
    toId: 'boq-standard',
    relationshipType: 'requires',
    description: 'Edge certification requires BOQ for material quantity calculations',
  },
  {
    fromId: 'edge',
    toId: 'trees',
    relationshipType: 'alternative',
    description: 'Edge and TREES are alternative green building certifications',
  },

  // TREES relationships
  {
    fromId: 'trees',
    toId: 'boq-standard',
    relationshipType: 'requires',
    description: 'TREES material credits require BOQ with material specifications',
  },

  // BOQ relationships
  {
    fromId: 'boq-standard',
    toId: 'tgo-cfp',
    relationshipType: 'supports',
    description: 'BOQ quantities enable carbon footprint calculation per TGO CFP',
  },
];

// =============================================================================
// KNOWLEDGE GRAPH IMPLEMENTATION
// =============================================================================

/**
 * Create knowledge graph instance
 */
export function createKnowledgeGraph(): StandardsKnowledgeGraph {
  return {
    nodes: STANDARD_NODES,
    relationships: STANDARD_RELATIONSHIPS,

    getRelatedStandards(standardId: string): StandardNode[] {
      const node = STANDARD_NODES.find((n) => n.id === standardId);
      if (!node) return [];

      return node.relatedStandards
        .map((id) => STANDARD_NODES.find((n) => n.id === id))
        .filter((n): n is StandardNode => n !== undefined);
    },

    getDataRequirements(standardId: string): string[] {
      const node = STANDARD_NODES.find((n) => n.id === standardId);
      return node?.dataRequirements || [];
    },

    getPath(fromId: string, toId: string): StandardNode[] {
      // Simple BFS to find path between standards
      const visited = new Set<string>();
      const queue: { nodeId: string; path: StandardNode[] }[] = [];

      const startNode = STANDARD_NODES.find((n) => n.id === fromId);
      if (!startNode) return [];

      queue.push({ nodeId: fromId, path: [startNode] });
      visited.add(fromId);

      while (queue.length > 0) {
        const current = queue.shift()!;

        if (current.nodeId === toId) {
          return current.path;
        }

        const relationships = STANDARD_RELATIONSHIPS.filter(
          (r) => r.fromId === current.nodeId || r.toId === current.nodeId
        );

        for (const rel of relationships) {
          const nextId = rel.fromId === current.nodeId ? rel.toId : rel.fromId;

          if (!visited.has(nextId)) {
            visited.add(nextId);
            const nextNode = STANDARD_NODES.find((n) => n.id === nextId);
            if (nextNode) {
              queue.push({
                nodeId: nextId,
                path: [...current.path, nextNode],
              });
            }
          }
        }
      }

      return [];
    },
  };
}

/**
 * Get compliance requirements for a target certification
 */
export function getComplianceRequirements(targetCertification: string): {
  standard: StandardNode;
  requirements: string[];
  supportingStandards: StandardNode[];
  dataFlow: { from: string; to: string; description: string }[];
} | null {
  const standard = STANDARD_NODES.find((n) => n.id === targetCertification);
  if (!standard) return null;

  const supportingStandards = standard.relatedStandards
    .map((id) => STANDARD_NODES.find((n) => n.id === id))
    .filter((n): n is StandardNode => n !== undefined);

  const dataFlow = STANDARD_RELATIONSHIPS
    .filter((r) => r.toId === targetCertification || r.fromId === targetCertification)
    .map((r) => ({
      from: r.fromId,
      to: r.toId,
      description: r.description,
    }));

  return {
    standard,
    requirements: standard.dataRequirements,
    supportingStandards,
    dataFlow,
  };
}

/**
 * Map BOQ to required certifications
 */
export function mapBOQToCertifications(boqData: {
  hasMaterialQuantities: boolean;
  hasRecycledContent: boolean;
  hasLocalMaterialData: boolean;
  hasTransportData: boolean;
}): {
  certification: string;
  readiness: 'ready' | 'partial' | 'not_ready';
  missingData: string[];
}[] {
  const results: {
    certification: string;
    readiness: 'ready' | 'partial' | 'not_ready';
    missingData: string[];
  }[] = [];

  // Edge readiness
  const edgeMissing: string[] = [];
  if (!boqData.hasMaterialQuantities) edgeMissing.push('Material quantities');
  if (!boqData.hasTransportData) edgeMissing.push('Transport distances');
  results.push({
    certification: 'Edge',
    readiness: edgeMissing.length === 0 ? 'ready' : edgeMissing.length === 1 ? 'partial' : 'not_ready',
    missingData: edgeMissing,
  });

  // TREES readiness
  const treesMissing: string[] = [];
  if (!boqData.hasMaterialQuantities) treesMissing.push('Material quantities');
  if (!boqData.hasRecycledContent) treesMissing.push('Recycled content percentages');
  if (!boqData.hasLocalMaterialData) treesMissing.push('Local material production data');
  results.push({
    certification: 'TREES',
    readiness: treesMissing.length === 0 ? 'ready' : treesMissing.length <= 1 ? 'partial' : 'not_ready',
    missingData: treesMissing,
  });

  // TGO CFP readiness
  const tgoCfpMissing: string[] = [];
  if (!boqData.hasMaterialQuantities) tgoCfpMissing.push('Material quantities');
  if (!boqData.hasTransportData) tgoCfpMissing.push('Transport data for Scope 3');
  results.push({
    certification: 'TGO CFP',
    readiness: tgoCfpMissing.length === 0 ? 'ready' : tgoCfpMissing.length === 1 ? 'partial' : 'not_ready',
    missingData: tgoCfpMissing,
  });

  return results;
}
