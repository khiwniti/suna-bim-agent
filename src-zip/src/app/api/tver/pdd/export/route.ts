/**
 * T-VER PDD Export API Endpoint
 *
 * POST /api/tver/pdd/export - Export T-VER PDD as Markdown
 *
 * Accepts a PDD document and returns markdown string
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { standardRateLimiter, validateCSRFToken } from '@/lib/security';
import { z } from 'zod';
import {
  exportPDDAsMarkdown,
  type TVERProjectDesignDocument,
} from '@/lib/carbon';

// Validation schema for monitoring parameter
const monitoringParameterSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameTh: z.string(),
  unit: z.string(),
  measurementMethod: z.string(),
  frequency: z.string(),
  responsibleParty: z.string(),
  qcProcedure: z.string(),
});

// Validation schema for PDD document
const pddSchema = z.object({
  projectTitle: z.string(),
  projectTitleTh: z.string(),
  projectDescription: z.string(),
  projectLocation: z.object({
    province: z.string(),
    district: z.string(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  }),
  projectDuration: z.object({
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    creditingPeriod: z.number(),
  }),
  projectCategory: z.enum([
    'building_energy_efficiency',
    'low_carbon_materials',
    'waste_reduction',
    'renewable_energy',
    'sustainable_construction',
  ]),
  methodology: z.enum([
    'T-VER-METH-BM-01',
    'T-VER-METH-EM-01',
    'T-VER-METH-WM-01',
    'T-VER-METH-RE-01',
  ]),
  baselineScenario: z.object({
    description: z.string(),
    baselineEmissions: z.number(),
    baselineCalculation: z.string(),
    dataSource: z.array(z.string()),
  }),
  projectScenario: z.object({
    description: z.string(),
    projectEmissions: z.number(),
    emissionReductions: z.number(),
    technologyUsed: z.array(z.string()),
  }),
  monitoringPlan: z.object({
    parameters: z.array(monitoringParameterSchema),
    frequency: z.enum(['monthly', 'quarterly', 'annually']),
    responsibleParty: z.string(),
  }),
  environmentalImpact: z.object({
    positiveImpacts: z.array(z.string()),
    potentialNegativeImpacts: z.array(z.string()),
    mitigationMeasures: z.array(z.string()),
  }),
  attachments: z.object({
    boqCarbonAnalysis: z.any().optional(),
    edgeCalculation: z.any().optional(),
    supportingDocuments: z.array(z.string()),
  }),
});

const exportPDDRequestSchema = z.object({
  pdd: pddSchema,
});

/**
 * POST /api/tver/pdd/export - Export PDD as Markdown
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
    const result = exportPDDRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { pdd } = result.data;

    // Convert date strings to Date objects
    const pddWithDates: TVERProjectDesignDocument = {
      ...pdd,
      projectDuration: {
        ...pdd.projectDuration,
        startDate:
          typeof pdd.projectDuration.startDate === 'string'
            ? new Date(pdd.projectDuration.startDate)
            : pdd.projectDuration.startDate,
        endDate:
          typeof pdd.projectDuration.endDate === 'string'
            ? new Date(pdd.projectDuration.endDate)
            : pdd.projectDuration.endDate,
      },
    } as TVERProjectDesignDocument;

    // Export as Markdown
    const markdown = exportPDDAsMarkdown(pddWithDates);

    return NextResponse.json({
      success: true,
      markdown,
      filename: `T-VER_PDD_${pdd.projectTitle.replace(/\s+/g, '_')}.md`,
    });
  } catch (error) {
    console.error('[T-VER PDD Export API] Export error:', error);
    return NextResponse.json(
      {
        error: 'PDD export failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
