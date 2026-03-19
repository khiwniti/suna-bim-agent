'use client';

/**
 * SmartAgentMessage - Intelligent message renderer
 *
 * Automatically detects and parses agent responses to display:
 * - Reasoning/thinking (collapsible)
 * - Tool calls with status
 * - Agent routing information
 * - Final response with rich formatting
 *
 * Falls back to simple MessageBubble for regular messages.
 */

import { memo, useMemo } from 'react';
import { MessageBubble, type MessageRole } from './MessageBubble';
import { AgentResponseCard, type AgentReasoning, type ToolCallInfo, type ViewportCommand } from './AgentResponseCard';
import { TravelAgentMessage, type TravelToolCall } from './travel';

export interface SmartAgentMessageProps {
  /** Message role */
  role: MessageRole;
  /** Raw message content (may contain JSON reasoning blocks) */
  content: string;
  /** Message timestamp */
  timestamp?: Date;
  /** Tool calls from metadata */
  toolCalls?: Array<{
    id: string;
    name: string;
    status: 'pending' | 'running' | 'success' | 'error';
    arguments?: Record<string, unknown>;
    result?: unknown;
    error?: string;
    progress?: number;
    description?: string;
  }>;
  /** Agent name from metadata */
  agentName?: string;
  /** Viewport commands from metadata */
  viewportCommands?: ViewportCommand[];
  /** Is currently streaming */
  isStreaming?: boolean;
  /** Current agent execution phase */
  agentPhase?: 'idle' | 'thinking' | 'reasoning' | 'tool_calling' | 'tool_executing' | 'synthesizing' | 'responding';
  /** Current task description */
  currentTask?: string;
  /** Generative UI components */
  uiComponents?: Array<{
    id: string;
    type: string;
    props: Record<string, unknown>;
    zone?: string;
  }>;
  /** Enable travel-themed visualization (Manus.im style) */
  useTravelTheme?: boolean;
  /** CSS className */
  className?: string;
}

/**
 * Check if content looks like incomplete JSON during streaming
 * This prevents raw JSON from being displayed to users
 */
