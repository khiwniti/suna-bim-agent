/**
 * SSO Authentication Module
 *
 * Main entry point for enterprise SSO functionality.
 * Supports SAML 2.0 and OIDC providers (Azure AD, Okta, Google Workspace).
 */

import { prisma } from '@/lib/db';
import { SsoProvider } from '@prisma/client';
import {
  generateSamlAuthUrl,
  validateSamlResponse,
  parseRelayState,
  isRelayStateValid,
  samlConfigSchema,
  type SamlConfig,
} from './saml';
import {
  generateOidcAuthUrl,
  exchangeOidcCode,
  fetchOidcUserInfo,
  decodeOidcState,
  encodeOidcState,
  isStateValid,
  generateNonce,
  generateCodeVerifier,
  generateCodeChallenge,
  oidcConfigSchema,
  extractUserFromIdToken,
  decodeIdToken,
  type OidcConfig,
  type OidcUser,
  type OidcStateData,
} from './oidc';

// Re-export all types and functions
export * from './saml';
export * from './oidc';

// ============================================
// Types
// ============================================

export interface TenantSsoConfig {
  provider: SsoProvider;
  config: SamlConfig | OidcConfig;
  enabled: boolean;
}

export interface SsoLoginResult {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  tenantId: string;
  provider: SsoProvider;
  providerUserId: string;
  avatarUrl?: string;
}

export interface SsoCallbackParams {
  // SAML callback params
  SAMLResponse?: string;
  RelayState?: string;
  // OIDC callback params
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

// ============================================
// Tenant SSO Configuration
// ============================================

/**
 * Get SSO configuration for a tenant
 *
 * @param tenantId - Tenant ID
 * @returns SSO configuration if enabled, null otherwise
 */
export async function getTenantSsoConfig(
  tenantId: string
): Promise<TenantSsoConfig | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      ssoEnabled: true,
      ssoProvider: true,
      ssoConfig: true,
    },
  });

  if (!tenant?.ssoEnabled || !tenant.ssoProvider || !tenant.ssoConfig) {
    return null;
  }

  return {
    provider: tenant.ssoProvider,
    config: tenant.ssoConfig as SamlConfig | OidcConfig,
    enabled: tenant.ssoEnabled,
  };
}

/**
 * Get SSO configuration for a tenant by slug or domain
 */
export async function getTenantSsoConfigByIdentifier(
  identifier: string
): Promise<(TenantSsoConfig & { tenantId: string }) | null> {
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { slug: identifier },
        { domain: identifier },
      ],
      ssoEnabled: true,
    },
    select: {
      id: true,
      ssoEnabled: true,
      ssoProvider: true,
      ssoConfig: true,
    },
  });

  if (!tenant?.ssoEnabled || !tenant.ssoProvider || !tenant.ssoConfig) {
    return null;
  }

  return {
    tenantId: tenant.id,
    provider: tenant.ssoProvider,
    config: tenant.ssoConfig as SamlConfig | OidcConfig,
    enabled: tenant.ssoEnabled,
  };
}

/**
 * Update SSO configuration for a tenant
 */
export async function updateTenantSsoConfig(
  tenantId: string,
  provider: SsoProvider,
  config: SamlConfig | OidcConfig,
  enabled: boolean = true
): Promise<void> {
  // Validate config based on provider
  if (provider === 'SAML') {
    samlConfigSchema.parse(config);
  } else {
    oidcConfigSchema.parse(config);
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ssoEnabled: enabled,
      ssoProvider: provider,
      ssoConfig: config,
    },
  });
}

/**
 * Disable SSO for a tenant
 */
export async function disableTenantSso(tenantId: string): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ssoEnabled: false,
    },
  });
}

// ============================================
// SSO Login Flow
// ============================================

/**
 * Initiate SSO login for a tenant
 *
 * @param tenantId - Tenant ID
 * @param options - Additional options for the SSO flow
 * @returns Redirect URL for SSO authentication
 */
