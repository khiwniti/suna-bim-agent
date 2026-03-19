/**
 * Reports Module
 *
 * Report generation for BIM analysis results
 */

export {
  ReportGenerator,
  generateReport,
  reportToMarkdown,
} from './generator';

export type {
  Report,
  ReportSection,
  ReportSummary,
  ReportType,
  ReportFormat,
  ReportStatus,
  ReportOptions,
  ReportIssue,
  ChartData,
  TableData,
  ReportMetadata,
  SpatialReportInput,
  SustainabilityReportInput,
  ComplianceReportInput,
  ComprehensiveReportInput,
} from './types';

export { DEFAULT_REPORT_OPTIONS } from './types';

// TGO (Thailand Greenhouse Gas Management Organization) Templates
export {
  generateTGOReport,
  generateCFOReport,
  generateCFPReport,
  generateTREESReport,
  tgoReportToMarkdown,
} from './tgo-templates';

export type {
  TGOReportType,
  TGOProjectInfo,
  TGOAnalysisInput,
  MaterialEmission,
} from './tgo-templates';

// Export Functions (PDF & Excel)
export {
  generatePDF,
  downloadPDF,
  PDFReportGenerator,
} from './export-pdf';

export {
  generateExcel,
  downloadExcel,
  generateCSV,
  downloadCSV,
  ExcelReportGenerator,
} from './export-excel';
