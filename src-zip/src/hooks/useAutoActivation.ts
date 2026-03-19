'use client';

/**
 * useAutoActivation Hook
 *
 * Monitors tool completions and automatically activates panels based on
 * auto-activation rules. Creates a ChatGPT Canvas-like experience where
 * important tool results expand into the artifact canvas.
 *
 * ★ Insight ─────────────────────────────────────
 * Auto-activation is deferred until streaming completes to prevent
 * premature panel switches. We track activated tool IDs to prevent
 * duplicate activations on re-renders.
 * ─────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';
import type { TamboToolUseContent } from '@tambo-ai/react';
import { usePanelStore } from '@/stores/panel-store';
import { panelEventBus } from '@/lib/panel/event-bus';
import {
  shouldAutoActivate,
  getAutoActivationConfig,
} from '@/lib/tambo/auto-activation';

// Type for tool use with result
interface TamboToolUseWithResult extends TamboToolUseContent {
  result?: unknown;
}

/**
 * Hook to automatically activate panels when tools complete with qualifying results
 *
 * @param toolUses - Array of tool use content from the message
 * @param isStreaming - Whether the message is currently streaming
 */
export function useAutoActivation(
  toolUses: TamboToolUseContent[],
  isStreaming: boolean
): void {
  const { setActiveTab } = usePanelStore();

  // Track which tools we've already activated to prevent duplicates
  const activatedToolIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Don't activate during streaming - wait for completion
    if (isStreaming) return;

    for (const toolUse of toolUses) {
      // Skip if not completed or already activated
      if (!toolUse.hasCompleted) continue;
      if (activatedToolIds.current.has(toolUse.id)) continue;

      // Check if this tool should auto-activate
      const result = (toolUse as TamboToolUseWithResult).result;
      if (!shouldAutoActivate(toolUse.name, result)) continue;

      // Get activation config
      const config = getAutoActivationConfig(toolUse.name);
      if (!config) continue;

      // Mark as activated
      activatedToolIds.current.add(toolUse.id);

      // Activate the panel (setActiveTab also enables the tab atomically)
      setActiveTab(config.panelId);

      // Publish activation event for other subscribers
      panelEventBus.publish('agent', {
        type: 'ACTIVATE_PANEL',
        panelId: config.panelId,
        autoExpand: config.autoExpand,
      });
    }
  }, [toolUses, isStreaming, setActiveTab]);
}

export default useAutoActivation;
