'use client';

/**
 * ToolVisualizerRegistry
 *
 * Maps tool names to visualizer components and provides dynamic resolution.
 * Enables automatic selection of the correct visualizer based on tool name.
 */

import type { ComponentType, ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from '@/i18n/provider';
import { CodeExecutionVisualizer, type CodeExecutionProps } from './CodeExecutionVisualizer';
import { WebSearchVisualizer, type WebSearchProps } from './WebSearchVisualizer';
import { DataQueryVisualizer, type DataQueryProps } from './DataQueryVisualizer';
import { BaseToolCard } from './BaseToolCard';
import type { ToolCallVisualization } from '@/lib/generative-ui/types';

/**
 * Union type of all visualizer props
 */
export type VisualizerProps = CodeExecutionProps | WebSearchProps | DataQueryProps;

/**
 * Tool name to visualizer component mapping
 */
const TOOL_VISUALIZER_MAP: Record<string, ComponentType<VisualizerProps>> = {
  // Code execution tools
  execute_code: CodeExecutionVisualizer as ComponentType<VisualizerProps>,
  run_python: CodeExecutionVisualizer as ComponentType<VisualizerProps>,
  run_javascript: CodeExecutionVisualizer as ComponentType<VisualizerProps>,
  code_execution: CodeExecutionVisualizer as ComponentType<VisualizerProps>,

  // Web search tools
  web_search: WebSearchVisualizer as ComponentType<VisualizerProps>,
  search: WebSearchVisualizer as ComponentType<VisualizerProps>,
  tavily_search: WebSearchVisualizer as ComponentType<VisualizerProps>,

  // Data query tools
  sql_query: DataQueryVisualizer as ComponentType<VisualizerProps>,
  api_call: DataQueryVisualizer as ComponentType<VisualizerProps>,
  graphql_query: DataQueryVisualizer as ComponentType<VisualizerProps>,
  database_query: DataQueryVisualizer as ComponentType<VisualizerProps>,
  data_query: DataQueryVisualizer as ComponentType<VisualizerProps>,
};

/**
 * Get the visualizer component for a given tool name
 *
 * @param toolName - The name of the tool
 * @returns The visualizer component or null if not found
 */
export function getVisualizerForTool(
  toolName: string
): ComponentType<VisualizerProps> | null {
  return TOOL_VISUALIZER_MAP[toolName] ?? null;
}

/**
 * Check if a tool has a registered visualizer
 *
 * @param toolName - The name of the tool
 * @returns True if a visualizer exists for the tool
 */
export function hasVisualizerForTool(toolName: string): boolean {
  return toolName in TOOL_VISUALIZER_MAP;
}

/**
 * Get all registered tool names
 *
 * @returns Array of registered tool names
 */
export function getRegisteredToolNames(): string[] {
  return Object.keys(TOOL_VISUALIZER_MAP);
}

/**
 * Props for the ToolVisualizer component
 */
export interface ToolVisualizerProps {
  /** The tool call visualization data */
  toolCall: ToolCallVisualization;
  /** Props to pass to the specific visualizer */
  toolProps: Record<string, unknown>;
}

/**
 * ToolVisualizer - Auto-selects the correct visualizer based on tool name
 *
 * Falls back to BaseToolCard for unknown tools.
 *
 * Note: Dynamic component selection is intentional for the registry pattern.
 * The react-hooks/static-components rule is disabled because this is a
 * component registry pattern where dynamic selection is the desired behavior.
 */
export function ToolVisualizer({
  toolCall,
  toolProps,
}: ToolVisualizerProps): ReactElement {
  const { t } = useTranslation();
  // Get the visualizer component from registry
  // This pattern is intentional for dynamic component resolution
  const Visualizer = useMemo(
    () => getVisualizerForTool(toolCall.name),
    [toolCall.name]
  );

  // Compute fallback status
  const fallbackStatus = useMemo(() => {
    if (toolCall.status === 'pending' || toolCall.status === 'running') {
      return toolCall.status;
    }
    return toolCall.status === 'success' ? 'success' : 'error';
  }, [toolCall.status]);

  if (Visualizer) {
    // Type assertion is safe here because getToolProps() in ChatMessageWithTools
    // constructs props matching the expected visualizer type based on tool name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Visualizer {...(toolProps as any)} />;
  }

  // Fallback to BaseToolCard for unknown tools
  return (
    <BaseToolCard toolCall={toolCall} status={fallbackStatus}>
      <div className="text-sm text-muted-foreground">
        {toolCall.arguments ? (
          <pre className="text-xs font-mono bg-muted/50 rounded p-2 overflow-x-auto">
            {JSON.stringify(toolCall.arguments, null, 2)}
          </pre>
        ) : (
          <span>{t('toolVisualizer.noVisualization')}</span>
        )}
      </div>
    </BaseToolCard>
  );
}

export default ToolVisualizer;
