'use client';

/**
 * Tambo Artifact Cards
 *
 * Wrapper components that integrate existing generative UI cards with Tambo SDK
 * and panel activation functionality. These are registered as Tambo components
 * for AI-driven rendering in chat with "Open Panel →" CTA.
 *
 * Features:
 * - Wraps existing CarbonResultCard, ClashResultCard, etc.
 * - Uses useTamboComponentState for bidirectional AI sync
 * - Activates corresponding workspace panel on "Open Panel" click
 * - Sends data to panels via panelEventBus
 */

import { useCallback } from 'react';
import { useTamboComponentState } from '@tambo-ai/react';
import { usePanelStore } from '@/stores/panel-store';
import { panelEventBus } from '@/lib/panel/event-bus';
import { z } from 'zod';

// Import existing card components
import { CarbonResultCard } from '@/components/generative-ui/CarbonResultCard';
import { ClashResultCard } from '@/components/generative-ui/ClashResultCard';
import type { CarbonAnalysisResult, ClashDetectionResult } from '@/lib/generative-ui/types';

// ============================================
// Carbon Artifact Card (Tambo-enabled)
// ============================================

export const carbonArtifactCardPropsSchema = z.object({
  totalCarbon: z.number().describe('Total embodied carbon in kgCO2e'),
  unit: z.literal('kgCO2e').optional().describe('Unit of measurement'),
  breakdown: z.object({
    materials: z.number(),
    construction: z.number(),
    transport: z.number(),
  }).describe('Carbon breakdown by category'),
  hotspots: z.array(z.object({
    element: z.string(),
    carbon: z.number(),
    percentage: z.number(),
  })).optional().describe('Top carbon hotspots'),
  recommendations: z.array(z.string()).optional().describe('Carbon reduction recommendations'),
});

export type CarbonArtifactCardProps = z.infer<typeof carbonArtifactCardPropsSchema>;

