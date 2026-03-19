/**
 * Tool Visualizers Module
 *
 * Exports all tool visualizer components and the registry for dynamic resolution.
 */

// Base component
export { BaseToolCard } from './BaseToolCard';
export type { BaseToolCardProps } from './BaseToolCard';

// Code execution visualizer
export { CodeExecutionVisualizer } from './CodeExecutionVisualizer';
export type { CodeExecutionProps, CodeExecutionOutput } from './CodeExecutionVisualizer';

// Web search visualizer
export { WebSearchVisualizer } from './WebSearchVisualizer';
export type { WebSearchProps, WebSearchResult } from './WebSearchVisualizer';

// Data query visualizer
export { DataQueryVisualizer } from './DataQueryVisualizer';
export type { DataQueryProps, DataQueryResult } from './DataQueryVisualizer';

// BIM-specific tool visualizer
export { BIMToolVisualizer } from './BIMToolVisualizer';
export type {
  BIMToolProps,
  BIMToolType,
  CarbonAnalysisResult,
  ClashDetectionResult,
  BOQExtractionResult,
} from './BIMToolVisualizer';

// Tool call timeline for multi-tool sequences
export { ToolCallTimeline } from './ToolCallTimeline';
export type { ToolCallTimelineProps } from './ToolCallTimeline';

// Registry and dynamic resolution
export {
  ToolVisualizer,
  getVisualizerForTool,
  hasVisualizerForTool,
  getRegisteredToolNames,
} from './ToolVisualizerRegistry';
export type { ToolVisualizerProps, VisualizerProps } from './ToolVisualizerRegistry';
