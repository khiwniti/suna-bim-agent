/**
 * ISO 27001 Security Compliance Framework
 *
 * Information Security Management System (ISMS) compliance tracking
 * for BIM Agent platform
 *
 * Key Areas:
 * - Data classification and handling
 * - Access control and authentication
 * - Audit logging and monitoring
 * - Risk assessment framework
 * - Compliance documentation
 *
 * Aligned with:
 * - ISO/IEC 27001:2022 (Information Security)
 * - ISO/IEC 27002:2022 (Security Controls)
 * - Thailand PDPA (Personal Data Protection Act)
 * - Enterprise security requirements for SCG, ธอส., กรุงศรี
 */

// =============================================================================
// DATA CLASSIFICATION
// =============================================================================

/**
 * Data classification levels per ISO 27001
 */
export type DataClassification =
  | 'public'           // Publicly available information
  | 'internal'         // Internal use only
  | 'confidential'     // Restricted access, business sensitive
  | 'restricted';      // Highly restricted, critical business data

/**
 * Data classification metadata
 */
export interface ClassificationMetadata {
  level: DataClassification;
  owner: string;
  reviewDate: Date;
  retentionPeriod: number; // days
  encryptionRequired: boolean;
  accessLogRequired: boolean;
  piiContained: boolean;
  financialData: boolean;
}

/**
 * Default classification rules for BIM data types
 */
export const DATA_CLASSIFICATION_RULES: Record<string, ClassificationMetadata> = {
  // IFC/BIM Model Data
  'ifc_model': {
    level: 'confidential',
    owner: 'project_owner',
    reviewDate: new Date(),
    retentionPeriod: 365 * 7, // 7 years
    encryptionRequired: true,
    accessLogRequired: true,
    piiContained: false,
    financialData: false,
  },
  // BOQ Data with pricing
  'boq_data': {
    level: 'confidential',
    owner: 'project_owner',
    reviewDate: new Date(),
    retentionPeriod: 365 * 7,
    encryptionRequired: true,
    accessLogRequired: true,
    piiContained: false,
    financialData: true,
  },
  // Carbon Analysis Reports
  'carbon_report': {
    level: 'internal',
    owner: 'project_owner',
    reviewDate: new Date(),
    retentionPeriod: 365 * 10, // 10 years for environmental compliance
    encryptionRequired: false,
    accessLogRequired: true,
    piiContained: false,
    financialData: false,
  },
  // User Account Data
  'user_data': {
    level: 'restricted',
    owner: 'platform_admin',
    reviewDate: new Date(),
    retentionPeriod: 365 * 5, // PDPA requirement
    encryptionRequired: true,
    accessLogRequired: true,
    piiContained: true,
    financialData: false,
  },
  // Certification Documents
  'certification_docs': {
    level: 'confidential',
    owner: 'project_owner',
    reviewDate: new Date(),
    retentionPeriod: 365 * 10,
    encryptionRequired: true,
    accessLogRequired: true,
    piiContained: false,
    financialData: false,
  },
  // Green Loan Applications
  'loan_application': {
    level: 'restricted',
    owner: 'project_owner',
    reviewDate: new Date(),
    retentionPeriod: 365 * 10,
    encryptionRequired: true,
    accessLogRequired: true,
    piiContained: true,
    financialData: true,
  },
  // Chat/AI Conversation Logs
  'chat_logs': {
    level: 'internal',
    owner: 'project_owner',
    reviewDate: new Date(),
    retentionPeriod: 365 * 2,
    encryptionRequired: false,
    accessLogRequired: true,
    piiContained: false,
    financialData: false,
  },
  // System Logs
  'system_logs': {
    level: 'internal',
    owner: 'platform_admin',
    reviewDate: new Date(),
    retentionPeriod: 365 * 2,
    encryptionRequired: false,
    accessLogRequired: false,
    piiContained: false,
    financialData: false,
  },
};

// =============================================================================
// ISO 27001 CONTROL DOMAINS
// =============================================================================

/**
 * ISO 27001:2022 Control Categories (Annex A)
 */
