/**
 * TGO CFP Emission Factors API Endpoint
 *
 * GET /api/carbon/emission-factors - List TGO CFP emission factors
 *
 * Query params:
 * - category: Filter by material category
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  TGO_CFP_EMISSION_FACTORS,
  getEmissionFactorsByCategory,
  type MaterialCategory,
} from '@/lib/carbon';
import { getUser } from '@/lib/supabase/server';
import { standardRateLimiter } from '@/lib/security';

// Valid material categories
const VALID_CATEGORIES: MaterialCategory[] = [
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
];

export async function GET(request: NextRequest) {
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

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // 4. Validate category if provided
    if (category && !VALID_CATEGORIES.includes(category as MaterialCategory)) {
      return NextResponse.json(
        {
          error: 'Invalid category',
          validCategories: VALID_CATEGORIES,
        },
        { status: 400 }
      );
    }

    // 5. Get emission factors based on filter
    let emissionFactors = TGO_CFP_EMISSION_FACTORS;

    if (category) {
      emissionFactors = getEmissionFactorsByCategory(category as MaterialCategory);
    }

    // 6. Return response with metadata
    return NextResponse.json({
      emissionFactors,
      metadata: {
        total: emissionFactors.length,
        source: 'TGO CFP Database',
        categories: VALID_CATEGORIES,
      },
    });
  } catch (error) {
    console.error('[Emission Factors API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch emission factors',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
