/**
 * Custom Prompts for Tenant-Specific Agent Configuration
 *
 * Provides functionality for storing, retrieving, and managing custom prompts
 * that allow tenants to customize agent behavior for their specific needs.
 */

import { z } from 'zod';

// ============================================
// Type Definitions
// ============================================

export type PromptType = 'system' | 'instruction' | 'context' | 'example';

export type PromptVariables = Record<string, string>;

export interface CustomPrompt {
  id: string;
  tenantId: string;
  agentType: string;
  name: string;
  promptType: PromptType;
  content: string;
  variables?: PromptVariables;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Known Agent Types
// ============================================

export const KNOWN_AGENT_TYPES = [
  'supervisor',
  'architectural',
  'structural',
  'mep',
  'sustainability',
  'cost_estimator',
  'code_compliance',
  'clash_detection',
  'coordination',
  'facility_manager',
  'maintenance',
  'asset_tracker',
  'planner',
  'spatial',
  'floor_plan',
] as const;

export type KnownAgentType = (typeof KNOWN_AGENT_TYPES)[number];

// ============================================
// Validation Schemas
// ============================================

/**
 * Prompt type enum schema
 */
const PromptTypeSchema = z.enum(['system', 'instruction', 'context', 'example']);

/**
 * Variables schema - key-value pairs for template substitution
 */
const PromptVariablesSchema = z.record(z.string(), z.string());

/**
 * Full custom prompt schema for database records
 */
export const CustomPromptSchema = z.object({
  id: z.string(),
  tenantId: z.string().min(1, 'Tenant ID is required'),
  agentType: z.string().min(1, 'Agent type is required'),
  name: z.string().min(1, 'Name is required').max(100),
  promptType: PromptTypeSchema,
  content: z.string().min(1, 'Content is required'),
  variables: PromptVariablesSchema.optional(),
  isActive: z.boolean(),
  version: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for creating a new custom prompt
 */
export const createCustomPromptSchema = z.object({
  agentType: z.enum(KNOWN_AGENT_TYPES, {
    errorMap: () => ({ message: 'Invalid agent type' }),
  }),
  name: z.string().min(1, 'Name is required').max(100),
  promptType: PromptTypeSchema.default('instruction'),
  content: z.string().min(1, 'Content is required').max(50000),
  variables: PromptVariablesSchema.optional(),
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema for updating an existing custom prompt
 */
export const updateCustomPromptSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  promptType: PromptTypeSchema.optional(),
  content: z.string().min(1).max(50000).optional(),
  variables: PromptVariablesSchema.optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// Validation Functions
// ============================================

/**
 * Custom validation error for prompt operations
 */
export class CustomPromptValidationError extends Error {
  public errors: z.ZodIssue[];

  constructor(errors: z.ZodIssue[]) {
    super(`Custom prompt validation failed: ${errors.map((e) => e.message).join(', ')}`);
    this.name = 'CustomPromptValidationError';
    this.errors = errors;
  }
}

/**
 * Validate a custom prompt object
 */
export function validateCustomPrompt(data: unknown): CustomPrompt {
  const result = CustomPromptSchema.safeParse(data);

  if (!result.success) {
    throw new CustomPromptValidationError(result.error.issues);
  }

  return result.data;
}

/**
 * Parse and validate prompt creation data
 */
export function parseCreatePromptData(
  data: unknown
): z.infer<typeof createCustomPromptSchema> {
  const result = createCustomPromptSchema.safeParse(data);

  if (!result.success) {
    throw new CustomPromptValidationError(result.error.issues);
  }

  return result.data;
}

/**
 * Parse and validate prompt update data
 */
export function parseUpdatePromptData(
  data: unknown
): z.infer<typeof updateCustomPromptSchema> {
  const result = updateCustomPromptSchema.safeParse(data);

  if (!result.success) {
    throw new CustomPromptValidationError(result.error.issues);
  }

  return result.data;
}

// ============================================
// Prompt Building Functions
// ============================================

/**
 * Build agent prompt by substituting variables in the content
 *
 * @param content - The prompt content with {{variable}} placeholders
 * @param variables - Key-value pairs for variable substitution
 * @returns The processed prompt with variables substituted
 */
export function buildAgentPrompt(
  content: string,
  variables?: PromptVariables
): string {
  if (!variables || Object.keys(variables).length === 0) {
    return content;
  }

  let processedContent = content;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    processedContent = processedContent.replace(
      new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
      value
    );
  }

  return processedContent;
}

/**
 * Merge a custom prompt with a base prompt based on prompt type
 *
 * @param basePrompt - The original base prompt for the agent
 * @param customPrompt - The custom prompt configuration
 * @returns The merged prompt string
 */
export function mergePromptWithBase(
  basePrompt: string,
  customPrompt: CustomPrompt
): string {
  // First, process any variables in the custom content
  const processedContent = buildAgentPrompt(
    customPrompt.content,
    customPrompt.variables
  );

  switch (customPrompt.promptType) {
    case 'system':
      // System prompts completely replace the base
      return processedContent;

    case 'instruction':
      // Instructions are prepended before the base
      return `${processedContent}\n\n${basePrompt}`;

    case 'context':
      // Context is appended after the base
      return `${basePrompt}\n\n--- Additional Context ---\n${processedContent}`;

    case 'example':
      // Examples are appended at the end
      return `${basePrompt}\n\n--- Examples ---\n${processedContent}`;

    default:
      // Default to appending
      return `${basePrompt}\n\n${processedContent}`;
  }
}

/**
 * Apply multiple custom prompts to a base prompt
 *
 * @param basePrompt - The original base prompt
 * @param customPrompts - Array of custom prompts (sorted by priority)
 * @returns The fully merged prompt
 */
export function applyCustomPrompts(
  basePrompt: string,
  customPrompts: CustomPrompt[]
): string {
  // Filter to active prompts only
  const activePrompts = customPrompts.filter((p) => p.isActive);

  if (activePrompts.length === 0) {
    return basePrompt;
  }

  // Sort by type priority: system > instruction > context > example
  const typePriority: Record<PromptType, number> = {
    system: 0,
    instruction: 1,
    context: 2,
    example: 3,
  };

  const sortedPrompts = [...activePrompts].sort(
    (a, b) => typePriority[a.promptType] - typePriority[b.promptType]
  );

  // Apply prompts in order
  let result = basePrompt;

  for (const prompt of sortedPrompts) {
    result = mergePromptWithBase(result, prompt);
  }

  return result;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Extract variable placeholders from prompt content
 *
 * @param content - The prompt content
 * @returns Array of variable names found in the content
 */
export function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Validate that all required variables are provided
 *
 * @param content - The prompt content
 * @param variables - The provided variables
 * @returns Object with isValid flag and list of missing variables
 */
export function validateVariables(
  content: string,
  variables?: PromptVariables
): { isValid: boolean; missingVariables: string[] } {
  const required = extractVariables(content);
  const provided = variables ? Object.keys(variables) : [];

  const missing = required.filter((v) => !provided.includes(v));

  return {
    isValid: missing.length === 0,
    missingVariables: missing,
  };
}

/**
 * Create a new prompt version (for version tracking)
 *
 * @param existingPrompt - The existing prompt to version
 * @param updates - The updates to apply
 * @returns A new prompt object with incremented version
 */
export function createPromptVersion(
  existingPrompt: CustomPrompt,
  updates: Partial<CustomPrompt>
): CustomPrompt {
  return {
    ...existingPrompt,
    ...updates,
    version: existingPrompt.version + 1,
    updatedAt: new Date(),
  };
}

/**
 * Generate a default prompt for an agent type
 *
 * @param agentType - The type of agent
 * @returns Default prompt configuration
 */
export function getDefaultPromptConfig(agentType: KnownAgentType): {
  name: string;
  promptType: PromptType;
  description: string;
} {
  const defaults: Record<KnownAgentType, { name: string; promptType: PromptType; description: string }> = {
    supervisor: {
      name: 'Supervisor Agent',
      promptType: 'system',
      description: 'Main routing and coordination agent',
    },
    architectural: {
      name: 'Architectural Agent',
      promptType: 'system',
      description: 'Space planning and design analysis',
    },
    structural: {
      name: 'Structural Agent',
      promptType: 'system',
      description: 'Structural engineering analysis',
    },
    mep: {
      name: 'MEP Agent',
      promptType: 'system',
      description: 'Mechanical, electrical, plumbing systems',
    },
    sustainability: {
      name: 'Sustainability Agent',
      promptType: 'system',
      description: 'Carbon and environmental analysis',
    },
    cost_estimator: {
      name: 'Cost Estimator Agent',
      promptType: 'system',
      description: 'Quantity takeoff and cost estimation',
    },
    code_compliance: {
      name: 'Code Compliance Agent',
      promptType: 'system',
      description: 'Building code and regulation checking',
    },
    clash_detection: {
      name: 'Clash Detection Agent',
      promptType: 'system',
      description: 'Interference and coordination checking',
    },
    coordination: {
      name: 'Coordination Agent',
      promptType: 'system',
      description: 'BCF and issue management',
    },
    facility_manager: {
      name: 'Facility Manager Agent',
      promptType: 'system',
      description: 'Building operations and management',
    },
    maintenance: {
      name: 'Maintenance Agent',
      promptType: 'system',
      description: 'Equipment maintenance tracking',
    },
    asset_tracker: {
      name: 'Asset Tracker Agent',
      promptType: 'system',
      description: 'Asset inventory management',
    },
    planner: {
      name: 'Planner Agent',
      promptType: 'system',
      description: 'Multi-step task planning',
    },
    spatial: {
      name: 'Spatial Agent',
      promptType: 'system',
      description: 'Spatial query and analysis',
    },
    floor_plan: {
      name: 'Floor Plan Agent',
      promptType: 'system',
      description: 'Floor plan analysis and detection',
    },
  };

  return defaults[agentType];
}