export const ISO27001_CONTROL_DOMAINS = {
  // A.5 - Organizational controls
  A5: {
    name: 'Organizational Controls',
    nameTh: 'การควบคุมด้านองค์กร',
    controls: {
      'A.5.1': 'Policies for information security',
      'A.5.2': 'Information security roles and responsibilities',
      'A.5.3': 'Segregation of duties',
      'A.5.4': 'Management responsibilities',
      'A.5.5': 'Contact with authorities',
      'A.5.6': 'Contact with special interest groups',
      'A.5.7': 'Threat intelligence',
      'A.5.8': 'Information security in project management',
      'A.5.9': 'Inventory of information and assets',
      'A.5.10': 'Acceptable use of information and assets',
      'A.5.11': 'Return of assets',
      'A.5.12': 'Classification of information',
      'A.5.13': 'Labelling of information',
      'A.5.14': 'Information transfer',
      'A.5.15': 'Access control',
      'A.5.16': 'Identity management',
      'A.5.17': 'Authentication information',
      'A.5.18': 'Access rights',
      'A.5.19': 'Information security in supplier relationships',
      'A.5.20': 'Addressing information security within supplier agreements',
      'A.5.21': 'Managing information security in the ICT supply chain',
      'A.5.22': 'Monitoring, review and change management of supplier services',
      'A.5.23': 'Information security for use of cloud services',
      'A.5.24': 'Information security incident management planning and preparation',
      'A.5.25': 'Assessment and decision on information security events',
      'A.5.26': 'Response to information security incidents',
      'A.5.27': 'Learning from information security incidents',
      'A.5.28': 'Collection of evidence',
      'A.5.29': 'Information security during disruption',
      'A.5.30': 'ICT readiness for business continuity',
      'A.5.31': 'Legal, statutory, regulatory and contractual requirements',
      'A.5.32': 'Intellectual property rights',
      'A.5.33': 'Protection of records',
      'A.5.34': 'Privacy and protection of PII',
      'A.5.35': 'Independent review of information security',
      'A.5.36': 'Compliance with policies, rules and standards',
      'A.5.37': 'Documented operating procedures',
    },
  },
  // A.6 - People controls
  A6: {
    name: 'People Controls',
    nameTh: 'การควบคุมด้านบุคลากร',
    controls: {
      'A.6.1': 'Screening',
      'A.6.2': 'Terms and conditions of employment',
      'A.6.3': 'Information security awareness, education and training',
      'A.6.4': 'Disciplinary process',
      'A.6.5': 'Responsibilities after termination or change of employment',
      'A.6.6': 'Confidentiality or non-disclosure agreements',
      'A.6.7': 'Remote working',
      'A.6.8': 'Information security event reporting',
    },
  },
  // A.7 - Physical controls
  A7: {
    name: 'Physical Controls',
    nameTh: 'การควบคุมด้านกายภาพ',
    controls: {
      'A.7.1': 'Physical security perimeters',
      'A.7.2': 'Physical entry',
      'A.7.3': 'Securing offices, rooms and facilities',
      'A.7.4': 'Physical security monitoring',
      'A.7.5': 'Protecting against physical and environmental threats',
      'A.7.6': 'Working in secure areas',
      'A.7.7': 'Clear desk and clear screen',
      'A.7.8': 'Equipment siting and protection',
      'A.7.9': 'Security of assets off-premises',
      'A.7.10': 'Storage media',
      'A.7.11': 'Supporting utilities',
      'A.7.12': 'Cabling security',
      'A.7.13': 'Equipment maintenance',
      'A.7.14': 'Secure disposal or re-use of equipment',
    },
  },
  // A.8 - Technological controls
  A8: {
    name: 'Technological Controls',
    nameTh: 'การควบคุมด้านเทคโนโลยี',
    controls: {
      'A.8.1': 'User endpoint devices',
      'A.8.2': 'Privileged access rights',
      'A.8.3': 'Information access restriction',
      'A.8.4': 'Access to source code',
      'A.8.5': 'Secure authentication',
      'A.8.6': 'Capacity management',
      'A.8.7': 'Protection against malware',
      'A.8.8': 'Management of technical vulnerabilities',
      'A.8.9': 'Configuration management',
      'A.8.10': 'Information deletion',
      'A.8.11': 'Data masking',
      'A.8.12': 'Data leakage prevention',
      'A.8.13': 'Information backup',
      'A.8.14': 'Redundancy of information processing facilities',
      'A.8.15': 'Logging',
      'A.8.16': 'Monitoring activities',
      'A.8.17': 'Clock synchronization',
      'A.8.18': 'Use of privileged utility programs',
      'A.8.19': 'Installation of software on operational systems',
      'A.8.20': 'Networks security',
      'A.8.21': 'Security of network services',
      'A.8.22': 'Segregation of networks',
      'A.8.23': 'Web filtering',
      'A.8.24': 'Use of cryptography',
      'A.8.25': 'Secure development life cycle',
      'A.8.26': 'Application security requirements',
      'A.8.27': 'Secure system architecture and engineering principles',
      'A.8.28': 'Secure coding',
      'A.8.29': 'Security testing in development and acceptance',
      'A.8.30': 'Outsourced development',
      'A.8.31': 'Separation of development, test and production environments',
      'A.8.32': 'Change management',
      'A.8.33': 'Test information',
      'A.8.34': 'Protection of information systems during audit testing',
    },
  },
};

