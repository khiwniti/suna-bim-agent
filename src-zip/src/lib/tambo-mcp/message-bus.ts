/**
 * Tambo Bidirectional Message Bus
 *
 * Production-ready messaging architecture for communication between
 * agent chat interface and VS Code editor panels. Supports:
 *
 * - Event emitters for user actions
 * - Response handlers for agent outputs
 * - Callback mechanisms for panel state changes
 * - Acknowledgment patterns for reliable delivery
 * - Message correlation for request/response matching
 *
 * Architecture:
 * ```
 *   Chat UI ←→ Message Bus ←→ Panel/Webview
 *      ↓           ↓              ↓
 *   Actions    Middleware     State Sync
 * ```
 *
 * @module tambo-mcp/message-bus
 */

// ============================================
// Message Types
// ============================================

/**
 * Message direction for filtering and routing
 */
export type MessageDirection = 'chat-to-panel' | 'panel-to-chat' | 'broadcast';

/**
 * Message priority for queue ordering
 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Message delivery status
 */
export type DeliveryStatus = 'pending' | 'delivered' | 'acknowledged' | 'failed' | 'timeout';

/**
 * Base message interface
 */
export interface BaseMessage {
  /** Unique message ID for correlation */
  id: string;
  /** Message type discriminant */
  type: string;
  /** Message direction */
  direction: MessageDirection;
  /** Source identifier (panel ID, 'chat', etc.) */
  source: string;
  /** Target identifier(s) */
  target: string | string[] | '*';
  /** Timestamp of message creation */
  timestamp: number;
  /** Optional correlation ID for request/response */
  correlationId?: string;
  /** Message priority */
  priority?: MessagePriority;
  /** Whether acknowledgment is required */
  requiresAck?: boolean;
}

// ============================================
// Chat-to-Panel Messages
// ============================================

/**
 * User action from chat triggering panel behavior
 */
export interface UserActionMessage extends BaseMessage {
  type: 'user-action';
  direction: 'chat-to-panel';
  payload: {
    action: 'navigate' | 'highlight' | 'select' | 'filter' | 'export' | 'refresh';
    params: Record<string, unknown>;
  };
}

/**
 * Generative component to render in panel
 */
export interface RenderComponentMessage extends BaseMessage {
  type: 'render-component';
  direction: 'chat-to-panel';
  payload: {
    componentName: string;
    props: Record<string, unknown>;
    instanceId: string;
    streaming?: boolean;
  };
}

/**
 * Update streaming props for component
 */
export interface UpdateStreamingPropsMessage extends BaseMessage {
  type: 'update-streaming-props';
  direction: 'chat-to-panel';
  payload: {
    instanceId: string;
    partialProps: Record<string, unknown>;
    progress?: number;
  };
}

/**
 * Complete streaming for component
 */
export interface CompleteStreamingMessage extends BaseMessage {
  type: 'complete-streaming';
  direction: 'chat-to-panel';
  payload: {
    instanceId: string;
  };
}

/**
 * AI agent response with potential UI updates
 */
export interface AgentResponseMessage extends BaseMessage {
  type: 'agent-response';
  direction: 'chat-to-panel';
  payload: {
    content: string;
    components?: Array<{
      name: string;
      props: Record<string, unknown>;
      targetPanel?: string;
    }>;
    actions?: Array<{
      type: string;
      params: Record<string, unknown>;
    }>;
  };
}

// ============================================
// Panel-to-Chat Messages
// ============================================

/**
 * Panel state change notification
 */
export interface PanelStateChangeMessage extends BaseMessage {
  type: 'panel-state-change';
  direction: 'panel-to-chat';
  payload: {
    panelId: string;
    previousState: Record<string, unknown>;
    currentState: Record<string, unknown>;
    changedKeys: string[];
  };
}

/**
 * User interaction within panel
 */
export interface PanelInteractionMessage extends BaseMessage {
  type: 'panel-interaction';
  direction: 'panel-to-chat';
  payload: {
    panelId: string;
    interactionType: 'click' | 'select' | 'input' | 'submit' | 'drag' | 'scroll';
    target: string;
    data: Record<string, unknown>;
  };
}

/**
 * Component state update (HITL response, etc.)
 */
