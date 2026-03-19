import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import type { PanelId, PanelData } from "@/lib/panels/types";

interface PanelStore {
  // State
  panels: Map<PanelId, PanelData>;
  activePanelId: PanelId | null;
  recentPanelIds: PanelId[];
  expandedPanels: Set<PanelId>;
  panelData: Record<string, PanelData>;
  isSidebarOpen: boolean;
  sidebarWidth: number;
  toggleSidebar: () => void;
  openSidebar: () => void;

  // Tab State
  activeTabId: PanelId | null;
  enabledTabs: Set<PanelId>;
  chatWidth: number;

  // Actions
  activatePanel: (id: PanelId, autoExpand?: boolean) => void;
  expandPanel: (id: PanelId) => void;
  collapsePanel: (id: PanelId) => void;
  togglePanel: (id: PanelId) => void;
  updatePanelData: (id: PanelId, data: Partial<PanelData>) => void;
  closeSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  unloadInactivePanels: () => void;

  // Tab Actions
  setActiveTab: (id: PanelId) => void;
  enableTab: (id: PanelId) => void;
  disableTab: (id: PanelId) => void;
  isTabEnabled: (id: PanelId) => boolean;
  setChatWidth: (width: number) => void;
}

export const usePanelStore = create<PanelStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
      panels: new Map(),
      activePanelId: null,
      recentPanelIds: [],
      expandedPanels: new Set(),
      panelData: {},
      isSidebarOpen: false,
      sidebarWidth: 40,

      // Tab State
      activeTabId: "document-editor" as PanelId,
      enabledTabs: new Set<PanelId>(["document-editor"]),
      chatWidth: 33.3,

      activatePanel: (id, autoExpand = true) => {
        set((state) => {
          const newRecentPanelIds = [
            id,
            ...state.recentPanelIds.filter((pid) => pid !== id),
          ].slice(0, 2);
          const newExpandedPanels = new Set(state.expandedPanels);

          if (autoExpand) {
            newExpandedPanels.add(id);
          }

          return {
            activePanelId: id,
            recentPanelIds: newRecentPanelIds,
            expandedPanels: newExpandedPanels,
            isSidebarOpen: true,
          };
        });
      },

      expandPanel: (id) => {
        set((state) => {
          const newExpandedPanels = new Set(state.expandedPanels);
          newExpandedPanels.add(id);
          return { expandedPanels: newExpandedPanels };
        });
      },

      collapsePanel: (id) => {
        set((state) => {
          const newExpandedPanels = new Set(state.expandedPanels);
          newExpandedPanels.delete(id);
          return { expandedPanels: newExpandedPanels };
        });
      },

      togglePanel: (id) => {
        set((state) => {
          const newExpandedPanels = new Set(state.expandedPanels);
          if (newExpandedPanels.has(id)) {
            newExpandedPanels.delete(id);
          } else {
            newExpandedPanels.add(id);
          }
          return { expandedPanels: newExpandedPanels };
        });
      },

      updatePanelData: (id, data) => {
        set((state) => ({
          panelData: {
            ...state.panelData,
            [id]: {
              ...state.panelData[id],
              ...data,
              lastActive: Date.now(),
            },
          },
        }));
      },

      closeSidebar: () => {
        set({ isSidebarOpen: false });
      },

      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
      },

      openSidebar: () => {
        set({ isSidebarOpen: true });
      },

      setSidebarWidth: (width) => {
        set({ sidebarWidth: Math.max(30, Math.min(60, width)) });
      },

      unloadInactivePanels: () => {
        const { activePanelId, recentPanelIds } = get();
        const keepInMemory = [activePanelId, ...recentPanelIds].filter(Boolean);
        // React will unmount components not in keepInMemory
        console.log("Keeping in memory:", keepInMemory);
      },

      // Tab Actions
      // ★ Insight: setActiveTab now also enables the tab atomically
      // This fixes race conditions when enableTab and setActiveTab are called sequentially
      // The previous implementation would fail because get().enabledTabs returned stale state
      setActiveTab: (id) => {
        set((state) => {
          const newEnabledTabs = new Set(state.enabledTabs);
          newEnabledTabs.add(id); // Always enable the tab when activating
          return {
            activeTabId: id,
            enabledTabs: newEnabledTabs,
          };
        });
      },

      enableTab: (id) => {
        set((state) => {
          const newEnabledTabs = new Set(state.enabledTabs);
          newEnabledTabs.add(id);
          return { enabledTabs: newEnabledTabs };
        });
      },

      disableTab: (id) => {
        // Never disable document-editor
        if (id === "document-editor") return;

        set((state) => {
          const newEnabledTabs = new Set(state.enabledTabs);
          newEnabledTabs.delete(id);
          return { enabledTabs: newEnabledTabs };
        });
      },

      isTabEnabled: (id) => {
        return get().enabledTabs.has(id);
      },

      setChatWidth: (width) => {
        set({ chatWidth: Math.max(25, Math.min(50, width)) });
      },
    }),
    {
      name: "panel-store",
      partialize: (state) => ({
        panelData: state.panelData,
        sidebarWidth: state.sidebarWidth,
        activeTabId: state.activeTabId,
        enabledTabs: Array.from(state.enabledTabs),
        chatWidth: state.chatWidth,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<
          PanelStore & { enabledTabs: PanelId[] }
        >;
        return {
          ...currentState,
          ...persisted,
          // Deserialize enabledTabs from array back to Set
          enabledTabs: persisted.enabledTabs
            ? new Set(persisted.enabledTabs)
            : currentState.enabledTabs,
        };
      },
    },
  )),
);
