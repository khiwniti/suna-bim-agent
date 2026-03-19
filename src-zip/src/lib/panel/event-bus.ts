'use client';

/**
 * Panel Event Bus - Pub/Sub pattern for chat-panel communication
 *
 * Enables decoupled communication between chat interface and tool panels.
 * Used for actions like highlighting elements, updating data, and triggering exports.
 *
 * ★ Insight ─────────────────────────────────────
 * Event-driven architecture decouples the chat from specific panel implementations.
 * This allows adding new panel types without modifying the chat code, and enables
 * panels to subscribe only to events they care about.
 * ─────────────────────────────────────────────────
 */

// ============================================
// Types
// ============================================

/** Unique identifier for panels */
export type PanelId =
  | '3d-viewer'
  | 'boq-table'
  | 'carbon-dashboard'
  | 'clash-report'
  | 'floorplan-viewer'
  | 'document-editor';

/** Event source identifier */
export type EventSource = 'chat' | 'panel' | 'agent' | 'system';

/** Panel activation event */
export interface ActivatePanelEvent {
  type: 'ACTIVATE_PANEL';
  panelId: PanelId;
  autoExpand?: boolean;
}

/** Panel data update event */
export interface UpdatePanelDataEvent {
  type: 'UPDATE_PANEL_DATA';
  panelId: PanelId;
  data: unknown;
  merge?: boolean;
}

/** 3D viewer element highlight event */
export interface HighlightElementsEvent {
  type: 'HIGHLIGHT_ELEMENTS';
  elementIds: string[];
  isolate?: boolean;
  zoomTo?: boolean;
}

/** 3D viewer camera navigation event */
export interface NavigateToCameraEvent {
  type: 'NAVIGATE_TO_CAMERA';
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  target?: { x: number; y: number; z: number };
}

/** BOQ row update event */
export interface UpdateBOQRowEvent {
  type: 'UPDATE_BOQ_ROW';
  rowId: string;
  updates: Record<string, unknown>;
}

/** BOQ add row event */
export interface AddBOQRowEvent {
  type: 'ADD_BOQ_ROW';
  row: {
    description: string;
    quantity: number;
    unit: string;
    unitRate?: number;
    category?: string;
  };
}

/** Document scroll event */
export interface ScrollToSectionEvent {
  type: 'SCROLL_TO_SECTION';
  sectionId: string;
}

/** Export data event */
export interface ExportDataEvent {
  type: 'EXPORT_DATA';
  format: 'pdf' | 'excel' | 'csv';
  panelId?: PanelId;
}

/** Panel selection event (from panel to chat) */
export interface PanelSelectionEvent {
  type: 'PANEL_SELECTION';
  panelId: PanelId;
  selectedData: unknown;
}

/** Panel error event */
export interface PanelErrorEvent {
  type: 'PANEL_ERROR';
  panelId: PanelId;
  error: string;
}

/** Panel ready event */
export interface PanelReadyEvent {
  type: 'PANEL_READY';
  panelId: PanelId;
}

/** Send chat message event (from panel to chat) */
export interface SendChatMessageEvent {
  type: 'SEND_CHAT_MESSAGE';
  message: string;
}

/** Panel loading state event */
export interface PanelLoadingEvent {
  type: 'PANEL_LOADING';
  panelId: PanelId;
  isLoading: boolean;
  toolId?: string;
  message?: string;
}

/** Union of all panel events */
export type PanelEventPayload =
  | ActivatePanelEvent
  | UpdatePanelDataEvent
  | HighlightElementsEvent
  | NavigateToCameraEvent
  | UpdateBOQRowEvent
  | AddBOQRowEvent
  | ScrollToSectionEvent
  | ExportDataEvent
  | PanelSelectionEvent
  | PanelErrorEvent
  | PanelReadyEvent
  | SendChatMessageEvent
  | PanelLoadingEvent;

