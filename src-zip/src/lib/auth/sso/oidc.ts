/**
 * OpenID Connect (OIDC) Authentication Module
 *
 * Provides OIDC/OAuth 2.0 authentication flow for enterprise SSO integration.
 * Supports standard OIDC providers like Azure AD, Okta, and Google Workspace.
 */

import { z } from 'zod';

// ============================================
// Schema Definitions
// ============================================

export const oidcConfigSchema = z.object({
  authorizationUrl: z.string().url('Authorization URL must be a valid URL'),
  tokenUrl: z.string().url('Token URL must be a valid URL'),
  userInfoUrl: z.string().url('User info URL must be a valid URL').optional(),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client secret is required'),
  redirectUri: z.string().url('Redirect URI must be a valid URL'),
  scopes: z.array(z.string()).default(['openid', 'profile', 'email']),
  // Additional provider-specific options
  audience: z.string().optional(),
  resource: z.string().optional(),
  // Discovery endpoint for auto-configuration
  discoveryUrl: z.string().url().optional(),
});

export type OidcConfig = z.infer<typeof oidcConfigSchema>;

// ============================================
// Type Definitions
// ============================================

export interface OidcUser {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  [key: string]: unknown; // Additional claims
}

export interface OidcTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

export interface OidcTokens {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType: string;
}

export interface OidcStateData {
  tenantId: string;
  nonce: string;
  timestamp: number;
  redirectTo?: string;
  codeVerifier?: string;
}

export interface OidcDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri: string;
  scopes_supported?: string[];
  response_types_supported?: string[];
  grant_types_supported?: string[];
}

// ============================================
// Provider Templates
// ============================================

export const OIDC_PROVIDER_TEMPLATES: Record<string, Partial<OidcConfig>> = {
  AZURE_AD: {
    scopes: ['openid', 'profile', 'email', 'User.Read'],
  },
  OKTA: {
    scopes: ['openid', 'profile', 'email'],
  },
  GOOGLE_WORKSPACE: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scopes: ['openid', 'profile', 'email'],
  },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a cryptographically secure random string
 */
function generateRandomString(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate PKCE code verifier
 */
export function generateCodeVerifier(): string {
  return generateRandomString(64);
}

/**
 * Generate PKCE code challenge from verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  // Base64URL encode
  const base64 = Buffer.from(digest).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generate nonce for ID token validation
 */
export function generateNonce(): string {
  return generateRandomString(16);
}

// ============================================
// State Management
// ============================================

/**
 * Encode state data for OIDC flow
 */
export function encodeOidcState(data: OidcStateData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

/**
 * Decode state data from OIDC callback
 */
export function decodeOidcState(state: string): OidcStateData {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded);

    if (!parsed.tenantId || !parsed.nonce) {
      throw new Error('Invalid state: missing required fields');
    }

    return parsed as OidcStateData;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid state')) {
      throw error;
    }
    throw new Error('Invalid state format');
  }
}

/**
 * Validate state timestamp (prevent replay attacks)
 */
export function isStateValid(
  data: OidcStateData,
  maxAgeMs: number = 10 * 60 * 1000 // 10 minutes
): boolean {
  const age = Date.now() - data.timestamp;
  return age >= 0 && age < maxAgeMs;
}

// ============================================
// OIDC Flow Functions
// ============================================

/**
 * Generate OIDC Authorization URL
 *
 * @param config - OIDC configuration
 * @param state - State parameter for CSRF protection
 * @param nonce - Nonce for ID token validation
 * @param options - Additional authorization options
 * @returns Authorization URL to redirect user
 */
