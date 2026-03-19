import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
