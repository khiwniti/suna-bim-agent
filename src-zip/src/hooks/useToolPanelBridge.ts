/**
 * useToolPanelBridge Hook
 *
 * Bridges tool call completion events to panel activation.
 * When an AI tool completes successfully, this hook:
 * 1. Detects which panel should display the results
 * 2. Activates and expands the panel
 * 3. Passes tool result data to the panel via event bus
 *
 * ★ Insight ─────────────────────────────────────
 * This hook is the critical integration point between the chat/AI system
 * and the workspace panel system. By centralizing tool→panel mapping here,
 * we avoid scattering panel activation logic throughout the codebase.
 * ─────────────────────────────────────────────────
 */

'use client';

import { useCallback } from 'react';
import { usePanelStore } from '@/stores/panel-store';
import { panelEventBus } from '@/lib/panel/event-bus';
import type { PanelId } from '@/lib/panels/types';

// ============================================
// Types
// ============================================

interface ToolCallResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: unknown;
  error?: string;
}

interface ToolStartInfo {
  id: string;
  name: string;
}

// ============================================
// Tool → Panel Mapping
// ============================================

/**
 * Maps tool names to their corresponding panel IDs.
 * When a tool completes, this determines which panel should activate.
 */
export const TOOL_PANEL_MAP: Record<string, PanelId> = {
  // Carbon analysis tools → Carbon Dashboard
  // Supports both snake_case (Python backend) and camelCase (JS) variants
  carbon_analysis: 'carbon-dashboard',
  calculate_carbon: 'carbon-dashboard',
  analyze_sustainability: 'carbon-dashboard',
  get_emission_factors: 'carbon-dashboard',
  embodied_carbon: 'carbon-dashboard',
  analyzeCarbon: 'carbon-dashboard',
  analyze_carbon: 'carbon-dashboard',
  calculateCarbonFootprint: 'carbon-dashboard',

  // BOQ tools → BOQ Table
  extract_boq: 'boq-table',
  update_boq_row: 'boq-table',
  add_boq_item: 'boq-table',
  calculate_quantities: 'boq-table',
  get_quantities: 'boq-table',
  generateBOQ: 'boq-table',
  generate_boq: 'boq-table',
  calculateQuantities: 'boq-table',

  // Document tools → Document Editor
  generate_report: 'document-editor',
  create_document: 'document-editor',
  export_pdf: 'document-editor',
  create_summary: 'document-editor',

  // 3D viewer tools → 3D Viewer
  highlight_elements: '3d-viewer',
  isolate_elements: '3d-viewer',
  navigate_to_element: '3d-viewer',
  show_section: '3d-viewer',
  zoom_to_element: '3d-viewer',
  select_elements: '3d-viewer',
  focus_element: '3d-viewer',
  queryElements: '3d-viewer',
  query_elements: '3d-viewer',
  queryElementsByType: '3d-viewer',
  getElement: '3d-viewer',
  get_element: '3d-viewer',

  // Floor plan tools → Floor Plan Viewer
  analyze_floor_plan: 'floorplan-viewer',
  calculate_areas: 'floorplan-viewer',
  detect_spaces: 'floorplan-viewer',
  analyzeEgress: 'floorplan-viewer',
  analyze_egress: 'floorplan-viewer',

  // Clash detection tools → Clash Report
  clash_detection: 'clash-report',
  detect_clashes: 'clash-report',
  find_clashes: 'clash-report',
  resolve_clash: 'clash-report',
  check_clashes: 'clash-report',
  detectClashes: 'clash-report',

  // Compliance tools → Document Editor (for reports)
  checkCompliance: 'document-editor',
  check_compliance: 'document-editor',
  compliance_check: 'document-editor',
};

// ============================================
// Hook Implementation
// ============================================

export function useToolPanelBridge() {
  const activatePanel = usePanelStore((state) => state.activatePanel);

  /**
   * Called when a tool completes execution.
   * Activates the appropriate panel if tool completed successfully.
   */
  const onToolComplete = useCallback(
    (tool: ToolCallResult) => {
      // Only activate for successful tools
      if (tool.status !== 'success') {
        return;
      }

      // Find the panel for this tool
      const panelId = TOOL_PANEL_MAP[tool.name];
      if (!panelId) {
        return;
      }

      // Activate the panel (with auto-expand)
      activatePanel(panelId, true);

      // Send the tool result data to the panel
      if (tool.result) {
        panelEventBus.publish('chat', {
          type: 'UPDATE_PANEL_DATA',
          panelId,
          data: tool.result,
          merge: true,
        });
      }
    },
    [activatePanel]
  );

  /**
   * Called when a tool starts execution.
   * Optionally prepares the panel with loading state.
   */
  const onToolStart = useCallback((tool: ToolStartInfo) => {
    const panelId = TOOL_PANEL_MAP[tool.name];
    if (panelId) {
      // Notify the panel that a tool is loading (but don't auto-expand yet)
      panelEventBus.publish('chat', {
        type: 'UPDATE_PANEL_DATA',
        panelId,
        data: { isLoading: true, toolId: tool.id },
        merge: true,
      });
    }
  }, []);

  return {
    onToolComplete,
    onToolStart,
    TOOL_PANEL_MAP,
  };
}

export type { ToolCallResult, ToolStartInfo };
