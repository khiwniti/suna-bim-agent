/**
 * Sign In Route
 *
 * Handles email/password sign in with rate limiting protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { authRateLimiter, setCSRFTokenInResponse } from '@/lib/security';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 requests per minute for auth endpoints)
    const rateLimitError = await authRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const body = await request.json();

    // Validate input
    const result = signInSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // Set CSRF token in response for subsequent requests
    const response = NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
      },
      session: {
        accessToken: data.session.access_token,
        expiresAt: data.session.expires_at,
      },
    });

    return setCSRFTokenInResponse(response);
  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
