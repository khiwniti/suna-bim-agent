/**
 * Floor Plan Processing API
 *
 * POST /api/floor-plan/analyze
 * Processes a floor plan image and returns 3D model data
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { FloorPlanPipeline } from '@/lib/pipeline';
import type { PipelineResult } from '@/lib/pipeline';
import { getUser } from '@/lib/supabase/server';
import { expensiveRateLimiter, validateCSRFToken } from '@/lib/security';

export const maxDuration = 60; // Allow up to 60 seconds for vision processing
export const dynamic = 'force-dynamic';

interface AnalyzeRequest {
  image: string; // Base64 encoded image
  imageUrl?: string; // Alternative: URL to image
  options?: {
    wallHeight?: number;
    estimatedScale?: number;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Apply rate limiting (floor plan processing is expensive)
    const rateLimitError = await expensiveRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // Validate CSRF token
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: AnalyzeRequest = await request.json();

    // Validate input
    if (!body.image && !body.imageUrl) {
      return NextResponse.json(
        { error: 'Either image (base64) or imageUrl must be provided' },
        { status: 400 }
      );
    }

    // Check for API key (support multiple configurations)
    const hasApiKey = process.env.OPENAI_API_KEY ||
                      process.env.ANTHROPIC_API_KEY ||
                      process.env.ANTHROPIC_AUTH_TOKEN ||
                      process.env.ANTHROPIC_BASE_URL; // Custom endpoint may not require key

    if (!hasApiKey) {
      return NextResponse.json(
        { error: 'No AI API configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or ANTHROPIC_BASE_URL.' },
        { status: 500 }
      );
    }

    // Create pipeline with options
    const pipeline = new FloorPlanPipeline({
      wallHeight: body.options?.wallHeight,
      estimatedScale: body.options?.estimatedScale,
    });

    // Process the floor plan
    const result = await pipeline.process({
      base64: body.image,
      url: body.imageUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          ...result,
          error: result.error || 'Processing failed'
        } as PipelineResult & { error: string },
        { status: 500 }
      );
    }

    return NextResponse.json(result as PipelineResult);
  } catch (error) {
    console.error('[Floor Plan API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

// GET endpoint for checking status (optional, for future SSE/WebSocket support)
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ready',
    capabilities: {
      visionModels: ['gpt-4o', 'claude-3-opus'],
      supportedFormats: ['png', 'jpg', 'jpeg', 'webp'],
      maxImageSize: '20MB',
      features: [
        'wall_detection',
        'opening_detection',
        'room_classification',
        '3d_generation',
      ],
    },
  });
}
