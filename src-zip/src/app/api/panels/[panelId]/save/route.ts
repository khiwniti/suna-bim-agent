/**
 * Panel Save API Route
 *
 * POST /api/panels/[panelId]/save
 * Saves panel state to database for persistence
 *
 * Security:
 * - Rate limiting (expensive operations)
 * - CSRF validation
 * - Authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import type { PanelId } from '@/lib/panels/types';
import { savePanelState } from '@/lib/panels/panel-state-store';
import { expensiveRateLimiter, validateCSRFToken } from '@/lib/security';
import { getUser } from '@/lib/supabase/server';

const VALID_PANEL_IDS: PanelId[] = [
  '3d-viewer',
  'boq-table',
  'carbon-dashboard',
  'floorplan-viewer',
  'document-editor',
];

interface SavePanelRequest {
  state: Record<string, unknown>;
  projectId?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string }> }
) {
  try {
    // 1. Rate limiting
    const rateLimitError = await expensiveRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // 2. CSRF validation
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    // 3. Authentication check
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { panelId } = await params;

    // Validate panel ID
    if (!VALID_PANEL_IDS.includes(panelId as PanelId)) {
      return NextResponse.json(
        { error: 'Invalid panel ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body: SavePanelRequest = await request.json();

    if (!body.state) {
      return NextResponse.json(
        { error: 'Missing state in request body' },
        { status: 400 }
      );
    }

    // Save to in-memory store
    const entry = savePanelState(user.id, panelId, body.state, body.projectId);

    return NextResponse.json({
      success: true,
      panelId,
      userId: user.id,
      savedAt: entry.savedAt,
      message: `Panel ${panelId} state saved successfully`,
    });
  } catch (error) {
    console.error('[Panel Save] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save panel state' },
      { status: 500 }
    );
  }
}
