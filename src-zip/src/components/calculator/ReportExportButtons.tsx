'use client';

/**
 * Report Export Buttons Component
 *
 * Provides buttons to export carbon analysis reports in various formats
 * (PDF, Excel, CSV, Markdown)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
  Check,
  FileDown,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Report } from '@/lib/reports/types';
import { downloadPDF } from '@/lib/reports/export-pdf';
import { downloadExcel, downloadCSV } from '@/lib/reports/export-excel';
import { tgoReportToMarkdown } from '@/lib/reports/tgo-templates';
import { useTranslation } from '@/i18n/provider';

interface ReportExportButtonsProps {
  report: Report | null;
  onGenerateReport?: () => Promise<Report>;
  className?: string;
  variant?: 'full' | 'compact' | 'dropdown';
}

type ExportFormat = 'pdf' | 'excel' | 'csv' | 'markdown';

interface ExportState {
  isExporting: boolean;
  format: ExportFormat | null;
  success: boolean;
  error: string | null;
}

export function ReportExportButtons({
  report,
  onGenerateReport,
  className = '',
  variant = 'full',
}: ReportExportButtonsProps) {
  const { t } = useTranslation();
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    format: null,
    success: false,
    error: null,
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setExportState({ isExporting: true, format, success: false, error: null });
    setIsDropdownOpen(false);

    try {
      // Generate report if not provided
      let reportToExport = report;
      if (!reportToExport && onGenerateReport) {
        reportToExport = await onGenerateReport();
      }

      if (!reportToExport) {
        throw new Error('No report available for export');
      }

      // Export based on format
      const timestamp = new Date().toISOString().slice(0, 10);
      const baseFilename = `${reportToExport.type}-report-${timestamp}`;

      switch (format) {
        case 'pdf':
          await downloadPDF(reportToExport, `${baseFilename}.pdf`);
          break;
        case 'excel':
          downloadExcel(reportToExport, `${baseFilename}.xlsx`);
          break;
        case 'csv':
          downloadCSV(reportToExport, `${baseFilename}.csv`);
          break;
        case 'markdown':
          const markdown = tgoReportToMarkdown(reportToExport);
          const blob = new Blob([markdown], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${baseFilename}.md`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          break;
      }

      setExportState({ isExporting: false, format, success: true, error: null });

      // Reset success state after 2 seconds
      setTimeout(() => {
        setExportState(prev => ({ ...prev, success: false }));
      }, 2000);
    } catch (error) {
      console.error('Export error:', error);
      setExportState({
        isExporting: false,
        format,
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      });
    }
  };

  const exportOptions = [
    {
      format: 'pdf' as ExportFormat,
      label: t('reportExport.pdfReport'),
      icon: FileText,
      description: t('reportExport.pdfDescription'),
    },
    {
      format: 'excel' as ExportFormat,
      label: t('reportExport.excelSpreadsheet'),
      icon: FileSpreadsheet,
      description: t('reportExport.excelDescription'),
    },
    {
      format: 'csv' as ExportFormat,
      label: t('reportExport.csvData'),
      icon: FileDown,
      description: t('reportExport.csvDescription'),
    },
    {
      format: 'markdown' as ExportFormat,
      label: t('reportExport.markdown'),
      icon: FileText,
      description: t('reportExport.markdownDescription'),
    },
  ];

  // Full variant - all buttons visible
  if (variant === 'full') {
    return (
      <div className={`flex flex-wrap gap-3 ${className}`}>
        {exportOptions.map((option) => {
          const Icon = option.icon;
          const isLoading = exportState.isExporting && exportState.format === option.format;
          const isSuccess = exportState.success && exportState.format === option.format;

          return (
            <Button
              key={option.format}
              onClick={() => handleExport(option.format)}
              disabled={exportState.isExporting || (!report && !onGenerateReport)}
              className="relative group glass-strong hover:scale-105 transition-all duration-200"
              variant="outline"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Exporting...</span>
                  </motion.div>
                ) : isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 text-emerald-500"
                  >
                    <Check className="h-4 w-4" />
                    <span>Downloaded!</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          );
        })}
      </div>
    );
  }

  // Compact variant - icons only
  if (variant === 'compact') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {exportOptions.slice(0, 2).map((option) => {
          const Icon = option.icon;
          const isLoading = exportState.isExporting && exportState.format === option.format;
          const isSuccess = exportState.success && exportState.format === option.format;

          return (
            <Button
              key={option.format}
              onClick={() => handleExport(option.format)}
              disabled={exportState.isExporting || (!report && !onGenerateReport)}
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title={option.label}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSuccess ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </Button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant - single button with dropdown
  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={exportState.isExporting || (!report && !onGenerateReport)}
        className="flex items-center gap-2 glass-strong"
        variant="outline"
      >
        {exportState.isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Exporting...</span>
          </>
        ) : exportState.success ? (
          <>
            <Check className="h-4 w-4 text-emerald-500" />
            <span>Downloaded!</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>{t('reportExport.exportReport')}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </Button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-64 glass-strong rounded-lg border border-white/10 shadow-xl z-50 overflow-hidden"
          >
            {exportOptions.map((option, index) => {
              const Icon = option.icon;

              return (
                <motion.button
                  key={option.format}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleExport(option.format)}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors text-left"
                >
                  <Icon className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* Error message */}
      {exportState.error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 mt-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400"
        >
          {exportState.error}
        </motion.div>
      )}
    </div>
  );
}

export default ReportExportButtons;
