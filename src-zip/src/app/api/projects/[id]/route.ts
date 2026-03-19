/**
 * Single Project API Route
 *
 * Get, update, delete specific project
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getUser } from '@/lib/supabase/server';
import { standardRateLimiter, validateCSRFToken } from '@/lib/security';
import { z } from 'zod';

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  location: z.string().max(200).optional(),
  buildingType: z.string().max(50).optional(),
  totalArea: z.number().positive().optional(),
  floors: z.number().int().positive().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id] - Get single project
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: project, error } = await supabase
      .from('projects')
      .select('*, bim_models(*), conversations(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id] - Update project
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = updateProjectSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        ...result.data,
        building_type: result.data.buildingType,
        total_area: result.data.totalArea,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id] - Delete project
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
