/**
 * Chat API Route
 *
 * Handles streaming chat with the BIM Agent
 * Supports Server-Sent Events for real-time responses
 * Supports both authenticated users and anonymous sessions
 *
 * === GENERATIVE UI SUPPORT ===
 * This route now streams comprehensive agent activity events:
 * - thinking: Agent started processing
 * - agent_change: Active specialist agent changed
 * - tool_call_start: Tool execution began
 * - tool_call_complete: Tool execution finished (success/error)
 * - ui_component: Generative UI component to render inline
 * - hitl_request: Human-in-the-loop request requiring user input
 * - token: Streaming text content
 * - ui_command: Viewport/analytics commands
 * - done: Processing complete with final metadata
 * - error: Error occurred
 */

import { NextRequest, NextResponse } from 'next/server';
import { HumanMessage } from '@langchain/core/messages';
import { createBIMAgent } from '@/lib/agent/graph';
import { validateLLMConfig } from '@/lib/agent/llm';
import { getUser } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';
import { expensiveRateLimiter, validateCSRFToken } from '@/lib/security';
import type { GenerativeUIComponent, ToolCallVisualization } from '@/lib/generative-ui/types';
import { createHITLChoice, type HITLRequestEvent } from '@/lib/hitl/types';

// ============================================
// HITL Helper Function (internal only)
// ============================================

/**
 * Emit HITL request to SSE stream
 */
function emitHITLRequest(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  request: HITLRequestEvent
): void {
  controller.enqueue(
    encoder.encode(
      `data: ${JSON.stringify({
        type: 'hitl_request',
        request,
      })}\n\n`
    )
  );
}

// Ensure streaming responses work properly
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Transform tool results to GenerativeUIComponent for rich display
 */
function transformToolResultToUIComponent(
  toolName: string,
  result: unknown,
  toolCallId: string
): GenerativeUIComponent | null {
  // Skip if no result or result is empty
  if (!result || (typeof result === 'object' && Object.keys(result as object).length === 0)) {
    return null;
  }

  const timestamp = new Date().toISOString();

  switch (toolName) {
    case 'analyzeCarbon':
    case 'analyze_carbon':
    case 'carbon_analysis':
      return {
        id: `carbon-${toolCallId}`,
        type: 'bim.CarbonResultCard',
        props: { result },
        zone: 'analysis',
        metadata: { timestamp, toolName },
      };

    case 'detectClashes':
    case 'detect_clashes':
    case 'clash_detection':
      return {
        id: `clash-${toolCallId}`,
        type: 'bim.ClashResultCard',
        props: { result },
        zone: 'analysis',
        metadata: { timestamp, toolName },
      };

    case 'checkCompliance':
    case 'check_compliance':
    case 'compliance_check':
      return {
        id: `compliance-${toolCallId}`,
        type: 'bim.ComplianceCard',
        props: { result },
        zone: 'analysis',
        metadata: { timestamp, toolName },
      };

    case 'queryElements':
    case 'query_elements':
    case 'queryElementsByType':
      return {
        id: `elements-${toolCallId}`,
        type: 'bim.ElementListCard',
        props: { result },
        zone: 'data',
        metadata: { timestamp, toolName },
      };

    case 'generateBOQ':
    case 'generate_boq':
      return {
        id: `boq-${toolCallId}`,
        type: 'bim.BOQTable',
        props: { result },
        zone: 'data',
        metadata: { timestamp, toolName },
      };

    default:
      // For unknown tools, return a generic data card if result has data
      if (typeof result === 'object' && result !== null) {
        return {
          id: `tool-result-${toolCallId}`,
          type: 'bim.ToolResultCard',
          props: { toolName, result },
          zone: 'data',
          metadata: { timestamp, toolName },
        };
      }
      return null;
  }
}

/**
 * Get human-readable description for agent
 */
