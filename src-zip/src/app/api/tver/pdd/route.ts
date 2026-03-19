/**
 * T-VER PDD Generation API Endpoint
 *
 * POST /api/tver/pdd - Generate T-VER Project Design Document
 *
 * Accepts project data and returns a TVERProjectDesignDocument
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { expensiveRateLimiter, validateCSRFToken } from '@/lib/security';
import { z } from 'zod';
import {
  generateTVERPDD,
  type TVERProjectCategory,
  type BOQCarbonAnalysis,
  type EdgeCalculation,
} from '@/lib/carbon';

// Validation schema for project info
const projectInfoSchema = z.object({
  name: z.string().min(1),
  nameTh: z.string().min(1),
  description: z.string().min(1),
  location: z.object({
    province: z.string().min(1),
    district: z.string().min(1),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  }),
  startDate: z.string().or(z.date()),
  durationYears: z.number().min(1).max(30),
  category: z.enum([
    'building_energy_efficiency',
    'low_carbon_materials',
    'waste_reduction',
    'renewable_energy',
    'sustainable_construction',
  ]),
});

// Validation schema for carbon analysis
const carbonAnalysisSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  totalEmbodiedCarbon: z.number(),
  carbonPerSquareMeter: z.number(),
  grossFloorArea: z.number(),
  categoryBreakdown: z.array(
    z.object({
      category: z.string(),
      totalCarbon: z.number(),
      percentage: z.number(),
    })
  ),
  scopeBreakdown: z.object({
    scope1: z.number(),
    scope2: z.number(),
    scope3: z.number(),
  }),
  hotspots: z.array(
    z.object({
      itemId: z.string(),
      description: z.string(),
      carbon: z.number(),
      percentage: z.number(),
    })
  ),
  items: z.array(z.any()),
  calculatedAt: z.string().or(z.date()),
  methodology: z.enum(['edge', 'tgo_cfp', 'iso14064']),
});

// Validation schema for edge calculation
const edgeCalcSchema = z
  .object({
    projectId: z.string(),
    baselineCarbon: z.number(),
    optimizedCarbon: z.number(),
    carbonReduction: z.number(),
    certificationLevel: z
      .enum(['edge_certified', 'edge_advanced', 'edge_zero_carbon'])
      .optional(),
    meetsEdgeThreshold: z.boolean(),
    improvements: z.array(z.any()),
    materialBreakdown: z.array(z.any()),
  })
  .nullable()
  .optional();

// Combined request schema
const generatePDDSchema = z.object({
  projectInfo: projectInfoSchema,
  carbonAnalysis: carbonAnalysisSchema,
  edgeCalc: edgeCalcSchema,
});

export const maxDuration = 30;

/**
 * POST /api/tver/pdd - Generate T-VER Project Design Document
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Rate limiting
    const rateLimitError = await expensiveRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // 3. CSRF validation
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const result = generatePDDSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { projectInfo, carbonAnalysis, edgeCalc } = result.data;

    // Convert date strings to Date objects
    const boqAnalysis: BOQCarbonAnalysis = {
      ...carbonAnalysis,
      calculatedAt:
        typeof carbonAnalysis.calculatedAt === 'string'
          ? new Date(carbonAnalysis.calculatedAt)
          : carbonAnalysis.calculatedAt,
    } as BOQCarbonAnalysis;

    const projectInfoWithDate = {
      ...projectInfo,
      startDate:
        typeof projectInfo.startDate === 'string'
          ? new Date(projectInfo.startDate)
          : projectInfo.startDate,
      category: projectInfo.category as TVERProjectCategory,
    };

    // Generate the PDD
    const pdd = generateTVERPDD(
      projectInfoWithDate,
      boqAnalysis,
      edgeCalc as EdgeCalculation | null
    );

    return NextResponse.json({
      success: true,
      pdd,
    });
  } catch (error) {
    console.error('[T-VER PDD API] Generation error:', error);
    return NextResponse.json(
      {
        error: 'PDD generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
