/**
 * SAML 2.0 Authentication Module
 *
 * Provides SAML AuthnRequest generation and response validation
 * for enterprise SSO integration.
 *
 * ⚠️ PRODUCTION WARNING ⚠️
 * This is a SIMPLIFIED implementation for development and testing purposes.
 * It uses regex-based XML parsing which is NOT suitable for production use.
 *
 * For production deployments, you MUST use a proper SAML library that provides:
 * - Full XML signature verification (XML-DSig)
 * - Protection against XML wrapping attacks
 * - Proper XML canonicalization (C14N)
 * - Certificate chain validation
 *
 * Recommended production libraries:
 * - @node-saml/node-saml (successor to passport-saml)
 * - saml2-js
 *
 * Security risks of this implementation:
 * - No cryptographic signature verification
 * - Regex-based parsing vulnerable to edge cases
 * - No protection against XML injection attacks
 */

import { z } from 'zod';

// ============================================
// Schema Definitions
// ============================================

export const samlConfigSchema = z.object({
  entryPoint: z.string().url('SAML entry point must be a valid URL'),
  issuer: z.string().min(1, 'Issuer is required'),
  cert: z.string().min(1, 'Certificate is required'),
  signatureAlgorithm: z.enum(['sha256', 'sha512']).default('sha256'),
  wantAssertionsSigned: z.boolean().default(true),
  callbackUrl: z.string().url().optional(),
  identifierFormat: z.string().optional(),
});

export type SamlConfig = z.infer<typeof samlConfigSchema>;

// ============================================
// Type Definitions
// ============================================

export interface SamlUser {
  nameId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  attributes: Record<string, string | string[]>;
  sessionIndex?: string;
}

export interface SamlAuthnRequestOptions {
  forceAuthn?: boolean;
  isPassive?: boolean;
  allowCreate?: boolean;
}

// ============================================
// Constants
// ============================================

const SAML_NAMESPACES = {
  SAMLP: 'urn:oasis:names:tc:SAML:2.0:protocol',
  SAML: 'urn:oasis:names:tc:SAML:2.0:assertion',
};

const NAME_ID_FORMATS = {
  email: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  unspecified: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
  persistent: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
  transient: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
};

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a unique SAML request ID
 */
function generateRequestId(): string {
  const uuid = crypto.randomUUID();
  return `_${uuid.replace(/-/g, '')}`;
}

/**
 * Get current timestamp in ISO 8601 format for SAML
 */
function getIssueInstant(): string {
  return new Date().toISOString();
}

/**
 * Compress and base64 encode SAML request using Node.js zlib
 */
async function deflateAndEncode(xml: string): Promise<string> {
  const { deflateRaw } = await import('zlib');
  const { promisify } = await import('util');
  const deflateAsync = promisify(deflateRaw);

  const compressed = await deflateAsync(xml);
  return compressed.toString('base64');
}

/**
 * Base64 decode a SAML response
 */
function decodeBase64(encoded: string): string {
  return Buffer.from(encoded, 'base64').toString('utf-8');
}

// ============================================
// SAML AuthnRequest Generation
// ============================================

/**
 * Build SAML AuthnRequest XML
 */
function buildAuthnRequestXml(
  config: SamlConfig,
  requestId: string,
  acsUrl: string,
  options: SamlAuthnRequestOptions = {}
): string {
  const issueInstant = getIssueInstant();
  const nameIdFormat = config.identifierFormat || NAME_ID_FORMATS.email;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest
  xmlns:samlp="${SAML_NAMESPACES.SAMLP}"
  xmlns:saml="${SAML_NAMESPACES.SAML}"
  ID="${requestId}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  Destination="${config.entryPoint}"
  AssertionConsumerServiceURL="${acsUrl}"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"`;

  if (options.forceAuthn) {
    xml += `\n  ForceAuthn="true"`;
  }
  if (options.isPassive) {
    xml += `\n  IsPassive="true"`;
  }

  xml += `>
  <saml:Issuer>${config.issuer}</saml:Issuer>
  <samlp:NameIDPolicy
    Format="${nameIdFormat}"
    AllowCreate="${options.allowCreate ?? true}"/>
</samlp:AuthnRequest>`;

  return xml;
}

/**
 * Generate SAML AuthnRequest URL for redirect binding
 *
 * @param config - SAML configuration
 * @param tenantId - Tenant ID for RelayState
 * @param acsUrl - Assertion Consumer Service URL (callback URL)
 * @param options - Additional request options
 * @returns URL to redirect user for SAML authentication
 */
