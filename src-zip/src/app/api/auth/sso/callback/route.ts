/**
 * SSO Callback Route
 *
 * Handles callbacks from identity providers after authentication.
 * Supports both SAML (POST) and OIDC (GET) callback flows.
 *
 * POST /api/auth/sso/callback - SAML Response
 * GET /api/auth/sso/callback - OIDC Authorization Code
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  handleSsoCallback,
  findOrCreateSsoUser,
  parseRelayState,
  decodeOidcState,
  getTenantSsoConfig,
  type SsoCallbackParams,
  type OidcStateData,
} from '@/lib/auth/sso';

/**
 * GET handler for OIDC callback
 *
 * Receives authorization code and state from OIDC provider
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract OIDC callback parameters
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Check for error response from IdP
    if (error) {
      console.error('[SSO] OIDC error from IdP:', error, errorDescription);
      return redirectToError(request, errorDescription || error);
    }

    if (!code || !state) {
      return redirectToError(request, 'Missing authorization code or state');
    }

    // Decode state to get tenant ID
    const stateData = decodeOidcState(state);

    // Get stored state from cookie (contains code verifier for PKCE)
    const cookieStore = await cookies();
    const storedStateCookie = cookieStore.get('sso_state');
    let storedStateData: OidcStateData | undefined;

    if (storedStateCookie) {
      try {
        storedStateData = JSON.parse(storedStateCookie.value);
      } catch {
        console.warn('[SSO] Failed to parse stored state cookie');
      }
    }

    // Get tenant SSO configuration
    const ssoConfig = await getTenantSsoConfig(stateData.tenantId);

    if (!ssoConfig) {
      return redirectToError(request, 'SSO configuration not found');
    }

    // Handle the callback
    const params: SsoCallbackParams = {
      code,
      state,
      error: error || undefined,
      error_description: errorDescription || undefined,
    };

    const ssoResult = await handleSsoCallback(
      ssoConfig.provider,
      params,
      ssoConfig.config,
      storedStateData
    );

    // Find or create user in our database
    const user = await findOrCreateSsoUser(ssoResult);

    // Create session for the user
    // Note: In production, this would integrate with Supabase Admin API
    // to create a proper authenticated session
    const sessionData = {
      userId: user.id,
      email: user.email,
      tenantId: ssoResult.tenantId,
      provider: ssoResult.provider,
      authenticatedAt: new Date().toISOString(),
    };

    // Set session cookie
    cookieStore.set('sso_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Clear the state cookie
    cookieStore.delete('sso_state');

    // Redirect to the intended destination
    const redirectTo = stateData.redirectTo || '/';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (error) {
    console.error('[SSO] OIDC callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    return redirectToError(request, errorMessage);
  }
}

/**
 * POST handler for SAML callback
 *
 * Receives SAML Response from identity provider
 */
export async function POST(request: NextRequest) {
  try {
    // SAML responses are form-encoded
    const formData = await request.formData();

    const samlResponse = formData.get('SAMLResponse') as string;
    const relayState = formData.get('RelayState') as string;

    if (!samlResponse) {
      return redirectToError(request, 'Missing SAML response');
    }

    if (!relayState) {
      return redirectToError(request, 'Missing RelayState');
    }

    // Parse RelayState to get tenant ID
    const relayStateData = parseRelayState(relayState);

    // Get tenant SSO configuration
    const ssoConfig = await getTenantSsoConfig(relayStateData.tenantId);

    if (!ssoConfig) {
      return redirectToError(request, 'SSO configuration not found');
    }

    // Handle the callback
    const params: SsoCallbackParams = {
      SAMLResponse: samlResponse,
      RelayState: relayState,
    };

    const ssoResult = await handleSsoCallback(
      ssoConfig.provider,
      params,
      ssoConfig.config
    );

    // Find or create user in our database
    const user = await findOrCreateSsoUser(ssoResult);

    // Create session
    const cookieStore = await cookies();
    const sessionData = {
      userId: user.id,
      email: user.email,
      tenantId: ssoResult.tenantId,
      provider: ssoResult.provider,
      authenticatedAt: new Date().toISOString(),
    };

    // Set session cookie
    cookieStore.set('sso_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Redirect to the intended destination
    const redirectTo = relayStateData.redirectTo || '/';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (error) {
    console.error('[SSO] SAML callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    return redirectToError(request, errorMessage);
  }
}

/**
 * Helper function to redirect to error page
 */
function redirectToError(request: NextRequest, message: string): NextResponse {
  const errorUrl = new URL('/auth/error', request.url);
  errorUrl.searchParams.set('message', message);
  errorUrl.searchParams.set('source', 'sso');
  return NextResponse.redirect(errorUrl);
}
