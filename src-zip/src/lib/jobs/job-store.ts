/**
 * In-Memory Job Store
 *
 * Simple job tracking system for background analysis tasks.
 * Provides async pattern for long-running operations while being MVP-friendly.
 *
 * Note: This is in-memory only - jobs are lost on server restart.
 * For production, consider Redis/QStash integration.
 */

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Job {
  id: string;
  type: string;
  status: JobStatus;
  createdAt: number;
  completedAt?: number;
  result?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

// In-memory job storage
const jobs = new Map<string, Job>();

/**
 * Generate a unique job ID
 */
function generateJobId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `job_${timestamp}${random}`;
}

/**
 * Create a new job with pending status
 */
export function createJob(type: string, metadata?: Record<string, unknown>): Job {
  const job: Job = {
    id: generateJobId(),
    type,
    status: 'pending',
    createdAt: Date.now(),
    metadata,
  };

  jobs.set(job.id, job);
  return { ...job };
}

/**
 * Get a job by ID
 * Returns null if job doesn't exist
 */
export function getJob(id: string): Job | null {
  const job = jobs.get(id);
  return job ? { ...job } : null;
}

/**
 * Update a job's properties
 * Automatically sets completedAt when status is 'completed' or 'failed'
 * Returns null if job doesn't exist
 */
export function updateJob(id: string, update: Partial<Job>): Job | null {
  const existing = jobs.get(id);
  if (!existing) {
    return null;
  }

  const updated: Job = {
    ...existing,
    ...update,
  };

  // Auto-set completedAt for terminal states
  if (
    (update.status === 'completed' || update.status === 'failed') &&
    !updated.completedAt
  ) {
    updated.completedAt = Date.now();
  }

  jobs.set(id, updated);
  return { ...updated };
}

/**
 * Delete a job by ID
 * Returns true if job was deleted, false if not found
 */
export function deleteJob(id: string): boolean {
  return jobs.delete(id);
}

/**
 * Get all jobs (for debugging/admin purposes)
 */
export function getAllJobs(): Job[] {
  return Array.from(jobs.values()).map((job) => ({ ...job }));
}

/**
 * Clear jobs older than the specified TTL (in milliseconds)
 * Returns the number of jobs cleared
 */
export function clearExpiredJobs(ttlMs: number): number {
  const now = Date.now();
  let cleared = 0;

  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > ttlMs) {
      jobs.delete(id);
      cleared++;
    }
  }

  return cleared;
}

/**
 * Get jobs by status
 */
export function getJobsByStatus(status: JobStatus): Job[] {
  return Array.from(jobs.values())
    .filter((job) => job.status === status)
    .map((job) => ({ ...job }));
}

/**
 * Get job count by status (for monitoring)
 */
export function getJobStats(): Record<JobStatus, number> {
  const stats: Record<JobStatus, number> = {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  };

  for (const job of jobs.values()) {
    stats[job.status]++;
  }

  return stats;
}
