'use client';

/**
 * PanelEventContext - React Context for the singleton panel event bus
 *
 * IMPORTANT: Uses the singleton panelEventBus from src/lib/panel/event-bus.ts
 * This ensures that Tambo tools (which also import the singleton) and React
 * components (which use this context) share the SAME event bus instance.
 *
 * Previously, this created a NEW PanelEventBus instance, causing events
 * published by Tambo tools to never reach panel components.
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import panelEventBus from '@/lib/panel/event-bus';

// Use type-only import to get the class type for context typing
type PanelEventBusType = typeof panelEventBus;

const PanelEventContext = createContext<PanelEventBusType | null>(null);

export function PanelEventProvider({ children }: { children: ReactNode }) {
  // Use the singleton instance - no ref needed since it's always the same instance
  return (
    <PanelEventContext.Provider value={panelEventBus}>
      {children}
    </PanelEventContext.Provider>
  );
}

export function usePanelEvents(): PanelEventBusType {
  const bus = useContext(PanelEventContext);
  if (!bus) {
    throw new Error('usePanelEvents must be used within PanelEventProvider');
  }
  return bus;
}
