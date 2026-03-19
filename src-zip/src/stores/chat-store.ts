import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChatMessage, QuickAction } from '@/types';
// Use workflow component types for WorkflowTimeline visualization
import type { AgentWorkflowEvent } from '@/components/chat/workflow/types';
import type { ToolCallVisualization } from '@/lib/generative-ui/types';
import type { AgentPhase, AgentError } from '@/lib/streaming/event-types';
import type { PanelId } from '@/lib/panels/types';
import type { FileType } from '@/lib/upload/file-detector';

// View modes for chat display
export type ViewMode = 'simple' | 'detailed';

// Floating panel dock positions
export type DockPosition = 'corner' | 'bottom' | 'side';

/**
 * Uploaded file reference for AI context
 */
export interface UploadedFile {
  id: string;
  filename: string;
  fileType: FileType;
  panelId: PanelId;
  uploadedAt: Date;
  backendId: string;
}

// Agent state (shared between useChat and HeadlessChat)
export interface SharedAgentState {
  phase: AgentPhase;
  currentTool: ToolCallVisualization | null;
  completedTools: ToolCallVisualization[];
  reasoning: string | null;
  progress: number;
  error: AgentError | null;
  startedAt: Date | null;
}

interface ChatStore {
  // Messages
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;

  // Input State
  inputValue: string;
  isListening: boolean;  // Voice input

  // Pending initial message (from landing page)
  pendingInitialMessage: string | null;

  // Context
  contextElementIds: string[];  // Elements referenced in conversation

  // Uploaded Files (for AI context)
  uploadedFiles: UploadedFile[];

  // Quick Actions
  quickActions: QuickAction[];

  // Floating Panel State
  isPanelOpen: boolean;
  dockPosition: DockPosition;
  panelSize: { width: number; height: number };
  unreadCount: number;

  // View Mode State
  viewMode: ViewMode;

  // Workflow Events (for detailed view)
  workflowEvents: AgentWorkflowEvent[];

  // Agent State (shared across components)
  agentState: SharedAgentState;

  // Actions
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  updateMessageMetadata: (id: string, metadata: Partial<NonNullable<ChatMessage['metadata']>>) => void;
  clearMessages: () => void;

  setStreaming: (streaming: boolean) => void;
  setIsStreaming: (streaming: boolean) => void; // Alias for setStreaming
  appendStreamingContent: (content: string) => void;
  clearStreamingContent: () => void;

  setInputValue: (value: string) => void;
  setListening: (listening: boolean) => void;

  setContextElements: (ids: string[]) => void;
  addContextElement: (id: string) => void;
  clearContext: () => void;

  // Uploaded Files Actions
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (id: string) => void;
  clearUploadedFiles: () => void;

  // Pending initial message actions
  setPendingInitialMessage: (message: string | null) => void;
  clearPendingInitialMessage: () => void;

  // Floating Panel Actions
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setDockPosition: (position: DockPosition) => void;
  setPanelSize: (size: { width: number; height: number }) => void;
  incrementUnread: () => void;
  clearUnread: () => void;

  // View Mode Actions
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;

  // Workflow Events Actions
  addWorkflowEvent: (event: AgentWorkflowEvent) => void;
  clearWorkflowEvents: () => void;

  // Agent State Actions (shared across components)
  setAgentPhase: (phase: AgentPhase) => void;
  setAgentCurrentTool: (tool: ToolCallVisualization | null) => void;
  addAgentCompletedTool: (tool: ToolCallVisualization) => void;
  setAgentError: (error: AgentError | null) => void;
  appendAgentReasoning: (text: string) => void;
  resetAgentState: () => void;
}

// Initial agent state
const INITIAL_AGENT_STATE: SharedAgentState = {
  phase: 'idle',
  currentTool: null,
  completedTools: [],
  reasoning: null,
  progress: 0,
  error: null,
  startedAt: null,
};

