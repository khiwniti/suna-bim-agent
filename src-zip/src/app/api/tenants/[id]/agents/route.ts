/**
 * Tenant Custom Agents API Route
 *
 * Manages custom prompts and training configurations for tenant-specific agents.
 * Supports CRUD operations for both custom prompts and training configs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { standardRateLimiter, validateCSRFToken } from '@/lib/security';
import { checkTenantAccess, getTenantById } from '@/lib/tenant';
import { prisma } from '@/lib/db';
import {
  createCustomPromptSchema,
  updateCustomPromptSchema,
  createTrainingConfigSchema,
  updateTrainingConfigSchema,
} from '@/lib/agent/custom';
import {
  PromptType as PrismaPromptType,
  TrainingStatus as PrismaTrainingStatus,
  FineTuningProvider as PrismaFineTuningProvider,
  Prisma,
} from '@prisma/client';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Subscription tiers that allow custom training
const TRAINING_ALLOWED_TIERS = ['ENTERPRISE', 'UNLIMITED'];

// ============================================
// Enum Mapping Helpers
// ============================================

// Map lowercase prompt types to Prisma enum
const promptTypeToDb = (type: string): PrismaPromptType => {
  const mapping: Record<string, PrismaPromptType> = {
    system: 'SYSTEM',
    instruction: 'INSTRUCTION',
    context: 'CONTEXT',
    example: 'EXAMPLE',
  };
  return mapping[type] ?? 'INSTRUCTION';
};

// Map lowercase provider to Prisma enum
const providerToDb = (provider: string): PrismaFineTuningProvider => {
  const mapping: Record<string, PrismaFineTuningProvider> = {
    anthropic: 'ANTHROPIC',
    openai: 'OPENAI',
    custom: 'CUSTOM',
  };
  return mapping[provider] ?? 'ANTHROPIC';
};

// Map lowercase status to Prisma enum
const statusToDb = (status: string): PrismaTrainingStatus => {
  const mapping: Record<string, PrismaTrainingStatus> = {
    pending: 'PENDING',
    preparing: 'PREPARING',
    training: 'TRAINING',
    validating: 'VALIDATING',
    completed: 'COMPLETED',
    failed: 'FAILED',
    cancelled: 'CANCELLED',
  };
  return mapping[status] ?? 'PENDING';
};

// ============================================
// Request Schemas
// ============================================

// Request body schemas
const getQuerySchema = z.object({
  type: z.enum(['prompts', 'training', 'all']).optional().default('all'),
  agentType: z.string().optional(),
});

const createRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('prompt'),
    ...createCustomPromptSchema.shape,
  }),
  z.object({
    type: z.literal('training'),
    ...createTrainingConfigSchema.shape,
  }),
]);

const updateRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('prompt'),
    id: z.string(),
    ...updateCustomPromptSchema.shape,
  }),
  z.object({
    type: z.literal('training'),
    id: z.string(),
    ...updateTrainingConfigSchema.shape,
  }),
]);

const deleteRequestSchema = z.object({
  type: z.enum(['prompt', 'training']),
  id: z.string(),
});

/**
 * GET /api/tenants/[id]/agents - Get custom prompts and training configs
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    const { id: tenantId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check access
    const hasAccess = await checkTenantAccess(tenantId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryResult = getQuerySchema.safeParse(searchParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { type, agentType } = queryResult.data;

    const whereClause = {
      tenantId,
      ...(agentType ? { agentType } : {}),
    };

    const response: {
      prompts?: unknown[];
      trainingConfigs?: unknown[];
    } = {};

    // Fetch prompts if requested
    if (type === 'all' || type === 'prompts') {
      const prompts = await prisma.customPrompt.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });
      response.prompts = prompts;
    }

    // Fetch training configs if requested
    if (type === 'all' || type === 'training') {
      const trainingConfigs = await prisma.trainingConfig.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });
      response.trainingConfigs = trainingConfigs;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get custom agents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tenants/[id]/agents - Create custom prompt or training config
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // Validate CSRF token
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    const { id: tenantId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin/owner access for modifications
    const hasAccess = await checkTenantAccess(tenantId, user.id, ['OWNER', 'ADMIN']);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Admin or owner access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = createRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    if (data.type === 'prompt') {
      // Create custom prompt
      const { type: _type, promptType, ...promptData } = data;

      const prompt = await prisma.customPrompt.create({
        data: {
          agentType: promptData.agentType,
          name: promptData.name,
          content: promptData.content,
          variables: promptData.variables as Prisma.InputJsonValue | undefined,
          promptType: promptTypeToDb(promptType),
          tenantId,
          isActive: promptData.isActive ?? true,
          version: 1,
        },
      });

      return NextResponse.json({ prompt }, { status: 201 });
    } else if (data.type === 'training') {
      // Check subscription tier for training
      const tenant = await getTenantById(tenantId);
      if (!tenant || !TRAINING_ALLOWED_TIERS.includes(tenant.subscriptionTier)) {
        return NextResponse.json(
          { error: 'Custom training requires Enterprise or Unlimited subscription' },
          { status: 403 }
        );
      }

      // Create training config
      const { type: _type, provider, trainingDataset, hyperparameters, ...trainingData } = data;

      const trainingConfig = await prisma.trainingConfig.create({
        data: {
          agentType: trainingData.agentType,
          name: trainingData.name,
          description: trainingData.description,
          baseModel: trainingData.baseModel,
          provider: providerToDb(provider),
          trainingDataset: trainingDataset as Prisma.InputJsonValue | undefined,
          hyperparameters: hyperparameters as Prisma.InputJsonValue | undefined,
          tenantId,
          status: 'PENDING',
        },
      });

      return NextResponse.json({ trainingConfig }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid type specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Create custom agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tenants/[id]/agents - Update custom prompt or training config
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // Validate CSRF token
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    const { id: tenantId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin/owner access for modifications
    const hasAccess = await checkTenantAccess(tenantId, user.id, ['OWNER', 'ADMIN']);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Admin or owner access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = updateRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    if (data.type === 'prompt') {
      const { type: _type, id, promptType, variables, ...updateData } = data;

      // Check prompt exists and belongs to tenant
      const existingPrompt = await prisma.customPrompt.findUnique({
        where: { id },
      });

      if (!existingPrompt) {
        return NextResponse.json(
          { error: 'Prompt not found' },
          { status: 404 }
        );
      }

      if (existingPrompt.tenantId !== tenantId) {
        return NextResponse.json(
          { error: 'Access denied to this prompt' },
          { status: 403 }
        );
      }

      // Increment version on content change
      const versionIncrement = updateData.content ? 1 : 0;

      const prompt = await prisma.customPrompt.update({
        where: { id },
        data: {
          ...updateData,
          ...(promptType && { promptType: promptTypeToDb(promptType) }),
          ...(variables && { variables: variables as Prisma.InputJsonValue }),
          version: existingPrompt.version + versionIncrement,
        },
      });

      return NextResponse.json({ prompt });
    } else if (data.type === 'training') {
      const { type: _type, id, status, trainingDataset, hyperparameters, ...updateData } = data;

      // Check training config exists and belongs to tenant
      const existingConfig = await prisma.trainingConfig.findUnique({
        where: { id },
      });

      if (!existingConfig) {
        return NextResponse.json(
          { error: 'Training config not found' },
          { status: 404 }
        );
      }

      if (existingConfig.tenantId !== tenantId) {
        return NextResponse.json(
          { error: 'Access denied to this training config' },
          { status: 403 }
        );
      }

      const trainingConfig = await prisma.trainingConfig.update({
        where: { id },
        data: {
          ...updateData,
          ...(status && { status: statusToDb(status) }),
          ...(trainingDataset && { trainingDataset: trainingDataset as Prisma.InputJsonValue }),
          ...(hyperparameters && { hyperparameters: hyperparameters as Prisma.InputJsonValue }),
        },
      });

      return NextResponse.json({ trainingConfig });
    }

    return NextResponse.json(
      { error: 'Invalid type specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update custom agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tenants/[id]/agents - Delete custom prompt or training config
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Apply rate limiting
    const rateLimitError = await standardRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // Validate CSRF token
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    const { id: tenantId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners can delete
    const hasAccess = await checkTenantAccess(tenantId, user.id, ['OWNER']);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Owner access required to delete' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = deleteRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { type, id } = parseResult.data;

    if (type === 'prompt') {
      // Check prompt exists and belongs to tenant
      const existingPrompt = await prisma.customPrompt.findUnique({
        where: { id },
      });

      if (!existingPrompt) {
        return NextResponse.json(
          { error: 'Prompt not found' },
          { status: 404 }
        );
      }

      if (existingPrompt.tenantId !== tenantId) {
        return NextResponse.json(
          { error: 'Access denied to this prompt' },
          { status: 403 }
        );
      }

      await prisma.customPrompt.delete({ where: { id } });

      return NextResponse.json({ message: 'Prompt deleted successfully' });
    } else if (type === 'training') {
      // Check training config exists and belongs to tenant
      const existingConfig = await prisma.trainingConfig.findUnique({
        where: { id },
      });

      if (!existingConfig) {
        return NextResponse.json(
          { error: 'Training config not found' },
          { status: 404 }
        );
      }

      if (existingConfig.tenantId !== tenantId) {
        return NextResponse.json(
          { error: 'Access denied to this training config' },
          { status: 403 }
        );
      }

      // Prevent deletion of active training (use uppercase to match Prisma enum)
      if (['PREPARING', 'TRAINING', 'VALIDATING'].includes(existingConfig.status)) {
        return NextResponse.json(
          { error: 'Cannot delete active training. Please cancel first.' },
          { status: 400 }
        );
      }

      await prisma.trainingConfig.delete({ where: { id } });

      return NextResponse.json({ message: 'Training config deleted successfully' });
    }

    return NextResponse.json(
      { error: 'Invalid type specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Delete custom agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
