/**
 * Edge Certification API Route
 *
 * POST /api/certification/edge - Calculate Edge certification eligibility
 *
 * Security: Authentication, CSRF validation, and rate limiting required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { expensiveRateLimiter, validateCSRFToken } from '@/lib/security';
import {
  calculateEdgeCertification,
  calculateBOQCarbon,
  type BOQInput,
  type BOQCarbonAnalysis,
} from '@/lib/carbon';
import { z } from 'zod';

// Validation schema for BOQ input items
const boqInputSchema = z.object({
  id: z.string(),
  description: z.string(),
  descriptionTh: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string(),
  materialId: z.string().optional(),
  emissionFactorId: z.string().optional(),
  category: z.enum([
    'concrete',
    'steel',
    'cement',
    'brick',
    'aggregate',
    'timber',
    'glass',
    'aluminum',
    'insulation',
    'roofing',
    'flooring',
    'MEP',
    'finishes',
    'other',
  ]).optional(),
  transportDistance: z.number().optional(),
  transportVehicle: z.enum(['van_4wheel', 'truck_6wheel', 'truck_10wheel', 'truck_18wheel']).optional(),
  transportLoadPercent: z.number().min(0).max(100).optional(),
});

// Request body schema
const edgeCertificationRequestSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  projectName: z.string().min(1, 'Project name is required'),
  grossFloorArea: z.number().positive('Gross floor area must be positive'),
  items: z.array(boqInputSchema).min(1, 'At least one BOQ item is required'),
  // Optional: pre-calculated analysis (if already computed)
  analysis: z.object({
    projectId: z.string(),
    projectName: z.string(),
    totalEmbodiedCarbon: z.number(),
    carbonPerSquareMeter: z.number(),
    grossFloorArea: z.number(),
    categoryBreakdown: z.array(z.object({
      category: z.string(),
      totalCarbon: z.number(),
      percentage: z.number(),
    })),
    scopeBreakdown: z.object({
      scope1: z.number(),
      scope2: z.number(),
      scope3: z.number(),
    }),
    hotspots: z.array(z.object({
      itemId: z.string(),
      description: z.string(),
      carbon: z.number(),
      percentage: z.number(),
    })),
    items: z.array(z.any()),
    calculatedAt: z.string().or(z.date()),
    methodology: z.enum(['edge', 'tgo_cfp', 'iso14064']),
  }).optional(),
});

export const maxDuration = 30; // Allow up to 30 seconds for calculation

/**
 * POST /api/certification/edge - Calculate Edge certification
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

    // 2. Rate limiting - this is a computationally expensive operation
    const rateLimitError = await expensiveRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // 3. CSRF token validation
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validation = edgeCertificationRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { projectId, projectName, grossFloorArea, items, analysis: precomputedAnalysis } = validation.data;

    // 5. Calculate or use provided carbon analysis
    let analysis: BOQCarbonAnalysis;

    if (precomputedAnalysis) {
      // Use pre-computed analysis
      analysis = {
        ...precomputedAnalysis,
        calculatedAt: new Date(precomputedAnalysis.calculatedAt),
      } as BOQCarbonAnalysis;
    } else {
      // Calculate BOQ carbon from items
      analysis = calculateBOQCarbon(
        projectId,
        projectName,
        items as BOQInput[],
        grossFloorArea
      );
    }

    // 6. Calculate Edge certification
    const edgeResult = calculateEdgeCertification(analysis, items as BOQInput[]);

    // 7. Return result
    return NextResponse.json({
      success: true,
      data: {
        ...edgeResult,
        calculatedAt: new Date().toISOString(),
        calculatedBy: user.id,
      },
    });
  } catch (error) {
    console.error('[Edge Certification API] Error:', error);
    return NextResponse.json(
      {
        error: 'Edge certification calculation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
