'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gauge,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
  TrendingUp,
  Clock,
  Zap,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface RateLimitUsage {
  current: number;
  remaining: number;
  resetTime: number;
  percentUsed: number;
}

interface RateLimitsData {
  tier: string;
  tierDefault: number;
  tierDefaultFormatted: string;
  customOverride: number | null;
  effectiveLimit: number;
  effectiveLimitFormatted: string;
  isUnlimited: boolean;
  endpointLimits: Record<string, number | string>;
  usage?: RateLimitUsage;
}

interface RateLimitConfigProps {
  tenantId: string;
  tenantName?: string;
  csrfToken?: string;
  className?: string;
  onUpdate?: (rateLimits: RateLimitsData) => void;
}

interface EndpointMultipliers {
  [key: string]: number;
}

// ============================================
// Constants
// ============================================

const TIER_COLORS: Record<string, string> = {
  STARTER: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
  PROFESSIONAL: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
  ENTERPRISE: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300',
  UNLIMITED: 'text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300',
};

const ENDPOINT_DESCRIPTIONS: Record<string, string> = {
  api: 'General API requests',
  chat: 'AI chat interactions',
  analysis: 'BIM analysis operations',
  upload: 'File uploads',
  carbon: 'Carbon calculations',
  clash: 'Clash detection',
  compliance: 'Code compliance checks',
  mcp: 'MCP tool calls',
  export: 'Report exports',
  bcf: 'BCF operations',
};

const POLL_INTERVAL = 30000; // 30 seconds

// ============================================
// Helper Functions
// ============================================

