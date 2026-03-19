/**
 * Panel Restore API Route
 *
 * GET /api/panels/[panelId]/restore
 * Restores panel state from database
 *
 * Security:
 * - Rate limiting (standard operations)
 * - Authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import type { PanelId } from '@/lib/panels/types';
import { getPanelState } from '@/lib/panels/panel-state-store';
import { standardRateLimiter } from '@/lib/security';
import { getUser } from '@/lib/supabase/server';

const VALID_PANEL_IDS: PanelId[] = [
  '3d-viewer',
  'boq-table',
  'carbon-dashboard',
  'floorplan-viewer',
  'document-editor',
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string }> }
) {
  try {
    // 1. Rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // 2. Authentication check
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

    // Fetch from in-memory store
    const entry = getPanelState(user.id, panelId);

    if (!entry) {
      return NextResponse.json({
        success: true,
        panelId,
        userId: user.id,
        state: null,
        message: 'No saved state found for this panel',
      });
    }

    return NextResponse.json({
      success: true,
      panelId,
      projectId: entry.projectId,
      userId: user.id,
      state: entry.state,
      savedAt: entry.savedAt,
      message: `Panel ${panelId} state restored successfully`,
    });
  } catch (error) {
    console.error('[Panel Restore] Error:', error);
    return NextResponse.json(
      { error: 'Failed to restore panel state' },
      { status: 500 }
    );
  }
}
