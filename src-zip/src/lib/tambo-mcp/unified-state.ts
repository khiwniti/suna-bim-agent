/**
 * Tambo Unified Reactive State Store
 *
 * Centralized state store that synchronizes:
 * - Chat context and conversation state
 * - User interactions and input state
 * - Panel state and active components
 * - Generated component instances with streaming props
 * - Persistent memory metadata
 *
 * Features:
 * - Zustand-based reactive state management
 * - Subscription patterns for cross-component reactivity
 * - State selectors for efficient rendering
 * - Action dispatchers with middleware support
 * - Message bus integration for bidirectional sync
 *
 * @module tambo-mcp/unified-state
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';
import type { ComponentInstance, TamboRegisteredComponent } from './component-registry';
import type { MessageBusMessage, MessageBus } from './message-bus';
import type { MCPConnectionState, TamboGenerationResponse } from './vscode-client';

// ============================================
// State Types
// ============================================

/**
 * Agent phase for workflow tracking
 */
export type AgentPhase =
  | 'idle'
  | 'thinking'
  | 'generating'
  | 'tool-calling'
  | 'streaming'
  | 'complete'
  | 'error';

/**
 * Single chat message
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  /** Generated components in this message */
  components?: Array<{
    instanceId: string;
    componentName: string;
    props: Record<string, unknown>;
  }>;
  /** Tool calls made during this message */
  toolCalls?: Array<{
    id: string;
    name: string;
    status: 'pending' | 'completed' | 'failed';
    result?: unknown;
  }>;
  /** Associated panel actions */
  panelActions?: Array<{
    type: string;
    panelId: string;
    params: Record<string, unknown>;
  }>;
}

/**
 * Thread/conversation container
 */
export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  /** Token count for context window management */
  tokenCount?: number;
}

/**
 * Panel state for tracking active panels
 */
export interface PanelState {
  id: string;
  isActive: boolean;
  isExpanded: boolean;
  data: Record<string, unknown>;
  lastUpdated: number;
}

/**
 * HITL (Human-in-the-Loop) request state
 */
export interface HITLState {
  requestId: string | null;
  type: 'confirmation' | 'choice' | 'parameter' | null;
  payload: Record<string, unknown> | null;
  response: unknown | null;
  pending: boolean;
}

/**
 * Viewport/3D viewer state
 */
export interface ViewportState {
  selectedElementIds: string[];
  highlightedElementIds: string[];
  currentView: string | null;
  pendingCommand: {
    type: string;
    params: Record<string, unknown>;
  } | null;
}

/**
 * Memory/persistence metadata
 */
export interface MemoryMetadata {
  lastSyncedAt: number | null;
  pendingSyncCount: number;
  storageType: 'indexeddb' | 'vscode-storage' | 'file';
  totalThreads: number;
  totalTokens: number;
}

// ============================================
// Store Interface
// ============================================

interface TamboUnifiedState {
  // ===============================
  // MCP Connection State
  // ===============================
  mcpConnectionState: MCPConnectionState;
  mcpServerVersion: string | null;
  availableTools: string[];

  // ===============================
  // Chat State
  // ===============================
  currentThreadId: string | null;
  threads: Record<string, ChatThread>;
  agentPhase: AgentPhase;
  streamingContent: string;
  inputValue: string;
  isProcessing: boolean;

  // ===============================
  // Component State
  // ===============================
  componentInstances: Record<string, ComponentInstance>;
  activeComponentId: string | null;
  registeredComponents: string[];

  // ===============================
  // Panel State
  // ===============================
  panels: Record<string, PanelState>;
  activePanelId: string | null;

  // ===============================
  // HITL State
  // ===============================
  hitl: HITLState;

  // ===============================
  // Viewport State
  // ===============================
  viewport: ViewportState;

  // ===============================
  // Memory State
  // ===============================
  memory: MemoryMetadata;

  // ===============================
  // State Version (for sync)
  // ===============================
  stateVersion: number;
}

interface TamboUnifiedActions {
  // ===============================
  // MCP Actions
  // ===============================
  setMCPConnectionState: (state: MCPConnectionState) => void;
  setMCPServerVersion: (version: string) => void;
  setAvailableTools: (tools: string[]) => void;

