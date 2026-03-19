/**
 * Thai Materials API Endpoint
 *
 * GET /api/carbon/materials - List Thai construction materials
 *
 * Query params:
 * - category: Filter by material category
 * - search: Search by name (Thai or English)
 * - limit: Number of results (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  TGO_MATERIALS,
  searchTGOMaterials,
  getTGOMaterialsByCategory,
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

// Default and maximum limits
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

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
    const search = searchParams.get('search');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // 4. Validate and parse pagination
    let limit = DEFAULT_LIMIT;
    let offset = 0;

    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json(
          { error: 'Invalid limit parameter' },
          { status: 400 }
        );
      }
      limit = Math.min(parsedLimit, MAX_LIMIT);
    }

    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json(
          { error: 'Invalid offset parameter' },
          { status: 400 }
        );
      }
      offset = parsedOffset;
    }

    // 5. Validate category if provided
    if (category && !VALID_CATEGORIES.includes(category as MaterialCategory)) {
      return NextResponse.json(
        {
          error: 'Invalid category',
          validCategories: VALID_CATEGORIES,
        },
        { status: 400 }
      );
    }

    // 6. Get materials based on filters
    // TGO_MATERIALS is an array of materials from emission-factors.ts
    let materials = [...TGO_MATERIALS];

    // Apply category filter
    if (category) {
      materials = getTGOMaterialsByCategory(category as MaterialCategory);
    }

    // Apply search filter
    if (search && search.trim()) {
      // If category was applied, search within that subset
      if (category) {
        const lowerSearch = search.toLowerCase();
        materials = materials.filter(
          (m) =>
            m.name.toLowerCase().includes(lowerSearch) ||
            m.nameTh.includes(search) ||
            (m.description && m.description.toLowerCase().includes(lowerSearch))
        );
      } else {
        materials = searchTGOMaterials(search);
      }
    }

    // 7. Apply pagination
    const total = materials.length;
    const paginatedMaterials = materials.slice(offset, offset + limit);

    return NextResponse.json({
      materials: paginatedMaterials,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[Materials API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch materials',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
