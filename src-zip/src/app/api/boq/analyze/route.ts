/**
 * BOQ Analysis API Endpoint
 *
 * POST /api/boq/analyze - Analyze uploaded BOQ document
 *
 * Security: Authentication, CSRF validation, and rate limiting required
 * This is an expensive AI operation - properly protected against abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractBOQFromImage, mapToMaterials, calculateSummary } from '@/lib/boq';
import { BOQAnalysisResult, BOQItem } from '@/lib/boq/types';
import { getUser } from '@/lib/supabase/server';
import { expensiveRateLimiter, validateCSRFToken } from '@/lib/security';

export const maxDuration = 60; // Allow up to 60 seconds for AI processing

// Maximum total size for all page images (10MB)
const MAX_TOTAL_IMAGE_SIZE = 10 * 1024 * 1024;
// Maximum single image size (2MB)
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
// Maximum number of pages
const MAX_PAGES = 50;

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

    // 2. Rate limiting - this is an expensive AI operation
    const rateLimitError = await expensiveRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // 3. CSRF token validation
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pageImages = formData.getAll('pageImages') as string[];

    if (!file && pageImages.length === 0) {
      return NextResponse.json(
        { error: 'No file or page images provided' },
        { status: 400 }
      );
    }

    // 4. Input validation - prevent abuse with large uploads
    if (pageImages.length > MAX_PAGES) {
      return NextResponse.json(
        { error: `Too many pages. Maximum allowed: ${MAX_PAGES}` },
        { status: 400 }
      );
    }

    // Validate total size and individual image sizes
    let totalSize = 0;
    for (const image of pageImages) {
      // Base64 string size is roughly 4/3 of the actual data size
      const estimatedSize = (image.length * 3) / 4;
      if (estimatedSize > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: 'Individual page image exceeds 2MB limit' },
          { status: 400 }
        );
      }
      totalSize += estimatedSize;
    }

    if (totalSize > MAX_TOTAL_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Total image size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const analysisId = `boq-${Date.now()}-${user.id.slice(0, 8)}`;
    const filename = file?.name || 'uploaded-document';
    const allItems: BOQItem[] = [];
    let metadata = {};

    // Process each page image
    for (let i = 0; i < pageImages.length; i++) {
      const pageImage = pageImages[i];

      // Remove data URL prefix if present
      const base64Data = pageImage.replace(/^data:image\/\w+;base64,/, '');

      const extraction = await extractBOQFromImage({
        imageBase64: base64Data,
        pageNumber: i + 1,
        filename,
      });

      if (extraction.success && extraction.items.length > 0) {
        // Map to materials and add IDs
        const mappedItems = mapToMaterials(extraction.items);
        const itemsWithIds = mappedItems.map((item, idx) => ({
          ...item,
          id: `${analysisId}-p${i + 1}-${idx}`,
        }));
        allItems.push(...itemsWithIds);

        // Merge metadata from first page with data
        if (Object.keys(extraction.metadata).length > 0) {
          metadata = { ...metadata, ...extraction.metadata };
        }
      }
    }

    // Calculate summary
    const summaryData = calculateSummary(allItems);

    const result: BOQAnalysisResult = {
      id: analysisId,
      filename,
      uploadedAt: new Date().toISOString(),
      status: 'completed',
      items: allItems,
      summary: {
        totalItems: summaryData.totalItems,
        matchedItems: summaryData.matchedItems,
        unmatchedItems: summaryData.unmatchedItems,
        totalCarbon: summaryData.totalCarbon,
        categories: summaryData.categories,
      },
      metadata: {
        ...metadata,
        pageCount: pageImages.length,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[BOQ API] Analysis error:', error);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
