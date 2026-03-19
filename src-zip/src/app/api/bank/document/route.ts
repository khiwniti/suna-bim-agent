/**
 * Bank Document Generation API Endpoint
 *
 * POST /api/bank/document - Generate green loan documentation for Thai banks
 *
 * Accepts analysis data and target bank, returns a GreenLoanDocument
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { expensiveRateLimiter, validateCSRFToken } from '@/lib/security';
import { z } from 'zod';
import {
  generateGreenLoanDocument,
  type ThaiBank,
  type BOQCarbonAnalysis,
  type EdgeCalculation,
  type TREESCertification,
  type TVERProject,
} from '@/lib/carbon';

// Validation schema for request body
const generateDocumentSchema = z.object({
  analysis: z.object({
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
  }),
  edgeCalc: z
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
    .optional(),
  treesCert: z
    .object({
      projectId: z.string(),
      assessmentDate: z.string().or(z.date()),
      targetLevel: z.enum(['certified', 'silver', 'gold', 'platinum']),
      categoryScores: z.record(z.number()),
      mrCredits: z.object({
        mr4RecycledMaterial: z.number(),
        mr5LocalMaterial: z.number(),
        mr4Percentage: z.number().optional(),
        mr5Percentage: z.number().optional(),
      }),
      totalPoints: z.number(),
      certificationStatus: z.enum(['eligible', 'not_eligible']),
      recommendations: z.array(z.string()),
    })
    .nullable()
    .optional(),
  tverProject: z
    .object({
      projectId: z.string(),
      projectName: z.string(),
      registrationStatus: z.enum([
        'draft',
        'submitted',
        'under_review',
        'registered',
        'verified',
      ]),
      tgoProjectNumber: z.string().optional(),
      baselineEmissions: z.number(),
      projectEmissions: z.number(),
      emissionReductions: z.number(),
    })
    .nullable()
    .optional(),
  targetBank: z
    .enum(['ghbank', 'krungsri', 'sme_dbank', 'exim', 'other'])
    .default('ghbank'),
});

export const maxDuration = 30;

/**
 * POST /api/bank/document - Generate green loan document
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
    const result = generateDocumentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { analysis, edgeCalc, treesCert, tverProject, targetBank } =
      result.data;

    // Convert date strings to Date objects
    const boqAnalysis: BOQCarbonAnalysis = {
      ...analysis,
      calculatedAt:
        typeof analysis.calculatedAt === 'string'
          ? new Date(analysis.calculatedAt)
          : analysis.calculatedAt,
    } as BOQCarbonAnalysis;

    // Generate the green loan document
    const document = generateGreenLoanDocument(
      boqAnalysis,
      edgeCalc as EdgeCalculation | null,
      treesCert
        ? ({
            ...treesCert,
            assessmentDate:
              typeof treesCert.assessmentDate === 'string'
                ? new Date(treesCert.assessmentDate)
                : treesCert.assessmentDate,
          } as TREESCertification)
        : null,
      tverProject as TVERProject | null,
      targetBank as ThaiBank
    );

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error('[Bank Document API] Generation error:', error);
    return NextResponse.json(
      {
        error: 'Document generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
