'use client';

/**
 * useExportHandler Hook
 *
 * Central handler for panel export functionality.
 * Subscribes to EXPORT_DATA events and triggers PDF/Excel downloads.
 *
 * ★ Insight ─────────────────────────────────────
 * This hook bridges the gap between panel export buttons (which publish events)
 * and the actual export logic (PDF/Excel generators). By centralizing this,
 * we avoid duplicating export logic across every panel component.
 * ─────────────────────────────────────────────────
 */

import { useEffect, useCallback } from 'react';
import { usePanelEvents } from '@/contexts/PanelEventContext';
import { usePanelStore } from '@/stores/panel-store';
import type { PanelId } from '@/lib/panel/event-bus';
import { downloadPDF, downloadExcel } from '@/lib/reports';
import type { Report} from '@/lib/reports/types';

// ============================================
// Types
// ============================================

interface CarbonData {
  totalCarbon: number;
  unit: string;
  materials?: { name: string; carbon: number; percentage: number }[];
  categories?: { category: string; carbon: number }[];
}

interface BOQItem {
  id: string;
  item: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

interface BOQData {
  items: BOQItem[];
  totalCost: number;
  currency: string;
}

interface ClashData {
  clashes: Array<{
    id: string;
    type: string;
    severity: 'critical' | 'major' | 'minor';
    element1: { id: string; name: string; category: string };
    element2: { id: string; name: string; category: string };
    distance?: number;
    resolved?: boolean;
  }>;
  summary?: {
    total: number;
    critical: number;
    major: number;
    minor: number;
    resolved: number;
  };
}

interface DocumentData {
  title: string;
  content: string;
  template?: string;
  lastModified: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Convert carbon data to Report format for PDF generation
 */
function carbonDataToReport(data: CarbonData): Report {
  const sections: Report['sections'] = [];

  // Summary section
  sections.push({
    id: 'summary',
    title: 'Carbon Footprint Summary',
    content: `Total embodied carbon: ${data.totalCarbon.toLocaleString()} ${data.unit}`,
    data: { totalCarbon: data.totalCarbon, unit: data.unit },
  });

  // Materials breakdown
  if (data.materials && data.materials.length > 0) {
    sections.push({
      id: 'materials',
      title: 'Material Breakdown',
      content: 'Carbon emissions by material type',
      tables: [
        {
          title: 'Material Emissions',
          headers: ['Material', 'Carbon (kg CO2e)', 'Percentage'],
          rows: data.materials.map((m) => [m.name, m.carbon, `${m.percentage}%`]),
        },
      ],
      charts: [
        {
          type: 'pie',
          title: 'Material Distribution',
          data: data.materials.map((m) => ({ label: m.name, value: m.carbon })),
        },
      ],
    });
  }

  // Categories breakdown
  if (data.categories && data.categories.length > 0) {
    sections.push({
      id: 'categories',
      title: 'Category Breakdown',
      content: 'Carbon emissions by building category',
      tables: [
        {
          title: 'Category Emissions',
          headers: ['Category', 'Carbon (kg CO2e)'],
          rows: data.categories.map((c) => [c.category, c.carbon]),
        },
      ],
      charts: [
        {
          type: 'bar',
          title: 'Category Distribution',
          data: data.categories.map((c) => ({ label: c.category, value: c.carbon })),
        },
      ],
    });
  }

  return {
    id: `carbon-${Date.now()}`,
    type: 'sustainability',
    title: 'Carbon Footprint Report',
    description: 'Embodied carbon analysis of the BIM model',
    generatedAt: new Date(),
    modelId: 'current-model',
    modelName: 'BIM Model',
    status: 'complete',
    sections,
    summary: {
      keyFindings: [`Total embodied carbon: ${data.totalCarbon.toLocaleString()} ${data.unit}`],
      criticalIssues: 0,
      warnings: 0,
      recommendations: [],
    },
    metadata: {
      generatedBy: 'BIM Agent',
      version: '1.0',
      analysisDepth: 'standard',
      includedAnalyses: ['carbon'],
      processingTimeMs: 0,
    },
  };
}

/**
 * Convert BOQ data to Report format for PDF generation
 */
function boqDataToReport(data: BOQData): Report {
  const sections: Report['sections'] = [
    {
      id: 'summary',
      title: 'Bill of Quantities Summary',
      content: `Total project cost: ${data.totalCost.toLocaleString()} ${data.currency}`,
      data: { totalCost: data.totalCost, currency: data.currency, itemCount: data.items.length },
    },
    {
      id: 'items',
      title: 'Quantity Schedule',
      content: 'Detailed breakdown of all items',
      tables: [
        {
          title: 'Bill of Quantities',
          headers: ['Item', 'Description', 'Qty', 'Unit', 'Unit Cost', 'Total'],
          rows: data.items.map((item) => [
            item.item,
            item.description,
            item.quantity,
            item.unit,
            item.unitCost.toLocaleString(),
            item.totalCost.toLocaleString(),
          ]),
        },
      ],
    },
  ];

  return {
    id: `boq-${Date.now()}`,
    type: 'cost',
    title: 'Bill of Quantities',
    description: 'Quantity take-off and cost estimation',
    generatedAt: new Date(),
    modelId: 'current-model',
    modelName: 'BIM Model',
    status: 'complete',
    sections,
    summary: {
      keyFindings: [
        `${data.items.length} items`,
        `Total: ${data.totalCost.toLocaleString()} ${data.currency}`,
      ],
      criticalIssues: 0,
      warnings: 0,
      recommendations: [],
    },
    metadata: {
      generatedBy: 'BIM Agent',
      version: '1.0',
      analysisDepth: 'standard',
      includedAnalyses: ['boq'],
      processingTimeMs: 0,
    },
  };
}

/**
 * Convert clash data to Report format for PDF generation
 */
function clashDataToReport(data: ClashData): Report {
  const summary = data.summary || {
    total: data.clashes.length,
    critical: data.clashes.filter((c) => c.severity === 'critical').length,
    major: data.clashes.filter((c) => c.severity === 'major').length,
    minor: data.clashes.filter((c) => c.severity === 'minor').length,
    resolved: data.clashes.filter((c) => c.resolved).length,
  };

  const sections: Report['sections'] = [
    {
      id: 'summary',
      title: 'Clash Detection Summary',
      content: `Found ${summary.total} clashes: ${summary.critical} critical, ${summary.major} major, ${summary.minor} minor`,
      data: summary,
    },
    {
      id: 'clashes',
      title: 'Clash Details',
      content: 'All detected clashes',
      tables: [
        {
          title: 'Clash List',
          headers: ['ID', 'Type', 'Severity', 'Element 1', 'Element 2', 'Distance', 'Resolved'],
          rows: data.clashes.map((clash) => [
            clash.id.slice(0, 8),
            clash.type,
            clash.severity,
            clash.element1.name,
            clash.element2.name,
            clash.distance?.toFixed(2) || 'N/A',
            clash.resolved ? 'Yes' : 'No',
          ]),
        },
      ],
    },
  ];

  return {
    id: `clash-${Date.now()}`,
    type: 'comprehensive',
    title: 'Clash Detection Report',
    description: 'Interference detection analysis',
    generatedAt: new Date(),
    modelId: 'current-model',
    modelName: 'BIM Model',
    status: 'complete',
    sections,
    summary: {
      keyFindings: [
        `${summary.total} total clashes detected`,
        `${summary.critical} critical issues requiring immediate attention`,
        `${summary.resolved} clashes already resolved`,
      ],
      criticalIssues: summary.critical,
      warnings: summary.major,
      recommendations: summary.critical > 0 ? ['Address critical clashes before construction'] : [],
    },
    metadata: {
      generatedBy: 'BIM Agent',
      version: '1.0',
      analysisDepth: 'standard',
      includedAnalyses: ['clash-detection'],
      processingTimeMs: 0,
    },
  };
}

// ============================================
// Hook Implementation
// ============================================

export function useExportHandler() {
  const eventBus = usePanelEvents();
  const panels = usePanelStore((state) => state.panels);

  /**
   * Get panel data from store
   */
  const getPanelData = useCallback(
    (panelId: PanelId) => {
      const panel = panels.get(panelId);
      return panel?.state || null;
    },
    [panels]
  );

  /**
   * Export carbon dashboard data
   */
  const exportCarbonDashboard = useCallback(
    async (format: 'pdf' | 'excel') => {
      const state = getPanelData('carbon-dashboard');
      const carbonData = state?.carbonResults as CarbonData | undefined;

      if (!carbonData) {
        console.warn('No carbon data to export');
        return;
      }

      const report = carbonDataToReport(carbonData);
      const filename = `carbon-report-${Date.now()}`;

      if (format === 'pdf') {
        await downloadPDF(report, `${filename}.pdf`);
      } else {
        downloadExcel(report, `${filename}.xlsx`);
      }
    },
    [getPanelData]
  );

  /**
   * Export BOQ table data
   */
  const exportBOQTable = useCallback(
    async (format: 'pdf' | 'excel') => {
      const state = getPanelData('boq-table');
      const boqData = state?.boqResults as BOQData | undefined;

      if (!boqData) {
        console.warn('No BOQ data to export');
        return;
      }

      const report = boqDataToReport(boqData);
      const filename = `boq-report-${Date.now()}`;

      if (format === 'pdf') {
        await downloadPDF(report, `${filename}.pdf`);
      } else {
        downloadExcel(report, `${filename}.xlsx`);
      }
    },
    [getPanelData]
  );

  /**
   * Export clash report data
   */
  const exportClashReport = useCallback(
    async (format: 'pdf' | 'excel') => {
      const state = getPanelData('clash-report');
      const clashData = state?.clashData as ClashData | undefined;

      if (!clashData) {
        console.warn('No clash data to export');
        return;
      }

      const report = clashDataToReport(clashData);
      const filename = `clash-report-${Date.now()}`;

      if (format === 'pdf') {
        await downloadPDF(report, `${filename}.pdf`);
      } else {
        downloadExcel(report, `${filename}.xlsx`);
      }
    },
    [getPanelData]
  );

  /**
   * Export document editor content
   */
  const exportDocument = useCallback(
    async (format: 'pdf' | 'excel') => {
      const state = getPanelData('document-editor');
      const docData = state?.document as DocumentData | undefined;

      if (!docData) {
        console.warn('No document to export');
        return;
      }

      // Documents only export as PDF
      if (format === 'excel') {
        console.warn('Document export only supports PDF');
        return;
      }

      const filename = `${docData.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;

      // Create a simple report from document content
      const report: Report = {
        id: `doc-${Date.now()}`,
        type: 'comprehensive',
        title: docData.title,
        description: 'Generated document',
        generatedAt: new Date(),
        modelId: 'current-model',
        modelName: 'BIM Model',
        status: 'complete',
        sections: [
          {
            id: 'content',
            title: docData.title,
            content: docData.content,
          },
        ],
        summary: {
          keyFindings: [],
          criticalIssues: 0,
          warnings: 0,
          recommendations: [],
        },
        metadata: {
          generatedBy: 'BIM Agent',
          version: '1.0',
          analysisDepth: 'standard',
          includedAnalyses: ['document'],
          processingTimeMs: 0,
        },
      };

      await downloadPDF(report, `${filename}.pdf`);
    },
    [getPanelData]
  );

  /**
   * Handle EXPORT_DATA events
   */
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('EXPORT_DATA', (message) => {
      if (message.event.type !== 'EXPORT_DATA') return;

      const format = message.event.format as 'pdf' | 'excel' | 'json';
      const panelId = message.event.panelId;

      // Map JSON to Excel for compatibility
      const normalizedFormat = format === 'json' ? 'excel' : format;

      // Determine which panel initiated the export
      // If panelId not specified, try to determine from active panel
      const targetPanel = panelId || 'carbon-dashboard';

      switch (targetPanel) {
        case 'carbon-dashboard':
          exportCarbonDashboard(normalizedFormat);
          break;
        case 'boq-table':
          exportBOQTable(normalizedFormat);
          break;
        case 'clash-report':
          exportClashReport(normalizedFormat);
          break;
        case 'document-editor':
          exportDocument(normalizedFormat);
          break;
        default:
          console.warn(`Export not supported for panel: ${targetPanel}`);
      }
    });

    return unsubscribe;
  }, [eventBus, exportCarbonDashboard, exportBOQTable, exportClashReport, exportDocument]);

  return {
    exportCarbonDashboard,
    exportBOQTable,
    exportClashReport,
    exportDocument,
  };
}

export default useExportHandler;
