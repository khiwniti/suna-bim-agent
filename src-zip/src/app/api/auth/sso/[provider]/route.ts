/**
 * SSO Provider Initiation Route
 *
 * Initiates SSO login flow for a specific provider/tenant.
 * Redirects user to the identity provider for authentication.
 *
 * GET /api/auth/sso/[provider]?tenant_id=xxx
 * GET /api/auth/sso/[provider]?tenant=slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getTenantSsoConfig,
  getTenantSsoConfigByIdentifier,
  initiateSsoLogin,
} from '@/lib/auth/sso';

interface RouteContext {
  params: Promise<{ provider: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { provider } = await context.params;
    const searchParams = request.nextUrl.searchParams;

    // Get tenant identifier from query params
    const tenantId = searchParams.get('tenant_id');
    const tenantSlug = searchParams.get('tenant');
    const redirectTo = searchParams.get('redirect_to') || '/';
    const prompt = searchParams.get('prompt') as 'none' | 'login' | 'consent' | 'select_account' | null;
    const loginHint = searchParams.get('login_hint');

    if (!tenantId && !tenantSlug) {
      return NextResponse.json(
        { error: 'tenant_id or tenant parameter is required' },
        { status: 400 }
      );
    }

    // Get SSO configuration
    let ssoConfig;
    let resolvedTenantId: string;

    if (tenantId) {
      ssoConfig = await getTenantSsoConfig(tenantId);
      resolvedTenantId = tenantId;
    } else {
      const configWithTenant = await getTenantSsoConfigByIdentifier(tenantSlug!);
      if (!configWithTenant) {
        return NextResponse.json(
          { error: 'Tenant not found or SSO not enabled' },
          { status: 404 }
        );
      }
      ssoConfig = configWithTenant;
      resolvedTenantId = configWithTenant.tenantId;
    }

    if (!ssoConfig) {
      return NextResponse.json(
        { error: 'SSO not configured for this tenant' },
        { status: 404 }
      );
    }

    // Validate provider matches tenant configuration
    const normalizedProvider = provider.toUpperCase().replace(/-/g, '_');
    if (normalizedProvider !== ssoConfig.provider && normalizedProvider !== 'SSO') {
      return NextResponse.json(
        { error: `Provider mismatch: expected ${ssoConfig.provider}, got ${provider}` },
        { status: 400 }
      );
    }

    // Initiate SSO login
    const { url, stateData } = await initiateSsoLogin(resolvedTenantId, {
      redirectTo,
      prompt: prompt || undefined,
      loginHint: loginHint || undefined,
    });

    // Store state data in cookie for OIDC flows (code verifier for PKCE)
    if (stateData) {
      const cookieStore = await cookies();
      cookieStore.set('sso_state', JSON.stringify(stateData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
        path: '/',
      });
    }

    // Redirect to identity provider
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('[SSO] Initiation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'SSO initiation failed';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST handler for initiating SSO via form submission
 */
export async function POST(
  request: NextRequest,
  _context: RouteContext
) {
  try {
    const body = await request.json();

    const tenantId = body.tenant_id;
    const tenantSlug = body.tenant;
    const redirectTo = body.redirect_to || '/';

    if (!tenantId && !tenantSlug) {
      return NextResponse.json(
        { error: 'tenant_id or tenant is required' },
        { status: 400 }
      );
    }

    // Get SSO configuration
    let resolvedTenantId: string;

    if (tenantId) {
      resolvedTenantId = tenantId;
    } else {
      const configWithTenant = await getTenantSsoConfigByIdentifier(tenantSlug!);
      if (!configWithTenant) {
        return NextResponse.json(
          { error: 'Tenant not found or SSO not enabled' },
          { status: 404 }
        );
      }
      resolvedTenantId = configWithTenant.tenantId;
    }

    // Initiate SSO login
    const { url, stateData } = await initiateSsoLogin(resolvedTenantId, {
      redirectTo,
    });

    // Store state data in cookie for OIDC flows
    if (stateData) {
      const cookieStore = await cookies();
      cookieStore.set('sso_state', JSON.stringify(stateData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600,
        path: '/',
      });
    }

    // Return redirect URL for client-side redirect
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[SSO] Initiation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'SSO initiation failed';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