export function CarbonArtifactCard(props: CarbonArtifactCardProps) {
  // ★ Insight ─────────────────────────────────────
  // Streaming safeguards: During AI streaming, props may be partial, undefined,
  // or contain invalid values like NaN/Infinity. We need robust validation
  // to show skeleton loaders instead of crashing.
  // ─────────────────────────────────────────────────
  const {
    totalCarbon = 0,
    unit = 'kgCO2e',
    breakdown = { materials: 0, construction: 0, transport: 0 },
    hotspots = [],
    recommendations = [],
  } = props ?? {};

  // Helper to validate a number
  const isValidNumber = (val: unknown): val is number =>
    typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val);

  // Check if we have valid data to display
  const hasValidTotalCarbon = isValidNumber(totalCarbon) && totalCarbon > 0;
  const hasValidBreakdown = breakdown &&
    (isValidNumber(breakdown.materials) && breakdown.materials > 0 ||
     isValidNumber(breakdown.construction) && breakdown.construction > 0 ||
     isValidNumber(breakdown.transport) && breakdown.transport > 0);

  // Guard against incomplete/streaming props
  if (!hasValidTotalCarbon && !hasValidBreakdown) {
    return (
      <div className="rounded-xl border bg-muted/50 p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-200 dark:bg-green-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-green-200 dark:bg-green-800 rounded w-1/3" />
            <div className="h-3 bg-green-100 dark:bg-green-900 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // Track component state for AI awareness
  const [panelOpened, setPanelOpened] = useTamboComponentState<boolean>(
    'panelOpened',
    false
  );

  const panelStore = usePanelStore();

  // Handle "Open Panel →" click
  const handleOpenPanel = useCallback(() => {
    setPanelOpened(true);

    // Activate carbon dashboard panel
    panelStore.enableTab('carbon-dashboard');
    panelStore.setActiveTab('carbon-dashboard');

    // Emit panel activation event
    panelEventBus.publish('chat', {
      type: 'ACTIVATE_PANEL',
      panelId: 'carbon-dashboard',
      autoExpand: true,
    });

    // Safe total for percentage calculation
    const safeTotal = isValidNumber(totalCarbon) && totalCarbon > 0 ? totalCarbon : 1;

    // Send data to panel
    panelEventBus.publish('chat', {
      type: 'UPDATE_PANEL_DATA',
      panelId: 'carbon-dashboard',
      data: {
        totalCarbon: isValidNumber(totalCarbon) ? totalCarbon : 0,
        unit,
        materials: Object.entries(breakdown).map(([name, value]) => ({
          name,
          carbon: isValidNumber(value) ? value : 0,
          percentage: isValidNumber(value) ? (value / safeTotal) * 100 : 0,
        })),
        categories: Object.entries(breakdown).map(([category, carbon]) => ({
          category,
          carbon: isValidNumber(carbon) ? carbon : 0,
        })),
      },
    });
  }, [setPanelOpened, panelStore, totalCarbon, unit, breakdown]);

  // Convert props to CarbonAnalysisResult format
  const result: CarbonAnalysisResult = {
    totalCarbon: isValidNumber(totalCarbon) ? totalCarbon : 0,
    unit,
    breakdown: {
      materials: isValidNumber(breakdown?.materials) ? breakdown.materials : 0,
      construction: isValidNumber(breakdown?.construction) ? breakdown.construction : 0,
      transport: isValidNumber(breakdown?.transport) ? breakdown.transport : 0,
    },
    hotspots,
    recommendations,
  };

  return (
    <CarbonResultCard
      result={result}
      onOpenPanel={handleOpenPanel}
      showPanelCTA={true}
    />
  );
}

// ============================================
// Clash Artifact Card (Tambo-enabled)
// ============================================

export const clashArtifactCardPropsSchema = z.object({
  totalClashes: z.number().describe('Total number of clashes detected'),
  severity: z.object({
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
  }).describe('Clash severity breakdown'),
  clashes: z.array(z.object({
    id: z.string(),
    elements: z.array(z.string()),
    type: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
  })).optional().describe('List of individual clashes'),
});

export type ClashArtifactCardProps = z.infer<typeof clashArtifactCardPropsSchema>;

export function ClashArtifactCard(props: ClashArtifactCardProps) {
  // ★ Insight ─────────────────────────────────────
  // Streaming safeguards for clash detection results.
  // Zero clashes or invalid data should show skeleton loader.
  // ─────────────────────────────────────────────────
  const {
    totalClashes = 0,
    severity = { critical: 0, high: 0, medium: 0, low: 0 },
    clashes = [],
  } = props ?? {};

  // Helper to validate a number
  const isValidNumber = (val: unknown): val is number =>
    typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val);

  // Check if we have valid data to display
  const hasValidTotalClashes = isValidNumber(totalClashes) && totalClashes > 0;
  const hasValidSeverity = severity &&
    ((isValidNumber(severity.critical) && severity.critical > 0) ||
     (isValidNumber(severity.high) && severity.high > 0) ||
     (isValidNumber(severity.medium) && severity.medium > 0) ||
     (isValidNumber(severity.low) && severity.low > 0));

  // Guard against incomplete/streaming props
  if (!hasValidTotalClashes && !hasValidSeverity) {
    return (
      <div className="rounded-xl border bg-muted/50 p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-200 dark:bg-red-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-red-200 dark:bg-red-800 rounded w-1/3" />
            <div className="h-3 bg-red-100 dark:bg-red-900 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const [panelOpened, setPanelOpened] = useTamboComponentState<boolean>(
    'panelOpened',
    false
  );

  const panelStore = usePanelStore();

  const handleOpenPanel = useCallback(() => {
    setPanelOpened(true);

    panelStore.enableTab('clash-report');
    panelStore.setActiveTab('clash-report');

    panelEventBus.publish('chat', {
      type: 'ACTIVATE_PANEL',
      panelId: 'clash-report',
      autoExpand: true,
    });

    // Safe severity values
    const safeSeverity = {
      critical: isValidNumber(severity?.critical) ? severity.critical : 0,
      high: isValidNumber(severity?.high) ? severity.high : 0,
      medium: isValidNumber(severity?.medium) ? severity.medium : 0,
      low: isValidNumber(severity?.low) ? severity.low : 0,
    };

    panelEventBus.publish('chat', {
      type: 'UPDATE_PANEL_DATA',
      panelId: 'clash-report',
      data: {
        summary: { total: isValidNumber(totalClashes) ? totalClashes : 0, ...safeSeverity },
        clashes: clashes.map((c) => ({ ...c, status: 'open' })),
      },
    });
  }, [setPanelOpened, panelStore, totalClashes, severity, clashes]);

  // Convert props to ClashDetectionResult format with safe values
  const result: ClashDetectionResult = {
    totalClashes: isValidNumber(totalClashes) ? totalClashes : 0,
    severity: {
      critical: isValidNumber(severity?.critical) ? severity.critical : 0,
      high: isValidNumber(severity?.high) ? severity.high : 0,
      medium: isValidNumber(severity?.medium) ? severity.medium : 0,
      low: isValidNumber(severity?.low) ? severity.low : 0,
    },
    clashes,
  };

  return (
    <ClashResultCard
      result={result}
      onOpenPanel={handleOpenPanel}
      showPanelCTA={true}
    />
  );
}

// ============================================
// BOQ Artifact Card (Tambo-enabled)
// ============================================

export const boqArtifactCardPropsSchema = z.object({
  totalCost: z.number().describe('Total estimated cost'),
  currency: z.string().optional().describe('Currency code (default: THB)'),
  itemCount: z.number().optional().describe('Number of BOQ items'),
  categories: z.array(z.string()).optional().describe('List of categories'),
  topItems: z.array(z.object({
    id: z.string(),
    description: z.string(),
    quantity: z.number(),
    unit: z.string(),
    totalCost: z.number(),
  })).optional().describe('Top cost items'),
});

export type BOQArtifactCardProps = z.infer<typeof boqArtifactCardPropsSchema>;

export function BOQArtifactCard(props: BOQArtifactCardProps) {
  // ★ Insight ─────────────────────────────────────
  // Streaming safeguards for BOQ/cost results.
  // Invalid, zero, or negative costs should show skeleton loader.
  // ─────────────────────────────────────────────────
  const {
    totalCost = 0,
    currency = 'THB',
    itemCount = 0,
    categories = [],
    topItems = [],
  } = props ?? {};

  // Helper to validate a number
  const isValidNumber = (val: unknown): val is number =>
    typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val);

  // Check if we have valid data to display
  const hasValidTotalCost = isValidNumber(totalCost) && totalCost > 0;

  // Guard against incomplete/streaming props
  if (!hasValidTotalCost) {
    return (
      <div className="rounded-xl border bg-muted/50 p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-200 dark:bg-blue-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-1/3" />
            <div className="h-3 bg-blue-100 dark:bg-blue-900 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const [panelOpened, setPanelOpened] = useTamboComponentState<boolean>(
    'panelOpened',
    false
  );

  const panelStore = usePanelStore();

  const handleOpenPanel = useCallback(() => {
    setPanelOpened(true);

    panelStore.enableTab('boq-table');
    panelStore.setActiveTab('boq-table');

    panelEventBus.publish('chat', {
      type: 'ACTIVATE_PANEL',
      panelId: 'boq-table',
      autoExpand: true,
    });

    panelEventBus.publish('chat', {
      type: 'UPDATE_PANEL_DATA',
      panelId: 'boq-table',
      data: {
        totalCost,
        currency,
        items: topItems.map((item) => ({
          ...item,
          item: item.description,
          unitCost: item.totalCost / item.quantity,
          category: categories[0] || 'General',
        })),
      },
    });
  }, [setPanelOpened, panelStore, totalCost, currency, topItems, categories]);

  // Format cost display
  const formattedCost = currency === 'THB'
    ? `฿${totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
    : new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(totalCost);

  return (
    <div className="rounded-xl border bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Bill of Quantities</h3>
            <p className="text-sm text-muted-foreground">
              {itemCount} items across {categories.length || 1} categories
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
            {formattedCost}
          </p>
          <p className="text-xs text-muted-foreground">Total Estimated Cost</p>
        </div>
      </div>

      {/* Top Items Preview */}
      {topItems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Top Items</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {topItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-black/20 border border-blue-200/50 dark:border-blue-800/50"
              >
                <span className="text-sm truncate max-w-[60%]">{item.description}</span>
                <span className="text-sm font-medium">
                  {currency === 'THB' ? `฿${item.totalCost.toLocaleString()}` : item.totalCost.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Panel CTA */}
      <button
        onClick={handleOpenPanel}
        className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        Open Panel →
      </button>
    </div>
  );
}
