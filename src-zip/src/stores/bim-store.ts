import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type {
  BIMModel,
  BIMElement,
  SelectionState,
  CameraState,
  ViewportCommand,
  BIMElementType,
} from '@/types';
import type { ProcessingProgress, Scene3D, MCPConnectionState } from '@/mcp';
import type {
  ThatOpenTool,
  FragmentsProperties,
  ThatOpenSelection,
} from '@/types/thatopen';

// ============================================
// Element Index for O(1) Lookups
// ============================================

/**
 * Element indexes for fast O(1) lookups on large models
 * Built automatically when setCurrentModel is called
 *
 * ★ Insight ─────────────────────────────────────
 * For enterprise BIM models (100K-1M elements), O(n) array
 * operations become a bottleneck. These indexes provide:
 * - O(1) getElementById vs O(n) array.find
 * - O(1) getElementsByType vs O(n) array.filter
 * Trade-off: ~2x memory for elements, but 1000x faster queries
 * ─────────────────────────────────────────────────
 */
export interface ElementIndexes {
  /** Map from element ID to element (O(1) lookup) */
  byId: Map<string, BIMElement>;
  /** Map from element type to set of element IDs (O(1) type query) */
  byType: Map<BIMElementType | string, Set<string>>;
  /** Total element count for quick access */
  count: number;
}

/**
 * Build element indexes from a BIMModel
 */
function buildElementIndexes(model: BIMModel | null): ElementIndexes {
  const byId = new Map<string, BIMElement>();
  const byType = new Map<BIMElementType | string, Set<string>>();

  if (model?.elements) {
    for (const element of model.elements) {
      // Index by ID
      byId.set(element.id, element);

      // Index by type
      if (!byType.has(element.type)) {
        byType.set(element.type, new Set());
      }
      byType.get(element.type)!.add(element.id);
    }
  }

  return {
    byId,
    byType,
    count: byId.size,
  };
}

// ============================================
// Analytics Data from AI Analysis
// ============================================

export interface AIAnalyticsData {
  /** Sustainability analysis content from AI */
  sustainabilityAnalysis: string | null;
  /** Last updated timestamp */
  lastUpdated: Date | null;
  /** Whether analytics have been loaded from AI */
  hasAIAnalysis: boolean;
}

// ============================================
// MCP Processing State
// ============================================

export interface MCPProcessingState {
  /** Whether floor plan processing is active */
  isProcessing: boolean;
  /** Current processing progress */
  progress: ProcessingProgress | null;
  /** Generated 3D scene (before conversion to BIMModel) */
  scene3D: Scene3D | null;
  /** Processing error if any */
  processingError: string | null;
  /** MCP connection state */
  connectionState: MCPConnectionState;
  /** Session ID for current processing */
  sessionId: string | null;
}

interface BIMStore {
  // Model State
  currentModel: BIMModel | null;
  models: BIMModel[];
  isLoading: boolean;
  error: string | null;

  // Element Indexes for O(1) lookups
  elementIndexes: ElementIndexes;

  // Selection State
  selection: SelectionState;

  // Camera State
  camera: CameraState;

  // Viewport Commands Queue
  pendingCommands: ViewportCommand[];

  // Current viewport command (for immediate execution)
  viewportCommand: ViewportCommand | null;

  // MCP Processing State
  mcpState: MCPProcessingState;

  // AI Analytics Data
  analyticsData: AIAnalyticsData;

  // That Open Integration
  thatOpenComponents: unknown | null;
  fragmentsModels: Map<string, { properties: FragmentsProperties }>;
  activeTool: ThatOpenTool;
  thatOpenSelection: ThatOpenSelection;
  measurements: Array<{ id: string; type: string; value: number; unit: string }>;
  sectionPlanes: Array<{ id: string; active: boolean }>;

