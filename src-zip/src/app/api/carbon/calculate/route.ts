/**
 * Carbon Calculation API Endpoint
 *
 * POST /api/carbon/calculate - Calculate embodied carbon for BOQ items
 *
 * Security: Authentication, CSRF validation, and rate limiting required
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateBOQCarbon, type BOQInput, type MaterialCategory } from '@/lib/carbon';
import { getUser } from '@/lib/supabase/server';
import { standardRateLimiter, validateCSRFToken } from '@/lib/security';

// Validation schema for BOQ input items
const BOQInputSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  descriptionTh: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
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
  ] as const).optional(),
  transportDistance: z.number().positive().optional(),
  transportVehicle: z.enum(['van_4wheel', 'truck_6wheel', 'truck_10wheel', 'truck_18wheel']).optional(),
  transportLoadPercent: z.number().min(0).max(100).optional(),
});

const CalculateRequestSchema = z.object({
  projectId: z.string().min(1),
  projectName: z.string().min(1),
  grossFloorArea: z.number().positive(),
  items: z.array(BOQInputSchema).min(1).max(1000),
});

// Maximum number of items to prevent abuse
const MAX_ITEMS = 1000;

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check - require logged in user
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
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
    const validationResult = CalculateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { projectId, projectName, grossFloorArea, items } = validationResult.data;

    // 5. Additional validation
    if (items.length > MAX_ITEMS) {
      return NextResponse.json(
        { error: `Too many items. Maximum allowed: ${MAX_ITEMS}` },
        { status: 400 }
      );
    }

    // 6. Calculate carbon
    const result = calculateBOQCarbon(
      projectId,
      projectName,
      items as BOQInput[],
      grossFloorArea
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Carbon Calculate API] Error:', error);
    return NextResponse.json(
      {
        error: 'Carbon calculation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
