/**
 * useBIMAgent Hook
 *
 * Unified state hook following Tambo's single-entry-point pattern.
 * Aggregates state from chat-store, shared-state-store, panel-store,
 * and useComponentRegistry into a single interface for components
 * needing agent state.
 */

import { useCallback, useMemo } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { useSharedStateStore } from '@/stores/shared-state-store';
import { usePanelStore } from '@/stores/panel-store';
import { useComponentRegistry } from './useComponentRegistry';
import { componentUpdateBus, type UpdateAction } from '@/lib/generative-ui/update-bus';
import { usePanelEvents } from '@/contexts/PanelEventContext';
import type { ChatMessage } from '@/types';
import type { AgentPhase } from '@/lib/streaming/event-types';
import type { PanelId } from '@/lib/panels/types';
import type { ComponentInstance } from '@/lib/generative-ui/registry';

/**
 * Return type for the useBIMAgent hook
 */
export interface UseBIMAgentReturn {
  // Chat state
  /** Current list of chat messages */
  messages: ChatMessage[];
  /** Whether the agent is currently streaming a response */
  isStreaming: boolean;

  // Agent state
  /** Current phase of agent execution */
  agentPhase: AgentPhase;
  /** Whether there is a pending HITL (Human-in-the-Loop) request */
  pendingHITL: boolean;

  // Panel state
  /** Currently active panel, if any */
  activePanel: PanelId | null;
  /** Set of enabled tab IDs */
  enabledTabs: Set<PanelId>;

  // Component instances (from useComponentRegistry)
  /** Current list of all registered generative UI component instances */
  components: ComponentInstance[];

  // Actions
  /**
   * Send a message to the agent
   * @param message - The message content to send
   */
  sendMessage: (message: string) => void;

  /**
   * Update a generative UI component's props
   * @param id - The component instance ID
   * @param props - The props to update
   * @param action - The update action: 'update' (default) or 'replace'
   */
  updateComponent: (
    id: string,
    props: Record<string, unknown>,
    action?: UpdateAction
  ) => void;

  /**
   * Activate a specific panel
   * @param panelId - The panel to activate
   */
  activatePanel: (panelId: PanelId) => void;

  /**
   * Enable a tab in the panel system
   * @param tabId - The tab to enable
   */
  enableTab: (tabId: PanelId) => void;
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Unified hook that aggregates state from multiple stores and provides
 * a single entry point for components needing agent state.
 *
 * @returns Object with aggregated state and action methods
 *
 * @example
 * ```tsx
 * function ChatPanel() {
 *   const {
 *     messages,
 *     isStreaming,
 *     agentPhase,
 *     pendingHITL,
 *     components,
 *     sendMessage,
 *     updateComponent,
 *     activatePanel,
 *   } = useBIMAgent();
 *
 *   return (
 *     <div>
 *       {messages.map(msg => <Message key={msg.id} {...msg} />)}
 *       {isStreaming && <StreamingIndicator phase={agentPhase} />}
 *       {pendingHITL && <HITLDialog />}
 *       <input onSubmit={(e) => sendMessage(e.target.value)} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useBIMAgent(): UseBIMAgentReturn {
  // Subscribe to chat store state
  const messages = useChatStore((state) => state.messages);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const agentState = useChatStore((state) => state.agentState);
  const addMessage = useChatStore((state) => state.addMessage);

  // Subscribe to shared state store
  const chatContext = useSharedStateStore((state) => state.chatContext);

  // Subscribe to panel store state
  const activePanelId = usePanelStore((state) => state.activePanelId);
  const enabledTabs = usePanelStore((state) => state.enabledTabs);
  const storActivatePanel = usePanelStore((state) => state.activatePanel);
  const storeEnableTab = usePanelStore((state) => state.enableTab);

  // Get component registry state
  const { components } = useComponentRegistry();

  // Get panel event bus
  const panelEventBus = usePanelEvents();

  // Derived state
  const agentPhase = agentState.phase;
  const pendingHITL = chatContext.pendingHITL !== null;

  // Action: Send a message
  const sendMessage = useCallback(
    (message: string) => {
      const chatMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      addMessage(chatMessage);
    },
    [addMessage]
  );

  // Action: Update a component
  const updateComponent = useCallback(
    (id: string, props: Record<string, unknown>, action: UpdateAction = 'update') => {
      componentUpdateBus.emit(id, props, action);
    },
    []
  );

  // Action: Activate a panel
  const activatePanel = useCallback(
    (panelId: PanelId) => {
      // Update panel store
      storActivatePanel(panelId);

      // Publish event to panel event bus
      panelEventBus.publish('system', {
        type: 'ACTIVATE_PANEL',
        panelId,
      });
    },
    [storActivatePanel, panelEventBus]
  );

  // Action: Enable a tab
  const enableTab = useCallback(
    (tabId: PanelId) => {
      storeEnableTab(tabId);
    },
    [storeEnableTab]
  );

  // Return memoized object with stable references
  return useMemo(
    () => ({
      // State
      messages,
      isStreaming,
      agentPhase,
      pendingHITL,
      activePanel: activePanelId,
      enabledTabs,
      components,

      // Actions
      sendMessage,
      updateComponent,
      activatePanel,
      enableTab,
    }),
    [
      messages,
      isStreaming,
      agentPhase,
      pendingHITL,
      activePanelId,
      enabledTabs,
      components,
      sendMessage,
      updateComponent,
      activatePanel,
      enableTab,
    ]
  );
}