  // Actions
  setCurrentModel: (model: BIMModel | null) => void;
  addModel: (model: BIMModel) => void;
  removeModel: (modelId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Analytics Actions
  setAnalyticsData: (data: Partial<AIAnalyticsData>) => void;
  clearAnalyticsData: () => void;

  // MCP Actions
  setMCPProcessing: (isProcessing: boolean) => void;
  setMCPProgress: (progress: ProcessingProgress | null) => void;
  setMCPScene3D: (scene: Scene3D | null) => void;
  setMCPError: (error: string | null) => void;
  setMCPConnectionState: (state: MCPConnectionState) => void;
  setMCPSessionId: (sessionId: string | null) => void;
  resetMCPState: () => void;

  // Selection Actions
  selectElements: (ids: string[]) => void;
  addToSelection: (ids: string[]) => void;
  removeFromSelection: (ids: string[]) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;
  isolateElements: (ids: string[]) => void;
  hideElements: (ids: string[]) => void;
  showAllElements: () => void;

  // Camera Actions
  setCamera: (camera: Partial<CameraState>) => void;
  focusOnElements: (ids: string[]) => void;
  resetCamera: () => void;

  // Viewport Command Actions
  executeCommand: (command: ViewportCommand) => void;
  addPendingCommand: (command: ViewportCommand) => void;
  setViewportCommand: (command: ViewportCommand | null) => void;
  clearViewportCommand: () => void;
  clearCommands: () => void;

  // Element Queries
  getElementById: (id: string) => BIMElement | undefined;
  getElementsByType: (type: string) => BIMElement[];
  getSelectedElements: () => BIMElement[];

  // That Open Actions
  setThatOpenComponents: (components: unknown) => void;
  addFragmentsModel: (modelId: string, data: { properties: FragmentsProperties }) => void;
  removeFragmentsModel: (modelId: string) => void;
  setActiveTool: (tool: ThatOpenTool) => void;
  setThatOpenSelection: (selection: ThatOpenSelection) => void;
  addMeasurement: (measurement: { id: string; type: string; value: number; unit: string }) => void;
  clearMeasurements: () => void;
  addSectionPlane: (plane: { id: string; active: boolean }) => void;
  removeSectionPlane: (id: string) => void;
  clearSectionPlanes: () => void;

  // Reset Action
  reset: () => void;
}

const initialCamera: CameraState = {
  position: { x: 10, y: 10, z: 10 },
  target: { x: 0, y: 0, z: 0 },
  zoom: 1,
  mode: 'orbit',
};

const initialSelection: SelectionState = {
  selectedIds: [],
  hoveredId: null,
  isolatedIds: [],
  hiddenIds: [],
};

const initialMCPState: MCPProcessingState = {
  isProcessing: false,
  progress: null,
  scene3D: null,
  processingError: null,
  connectionState: 'disconnected',
  sessionId: null,
};

const initialAnalyticsData: AIAnalyticsData = {
  sustainabilityAnalysis: null,
  lastUpdated: null,
  hasAIAnalysis: false,
};

// That Open Integration Initial State
const initialThatOpenSelection: ThatOpenSelection = {
  expressIDs: [],
  fragmentIDs: [],
};

export const useBIMStore = create<BIMStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial State
      currentModel: null,
      models: [],
      isLoading: false,
      error: null,
      elementIndexes: { byId: new Map(), byType: new Map(), count: 0 },
      selection: initialSelection,
      camera: initialCamera,
      pendingCommands: [],
      viewportCommand: null,
      mcpState: initialMCPState,
      analyticsData: initialAnalyticsData,

      // That Open Integration
      thatOpenComponents: null,
      fragmentsModels: new Map(),
      activeTool: 'select' as ThatOpenTool,
      thatOpenSelection: initialThatOpenSelection,
      measurements: [],
      sectionPlanes: [],

      // Model Actions
      setCurrentModel: (model) => {
        // Build indexes when model is set for O(1) lookups
        const elementIndexes = buildElementIndexes(model);
        set({ currentModel: model, elementIndexes });
      },

      addModel: (model) =>
        set((state) => ({ models: [...state.models, model] })),

