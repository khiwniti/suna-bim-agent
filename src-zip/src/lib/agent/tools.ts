/**
 * BIM Agent Tools
 *
 * Tools for agents to interact with IFC models, BCF issues, and building data
 * These tools provide the hybrid data access approach:
 * - Context injection: Summary data pre-loaded
 * - Tool calls: Detailed queries on demand
 */

import { prisma } from '@/lib/db';
import type { AgentType } from './types';

// ============================================
// IFC Query Tools
// ============================================

/**
 * Query IFC elements by type
 */
export async function queryElementsByType(
  modelId: string,
  ifcType: string,
  options: { limit?: number; includeProperties?: boolean } = {}
): Promise<{
  count: number;
  elements: Array<{
    id: string;
    globalId: string;
    name: string;
    ifcType: string;
    properties?: Record<string, unknown>;
  }>;
}> {
  // This will be implemented when IFC element storage is added
  // For now, return mock structure
  return {
    count: 0,
    elements: [],
  };
}

/**
 * Get spatial structure (building → stories → spaces)
 */
export async function getSpatialStructure(modelId: string): Promise<{
  building: {
    name: string;
    totalArea: number;
    stories: Array<{
      id: string;
      name: string;
      elevation: number;
      spaces: Array<{
        id: string;
        name: string;
        area: number;
        type: string;
      }>;
    }>;
  };
}> {
  // Will be implemented with IFC parsing
  return {
    building: {
      name: 'Unknown Building',
      totalArea: 0,
      stories: [],
    },
  };
}

/**
 * Calculate quantities from IFC elements
 */
export async function calculateQuantities(
  modelId: string,
  elementTypes?: string[]
): Promise<{
  totalVolume: number;
  totalArea: number;
  byMaterial: Array<{
    material: string;
    volume: number;
    area: number;
    count: number;
  }>;
  byElementType: Array<{
    type: string;
    count: number;
    volume: number;
    area: number;
  }>;
}> {
  // Will be implemented with IFC parsing
  return {
    totalVolume: 0,
    totalArea: 0,
    byMaterial: [],
    byElementType: [],
  };
}

/**
 * Find elements within a bounding box
 */
export async function findElementsInBoundingBox(
  modelId: string,
  minPoint: [number, number, number],
  maxPoint: [number, number, number],
  elementTypes?: string[]
): Promise<Array<{ id: string; globalId: string; ifcType: string; name: string }>> {
  // Will be implemented with spatial queries
  return [];
}

/**
 * Get element relationships (contains, connects, etc.)
 */
export async function getElementRelationships(
  modelId: string,
  elementId: string
): Promise<{
  contains: string[];
  containedIn: string;
  connectsTo: string[];
  adjacentTo: string[];
}> {
  // Will be implemented with IFC relationship parsing
  return {
    contains: [],
    containedIn: '',
    connectsTo: [],
    adjacentTo: [],
  };
}

// ============================================
// BCF Tools
// ============================================

// Map string topic types to Prisma enum values
const TOPIC_TYPE_MAP = {
  clash: 'CLASH',
  design: 'DESIGN',
  compliance: 'COMPLIANCE',
  rfi: 'RFI',
  issue: 'ISSUE',
  comment: 'COMMENT',
  request: 'REQUEST',
  fault: 'FAULT',
  inquiry: 'INQUIRY',
  solution: 'SOLUTION',
} as const;

// Map string priorities to Prisma enum values
const PRIORITY_MAP = {
  low: 'LOW',
  normal: 'NORMAL',
  medium: 'NORMAL', // Alias medium to normal
  high: 'HIGH',
  critical: 'CRITICAL',
} as const;

// Map string statuses to Prisma enum values
const STATUS_MAP = {
  open: 'OPEN',
  in_progress: 'IN_PROGRESS',
  resolved: 'RESOLVED',
  closed: 'CLOSED',
  reopened: 'REOPENED',
} as const;

/**
 * Create a BCF issue with optional viewpoint and linked elements
 */