const defaultQuickActions: QuickAction[] = [
  {
    id: 'overview',
    icon: '🏢',
    label: 'Building Overview',
    prompt: 'Give me an overview of this building model including total area, floors, and key elements.',
    category: 'analysis',
  },
  {
    id: 'sustainability',
    icon: '🌱',
    label: 'Carbon Footprint',
    prompt: 'What is the estimated carbon footprint of this building? Show me the breakdown by materials.',
    category: 'sustainability',
  },
  {
    id: 'energy',
    icon: '⚡',
    label: 'Energy Analysis',
    prompt: 'Analyze the energy efficiency of this building and suggest improvements.',
    category: 'sustainability',
  },
  {
    id: 'spaces',
    icon: '📐',
    label: 'Space Utilization',
    prompt: 'Show me the space utilization breakdown including all rooms and their areas.',
    category: 'analysis',
  },
  {
    id: 'exterior-walls',
    icon: '🧱',
    label: 'Exterior Walls',
    prompt: 'Highlight all exterior walls and show their total area.',
    category: 'navigation',
  },
  {
    id: 'hvac',
    icon: '❄️',
    label: 'HVAC Systems',
    prompt: 'Show me all HVAC equipment and their current status.',
    category: 'analysis',
  },
  {
    id: 'maintenance',
    icon: '🔧',
    label: 'Maintenance Due',
    prompt: 'What equipment needs maintenance soon? Show upcoming maintenance schedules.',
    category: 'report',
  },
  {
    id: 'quote',
    icon: '💰',
    label: 'Generate Quote',
    prompt: 'Generate a cost estimate for the selected elements including materials and labor.',
    category: 'report',
  },
];

