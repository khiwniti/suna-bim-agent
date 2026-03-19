/**
 * Input Validation Schemas
 *
 * Zod schemas for API request validation
 */

import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

export const idSchema = z.string().min(1, 'ID is required');

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(500),
  filters: z.record(z.unknown()).optional(),
});

// ============================================
// Auth Schemas
// ============================================

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
});

// ============================================
// Project Schemas
// ============================================

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(500).optional(),
  buildingType: z.enum([
    'RESIDENTIAL',
    'COMMERCIAL',
    'INDUSTRIAL',
    'HEALTHCARE',
    'EDUCATIONAL',
    'MIXED_USE',
    'OTHER',
  ]).optional(),
  totalArea: z.number().positive().optional(),
  floors: z.number().int().positive().max(200).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']);

// ============================================
// BIM Model Schemas
// ============================================

export const uploadModelSchema = z.object({
  projectId: idSchema,
  name: z.string().min(1).max(200),
  version: z.string().max(50).optional(),
  format: z.enum(['IFC', 'GLTF', 'FBX', 'OBJ', 'REVIT', 'STEP']).optional(),
});

export const modelMetadataSchema = z.object({
  author: z.string().optional(),
  description: z.string().optional(),
  software: z.string().optional(),
  exportDate: z.string().datetime().optional(),
  units: z.enum(['METERS', 'FEET', 'MILLIMETERS', 'INCHES']).optional(),
});

// ============================================
// Chat & Conversation Schemas
// ============================================

export const createConversationSchema = z.object({
  projectId: idSchema.optional(),
  title: z.string().max(200).optional(),
  context: z.record(z.unknown()).optional(),
});

export const sendMessageSchema = z.object({
  conversationId: idSchema.optional(),
  projectId: idSchema.optional(),
  message: z.string().min(1, 'Message cannot be empty').max(10000),
  context: z.object({
    selectedElements: z.array(z.string()).optional(),
    viewportState: z.record(z.unknown()).optional(),
    analysisContext: z.record(z.unknown()).optional(),
  }).optional(),
});

// ============================================
// Analysis Schemas
// ============================================

export const analysisTypeSchema = z.enum([
  'SUSTAINABILITY',
  'ENERGY',
  'CIRCULATION',
  'SPACE_EFFICIENCY',
  'EGRESS',
  'ACCESSIBILITY',
  'COST_ESTIMATION',
  'STRUCTURAL',
  'MEP',
  'DAYLIGHT',
]);

export const createAnalysisSchema = z.object({
  type: analysisTypeSchema,
  projectId: idSchema.optional(),
  modelId: idSchema.optional(),
  params: z.object({
    // Sustainability params
    targetCertification: z.enum(['LEED', 'BREEAM', 'WELL', 'PASSIVHAUS']).optional(),
    climateZone: z.string().optional(),

    // Energy params
    occupancySchedule: z.string().optional(),
    hvacSystem: z.string().optional(),

    // Circulation params
    targetOccupancy: z.number().positive().optional(),

    // Space efficiency params
    programRequirements: z.record(z.number()).optional(),

    // Generic params
    selectedElements: z.array(z.string()).optional(),
    selectedFloors: z.array(z.number()).optional(),
  }).optional(),
});

// ============================================
// File Upload Schemas
// ============================================

export const allowedMimeTypes = [
  'application/x-step',
  'application/ifc',
  'model/gltf+json',
  'model/gltf-binary',
  'application/octet-stream', // For .ifc, .fbx, etc.
  'image/png',
  'image/jpeg',
  'application/pdf',
] as const;

export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string(),
  size: z.number().positive().max(500 * 1024 * 1024), // Max 500MB
});

// ============================================
// Element Selection Schemas
// ============================================

export const elementSelectionSchema = z.object({
  elementIds: z.array(z.string()),
  selectionType: z.enum(['single', 'multiple', 'area', 'type']).optional(),
});

export const elementQuerySchema = z.object({
  modelId: idSchema,
  elementType: z.string().optional(),
  floor: z.number().optional(),
  properties: z.record(z.unknown()).optional(),
  limit: z.number().max(1000).optional(),
});

// ============================================
// Validation Helper
// ============================================

import { ValidationError } from './errors';

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    throw new ValidationError('Validation failed', errors);
  }

  return result.data;
}

export function validatePartial<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  data: unknown
): Partial<z.infer<z.ZodObject<T>>> {
  // Create a partial version of the schema
  const partialSchema = schema.partial();
  return validateRequest(partialSchema, data);
}

// ============================================
// Query Parameter Parser
// ============================================

export function parseQueryParams(
  searchParams: URLSearchParams
): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    if (params[key]) {
      // If key already exists, convert to array
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value);
      } else {
        params[key] = [params[key] as string, value];
      }
    } else {
      params[key] = value;
    }
  });

  return params;
}
