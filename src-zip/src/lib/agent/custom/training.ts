/**
 * Custom Agent Training Configuration
 *
 * Provides functionality for configuring, managing, and deploying
 * fine-tuned agent models for tenant-specific use cases.
 */

import { z } from 'zod';
import { KNOWN_AGENT_TYPES } from './prompts';

// ============================================
// Type Definitions
// ============================================

export type TrainingStatus =
  | 'pending'
  | 'preparing'
  | 'training'
  | 'validating'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type FineTuningProvider = 'anthropic' | 'openai' | 'custom';

export interface TrainingExample {
  input: string;
  output: string;
  metadata?: Record<string, unknown>;
}

export interface TrainingDataset {
  type: 'examples' | 'file' | 'conversation';
  examples?: TrainingExample[];
  fileUrl?: string;
  conversationIds?: string[];
}

export interface Hyperparameters {
  learningRate?: number;
  epochs?: number;
  batchSize?: number;
  warmupSteps?: number;
}

export interface TrainingMetrics {
  loss?: number;
  accuracy?: number;
  validationLoss?: number;
  validationAccuracy?: number;
}

export interface TrainingConfig {
  id: string;
  tenantId: string;
  agentType: string;
  name: string;
  description?: string;
  provider: FineTuningProvider;
  baseModel: string;
  trainingDataset?: TrainingDataset;
  hyperparameters?: Hyperparameters;
  status: TrainingStatus;
  modelId?: string; // Resulting fine-tuned model ID
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingJob {
  id: string;
  configId: string;
  tenantId: string;
  status: TrainingStatus;
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  modelId?: string;
  logs?: string[];
  metrics?: TrainingMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeploymentConfig {
  configId: string;
  modelId: string;
  steps: string[];
  rollbackAvailable: boolean;
  previousModelId?: string;
  estimatedDowntime?: number;
}

export interface DeploymentResult {
  canDeploy: boolean;
  errors: string[];
}

export interface TrainingProgress {
  status: TrainingStatus;
  percentage: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
  metrics?: TrainingMetrics;
  modelId?: string;
}

// ============================================
// Validation Schemas
// ============================================

const TrainingStatusSchema = z.enum([
  'pending',
  'preparing',
  'training',
  'validating',
  'completed',
  'failed',
  'cancelled',
]);

const FineTuningProviderSchema = z.enum(['anthropic', 'openai', 'custom']);

const TrainingExampleSchema = z.object({
  input: z.string().min(1),
  output: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

const TrainingDatasetSchema = z.object({
  type: z.enum(['examples', 'file', 'conversation']),
  examples: z.array(TrainingExampleSchema).optional(),
  fileUrl: z.string().url().optional(),
  conversationIds: z.array(z.string()).optional(),
});

const HyperparametersSchema = z.object({
  learningRate: z.number().positive().max(1).optional(),
  epochs: z.number().int().positive().max(100).optional(),
  batchSize: z.number().int().positive().max(64).optional(),
  warmupSteps: z.number().int().nonnegative().optional(),
});

const TrainingMetricsSchema = z.object({
  loss: z.number().optional(),
  accuracy: z.number().min(0).max(1).optional(),
  validationLoss: z.number().optional(),
  validationAccuracy: z.number().min(0).max(1).optional(),
});

/**
 * Full training config schema for database records
 */
export const TrainingConfigSchema = z.object({
  id: z.string(),
  tenantId: z.string().min(1, 'Tenant ID is required'),
  agentType: z.string().min(1, 'Agent type is required'),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  provider: FineTuningProviderSchema,
  baseModel: z.string().min(1, 'Base model is required'),
  trainingDataset: TrainingDatasetSchema.optional(),
  hyperparameters: HyperparametersSchema.optional(),
  status: TrainingStatusSchema,
  modelId: z.string().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for creating a new training config
 */
export const createTrainingConfigSchema = z.object({
  agentType: z.enum(KNOWN_AGENT_TYPES, {
    errorMap: () => ({ message: 'Invalid agent type' }),
  }),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  provider: FineTuningProviderSchema,
  baseModel: z.string().min(1, 'Base model is required'),
  trainingDataset: TrainingDatasetSchema.optional(),
  hyperparameters: HyperparametersSchema.optional(),
});

/**
 * Schema for updating a training config
 */
export const updateTrainingConfigSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  trainingDataset: TrainingDatasetSchema.optional(),
  hyperparameters: HyperparametersSchema.optional(),
  status: TrainingStatusSchema.optional(),
});

/**
 * Training job schema
 */
export const TrainingJobSchema = z.object({
  id: z.string(),
  configId: z.string(),
  tenantId: z.string().min(1),
  status: TrainingStatusSchema,
  progress: z.number().min(0).max(100),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  modelId: z.string().optional(),
  logs: z.array(z.string()).optional(),
  metrics: TrainingMetricsSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================
// Validation Functions
// ============================================

/**
 * Custom validation error for training operations
 */
export class TrainingValidationError extends Error {
  public errors: z.ZodIssue[];

  constructor(errors: z.ZodIssue[]) {
    super(`Training config validation failed: ${errors.map((e) => e.message).join(', ')}`);
    this.name = 'TrainingValidationError';
    this.errors = errors;
  }
}

/**
 * Validate a training config object
 */
export function validateTrainingConfig(data: unknown): TrainingConfig {
  const result = TrainingConfigSchema.safeParse(data);

  if (!result.success) {
    throw new TrainingValidationError(result.error.issues);
  }

  return result.data;
}

/**
 * Parse and validate training config creation data
 */
export function parseCreateTrainingData(
  data: unknown
): z.infer<typeof createTrainingConfigSchema> {
  const result = createTrainingConfigSchema.safeParse(data);

  if (!result.success) {
    throw new TrainingValidationError(result.error.issues);
  }

  return result.data;
}

/**
 * Parse and validate training config update data
 */
export function parseUpdateTrainingData(
  data: unknown
): z.infer<typeof updateTrainingConfigSchema> {
  const result = updateTrainingConfigSchema.safeParse(data);

  if (!result.success) {
    throw new TrainingValidationError(result.error.issues);
  }

  return result.data;
}

// ============================================
// Deployment Functions
// ============================================

/**
 * Create a deployment plan for a completed training
 */
export function createDeploymentPlan(config: TrainingConfig): DeploymentConfig {
  if (config.status !== 'completed') {
    throw new Error('Training must be completed before deployment');
  }

  if (!config.modelId) {
    throw new Error('No trained model available for deployment');
  }

  return {
    configId: config.id,
    modelId: config.modelId,
    steps: [
      'validate_model',
      'backup_current_config',
      'update_agent_config',
      'run_smoke_tests',
      'activate_deployment',
    ],
    rollbackAvailable: true,
    previousModelId: undefined, // Would be populated from current deployment
    estimatedDowntime: 0, // Zero-downtime deployment
  };
}

/**
 * Check if an agent can be deployed
 */
export function canDeployAgent(config: TrainingConfig): DeploymentResult {
  const errors: string[] = [];

  if (config.status === 'failed') {
    errors.push('Training failed');
  } else if (config.status !== 'completed') {
    errors.push('Training is not completed');
  }

  if (!config.modelId) {
    errors.push('No trained model available');
  }

  return {
    canDeploy: errors.length === 0,
    errors,
  };
}

// ============================================
// Progress Tracking Functions
// ============================================

/**
 * Get training progress information
 */
export function getTrainingProgress(job: TrainingJob): TrainingProgress {
  const statusSteps: Record<TrainingStatus, string> = {
    pending: 'Waiting to start',
    preparing: 'Preparing training data',
    training: 'Training model',
    validating: 'Validating results',
    completed: 'Training completed',
    failed: 'Training failed',
    cancelled: 'Training cancelled',
  };

  const progress: TrainingProgress = {
    status: job.status,
    percentage: job.progress,
    currentStep: statusSteps[job.status],
  };

  // Calculate estimated time remaining
  if (job.status === 'training' && job.startedAt) {
    const elapsed = Date.now() - job.startedAt.getTime();
    if (job.progress > 0) {
      const totalEstimated = elapsed / (job.progress / 100);
      progress.estimatedTimeRemaining = Math.max(0, totalEstimated - elapsed);
    }
  }

  if (job.metrics) {
    progress.metrics = job.metrics;
  }

  if (job.modelId) {
    progress.modelId = job.modelId;
  }

  return progress;
}

/**
 * Calculate estimated training time based on dataset and provider
 */
export function calculateEstimatedTime(
  dataset: TrainingDataset,
  provider: FineTuningProvider
): number {
  // Base time in seconds
  let baseTime = 60; // 1 minute minimum

  // Calculate based on dataset size
  if (dataset.type === 'examples' && dataset.examples) {
    const exampleCount = dataset.examples.length;
    // Roughly 2 seconds per example for small datasets
    // Scaling factor decreases for larger datasets
    baseTime += exampleCount * 2 * Math.max(0.5, 1 - exampleCount / 10000);
  }

  // Provider-specific adjustments
  const providerMultipliers: Record<FineTuningProvider, number> = {
    anthropic: 1.0,
    openai: 0.8,
    custom: 1.5,
  };

  return Math.ceil(baseTime * providerMultipliers[provider]);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get supported base models for a provider
 */
export function getSupportedModels(provider: FineTuningProvider): string[] {
  const models: Record<FineTuningProvider, string[]> = {
    anthropic: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
    openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    custom: ['custom-model-v1', 'custom-model-v2'],
  };

  return models[provider];
}

/**
 * Check if training can be started
 */
export function canStartTraining(config: TrainingConfig): {
  canStart: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!['pending', 'failed', 'cancelled'].includes(config.status)) {
    errors.push('Training can only be started from pending, failed, or cancelled state');
  }

  if (!config.trainingDataset) {
    errors.push('Training dataset is required');
  } else if (config.trainingDataset.type === 'examples') {
    if (!config.trainingDataset.examples || config.trainingDataset.examples.length < 10) {
      errors.push('At least 10 training examples are required');
    }
  }

  return {
    canStart: errors.length === 0,
    errors,
  };
}

/**
 * Generate training job ID
 */
export function generateTrainingJobId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `job-${timestamp}-${random}`;
}

/**
 * Get default hyperparameters for a provider
 */
export function getDefaultHyperparameters(
  provider: FineTuningProvider
): Hyperparameters {
  const defaults: Record<FineTuningProvider, Hyperparameters> = {
    anthropic: {
      learningRate: 0.0001,
      epochs: 3,
      batchSize: 4,
    },
    openai: {
      learningRate: 0.0001,
      epochs: 3,
      batchSize: 4,
    },
    custom: {
      learningRate: 0.0001,
      epochs: 5,
      batchSize: 8,
    },
  };

  return defaults[provider];
}

/**
 * Validate training dataset
 */
export function validateTrainingDataset(dataset: TrainingDataset): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (dataset.type === 'examples') {
    if (!dataset.examples || dataset.examples.length === 0) {
      errors.push('No training examples provided');
    } else {
      if (dataset.examples.length < 10) {
        errors.push('Minimum 10 examples required for effective training');
      } else if (dataset.examples.length < 50) {
        warnings.push('Consider adding more examples for better results (50+ recommended)');
      }

      // Check for diversity in examples
      const uniqueInputs = new Set(dataset.examples.map((e) => e.input));
      if (uniqueInputs.size < dataset.examples.length * 0.8) {
        warnings.push('Many duplicate inputs detected - consider more diverse examples');
      }
    }
  } else if (dataset.type === 'file') {
    if (!dataset.fileUrl) {
      errors.push('File URL is required for file-based training');
    }
  } else if (dataset.type === 'conversation') {
    if (!dataset.conversationIds || dataset.conversationIds.length === 0) {
      errors.push('Conversation IDs are required for conversation-based training');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
