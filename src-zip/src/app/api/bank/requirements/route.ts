/**
 * Bank Requirements API Endpoint
 *
 * GET /api/bank/requirements - Get all bank-specific requirements for green loans
 *
 * Returns requirements for Thai banks:
 * - ธอส. (Government Housing Bank)
 * - กรุงศรี (Krungsri/Bank of Ayudhya)
 * - SME D-Bank
 * - EXIM Bank
 */

import { NextRequest, NextResponse } from 'next/server';
import { standardRateLimiter } from '@/lib/security';
import { BANK_REQUIREMENTS } from '@/lib/carbon';

/**
 * GET /api/bank/requirements - List all bank requirements
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    return NextResponse.json({
      success: true,
      requirements: BANK_REQUIREMENTS,
    });
  } catch (error) {
    console.error('[Bank Requirements API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch bank requirements',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
