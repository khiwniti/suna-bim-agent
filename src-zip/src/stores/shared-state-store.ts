/**
 * Shared State Store - Bidirectional sync between panels and chat
 *
 * Enables:
 * - Panel tool results to appear in chat context
 * - Chat analysis results to update panel data
 * - HITL (Human-in-the-Loop) request/response management
 * - Viewport command synchronization
 * - Active panel and agent tracking
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================
// Types
// ============================================

export interface AnalysisResult {
  /** Source panel or agent that produced the result */
  source: string;
  /** The result data */
  data: unknown;
  /** Timestamp when the result was added */
  timestamp?: number;
}

export interface HITLRequest {
  /** Unique identifier for this request */
  requestId: string;
  /** Type of HITL interaction needed */
  type: 'confirmation' | 'choice' | 'parameter';
  /** Payload for the HITL component */
  payload: unknown;
  /** Context about where this request originated */
  context?: {
    agentName?: string;
    toolName?: string;
    operation?: string;
  };
}

export interface ViewportCommand {
  /** Type of viewport operation */
  type: 'highlight' | 'isolate' | 'zoomTo' | 'setView' | 'clearHighlight';
  /** Element IDs to operate on */
  elementIds?: string[];
  /** View name for setView */
  viewName?: string;
}

interface ChatContext {
  /** Currently active agent */
  currentAgent: string;
  /** Accumulated analysis results from tools */
  analysisResults: AnalysisResult[];
  /** Pending HITL request waiting for user response */
  pendingHITL: HITLRequest | null;
}

// ============================================
// Store Interface
// ============================================

interface SharedStateStore {
  // State
  /** Panel data keyed by panel ID */
  panelData: Record<string, unknown>;
  /** Currently active panel */
  activePanelId: string | null;
  /** Currently selected elements in viewer */
  viewerSelection: string[];
  /** Chat context including agent and analysis results */
  chatContext: ChatContext;

  // Panel ↔ Chat Sync
  /** Sync panel result to chat context */
  syncPanelToChat: (panelId: string, data: unknown) => void;
  /** Sync chat result to panel data */
  syncChatToPanel: (panelId: string, data: unknown) => void;
  /** Sync viewport command */
  syncViewport: (command: ViewportCommand) => void;

  // Panel Management
  /** Set the active panel */
  setActivePanel: (panelId: string | null) => void;

  // Agent Management
  /** Set the current agent */
  setCurrentAgent: (agentName: string) => void;

  // HITL Management
  /** Set a pending HITL request */
  setPendingHITL: (request: HITLRequest) => void;
  /** Clear the pending HITL request */
  clearPendingHITL: () => void;

  // Viewer Management
  /** Set viewer selection */
  setViewerSelection: (elementIds: string[]) => void;

  // Reset
  /** Reset all state to initial values */
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const initialState = {
  panelData: {} as Record<string, unknown>,
  activePanelId: null as string | null,
  viewerSelection: [] as string[],
  chatContext: {
    currentAgent: 'supervisor',
    analysisResults: [] as AnalysisResult[],
    pendingHITL: null as HITLRequest | null,
  },
};

// ============================================
// Store Implementation
// ============================================

export const useSharedStateStore = create<SharedStateStore>()(
  devtools(
    (set) => ({
      // Initial state
      ...initialState,

      // Panel → Chat sync
      syncPanelToChat: (panelId, data) =>
        set(
          (state) => ({
            chatContext: {
              ...state.chatContext,
              analysisResults: [
                ...state.chatContext.analysisResults,
                {
                  source: panelId,
                  data,
                  timestamp: Date.now(),
                },
              ],
            },
          }),
          false,
          'syncPanelToChat'
        ),

      // Chat → Panel sync
      syncChatToPanel: (panelId, data) =>
        set(
          (state) => ({
            panelData: {
              ...state.panelData,
              [panelId]: data,
            },
          }),
          false,
          'syncChatToPanel'
        ),

      // Viewport sync
      syncViewport: (command) =>
        set(
          (state) => {
            if (command.type === 'highlight' && command.elementIds) {
              return { viewerSelection: command.elementIds };
            }
            if (command.type === 'clearHighlight') {
              return { viewerSelection: [] };
            }
            // Other commands don't change local state but could trigger viewer actions
            return state;
          },
          false,
          'syncViewport'
        ),

      // Active panel
      setActivePanel: (panelId) =>
        set({ activePanelId: panelId }, false, 'setActivePanel'),

      // Current agent
      setCurrentAgent: (agentName) =>
        set(
          (state) => ({
            chatContext: {
              ...state.chatContext,
              currentAgent: agentName,
            },
          }),
          false,
          'setCurrentAgent'
        ),

      // HITL management
      setPendingHITL: (request) =>
        set(
          (state) => ({
            chatContext: {
              ...state.chatContext,
              pendingHITL: request,
            },
          }),
          false,
          'setPendingHITL'
        ),

      clearPendingHITL: () =>
        set(
          (state) => ({
            chatContext: {
              ...state.chatContext,
              pendingHITL: null,
            },
          }),
          false,
          'clearPendingHITL'
        ),

      // Viewer selection
      setViewerSelection: (elementIds) =>
        set({ viewerSelection: elementIds }, false, 'setViewerSelection'),

      // Reset
      reset: () =>
        set(
          {
            panelData: {},
            activePanelId: null,
            viewerSelection: [],
            chatContext: {
              currentAgent: 'supervisor',
              analysisResults: [],
              pendingHITL: null,
            },
          },
          false,
          'reset'
        ),
    }),
    { name: 'shared-state' }
  )
);

export default useSharedStateStore;