export const useChatStore = create<ChatStore>()(
  devtools(
    (set) => ({
      // Initial State
      messages: [],
      isStreaming: false,
      streamingContent: '',
      inputValue: '',
      isListening: false,
      pendingInitialMessage: null,
      contextElementIds: [],
      uploadedFiles: [],
      quickActions: defaultQuickActions,

      // Floating Panel Initial State
      isPanelOpen: false,
      dockPosition: 'corner' as DockPosition,
      panelSize: { width: 420, height: 520 },
      unreadCount: 0,

      // View Mode Initial State
      viewMode: 'simple' as ViewMode,

      // Workflow Events Initial State
      workflowEvents: [],

      // Agent State Initial State
      agentState: INITIAL_AGENT_STATE,

      // Message Actions
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      updateMessageMetadata: (id, metadataUpdates) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id
              ? { ...m, metadata: { ...m.metadata, ...metadataUpdates } }
              : m
          ),
        })),

      clearMessages: () => set({ messages: [], contextElementIds: [] }),

      // Streaming Actions
      setStreaming: (streaming) => set({ isStreaming: streaming }),
      setIsStreaming: (streaming) => set({ isStreaming: streaming }), // Alias

      appendStreamingContent: (content) =>
        set((state) => ({
          streamingContent: state.streamingContent + content,
        })),

      clearStreamingContent: () => set({ streamingContent: '' }),

      // Input Actions
      setInputValue: (value) => set({ inputValue: value }),
      setListening: (listening) => set({ isListening: listening }),

      // Context Actions
      setContextElements: (ids) => set({ contextElementIds: ids }),

      addContextElement: (id) =>
        set((state) => ({
          contextElementIds: [...new Set([...state.contextElementIds, id])],
        })),

      clearContext: () => set({ contextElementIds: [] }),

      // Uploaded Files Actions
      addUploadedFile: (file) =>
        set((state) => ({
          uploadedFiles: [...state.uploadedFiles, file],
        })),

      removeUploadedFile: (id) =>
        set((state) => ({
          uploadedFiles: state.uploadedFiles.filter((f) => f.id !== id),
        })),

      clearUploadedFiles: () => set({ uploadedFiles: [] }),

      // Pending initial message actions
      setPendingInitialMessage: (message) => set({ pendingInitialMessage: message }),
      clearPendingInitialMessage: () => set({ pendingInitialMessage: null }),

      // Floating Panel Actions
      togglePanel: () =>
        set((state) => ({
          isPanelOpen: !state.isPanelOpen,
          unreadCount: state.isPanelOpen ? state.unreadCount : 0,
        })),

      openPanel: () =>
        set({ isPanelOpen: true, unreadCount: 0 }),

      closePanel: () =>
        set({ isPanelOpen: false }),

      setDockPosition: (position) =>
        set({ dockPosition: position }),

      setPanelSize: (size) =>
        set({ panelSize: size }),

      incrementUnread: () =>
        set((state) => ({
          unreadCount: state.isPanelOpen ? 0 : state.unreadCount + 1,
        })),

      clearUnread: () =>
        set({ unreadCount: 0 }),

      // View Mode Actions
      setViewMode: (mode) =>
        set({ viewMode: mode }),

      toggleViewMode: () =>
        set((state) => ({
          viewMode: state.viewMode === 'simple' ? 'detailed' : 'simple',
        })),

      // Workflow Events Actions
      addWorkflowEvent: (event) =>
        set((state) => ({
          workflowEvents: [...state.workflowEvents, event],
        })),

      clearWorkflowEvents: () =>
        set({ workflowEvents: [] }),

      // Agent State Actions (shared across components)
      setAgentPhase: (phase) =>
        set((state) => ({
          agentState: {
            ...state.agentState,
            phase,
            startedAt: state.agentState.phase === 'idle' && phase !== 'idle'
              ? new Date()
              : state.agentState.startedAt,
          },
        })),

      setAgentCurrentTool: (tool) =>
        set((state) => ({
          agentState: {
            ...state.agentState,
            currentTool: tool,
          },
        })),

      addAgentCompletedTool: (tool) =>
        set((state) => ({
          agentState: {
            ...state.agentState,
            currentTool: null,
            completedTools: [...state.agentState.completedTools, tool],
          },
        })),

      setAgentError: (error) =>
        set((state) => ({
          agentState: {
            ...state.agentState,
            phase: error ? 'error' : state.agentState.phase,
            error,
          },
        })),

      appendAgentReasoning: (text) =>
        set((state) => ({
          agentState: {
            ...state.agentState,
            reasoning: (state.agentState.reasoning || '') + text,
          },
        })),

      resetAgentState: () =>
        set({ agentState: INITIAL_AGENT_STATE }),
    }),
    { name: 'chat-store' }
  )
);

// ============================================
// Selector Hooks
// ============================================
// NOTE: All of these convenience selectors are currently UNUSED.
// Components access state directly via useChatStore((state) => state.xxx)
// Consider removing these in the next major version if they remain unused.

/** @deprecated Unused - components use useChatStore directly. Consider removing. */
export const useMessages = () => useChatStore((state) => state.messages);
/** @deprecated Unused - components use useChatStore directly. Consider removing. */
export const useIsStreaming = () => useChatStore((state) => state.isStreaming);
/** @deprecated Unused - components use useChatStore directly. Consider removing. */
export const useQuickActions = () => useChatStore((state) => state.quickActions);
/** @deprecated Unused - components use useChatStore directly. Consider removing. */
export const useIsPanelOpen = () => useChatStore((state) => state.isPanelOpen);
/** @deprecated Unused - components use useChatStore directly. Consider removing. */
export const useDockPosition = () => useChatStore((state) => state.dockPosition);
/** @deprecated Unused - components use useChatStore directly. Consider removing. */
export const useUnreadCount = () => useChatStore((state) => state.unreadCount);
/** @deprecated Unused - components use useChatStore directly. Consider removing. */
export const useViewMode = () => useChatStore((state) => state.viewMode);
/** @deprecated Unused - components use useChatStore directly. Consider removing. */
export const useWorkflowEvents = () => useChatStore((state) => state.workflowEvents);
