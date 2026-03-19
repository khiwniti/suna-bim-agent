/**
 * Auto-Activation Rules for Tambo Tool Results
 *
 * Defines when tool results should automatically activate workspace panels.
 * This creates a ChatGPT Canvas-like experience where complex outputs
 * automatically expand into the artifact canvas.
 *
 * ★ Insight ─────────────────────────────────────
 * Auto-activation rules are tool-specific because different tools have
 * different "success" indicators. Carbon analysis needs positive totals,
 * clash detection needs non-zero counts, etc.
 * ─────────────────────────────────────────────────
 */

import type { PanelId } from '@/lib/panels/types';

// ============================================
// Types
// ============================================

export interface AutoActivationRule {
  /** Target panel to activate */
  panelId: PanelId;
  /** Condition function - returns true if should auto-activate */
  condition: (result: unknown) => boolean;
  /** Whether to expand the panel (default: true) */
  autoExpand: boolean;
}

export interface AutoActivationConfig {
  panelId: PanelId;
  autoExpand: boolean;
}

// ============================================
// Type Guards
// ============================================

function hasSuccess(result: unknown): result is { success: boolean } {
  return typeof result === 'object' && result !== null && 'success' in result;
}

function hasTotalCarbon(result: unknown): result is { totalCarbon: number } {
  return typeof result === 'object' && result !== null && 'totalCarbon' in result;
}

function hasDataWithItems(result: unknown): result is { data: { items: unknown[] } } {
  if (typeof result !== 'object' || result === null) return false;
  const obj = result as Record<string, unknown>;
  if (!('data' in obj) || typeof obj.data !== 'object' || obj.data === null) return false;
  const data = obj.data as Record<string, unknown>;
  return 'items' in data && Array.isArray(data.items);
}

function hasDataWithSummary(result: unknown): result is { data: { summary: { total: number } } } {
  if (typeof result !== 'object' || result === null) return false;
  const obj = result as Record<string, unknown>;
  if (!('data' in obj) || typeof obj.data !== 'object' || obj.data === null) return false;
  const data = obj.data as Record<string, unknown>;
  if (!('summary' in data) || typeof data.summary !== 'object' || data.summary === null) return false;
  const summary = data.summary as Record<string, unknown>;
  return typeof summary.total === 'number';
}

function hasDataWithElements(result: unknown): result is { data: { elements: unknown[] } } {
  if (typeof result !== 'object' || result === null) return false;
  const obj = result as Record<string, unknown>;
  if (!('data' in obj) || typeof obj.data !== 'object' || obj.data === null) return false;
  const data = obj.data as Record<string, unknown>;
  return 'elements' in data && Array.isArray(data.elements);
}

// ============================================
// Auto-Activation Rules
// ============================================

export const autoActivationRules: Record<string, AutoActivationRule> = {
  analyze_carbon: {
    panelId: 'carbon-dashboard',
    condition: (result) => {
      if (!hasSuccess(result) || !result.success) return false;
      if (!hasTotalCarbon(result)) return false;
      return result.totalCarbon > 0;
    },
    autoExpand: true,
  },
  generate_boq: {
    panelId: 'boq-table',
    condition: (result) => {
      if (!hasSuccess(result) || !result.success) return false;
      if (!hasDataWithItems(result)) return false;
      return result.data.items.length > 0;
    },
    autoExpand: true,
  },
  detect_clashes: {
    panelId: 'clash-report',
    condition: (result) => {
      if (!hasSuccess(result) || !result.success) return false;
      if (!hasDataWithSummary(result)) return false;
      return result.data.summary.total > 0;
    },
    autoExpand: true,
  },
  query_elements: {
    panelId: '3d-viewer',
    condition: (result) => {
      if (!hasSuccess(result) || !result.success) return false;
      if (!hasDataWithElements(result)) return false;
      return result.data.elements.length > 0;
    },
    autoExpand: false, // Just highlight, don't switch tab
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a tool result should trigger auto-activation
 */
export function shouldAutoActivate(toolName: string, result: unknown): boolean {
  const rule = autoActivationRules[toolName];
  if (!rule) return false;

  try {
    return rule.condition(result);
  } catch {
    return false;
  }
}

/**
 * Get auto-activation config for a tool
 */
export function getAutoActivationConfig(toolName: string): AutoActivationConfig | undefined {
  const rule = autoActivationRules[toolName];
  if (!rule) return undefined;

  return {
    panelId: rule.panelId,
    autoExpand: rule.autoExpand,
  };
}
