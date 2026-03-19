"use client";

/**
 * TamboAgentMessage - Bridge between Tambo messages and TravelAgentMessage
 *
 * Maps TamboThreadMessage content types to TravelAgentMessage props:
 * - TextContent → content
 * - message.reasoning → reasoning (CaptainsLog)
 * - TamboToolUseContent → toolCalls (DestinationsVisited)
 * - ToolResultContent → discoveries (DiscoveryCards)
 *
 * Derives agentPhase from message state for JourneyProgressBar visualization.
 */

import { memo, useMemo } from "react";
import type {
  TamboThreadMessage,
  Content,
  TamboToolUseContent,
} from "@tambo-ai/react";
import { ComponentRenderer } from "@tambo-ai/react";
import {
  TravelAgentMessage,
  type TravelToolCall,
  type TravelDiscovery,
} from "../travel/TravelAgentMessage";
import type { DiscoveryCardProps } from "../travel/DiscoveryCard";
import { useAutoActivation } from "@/hooks/useAutoActivation";

// ============================================
// Types
// ============================================

export type AgentPhase =
  | "idle"
  | "thinking"
  | "reasoning"
  | "tool_calling"
  | "tool_executing"
  | "synthesizing"
  | "responding";

export interface TamboAgentMessageProps {
  /** The Tambo thread message to render */
  message: TamboThreadMessage;
  /** Thread ID for component rendering */
  threadId: string;
  /** Whether this message is currently streaming */
  isStreaming?: boolean;
  /** Whether there are messages after this one (affects phase derivation) */
  hasNextMessage?: boolean;
  /** Optional className */
  className?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Derive agent phase from message state
 */
function deriveAgentPhase(
  message: TamboThreadMessage,
  isStreaming: boolean,
): AgentPhase {
  const hasReasoning = message.reasoning && message.reasoning.length > 0;
  const toolUses = message.content.filter(
    (c): c is TamboToolUseContent => c.type === "tool_use",
  );
  const hasToolCalls = toolUses.length > 0;
  const allToolsComplete = toolUses.every((t) => t.hasCompleted);
  const hasContent = message.content.some(
    (c) => c.type === "text" && "text" in c && c.text,
  );

  // If we have final text content and not streaming, we're done
  if (!isStreaming && hasContent) return "responding";

  // If tools are running
  if (hasToolCalls && !allToolsComplete) return "tool_executing";

  // If tools completed but still streaming (synthesizing response)
  if (hasToolCalls && allToolsComplete && isStreaming) return "synthesizing";

  // If we have reasoning and still streaming
  if (hasReasoning && isStreaming) return "reasoning";

  // If streaming but no other indicators
  if (isStreaming) return "thinking";

  return "idle";
}

/**
 * Extract text content from message
 */
function extractTextContent(message: TamboThreadMessage): string {
  return message.content
    .filter(
      (c): c is Content & { type: "text"; text: string } => c.type === "text",
    )
    .map((c) => c.text)
    .join("\n")
    .trim();
}

/**
 * Extract reasoning from message
 */
function extractReasoning(message: TamboThreadMessage): string | undefined {
  if (!message.reasoning || message.reasoning.length === 0) {
    return undefined;
  }
  return message.reasoning.join("\n");
}

/**
 * Convert TamboToolUseContent to TravelToolCall
 */
function convertToolCalls(message: TamboThreadMessage): TravelToolCall[] {
  const toolUses = message.content.filter(
    (c): c is TamboToolUseContent => c.type === "tool_use",
  );

  return toolUses.map((toolUse) => {
    // Determine status based on hasCompleted
    let status: TravelToolCall["status"] = "pending";
    if (toolUse.hasCompleted) {
      status = "success"; // Could check for errors if available
    } else {
      status = "running";
    }

    return {
      id: toolUse.id,
      name: toolUse.name,
      status,
      description: toolUse.statusMessage,
    };
  });
}

/**
 * Extract discoveries from tool results
 */
function extractDiscoveries(message: TamboThreadMessage): TravelDiscovery[] {
  const discoveries: TravelDiscovery[] = [];

  // Find tool_result content blocks
  const toolResults = message.content.filter((c) => c.type === "tool_result");

  // Find corresponding tool_use blocks for naming
  const toolUses = message.content.filter(
    (c): c is TamboToolUseContent => c.type === "tool_use",
  );

  for (const result of toolResults) {
    if (!("tool_use_id" in result) || !("content" in result)) continue;

    const toolUseId = result.tool_use_id as string;
    const matchingTool = toolUses.find((t) => t.id === toolUseId);
    const toolName = matchingTool?.name || "unknown";

    // Parse result content
    let resultData: unknown = result.content;
    if (typeof result.content === "string") {
      try {
        resultData = JSON.parse(result.content);
      } catch {
        // Keep as string
      }
    }

    // Determine discovery type based on tool name
    let discoveryType: DiscoveryCardProps["type"] = "general";
    if (toolName.includes("carbon") || toolName.includes("sustainability")) {
      discoveryType = "carbon";
    } else if (toolName.includes("boq") || toolName.includes("quantity")) {
      discoveryType = "boq";
    } else if (toolName.includes("clash")) {
      discoveryType = "clash";
    } else if (toolName.includes("query") || toolName.includes("element")) {
      discoveryType = "query";
    }

    // Create discovery entry
    discoveries.push({
      id: toolUseId,
      title: formatToolName(toolName),
      toolName,
      type: discoveryType,
      summary: generateSummary(resultData, discoveryType),
      content:
        typeof resultData === "object"
          ? JSON.stringify(resultData, null, 2)
          : String(resultData),
    });
  }

  return discoveries;
}

/**
 * Format tool name for display
 */
function formatToolName(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Generate summary from result data
 */
function generateSummary(
  data: unknown,
  type: DiscoveryCardProps["type"],
): string {
  if (!data || typeof data !== "object") {
    return "Analysis complete";
  }

  const obj = data as Record<string, unknown>;

  switch (type) {
    case "carbon":
      if ("totalCarbon" in obj) {
        return `Total: ${obj.totalCarbon} ${obj.unit || "kgCO2e"}`;
      }
      break;
    case "boq":
      if ("items" in obj && Array.isArray(obj.items)) {
        return `${obj.items.length} items found`;
      }
      break;
    case "clash":
      if ("clashes" in obj && Array.isArray(obj.clashes)) {
        return `${obj.clashes.length} clashes detected`;
      }
      break;
    case "query":
      if ("elements" in obj && Array.isArray(obj.elements)) {
        return `${obj.elements.length} elements found`;
      }
      break;
  }

  if ("success" in obj) {
    return obj.success ? "Completed successfully" : "Failed";
  }

  return "Analysis complete";
}

/**
 * Check if message has any component content that needs special rendering
 */
function hasComponentContent(message: TamboThreadMessage): boolean {
  return message.content.some((c) => c.type === "component");
}

// ============================================
// Main Component
// ============================================

export const TamboAgentMessage = memo(function TamboAgentMessage({
  message,
  threadId,
  isStreaming = false,
  className,
}: TamboAgentMessageProps) {
  // Extract and transform message data
  const content = useMemo(() => extractTextContent(message), [message]);
  const reasoning = useMemo(() => extractReasoning(message), [message]);
  const toolCalls = useMemo(() => convertToolCalls(message), [message]);
  const discoveries = useMemo(() => extractDiscoveries(message), [message]);
  const agentPhase = useMemo(
    () => deriveAgentPhase(message, isStreaming),
    [message, isStreaming],
  );

  // Extract tool use content for auto-activation
  // ★ Insight ─────────────────────────────────────
  // Auto-activation monitors tool completions to automatically switch
  // to the relevant panel (e.g., carbon-dashboard when analyze_carbon completes).
  // This creates a ChatGPT Canvas-like experience.
  // ─────────────────────────────────────────────────
  const toolUseContents = useMemo(() => {
    return message.content.filter(
      (c): c is TamboToolUseContent => c.type === "tool_use",
    );
  }, [message.content]);

  // Auto-activate panels based on completed tool results
  useAutoActivation(toolUseContents, isStreaming);

  // Parse timestamp
  const timestamp = useMemo(() => {
    if (message.createdAt) {
      return new Date(message.createdAt);
    }
    return undefined;
  }, [message.createdAt]);

  // Render component content blocks separately (HITL components)
  const componentBlocks = useMemo(() => {
    return message.content.filter((c) => c.type === "component");
  }, [message.content]);

  return (
    <div className={className}>
      {/* Travel-themed agent visualization */}
      <TravelAgentMessage
        content={content}
        reasoning={reasoning}
        toolCalls={toolCalls}
        discoveries={discoveries}
        agentPhase={agentPhase}
        isStreaming={isStreaming}
        timestamp={timestamp}
        showProgressBar={true}
      />

      {/* Render any HITL/generative UI components */}
      {componentBlocks.map((componentContent, index) => (
        <div
          key={
            "id" in componentContent
              ? componentContent.id
              : `component-${index}`
          }
          className="mt-3"
        >
          <ComponentRenderer
            content={componentContent}
            threadId={threadId}
            messageId={message.id}
            fallback={
              <div className="text-muted-foreground text-sm">
                Loading component...
              </div>
            }
          />
        </div>
      ))}
    </div>
  );
});

export default TamboAgentMessage;