export async function initiateSsoLogin(
  tenantId: string,
  options: {
    redirectTo?: string;
    prompt?: 'none' | 'login' | 'consent' | 'select_account';
    loginHint?: string;
  } = {}
): Promise<{ url: string; stateData?: OidcStateData }> {
  const ssoConfig = await getTenantSsoConfig(tenantId);

  if (!ssoConfig) {
    throw new Error('SSO not configured for this tenant');
  }

  const { provider, config } = ssoConfig;

  switch (provider) {
    case 'SAML': {
      const samlConfig = config as SamlConfig;
      const url = await generateSamlAuthUrl(samlConfig, tenantId);
      return { url };
    }

    case 'OIDC':
    case 'OKTA':
    case 'AZURE_AD':
    case 'GOOGLE_WORKSPACE': {
      const oidcConfig = config as OidcConfig;
      const nonce = generateNonce();
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Note: codeVerifier is NOT included in state sent to IdP
      // It is stored in a secure httpOnly cookie separately
      const stateData: OidcStateData = {
        tenantId,
        nonce,
        timestamp: Date.now(),
        redirectTo: options.redirectTo,
      };

      const state = encodeOidcState(stateData);

      const url = generateOidcAuthUrl(oidcConfig, state, nonce, {
        codeChallenge,
        prompt: options.prompt,
        loginHint: options.loginHint,
      });

      // Return stateData with codeVerifier for secure cookie storage
      // codeVerifier must be stored separately, not sent to IdP
      return { url, stateData: { ...stateData, codeVerifier } };
    }

    default:
      throw new Error(`Unsupported SSO provider: ${provider}`);
  }
}

// ============================================
// SSO Callback Handling
// ============================================

/**
 * Handle SSO callback and extract user information
 *
 * @param provider - SSO provider type
 * @param params - Callback parameters (SAMLResponse/RelayState or code/state)
 * @param config - SSO configuration
 * @param storedStateData - Stored state data for OIDC flows (for code verifier)
 * @returns User information from the identity provider
 */
export async function handleSsoCallback(
  provider: SsoProvider,
  params: SsoCallbackParams,
  config: SamlConfig | OidcConfig,
  storedStateData?: OidcStateData
): Promise<SsoLoginResult> {
  switch (provider) {
    case 'SAML':
      return handleSamlCallback(params, config as SamlConfig);

    case 'OIDC':
    case 'OKTA':
    case 'AZURE_AD':
    case 'GOOGLE_WORKSPACE':
      return handleOidcCallback(params, config as OidcConfig, provider, storedStateData);

    default:
      throw new Error(`Unsupported SSO provider: ${provider}`);
  }
}

/**
 * Handle SAML callback
 */
async function handleSamlCallback(
  params: SsoCallbackParams,
  config: SamlConfig
): Promise<SsoLoginResult> {
  const { SAMLResponse, RelayState } = params;

  if (!SAMLResponse) {
    throw new Error('Missing SAML response');
  }

  if (!RelayState) {
    throw new Error('Missing RelayState');
  }

  // Parse and validate RelayState
  const relayStateData = parseRelayState(RelayState);

  if (!isRelayStateValid(relayStateData)) {
    throw new Error('RelayState has expired');
  }

  // Validate SAML response
  const samlUser = await validateSamlResponse(SAMLResponse, config);

  return {
    email: samlUser.email,
    name: samlUser.firstName && samlUser.lastName
      ? `${samlUser.firstName} ${samlUser.lastName}`
      : undefined,
    firstName: samlUser.firstName,
    lastName: samlUser.lastName,
    tenantId: relayStateData.tenantId,
    provider: 'SAML',
    providerUserId: samlUser.nameId,
  };
}

/**
 * Handle OIDC callback
 */