      removeModel: (modelId) =>
        set((state) => ({
          models: state.models.filter((m) => m.id !== modelId),
          currentModel:
            state.currentModel?.id === modelId ? null : state.currentModel,
        })),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // MCP Actions
      setMCPProcessing: (isProcessing) =>
        set((state) => ({
          mcpState: { ...state.mcpState, isProcessing },
        })),

      setMCPProgress: (progress) =>
        set((state) => ({
          mcpState: { ...state.mcpState, progress },
        })),

      setMCPScene3D: (scene3D) =>
        set((state) => ({
          mcpState: { ...state.mcpState, scene3D },
        })),

      setMCPError: (processingError) =>
        set((state) => ({
          mcpState: { ...state.mcpState, processingError },
        })),

      setMCPConnectionState: (connectionState) =>
        set((state) => ({
          mcpState: { ...state.mcpState, connectionState },
        })),

      setMCPSessionId: (sessionId) =>
        set((state) => ({
          mcpState: { ...state.mcpState, sessionId },
        })),

      resetMCPState: () =>
        set({ mcpState: initialMCPState }),

      // Analytics Actions
      setAnalyticsData: (data) =>
        set((state) => ({
          analyticsData: {
            ...state.analyticsData,
            ...data,
            lastUpdated: new Date(),
            hasAIAnalysis: true,
          },
        })),

      clearAnalyticsData: () =>
        set({ analyticsData: initialAnalyticsData }),

      // Selection Actions
      selectElements: (ids) =>
        set((state) => ({
          selection: { ...state.selection, selectedIds: ids },
        })),

      addToSelection: (ids) =>
        set((state) => ({
          selection: {
            ...state.selection,
            selectedIds: [...new Set([...state.selection.selectedIds, ...ids])],
          },
        })),

      removeFromSelection: (ids) =>
        set((state) => ({
          selection: {
            ...state.selection,
            selectedIds: state.selection.selectedIds.filter(
              (id) => !ids.includes(id)
            ),
          },
        })),

      clearSelection: () =>
        set((state) => ({
          selection: { ...state.selection, selectedIds: [] },
        })),

      setHovered: (id) =>
        set((state) => ({
          selection: { ...state.selection, hoveredId: id },
        })),

      isolateElements: (ids) =>
        set((state) => ({
          selection: { ...state.selection, isolatedIds: ids },
        })),

      hideElements: (ids) =>
        set((state) => ({
          selection: {
            ...state.selection,
            hiddenIds: [...new Set([...state.selection.hiddenIds, ...ids])],
          },
        })),

      showAllElements: () =>
        set((state) => ({
          selection: { ...state.selection, isolatedIds: [], hiddenIds: [] },
        })),

      // Camera Actions
      setCamera: (cameraUpdate) =>
        set((state) => ({
          camera: { ...state.camera, ...cameraUpdate },
        })),

      focusOnElements: (ids) => {
        // Queue a focus command for the viewport to execute
        const command: ViewportCommand = { type: 'focus', data: { elementIds: ids } };
        set((state) => ({
          pendingCommands: [...state.pendingCommands, command],
        }));
      },

      resetCamera: () => set({ camera: initialCamera }),

      // Viewport Command Actions
      executeCommand: (command) =>
        set((state) => ({
          pendingCommands: [...state.pendingCommands, command],
        })),

      addPendingCommand: (command) =>
        set((state) => ({
          pendingCommands: [...state.pendingCommands, command],
        })),

      setViewportCommand: (command) =>
        set({ viewportCommand: command }),

      clearViewportCommand: () =>
        set({ viewportCommand: null }),

      clearCommands: () => set({ pendingCommands: [] }),

      // Element Queries - O(1) using indexes
      getElementById: (id) => {
        // O(1) lookup using HashMap index
        return get().elementIndexes.byId.get(id);
      },

      getElementsByType: (type) => {
        // O(1) type lookup + O(k) element retrieval where k = matching elements
        const indexes = get().elementIndexes;
        const ids = indexes.byType.get(type);
        if (!ids) return [];

        const elements: BIMElement[] = [];
        for (const id of ids) {
          const el = indexes.byId.get(id);
          if (el) elements.push(el);
        }
        return elements;
      },

