/**
 * TREES Certification Report API Route
 *
 * POST /api/certification/trees/report - Generate TREES certification report
 *
 * Generates a markdown report from TREES certification assessment data.
 *
 * Security: Authentication, CSRF validation, and rate limiting required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { standardRateLimiter, validateCSRFToken } from '@/lib/security';
import {
  generateTREESReport,
  TREES_LEVELS,
  type TREESCertification,
  type TREESLevel,
} from '@/lib/carbon';
import { z } from 'zod';

// Validation schema for TREES credits
const treesCreditsSchema = z.object({
  mr4RecycledMaterial: z.number().min(0).max(3),
  mr5LocalMaterial: z.number().min(0).max(3),
  mr4Percentage: z.number().optional(),
  mr5Percentage: z.number().optional(),
});

// Validation schema for EA credits
const eaCreditsSchema = z.object({
  ea1EnergyEfficiency: z.number().min(0).max(15),
}).optional();

// Request body schema for TREES certification data
const treesCertificationSchema = z.object({
  projectId: z.string(),
  assessmentDate: z.string().or(z.date()),
  targetLevel: z.enum(['certified', 'silver', 'gold', 'platinum']),
  totalPoints: z.number().min(0).max(85),
  categoryScores: z.record(z.string(), z.number()),
  mrCredits: treesCreditsSchema,
  eaCredits: eaCreditsSchema,
  recommendations: z.array(z.string()),
  pointsToNextLevel: z.number().optional(),
  certificationStatus: z.enum(['eligible', 'not_eligible']),
  // Optional: credits detail
  credits: z.array(z.object({
    category: z.string(),
    code: z.string(),
    maxPoints: z.number(),
    achievedPoints: z.number(),
    autoCalculated: z.boolean(),
  })).optional(),
});

// Request body schema
const treesReportRequestSchema = z.object({
  certification: treesCertificationSchema,
  // Optional formatting options
  options: z.object({
    includeRecommendations: z.boolean().optional(),
    language: z.enum(['en', 'th', 'bilingual']).optional(),
    format: z.enum(['markdown', 'text']).optional(),
  }).optional(),
});

/**
 * POST /api/certification/trees/report - Generate TREES report
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

    // 2. Rate limiting - report generation is lighter than assessment
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
    const validation = treesReportRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { certification: certData, options = {} } = validation.data;

    // 5. Convert to TREESCertification type
    // Note: options reserved for future formatting customization (language, format)
    const _format = options?.format ?? 'markdown';
    const certification: TREESCertification = {
      ...certData,
      assessmentDate: new Date(certData.assessmentDate),
      targetLevel: certData.targetLevel as TREESLevel,
    };

    // 6. Generate report
    const report = generateTREESReport(certification);

    // 7. Get level info for additional metadata
    const levelInfo = TREES_LEVELS[certification.targetLevel];

    // 8. Return result
    return NextResponse.json({
      success: true,
      data: {
        report,
        format: _format,
        metadata: {
          projectId: certification.projectId,
          targetLevel: certification.targetLevel,
          targetLevelDescription: levelInfo.description,
          targetLevelDescriptionTh: levelInfo.descriptionTh,
          totalPoints: certification.totalPoints,
          certificationStatus: certification.certificationStatus,
          generatedAt: new Date().toISOString(),
          generatedBy: user.id,
        },
      },
    });
  } catch (error) {
    console.error('[TREES Report API] Error:', error);
    return NextResponse.json(
      {
        error: 'TREES report generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