function getAgentDescription(agentName: string): string {
  const descriptions: Record<string, string> = {
    spatial: 'Analyze geometry, spatial relationships, and element properties',
    sustainability: 'Calculate carbon footprint, energy analysis, and environmental impact',
    floor_plan: 'Optimize circulation, space efficiency, and egress routes',
    mep: 'Analyze mechanical, electrical, and plumbing systems',
    planner: 'Create detailed execution plan for complex multi-step tasks',
  };
  return descriptions[agentName] || `Analyze using ${agentName} specialist`;
}

/**
 * Get human-readable description for tool
 */
function getToolDescription(toolName: string): string {
  const descriptions: Record<string, string> = {
    analyzeCarbon: 'Calculating carbon footprint...',
    analyze_carbon: 'Calculating carbon footprint...',
    carbon_analysis: 'Analyzing carbon emissions...',
    detectClashes: 'Detecting element clashes...',
    detect_clashes: 'Running clash detection...',
    clash_detection: 'Analyzing spatial conflicts...',
    checkCompliance: 'Checking code compliance...',
    check_compliance: 'Verifying regulations...',
    compliance_check: 'Running compliance checks...',
    queryElements: 'Querying building elements...',
    query_elements: 'Searching model elements...',
    queryElementsByType: 'Finding elements by type...',
    generateBOQ: 'Generating bill of quantities...',
    generate_boq: 'Creating quantity takeoff...',
  };
  return descriptions[toolName] || `Running ${toolName}...`;
}