      getSelectedElements: () => {
        // O(k) where k = selected count, using HashMap
        const indexes = get().elementIndexes;
        const selectedIds = get().selection.selectedIds;

        const elements: BIMElement[] = [];
        for (const id of selectedIds) {
          const el = indexes.byId.get(id);
          if (el) elements.push(el);
        }
        return elements;
      },

      // That Open Actions
      setThatOpenComponents: (components) =>
        set({ thatOpenComponents: components }),

      addFragmentsModel: (modelId, data) =>
        set((state) => {
          const newMap = new Map(state.fragmentsModels);
          newMap.set(modelId, data);
          return { fragmentsModels: newMap };
        }),

      removeFragmentsModel: (modelId) =>
        set((state) => {
          const newMap = new Map(state.fragmentsModels);
          newMap.delete(modelId);
          return { fragmentsModels: newMap };
        }),

      setActiveTool: (tool) =>
        set({ activeTool: tool }),

      setThatOpenSelection: (selection) =>
        set({ thatOpenSelection: selection }),

      addMeasurement: (measurement) =>
        set((state) => ({
          measurements: [...state.measurements, measurement],
        })),

      clearMeasurements: () =>
        set({ measurements: [] }),

      addSectionPlane: (plane) =>
        set((state) => ({
          sectionPlanes: [...state.sectionPlanes, plane],
        })),

      removeSectionPlane: (id) =>
        set((state) => ({
          sectionPlanes: state.sectionPlanes.filter((p) => p.id !== id),
        })),

      clearSectionPlanes: () =>
        set({ sectionPlanes: [] }),

      // Reset Action
      reset: () =>
        set({
          currentModel: null,
          models: [],
          isLoading: false,
          error: null,
          elementIndexes: { byId: new Map(), byType: new Map(), count: 0 },
          selection: initialSelection,
          camera: initialCamera,
          pendingCommands: [],
          viewportCommand: null,
          mcpState: initialMCPState,
          analyticsData: initialAnalyticsData,
          thatOpenComponents: null,
          fragmentsModels: new Map(),
          activeTool: 'select' as ThatOpenTool,
          thatOpenSelection: initialThatOpenSelection,
          measurements: [],
          sectionPlanes: [],
        }),
    })),
    { name: 'bim-store' }
  )
);

// Selector hooks for common patterns
export const useSelectedElements = () =>
  useBIMStore((state) => state.getSelectedElements());

export const useCurrentModel = () =>
  useBIMStore((state) => state.currentModel);

export const useSelection = () =>
  useBIMStore((state) => state.selection);

export const useCamera = () =>
  useBIMStore((state) => state.camera);

// MCP State selectors
export const useMCPState = () =>
  useBIMStore((state) => state.mcpState);

export const useMCPProcessing = () =>
  useBIMStore((state) => state.mcpState.isProcessing);

export const useMCPProgress = () =>
  useBIMStore((state) => state.mcpState.progress);

export const useMCPScene3D = () =>
  useBIMStore((state) => state.mcpState.scene3D);

export const useMCPConnectionState = () =>
  useBIMStore((state) => state.mcpState.connectionState);

// Analytics selectors
export const useAnalyticsData = () =>
  useBIMStore((state) => state.analyticsData);

export const useHasAIAnalysis = () =>
  useBIMStore((state) => state.analyticsData.hasAIAnalysis);

// That Open selectors
export const useThatOpenComponents = () =>
  useBIMStore((state) => state.thatOpenComponents);

export const useFragmentsModels = () =>
  useBIMStore((state) => state.fragmentsModels);

export const useActiveTool = () =>
  useBIMStore((state) => state.activeTool);

export const useThatOpenSelection = () =>
  useBIMStore((state) => state.thatOpenSelection);

export const useMeasurements = () =>
  useBIMStore((state) => state.measurements);

export const useSectionPlanes = () =>
  useBIMStore((state) => state.sectionPlanes);
