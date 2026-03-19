/**
 * BIM Agent Library Exports
 *
 * Centralized exports for the agent system
 */

// Core graph and agent
export { buildBIMAgentGraph, createBIMAgent, BIMAgentState, type BIMAgentStateType, type BIMAgent } from './graph';

// LLM configuration
export { createLLM, createFastLLM, createReasoningLLM, validateLLMConfig, type LLMConfig } from './llm';

// Agent prompts
export * from './prompts';

// MCP Tools (Python backend integration)
export {
  parseIFCModel,
  queryElementsByTypeMCP,
  getElementByIdMCP,
  calculateQuantitiesMCP,
  analyzeCarbon,
  detectClashesMCP,
  checkComplianceMCP,
  createBCFTopicMCP,
  listBCFTopicsMCP,
  addBCFCommentMCP,
  isMCPAvailable,
  getMCPToolList,
  resetMCPTools,
  MCP_TOOLS,
  type MCPToolName,
} from './mcp-tools';

// Local tools (Prisma/database)
export { BIM_TOOLS, type BIMToolName } from './tools';

// Types
export type {
  AgentType,
  AgentError,
  ToolCall,
  ToolResult,
  ViewportCommand,
  ViewportCommandType,
  ViewPreset,
  UICommand,
  UICommandType,
  BIMElement,
  AnalysisResult,
  Message,
  AgentMessage
} from './types';

// State
export { createInitialState, type BIMAgentState as LegacyBIMAgentState } from './state';