export async function createBCFIssue(data: {
  projectId: string;
  modelId?: string;
  title: string;
  description: string;
  topicType: 'clash' | 'design' | 'compliance' | 'rfi' | 'issue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  linkedElementIds?: string[];
  viewpoint?: {
    cameraPosition: [number, number, number];
    cameraDirection: [number, number, number];
    cameraUp: [number, number, number];
    fieldOfView?: number;
  };
  createdBy?: AgentType;
}): Promise<{ issueId: string; guid: string }> {
  try {
    // Get the next index for this project
    const lastTopic = await prisma.bcfTopic.findFirst({
      where: { projectId: data.projectId },
      orderBy: { index: 'desc' },
      select: { index: true },
    });
    const nextIndex = (lastTopic?.index || 0) + 1;

    // Create the BCF topic with viewpoint and element links
    const topic = await prisma.bcfTopic.create({
      data: {
        title: data.title,
        description: data.description,
        topicType: TOPIC_TYPE_MAP[data.topicType] || 'ISSUE',
        priority: PRIORITY_MAP[data.priority] || 'NORMAL',
        assignedTo: data.assignedTo,
        createdByAgent: data.createdBy,
        index: nextIndex,
        projectId: data.projectId,
        modelId: data.modelId,
        // Create viewpoint if provided
        viewpoints: data.viewpoint
          ? {
              create: {
                cameraViewPoint: {
                  x: data.viewpoint.cameraPosition[0],
                  y: data.viewpoint.cameraPosition[1],
                  z: data.viewpoint.cameraPosition[2],
                },
                cameraDirection: {
                  x: data.viewpoint.cameraDirection[0],
                  y: data.viewpoint.cameraDirection[1],
                  z: data.viewpoint.cameraDirection[2],
                },
                cameraUpVector: {
                  x: data.viewpoint.cameraUp[0],
                  y: data.viewpoint.cameraUp[1],
                  z: data.viewpoint.cameraUp[2],
                },
                fieldOfView: data.viewpoint.fieldOfView,
                index: 0,
              },
            }
          : undefined,
        // Create element links if provided
        linkedElements: data.linkedElementIds?.length
          ? {
              createMany: {
                data: data.linkedElementIds.map((ifcGuid) => ({
                  ifcGuid,
                })),
              },
            }
          : undefined,
      },
    });

    return {
      issueId: topic.id,
      guid: topic.guid,
    };
  } catch (error) {
    console.error('Failed to create BCF issue:', error);
    // Fallback to temp ID if database fails
    return {
      issueId: `bcf_temp_${Date.now()}`,
      guid: crypto.randomUUID(),
    };
  }
}

/**
 * Get BCF issues for a project with optional filters
 */
export async function getBCFIssues(
  projectId: string,
  filters?: {
    status?: string;
    topicType?: string;
    priority?: string;
    createdBy?: AgentType;
  }
): Promise<
  Array<{
    id: string;
    guid: string;
    title: string;
    description: string | null;
    status: string;
    topicType: string;
    priority: string;
    assignedTo: string | null;
    createdByAgent: string | null;
    index: number | null;
    createdAt: Date;
    updatedAt: Date;
    linkedElementCount: number;
    commentCount: number;
  }>
