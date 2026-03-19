/**
 * Report Generation Types
 *
 * Type definitions for BIM analysis reports
 */

import type { BIMModel, BIMElement } from '@/types';
import type {
  SpatialAnalysis,
  ElementSummary,
  EgressAnalysis,
  SustainabilityMetrics,
} from '@/lib/ifc/extraction';

// ============================================
// Report Types
// ============================================

export type ReportType =
  | 'spatial'
  | 'sustainability'
  | 'compliance'
  | 'mep'
  | 'cost'
  | 'comprehensive';

export type ReportFormat = 'json' | 'markdown' | 'html';

export type ReportStatus = 'pending' | 'generating' | 'complete' | 'error';

// ============================================
// Report Sections
// ============================================

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  charts?: ChartData[];
  tables?: TableData[];
  issues?: ReportIssue[];
}

export interface ChartData {
  type: 'pie' | 'bar' | 'line' | 'gauge';
  title: string;
  data: Array<{ label: string; value: number; color?: string }>;
}

export interface TableData {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}

export interface ReportIssue {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  title: string;
  description: string;
  elementIds?: string[];
  recommendation?: string;
}

// ============================================
// Report Structure
// ============================================

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  generatedAt: Date;
  modelId: string;
  modelName: string;
  status: ReportStatus;
  sections: ReportSection[];
  summary: ReportSummary;
  metadata: ReportMetadata;
}

export interface ReportSummary {
  keyFindings: string[];
  criticalIssues: number;
  warnings: number;
  recommendations: string[];
  overallScore?: number;
  complianceStatus?: 'compliant' | 'non-compliant' | 'partial';
}

export interface ReportMetadata {
  generatedBy: string;
  version: string;
  analysisDepth: 'quick' | 'standard' | 'comprehensive';
  includedAnalyses: string[];
  processingTimeMs: number;
}

// ============================================
// Analysis Input Types
// ============================================

export interface SpatialReportInput {
  model: BIMModel;
  analysis: SpatialAnalysis;
  elements: ElementSummary;
}

export interface SustainabilityReportInput {
  model: BIMModel;
  metrics: SustainabilityMetrics;
  targetCertification?: 'leed' | 'breeam' | 'well' | 'passivhaus';
}

export interface ComplianceReportInput {
  model: BIMModel;
  egress: EgressAnalysis;
  buildingCode: string;
  occupancyType: string;
}

export interface ComprehensiveReportInput {
  model: BIMModel;
  spatial: SpatialAnalysis;
  elements: ElementSummary;
  sustainability: SustainabilityMetrics;
  egress: EgressAnalysis;
}

// ============================================
// Report Generation Options
// ============================================

export interface ReportOptions {
  format: ReportFormat;
  includeCharts: boolean;
  includeTables: boolean;
  includeRecommendations: boolean;
  depth: 'quick' | 'standard' | 'comprehensive';
  language?: string;
}

export const DEFAULT_REPORT_OPTIONS: ReportOptions = {
  format: 'markdown',
  includeCharts: true,
  includeTables: true,
  includeRecommendations: true,
  depth: 'standard',
  language: 'en',
};