async function handleOidcCallback(
  params: SsoCallbackParams,
  config: OidcConfig,
  provider: SsoProvider,
  storedStateData?: OidcStateData
): Promise<SsoLoginResult> {
  const { code, state, error, error_description } = params;

  // Check for error response
  if (error) {
    throw new Error(error_description || error);
  }

  if (!code || !state) {
    throw new Error('Missing authorization code or state');
  }

  // Decode and validate state
  const stateData = decodeOidcState(state);

  if (!isStateValid(stateData)) {
    throw new Error('State has expired');
  }

  // Get code verifier from stored state or decoded state
  const codeVerifier = storedStateData?.codeVerifier || stateData.codeVerifier;

  // Exchange code for tokens
  const tokens = await exchangeOidcCode(code, config, codeVerifier);

  // Get user info
  let user: OidcUser;

  if (tokens.idToken) {
    // Extract user from ID token (faster, doesn't require additional request)
    // First validate the nonce to prevent replay attacks
    const { payload: idTokenClaims } = decodeIdToken(tokens.idToken);
    const expectedNonce = storedStateData?.nonce || stateData.nonce;
    if (idTokenClaims.nonce !== expectedNonce) {
      throw new Error('ID token nonce mismatch - possible replay attack');
    }
    user = extractUserFromIdToken(tokens.idToken);
  } else if (config.userInfoUrl) {
    // Fetch user info from userinfo endpoint
    user = await fetchOidcUserInfo(tokens.accessToken, config.userInfoUrl);
  } else {
    throw new Error('Cannot get user info: no ID token and no userinfo URL configured');
  }

  return {
    email: user.email,
    name: user.name,
    firstName: user.given_name,
    lastName: user.family_name,
    tenantId: stateData.tenantId,
    provider,
    providerUserId: user.sub,
    avatarUrl: user.picture,
  };
}

// ============================================
// User Provisioning
// ============================================

/**
 * Find or create user from SSO login result
 *
 * @param result - SSO login result
 * @returns User record
 */
export async function findOrCreateSsoUser(result: SsoLoginResult) {
  // Find existing user by email
  let user = await prisma.user.findUnique({
    where: { email: result.email },
  });

  if (user) {
    // Update user info from IdP
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: result.name || user.name,
        avatarUrl: result.avatarUrl || user.avatarUrl,
        lastLoginAt: new Date(),
      },
    });
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        email: result.email,
        name: result.name,
        avatarUrl: result.avatarUrl,
        lastLoginAt: new Date(),
      },
    });
  }

  // Ensure user is a member of the tenant
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: {
        tenantId: result.tenantId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    await prisma.tenantMembership.create({
      data: {
        tenantId: result.tenantId,
        userId: user.id,
        role: 'MEMBER', // Default role for SSO-provisioned users
      },
    });
  }

  return user;
}

// ============================================
// SSO Provider Detection
// ============================================

/**
 * Detect SSO provider from email domain
 */
export async function detectSsoProviderByEmail(
  email: string
): Promise<(TenantSsoConfig & { tenantId: string }) | null> {
  const domain = email.split('@')[1];

  if (!domain) {
    return null;
  }

  // Look for tenant with matching domain
  // Use exact match to prevent substring matching attacks
  // (e.g., "evil-example.com" should not match "example.com")
  const tenant = await prisma.tenant.findFirst({
    where: {
      domain: {
        equals: domain,
      },
      ssoEnabled: true,
    },
    select: {
      id: true,
      ssoEnabled: true,
      ssoProvider: true,
      ssoConfig: true,
    },
  });

  if (!tenant?.ssoEnabled || !tenant.ssoProvider || !tenant.ssoConfig) {
    return null;
  }

  return {
    tenantId: tenant.id,
    provider: tenant.ssoProvider,
    config: tenant.ssoConfig as SamlConfig | OidcConfig,
    enabled: tenant.ssoEnabled,
  };
}

// ============================================
// SSO Session Management
// ============================================

/**
 * Store SSO state for callback validation
 * This is a helper for implementations that need server-side state storage
 */
export async function storeSsoState(
  key: string,
  data: OidcStateData,
  ttlSeconds: number = 600
): Promise<void> {
  // This is a placeholder - implementations should use Redis or similar
  // For now, state is encoded in the state parameter itself
  console.log(`[SSO] State stored: ${key}, TTL: ${ttlSeconds}s`);
}

/**
 * Retrieve SSO state for callback validation
 */
export async function retrieveSsoState(
  key: string
): Promise<OidcStateData | null> {
  // This is a placeholder - implementations should use Redis or similar
  console.log(`[SSO] State retrieved: ${key}`);
  return null;
}

/**
 * Delete SSO state after successful login
 */
export async function deleteSsoState(key: string): Promise<void> {
  // This is a placeholder - implementations should use Redis or similar
  console.log(`[SSO] State deleted: ${key}`);
}
