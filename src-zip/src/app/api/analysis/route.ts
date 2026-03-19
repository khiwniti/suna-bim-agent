/**
 * Analysis API Route
 *
 * Trigger and retrieve BIM analysis results.
 * Uses background job pattern for async processing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getUser } from '@/lib/supabase/server';
import { expensiveRateLimiter, validateCSRFToken } from '@/lib/security';
import { createJob, updateJob } from '@/lib/jobs/job-store';
import { z } from 'zod';

const createAnalysisSchema = z.object({
  type: z.enum([
    'SUSTAINABILITY',
    'ENERGY',
    'CIRCULATION',
    'SPACE_EFFICIENCY',
    'EGRESS',
    'ACCESSIBILITY',
    'COST_ESTIMATION',
    'STRUCTURAL',
    'MEP',
    'DAYLIGHT',
  ]),
  projectId: z.string().optional(),
  modelId: z.string().optional(),
  inputParams: z.record(z.unknown()).optional(),
});

/**
 * GET /api/analysis - List analysis results
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitError = await expensiveRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const modelId = searchParams.get('modelId');
    const type = searchParams.get('type');

    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from('analysis_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    if (modelId) {
      query = query.eq('model_id', modelId);
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data: analyses, error } = await query.limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('Get analyses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analysis - Create new analysis
 *
 * Returns immediately with a job ID for async polling.
 * Poll GET /api/analysis/[jobId] for status and results.
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (analysis is expensive)
    const rateLimitError = await expensiveRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // Validate CSRF token
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createAnalysisSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Create analysis record in database
    const { data: analysis, error } = await supabase
      .from('analysis_results')
      .insert({
        type: result.data.type,
        project_id: result.data.projectId,
        model_id: result.data.modelId,
        input_params: result.data.inputParams,
        user_id: user.id,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create background job for tracking
    const job = createJob(result.data.type.toLowerCase() + '_analysis', {
      analysisId: analysis.id,
      modelId: result.data.modelId,
      projectId: result.data.projectId,
      userId: user.id,
    });

    // Start async processing (don't await - fire and forget)
    processAnalysisAsync(
      job.id,
      analysis.id,
      result.data.type,
      supabase
    ).catch((err) => {
      console.error('Background analysis failed:', err);
    });

    // Return immediately with job ID for polling
    return NextResponse.json(
      {
        success: true,
        jobId: job.id,
        analysisId: analysis.id,
        status: 'pending',
        message: 'Analysis started. Poll /api/analysis/{jobId} for status.',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Create analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process analysis asynchronously
 * Updates both job store and database with results
 */
async function processAnalysisAsync(
  jobId: string,
  analysisId: string,
  analysisType: string,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<void> {
  try {
    // Update job to running
    updateJob(jobId, { status: 'running' });

    // Update database to processing
    await supabase
      .from('analysis_results')
      .update({ status: 'PROCESSING' })
      .eq('id', analysisId);

    // Simulate analysis processing time (in production, this would be actual analysis)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate analysis results
    const simulatedResults = generateSimulatedResults(analysisType);

    // Update database with results
    const { data: completedAnalysis, error: updateError } = await supabase
      .from('analysis_results')
      .update({
        status: 'COMPLETED',
        results: simulatedResults.results,
        summary: simulatedResults.summary,
        recommendations: simulatedResults.recommendations,
        overall_score: simulatedResults.overallScore,
        metrics: simulatedResults.metrics,
        completed_at: new Date().toISOString(),
      })
      .eq('id', analysisId)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Update job to completed with results
    updateJob(jobId, {
      status: 'completed',
      result: completedAnalysis,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Analysis processing error:', errorMessage);

    // Update job to failed
    updateJob(jobId, {
      status: 'failed',
      error: errorMessage,
    });

    // Update database to failed
    await supabase
      .from('analysis_results')
      .update({ status: 'FAILED' })
      .eq('id', analysisId);
  }
}

/**
 * Generate simulated analysis results based on type
 */
function generateSimulatedResults(type: string) {
  const baseMetrics = {
    SUSTAINABILITY: {
      results: {
        eui: 125, // kWh/m²/year
        carbonFootprint: 45, // kgCO2e/m²/year
        renewableReadiness: 0.75,
        waterEfficiency: 0.82,
      },
      summary:
        'The building shows good sustainability performance with an EUI of 125 kWh/m²/year, which is 15% below the industry average.',
      recommendations: [
        'Install rooftop solar panels to reduce operational carbon by 30%',
        'Upgrade HVAC systems to high-efficiency heat pumps',
        'Implement rainwater harvesting for landscape irrigation',
      ],
      overallScore: 78,
      metrics: {
        energyScore: 75,
        carbonScore: 72,
        waterScore: 82,
        materialsScore: 68,
      },
    },
    ENERGY: {
      results: {
        annualConsumption: 450000, // kWh
        peakDemand: 180, // kW
        heatingLoad: 45, // kWh/m²
        coolingLoad: 35, // kWh/m²
      },
      summary:
        'Energy consumption is within acceptable range. Peak demand occurs during summer afternoons.',
      recommendations: [
        'Implement demand response strategies',
        'Add thermal mass to reduce peak loads',
        'Consider natural ventilation for shoulder seasons',
      ],
      overallScore: 72,
      metrics: {
        efficiencyRating: 'B+',
        comparedToBaseline: -12,
      },
    },
    CIRCULATION: {
      results: {
        corridorEfficiency: 0.85,
        averageTravelDistance: 45, // meters
        deadEndCount: 2,
        accessibilityCompliance: 0.95,
      },
      summary:
        'Circulation is efficient with good wayfinding. Minor improvements needed for emergency egress.',
      recommendations: [
        'Add signage at corridor intersections',
        'Widen corridor at Floor 2 East wing',
        'Add emergency lighting at stairwells',
      ],
      overallScore: 85,
      metrics: {
        circulationRatio: 0.22,
        wayfindingScore: 88,
      },
    },
    SPACE_EFFICIENCY: {
      results: {
        grossToNet: 0.78,
        utilizationRate: 0.72,
        unusedSpaces: 3,
        flexibilityScore: 0.65,
      },
      summary:
        'Space efficiency is above average. Some areas could be repurposed for better utilization.',
      recommendations: [
        'Convert storage room B102 to collaborative space',
        'Implement hot-desking in open office areas',
        'Add partition flexibility for meeting rooms',
      ],
      overallScore: 76,
      metrics: {
        efficiencyRating: 'A-',
        benchmarkPercentile: 72,
      },
    },
  };

  return (
    baseMetrics[type as keyof typeof baseMetrics] || {
      results: { status: 'Analysis completed' },
      summary: `${type} analysis completed successfully.`,
      recommendations: ['Review detailed results for specific recommendations'],
      overallScore: 75,
      metrics: { completed: true },
    }
  );
}