  // ===============================
  // Chat Actions
  // ===============================
  setCurrentThread: (threadId: string | null) => void;
  createThread: (title?: string) => string;
  addMessage: (threadId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (threadId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  deleteThread: (threadId: string) => void;
  setAgentPhase: (phase: AgentPhase) => void;
  appendStreamingContent: (content: string) => void;
  clearStreamingContent: () => void;
  setInputValue: (value: string) => void;
  setProcessing: (processing: boolean) => void;

  // ===============================
  // Component Actions
  // ===============================
  addComponentInstance: (instance: ComponentInstance) => void;
  updateComponentInstance: (instanceId: string, updates: Partial<ComponentInstance>) => void;
  removeComponentInstance: (instanceId: string) => void;
  setActiveComponent: (instanceId: string | null) => void;
  setRegisteredComponents: (names: string[]) => void;

  // ===============================
  // Panel Actions
  // ===============================
  setPanel: (panelId: string, state: Partial<PanelState>) => void;
  activatePanel: (panelId: string) => void;
  updatePanelData: (panelId: string, data: Record<string, unknown>) => void;

  // ===============================
  // HITL Actions
  // ===============================
  setHITLRequest: (request: Omit<HITLState, 'response' | 'pending'>) => void;
  setHITLResponse: (response: unknown) => void;
  clearHITL: () => void;

  // ===============================
  // Viewport Actions
  // ===============================
  setSelectedElements: (ids: string[]) => void;
  setHighlightedElements: (ids: string[]) => void;
  setCurrentView: (viewName: string | null) => void;
  executeViewportCommand: (type: string, params: Record<string, unknown>) => void;

  // ===============================
  // Memory Actions
  // ===============================
  updateMemoryMetadata: (metadata: Partial<MemoryMetadata>) => void;
  markSynced: () => void;

  // ===============================
  // Sync Actions
  // ===============================
  syncFromThread: (thread: ChatThread) => void;
  getStateSnapshot: () => TamboStateSnapshot;
  reset: () => void;
}

export type TamboUnifiedStore = TamboUnifiedState & TamboUnifiedActions;

/**
 * Snapshot of state for serialization/sync
 */
export interface TamboStateSnapshot {
  threads: Record<string, ChatThread>;
  panels: Record<string, PanelState>;
  memory: MemoryMetadata;
  stateVersion: number;
  timestamp: number;
}

// ============================================
// Initial State
// ============================================

const initialState: TamboUnifiedState = {
  // MCP
  mcpConnectionState: 'disconnected',
  mcpServerVersion: null,
  availableTools: [],

  // Chat
  currentThreadId: null,
  threads: {},
  agentPhase: 'idle',
  streamingContent: '',
  inputValue: '',
  isProcessing: false,

  // Components
  componentInstances: {},
  activeComponentId: null,
  registeredComponents: [],

  // Panels
  panels: {},
  activePanelId: null,

  // HITL
  hitl: {
    requestId: null,
    type: null,
    payload: null,
    response: null,
    pending: false,
  },

  // Viewport
  viewport: {
    selectedElementIds: [],
    highlightedElementIds: [],
    currentView: null,
    pendingCommand: null,
  },

  // Memory
  memory: {
    lastSyncedAt: null,
    pendingSyncCount: 0,
    storageType: 'indexeddb',
    totalThreads: 0,
    totalTokens: 0,
  },

  // Version
  stateVersion: 0,
};

// ============================================
// Store Implementation
// ============================================

/**
 * Unified reactive state store for Tambo generative UI.
 *
 * @example
 * ```typescript
 * import { useTamboStore } from './unified-state';
 *
 * // In React component
 * const { agentPhase, addMessage, currentThreadId } = useTamboStore();
 *
 * // Subscribe to specific state changes
 * useTamboStore.subscribe(
 *   (state) => state.agentPhase,
 *   (phase) => console.log('Agent phase changed:', phase)
 * );
 *
 * // Use selectors for derived state
 * const currentThread = useTamboStore((s) => s.threads[s.currentThreadId ?? '']);
 * ```
 */
export const useTamboStore = create<TamboUnifiedStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          ...initialState,

          // ===============================
          // MCP Actions
          // ===============================
          setMCPConnectionState: (state) =>
            set({ mcpConnectionState: state }, false, 'setMCPConnectionState'),

          setMCPServerVersion: (version) =>
            set({ mcpServerVersion: version }, false, 'setMCPServerVersion'),

          setAvailableTools: (tools) =>
            set({ availableTools: tools }, false, 'setAvailableTools'),

          // ===============================
          // Chat Actions
          // ===============================
          setCurrentThread: (threadId) =>
            set({ currentThreadId: threadId }, false, 'setCurrentThread'),

          createThread: (title) => {
            const id = `thread-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const now = Date.now();

            set(
              (state) => ({
                threads: {
                  ...state.threads,
                  [id]: {
                    id,
                    title: title ?? `Chat ${Object.keys(state.threads).length + 1}`,
                    messages: [],
                    createdAt: now,
                    updatedAt: now,
                  },
                },
                currentThreadId: id,
                memory: {
                  ...state.memory,
                  totalThreads: state.memory.totalThreads + 1,
                  pendingSyncCount: state.memory.pendingSyncCount + 1,
                },
                stateVersion: state.stateVersion + 1,
              }),
              false,
              'createThread'
            );

            return id;
          },

          addMessage: (threadId, message) =>
            set(
              (state) => {
                const thread = state.threads[threadId];
                if (!thread) return state;

                const newMessage: ChatMessage = {
                  ...message,
                  id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  timestamp: Date.now(),
                };

                return {
                  threads: {
                    ...state.threads,
                    [threadId]: {
                      ...thread,
                      messages: [...thread.messages, newMessage],
                      updatedAt: Date.now(),
                    },
                  },
                  memory: {
                    ...state.memory,
                    pendingSyncCount: state.memory.pendingSyncCount + 1,
                  },
                  stateVersion: state.stateVersion + 1,
                };
              },
              false,
              'addMessage'
            ),

          updateMessage: (threadId, messageId, updates) =>
            set(
              (state) => {
                const thread = state.threads[threadId];
                if (!thread) return state;

                return {
                  threads: {
                    ...state.threads,
                    [threadId]: {
                      ...thread,
                      messages: thread.messages.map((m) =>
                        m.id === messageId ? { ...m, ...updates } : m
                      ),
                      updatedAt: Date.now(),
                    },
                  },
                  stateVersion: state.stateVersion + 1,
                };
              },
              false,
              'updateMessage'
            ),

          deleteThread: (threadId) =>
            set(
              (state) => {
                const { [threadId]: _, ...remainingThreads } = state.threads;
                return {
                  threads: remainingThreads,
                  currentThreadId:
                    state.currentThreadId === threadId ? null : state.currentThreadId,
                  memory: {
                    ...state.memory,
                    totalThreads: Math.max(0, state.memory.totalThreads - 1),
                    pendingSyncCount: state.memory.pendingSyncCount + 1,
                  },
                  stateVersion: state.stateVersion + 1,
                };
              },
              false,
              'deleteThread'
            ),

          setAgentPhase: (phase) =>
            set({ agentPhase: phase }, false, 'setAgentPhase'),

          appendStreamingContent: (content) =>
            set(
              (state) => ({ streamingContent: state.streamingContent + content }),
              false,
              'appendStreamingContent'
            ),

          clearStreamingContent: () =>
            set({ streamingContent: '' }, false, 'clearStreamingContent'),

          setInputValue: (value) =>
            set({ inputValue: value }, false, 'setInputValue'),

          setProcessing: (processing) =>
            set({ isProcessing: processing }, false, 'setProcessing'),

          // ===============================
          // Component Actions
          // ===============================
          addComponentInstance: (instance) =>
            set(
              (state) => ({
                componentInstances: {
                  ...state.componentInstances,
                  [instance.id]: instance,
                },
                stateVersion: state.stateVersion + 1,
              }),
              false,
              'addComponentInstance'
            ),

          updateComponentInstance: (instanceId, updates) =>
            set(
              (state) => {
                const instance = state.componentInstances[instanceId];
                if (!instance) return state;

                return {
                  componentInstances: {
                    ...state.componentInstances,
                    [instanceId]: { ...instance, ...updates, updatedAt: Date.now() },
                  },
                  stateVersion: state.stateVersion + 1,
                };
              },
              false,
              'updateComponentInstance'
            ),

          removeComponentInstance: (instanceId) =>
            set(
              (state) => {
                const { [instanceId]: _, ...remaining } = state.componentInstances;
                return {
                  componentInstances: remaining,
                  activeComponentId:
                    state.activeComponentId === instanceId ? null : state.activeComponentId,
                  stateVersion: state.stateVersion + 1,
                };
              },
              false,
              'removeComponentInstance'
            ),

          setActiveComponent: (instanceId) =>
            set({ activeComponentId: instanceId }, false, 'setActiveComponent'),

          setRegisteredComponents: (names) =>
            set({ registeredComponents: names }, false, 'setRegisteredComponents'),

          // ===============================
          // Panel Actions
          // ===============================
          setPanel: (panelId, panelState) =>
            set(
              (state) => ({
                panels: {
                  ...state.panels,
                  [panelId]: {
                    id: panelId,
                    isActive: false,
                    isExpanded: false,
                    data: {},
                    lastUpdated: Date.now(),
                    ...state.panels[panelId],
                    ...panelState,
                  },
                },
                stateVersion: state.stateVersion + 1,
              }),
              false,
              'setPanel'
            ),

          activatePanel: (panelId) =>
            set(
              (state) => ({
                panels: Object.fromEntries(
                  Object.entries(state.panels).map(([id, panel]) => [
                    id,
                    { ...panel, isActive: id === panelId },
                  ])
                ),
                activePanelId: panelId,
                stateVersion: state.stateVersion + 1,
              }),
              false,
              'activatePanel'
            ),

          updatePanelData: (panelId, data) =>
            set(
              (state) => {
                const panel = state.panels[panelId];
                if (!panel) return state;

                return {
                  panels: {
                    ...state.panels,
                    [panelId]: {
                      ...panel,
                      data: { ...panel.data, ...data },
                      lastUpdated: Date.now(),
                    },
                  },
                  stateVersion: state.stateVersion + 1,
                };
              },
              false,
              'updatePanelData'
            ),

          // ===============================
          // HITL Actions
          // ===============================
          setHITLRequest: (request) =>
            set(
              {
                hitl: {
                  ...request,
                  response: null,
                  pending: true,
                },
              },
              false,
              'setHITLRequest'
            ),

          setHITLResponse: (response) =>
            set(
              (state) => ({
                hitl: {
                  ...state.hitl,
                  response,
                  pending: false,
                },
              }),
              false,
              'setHITLResponse'
            ),

          clearHITL: () =>
            set(
              {
                hitl: {
                  requestId: null,
                  type: null,
                  payload: null,
                  response: null,
                  pending: false,
                },
              },
              false,
              'clearHITL'
            ),

          // ===============================
          // Viewport Actions
          // ===============================
          setSelectedElements: (ids) =>
            set(
              (state) => ({
                viewport: { ...state.viewport, selectedElementIds: ids },
              }),
              false,
              'setSelectedElements'
            ),

          setHighlightedElements: (ids) =>
            set(
              (state) => ({
                viewport: { ...state.viewport, highlightedElementIds: ids },
              }),
              false,
              'setHighlightedElements'
            ),

          setCurrentView: (viewName) =>
            set(
              (state) => ({
                viewport: { ...state.viewport, currentView: viewName },
              }),
              false,
              'setCurrentView'
            ),

          executeViewportCommand: (type, params) =>
            set(
              (state) => ({
                viewport: {
                  ...state.viewport,
                  pendingCommand: { type, params },
                },
              }),
              false,
              'executeViewportCommand'
            ),

          // ===============================
          // Memory Actions
          // ===============================
          updateMemoryMetadata: (metadata) =>
            set(
              (state) => ({
                memory: { ...state.memory, ...metadata },
              }),
              false,
              'updateMemoryMetadata'
            ),

          markSynced: () =>
            set(
              (state) => ({
                memory: {
                  ...state.memory,
                  lastSyncedAt: Date.now(),
                  pendingSyncCount: 0,
                },
              }),
              false,
              'markSynced'
            ),

          // ===============================
          // Sync Actions
          // ===============================
          syncFromThread: (thread) =>
            set(
              (state) => ({
                threads: {
                  ...state.threads,
                  [thread.id]: thread,
                },
                stateVersion: state.stateVersion + 1,
              }),
              false,
              'syncFromThread'
            ),

          getStateSnapshot: () => {
            const state = get();
            return {
              threads: state.threads,
              panels: state.panels,
              memory: state.memory,
              stateVersion: state.stateVersion,
              timestamp: Date.now(),
            };
          },

          reset: () => set(initialState, false, 'reset'),
        }),
        {
          name: 'tambo-unified-state',
          partialize: (state) => ({
            threads: state.threads,
            currentThreadId: state.currentThreadId,
            memory: state.memory,
          }),
        }
      )
    ),
    { name: 'TamboUnifiedStore' }
  )
);

// ============================================
// Selectors
// ============================================

/**
 * Get the current thread
 */
export const selectCurrentThread = (state: TamboUnifiedStore): ChatThread | null =>
  state.currentThreadId ? state.threads[state.currentThreadId] ?? null : null;

/**
 * Get current thread messages
 */
export const selectCurrentMessages = (state: TamboUnifiedStore): ChatMessage[] =>
  selectCurrentThread(state)?.messages ?? [];

/**
 * Get active panel state
 */
export const selectActivePanel = (state: TamboUnifiedStore): PanelState | null =>
  state.activePanelId ? state.panels[state.activePanelId] ?? null : null;

/**
 * Get pending HITL request
 */
export const selectPendingHITL = (state: TamboUnifiedStore): HITLState | null =>
  state.hitl.pending ? state.hitl : null;

/**
 * Check if agent is busy
 */
export const selectIsAgentBusy = (state: TamboUnifiedStore): boolean =>
  state.agentPhase !== 'idle' && state.agentPhase !== 'complete' && state.agentPhase !== 'error';

/**
 * Get all threads sorted by updated time
 */
export const selectThreadsSortedByRecent = (state: TamboUnifiedStore): ChatThread[] =>
  Object.values(state.threads).sort((a, b) => b.updatedAt - a.updatedAt);

// ============================================
// Message Bus Integration
// ============================================

/**
 * Connect the store to a message bus for bidirectional sync
 */
export function connectStoreToMessageBus(messageBus: MessageBus): () => void {
  // Subscribe to panel state changes and sync to store
  const unsubPanel = messageBus.subscribe(
    (msg) => {
      if (msg.type === 'panel-state-change') {
        const payload = (msg as any).payload as {
          panelId: string;
          currentState: Record<string, unknown>;
        };
        useTamboStore.getState().updatePanelData(payload.panelId, payload.currentState);
      }
    },
    { types: ['panel-state-change'] }
  );

  // Subscribe to component state messages
  const unsubComponent = messageBus.subscribe(
    (msg) => {
      if (msg.type === 'component-state') {
        const payload = (msg as any).payload as {
          instanceId: string;
          state: Record<string, unknown>;
        };
        useTamboStore.getState().updateComponentInstance(payload.instanceId, {
          props: payload.state,
        });
      }
    },
    { types: ['component-state'] }
  );

  // Subscribe store changes and broadcast to bus
  const unsubStore = useTamboStore.subscribe(
    (state) => state.stateVersion,
    (version) => {
      const snapshot = useTamboStore.getState().getStateSnapshot();
      messageBus.send({
        type: 'state-sync',
        direction: 'broadcast',
        source: 'state-store',
        target: '*',
        payload: {
          scope: 'global',
          state: snapshot,
          version,
        },
      } as any);
    }
  );

  return () => {
    messageBus.unsubscribe(unsubPanel);
    messageBus.unsubscribe(unsubComponent);
    unsubStore();
  };
}