function looksLikeIncompleteJson(content: string): boolean {
  const trimmed = content.trim();

  // Pattern 1: Starts with { but braces don't balance (incomplete object)
  if (trimmed.startsWith('{')) {
    let braceCount = 0;
    for (const char of trimmed) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
    if (braceCount > 0) return true; // More opens than closes = incomplete
  }

  // Pattern 2: Starts with "key": but value is incomplete (no closing quote)
  if (/^"[a-zA-Z]+"\s*:\s*"[^"]*$/.test(trimmed)) {
    return true; // Value string started but not closed
  }

  // Pattern 3: Just the key-value start without any content
  if (/^"reasoning"\s*:\s*"/.test(trimmed) && !trimmed.includes('",')) {
    // Has "reasoning": " but no comma after the value = incomplete
    const lastQuoteIdx = trimmed.lastIndexOf('"');
    const colonIdx = trimmed.indexOf(':');
    // If last quote is part of the value start, not a close
    if (lastQuoteIdx > colonIdx + 2) {
      const afterLastQuote = trimmed.slice(lastQuoteIdx + 1);
      if (!afterLastQuote.includes('"') && !afterLastQuote.includes('}')) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Parse agent response to extract reasoning, tool calls, and content
 */
function parseAgentResponse(content: string, isStreaming: boolean = false): {
  reasoning?: AgentReasoning;
  mainContent: string;
  viewportCommands: ViewportCommand[];
  isIncompleteJson?: boolean;
} {
  let reasoning: AgentReasoning | undefined;
  let mainContent = content;
  const viewportCommands: ViewportCommand[] = [];

  // During streaming, if content looks like incomplete JSON, hide it
  if (isStreaming && looksLikeIncompleteJson(content)) {
    return {
      reasoning: undefined,
      mainContent: '', // Hide incomplete JSON
      viewportCommands: [],
      isIncompleteJson: true,
    };
  }

  // Try to extract JSON reasoning blocks
  // Pattern 1: ```json ... ``` blocks
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
  let match;

  while ((match = jsonBlockRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);

      // Check if it's a reasoning block
      if (parsed.reasoning || parsed.nextAgent || parsed.taskForAgent) {
        reasoning = {
          reasoning: parsed.reasoning || '',
          nextAgent: parsed.nextAgent,
          taskForAgent: parsed.taskForAgent,
          userResponse: parsed.userResponse,
        };
      }

      // Check for viewport commands
      if (parsed.viewportCommands && Array.isArray(parsed.viewportCommands)) {
        viewportCommands.push(...parsed.viewportCommands);
      }
    } catch {
      // Not valid JSON, skip
    }
  }

  // Remove JSON blocks from main content
  mainContent = content.replace(/```json[\s\S]*?```/g, '').trim();

  // Pattern 2: Inline JSON at start (for streaming responses)
  if (!reasoning && mainContent.startsWith('{')) {
    try {
      // Find the end of the JSON object
      let braceCount = 0;
      let endIdx = 0;
      for (let i = 0; i < mainContent.length; i++) {
        if (mainContent[i] === '{') braceCount++;
        if (mainContent[i] === '}') braceCount--;
        if (braceCount === 0) {
          endIdx = i + 1;
          break;
        }
      }

      if (endIdx > 0) {
        const jsonStr = mainContent.slice(0, endIdx);
        const parsed = JSON.parse(jsonStr);

        if (parsed.reasoning || parsed.nextAgent || parsed.taskForAgent) {
          reasoning = {
            reasoning: parsed.reasoning || '',
            nextAgent: parsed.nextAgent,
            taskForAgent: parsed.taskForAgent,
            userResponse: parsed.userResponse,
          };
          mainContent = mainContent.slice(endIdx).trim();
        }

        if (parsed.viewportCommands && Array.isArray(parsed.viewportCommands)) {
          viewportCommands.push(...parsed.viewportCommands);
        }
      }
    } catch {
      // Not valid JSON, continue with original content
    }
  }

  // Pattern 3: Raw key-value pairs without braces (malformed streaming)
  // Handles: "reasoning": "...", "response": "..."
  if (!reasoning && mainContent.startsWith('"reasoning":')) {
    const reasoningMatch = mainContent.match(/"reasoning"\s*:\s*"([^"]*?)"/);
    const responseMatch = mainContent.match(/"response"\s*:\s*"([^"]*?)"/);
    const userResponseMatch = mainContent.match(/"userResponse"\s*:\s*"([^"]*?)"/);

    if (reasoningMatch) {
      reasoning = {
        reasoning: reasoningMatch[1],
        nextAgent: undefined,
        taskForAgent: undefined,
        userResponse: userResponseMatch?.[1],
      };
      // Remove the reasoning part from content
      mainContent = mainContent.replace(/"reasoning"\s*:\s*"[^"]*?"/, '').trim();
      // Remove leading comma if present
      mainContent = mainContent.replace(/^,\s*/, '');
    }

    // Extract response/userResponse as the main content
    const extractedResponse = responseMatch?.[1] || userResponseMatch?.[1];
    if (extractedResponse) {
      mainContent = extractedResponse;
    } else {
      // If only reasoning was found, clean up remaining JSON-like artifacts
      mainContent = mainContent
        .replace(/"[^"]*"\s*:\s*"[^"]*",?\s*/g, '') // Remove any remaining key-value pairs
        .trim();

      // If content is now empty, show nothing (reasoning will be in collapsible)
      if (!mainContent) {
        mainContent = '';
      }
    }
  }

  // Clean up extra newlines
  mainContent = mainContent.replace(/^\n+|\n+$/g, '').replace(/\n{3,}/g, '\n\n');

  return { reasoning, mainContent, viewportCommands, isIncompleteJson: false };
}

/**
 * Check if a message should use the rich agent card
 */
