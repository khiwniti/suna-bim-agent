/**
 * Bank Requirements Analysis API Endpoint
 *
 * POST /api/bank/analyze - Analyze project against bank requirements
 *
 * Returns gap analysis with recommendations for green loan eligibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { standardRateLimiter, validateCSRFToken } from '@/lib/security';
import { z } from 'zod';
import { analyzeBankRequirements, type ThaiBank } from '@/lib/carbon';

// Validation schema for request body
const analyzeRequirementsSchema = z.object({
  targetBank: z.enum(['ghbank', 'krungsri', 'sme_dbank', 'exim', 'other']),
  carbonReduction: z.number().min(0).max(100),
  certifications: z.array(z.string()),
});

/**
 * POST /api/bank/analyze - Analyze bank requirements and identify gaps
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
    const rateLimitError = await standardRateLimiter.check(request);
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
    const result = analyzeRequirementsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { targetBank, carbonReduction, certifications } = result.data;

    // Analyze requirements
    const analysis = analyzeBankRequirements(
      targetBank as ThaiBank,
      carbonReduction,
      certifications
    );

    return NextResponse.json({
      success: true,
      targetBank,
      carbonReduction,
      certifications,
      analysis,
    });
  } catch (error) {
    console.error('[Bank Analyze API] Analysis error:', error);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