export interface ComponentStateMessage extends BaseMessage {
  type: 'component-state';
  direction: 'panel-to-chat';
  payload: {
    instanceId: string;
    componentName: string;
    state: Record<string, unknown>;
    userResponse?: unknown;
  };
}

/**
 * Panel data request for AI context
 */
export interface PanelDataRequestMessage extends BaseMessage {
  type: 'panel-data-request';
  direction: 'panel-to-chat';
  payload: {
    panelId: string;
    dataType: string;
    query?: Record<string, unknown>;
  };
}

// ============================================
// Acknowledgment Messages
// ============================================

/**
 * Message acknowledgment
 */
export interface AckMessage extends BaseMessage {
  type: 'ack';
  direction: MessageDirection;
  payload: {
    originalMessageId: string;
    status: DeliveryStatus;
    error?: string;
  };
}

// ============================================
// Broadcast Messages
// ============================================

/**
 * Global state sync broadcast
 */
export interface StateSyncMessage extends BaseMessage {
  type: 'state-sync';
  direction: 'broadcast';
  payload: {
    scope: 'chat' | 'panel' | 'global';
    state: Record<string, unknown>;
    version: number;
  };
}

/**
 * System event broadcast
 */
export interface SystemEventMessage extends BaseMessage {
  type: 'system-event';
  direction: 'broadcast';
  payload: {
    event: 'connected' | 'disconnected' | 'reconnecting' | 'error' | 'ready';
    details?: Record<string, unknown>;
  };
}

// ============================================
// Union Types
// ============================================

export type ChatToPanelMessage =
  | UserActionMessage
  | RenderComponentMessage
  | UpdateStreamingPropsMessage
  | CompleteStreamingMessage
  | AgentResponseMessage;

export type PanelToChatMessage =
  | PanelStateChangeMessage
  | PanelInteractionMessage
  | ComponentStateMessage
  | PanelDataRequestMessage;

export type BroadcastMessage = StateSyncMessage | SystemEventMessage;

export type MessageBusMessage =
  | ChatToPanelMessage
  | PanelToChatMessage
  | BroadcastMessage
  | AckMessage;

// ============================================
// Subscription Types
// ============================================

export type MessageHandler<T extends MessageBusMessage = MessageBusMessage> = (
  message: T
) => void | Promise<void>;

export interface Subscription {
  id: string;
  handler: MessageHandler;
  filter?: MessageFilter;
  unsubscribe: () => void;
}

export interface MessageFilter {
  types?: string[];
  directions?: MessageDirection[];
  sources?: string[];
  targets?: string[];
}

// ============================================
// Middleware Types
// ============================================

export type MiddlewareNext = (message: MessageBusMessage) => Promise<void>;

export type Middleware = (
  message: MessageBusMessage,
  next: MiddlewareNext
) => Promise<void>;

// ============================================
// Message Bus Class
// ============================================

/**
 * Bidirectional message bus for agent-panel communication.
 *
 * Features:
 * - Type-safe message routing
 * - Middleware pipeline for message transformation
 * - Acknowledgment patterns for reliable delivery
 * - Message correlation for request/response matching
 * - History tracking for debugging
 *
 * @example
 * ```typescript
 * const bus = getMessageBus();
 *
 * // Subscribe to panel interactions
 * bus.subscribe<PanelInteractionMessage>(
 *   (msg) => console.log('Panel interaction:', msg),
 *   { types: ['panel-interaction'] }
 * );
 *
 * // Send component to panel
 * bus.send({
 *   type: 'render-component',
 *   direction: 'chat-to-panel',
 *   source: 'chat',
 *   target: 'carbon-panel',
 *   payload: { componentName: 'CarbonResultCard', props: {...} },
 * });
 *
 * // Request/response pattern
 * const response = await bus.request('panel-data', { panelId: 'boq' });
 * ```
 */