// =============================================================================
// COMPLIANCE STATUS TRACKING
// =============================================================================

/**
 * Compliance status for each control
 */
export type ComplianceStatus =
  | 'compliant'        // Fully implemented and verified
  | 'partial'          // Partially implemented
  | 'non_compliant'    // Not implemented
  | 'not_applicable'   // Control not applicable to organization
  | 'planned';         // Planned for implementation

/**
 * Control implementation record
 */
export interface ControlImplementation {
  controlId: string;
  status: ComplianceStatus;
  implementationDetails: string;
  evidenceLocation: string;
  responsiblePerson: string;
  lastReviewDate: Date;
  nextReviewDate: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
}

/**
 * BIM Agent platform compliance mapping
 */
export const BIM_AGENT_COMPLIANCE_MAP: Record<string, ControlImplementation> = {
  // A.5.12 - Classification of information
  'A.5.12': {
    controlId: 'A.5.12',
    status: 'compliant',
    implementationDetails: 'Data classification system implemented with 4 levels: public, internal, confidential, restricted',
    evidenceLocation: '/src/lib/security/iso27001-compliance.ts',
    responsiblePerson: 'Platform Administrator',
    lastReviewDate: new Date(),
    nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    riskLevel: 'high',
    notes: 'Applied to all data types: IFC models, BOQ, reports, user data',
  },
  // A.5.15 - Access control
  'A.5.15': {
    controlId: 'A.5.15',
    status: 'compliant',
    implementationDetails: 'Role-based access control (RBAC) implemented via Clerk authentication',
    evidenceLocation: '/src/middleware.ts, /src/lib/auth/',
    responsiblePerson: 'Security Team',
    lastReviewDate: new Date(),
    nextReviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    riskLevel: 'critical',
    notes: 'Integrated with Clerk for SSO and session management',
  },
  // A.5.17 - Authentication information
  'A.5.17': {
    controlId: 'A.5.17',
    status: 'compliant',
    implementationDetails: 'Secure authentication via Clerk with MFA support',
    evidenceLocation: '/src/middleware.ts',
    responsiblePerson: 'Security Team',
    lastReviewDate: new Date(),
    nextReviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    riskLevel: 'critical',
    notes: 'Password policies enforced by Clerk, MFA available',
  },
  // A.5.23 - Cloud services
  'A.5.23': {
    controlId: 'A.5.23',
    status: 'compliant',
    implementationDetails: 'Deployed on Vercel (SOC 2 Type II) and Cloudflare (ISO 27001 certified)',
    evidenceLocation: 'Infrastructure documentation',
    responsiblePerson: 'Platform Administrator',
    lastReviewDate: new Date(),
    nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    riskLevel: 'high',
    notes: 'Cloud providers have their own ISO 27001 certifications',
  },
  // A.5.34 - Privacy and PII
  'A.5.34': {
    controlId: 'A.5.34',
    status: 'compliant',
    implementationDetails: 'PDPA compliance implemented with consent management and data subject rights',
    evidenceLocation: '/src/lib/security/, Privacy Policy',
    responsiblePerson: 'Data Protection Officer',
    lastReviewDate: new Date(),
    nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    riskLevel: 'critical',
    notes: 'Thailand PDPA aligned with GDPR principles',
  },
  // A.8.5 - Secure authentication
  'A.8.5': {
    controlId: 'A.8.5',
    status: 'compliant',
    implementationDetails: 'JWT-based authentication with secure session management',
    evidenceLocation: '/src/middleware.ts',
    responsiblePerson: 'Security Team',
    lastReviewDate: new Date(),
    nextReviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    riskLevel: 'critical',
    notes: 'Short-lived tokens, secure cookie settings',
  },
  // A.8.15 - Logging
  'A.8.15': {
    controlId: 'A.8.15',
    status: 'compliant',
    implementationDetails: 'Comprehensive audit logging for all security-relevant events',
    evidenceLocation: '/src/lib/security/audit-logger.ts',
    responsiblePerson: 'Security Team',
    lastReviewDate: new Date(),
    nextReviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    riskLevel: 'high',
    notes: 'Logs stored securely with tamper detection',
  },
  // A.8.24 - Use of cryptography
  'A.8.24': {
    controlId: 'A.8.24',
    status: 'compliant',
    implementationDetails: 'TLS 1.3 for data in transit, AES-256 for data at rest',
    evidenceLocation: 'Infrastructure configuration',
    responsiblePerson: 'Security Team',
    lastReviewDate: new Date(),
    nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    riskLevel: 'critical',
    notes: 'Encryption enforced at all layers',
  },
  // A.8.25 - Secure development life cycle
  'A.8.25': {
    controlId: 'A.8.25',
    status: 'compliant',
    implementationDetails: 'Secure SDLC with code review, security testing, and CI/CD security checks',
    evidenceLocation: 'CLAUDE.md, .github/workflows/',
    responsiblePerson: 'Development Team',
    lastReviewDate: new Date(),
    nextReviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    riskLevel: 'high',
    notes: 'Automated security scanning in CI pipeline',
  },
  // A.8.28 - Secure coding
  'A.8.28': {
    controlId: 'A.8.28',
    status: 'compliant',
    implementationDetails: 'Secure coding guidelines with input validation, output encoding, parameterized queries',
    evidenceLocation: '/src/lib/security/validation.ts',
    responsiblePerson: 'Development Team',
    lastReviewDate: new Date(),
    nextReviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    riskLevel: 'high',
    notes: 'TypeScript for type safety, Zod for runtime validation',
  },
};

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Security event types for audit logging
 */
