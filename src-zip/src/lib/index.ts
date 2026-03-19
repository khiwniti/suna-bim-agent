/**
 * Library Index
 *
 * Re-export all library modules for easy importing
 * Note: Import directly from submodules to avoid namespace conflicts
 */

// Database
export { prisma } from './db';

// Utilities
export * from './utils';

// For other modules, import directly:
// import { createClient } from '@/lib/supabase/client';
// import { createBIMAgent } from '@/lib/agent/graph';
// import { AppError, logger } from '@/lib/errors';
// import { validateRequest } from '@/lib/validation';
// import { rateLimit } from '@/lib/rate-limit';
// import { success, error } from '@/lib/api-response';
// import { signInWithEmail } from '@/lib/auth-providers';
// import { processModelFile } from '@/lib/bim-processing';
// import { runAnalysis } from '@/lib/analysis-tools';