/**
 * POST /api/chat
 *
 * Request body:
 * {
 *   message: string;
 *   conversationId?: string;
 *   projectContext?: object;
 *   anonymousSessionId?: string;  // For anonymous users
 *   hitlResponse?: {              // Response to pending HITL request
 *     requestId: string;
 *     accepted: boolean;
 *     data?: unknown;
 *   };
 * }
 *
 * SSE Events:
 * - { type: 'thinking', agent: string }
 * - { type: 'agent_change', agent: string, task?: string }
 * - { type: 'tool_call_start', toolCall: ToolCallVisualization }
 * - { type: 'tool_call_complete', toolCall: ToolCallVisualization }
 * - { type: 'ui_component', component: GenerativeUIComponent }
 * - { type: 'hitl_request', request: HITLRequestEvent }
 * - { type: 'token', content: string }
 * - { type: 'ui_command', command: UICommand }
 * - { type: 'done', conversationId: string, metadata: { toolCalls, uiComponents } }
 * - { type: 'error', message: string }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let anonymousSessionId: string | null = null;
  let isAnonymous = false;

  try {
    // Apply rate limiting (10 requests per 5 minutes for expensive operations)
    const rateLimitError = await expensiveRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // Validate CSRF token
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    // Check for authenticated user
    const user = await getUser();

    // Parse request body
    const body = await request.json();
    const { message, conversationId, projectContext } = body;
    anonymousSessionId = body.anonymousSessionId || null;

    // Check if auth is disabled (development mode)
    const authDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

    // Determine if anonymous or authenticated
    // In dev mode with auth disabled, treat as authenticated
    isAnonymous = !user && !!anonymousSessionId && !authDisabled;

    // Require either auth, anonymous session, or dev mode
    if (!user && !anonymousSessionId && !authDisabled) {
      return NextResponse.json(
        { error: 'Authentication or anonymous session required' },
        { status: 401 }
      );
    }

    // Validate LLM configuration
    const configValidation = validateLLMConfig();
    if (!configValidation.valid) {
      return NextResponse.json(
        { error: 'LLM configuration error', details: configValidation.errors },
        { status: 500 }
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Validate message length to prevent abuse
    const MAX_MESSAGE_LENGTH = 10000;
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.` },
        { status: 400 }
      );
    }

    // Create or use existing conversation ID (thread ID for LangGraph)
    const threadId = conversationId || nanoid();

    // Create agent instance
    const agent = createBIMAgent();

    // Prepare initial state
    const input = {
      messages: [new HumanMessage(message)],
      projectContext: projectContext || {},
    };

    // Configuration for this run
    const config = {
      configurable: {
        thread_id: threadId,
      },
    };

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Track sent content to avoid duplicates
          const sentContents = new Set<string>();
          let isFirstResponse = true;

          // Track ALL streamed content (not per-node) for global deduplication
          let allStreamedContent = '';

          // Track all tool calls and UI components for final metadata
          const accumulatedToolCalls: ToolCallVisualization[] = [];
          const accumulatedUIComponents: GenerativeUIComponent[] = [];
          const accumulatedHITLRequests: HITLRequestEvent[] = [];

          // Track active tool calls by run_id
          const activeToolCalls = new Map<string, ToolCallVisualization>();

          // Track current agent for agent_change events
          let currentAgent: string | null = null;

          // Helper to emit and track HITL requests
          const emitAndTrackHITL = (request: HITLRequestEvent) => {
            accumulatedHITLRequests.push(request);
            emitHITLRequest(controller, encoder, request);
          };

          // Use streamMode: "messages" for proper LLM token streaming (recommended by LangGraph.js)
          // This provides [message, metadata] tuples as tokens are generated
          // We also need streamEvents for tool call visualization, so we'll use both approaches

          // First, send thinking indicator immediately
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'thinking',
                agent: 'supervisor',
              })}\n\n`
            )
          );

          // Use streamEvents for comprehensive event handling (tools, agent changes, etc.)
          const eventStream = await agent.streamEvents(input, {
            ...config,
            version: 'v2',
          });

          // Track which nodes have already output content to prevent duplicates
          const processedNodeOutputs = new Set<string>();
          // Track accumulated content for each node to handle streaming properly
          const nodeContentBuffers = new Map<string, string>();
          // Track emitted message content by hash to prevent duplicate emissions across all nodes
          const emittedMessageHashes = new Set<string>();

          // Helper to create a simple hash of content for deduplication
          const hashContent = (content: string): string => {
            // Remove common prefixes and normalize for comparison
            const normalized = content
              .replace(/^\*\*[^*]+\*\*[\s\n]*/, '') // Remove **Title:** prefix
              .trim()
              .slice(0, 200); // Use first 200 chars as hash key
            return normalized;
          };

          for await (const event of eventStream) {
            // Handle different event types
            switch (event.event) {
              // ========================================
              // CHAT MODEL EVENTS
              // ========================================
              case 'on_chat_model_start':
                // Thinking indicator already sent
                break;

              case 'on_chat_model_stream':
                // Stream individual tokens for real-time response
                if (event.data?.chunk?.content) {
                  const chunk = event.data.chunk.content;
                  const currentNode = event.metadata?.langgraph_node;

                  // For supervisor node, accumulate tokens to parse JSON later
                  if (currentNode === 'supervisor') {
                    const currentBuffer = nodeContentBuffers.get('supervisor') || '';
                    nodeContentBuffers.set('supervisor', currentBuffer + chunk);
                    // Don't stream supervisor tokens - they're JSON that needs parsing
                    break;
                  }

                  // For specialist nodes, stream tokens directly (they output clean text)
                  // Also track what we've streamed to prevent on_chain_end from re-emitting
                  if (typeof chunk === 'string' && chunk.length > 0) {
                    // Accumulate streamed content per node to track what's been sent
                    const streamKey = `stream-${currentNode}`;
                    const streamedSoFar = nodeContentBuffers.get(streamKey) || '';
                    nodeContentBuffers.set(streamKey, streamedSoFar + chunk);

                    // ALSO accumulate to global streamed content for deduplication
                    allStreamedContent += chunk;

                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'stream',
                          content: chunk,
                        })}\n\n`
                      )
                    );
                    isFirstResponse = false;
                  }
                }
                break;

              case 'on_chat_model_end':
                // When the LLM finishes, check if it was supervisor and extract userResponse
                {
                  const currentNode = event.metadata?.langgraph_node;

                  // For specialist nodes, mark streamed content hash to prevent on_chain_end duplicate
                  const streamingNodes = ['spatial', 'sustainability', 'floor_plan', 'mep', 'planner', 'error_handler'];
                  if (streamingNodes.includes(currentNode)) {
                    // The content we streamed is in allStreamedContent
                    // Add its hash to prevent on_chain_end from re-emitting
                    if (allStreamedContent.length > 50) {
                      emittedMessageHashes.add(hashContent(allStreamedContent));
                      // Also add with potential prefix (in case the message has a prefix)
                      const nodePrefix = currentNode === 'sustainability' ? '**Sustainability Analysis:**\n\n' :
                                        currentNode === 'spatial' ? '**Spatial Analysis:**\n\n' :
                                        currentNode === 'floor_plan' ? '**Floor Plan Analysis:**\n\n' :
                                        currentNode === 'mep' ? '**MEP Analysis:**\n\n' :
                                        currentNode === 'planner' ? '**Planning:**\n\n' : '';
                      if (nodePrefix) {
                        emittedMessageHashes.add(hashContent(nodePrefix + allStreamedContent));
                      }
                    }
                  }

                  if (currentNode === 'supervisor') {
                    const fullContent = nodeContentBuffers.get('supervisor') || '';
                    nodeContentBuffers.delete('supervisor');

                    if (fullContent) {
                      try {
                        // Try to extract JSON and get userResponse
                        const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                          const parsed = JSON.parse(jsonMatch[0]);
                          // If supervisor is completing with userResponse, stream it
                          if (parsed.nextAgent === 'COMPLETE' && parsed.userResponse) {
                            const userResponse = parsed.userResponse;
                            if (userResponse && !sentContents.has(userResponse)) {
                              sentContents.add(userResponse);
                              controller.enqueue(
                                encoder.encode(
                                  `data: ${JSON.stringify({
                                    type: 'token',
                                    content: userResponse,
                                  })}\n\n`
                                )
                              );
                              isFirstResponse = false;
                            }
                          }
                        }
                      } catch {
                        // Not valid JSON - might be a direct response
                        // Send as-is if it doesn't look like JSON
                        if (!fullContent.startsWith('{') && fullContent.trim()) {
                          if (!sentContents.has(fullContent)) {
                            sentContents.add(fullContent);
                            controller.enqueue(
                              encoder.encode(
                                `data: ${JSON.stringify({
                                  type: 'token',
                                  content: fullContent,
                                })}\n\n`
                              )
                            );
                            isFirstResponse = false;
                          }
                        }
                      }
                    }
                  }
                }
                break;

              // ========================================
              // TOOL EVENTS - For Generative UI
              // ========================================
              case 'on_tool_start':
                {
                  const toolCallId = event.run_id || nanoid();
                  const toolName = event.name || 'unknown_tool';

                  const toolCall: ToolCallVisualization = {
                    id: toolCallId,
                    name: toolName,
                    status: 'running',
                    startedAt: new Date(),
                    arguments: event.data?.input,
                    description: getToolDescription(toolName),
                  };

                  // Track active tool call
                  activeToolCalls.set(toolCallId, toolCall);

                  // Stream tool_call_start event
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'tool_call_start',
                        toolCall: {
                          ...toolCall,
                          startedAt: toolCall.startedAt?.toISOString(),
                        },
                      })}\n\n`
                    )
                  );
                }
                break;

              case 'on_tool_end':
                {
                  const toolCallId = event.run_id || '';
                  const toolName = event.name || 'unknown_tool';
                  const result = event.data?.output;

                  // Get or create tool call record
                  let toolCall = activeToolCalls.get(toolCallId);
                  if (!toolCall) {
                    toolCall = {
                      id: toolCallId,
                      name: toolName,
                      status: 'success',
                      startedAt: new Date(),
                    };
                  }

                  // Update tool call with completion info
                  toolCall.status = 'success';
                  toolCall.completedAt = new Date();
                  toolCall.result = result;

                  // Remove from active, add to accumulated
                  activeToolCalls.delete(toolCallId);
                  accumulatedToolCalls.push(toolCall);

                  // Stream tool_call_complete event
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'tool_call_complete',
                        toolCall: {
                          ...toolCall,
                          startedAt: toolCall.startedAt?.toISOString(),
                          completedAt: toolCall.completedAt?.toISOString(),
                        },
                      })}\n\n`
                    )
                  );

                  // Transform tool result to UI component and stream it
                  const uiComponent = transformToolResultToUIComponent(
                    toolName,
                    result,
                    toolCallId
                  );

                  if (uiComponent) {
                    accumulatedUIComponents.push(uiComponent);

                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'ui_component',
                          component: uiComponent,
                        })}\n\n`
                      )
                    );
                  }
                }
                break;

              case 'on_tool_error':
                {
                  const toolCallId = event.run_id || '';
                  const toolName = event.name || 'unknown_tool';
                  const errorMessage = event.data?.error?.message || 'Tool execution failed';

                  // Get or create tool call record
                  let toolCall = activeToolCalls.get(toolCallId);
                  if (!toolCall) {
                    toolCall = {
                      id: toolCallId,
                      name: toolName,
                      status: 'error',
                      startedAt: new Date(),
                    };
                  }

                  // Update with error info
                  toolCall.status = 'error';
                  toolCall.completedAt = new Date();
                  toolCall.error = errorMessage;

                  // Remove from active, add to accumulated
                  activeToolCalls.delete(toolCallId);
                  accumulatedToolCalls.push(toolCall);

                  // Stream tool error event
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'tool_call_complete',
                        toolCall: {
                          ...toolCall,
                          startedAt: toolCall.startedAt?.toISOString(),
                          completedAt: toolCall.completedAt?.toISOString(),
                        },
                      })}\n\n`
                    )
                  );
                }
                break;

              // ========================================
              // CHAIN EVENTS - Agent State & Messages
              // ========================================
              case 'on_chain_start':
                {
                  // Get the node name from event.name or metadata
                  // LangGraph emits on_chain_start with the node name when a node begins execution
                  const nodeName = event.name;
                  const langgraphNode = event.metadata?.langgraph_node;

                  // Known agent node names from our graph
                  const agentNodes = ['supervisor', 'spatial', 'sustainability', 'floor_plan', 'mep', 'planner', 'error_handler'];

                  // Check if this is an agent node (not LangGraph, __start__, ChannelWrite, etc.)
                  const isAgentNode = agentNodes.includes(nodeName) || agentNodes.includes(langgraphNode);
                  const newAgent = isAgentNode ? (nodeName || langgraphNode) : null;

                  if (newAgent && newAgent !== currentAgent) {
                    currentAgent = newAgent;

                    // Get task from graph state if available
                    const task = event.data?.input?.currentTask || null;

                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'agent_change',
                          agent: newAgent,
                          task,
                        })}\n\n`
                      )
                    );
                  }
                }
                break;

              case 'on_chain_end':
                // Extract the final AI message from the chain output
                // IMPORTANT: We need to handle this carefully to avoid duplicates
                // - Supervisor messages: handled in on_chat_model_end, skip here
                // - Specialist messages: already streamed via on_chat_model_stream, skip here
                // - Only emit if content was NOT already streamed
                {
                  const nodeName = event.name;
                  const langgraphNode = event.metadata?.langgraph_node;
                  const outputKey = `${nodeName || langgraphNode}-output`;

                  // Skip if we've already processed this node's output
                  if (processedNodeOutputs.has(outputKey)) {
                    break;
                  }

                  // Check if this node's content was already streamed
                  // We track streamed content with 'stream-{nodeName}' keys
                  const streamKey = `stream-${langgraphNode || nodeName}`;
                  const alreadyStreamedContent = nodeContentBuffers.get(streamKey);

                  // List of known agent/specialist nodes that stream their content
                  const streamingNodes = ['spatial', 'sustainability', 'floor_plan', 'mep', 'planner', 'error_handler'];
                  const isStreamingNode = streamingNodes.includes(langgraphNode) || streamingNodes.includes(nodeName);

                  // If this node already streamed content, mark as processed and skip
                  if (isStreamingNode && alreadyStreamedContent) {
                    processedNodeOutputs.add(outputKey);
                    // Also add the full message to sentContents to prevent any further duplicates
                    sentContents.add(alreadyStreamedContent);
                    break;
                  }

                  if (event.data?.output?.messages) {
                    const messages = event.data.output.messages;
                    for (const msg of messages) {
                      // Only process AI messages (the actual response)
                      if (msg._getType?.() === 'ai' || msg.type === 'ai') {
                        let content = typeof msg.content === 'string' ? msg.content : '';

                        // Skip empty content
                        if (!content || content.trim() === '') {
                          continue;
                        }

                        // CRITICAL FIX: Use hash-based deduplication FIRST
                        // This prevents the same message from being emitted across different node completions
                        const contentHash = hashContent(content);
                        if (emittedMessageHashes.has(contentHash)) {
                          continue;
                        }

                        // Check if this is a supervisor JSON response (skip internal JSON)
                        if (content.startsWith('{') && content.includes('"reasoning"')) {
                          try {
                            const jsonMatch = content.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                              const parsed = JSON.parse(jsonMatch[0]);
                              if (parsed.userResponse && typeof parsed.userResponse === 'string') {
                                content = parsed.userResponse;
                              } else {
                                // Skip internal JSON without userResponse
                                continue;
                              }
                            }
                          } catch {
                            // Not valid JSON, skip
                            continue;
                          }
                        }

                        // CRITICAL: Check if content overlaps with GLOBAL streamed content
                        // This catches cases where wrapped message (with prefix) contains streamed content
                        // Example: "**Sustainability Analysis:**\n\nReducing..." contains "Reducing..."
                        const strippedContent = content.replace(/^\*\*[^*]+\*\*[\s\n]*/, '').trim();
                        const streamedTrimmed = allStreamedContent.trim();

                        const contentOverlapsWithStreamed = streamedTrimmed.length > 50 && (
                          // Direct containment
                          content.includes(streamedTrimmed) ||
                          streamedTrimmed.includes(content) ||
                          // Stripped content matches streamed
                          strippedContent === streamedTrimmed ||
                          // First 100 chars match (handles slight variations)
                          strippedContent.slice(0, 100) === streamedTrimmed.slice(0, 100)
                        );

                        if (contentOverlapsWithStreamed) {
                          emittedMessageHashes.add(contentHash);
                          processedNodeOutputs.add(outputKey);
                          continue;
                        }

                        // Check if content overlaps with node-specific streamed content
                        const contentIsAlreadyStreamed = alreadyStreamedContent &&
                          (content.includes(alreadyStreamedContent) || alreadyStreamedContent.includes(content));

                        if (contentIsAlreadyStreamed) {
                          emittedMessageHashes.add(contentHash);
                          processedNodeOutputs.add(outputKey);
                          continue;
                        }

                        // Skip if already sent (exact match)
                        if (content && !sentContents.has(content)) {
                          emittedMessageHashes.add(contentHash);
                          processedNodeOutputs.add(outputKey);
                          sentContents.add(content);
                          controller.enqueue(
                            encoder.encode(
                              `data: ${JSON.stringify({
                                type: 'token',
                                content: content,
                              })}\n\n`
                            )
                          );
                          isFirstResponse = false;
                        }
                      }
                    }
                  }
                }

                // Check for UI commands in state (viewport control)
                if (event.data?.output?.uiCommands) {
                  for (const cmd of event.data.output.uiCommands) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'ui_command',
                          command: cmd,
                        })}\n\n`
                      )
                    );
                  }
                }

                // Check for complexity analysis that suggests HITL
                // Emit HITL choice request for complex queries that might benefit from clarification
                const complexityAnalysis = event.data?.output?.complexityAnalysis;
                if (complexityAnalysis && !accumulatedHITLRequests.some(r => r.requestId.includes('complexity'))) {
                  // Emit HITL for high-complexity queries where user input would help
                  // Score > 0.6 and route is 'plan' suggests the query is ambiguous
                  if (complexityAnalysis.route === 'plan' && complexityAnalysis.score > 0.6) {
                    const suggestedAgents = complexityAnalysis.suggestedAgents || [];
                    if (suggestedAgents.length > 1) {
                      // Create HITL choice for user to pick the primary focus
                      const hitlRequest = createHITLChoice(
                        {
                          question: 'This is a complex request. Which aspect would you like me to focus on first?',
                          options: suggestedAgents.slice(0, 4).map((agent: string, index: number) => ({
                            id: agent,
                            label: agent.charAt(0).toUpperCase() + agent.slice(1).replace('_', ' '),
                            description: getAgentDescription(agent),
                            recommended: index === 0,
                          })),
                          submitLabel: 'Focus on this',
                        },
                        {
                          agentName: 'supervisor',
                          operation: 'complexity_routing',
                        }
                      );
                      // Override requestId to include 'complexity' for dedup check
                      hitlRequest.requestId = `hitl-complexity-${Date.now()}`;
                      emitAndTrackHITL(hitlRequest);
                    }
                  }
                }

                // Check for analysis results that should become UI components
                if (event.data?.output?.analysisResults) {
                  const results = event.data.output.analysisResults;

                  // Carbon analysis results
                  if (results.carbonData && !accumulatedUIComponents.some(c => c.type === 'bim.CarbonResultCard')) {
                    const carbonComponent: GenerativeUIComponent = {
                      id: `carbon-analysis-${Date.now()}`,
                      type: 'bim.CarbonResultCard',
                      props: { result: results.carbonData },
                      zone: 'analysis',
                      metadata: { timestamp: new Date().toISOString(), agent: currentAgent || 'sustainability' },
                    };
                    accumulatedUIComponents.push(carbonComponent);

                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'ui_component',
                          component: carbonComponent,
                        })}\n\n`
                      )
                    );
                  }

                  // Clash detection results
                  if (results.clashData && !accumulatedUIComponents.some(c => c.type === 'bim.ClashResultCard')) {
                    const clashComponent: GenerativeUIComponent = {
                      id: `clash-analysis-${Date.now()}`,
                      type: 'bim.ClashResultCard',
                      props: { result: results.clashData },
                      zone: 'analysis',
                      metadata: { timestamp: new Date().toISOString(), agent: currentAgent || 'mep' },
                    };
                    accumulatedUIComponents.push(clashComponent);

                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'ui_component',
                          component: clashComponent,
                        })}\n\n`
                      )
                    );
                  }

                  // Compliance results
                  if (results.complianceData && !accumulatedUIComponents.some(c => c.type === 'bim.ComplianceCard')) {
                    const complianceComponent: GenerativeUIComponent = {
                      id: `compliance-analysis-${Date.now()}`,
                      type: 'bim.ComplianceCard',
                      props: { result: results.complianceData },
                      zone: 'analysis',
                      metadata: { timestamp: new Date().toISOString(), agent: currentAgent || 'floor_plan' },
                    };
                    accumulatedUIComponents.push(complianceComponent);

                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'ui_component',
                          component: complianceComponent,
                        })}\n\n`
                      )
                    );
                  }

                  // Element data results
                  if (results.elementData && !accumulatedUIComponents.some(c => c.type === 'bim.ElementListCard')) {
                    const elementComponent: GenerativeUIComponent = {
                      id: `element-data-${Date.now()}`,
                      type: 'bim.ElementListCard',
                      props: { result: results.elementData },
                      zone: 'data',
                      metadata: { timestamp: new Date().toISOString(), agent: currentAgent || 'spatial' },
                    };
                    accumulatedUIComponents.push(elementComponent);

                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'ui_component',
                          component: elementComponent,
                        })}\n\n`
                      )
                    );
                  }
                }
                break;

              // ========================================
              // RETRIEVER EVENTS (if using RAG)
              // ========================================
              case 'on_retriever_start':
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'retrieval_start',
                      query: event.data?.input?.query || 'Searching...',
                    })}\n\n`
                  )
                );
                break;

              case 'on_retriever_end':
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'retrieval_complete',
                      documentsFound: event.data?.output?.length || 0,
                    })}\n\n`
                  )
                );
                break;
            }
          }

          // Track anonymous usage after successful completion
          if (isAnonymous && anonymousSessionId) {
            const responseTime = Date.now() - startTime;
            trackAnonymousUsage(anonymousSessionId, message, threadId, responseTime, true);
          }

          // Send completion event with accumulated metadata
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                conversationId: threadId,
                metadata: {
                  toolCalls: accumulatedToolCalls.map((tc) => ({
                    ...tc,
                    startedAt: tc.startedAt?.toISOString(),
                    completedAt: tc.completedAt?.toISOString(),
                  })),
                  uiComponents: accumulatedUIComponents,
                  hitlRequests: accumulatedHITLRequests,
                  processingTime: Date.now() - startTime,
                },
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          // Track failed usage for anonymous users
          if (isAnonymous && anonymousSessionId) {
            const responseTime = Date.now() - startTime;
            trackAnonymousUsage(
              anonymousSessionId,
              message,
              threadId,
              responseTime,
              false,
              error instanceof Error ? error.message : 'Unknown error'
            );
          }

          // Send error event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    // Track failed usage for anonymous users
    if (isAnonymous && anonymousSessionId) {
      const responseTime = Date.now() - startTime;
      trackAnonymousUsage(
        anonymousSessionId,
        '',
        '',
        responseTime,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Track anonymous user usage (fire and forget)
 */
async function trackAnonymousUsage(
  sessionId: string,
  message: string,
  conversationId: string,
  responseTime: number,
  wasSuccessful: boolean,
  errorType?: string
): Promise<void> {
  try {
    // Find or create anonymous user
    let anonymousUser = await prisma.anonymousUser.findUnique({
      where: { sessionId },
    });

    if (!anonymousUser) {
      anonymousUser = await prisma.anonymousUser.create({
        data: { sessionId },
      });
    }

    // Check if it's a new day for daily turn reset
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastTurnDate = anonymousUser.lastTurnDate;
    const isNewDay = !lastTurnDate || new Date(lastTurnDate) < today;

    const nextTurnNumber = anonymousUser.totalTurns + 1;
    const newDailyTurns = isNewDay ? 1 : anonymousUser.dailyTurns + 1;

    // Update user stats and create usage log
    await prisma.$transaction([
      prisma.anonymousUser.update({
        where: { id: anonymousUser.id },
        data: {
          totalTurns: nextTurnNumber,
          dailyTurns: newDailyTurns,
          lastTurnDate: new Date(),
          lastSeenAt: new Date(),
        },
      }),
      prisma.anonymousUsage.create({
        data: {
          anonymousUserId: anonymousUser.id,
          action: 'chat_turn',
          turnNumber: nextTurnNumber,
          messagePreview: message.slice(0, 200),
          responseTime,
          wasSuccessful,
          errorType,
          conversationId,
        },
      }),
    ]);
  } catch (error) {
    // Silently fail - usage tracking shouldn't break the chat
    console.error('Anonymous usage tracking failed:', error);
  }
}

/**
 * GET /api/chat
 *
 * Health check endpoint
 */
export async function GET() {
  const configValidation = validateLLMConfig();

  return NextResponse.json({
    status: 'ok',
    llmConfigured: configValidation.valid,
    timestamp: new Date().toISOString(),
    features: {
      generativeUI: true,
      toolCallStreaming: true,
      agentStateTracking: true,
      humanInTheLoop: true,
    },
  });
}