export type SecurityEventType =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'data_deletion'
  | 'file_upload'
  | 'file_download'
  | 'api_access'
  | 'configuration_change'
  | 'permission_change'
  | 'user_management'
  | 'security_alert'
  | 'system_event';

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: SecurityEventType;
  action: string;
  userId: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  resourceType: string;
  resourceId: string;
  outcome: 'success' | 'failure' | 'partial';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  sessionId?: string;
  correlationId?: string;
}

/**
 * Create audit log entry
 */
export function createAuditLogEntry(
  params: Omit<AuditLogEntry, 'id' | 'timestamp'>
): AuditLogEntry {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    timestamp: new Date(),
    ...params,
  };
}

/**
 * Security event definitions with risk levels
 */
export const SECURITY_EVENTS: Record<string, {
  eventType: SecurityEventType;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  retentionDays: number;
}> = {
  // Authentication events
  'LOGIN_SUCCESS': {
    eventType: 'authentication',
    riskLevel: 'low',
    description: 'User successfully logged in',
    retentionDays: 90,
  },
  'LOGIN_FAILURE': {
    eventType: 'authentication',
    riskLevel: 'medium',
    description: 'Failed login attempt',
    retentionDays: 365,
  },
  'LOGIN_BRUTE_FORCE': {
    eventType: 'security_alert',
    riskLevel: 'critical',
    description: 'Multiple failed login attempts detected',
    retentionDays: 730,
  },
  'LOGOUT': {
    eventType: 'authentication',
    riskLevel: 'low',
    description: 'User logged out',
    retentionDays: 90,
  },
  'SESSION_EXPIRED': {
    eventType: 'authentication',
    riskLevel: 'low',
    description: 'User session expired',
    retentionDays: 90,
  },
  'MFA_ENABLED': {
    eventType: 'user_management',
    riskLevel: 'low',
    description: 'User enabled multi-factor authentication',
    retentionDays: 365,
  },
  'MFA_DISABLED': {
    eventType: 'security_alert',
    riskLevel: 'high',
    description: 'User disabled multi-factor authentication',
    retentionDays: 365,
  },

  // Authorization events
  'ACCESS_GRANTED': {
    eventType: 'authorization',
    riskLevel: 'low',
    description: 'Access granted to resource',
    retentionDays: 90,
  },
  'ACCESS_DENIED': {
    eventType: 'authorization',
    riskLevel: 'medium',
    description: 'Access denied to resource',
    retentionDays: 365,
  },
  'PERMISSION_ESCALATION': {
    eventType: 'security_alert',
    riskLevel: 'critical',
    description: 'Attempted permission escalation detected',
    retentionDays: 730,
  },

  // Data events
  'DATA_VIEWED': {
    eventType: 'data_access',
    riskLevel: 'low',
    description: 'Data viewed by user',
    retentionDays: 90,
  },
  'DATA_EXPORTED': {
    eventType: 'data_access',
    riskLevel: 'medium',
    description: 'Data exported by user',
    retentionDays: 365,
  },
  'DATA_MODIFIED': {
    eventType: 'data_modification',
    riskLevel: 'medium',
    description: 'Data modified by user',
    retentionDays: 365,
  },
  'DATA_DELETED': {
    eventType: 'data_deletion',
    riskLevel: 'high',
    description: 'Data deleted by user',
    retentionDays: 730,
  },
  'BULK_DATA_ACCESS': {
    eventType: 'data_access',
    riskLevel: 'high',
    description: 'Large volume data access detected',
    retentionDays: 365,
  },

  // File events
  'FILE_UPLOADED': {
    eventType: 'file_upload',
    riskLevel: 'medium',
    description: 'File uploaded to system',
    retentionDays: 365,
  },
  'FILE_DOWNLOADED': {
    eventType: 'file_download',
    riskLevel: 'medium',
    description: 'File downloaded from system',
    retentionDays: 365,
  },
  'MALWARE_DETECTED': {
    eventType: 'security_alert',
    riskLevel: 'critical',
    description: 'Malware detected in uploaded file',
    retentionDays: 730,
  },

  // API events
  'API_RATE_LIMITED': {
    eventType: 'api_access',
    riskLevel: 'medium',
    description: 'API rate limit exceeded',
    retentionDays: 90,
  },
  'API_INVALID_REQUEST': {
    eventType: 'api_access',
    riskLevel: 'low',
    description: 'Invalid API request received',
    retentionDays: 90,
  },
  'API_INJECTION_ATTEMPT': {
    eventType: 'security_alert',
    riskLevel: 'critical',
    description: 'SQL/XSS injection attempt detected',
    retentionDays: 730,
  },

  // Configuration events
  'CONFIG_CHANGED': {
    eventType: 'configuration_change',
    riskLevel: 'high',
    description: 'System configuration changed',
    retentionDays: 730,
  },
  'SECURITY_SETTING_CHANGED': {
    eventType: 'configuration_change',
    riskLevel: 'critical',
    description: 'Security setting modified',
    retentionDays: 730,
  },

  // User management events
  'USER_CREATED': {
    eventType: 'user_management',
    riskLevel: 'medium',
    description: 'New user account created',
    retentionDays: 730,
  },
  'USER_DELETED': {
    eventType: 'user_management',
    riskLevel: 'high',
    description: 'User account deleted',
    retentionDays: 730,
  },
  'ROLE_ASSIGNED': {
    eventType: 'permission_change',
    riskLevel: 'high',
    description: 'Role assigned to user',
    retentionDays: 730,
  },
  'ROLE_REVOKED': {
    eventType: 'permission_change',
    riskLevel: 'high',
    description: 'Role revoked from user',
    retentionDays: 730,
  },
};

