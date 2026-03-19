/**
 * MCP Client for Browser
 *
 * Browser-based MCP client using HTTP for tool calls and SSE for streaming progress.
 * Handles connection management, request correlation, and automatic reconnection.
 */

import { nanoid } from 'nanoid';
import type {
  MCPClientConfig,
  MCPTool,
  MCPToolResult,
  ProcessingProgress,
  MCPRequest,
  MCPResponse,
  MCPConnectionState,
} from './types';

// ============================================
// Default Configuration
// ============================================

// Always use the Next.js API proxy for MCP requests
// This ensures proper routing through the same domain and avoids CORS issues
const getMCPEndpoint = () => {
  // For development without Next.js server, use backend directly
  if (typeof window === 'undefined') {
    return process.env.BIM_AGENT_SERVICE_URL
      ? `${process.env.BIM_AGENT_SERVICE_URL}/mcp`
      : 'http://localhost:8000/mcp';
  }
  // In browser, always use the Next.js API proxy
  return '/api/mcp';
};

const DEFAULT_CONFIG: Required<MCPClientConfig> = {
  endpoint: getMCPEndpoint(),
  sessionId: undefined as unknown as string,
  timeout: 60000, // 60 seconds
  autoReconnect: true,
  maxReconnectAttempts: 3,
  reconnectDelay: 1000,
};

// ============================================
// MCP Client Class
// ============================================

/**
 * MCP Client for browser-based communication with the BIM Agent MCP server.
 *
 * @example
 * ```typescript
 * const client = new MCPClient({ endpoint: '/api/mcp' });
 * await client.connect();
 *
 * const tools = await client.listTools();
 * const result = await client.callTool('analyze_floorplan', { imageBase64: '...' });
 *
 * // With streaming progress
 * for await (const progress of client.callToolWithProgress('analyze_floorplan', args)) {
 *   console.log(`${progress.step}: ${progress.progress}%`);
 * }
 * ```
 */
export class MCPClient {
  private config: Required<MCPClientConfig>;
  private connectionState: MCPConnectionState = 'disconnected';
  private tools: MCPTool[] = [];
  private sessionId: string;
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private pendingRequests: Map<string, {
    resolve: (value: MCPResponse) => void;
    reject: (reason: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = new Map();
  private connectionListeners: Set<(state: MCPConnectionState) => void> = new Set();
  private abortController: AbortController | null = null;

  /**
   * Create a new MCP client instance
   */
  constructor(config?: Partial<MCPClientConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      sessionId: config?.sessionId || nanoid(),
    };
    this.sessionId = this.config.sessionId;
  }

  // ============================================
  // Connection Management
  // ============================================

  /**
   * Connect to the MCP server
   * Fetches available tools and establishes SSE connection for streaming
   */
  async connect(): Promise<void> {
    if (this.connectionState === 'connected') {
      return;
    }

    this.setConnectionState('connecting');

    try {
      // Fetch available tools
      await this.fetchTools();

      // Setup SSE for streaming (optional, only for tools that support streaming)
      this.setupSSE();

      this.setConnectionState('connected');
      this.reconnectAttempts = 0;
    } catch (error) {
      this.setConnectionState('error');
      throw error;
    }
  }

  /**
   * Close the MCP client connection
   */
  close(): void {
    // Close SSE connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Abort any pending requests
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Clear pending requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Client closed'));
    }
    this.pendingRequests.clear();

    this.setConnectionState('disconnected');
  }

