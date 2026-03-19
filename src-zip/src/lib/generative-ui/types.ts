/**
 * Generative UI Types for BIM Agent
 *
 * Component specifications that can be dynamically rendered in chat
 * Similar to Vercel AI SDK's render() pattern and A2UI from second-brain-research-dashboard
 */

export type ComponentZone =
  | 'tool-call'      // Tool execution visualization
  | 'analysis'       // Carbon, clash, compliance results
  | 'data'           // Tables, charts, metrics
  | 'model'          // 3D model cards, element info
  | 'certification'  // Edge, TREES, bank eligibility
  | 'recommendation' // Optimization suggestions
  | 'progress';      // Loading states, progress bars

export interface GenerativeUIComponent {
  id: string;
  type: string; // e.g., "bim.CarbonResult", "bim.ToolCallCard"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic props for generative UI components
  props: Record<string, any>;
  children?: GenerativeUIComponent[];
  layout?: {
    width?: string;
    height?: string;
    position?: 'relative' | 'absolute' | 'fixed' | 'sticky';
    className?: string;
  };
  styling?: {
    variant?: string;
    theme?: string;
    className?: string;
  };
  zone?: ComponentZone;
  metadata?: {
    timestamp?: string;
    agent?: string;
    toolName?: string;
  };
}

/**
 * Component renderer function signature
 * Uses any for flexibility - renderers handle dynamic props
 */
export type ComponentRenderer = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic props for generative UI
  props: any,
  children?: React.ReactNode
) => React.ReactElement;

/**
 * Tool call state for visualization
 */
export interface ToolCallVisualization {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  startedAt?: Date;
  completedAt?: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic tool arguments
  arguments?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic tool result
  result?: any;
  error?: string;
  progress?: number;
  description?: string;
}

/**
 * Analysis result types for BIM
 */
export interface CarbonAnalysisResult {
  totalCarbon: number;
  unit: 'kgCO2e';
  breakdown: {
    materials: number;
    construction: number;
    transport: number;
  };
  hotspots: Array<{
    element: string;
    carbon: number;
    percentage: number;
  }>;
  recommendations: string[];
}

export interface ClashDetectionResult {
  totalClashes: number;
  severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  clashes: Array<{
    id: string;
    elements: string[];
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }>;
}

export interface ComplianceResult {
  passed: boolean;
  score: number;
  checks: Array<{
    code: string;
    requirement: string;
    status: 'pass' | 'fail' | 'warning';
    details: string;
  }>;
}

/**
 * BIM Element for element list
 */
export interface BIMElement {
  id: string;
  name: string;
  type: string;
  material?: string;
  properties?: Record<string, string | number>;
}

/**
 * Element list result
 */
export interface ElementListResult {
  elements: BIMElement[];
  totalCount: number;
  groupBy?: 'type' | 'material' | 'none';
}

/**
 * BOQ (Bill of Quantities) item
 */
export interface BOQItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost?: number;
  totalCost?: number;
  material?: string;
  remarks?: string;
}

/**
 * BOQ result
 */
export interface BOQResult {
  items: BOQItem[];
  summary: {
    totalItems: number;
    totalCost?: number;
    currency?: string;
  };
  categories: string[];
}