// =============================================================================
// RISK ASSESSMENT
// =============================================================================

/**
 * Risk assessment matrix
 */
export interface RiskAssessment {
  riskId: string;
  title: string;
  description: string;
  category: string;
  likelihood: 1 | 2 | 3 | 4 | 5; // 1=Rare, 5=Almost Certain
  impact: 1 | 2 | 3 | 4 | 5; // 1=Insignificant, 5=Catastrophic
  riskScore: number; // likelihood * impact
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  currentControls: string[];
  mitigationActions: string[];
  residualRisk: 'low' | 'medium' | 'high';
  riskOwner: string;
  reviewDate: Date;
}

/**
 * Calculate risk level from likelihood and impact
 */
export function calculateRiskLevel(
  likelihood: number,
  impact: number
): 'low' | 'medium' | 'high' | 'critical' {
  const score = likelihood * impact;

  if (score >= 20) return 'critical';
  if (score >= 12) return 'high';
  if (score >= 6) return 'medium';
  return 'low';
}

/**
 * BIM Agent platform risk register
 */
export const PLATFORM_RISKS: RiskAssessment[] = [
  {
    riskId: 'RISK-001',
    title: 'Unauthorized access to BIM models',
    description: 'Unauthorized users may gain access to confidential IFC models containing proprietary building designs',
    category: 'Data Security',
    likelihood: 2,
    impact: 4,
    riskScore: 8,
    riskLevel: 'medium',
    currentControls: [
      'Role-based access control (RBAC)',
      'Authentication via Clerk with MFA',
      'Project-level permissions',
    ],
    mitigationActions: [
      'Regular access reviews',
      'Implement audit logging for all model access',
    ],
    residualRisk: 'low',
    riskOwner: 'Security Team',
    reviewDate: new Date(),
  },
  {
    riskId: 'RISK-002',
    title: 'Data breach of financial BOQ information',
    description: 'Financial data in BOQ could be exposed through system vulnerability or insider threat',
    category: 'Data Security',
    likelihood: 2,
    impact: 5,
    riskScore: 10,
    riskLevel: 'high',
    currentControls: [
      'Encryption at rest (AES-256)',
      'Encryption in transit (TLS 1.3)',
      'Access logging',
    ],
    mitigationActions: [
      'Data loss prevention (DLP) implementation',
      'Enhanced monitoring for bulk data access',
    ],
    residualRisk: 'medium',
    riskOwner: 'Security Team',
    reviewDate: new Date(),
  },
  {
    riskId: 'RISK-003',
    title: 'AI model data leakage',
    description: 'Sensitive project data could be leaked through AI/LLM interactions',
    category: 'AI Security',
    likelihood: 2,
    impact: 4,
    riskScore: 8,
    riskLevel: 'medium',
    currentControls: [
      'Data classification enforcement',
      'AI prompt filtering',
      'No PII in AI training data',
    ],
    mitigationActions: [
      'Implement AI guardrails',
      'Regular AI response auditing',
    ],
    residualRisk: 'low',
    riskOwner: 'AI Team',
    reviewDate: new Date(),
  },
  {
    riskId: 'RISK-004',
    title: 'Service availability disruption',
    description: 'Platform unavailability could impact customer operations and certifications',
    category: 'Business Continuity',
    likelihood: 2,
    impact: 3,
    riskScore: 6,
    riskLevel: 'medium',
    currentControls: [
      'Multi-region deployment (Vercel, Cloudflare)',
      'Database replication',
      'CDN for static assets',
    ],
    mitigationActions: [
      'Implement disaster recovery plan',
      'Regular failover testing',
    ],
    residualRisk: 'low',
    riskOwner: 'Platform Team',
    reviewDate: new Date(),
  },
  {
    riskId: 'RISK-005',
    title: 'Third-party supply chain compromise',
    description: 'Security vulnerability in third-party dependencies',
    category: 'Supply Chain',
    likelihood: 3,
    impact: 4,
    riskScore: 12,
    riskLevel: 'high',
    currentControls: [
      'Dependabot alerts',
      'Regular dependency updates',
      'SBOM generation',
    ],
    mitigationActions: [
      'Implement dependency scanning in CI/CD',
      'Vendor security assessments',
    ],
    residualRisk: 'medium',
    riskOwner: 'Development Team',
    reviewDate: new Date(),
  },
  {
    riskId: 'RISK-006',
    title: 'PDPA compliance violation',
    description: 'Non-compliance with Thailand Personal Data Protection Act',
    category: 'Regulatory Compliance',
    likelihood: 2,
    impact: 5,
    riskScore: 10,
    riskLevel: 'high',
    currentControls: [
      'Privacy policy implementation',
      'Consent management',
      'Data subject request procedures',
    ],
    mitigationActions: [
      'Regular privacy impact assessments',
      'Staff training on PDPA requirements',
    ],
    residualRisk: 'low',
    riskOwner: 'Legal/Compliance',
    reviewDate: new Date(),
  },
];