function formatResetTime(resetTime: number): string {
  const now = Date.now();
  const diff = resetTime - now;

  if (diff <= 0) return 'Now';

  const seconds = Math.ceil(diff / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.ceil(seconds / 60);
  return `${minutes}m`;
}

function getProgressColor(percentUsed: number): string {
  if (percentUsed >= 90) return 'bg-red-500';
  if (percentUsed >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getProgressBgColor(percentUsed: number): string {
  if (percentUsed >= 90) return 'bg-red-100 dark:bg-red-950';
  if (percentUsed >= 70) return 'bg-yellow-100 dark:bg-yellow-950';
  return 'bg-green-100 dark:bg-green-950';
}

// ============================================
// Component
// ============================================

export function RateLimitConfig({
  tenantId,
  tenantName,
  csrfToken,
  className,
  onUpdate,
}: RateLimitConfigProps) {
  // State
  const [rateLimits, setRateLimits] = useState<RateLimitsData | null>(null);
  const [endpointMultipliers, setEndpointMultipliers] = useState<EndpointMultipliers>({});
  const [customLimit, setCustomLimit] = useState<string>('');
  const [originalLimit, setOriginalLimit] = useState<number | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Error/success states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ============================================
  // Data Fetching
  // ============================================

  const fetchRateLimits = useCallback(async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/rate-limits`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch rate limits');
      }

      const data = await response.json();
      setRateLimits(data.rateLimits);
      setEndpointMultipliers(data.endpointMultipliers || {});
      setCustomLimit(
        data.rateLimits.customOverride !== null
          ? String(data.rateLimits.customOverride)
          : ''
      );
      setOriginalLimit(data.rateLimits.customOverride);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rate limits');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  // Initial fetch
  useEffect(() => {
    fetchRateLimits();
  }, [fetchRateLimits]);

  // Polling for usage updates with cleanup awareness
  useEffect(() => {
    let isMounted = true;

    const interval = setInterval(() => {
      if (isMounted) {
        fetchRateLimits();
      }
    }, POLL_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchRateLimits]);

  // ============================================
  // Actions
  // ============================================

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const newLimit = customLimit === '' ? null : parseInt(customLimit, 10);

      // Validate
      if (newLimit !== null && (isNaN(newLimit) || newLimit < 1 || newLimit > 10000)) {
        throw new Error('Rate limit must be between 1 and 10000');
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const response = await fetch(`/api/tenants/${tenantId}/rate-limits`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ apiRateLimit: newLimit }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update rate limits');
      }

      const data = await response.json();
      setRateLimits(data.rateLimits);
      setOriginalLimit(data.rateLimits.customOverride);
      setSuccess(data.message || 'Rate limits updated successfully');
      onUpdate?.(data.rateLimits);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    setError(null);
    setSuccess(null);

    try {
      const headers: HeadersInit = {};
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const response = await fetch(`/api/tenants/${tenantId}/rate-limits`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset rate limits');
      }

      const data = await response.json();
      setRateLimits(data.rateLimits);
      setCustomLimit('');
      setOriginalLimit(null);
      setSuccess(data.message || 'Rate limits reset to tier default');
      onUpdate?.(data.rateLimits);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset');
    } finally {
      setIsResetting(false);
    }
  };

  // ============================================
  // Derived State
  // ============================================

  const hasChanges = customLimit !== (originalLimit !== null ? String(originalLimit) : '');
  const parsedLimit = customLimit === '' ? null : parseInt(customLimit, 10);
  const isValidLimit =
    parsedLimit === null ||
    (!isNaN(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 10000);

  // ============================================
  // Render
  // ============================================

  if (isLoading) {
    return (
      <div className={cn('p-6 flex items-center justify-center', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading rate limits...</span>
      </div>
    );
  }

  if (!rateLimits) {
    return (
      <div className={cn('p-6', className)}>
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          <span>{error || 'Failed to load rate limits'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            Rate Limit Configuration
          </h3>
          {tenantName && (
            <p className="text-sm text-muted-foreground mt-1">{tenantName}</p>
          )}
        </div>
        <span
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            TIER_COLORS[rateLimits.tier]
          )}
        >
          {rateLimits.tier}
        </span>
      </div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-lg"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Limits Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Activity className="w-4 h-4" />}
          label="Tier Default"
          value={rateLimits.tierDefaultFormatted}
          color="blue"
        />
        <MetricCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Custom Override"
          value={
            rateLimits.customOverride !== null
              ? `${rateLimits.customOverride}/min`
              : 'None'
          }
          color={rateLimits.customOverride !== null ? 'purple' : 'gray'}
        />
        <MetricCard
          icon={<Zap className="w-4 h-4" />}
          label="Effective Limit"
          value={rateLimits.effectiveLimitFormatted}
          color="green"
        />
        <MetricCard
          icon={<Clock className="w-4 h-4" />}
          label="Status"
          value={rateLimits.isUnlimited ? 'Unlimited' : 'Limited'}
          color={rateLimits.isUnlimited ? 'amber' : 'blue'}
        />
      </div>

      {/* Usage (if available) */}
      {rateLimits.usage && !rateLimits.isUnlimited && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Current Usage
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {rateLimits.usage.current} / {rateLimits.effectiveLimit} requests
              </span>
              <span className="font-medium">{rateLimits.usage.percentUsed}%</span>
            </div>
            <div
              className={cn(
                'h-2 rounded-full overflow-hidden',
                getProgressBgColor(rateLimits.usage.percentUsed)
              )}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, rateLimits.usage.percentUsed)}%` }}
                transition={{ duration: 0.5 }}
                className={cn('h-full rounded-full', getProgressColor(rateLimits.usage.percentUsed))}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{rateLimits.usage.remaining} remaining</span>
              <span>Resets in {formatResetTime(rateLimits.usage.resetTime)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Override Form */}
      {!rateLimits.isUnlimited && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Custom Rate Limit
          </h4>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="customLimit"
                className="block text-sm font-medium mb-1"
              >
                Override Limit (requests/min)
              </label>
              <div className="flex gap-2">
                <input
                  id="customLimit"
                  type="number"
                  min="1"
                  max="10000"
                  placeholder={`Default: ${rateLimits.tierDefault}`}
                  value={customLimit}
                  onChange={(e) => setCustomLimit(e.target.value)}
                  className={cn(
                    'flex-1 px-3 py-2 border rounded-lg bg-background',
                    'focus:outline-none focus:ring-2 focus:ring-primary',
                    !isValidLimit && customLimit !== ''
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-border'
                  )}
                />
                <button
                  onClick={() => fetchRateLimits()}
                  disabled={isLoading}
                  className="px-3 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                </button>
              </div>
              {!isValidLimit && customLimit !== '' && (
                <p className="mt-1 text-xs text-red-500">
                  Rate limit must be between 1 and 10,000
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Leave empty to use tier default ({rateLimits.tierDefault}/min)
              </p>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Presets:</span>
              {[
                Math.round(rateLimits.tierDefault * 0.5),
                rateLimits.tierDefault,
                Math.round(rateLimits.tierDefault * 1.5),
                Math.round(rateLimits.tierDefault * 2),
              ]
                .filter((v) => v >= 1 && v <= 10000)
                .map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCustomLimit(String(preset))}
                    className={cn(
                      'px-2 py-1 text-xs rounded border border-border hover:bg-accent transition-colors',
                      customLimit === String(preset) && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {preset}/min
                  </button>
                ))}
              <button
                onClick={() => setCustomLimit('')}
                className={cn(
                  'px-2 py-1 text-xs rounded border border-border hover:bg-accent transition-colors',
                  customLimit === '' && 'bg-primary text-primary-foreground'
                )}
              >
                Default
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges || !isValidLimit}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  hasChanges && isValidLimit
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
              {rateLimits.customOverride !== null && (
                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  {isResetting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Endpoint Limits Table */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          Endpoint-Specific Limits
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium">Endpoint</th>
                <th className="text-left py-2 font-medium">Multiplier</th>
                <th className="text-right py-2 font-medium">Limit</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(rateLimits.endpointLimits).map(([endpoint, limit]) => (
                <tr
                  key={endpoint}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-2">
                    <div>
                      <span className="font-medium capitalize">{endpoint}</span>
                      {ENDPOINT_DESCRIPTIONS[endpoint] && (
                        <p className="text-xs text-muted-foreground">
                          {ENDPOINT_DESCRIPTIONS[endpoint]}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {endpointMultipliers[endpoint] !== undefined
                      ? `${Math.round(endpointMultipliers[endpoint] * 100)}%`
                      : '100%'}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {typeof limit === 'number' ? `${limit}/min` : limit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unlimited Notice */}
      {rateLimits.isUnlimited && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
          <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Unlimited Tier
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This tenant has unlimited API access. Rate limits cannot be configured
              for unlimited tiers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'purple' | 'green' | 'amber' | 'gray';
}

function MetricCard({ icon, label, value, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    gray: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <div className="bg-card rounded-lg p-3 border border-border">
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center mb-2',
          colorClasses[color]
        )}
      >
        {icon}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

export default RateLimitConfig;
