/**
 * Auth Session Route
 *
 * Returns current session information
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { standardRateLimiter, setCSRFTokenInResponse } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const supabase = await createServerSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!session) {
      // Set CSRF token even for unauthenticated users
      const response = NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
      return setCSRFTokenInResponse(response);
    }

    // Set CSRF token in response for authenticated users
    const response = NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name,
        avatarUrl: session.user.user_metadata?.avatar_url,
      },
      authenticated: true,
      expiresAt: session.expires_at,
    });
    return setCSRFTokenInResponse(response);
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