/** Full event envelope with metadata */
export interface PanelEvent {
  /** Event source identifier */
  source: EventSource;
  /** Timestamp when event was created */
  timestamp: number;
  /** Unique event ID for tracking */
  eventId: string;
  /** The actual event payload */
  event: PanelEventPayload;
}

/** Event callback type */
export type EventCallback = (event: PanelEvent) => void;

/** Subscription options */
export interface SubscriptionOptions {
  /** Only receive events from specific sources */
  sources?: EventSource[];
  /** Auto-unsubscribe after N events */
  maxEvents?: number;
  /** Debounce callback (ms) */
  debounce?: number;
}

// ============================================
// Event Bus Implementation
// ============================================

/**
 * Generate unique event ID
 */
function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Debounce utility for callbacks
 */
function debounceCallback(
  fn: EventCallback,
  ms: number
): EventCallback {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return (event: PanelEvent) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(event), ms);
  };
}

/**
 * PanelEventBus - Singleton event bus for panel communication
 */
class PanelEventBus {
  private subscribers = new Map<
    PanelEventPayload['type'],
    Map<symbol, { callback: EventCallback; options?: SubscriptionOptions; eventCount: number }>
  >();
  private globalSubscribers = new Map<
    symbol,
    { callback: EventCallback; options?: SubscriptionOptions; eventCount: number }
  >();
  private eventHistory: PanelEvent[] = [];
  private maxHistorySize = 100;

  /**
   * Subscribe to specific event type
   *
   * @param eventType - The event type to subscribe to
   * @param callback - Function to call when event occurs
   * @param options - Optional subscription settings
   * @returns Unsubscribe function
   */
  subscribe(
    eventType: PanelEventPayload['type'],
    callback: EventCallback,
    options?: SubscriptionOptions
  ): () => void {
    const id = Symbol('subscription');

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Map());
    }

    const wrappedCallback = options?.debounce
      ? debounceCallback(callback, options.debounce)
      : callback;

    this.subscribers.get(eventType)!.set(id, {
      callback: wrappedCallback,
      options,
      eventCount: 0,
    });

    // Return unsubscribe function
    return () => {
      this.subscribers.get(eventType)?.delete(id);
    };
  }

  /**
   * Subscribe to all events
   *
   * @param callback - Function to call for any event
   * @param options - Optional subscription settings
   * @returns Unsubscribe function
   */
  subscribeAll(callback: EventCallback, options?: SubscriptionOptions): () => void {
    const id = Symbol('global-subscription');

    const wrappedCallback = options?.debounce
      ? debounceCallback(callback, options.debounce)
      : callback;

    this.globalSubscribers.set(id, {
      callback: wrappedCallback,
      options,
      eventCount: 0,
    });

    return () => {
      this.globalSubscribers.delete(id);
    };
  }

  /**
   * Publish an event to all subscribers
   *
   * @param source - Where the event originated
   * @param event - The event payload
   */
  publish(source: EventSource, event: PanelEventPayload): void {
    const fullEvent: PanelEvent = {
      source,
      timestamp: Date.now(),
      eventId: generateEventId(),
      event,
    };

    // Add to history
    this.eventHistory.push(fullEvent);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify type-specific subscribers
    const typeSubscribers = this.subscribers.get(event.type);
    if (typeSubscribers) {
      for (const [id, sub] of typeSubscribers) {
        // Check source filter
        if (sub.options?.sources && !sub.options.sources.includes(source)) {
          continue;
        }

        // Track event count
        sub.eventCount++;

        // Call callback
        try {
          sub.callback(fullEvent);
        } catch (error) {
          console.error(`Event callback error for ${event.type}:`, error);
        }

        // Auto-unsubscribe if maxEvents reached
        if (sub.options?.maxEvents && sub.eventCount >= sub.options.maxEvents) {
          typeSubscribers.delete(id);
        }
      }
    }

    // Notify global subscribers
    for (const [id, sub] of this.globalSubscribers) {
      if (sub.options?.sources && !sub.options.sources.includes(source)) {
        continue;
      }

      sub.eventCount++;

      try {
        sub.callback(fullEvent);
      } catch (error) {
        console.error('Global event callback error:', error);
      }

      if (sub.options?.maxEvents && sub.eventCount >= sub.options.maxEvents) {
        this.globalSubscribers.delete(id);
      }
    }
  }

  /**
   * Get recent event history
   *
   * @param limit - Max events to return
   * @param eventType - Optional filter by type
   */
  getHistory(limit = 10, eventType?: PanelEventPayload['type']): PanelEvent[] {
    let events = this.eventHistory;

    if (eventType) {
      events = events.filter((e) => e.event.type === eventType);
    }

    return events.slice(-limit);
  }

  /**
   * Clear all subscriptions and history
   */
  reset(): void {
    this.subscribers.clear();
    this.globalSubscribers.clear();
    this.eventHistory = [];
  }

  /**
   * Get subscriber count for debugging
   */
  getSubscriberCount(eventType?: PanelEventPayload['type']): number {
    if (eventType) {
      return this.subscribers.get(eventType)?.size ?? 0;
    }

    let count = this.globalSubscribers.size;
    for (const subs of this.subscribers.values()) {
      count += subs.size;
    }
    return count;
  }
}