export async function generateSamlAuthUrl(
  config: SamlConfig,
  tenantId: string,
  acsUrl?: string,
  options: SamlAuthnRequestOptions = {}
): Promise<string> {
  const validatedConfig = samlConfigSchema.parse(config);
  const requestId = generateRequestId();
  const callbackUrl = acsUrl || validatedConfig.callbackUrl;

  if (!callbackUrl) {
    throw new Error('ACS URL is required for SAML authentication');
  }

  const xml = buildAuthnRequestXml(validatedConfig, requestId, callbackUrl, options);
  const encodedRequest = await deflateAndEncode(xml);

  // Build RelayState with tenant info and request tracking
  const relayState = JSON.stringify({
    tenantId,
    requestId,
    timestamp: Date.now(),
  });

  // Build redirect URL
  const url = new URL(validatedConfig.entryPoint);
  url.searchParams.set('SAMLRequest', encodedRequest);
  url.searchParams.set('RelayState', Buffer.from(relayState).toString('base64'));

  return url.toString();
}

// ============================================
// SAML Response Validation
// ============================================

/**
 * Extract NameID from SAML Response XML
 */
function extractNameId(xml: string): string | null {
  // Simple regex extraction - production should use proper XML parsing
  const match = xml.match(/<(?:saml[2]?:)?NameID[^>]*>([^<]+)<\/(?:saml[2]?:)?NameID>/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract attribute value from SAML Response
 */
function extractAttribute(xml: string, attributeName: string): string | null {
  // Look for attribute with specific name
  const attributeRegex = new RegExp(
    `<(?:saml[2]?:)?Attribute[^>]*Name=["']${attributeName}["'][^>]*>\\s*` +
    `<(?:saml[2]?:)?AttributeValue[^>]*>([^<]+)</(?:saml[2]?:)?AttributeValue>`,
    'i'
  );
  const match = xml.match(attributeRegex);
  return match ? match[1].trim() : null;
}

/**
 * Extract all attributes from SAML Response
 */
function extractAllAttributes(xml: string): Record<string, string | string[]> {
  const attributes: Record<string, string | string[]> = {};

  // Match all attribute elements
  const attributeRegex = /<(?:saml[2]?:)?Attribute[^>]*Name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:saml[2]?:)?Attribute>/gi;

  let attributeMatch;
  while ((attributeMatch = attributeRegex.exec(xml)) !== null) {
    const name = attributeMatch[1];
    const valueBlock = attributeMatch[2];

    // Extract all values for this attribute
    const valueRegex = /<(?:saml[2]?:)?AttributeValue[^>]*>([^<]+)<\/(?:saml[2]?:)?AttributeValue>/gi;
    const values: string[] = [];

    let valueMatch;
    while ((valueMatch = valueRegex.exec(valueBlock)) !== null) {
      values.push(valueMatch[1].trim());
    }

    // Store as single value or array
    attributes[name] = values.length === 1 ? values[0] : values;
  }

  return attributes;
}

/**
 * Extract session index from SAML Response
 */
function extractSessionIndex(xml: string): string | null {
  const match = xml.match(/SessionIndex=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/**
 * Validate SAML response status
 */
function validateStatus(xml: string): { success: boolean; error?: string } {
  // Check for success status
  const statusMatch = xml.match(/<(?:samlp:)?StatusCode[^>]*Value=["']([^"']+)["']/i);

  if (!statusMatch) {
    return { success: false, error: 'No status code found in response' };
  }

  const statusCode = statusMatch[1];
  const isSuccess = statusCode.includes('Success');

  if (!isSuccess) {
    // Try to extract status message
    const messageMatch = xml.match(/<(?:samlp:)?StatusMessage[^>]*>([^<]+)<\/(?:samlp:)?StatusMessage>/i);
    const errorMessage = messageMatch ? messageMatch[1] : `SAML authentication failed: ${statusCode}`;
    return { success: false, error: errorMessage };
  }

  return { success: true };
}

/**
 * Basic signature validation check
 * NOTE: This is a placeholder - production should use proper XML signature validation
 */
function hasSignature(xml: string): boolean {
  return xml.includes('<ds:Signature') || xml.includes('<Signature');
}

/**
 * Validate SAML Response and extract user information
 *
 * @param samlResponse - Base64 encoded SAML Response
 * @param config - SAML configuration
 * @returns Parsed user information from the SAML assertion
 *
 * NOTE: This is a basic implementation for development/testing.
 * Production deployments should use a proper SAML library with
 * full XML signature verification.
 */
export async function validateSamlResponse(
  samlResponse: string,
  config: SamlConfig
): Promise<SamlUser> {
  // Validate config
  const validatedConfig = samlConfigSchema.parse(config);

  // Decode SAML response
  let xml: string;
  try {
    xml = decodeBase64(samlResponse);
  } catch {
    throw new Error('Invalid SAML response encoding');
  }

  // Validate response status
  const status = validateStatus(xml);
  if (!status.success) {
    throw new Error(status.error);
  }

  // Enforce signature requirement when configured
  if (validatedConfig.wantAssertionsSigned && !hasSignature(xml)) {
    throw new Error('SAML assertion must be signed but signature is missing');
  }

  // Extract NameID (required)
  const nameId = extractNameId(xml);
  if (!nameId) {
    throw new Error('No NameID found in SAML response');
  }

  // Extract common attributes
  const attributes = extractAllAttributes(xml);

  // Try to find email from common attribute names
  const email =
    extractAttribute(xml, 'email') ||
    extractAttribute(xml, 'mail') ||
    extractAttribute(xml, 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress') ||
    extractAttribute(xml, 'http://schemas.xmlsoap.org/claims/EmailAddress') ||
    (nameId.includes('@') ? nameId : null);

  if (!email) {
    throw new Error('No email found in SAML response');
  }

  // Extract name attributes
  const firstName =
    extractAttribute(xml, 'firstName') ||
    extractAttribute(xml, 'givenName') ||
    extractAttribute(xml, 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname') ||
    undefined;

  const lastName =
    extractAttribute(xml, 'lastName') ||
    extractAttribute(xml, 'surname') ||
    extractAttribute(xml, 'sn') ||
    extractAttribute(xml, 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname') ||
    undefined;

  const sessionIndex = extractSessionIndex(xml) ?? undefined;

  return {
    nameId,
    email,
    firstName,
    lastName,
    attributes,
    sessionIndex,
  };
}

// ============================================
// RelayState Handling
// ============================================

export interface RelayStateData {
  tenantId: string;
  requestId?: string;
  timestamp?: number;
  redirectTo?: string;
}

/**
 * Encode RelayState data
 */
export function encodeRelayState(data: RelayStateData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Parse RelayState from SAML callback
 */
export function parseRelayState(relayState: string): RelayStateData {
  try {
    const decoded = Buffer.from(relayState, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);

    if (!parsed.tenantId) {
      throw new Error('tenantId is required in RelayState');
    }

    return parsed as RelayStateData;
  } catch (error) {
    if (error instanceof Error && error.message.includes('tenantId')) {
      throw error;
    }
    throw new Error('Invalid RelayState format');
  }
}

/**
 * Validate RelayState timestamp (prevent replay attacks)
 */
export function isRelayStateValid(
  data: RelayStateData,
  maxAgeMs: number = 5 * 60 * 1000 // 5 minutes
): boolean {
  if (!data.timestamp) {
    return false;
  }

  const age = Date.now() - data.timestamp;
  return age >= 0 && age < maxAgeMs;
}

// ============================================
// Metadata Generation
// ============================================

/**
 * Generate SAML Service Provider metadata XML
 */
export function generateSpMetadata(
  entityId: string,
  acsUrl: string,
  options: {
    wantAssertionsSigned?: boolean;
    nameIdFormat?: string;
    organizationName?: string;
    organizationUrl?: string;
  } = {}
): string {
  const nameIdFormat = options.nameIdFormat || NAME_ID_FORMATS.email;

  let metadata = `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor
  xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="${entityId}">
  <md:SPSSODescriptor
    AuthnRequestsSigned="false"
    WantAssertionsSigned="${options.wantAssertionsSigned ?? true}"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>${nameIdFormat}</md:NameIDFormat>
    <md:AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${acsUrl}"
      index="0"
      isDefault="true"/>
  </md:SPSSODescriptor>`;

  if (options.organizationName || options.organizationUrl) {
    metadata += `
  <md:Organization>
    <md:OrganizationName xml:lang="en">${options.organizationName || 'BIM Agent'}</md:OrganizationName>
    <md:OrganizationDisplayName xml:lang="en">${options.organizationName || 'BIM Agent'}</md:OrganizationDisplayName>
    <md:OrganizationURL xml:lang="en">${options.organizationUrl || 'https://bim-agent.ai'}</md:OrganizationURL>
  </md:Organization>`;
  }

  metadata += `
</md:EntityDescriptor>`;

  return metadata;
}