export function generateOidcAuthUrl(
  config: OidcConfig,
  state: string,
  nonce?: string,
  options: {
    codeChallenge?: string;
    prompt?: 'none' | 'login' | 'consent' | 'select_account';
    loginHint?: string;
    domainHint?: string;
  } = {}
): string {
  const validatedConfig = oidcConfigSchema.parse(config);

  const url = new URL(validatedConfig.authorizationUrl);

  // Required parameters
  url.searchParams.set('client_id', validatedConfig.clientId);
  url.searchParams.set('redirect_uri', validatedConfig.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', validatedConfig.scopes.join(' '));
  url.searchParams.set('state', state);

  // Optional nonce (required for ID token validation)
  if (nonce) {
    url.searchParams.set('nonce', nonce);
  }

  // PKCE (Proof Key for Code Exchange)
  if (options.codeChallenge) {
    url.searchParams.set('code_challenge', options.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
  }

  // Provider-specific parameters
  if (validatedConfig.audience) {
    url.searchParams.set('audience', validatedConfig.audience);
  }
  if (validatedConfig.resource) {
    url.searchParams.set('resource', validatedConfig.resource);
  }

  // Additional options
  if (options.prompt) {
    url.searchParams.set('prompt', options.prompt);
  }
  if (options.loginHint) {
    url.searchParams.set('login_hint', options.loginHint);
  }
  if (options.domainHint) {
    url.searchParams.set('domain_hint', options.domainHint);
  }

  return url.toString();
}

/**
 * Exchange authorization code for tokens
 *
 * @param code - Authorization code from callback
 * @param config - OIDC configuration
 * @param codeVerifier - PKCE code verifier (if using PKCE)
 * @returns Token response with access token and optionally ID token
 */
export async function exchangeOidcCode(
  code: string,
  config: OidcConfig,
  codeVerifier?: string
): Promise<OidcTokens> {
  const validatedConfig = oidcConfigSchema.parse(config);

  const params = new URLSearchParams();
  params.set('grant_type', 'authorization_code');
  params.set('code', code);
  params.set('redirect_uri', validatedConfig.redirectUri);
  params.set('client_id', validatedConfig.clientId);
  params.set('client_secret', validatedConfig.clientSecret);

  // PKCE code verifier
  if (codeVerifier) {
    params.set('code_verifier', codeVerifier);
  }

  const response = await fetch(validatedConfig.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    let errorMessage = 'Failed to exchange authorization code';

    try {
      const errorJson = JSON.parse(error);
      errorMessage = errorJson.error_description || errorJson.error || errorMessage;
    } catch {
      // Use default error message
    }

    throw new Error(errorMessage);
  }

  const tokenResponse: OidcTokenResponse = await response.json();

  return {
    accessToken: tokenResponse.access_token,
    idToken: tokenResponse.id_token,
    refreshToken: tokenResponse.refresh_token,
    tokenType: tokenResponse.token_type,
    expiresAt: tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000)
      : undefined,
  };
}

/**
 * Refresh access token using refresh token
 *
 * @param refreshToken - Refresh token from previous token exchange
 * @param config - OIDC configuration
 * @returns New token response
 */
export async function refreshOidcTokens(
  refreshToken: string,
  config: OidcConfig
): Promise<OidcTokens> {
  const validatedConfig = oidcConfigSchema.parse(config);

  const params = new URLSearchParams();
  params.set('grant_type', 'refresh_token');
  params.set('refresh_token', refreshToken);
  params.set('client_id', validatedConfig.clientId);
  params.set('client_secret', validatedConfig.clientSecret);

  const response = await fetch(validatedConfig.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh tokens: ${error}`);
  }

  const tokenResponse: OidcTokenResponse = await response.json();

  return {
    accessToken: tokenResponse.access_token,
    idToken: tokenResponse.id_token,
    refreshToken: tokenResponse.refresh_token || refreshToken, // Keep old if not provided
    tokenType: tokenResponse.token_type,
    expiresAt: tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000)
      : undefined,
  };
}

/**
 * Fetch user info from OIDC provider
 *
 * @param accessToken - Access token from token exchange
 * @param userInfoUrl - User info endpoint URL
 * @returns User information from the identity provider
 */
export async function fetchOidcUserInfo(
  accessToken: string,
  userInfoUrl: string
): Promise<OidcUser> {
  const response = await fetch(userInfoUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch user info: ${error}`);
  }

  const userInfo = await response.json();

  // Validate required fields
  if (!userInfo.sub) {
    throw new Error('Invalid user info: missing sub claim');
  }

  if (!userInfo.email) {
    throw new Error('Invalid user info: missing email claim');
  }

  return userInfo as OidcUser;
}

// ============================================
// ID Token Handling
// ============================================

interface IdTokenHeader {
  alg: string;
  typ?: string;
  kid?: string;
}

interface IdTokenPayload {
  iss: string;
  sub: string;
  aud: string | string[];
  exp: number;
  iat: number;
  nonce?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  [key: string]: unknown;
}

/**
 * Decode ID token without validation
 * NOTE: This does not verify the signature. Use for extracting claims only.
 */
export function decodeIdToken(idToken: string): {
  header: IdTokenHeader;
  payload: IdTokenPayload;
} {
  const parts = idToken.split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid ID token format');
  }

  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));

    return { header, payload };
  } catch {
    throw new Error('Failed to decode ID token');
  }
}

/**
 * Basic ID token validation
 * NOTE: This does not verify the signature. Production should use a proper JWT library.
 */
export function validateIdTokenClaims(
  payload: IdTokenPayload,
  expectedIssuer: string,
  expectedAudience: string,
  expectedNonce?: string
): void {
  // Check issuer
  if (payload.iss !== expectedIssuer) {
    throw new Error(`Invalid issuer: expected ${expectedIssuer}, got ${payload.iss}`);
  }

  // Check audience
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(expectedAudience)) {
    throw new Error(`Invalid audience: ${expectedAudience} not in ${audiences.join(', ')}`);
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error('ID token has expired');
  }

  // Check issued at (with 5 minute clock skew tolerance)
  if (payload.iat > now + 300) {
    throw new Error('ID token issued in the future');
  }

  // Check nonce if provided
  if (expectedNonce && payload.nonce !== expectedNonce) {
    throw new Error('Invalid nonce');
  }
}

/**
 * Extract user info from ID token
 */
export function extractUserFromIdToken(idToken: string): OidcUser {
  const { payload } = decodeIdToken(idToken);

  if (!payload.email) {
    throw new Error('ID token missing email claim');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified,
    name: payload.name,
    given_name: payload.given_name,
    family_name: payload.family_name,
    picture: payload.picture,
  };
}

// ============================================
// Discovery Document
// ============================================

/**
 * Fetch OIDC discovery document
 * Used for auto-configuring providers
 */
export async function fetchOidcDiscoveryDocument(
  discoveryUrl: string
): Promise<OidcDiscoveryDocument> {
  const response = await fetch(discoveryUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch discovery document: ${response.statusText}`);
  }

  const doc = await response.json();

  // Validate required fields
  if (!doc.issuer || !doc.authorization_endpoint || !doc.token_endpoint) {
    throw new Error('Invalid discovery document: missing required fields');
  }

  return doc as OidcDiscoveryDocument;
}

/**
 * Build OIDC config from discovery document
 */
export function buildConfigFromDiscovery(
  discovery: OidcDiscoveryDocument,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): OidcConfig {
  return {
    authorizationUrl: discovery.authorization_endpoint,
    tokenUrl: discovery.token_endpoint,
    userInfoUrl: discovery.userinfo_endpoint,
    clientId,
    clientSecret,
    redirectUri,
    scopes: discovery.scopes_supported?.includes('openid')
      ? ['openid', 'profile', 'email']
      : ['openid', 'profile', 'email'],
  };
}