// =============================================================================
// COMPLIANCE REPORT GENERATION
// =============================================================================

/**
 * Generate ISO 27001 compliance report
 */
export function generateComplianceReport(): {
  summary: {
    totalControls: number;
    compliant: number;
    partial: number;
    nonCompliant: number;
    notApplicable: number;
    planned: number;
    compliancePercentage: number;
  };
  byDomain: Record<string, {
    name: string;
    compliant: number;
    total: number;
    percentage: number;
  }>;
  criticalFindings: string[];
  recommendations: string[];
  nextReviewDate: Date;
} {
  const controls = Object.values(BIM_AGENT_COMPLIANCE_MAP);

  const summary = {
    totalControls: controls.length,
    compliant: controls.filter(c => c.status === 'compliant').length,
    partial: controls.filter(c => c.status === 'partial').length,
    nonCompliant: controls.filter(c => c.status === 'non_compliant').length,
    notApplicable: controls.filter(c => c.status === 'not_applicable').length,
    planned: controls.filter(c => c.status === 'planned').length,
    compliancePercentage: 0,
  };

  // Calculate compliance percentage (excluding not applicable)
  const applicableControls = summary.totalControls - summary.notApplicable;
  summary.compliancePercentage = applicableControls > 0
    ? Math.round((summary.compliant / applicableControls) * 100)
    : 0;

  // Group by domain
  const byDomain: Record<string, { name: string; compliant: number; total: number; percentage: number }> = {};

  for (const control of controls) {
    const domainKey = control.controlId.split('.')[0]; // e.g., "A.5" from "A.5.12"
    const domain = domainKey.replace('.', '');

    if (!byDomain[domain]) {
      const domainData = ISO27001_CONTROL_DOMAINS[domain as keyof typeof ISO27001_CONTROL_DOMAINS];
      byDomain[domain] = {
        name: domainData?.name || 'Unknown',
        compliant: 0,
        total: 0,
        percentage: 0,
      };
    }

    byDomain[domain].total++;
    if (control.status === 'compliant') {
      byDomain[domain].compliant++;
    }
  }

  // Calculate percentages
  for (const domain of Object.values(byDomain)) {
    domain.percentage = domain.total > 0
      ? Math.round((domain.compliant / domain.total) * 100)
      : 0;
  }

  // Critical findings
  const criticalFindings = controls
    .filter(c => c.riskLevel === 'critical' && c.status !== 'compliant')
    .map(c => `${c.controlId}: ${c.notes}`);

  // Recommendations
  const recommendations: string[] = [];

  if (summary.partial > 0) {
    recommendations.push(`Complete implementation of ${summary.partial} partially implemented controls`);
  }

  if (summary.nonCompliant > 0) {
    recommendations.push(`Address ${summary.nonCompliant} non-compliant controls as priority`);
  }

  // Find oldest review dates
  const oldestReview = controls
    .filter(c => c.lastReviewDate)
    .sort((a, b) => a.lastReviewDate.getTime() - b.lastReviewDate.getTime())[0];

  if (oldestReview && Date.now() - oldestReview.lastReviewDate.getTime() > 180 * 24 * 60 * 60 * 1000) {
    recommendations.push(`Review control ${oldestReview.controlId} - last reviewed ${oldestReview.lastReviewDate.toLocaleDateString()}`);
  }

  // Next review date (90 days from now)
  const nextReviewDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  return {
    summary,
    byDomain,
    criticalFindings,
    recommendations,
    nextReviewDate,
  };
}

