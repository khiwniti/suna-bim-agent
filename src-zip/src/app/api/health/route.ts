import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { setCSRFTokenInResponse } from '@/lib/security';

/**
 * Health Check API
 *
 * Returns the health status of the application and its dependencies
 * Used for monitoring, load balancers, and orchestration systems
 * Also initializes CSRF token for clients
 *
 * ★ Insight ─────────────────────────────────────
 * This endpoint follows the health check pattern used by:
 * - Kubernetes liveness/readiness probes
 * - Load balancer health checks
 * - Vercel/Railway deployment monitoring
 * ─────────────────────────────────────────────────
 */

interface ServiceCheck {
  status: 'up' | 'down' | 'degraded';
  latencyMs?: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: ServiceCheck;
    memory: ServiceCheck & { usedMb: number; totalMb: number; percentage: number };
    config: ServiceCheck;
  };
  buildInfo?: {
    nodeVersion: string;
    platform: string;
  };
}

export async function GET() {
  const checks: HealthCheck['checks'] = {
    database: { status: 'down' },
    memory: { status: 'up', usedMb: 0, totalMb: 0, percentage: 0 },
    config: { status: 'up' },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'up',
      latencyMs: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Database connection failed',
    };
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const usedMb = Math.round(memUsage.heapUsed / 1024 / 1024);
  const totalMb = Math.round(memUsage.heapTotal / 1024 / 1024);
  const memoryPercent = Math.round((usedMb / totalMb) * 100);

  checks.memory = {
    status: memoryPercent > 90 ? 'degraded' : 'up',
    usedMb,
    totalMb,
    percentage: memoryPercent,
  };

  // Check critical configuration
  const configIssues: string[] = [];
  if (!process.env.DATABASE_URL) configIssues.push('DATABASE_URL missing');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) configIssues.push('SUPABASE_URL missing');
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN && !process.env.OPENAI_API_KEY) {
    configIssues.push('No AI API key configured');
  }

  checks.config = {
    status: configIssues.length === 0 ? 'up' : configIssues.length > 1 ? 'down' : 'degraded',
    details: configIssues.length > 0 ? { issues: configIssues } : undefined,
  };

  // Determine overall health status
  let status: HealthCheck['status'] = 'healthy';
  if (checks.database.status === 'down' || checks.config.status === 'down') {
    status = 'unhealthy';
  } else if (
    checks.database.status === 'degraded' ||
    checks.memory.status === 'degraded' ||
    checks.config.status === 'degraded'
  ) {
    status = 'degraded';
  }

  const health: HealthCheck = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.round(process.uptime()),
    checks,
    buildInfo: {
      nodeVersion: process.version,
      platform: process.platform,
    },
  };

  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  // Set CSRF token so clients can initialize it on page load
  const response = NextResponse.json(health, { status: httpStatus });
  return setCSRFTokenInResponse(response);
}
