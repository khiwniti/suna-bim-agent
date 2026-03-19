/**
 * BIM Models API Route
 *
 * CRUD operations for BIM models
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getUser } from '@/lib/supabase/server';
import { standardRateLimiter, validateCSRFToken } from '@/lib/security';
import { z } from 'zod';

const createModelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  projectId: z.string(),
  version: z.string().default('1.0'),
  format: z.enum(['IFC', 'GLTF', 'FBX', 'OBJ', 'REVIT', 'STEP']).default('IFC'),
  fileUrl: z.string().url(),
  fileSize: z.number().positive(),
  thumbnailUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * GET /api/models - List all models for current user
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from('bim_models')
      .select('*, projects!inner(user_id)')
      .eq('projects.user_id', user.id)
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: models, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Get models error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/models - Create new model
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
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
    const result = createModelSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Verify user owns the project
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', result.data.projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { data: model, error } = await supabase
      .from('bim_models')
      .insert({
        name: result.data.name,
        project_id: result.data.projectId,
        version: result.data.version,
        format: result.data.format,
        file_url: result.data.fileUrl,
        file_size: result.data.fileSize,
        thumbnail_url: result.data.thumbnailUrl,
        metadata: result.data.metadata,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ model }, { status: 201 });
  } catch (error) {
    console.error('Create model error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