/**
 * Export compliance report as markdown
 */
export function exportComplianceReportMarkdown(): string {
  const report = generateComplianceReport();
  const lines: string[] = [];

  lines.push('# ISO 27001 Compliance Report');
  lines.push('# รายงานการปฏิบัติตาม ISO 27001');
  lines.push('');
  lines.push(`**Report Date / วันที่รายงาน:** ${new Date().toLocaleDateString('th-TH')}`);
  lines.push(`**Platform / แพลตฟอร์ม:** BIM Agent (bim.getintheq.space)`);
  lines.push('');

  // Executive Summary
  lines.push('## Executive Summary / บทสรุปผู้บริหาร');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Compliance Rate | ${report.summary.compliancePercentage}% |`);
  lines.push(`| Total Controls | ${report.summary.totalControls} |`);
  lines.push(`| Compliant | ${report.summary.compliant} |`);
  lines.push(`| Partial | ${report.summary.partial} |`);
  lines.push(`| Non-Compliant | ${report.summary.nonCompliant} |`);
  lines.push('');

  // Compliance by Domain
  lines.push('## Compliance by Domain / การปฏิบัติตามแต่ละหมวด');
  lines.push('');
  lines.push('| Domain | Compliant | Total | Percentage |');
  lines.push('|--------|-----------|-------|------------|');

  for (const [key, domain] of Object.entries(report.byDomain)) {
    lines.push(`| ${domain.name} (${key}) | ${domain.compliant} | ${domain.total} | ${domain.percentage}% |`);
  }
  lines.push('');

  // Critical Findings
  if (report.criticalFindings.length > 0) {
    lines.push('## Critical Findings / ข้อค้นพบวิกฤต');
    lines.push('');
    for (const finding of report.criticalFindings) {
      lines.push(`- ⚠️ ${finding}`);
    }
    lines.push('');
  }

  // Risk Summary
  lines.push('## Risk Summary / สรุปความเสี่ยง');
  lines.push('');
  lines.push('| Risk Level | Count |');
  lines.push('|------------|-------|');

  const riskCounts = PLATFORM_RISKS.reduce((acc, risk) => {
    acc[risk.riskLevel] = (acc[risk.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  lines.push(`| Critical | ${riskCounts['critical'] || 0} |`);
  lines.push(`| High | ${riskCounts['high'] || 0} |`);
  lines.push(`| Medium | ${riskCounts['medium'] || 0} |`);
  lines.push(`| Low | ${riskCounts['low'] || 0} |`);
  lines.push('');

  // Recommendations
  lines.push('## Recommendations / ข้อเสนอแนะ');
  lines.push('');
  for (const rec of report.recommendations) {
    lines.push(`- ${rec}`);
  }
  lines.push('');

  // Next Steps
  lines.push('## Next Review / การทบทวนครั้งต่อไป');
  lines.push('');
  lines.push(`Next scheduled review: **${report.nextReviewDate.toLocaleDateString('th-TH')}**`);
  lines.push('');

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*This report is generated automatically and should be reviewed by the Information Security Officer.*');
  lines.push('*รายงานนี้สร้างโดยอัตโนมัติ และควรได้รับการตรวจสอบโดยเจ้าหน้าที่รักษาความปลอดภัยข้อมูล*');

  return lines.join('\n');
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate request against security policies
 */
export function validateSecurityPolicy(
  userId: string,
  resourceType: string,
  action: 'read' | 'write' | 'delete' | 'export'
): {
  allowed: boolean;
  requiresMFA: boolean;
  requiresAuditLog: boolean;
  dataClassification: DataClassification | null;
  reason?: string;
} {
  const classification = DATA_CLASSIFICATION_RULES[resourceType];

  if (!classification) {
    return {
      allowed: false,
      requiresMFA: false,
      requiresAuditLog: true,
      dataClassification: null,
      reason: 'Unknown resource type',
    };
  }

  // Determine requirements based on classification
  const requiresMFA = classification.level === 'restricted' ||
    (classification.level === 'confidential' && action !== 'read');

  const requiresAuditLog = classification.accessLogRequired || action !== 'read';

  return {
    allowed: true, // Actual authorization would be checked elsewhere
    requiresMFA,
    requiresAuditLog,
    dataClassification: classification.level,
  };
}

/**
 * Check if data export is allowed
 */
export function canExportData(
  resourceType: string,
  userRole: string,
  _exportFormat: 'pdf' | 'xlsx' | 'json' | 'ifc'
): {
  allowed: boolean;
  restrictions: string[];
  auditRequired: boolean;
} {
  const classification = DATA_CLASSIFICATION_RULES[resourceType];
  const restrictions: string[] = [];

  if (!classification) {
    return {
      allowed: false,
      restrictions: ['Unknown resource type'],
      auditRequired: true,
    };
  }

  // Restricted data has export limitations
  if (classification.level === 'restricted') {
    if (userRole !== 'admin' && userRole !== 'project_owner') {
      return {
        allowed: false,
        restrictions: ['Only admins and project owners can export restricted data'],
        auditRequired: true,
      };
    }
    restrictions.push('Export will be logged and monitored');
  }

  // Financial data export restrictions
  if (classification.financialData) {
    restrictions.push('Financial data included - ensure authorized use');
  }

  // PII handling
  if (classification.piiContained) {
    restrictions.push('Contains PII - ensure PDPA compliance');
  }

  return {
    allowed: true,
    restrictions,
    auditRequired: classification.accessLogRequired,
  };
}
