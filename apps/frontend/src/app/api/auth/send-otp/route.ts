import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// In-memory rate limiter: 3 OTP requests per email per 60 seconds.
// Module-level so it persists across requests within the same serverless instance.
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60_000;
const otpRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = otpRateLimit.get(email);

  if (!entry || now >= entry.resetAt) {
    otpRateLimit.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: { message: 'Please enter a valid email address' } },
        { status: 400 },
      );
    }

    const { allowed, retryAfterSeconds } = checkRateLimit(email);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: { message: `Too many requests. Please wait ${retryAfterSeconds}s before trying again.` } },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSeconds) },
        },
      );
    }

    const supabase = await createClient();

    // Omitting emailRedirectTo causes Supabase to send a 6-digit OTP code
    // rather than a clickable magic link — this is the expired-link fallback flow.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: { message: error.message || 'Could not send verification code' } },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Internal server error' } },
      { status: 500 },
    );
  }
}
