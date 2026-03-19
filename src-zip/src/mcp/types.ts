/**
 * MCP (Model Context Protocol) Types
 *
 * TypeScript type definitions for browser-based MCP communication
 */

import type { FloorPlanAnalysis, ProcessingStep } from '@/lib/vision/types';
import type { Scene3D } from '@/lib/geometry/types';

// Re-export for convenience
export type { FloorPlanAnalysis, Scene3D };

// ============================================
// MCP Tool Types
// ============================================

/**
 * MCP Tool definition returned from server
 */
export interface MCPTool {
  /** Unique tool name */
  name: string;
  /** Human-readable description */
  description: string;
  /** JSON Schema for tool input parameters */
  inputSchema: {
    type: 'object';
    properties: Record<string, MCPToolParameter>;
    required?: string[];
  };
}

/**
 * Tool parameter schema definition
 */
export interface MCPToolParameter {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  default?: unknown;
  enum?: string[];
  items?: MCPToolParameter;
}

/**
 * Tool call request sent to server
 */
export interface MCPToolCall {
  /** Tool name to invoke */
  tool: string;
  /** Tool arguments matching inputSchema */
  arguments: Record<string, unknown>;
}

/**
 * Tool call result from server
 */
export interface MCPToolResult {
  /** Result content (usually JSON stringified) */
  content: unknown;
  /** Whether the call resulted in an error */
  isError: boolean;
  /** Error message if isError is true */
  errorMessage?: string;
}

// ============================================
// Processing Progress Types
// ============================================

/**
 * Real-time processing progress update
 */
export interface ProcessingProgress {
  /** Current processing step name */
  step: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Human-readable status message */
  message: string;
  /** Optional step-specific data */
  data?: ProcessingProgressData;
  /** Timestamp of the update */
  timestamp?: string;
}

/**
 * Step-specific progress data
 */
export interface ProcessingProgressData {
  /** Analysis results when vision step completes */
  analysis?: FloorPlanAnalysis;
  /** 3D scene when geometry step completes */
  scene3D?: Scene3D;
  /** Processing steps status array */
  steps?: ProcessingStep[];
  /** Session identifier */
  sessionId?: string;
  /** Total processing time in milliseconds */
  totalTimeMs?: number;
}

// ============================================
// MCP Client Configuration
// ============================================

/**
 * Configuration for MCP client
 */
export interface MCPClientConfig {
  /** Base endpoint URL for MCP server */
  endpoint: string;
  /** Optional session ID for correlation */
  sessionId?: string;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Enable automatic reconnection */
  autoReconnect?: boolean;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
  /** Reconnection delay in milliseconds */
  reconnectDelay?: number;
}

// ============================================
// MCP Protocol Messages
// ============================================

/**
 * MCP request message
 */
export interface MCPRequest {
  /** Unique request ID for correlation */
  id: string;
  /** Request type */
  type: 'list_tools' | 'call_tool' | 'ping';
  /** Tool call details (for call_tool type) */
  toolCall?: MCPToolCall;
}

/**
 * MCP response message
 */
export interface MCPResponse {
  /** Correlation ID matching request */
  id: string;
  /** Response type */
  type: 'tools_list' | 'tool_result' | 'progress' | 'error' | 'pong';
  /** List of tools (for tools_list type) */
  tools?: MCPTool[];
  /** Tool result (for tool_result type) */
  result?: MCPToolResult;
  /** Progress update (for progress type) */
  progress?: ProcessingProgress;
  /** Error details (for error type) */
  error?: {
    code: string;
    message: string;
  };
}

/**
 * SSE event types for streaming
 */
export type MCPSSEEventType =
  | 'connected'
  | 'progress'
  | 'result'
  | 'error'
  | 'ping'
  | 'done';

/**
 * SSE event data structure
 */
export interface MCPSSEEvent {
  /** Event type */
  type: MCPSSEEventType;
  /** Event data */
  data: MCPResponse | ProcessingProgress | { message: string };
  /** Event timestamp */
  timestamp: string;
}

// ============================================
// Floor Plan MCP Tool Types
// ============================================

/**
 * Arguments for floor plan analysis tool
 */
export interface AnalyzeFloorPlanArgs {
  /** Base64 encoded image data */
  imageBase64?: string;
  /** URL to image */
  imageUrl?: string;
  /** Estimated wall height in meters */
  wallHeight?: number;
  /** Generate room labels in 3D */
  generateLabels?: boolean;
}

/**
 * Result from floor plan analysis tool
 */
export interface AnalyzeFloorPlanResult {
  /** Whether processing was successful */
  success: boolean;
  /** Session ID for this processing run */
  sessionId: string;
  /** Vision analysis results */
  analysis?: FloorPlanAnalysis;
  /** Generated 3D scene */
  scene3D?: Scene3D;
  /** Error message if failed */
  error?: string;
  /** Processing steps with status */
  steps: ProcessingStep[];
  /** Total processing time */
  totalTimeMs: number;
}

// ============================================
// Connection State Types
// ============================================

/**
 * MCP client connection state
 */
export type MCPConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * MCP client state for React hooks
 */
export interface MCPClientState {
  /** Current connection state */
  connectionState: MCPConnectionState;
  /** Available tools from server */
  tools: MCPTool[];
  /** Current session ID */
  sessionId: string | null;
  /** Last error if any */
  lastError: string | null;
}