export class MessageBus {
  private subscriptions = new Map<string, Subscription>();
  private middleware: Middleware[] = [];
  private pendingAcks = new Map<
    string,
    {
      resolve: (ack: AckMessage) => void;
      reject: (error: Error) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  >();
  private history: MessageBusMessage[] = [];
  private maxHistorySize = 100;
  private messageIdCounter = 0;
  private ackTimeout = 5000;

  constructor(options?: { maxHistorySize?: number; ackTimeout?: number }) {
    this.maxHistorySize = options?.maxHistorySize ?? 100;
    this.ackTimeout = options?.ackTimeout ?? 5000;
  }

  // ============================================
  // Message Sending
  // ============================================

  /**
   * Generate a unique message ID
   */
  generateMessageId(): string {
    return `msg-${Date.now()}-${++this.messageIdCounter}`;
  }

  /**
   * Send a message through the bus
   */
  async send(
    message: Omit<MessageBusMessage, 'id' | 'timestamp'>
  ): Promise<void> {
    const fullMessage: MessageBusMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now(),
    } as MessageBusMessage;

    // Add to history
    this.addToHistory(fullMessage);

    // Run through middleware pipeline
    await this.runMiddleware(fullMessage);
  }

  /**
   * Send a message and wait for acknowledgment
   */
  async sendWithAck(
    message: Omit<MessageBusMessage, 'id' | 'timestamp' | 'requiresAck'>
  ): Promise<AckMessage> {
    const fullMessage: MessageBusMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now(),
      requiresAck: true,
    } as MessageBusMessage;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingAcks.delete(fullMessage.id);
        reject(new Error(`Ack timeout for message ${fullMessage.id}`));
      }, this.ackTimeout);

      this.pendingAcks.set(fullMessage.id, { resolve, reject, timeout });

      this.addToHistory(fullMessage);
      this.runMiddleware(fullMessage).catch((err) => {
        clearTimeout(timeout);
        this.pendingAcks.delete(fullMessage.id);
        reject(err);
      });
    });
  }

  /**
   * Send acknowledgment for a message
   */
  async acknowledge(
    originalMessageId: string,
    status: DeliveryStatus = 'acknowledged',
    error?: string
  ): Promise<void> {
    const ackMessage: AckMessage = {
      id: this.generateMessageId(),
      type: 'ack',
      direction: 'broadcast',
      source: 'system',
      target: '*',
      timestamp: Date.now(),
      payload: {
        originalMessageId,
        status,
        error,
      },
    };

    // Resolve pending ack if exists
    const pending = this.pendingAcks.get(originalMessageId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingAcks.delete(originalMessageId);
      pending.resolve(ackMessage);
    }

    // Still broadcast the ack
    await this.runMiddleware(ackMessage);
  }

  /**
   * Request/response pattern - send and wait for correlated response
   */
  async request<TResponse = unknown>(
    type: string,
    payload: Record<string, unknown>,
    options?: {
      target?: string;
      timeout?: number;
    }
  ): Promise<TResponse> {
    const correlationId = this.generateMessageId();
    const timeout = options?.timeout ?? this.ackTimeout;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.unsubscribe(subId);
        reject(new Error(`Request timeout: ${type}`));
      }, timeout);

      let subId: string;
      subId = this.subscribe(
        (msg) => {
          if (msg.correlationId === correlationId) {
            clearTimeout(timeoutId);
            this.unsubscribe(subId);
            resolve((msg as unknown as { payload: TResponse }).payload);
          }
        },
        { types: [`${type}-response`] }
      );

      this.send({
        type,
        direction: 'chat-to-panel',
        source: 'chat',
        target: options?.target ?? '*',
        correlationId,
        payload,
      } as unknown as MessageBusMessage);
    });
  }

  // ============================================
  // Subscriptions
  // ============================================

  /**
   * Subscribe to messages
   */
  subscribe<T extends MessageBusMessage = MessageBusMessage>(
    handler: MessageHandler<T>,
    filter?: MessageFilter
  ): string {
    const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const subscription: Subscription = {
      id,
      handler: handler as MessageHandler,
      filter,
      unsubscribe: () => this.unsubscribe(id),
    };

    this.subscriptions.set(id, subscription);
    return id;
  }

  /**
   * Unsubscribe by ID
   */
  unsubscribe(id: string): boolean {
    return this.subscriptions.delete(id);
  }

  /**
   * Create a typed event emitter for a specific message type
   */
  createEmitter<T extends MessageBusMessage>(
    type: T['type']
  ): {
    emit: (
      message: Omit<T, 'id' | 'timestamp' | 'type'>
    ) => Promise<void>;
    on: (handler: MessageHandler<T>) => () => void;
  } {
    return {
      emit: async (message) => {
        await this.send({
          ...message,
          type,
        } as unknown as MessageBusMessage);
      },
      on: (handler) => {
        const id = this.subscribe(handler, { types: [type] });
        return () => this.unsubscribe(id);
      },
    };
  }

  // ============================================
  // Middleware
  // ============================================

  /**
   * Add middleware to the pipeline
   */
  use(middleware: Middleware): () => void {
    this.middleware.push(middleware);
    return () => {
      const index = this.middleware.indexOf(middleware);
      if (index > -1) {
        this.middleware.splice(index, 1);
      }
    };
  }

  // ============================================
  // History & Debug
  // ============================================

  /**
   * Get message history
   */
  getHistory(filter?: MessageFilter): MessageBusMessage[] {
    if (!filter) return [...this.history];

    return this.history.filter((msg) => this.matchesFilter(msg, filter));
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get pending ack count
   */
  getPendingAckCount(): number {
    return this.pendingAcks.size;
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  // ============================================
  // Private Methods
  // ============================================

  private async runMiddleware(message: MessageBusMessage): Promise<void> {
    let index = 0;

    const next: MiddlewareNext = async (msg) => {
      if (index < this.middleware.length) {
        const mw = this.middleware[index++];
        await mw(msg, next);
      } else {
        // End of middleware chain - deliver to subscribers
        await this.deliver(msg);
      }
    };

    await next(message);
  }

  private async deliver(message: MessageBusMessage): Promise<void> {
    for (const subscription of this.subscriptions.values()) {
      if (this.matchesFilter(message, subscription.filter)) {
        try {
          await subscription.handler(message);
        } catch (err) {
          console.error('[MessageBus] Handler error:', err);
        }
      }
    }
  }

  private matchesFilter(
    message: MessageBusMessage,
    filter?: MessageFilter
  ): boolean {
    if (!filter) return true;

    if (filter.types && !filter.types.includes(message.type)) return false;
    if (filter.directions && !filter.directions.includes(message.direction))
      return false;
    if (filter.sources && !filter.sources.includes(message.source)) return false;

    if (filter.targets) {
      const targets = Array.isArray(message.target)
        ? message.target
        : [message.target];
      if (!targets.some((t) => filter.targets?.includes(t) || t === '*'))
        return false;
    }

    return true;
  }

  private addToHistory(message: MessageBusMessage): void {
    this.history.push(message);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let busInstance: MessageBus | null = null;

/**
 * Get the singleton message bus
 */
export function getMessageBus(options?: {
  maxHistorySize?: number;
  ackTimeout?: number;
}): MessageBus {
  if (!busInstance) {
    busInstance = new MessageBus(options);
  }
  return busInstance;
}

/**
 * Reset the singleton bus
 */
export function resetMessageBus(): void {
  busInstance = null;
}

// ============================================
// Pre-built Middleware
// ============================================

/**
 * Logging middleware
 */
export const loggingMiddleware: Middleware = async (message, next) => {
  console.log('[MessageBus]', message.direction, message.type, message);
  await next(message);
};

/**
 * State sync middleware - sync messages to shared state store
 */
export const stateSyncMiddleware: Middleware = async (message, next) => {
  // Intercept state-sync messages and update store
  if (message.type === 'state-sync') {
    const { scope, state } = (message as StateSyncMessage).payload;
    console.log('[MessageBus] State sync:', scope, state);
    // Integration point: update Zustand store here
  }
  await next(message);
};

/**
 * VS Code webview bridge middleware - for extension host communication
 */
export function createVSCodeBridgeMiddleware(
  webviewApi: { postMessage: (msg: unknown) => void }
): Middleware {
  return async (message, next) => {
    // Forward messages to VS Code webview
    if (
      message.direction === 'chat-to-panel' ||
      message.direction === 'broadcast'
    ) {
      webviewApi.postMessage({
        type: 'tambo-message',
        data: message,
      });
    }
    await next(message);
  };
}