function shouldUseAgentCard(
  role: MessageRole,
  content: string,
  toolCalls?: SmartAgentMessageProps['toolCalls'],
  agentName?: string,
  agentPhase?: string,
  isStreaming?: boolean
): boolean {
  // Only for assistant messages
  if (role !== 'assistant') return false;

  // If we have tool calls, use agent card
  if (toolCalls && toolCalls.length > 0) return true;

  // If we have an explicit agent name, use agent card
  if (agentName) return true;

  // If we have an agent phase set (agent is actively working), use agent card
  if (agentPhase && agentPhase !== 'idle') return true;

  // If we're streaming (even without content yet), use agent card
  if (isStreaming) return true;

  // Check for reasoning JSON patterns
  if (content.includes('"reasoning"') || content.includes('"nextAgent"')) return true;

  // Check for analysis headers (various formats)
  if (content.match(/\*\*\w+\s+Analysis:\*\*/)) return true;
  if (content.match(/##\s+.*Analysis/i)) return true;

  // Check for tables (common in BIM analysis)
  if (content.includes('| Material') || content.includes('| --- |')) return true;
  if (content.match(/\|[^|]+\|[^|]+\|/)) return true; // Generic table detection

  // Check for structured sections (numbered lists with headers)
  if (content.match(/###\s+\d+\.\s+/)) return true;
  if (content.match(/##\s+\d+\.\s+/)) return true;

  // Check for BIM-specific keywords indicating structured analysis
  if (content.match(/\*\*(Carbon|Sustainability|Energy|Material|Structural|MEP|HVAC).*:\*\*/i)) return true;

  // Check for embodied carbon analysis indicators
  if (content.includes('kgCO2e') || content.includes('kWh/m²')) return true;

  // Check for recommendation sections
  if (content.match(/##\s*Recommendations/i) || content.match(/\*\*Recommendations?\*\*/i)) return true;

  return false;
}

/**
 * Convert tool calls to ToolCallInfo format
 */
function convertToolCalls(toolCalls?: SmartAgentMessageProps['toolCalls']): ToolCallInfo[] {
  if (!toolCalls) return [];

  return toolCalls.map(tc => ({
    id: tc.id,
    name: tc.name,
    status: tc.status,
    description: tc.description,
    duration: undefined, // Would need to track timing
    result: tc.result,
  }));
}

/**
 * Convert tool calls to TravelToolCall format for travel theme
 */
function convertToTravelToolCalls(toolCalls?: SmartAgentMessageProps['toolCalls']): TravelToolCall[] {
  if (!toolCalls) return [];

  return toolCalls.map(tc => ({
    id: tc.id,
    name: tc.name,
    status: tc.status,
    description: tc.description,
    duration: undefined, // Would need to track timing
    result: tc.result,
    error: tc.error,
  }));
}

/**
 * SmartAgentMessage - Renders messages with intelligent formatting
 */
export const SmartAgentMessage = memo(function SmartAgentMessage({
  role,
  content,
  timestamp,
  toolCalls,
  agentName,
  viewportCommands: metadataViewportCommands,
  isStreaming = false,
  agentPhase,
  currentTask,
  useTravelTheme = true, // Default to travel theme
  className,
}: SmartAgentMessageProps) {
  // Parse the content to extract structured data
  const parsedData = useMemo(() => {
    if (role !== 'assistant') {
      return { reasoning: undefined, mainContent: content, viewportCommands: [], isIncompleteJson: false };
    }
    return parseAgentResponse(content, isStreaming);
  }, [role, content, isStreaming]);

  // Determine if we should use the rich agent card
  const useAgentCard = useMemo(() => {
    return shouldUseAgentCard(role, content, toolCalls, agentName, agentPhase, isStreaming);
  }, [role, content, toolCalls, agentName, agentPhase, isStreaming]);

  // Combine viewport commands from parsing and metadata
  const allViewportCommands = useMemo(() => {
    const commands = [...parsedData.viewportCommands];
    if (metadataViewportCommands) {
      commands.push(...metadataViewportCommands);
    }
    return commands;
  }, [parsedData.viewportCommands, metadataViewportCommands]);

  // If we detected incomplete JSON during streaming, show thinking state
  // This prevents raw JSON from being displayed to users
  if (parsedData.isIncompleteJson && isStreaming) {
    // Use travel theme for streaming state if enabled
    if (useTravelTheme && useAgentCard) {
      return (
        <div className={className}>
          <TravelAgentMessage
            content=""
            reasoning={undefined}
            toolCalls={convertToTravelToolCalls(toolCalls)}
            agentName={agentName}
            agentPhase={agentPhase}
            isStreaming={true}
            timestamp={timestamp}
          />
        </div>
      );
    }
    return (
      <div className={className}>
        <AgentResponseCard
          content=""
          reasoning={undefined}
          toolCalls={convertToolCalls(toolCalls)}
          agentName={agentName}
          viewportCommands={allViewportCommands}
          isStreaming={true}
          timestamp={timestamp}
          agentPhase={agentPhase}
          currentTask={currentTask}
        />
      </div>
    );
  }

  // Use simple MessageBubble for user messages or simple assistant messages
  if (!useAgentCard) {
    return (
      <MessageBubble
        role={role}
        content={content}
        timestamp={timestamp}
        isStreaming={isStreaming}
        className={className}
      />
    );
  }

  // Use travel-themed TravelAgentMessage if enabled
  if (useTravelTheme) {
    // If mainContent is empty but we have userResponse, use that as content
    const displayContent = parsedData.mainContent || parsedData.reasoning?.userResponse || '';

    return (
      <div className={className}>
        <TravelAgentMessage
          content={displayContent}
          reasoning={parsedData.reasoning?.reasoning}
          nextAgent={parsedData.reasoning?.nextAgent}
          taskForAgent={parsedData.reasoning?.taskForAgent}
          toolCalls={convertToTravelToolCalls(toolCalls)}
          agentName={agentName}
          agentPhase={agentPhase}
          isStreaming={isStreaming}
          timestamp={timestamp}
        />
      </div>
    );
  }

  // Use rich AgentResponseCard for complex agent responses (fallback)
  return (
    <div className={className}>
      <AgentResponseCard
        content={parsedData.mainContent}
        reasoning={parsedData.reasoning}
        toolCalls={convertToolCalls(toolCalls)}
        agentName={agentName}
        viewportCommands={allViewportCommands}
        isStreaming={isStreaming}
        timestamp={timestamp}
        agentPhase={agentPhase}
        currentTask={currentTask}
      />
    </div>
  );
});

export default SmartAgentMessage;
