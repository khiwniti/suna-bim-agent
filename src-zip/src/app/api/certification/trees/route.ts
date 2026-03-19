/**
 * TREES Certification API Route
 *
 * POST /api/certification/trees - Assess TREES certification eligibility
 *
 * TREES: Thai's Rating of Energy and Environmental Sustainability
 * Thailand's green building certification standard
 *
 * Security: Authentication, CSRF validation, and rate limiting required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { expensiveRateLimiter, validateCSRFToken } from '@/lib/security';
import {
  assessTREESCertification,
  type BOQCarbonItem,
} from '@/lib/carbon';
import { z } from 'zod';

// Validation schema for BOQ carbon items
const boqCarbonItemSchema = z.object({
  id: z.string(),
  boqItemId: z.string(),
  description: z.string(),
  descriptionTh: z.string().optional(),
  quantity: z.number(),
  unit: z.string(),
  unitCost: z.number(),
  materialId: z.string().optional(),
  materialCode: z.string().optional(),
  emissionFactorId: z.string(),
  embodiedCarbon: z.number(),
  carbonIntensity: z.number(),
  scope1Emissions: z.number(),
  scope2Emissions: z.number(),
  scope3Emissions: z.number(),
  transportDistance: z.number().optional(),
  transportEmissions: z.number().optional(),
});

// Building data schema for TREES assessment
const buildingDataSchema = z.object({
  grossFloorArea: z.number().positive('Gross floor area must be positive'),
  buildingType: z.string().min(1, 'Building type is required'),
  // Energy performance (optional)
  ottv: z.number().optional(), // Overall Thermal Transfer Value (W/m²)
  rttv: z.number().optional(), // Roof Thermal Transfer Value (W/m²)
  lightingPowerDensity: z.number().optional(), // W/m²
  acEfficiency: z.number().optional(), // COP or EER
  // Sustainability features (optional)
  hasRainwaterHarvesting: z.boolean().optional(),
  hasGreenRoof: z.boolean().optional(),
  hasCommissioning: z.boolean().optional(),
  certifiedWoodPercentage: z.number().min(0).max(100).optional(),
  constructionWasteRecycled: z.number().min(0).max(100).optional(),
});

// Request body schema
const treesCertificationRequestSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  boqItems: z.array(boqCarbonItemSchema).min(1, 'At least one BOQ item is required'),
  buildingData: buildingDataSchema,
});

export const maxDuration = 30; // Allow up to 30 seconds for assessment

/**
 * POST /api/certification/trees - Assess TREES certification
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
    const validation = treesCertificationRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { projectId, boqItems, buildingData } = validation.data;

    // 5. Assess TREES certification
    const certification = assessTREESCertification(
      boqItems as BOQCarbonItem[],
      buildingData
    );

    // 6. Add project ID and metadata
    const result = {
      ...certification,
      projectId,
      assessmentDate: new Date().toISOString(),
      assessedBy: user.id,
    };

    // 7. Return result
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[TREES Certification API] Error:', error);
    return NextResponse.json(
      {
        error: 'TREES certification assessment failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
