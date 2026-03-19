export {
  useBIMStore,
  useSelectedElements,
  useCurrentModel,
  useSelection,
  useCamera,
  useMCPState,
  useMCPProcessing,
  useMCPProgress,
  useMCPScene3D,
  useMCPConnectionState,
  useAnalyticsData,
  useHasAIAnalysis,
} from './bim-store';
export type { MCPProcessingState, AIAnalyticsData } from './bim-store';
export { useChatStore, useMessages, useIsStreaming, useQuickActions } from './chat-store';

// Carbon Analysis Store
export {
  useCarbonStore,
  useCarbonAnalysis,
  useEdgeCertification,
  useTREESAssessment,
  useBankDocument,
  useCertificationLevel,
  useCarbonHotspots,
} from './carbon-store';
export type {
  CarbonState,
  CarbonAnalysisStatus,
  CertificationLevel,
  TREESAssessment,
  BankDocumentState,
  TVERState,
} from './carbon-store';

// Analysis Results Store (centralized for chat ↔ panel integration)
export {
  useAnalysisResultsStore,
  useCarbonResults,
  useBOQResults,
  useClashResults,
  useHasAnalysisResults,
} from './analysis-results-store';
export type {
  CarbonData,
  BOQData,
  ClashData,
} from './analysis-results-store';
