/**
 * Carbon Data API Route
 *
 * GET /api/bim/carbon/[modelId] - Returns carbon analysis data for a BIM model
 *
 * Returns embodied carbon data including:
 * - Total carbon emissions
 * - Material breakdown
 * - Category breakdown
 *
 * Connects to Python BIM Agent backend when BIM_AGENT_SERVICE_URL is set.
 * Falls back to mock data for local development or when backend is unavailable.
 */

import { NextRequest, NextResponse } from 'next/server';
import { standardRateLimiter, validateCSRFToken } from '@/lib/security';

/** Timeout for Python backend calls (30 seconds) */
const BACKEND_TIMEOUT_MS = 30000;

interface RouteContext {
  params: Promise<{ modelId: string }>;
}

interface MaterialCarbon {
  name: string;
  carbon: number;
  percentage: number;
}

interface CategoryCarbon {
  category: string;
  carbon: number;
}

interface CarbonAnalysisResponse {
  totalCarbon: number;
  unit: string;
  materials: MaterialCarbon[];
  categories: CategoryCarbon[];
  modelId: string;
  generatedAt: string;
}

/**
 * Generate mock carbon data for development or fallback scenarios
 */
function generateMockCarbonData(modelId: string): CarbonAnalysisResponse {
  return {
    totalCarbon: 1845000,
    unit: 'kgCO2e',
    materials: [
      { name: 'Concrete', carbon: 922500, percentage: 50 },
      { name: 'Steel', carbon: 553500, percentage: 30 },
      { name: 'Glass', carbon: 184500, percentage: 10 },
      { name: 'Aluminum', carbon: 92250, percentage: 5 },
      { name: 'Other', carbon: 92250, percentage: 5 },
    ],
    categories: [
      { category: 'Structure', carbon: 1107000 },
      { category: 'Facade', carbon: 461250 },
      { category: 'MEP', carbon: 184500 },
      { category: 'Finishes', carbon: 92250 },
    ],
    modelId,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Attempt to fetch carbon analysis from Python BIM Agent backend
 * Returns null if backend is unavailable or request fails
 */
async function fetchFromBackend(
  backendUrl: string,
  modelId: string
): Promise<CarbonAnalysisResponse | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const response = await fetch(`${backendUrl}/api/v1/analyze/carbon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      return data as CarbonAnalysisResponse;
    }

    console.warn(
      `[API] Backend returned error status: ${response.status} ${response.statusText}`
    );
    return null;
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[API] Backend request timed out');
    } else {
      console.warn('[API] Backend request failed:', error);
    }
    return null;
  }
}

/**
 * GET /api/bim/carbon/[modelId]
 *
 * Returns carbon analysis data for a BIM model.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  // Rate limiting
  const rateLimitError = await standardRateLimiter.check(request);
  if (rateLimitError) {
    return rateLimitError;
  }

  // CSRF validation (skipped for GET but kept for consistency)
  await validateCSRFToken(request);

  // Get model ID from params
  const { modelId } = await context.params;

  if (!modelId) {
    return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
  }

  try {
    // Check if Python backend is configured
    const backendUrl = process.env.BIM_AGENT_SERVICE_URL;

    if (backendUrl) {
      // Try to fetch from Python BIM Agent backend
      const backendData = await fetchFromBackend(backendUrl, modelId);

      if (backendData) {
        return NextResponse.json(backendData);
      }

      // Fall through to mock data if backend failed
      console.warn('[API] Falling back to mock data due to backend failure');
    }

    // Return mock data when:
    // 1. BIM_AGENT_SERVICE_URL is not set (local development)
    // 2. Backend request failed (graceful degradation)
    const mockCarbonData = generateMockCarbonData(modelId);
    return NextResponse.json(mockCarbonData);
  } catch (error) {
    console.error('[API] Carbon data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carbon data' },
      { status: 500 }
    );
  }
}
