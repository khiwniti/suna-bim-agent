/**
 * Ribbon Store - State management for BIM Ribbon Toolbar
 *
 * Manages:
 * - Active tab state
 * - Collapsed/expanded state
 * - Quick access toolbar customization
 * - Tool activation and options
 * - Toggle states for view options
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type { RibbonState, RibbonActions } from '@/types/ribbon';

// ============================================
// Initial State
// ============================================

const initialState: RibbonState = {
  activeTab: 'home',
  collapsed: false,
  quickAccessItems: ['file.save', 'history.undo', 'history.redo'],
  activeTool: null,
  toolOptions: {},
  toggleStates: {
    'display.shadows': false,
    'display.edges': true,
    'display.grid': true,
  },
};

// ============================================
// Store
// ============================================

export const useRibbonStore = create<RibbonState & RibbonActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        ...initialState,

        // Actions
        setActiveTab: (tab: string) => set({ activeTab: tab }),

        setCollapsed: (collapsed: boolean) => set({ collapsed }),

        setActiveTool: (tool: string | null) => set({ activeTool: tool }),

        setToolOption: (tool: string, option: string, value: unknown) =>
          set((state) => ({
            toolOptions: {
              ...state.toolOptions,
              [tool]: {
                ...(state.toolOptions[tool] || {}),
                [option]: value,
              },
            },
          })),

        setToggleState: (id: string, checked: boolean) =>
          set((state) => ({
            toggleStates: {
              ...state.toggleStates,
              [id]: checked,
            },
          })),

        addQuickAccessItem: (commandId: string) =>
          set((state) => ({
            quickAccessItems: state.quickAccessItems.includes(commandId)
              ? state.quickAccessItems
              : [...state.quickAccessItems, commandId],
          })),

        removeQuickAccessItem: (commandId: string) =>
          set((state) => ({
            quickAccessItems: state.quickAccessItems.filter((id) => id !== commandId),
          })),

        executeCommand: (commandId: string, data?: unknown) => {
          // This will be connected to the command registry
          console.log('Execute command:', commandId, data);

          // Handle built-in commands
          if (commandId.startsWith('display.')) {
            const toggleId = commandId;
            const currentState = get().toggleStates[toggleId] ?? false;
            get().setToggleState(toggleId, !currentState);
          }
        },
      }),
      {
        name: 'ribbon-storage',
        // Only persist user preferences, not transient state
        partialize: (state) => ({
          quickAccessItems: state.quickAccessItems,
          collapsed: state.collapsed,
          toggleStates: state.toggleStates,
        }),
      }
    )
  )
);

// ============================================
// Selectors
// ============================================

export const selectActiveTab = (state: RibbonState) => state.activeTab;
export const selectIsCollapsed = (state: RibbonState) => state.collapsed;
export const selectActiveTool = (state: RibbonState) => state.activeTool;
export const selectQuickAccessItems = (state: RibbonState) => state.quickAccessItems;
export const selectToggleState = (state: RibbonState, id: string) => state.toggleStates[id] ?? false;
