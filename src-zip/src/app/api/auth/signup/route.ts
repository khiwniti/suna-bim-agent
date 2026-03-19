/**
 * Sign Up Route
 *
 * Handles new user registration with rate limiting protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { authRateLimiter, setCSRFTokenInResponse } from '@/lib/security';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
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
    const result = signUpSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, name } = result.data;

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      const response = NextResponse.json({
        message: 'Please check your email to confirm your account',
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        requiresConfirmation: true,
      });
      return setCSRFTokenInResponse(response);
    }

    const response = NextResponse.json({
      user: {
        id: data.user!.id,
        email: data.user!.email,
        name: data.user!.user_metadata?.name,
      },
      requiresConfirmation: false,
    });
    return setCSRFTokenInResponse(response);
  } catch (error) {
    console.error('Sign up error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
