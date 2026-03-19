/**
 * Thai Material Detail API Endpoint
 *
 * GET /api/carbon/materials/[id] - Get a single material by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMaterial, getLowCarbonAlternatives } from '@/lib/carbon';
import { getUser } from '@/lib/supabase/server';
import { standardRateLimiter } from '@/lib/security';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // 3. Get material ID from params
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid material ID' },
        { status: 400 }
      );
    }

    // 4. Fetch material
    const material = getMaterial(id);

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // 5. Get low-carbon alternatives
    const alternatives = getLowCarbonAlternatives(id);

    return NextResponse.json({
      material,
      alternatives,
    });
  } catch (error) {
    console.error('[Material Detail API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch material',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
