/**
 * Panel Module
 *
 * Exports event bus, context detection, and panel communication utilities.
 */

export {
  // Event Bus
  panelEventBus,
  // Types
  type PanelId,
  type EventSource,
  type PanelEvent,
  type PanelEventPayload,
  type EventCallback,
  type SubscriptionOptions,
  // Event Types
  type ActivatePanelEvent,
  type UpdatePanelDataEvent,
  type HighlightElementsEvent,
  type NavigateToCameraEvent,
  type UpdateBOQRowEvent,
  type AddBOQRowEvent,
  type ScrollToSectionEvent,
  type ExportDataEvent,
  type PanelSelectionEvent,
  type PanelErrorEvent,
  type PanelReadyEvent,
  // Helper Functions
  activatePanel,
  highlightElements,
  updatePanelData,
  requestExport,
  updateBOQRow,
  addBOQRow,
  // React Hooks
  usePanelEvent,
  usePanelPublish,
} from './event-bus';

export {
  // Context Detector
  PanelContextDetector,
  // Types
  type DetectionContext,
  type DetectionResult,
  // React Hook
  useContextDetection,
} from './context-detector';