// ============================================
// Singleton Instance
// ============================================

/** Singleton event bus instance */
export const panelEventBus = new PanelEventBus();

// ============================================
// Convenience Helper Functions
// ============================================

/**
 * Publish a panel activation event
 */
export function activatePanel(panelId: PanelId, autoExpand = true): void {
  panelEventBus.publish('chat', {
    type: 'ACTIVATE_PANEL',
    panelId,
    autoExpand,
  });
}

/**
 * Publish an element highlight event
 */
export function highlightElements(
  elementIds: string[],
  options: { isolate?: boolean; zoomTo?: boolean } = {}
): void {
  panelEventBus.publish('chat', {
    type: 'HIGHLIGHT_ELEMENTS',
    elementIds,
    ...options,
  });
}

/**
 * Publish a panel data update
 */
export function updatePanelData(panelId: PanelId, data: unknown, merge = true): void {
  panelEventBus.publish('chat', {
    type: 'UPDATE_PANEL_DATA',
    panelId,
    data,
    merge,
  });
}

/**
 * Publish an export request
 */
export function requestExport(format: 'pdf' | 'excel' | 'csv', panelId?: PanelId): void {
  panelEventBus.publish('chat', {
    type: 'EXPORT_DATA',
    format,
    panelId,
  });
}

/**
 * Publish a BOQ row update
 */
export function updateBOQRow(rowId: string, updates: Record<string, unknown>): void {
  panelEventBus.publish('chat', {
    type: 'UPDATE_BOQ_ROW',
    rowId,
    updates,
  });
}

/**
 * Publish a BOQ row addition
 */
export function addBOQRow(row: AddBOQRowEvent['row']): void {
  panelEventBus.publish('chat', {
    type: 'ADD_BOQ_ROW',
    row,
  });
}

// ============================================
// React Hook
// ============================================

import { useEffect, useCallback, useRef } from 'react';

/**
 * React hook to subscribe to panel events
 *
 * @param eventType - Event type to subscribe to (or null for all events)
 * @param callback - Callback when event occurs
 * @param options - Optional subscription settings
 */
export function usePanelEvent(
  eventType: PanelEventPayload['type'] | null,
  callback: EventCallback,
  options?: SubscriptionOptions
): void {
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler: EventCallback = (event) => {
      callbackRef.current(event);
    };

    const unsubscribe = eventType
      ? panelEventBus.subscribe(eventType, handler, options)
      : panelEventBus.subscribeAll(handler, options);

    return unsubscribe;
  }, [eventType, options]);
}

/**
 * React hook to publish panel events
 *
 * @param source - Event source identifier
 * @returns Publish function
 */
export function usePanelPublish(source: EventSource = 'panel') {
  return useCallback(
    (event: PanelEventPayload) => {
      panelEventBus.publish(source, event);
    },
    [source]
  );
}

export default panelEventBus;
