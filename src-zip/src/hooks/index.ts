/**
 * Hooks Index
 *
 * Export all custom hooks
 */

export { useAuth } from './useAuth';
export { useAnonymousSession } from './useAnonymousSession';
export { useChat } from './useChat';
export { useChatSession, getAnonymousSessionId, clearAnonymousSession } from './useChatSession';
export { useChatMemory } from './useChatMemory';
export type { UseChatMemoryReturn } from './useChatMemory';
export { useProjects } from './useProjects';
export { useRealtime, usePresence, useBroadcast } from './useRealtime';
export { useFloorPlanProcessing } from './useFloorPlanProcessing';
export type { UseFloorPlanProcessingOptions, UseFloorPlanProcessingReturn } from './useFloorPlanProcessing';

// Clipboard hook for copy functionality
export { useClipboard } from './useClipboard';

// MCP-based floor plan processing (legacy)
export { useFloorPlanMCP, base64ToDataUrl } from './useFloorPlanMCP';
export type { UseFloorPlanMCPOptions, UseFloorPlanMCPReturn, ProcessOptions } from './useFloorPlanMCP';

// Direct API-based floor plan processing (preferred)
export { useFloorPlanAPI, fileToBase64 } from './useFloorPlanAPI';
export type { UseFloorPlanAPIOptions, UseFloorPlanAPIReturn } from './useFloorPlanAPI';

// Unified BIM file upload (handles IFC, images, etc.)
export { useBIMFileUpload } from './useBIMFileUpload';
export type {
  UseBIMFileUploadOptions,
  UseBIMFileUploadReturn,
  FileUploadProgress,
  UploadResult,
  SupportedFileType,
} from './useBIMFileUpload';

// IFC to Carbon Calculator Integration
export { useIFCCalculatorIntegration } from './useIFCCalculatorIntegration';
export type {
  UseIFCCalculatorOptions,
  IFCCalculatorState,
  IFCCalculatorActions,
  QuickCarbonEstimate,
  MaterialSummaryItem,
} from './useIFCCalculatorIntegration';

// Agent State Machine for AI Streaming System
export { useAgentStateMachine } from './useAgentStateMachine';
export type { UseAgentStateMachineReturn } from './useAgentStateMachine';

// Streaming Text Typewriter Effect
export { useStreamingText, useTypewriter } from './useStreamingText';
export type { StreamingTextConfig, UseStreamingTextReturn } from './useStreamingText';

// Tool→Panel Bridge for AI tool activation
export { useToolPanelBridge, TOOL_PANEL_MAP } from './useToolPanelBridge';
export type { ToolCallResult, ToolStartInfo } from './useToolPanelBridge';

// Panel Event Subscriptions for global panel state management
export { usePanelEventSubscriptions } from './usePanelEventSubscriptions';

// Component Registry for generative UI instances
export { useComponentRegistry } from './useComponentRegistry';
export type { UseComponentRegistryReturn } from './useComponentRegistry';