> {
  try {
    const topics = await prisma.bcfTopic.findMany({
      where: {
        projectId,
        ...(filters?.status && {
          topicStatus: STATUS_MAP[filters.status as keyof typeof STATUS_MAP] || undefined,
        }),
        ...(filters?.topicType && {
          topicType:
            TOPIC_TYPE_MAP[filters.topicType as keyof typeof TOPIC_TYPE_MAP] || undefined,
        }),
        ...(filters?.priority && {
          priority: PRIORITY_MAP[filters.priority as keyof typeof PRIORITY_MAP] || undefined,
        }),
        ...(filters?.createdBy && { createdByAgent: filters.createdBy }),
      },
      include: {
        _count: {
          select: {
            linkedElements: true,
            comments: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return topics.map((topic) => ({
      id: topic.id,
      guid: topic.guid,
      title: topic.title,
      description: topic.description,
      status: topic.topicStatus.toLowerCase(),
      topicType: topic.topicType.toLowerCase(),
      priority: topic.priority.toLowerCase(),
      assignedTo: topic.assignedTo,
      createdByAgent: topic.createdByAgent,
      index: topic.index,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
      linkedElementCount: topic._count.linkedElements,
      commentCount: topic._count.comments,
    }));
  } catch (error) {
    console.error('Failed to get BCF issues:', error);
    return [];
  }
}

/**
 * Update BCF issue status with optional comment
 */
export async function updateBCFIssueStatus(
  issueId: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed',
  comment?: string,
  agentType?: AgentType
): Promise<{ success: boolean; error?: string }> {
  try {
    const newStatus = STATUS_MAP[status] || 'OPEN';

    await prisma.$transaction(async (tx) => {
      // Update the topic status
      await tx.bcfTopic.update({
        where: { id: issueId },
        data: { topicStatus: newStatus },
      });

      // Add a comment if provided
      if (comment) {
        await tx.bcfComment.create({
          data: {
            topicId: issueId,
            comment: `Status changed to ${status}${comment ? `: ${comment}` : ''}`,
            agentType: agentType || null,
            isAutomated: !!agentType,
          },
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to update BCF issue status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Add a comment to a BCF issue
 */
export async function addBCFComment(
  issueId: string,
  comment: string,
  agentType?: AgentType,
  viewpointGuid?: string
): Promise<{ success: boolean; commentId?: string }> {
  try {
    const newComment = await prisma.bcfComment.create({
      data: {
        topicId: issueId,
        comment,
        agentType: agentType || null,
        isAutomated: !!agentType,
        viewpointGuid,
      },
    });

    return { success: true, commentId: newComment.id };
  } catch (error) {
    console.error('Failed to add BCF comment:', error);
    return { success: false };
  }
}

/**
 * Get a single BCF issue with all details
 */
export async function getBCFIssueDetails(issueId: string): Promise<{
  id: string;
  guid: string;
  title: string;
  description: string | null;
  status: string;
  topicType: string;
  priority: string;
  assignedTo: string | null;
  createdByAgent: string | null;
  labels: string[];
  viewpoints: Array<{
    guid: string;
    cameraViewPoint: unknown;
    cameraDirection: unknown;
    snapshotUrl: string | null;
  }>;
  comments: Array<{
    id: string;
    comment: string;
    author: string | null;
    agentType: string | null;
    createdAt: Date;
  }>;
  linkedElements: Array<{
    ifcGuid: string;
    ifcType: string | null;
    elementName: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  try {
    const topic = await prisma.bcfTopic.findUnique({
      where: { id: issueId },
      include: {
        viewpoints: true,
        comments: {
          orderBy: { createdAt: 'asc' },
        },
        linkedElements: true,
      },
    });

    if (!topic) return null;

    return {
      id: topic.id,
      guid: topic.guid,
      title: topic.title,
      description: topic.description,
      status: topic.topicStatus.toLowerCase(),
      topicType: topic.topicType.toLowerCase(),
      priority: topic.priority.toLowerCase(),
      assignedTo: topic.assignedTo,
      createdByAgent: topic.createdByAgent,
      labels: topic.labels,
      viewpoints: topic.viewpoints.map((vp) => ({
        guid: vp.guid,
        cameraViewPoint: vp.cameraViewPoint,
        cameraDirection: vp.cameraDirection,
        snapshotUrl: vp.snapshotUrl,
      })),
      comments: topic.comments.map((c) => ({
        id: c.id,
        comment: c.comment,
        author: c.author,
        agentType: c.agentType,
        createdAt: c.createdAt,
      })),
      linkedElements: topic.linkedElements.map((e) => ({
        ifcGuid: e.ifcGuid,
        ifcType: e.ifcType,
        elementName: e.elementName,
      })),
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
    };
  } catch (error) {
    console.error('Failed to get BCF issue details:', error);
    return null;
  }
}

/**
 * Link IFC elements to a BCF issue
 */
export async function linkElementsToBCFIssue(
  issueId: string,
  elements: Array<{
    ifcGuid: string;
    ifcType?: string;
    elementName?: string;
  }>
): Promise<{ success: boolean; linkedCount: number }> {
  try {
    const result = await prisma.bcfElementLink.createMany({
      data: elements.map((e) => ({
        topicId: issueId,
        ifcGuid: e.ifcGuid,
        ifcType: e.ifcType,
        elementName: e.elementName,
      })),
      skipDuplicates: true,
    });

    return { success: true, linkedCount: result.count };
  } catch (error) {
    console.error('Failed to link elements to BCF issue:', error);
    return { success: false, linkedCount: 0 };
  }
}

// ============================================
// Analysis Tools
// ============================================

/**
 * Calculate carbon footprint from materials
 */
export async function calculateCarbonFootprint(
  modelId: string,
  carbonDatabase: 'ice' | 'ec3' = 'ice'
): Promise<{
  totalEmbodiedCarbon: number; // kgCO2e
  carbonPerSquareMeter: number; // kgCO2e/m²
  byMaterial: Array<{
    material: string;
    volume: number;
    carbonFactor: number;
    totalCarbon: number;
    percentage: number;
  }>;
  byElement: Array<{
    elementType: string;
    totalCarbon: number;
    percentage: number;
  }>;
  recommendations: Array<{
    current: string;
    alternative: string;
    potentialSavings: number;
    percentReduction: number;
  }>;
}> {
  // Will be implemented with carbon databases
  return {
    totalEmbodiedCarbon: 0,
    carbonPerSquareMeter: 0,
    byMaterial: [],
    byElement: [],
    recommendations: [],
  };
}

/**
 * Perform egress analysis
 */
export async function analyzeEgress(
  modelId: string,
  floorId?: string
): Promise<{
  occupantLoad: number;
  requiredExits: number;
  actualExits: number;
  compliant: boolean;
  maxTravelDistance: number;
  allowedTravelDistance: number;
  deadEnds: Array<{
    location: string;
    length: number;
    maxAllowed: number;
  }>;
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location: string;
  }>;
}> {
  // Will be implemented with spatial analysis
  return {
    occupantLoad: 0,
    requiredExits: 0,
    actualExits: 0,
    compliant: true,
    maxTravelDistance: 0,
    allowedTravelDistance: 0,
    deadEnds: [],
    issues: [],
  };
}

/**
 * Detect clashes between element sets
 */
export async function detectClashes(
  modelId: string,
  setA: { types: string[] },
  setB: { types: string[] },
  options: {
    tolerance?: number;
    checkClearance?: boolean;
    clearanceDistance?: number;
  } = {}
): Promise<{
  hardClashes: Array<{
    id: string;
    elementA: { id: string; type: string; name: string };
    elementB: { id: string; type: string; name: string };
    intersectionVolume: number;
    location: [number, number, number];
  }>;
  softClashes: Array<{
    id: string;
    elementA: { id: string; type: string; name: string };
    elementB: { id: string; type: string; name: string };
    distance: number;
    requiredClearance: number;
    location: [number, number, number];
  }>;
  summary: {
    totalHardClashes: number;
    totalSoftClashes: number;
    criticalCount: number;
  };
}> {
  // Will be implemented with geometry analysis
  return {
    hardClashes: [],
    softClashes: [],
    summary: {
      totalHardClashes: 0,
      totalSoftClashes: 0,
      criticalCount: 0,
    },
  };
}

// ============================================
// Context Injection Helpers
// ============================================

/**
 * Get model summary for context injection
 * This provides agents with a quick overview without heavy queries
 */
export async function getModelSummary(modelId: string): Promise<{
  modelId: string;
  name: string;
  ifcSchema: string;
  buildingType: string;
  totalArea: number;
  floorCount: number;
  elementCounts: Record<string, number>;
  materials: string[];
  systems: string[];
  lastAnalyzed?: Date;
}> {
  // Will be populated from IFC parsing results
  return {
    modelId,
    name: 'Unknown Model',
    ifcSchema: 'IFC4',
    buildingType: 'Commercial',
    totalArea: 0,
    floorCount: 0,
    elementCounts: {},
    materials: [],
    systems: [],
  };
}

/**
 * Get analysis history for a model
 */
export async function getAnalysisHistory(
  modelId: string
): Promise<Array<{
  id: string;
  agent: AgentType;
  type: string;
  timestamp: Date;
  summary: string;
}>> {
  // Will be implemented with analysis result storage
  return [];
}

// ============================================
// Tool Registry
// ============================================

export const BIM_TOOLS = {
  // IFC Queries
  queryElementsByType,
  getSpatialStructure,
  calculateQuantities,
  findElementsInBoundingBox,
  getElementRelationships,

  // BCF
  createBCFIssue,
  getBCFIssues,
  updateBCFIssueStatus,
  addBCFComment,
  getBCFIssueDetails,
  linkElementsToBCFIssue,

  // Analysis
  calculateCarbonFootprint,
  analyzeEgress,
  detectClashes,

  // Context
  getModelSummary,
  getAnalysisHistory,
};

export type BIMToolName = keyof typeof BIM_TOOLS;