  /**
   * Get current connection state
   */
  getConnectionState(): MCPConnectionState {
    return this.connectionState;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionChange(listener: (state: MCPConnectionState) => void): () => void {
    this.connectionListeners.add(listener);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  // ============================================
  // Tool Operations
  // ============================================

  /**
   * List available MCP tools from the server
   */
  async listTools(): Promise<MCPTool[]> {
    if (this.tools.length === 0) {
      await this.fetchTools();
    }
    return [...this.tools];
  }

  /**
   * Call an MCP tool and wait for result
   *
   * @param name - Tool name to invoke
   * @param args - Tool arguments
   * @returns Tool result
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    const requestId = nanoid();

    try {
      const response = await fetch(`${this.config.endpoint}/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId,
          'X-Request-ID': requestId,
        },
        body: JSON.stringify({
          name,
          arguments: args,
        }),
        signal: this.createAbortSignal(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        return {
          content: null,
          isError: true,
          errorMessage: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        content: data.result || data,
        isError: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: null,
        isError: true,
        errorMessage: message,
      };
    }
  }

  /**
   * Call an MCP tool with streaming progress updates
   *
   * @param name - Tool name to invoke
   * @param args - Tool arguments
   * @yields Progress updates during processing
   * @returns Final tool result via last progress update
   */
  async *callToolWithProgress(
    name: string,
    args: Record<string, unknown>
  ): AsyncGenerator<ProcessingProgress, void, unknown> {
    const requestId = nanoid();
    const sseUrl = `${this.config.endpoint}/tools/call/stream?` + new URLSearchParams({
      name,
      arguments: JSON.stringify(args),
      sessionId: this.sessionId,
      requestId,
    }).toString();

    // Use EventSource for SSE streaming
    const eventSource = new EventSource(sseUrl);
    let isComplete = false;
    let error: Error | null = null;

    // Create a queue for progress events
    const progressQueue: ProcessingProgress[] = [];
    let resolveNext: ((value: ProcessingProgress | null) => void) | null = null;

    const pushProgress = (progress: ProcessingProgress) => {
      if (resolveNext) {
        resolveNext(progress);
        resolveNext = null;
      } else {
        progressQueue.push(progress);
      }
    };

    const pullProgress = (): Promise<ProcessingProgress | null> => {
      if (progressQueue.length > 0) {
        return Promise.resolve(progressQueue.shift()!);
      }
      if (isComplete) {
        return Promise.resolve(null);
      }
      return new Promise((resolve) => {
        resolveNext = resolve;
      });
    };

    // Setup event handlers
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'progress') {
          pushProgress(data.progress as ProcessingProgress);
        } else if (data.type === 'result') {
          // Final result - emit as final progress
          pushProgress({
            step: 'complete',
            progress: 100,
            message: 'Processing complete',
            data: data.result,
            timestamp: new Date().toISOString(),
          });
          isComplete = true;
          eventSource.close();
        } else if (data.type === 'error') {
          error = new Error(data.error?.message || 'Processing failed');
          isComplete = true;
          eventSource.close();
          if (resolveNext) {
            resolveNext(null);
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      if (!isComplete) {
        error = new Error('SSE connection error');
        isComplete = true;
        eventSource.close();
        if (resolveNext) {
          resolveNext(null);
        }
      }
    };

    // Yield progress updates
    try {
      while (!isComplete) {
        const progress = await pullProgress();
        if (progress === null) {
          break;
        }
        yield progress;
      }

      if (error) {
        throw error;
      }
    } finally {
      eventSource.close();
    }
  }

  /**
   * Call tool without streaming (for simpler use cases)
   * Falls back to polling if SSE is not available
   */
  async callToolSimple<T = unknown>(name: string, args: Record<string, unknown>): Promise<T> {
    const result = await this.callTool(name, args);
    if (result.isError) {
      throw new Error(result.errorMessage || 'Tool call failed');
    }
    return result.content as T;
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Fetch available tools from server
   */
  private async fetchTools(): Promise<void> {
    try {
      const response = await fetch(`${this.config.endpoint}/tools`, {
        method: 'GET',
        headers: {
          'X-Session-ID': this.sessionId,
        },
        signal: this.createAbortSignal(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tools: ${response.status}`);
      }

      const data = await response.json();
      this.tools = data.tools || data || [];
    } catch (error) {
      console.error('[MCPClient] Failed to fetch tools:', error);
      // Non-fatal - allow connection to proceed
      this.tools = [];
    }
  }

  /**
   * Setup SSE connection for server-pushed events
   */
  private setupSSE(): void {
    // SSE is only used for streaming tool calls
    // We don't maintain a persistent SSE connection for the general case
    // Each streaming tool call creates its own SSE connection
  }

  /**
   * Attempt to reconnect to the server
   */
  private async attemptReconnect(): Promise<void> {
    if (!this.config.autoReconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.setConnectionState('error');
      return;
    }

    this.setConnectionState('reconnecting');
    this.reconnectAttempts++;

    await new Promise((resolve) => setTimeout(resolve, this.config.reconnectDelay));

    try {
      await this.connect();
    } catch {
      // Retry again
      await this.attemptReconnect();
    }
  }

  /**
   * Update connection state and notify listeners
   */
  private setConnectionState(state: MCPConnectionState): void {
    this.connectionState = state;
    for (const listener of this.connectionListeners) {
      try {
        listener(state);
      } catch {
        // Ignore listener errors
      }
    }
  }

  /**
   * Create an abort signal with timeout
   */
  private createAbortSignal(): AbortSignal {
    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, this.config.timeout);

    this.abortController.signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
    });

    return this.abortController.signal;
  }
}

// ============================================
// Singleton Instance
// ============================================

let defaultClient: MCPClient | null = null;

/**
 * Get or create the default MCP client instance
 */
export function getMCPClient(config?: Partial<MCPClientConfig>): MCPClient {
  if (!defaultClient || config) {
    defaultClient = new MCPClient(config);
  }
  return defaultClient;
}

/**
 * Reset the default MCP client (useful for testing)
 */
export function resetMCPClient(): void {
  if (defaultClient) {
    defaultClient.close();
    defaultClient = null;
  }
}
