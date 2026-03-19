/**
 * Transport Manager for AI Streaming System
 *
 * Manages SSE connections with automatic reconnection and event dispatch.
 * Used as the primary transport layer for streaming AI responses.
 */

import { ReconnectionManager, ReconnectionConfig } from './reconnection';
import type { ServerEvent, ClientEvent, ConnectionState } from './event-types';

// ============================================================================
// Types and Configuration
// ============================================================================

/**
 * Configuration for the transport layer
 */
export interface TransportConfig {
  /** SSE endpoint URL */
  sseEndpoint: string;
  /** Optional WebSocket endpoint for future use */
  wsEndpoint?: string;
  /** Reconnection configuration */
  reconnect: ReconnectionConfig;
  /** Heartbeat interval in milliseconds */
  heartbeatIntervalMs: number;
}

/**
 * Default transport configuration matching the spec
 */
export const DEFAULT_TRANSPORT_CONFIG: TransportConfig = {
  sseEndpoint: '/api/chat',
  reconnect: {
    maxAttempts: 5,
    backoffMs: [1000, 2000, 4000, 8000, 16000],
  },
  heartbeatIntervalMs: 30000,
};

// ============================================================================
// Event Handler Types
// ============================================================================

/** Handler for server events */
export type EventHandler = (event: ServerEvent) => void;

/** Handler for connection state changes */
export type StateChangeHandler = (state: ConnectionState) => void;

// ============================================================================
// TransportManager Class
// ============================================================================

/**
 * Manages SSE connections with automatic reconnection
 *
 * @example
 * ```typescript
 * const transport = new TransportManager();
 *
 * transport.onEvent((event) => {
 *   console.log('Received:', event);
 * });
 *
 * transport.onStateChange((state) => {
 *   console.log('Connection state:', state);
 * });
 *
 * transport.connect({ message: 'Hello' });
 * ```
 */
export class TransportManager {
  private config: TransportConfig;
  private reconnectionManager: ReconnectionManager;
  private connectionState: ConnectionState = 'disconnected';
  private abortController: AbortController | null = null;
  private eventHandlers: Set<EventHandler> = new Set();
  private stateChangeHandlers: Set<StateChangeHandler> = new Set();
  private lastRequestBody: object | undefined;
  private pendingMessage: ClientEvent | null = null;

  /**
   * Create a new TransportManager
   * @param config - Optional configuration (defaults to DEFAULT_TRANSPORT_CONFIG)
   */
  constructor(config: TransportConfig = DEFAULT_TRANSPORT_CONFIG) {
    this.config = config;
    this.reconnectionManager = new ReconnectionManager(config.reconnect);
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Establish an SSE connection
   * @param body - Optional request body for the POST request
   */
  connect(body?: object): void {
    // Don't connect if already connecting or connected
    if (
      this.connectionState === 'connecting' ||
      this.connectionState === 'connected'
    ) {
      return;
    }

    // Use pending message if available, otherwise use provided body
    if (this.pendingMessage) {
      this.lastRequestBody = this.pendingMessage;
      this.pendingMessage = null;
    } else {
      this.lastRequestBody = body;
    }
    this.doConnect();
  }

  /**
   * Close the connection and clean up resources
   */
  disconnect(): void {
    // Cancel any pending reconnection
    this.reconnectionManager.cancel();

    // Abort any in-flight request
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Reset state
    this.setConnectionState('disconnected');
    this.reconnectionManager.reset();
  }

  /**
   * Sends an event. For SSE (unidirectional), this stores the message
   * to be included in the next connect() request body.
   * @param event - The client event to send
   */
  send(event: ClientEvent): void {
    this.pendingMessage = event;
  }

  /**
   * Register an event handler for server events
   * @param handler - Function to call when an event is received
   */
  onEvent(handler: EventHandler): void {
    this.eventHandlers.add(handler);
  }

  /**
   * Unregister an event handler
   * @param handler - The handler to remove
   */
  offEvent(handler: EventHandler): void {
    this.eventHandlers.delete(handler);
  }

  /**
   * Register a handler for connection state changes
   * @param handler - Function to call when state changes
   */
  onStateChange(handler: StateChangeHandler): void {
    this.stateChangeHandlers.add(handler);
  }

  /**
   * Unregister a state change handler
   * @param handler - The handler to remove
   */
  offStateChange(handler: StateChangeHandler): void {
    this.stateChangeHandlers.delete(handler);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Internal method to establish the SSE connection
   */
  private async doConnect(): Promise<void> {
    this.setConnectionState('connecting');

    // Create new abort controller for this connection
    this.abortController = new AbortController();

    try {
      const response = await fetch(this.config.sseEndpoint, {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
        },
        body: this.lastRequestBody
          ? JSON.stringify(this.lastRequestBody)
          : undefined,
        signal: this.abortController.signal,
      });

      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      // Connection successful
      this.setConnectionState('connected');
      this.reconnectionManager.reset();

      // Process the SSE stream
      await this.processStream(response);
    } catch (error) {
      // Ignore abort errors (expected on disconnect)
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      // Handle connection failure
      this.handleConnectionError();
    }
  }

  /**
   * Process the SSE stream from the response
   */
  private async processStream(response: Response): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Append new data to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events from buffer
        const events = this.parseSSEEvents(buffer);
        buffer = events.remaining;

        // Dispatch parsed events
        for (const event of events.parsed) {
          this.dispatchEvent(event);
        }
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Parse SSE events from a text buffer
   * @returns Parsed events and remaining buffer
   */
  private parseSSEEvents(buffer: string): {
    parsed: ServerEvent[];
    remaining: string;
  } {
    const parsed: ServerEvent[] = [];
    const lines = buffer.split('\n\n');

    // The last element might be incomplete, save it for later
    const remaining = lines.pop() || '';

    for (const chunk of lines) {
      const trimmed = chunk.trim();

      // Skip empty chunks
      if (!trimmed) {
        continue;
      }

      // Skip SSE comments (lines starting with :)
      if (trimmed.startsWith(':')) {
        continue;
      }

      // Parse data lines
      if (trimmed.startsWith('data:')) {
        const dataContent = trimmed.slice(5).trim();

        // Skip empty data
        if (!dataContent) {
          continue;
        }

        try {
          const event = JSON.parse(dataContent) as ServerEvent;
          parsed.push(event);
        } catch {
          // Skip malformed JSON - continue processing other events
          console.warn('Failed to parse SSE event:', dataContent);
        }
      }
    }

    return { parsed, remaining };
  }

  /**
   * Dispatch an event to all registered handlers
   */
  private dispatchEvent(event: ServerEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    }
  }

  /**
   * Handle connection errors with reconnection logic
   */
  private handleConnectionError(): void {
    // Don't reconnect if we've been disconnected
    if (this.connectionState === 'disconnected') {
      return;
    }

    // Check if we can still reconnect
    if (this.reconnectionManager.isMaxAttemptsReached()) {
      this.setConnectionState('disconnected');
      return;
    }

    // Set state to reconnecting and schedule retry
    this.setConnectionState('reconnecting');
    this.reconnectionManager.scheduleReconnect(() => {
      this.doConnect();
    });
  }

  /**
   * Update the connection state and notify listeners
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.notifyStateChange(state);
    }
  }

  /**
   * Notify all state change handlers
   */
  private notifyStateChange(state: ConnectionState): void {
    for (const handler of this.stateChangeHandlers) {
      try {
        handler(state);
      } catch (error) {
        console.error('Error in state change handler:', error);
      }
    }
  }
}
