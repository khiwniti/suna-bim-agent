import type { PanelId } from './types';

export type PanelEventType =
  | 'ACTIVATE_PANEL'
  | 'UPDATE_PANEL_DATA'
  | 'HIGHLIGHT_ELEMENTS'
  | 'UPDATE_BOQ_ROW'
  | 'SCROLL_TO_SECTION'
  | 'EXPORT_DATA'
  | 'ELEMENT_SELECTED'
  | 'MEASUREMENT_COMPLETED'
  | 'SEND_CHAT_MESSAGE'
  | 'PANEL_LOADING';

export type PanelEvent =
  | { type: 'ACTIVATE_PANEL'; panelId: PanelId; autoExpand?: boolean }
  | { type: 'UPDATE_PANEL_DATA'; panelId: PanelId; data: unknown; merge?: boolean }
  | { type: 'HIGHLIGHT_ELEMENTS'; elementIds: string[] }
  | { type: 'UPDATE_BOQ_ROW'; rowId: string; updates: Record<string, unknown> }
  | { type: 'SCROLL_TO_SECTION'; sectionId: string }
  | { type: 'EXPORT_DATA'; format: 'pdf' | 'excel' | 'json'; panelId?: PanelId }
  | { type: 'ELEMENT_SELECTED'; elementId: string; properties: Record<string, unknown> }
  | { type: 'MEASUREMENT_COMPLETED'; value: number; unit: string }
  | { type: 'SEND_CHAT_MESSAGE'; message: string }
  | { type: 'PANEL_LOADING'; panelId: PanelId; isLoading: boolean; toolId?: string; message?: string };

export interface PanelEventMessage {
  source: 'chat' | 'panel' | 'system';
  timestamp: number;
  event: PanelEvent;
}

type EventCallback = (message: PanelEventMessage) => void;

export class PanelEventBus {
  private listeners: Map<PanelEventType, Set<EventCallback>> = new Map();

  subscribe(eventType: PanelEventType, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  publish(message: PanelEventMessage): void {
    const callbacks = this.listeners.get(message.event.type);
    if (callbacks) {
      callbacks.forEach((callback) => callback(message));
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
