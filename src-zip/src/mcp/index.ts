/**
 * MCP Module Exports
 *
 * Browser-based MCP client for communicating with the BIM Agent MCP server.
 */

// Types
export type {
  // Core MCP types
  MCPTool,
  MCPToolCall,
  MCPToolResult,
  MCPToolParameter,
  MCPClientConfig,
  MCPRequest,
  MCPResponse,
  MCPSSEEvent,
  MCPSSEEventType,
  MCPConnectionState,
  MCPClientState,

  // Processing types
  ProcessingProgress,
  ProcessingProgressData,

  // Floor plan specific types
  AnalyzeFloorPlanArgs,
  AnalyzeFloorPlanResult,

  // Re-exported types
  FloorPlanAnalysis,
  Scene3D,
} from './types';

// Client
export { MCPClient, getMCPClient, resetMCPClient } from './client';
