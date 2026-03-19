/**
 * PDF Report Export Module
 *
 * Generates professional PDF reports for TGO carbon analysis
 * Supports Thai language and TGO branding
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Report, ReportSection, TableData, ChartData } from './types';

// Extend jsPDF types for autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

// ============================================
// PDF Configuration
// ============================================

interface PDFConfig {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  headerHeight: number;
  footerHeight: number;
  contentWidth: number;
  colors: {
    primary: [number, number, number];
    secondary: [number, number, number];
    accent: [number, number, number];
    text: [number, number, number];
    lightGray: [number, number, number];
  };
  fonts: {
    title: number;
    heading: number;
    subheading: number;
    body: number;
    caption: number;
  };
}

const PDF_CONFIG: PDFConfig = {
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  margin: 20,
  headerHeight: 25,
  footerHeight: 15,
  contentWidth: 170, // 210 - (20 * 2)
  colors: {
    primary: [16, 185, 129], // Emerald-500
    secondary: [5, 150, 105], // Emerald-600
    accent: [6, 78, 59], // Emerald-900
    text: [31, 41, 55], // Gray-800
    lightGray: [243, 244, 246], // Gray-100
  },
  fonts: {
    title: 24,
    heading: 16,
    subheading: 14,
    body: 10,
    caption: 8,
  },
};

// ============================================
// PDF Generator Class
// ============================================

export class PDFReportGenerator {
  private doc: jsPDF;
  private config: PDFConfig;
  private currentY: number;
  private pageNumber: number;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    this.config = PDF_CONFIG;
    this.currentY = this.config.margin;
    this.pageNumber = 1;
  }

  /**
   * Generate PDF from a Report object
   */
  async generate(report: Report): Promise<Blob> {
    // Cover page
    this.addCoverPage(report);

    // Table of Contents
    this.addNewPage();
    this.addTableOfContents(report);

    // Report sections
    for (const section of report.sections) {
      this.addSection(section);
    }

    // Summary page
    this.addNewPage();
    this.addSummaryPage(report);

    return this.doc.output('blob');
  }

  /**
   * Add cover page with TGO branding
   */
  private addCoverPage(report: Report): void {
    const { pageWidth, pageHeight, colors, fonts } = this.config;

    // Header gradient bar
    this.doc.setFillColor(...colors.primary);
    this.doc.rect(0, 0, pageWidth, 60, 'F');

    // Title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(fonts.title);
    const titleLines = report.title.split('\n');
    let titleY = 25;
    for (const line of titleLines) {
      this.doc.text(line, pageWidth / 2, titleY, { align: 'center' });
      titleY += 12;
    }

    // Description
    this.doc.setFontSize(fonts.body);
    this.doc.text(report.description, pageWidth / 2, titleY + 5, { align: 'center' });

    // Main content area
    this.doc.setTextColor(...colors.text);
    this.doc.setFontSize(fonts.heading);

    // Report info box
    const boxY = 90;
    const boxHeight = 80;
    this.doc.setFillColor(...colors.lightGray);
    this.doc.roundedRect(20, boxY, pageWidth - 40, boxHeight, 5, 5, 'F');

    this.doc.setFontSize(fonts.subheading);
    this.doc.text('Report Information', 30, boxY + 15);

    this.doc.setFontSize(fonts.body);
    const info = [
      [`Report Type:`, report.type.toUpperCase()],
      [`Generated:`, report.generatedAt.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })],
      [`Model:`, report.modelName],
      [`Status:`, report.status.toUpperCase()],
    ];

    let infoY = boxY + 30;
    for (const [label, value] of info) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, 30, infoY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(value, 80, infoY);
      infoY += 12;
    }

    // Key findings preview
    if (report.summary.keyFindings.length > 0) {
      const findingsY = boxY + boxHeight + 30;
      this.doc.setFillColor(...colors.primary);
      this.doc.setTextColor(255, 255, 255);
      this.doc.roundedRect(20, findingsY, pageWidth - 40, 10, 2, 2, 'F');
      this.doc.setFontSize(fonts.subheading);
      this.doc.text('Key Findings', pageWidth / 2, findingsY + 7, { align: 'center' });

      this.doc.setTextColor(...colors.text);
      this.doc.setFontSize(fonts.body);
      let findingY = findingsY + 20;
      for (const finding of report.summary.keyFindings.slice(0, 4)) {
        this.doc.text(`• ${finding}`, 25, findingY);
        findingY += 8;
      }
    }

    // Footer
    this.doc.setFontSize(fonts.caption);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text(
      'Generated by BIM Carbon Platform - TGO Report Generator',
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
    this.doc.text(
      report.metadata.generatedBy,
      pageWidth / 2,
      pageHeight - 15,
      { align: 'center' }
    );
  }

  /**
   * Add table of contents
   */
  private addTableOfContents(report: Report): void {
    const { pageWidth, colors, fonts, margin } = this.config;

    this.doc.setFillColor(...colors.primary);
    this.doc.rect(0, 0, pageWidth, 20, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(fonts.heading);
    this.doc.text('Table of Contents', margin, 14);

    this.doc.setTextColor(...colors.text);
    this.doc.setFontSize(fonts.body);

    let tocY = 40;
    report.sections.forEach((section, index) => {
      const pageNum = index + 3; // Cover + TOC + sections
      this.doc.text(`${index + 1}. ${section.title}`, margin, tocY);
      this.doc.text(`${pageNum}`, pageWidth - margin, tocY, { align: 'right' });

      // Dotted line - use dots character instead of setLineDash (not in types)
      const textWidth = this.doc.getTextWidth(`${index + 1}. ${section.title}`);
      const pageNumWidth = this.doc.getTextWidth(`${pageNum}`);
      const dotsStart = margin + textWidth + 5;
      const dotsEnd = pageWidth - margin - pageNumWidth - 5;
      const dotsWidth = dotsEnd - dotsStart;
      if (dotsWidth > 10) {
        const dots = '.'.repeat(Math.floor(dotsWidth / 2));
        this.doc.setFontSize(8);
        this.doc.setTextColor(...colors.lightGray);
        this.doc.text(dots, dotsStart, tocY);
        this.doc.setTextColor(...colors.text);
        this.doc.setFontSize(this.config.fonts.body);
      }

      tocY += 10;
    });
  }

  /**
   * Add a report section
   */
  private addSection(section: ReportSection): void {
    this.addNewPage();

    const { pageWidth, colors, fonts, margin } = this.config;

    // Section header
    this.doc.setFillColor(...colors.primary);
    this.doc.rect(0, 0, pageWidth, 20, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(fonts.heading);
    this.doc.text(section.title, margin, 14);

    this.currentY = 35;

    // Parse and render markdown content
    this.renderMarkdownContent(section.content);

    // Add tables if present
    if (section.tables && section.tables.length > 0) {
      for (const table of section.tables) {
        this.addTable(table);
      }
    }

    // Add charts if present (as placeholders with data)
    if (section.charts && section.charts.length > 0) {
      for (const chart of section.charts) {
        this.addChartPlaceholder(chart);
      }
    }
  }

  /**
   * Render markdown content to PDF
   */
  private renderMarkdownContent(content: string): void {
    const { margin, pageHeight, fonts, colors } = this.config;
    const lines = content.split('\n');

    for (const line of lines) {
      // Check for page break
      if (this.currentY > pageHeight - 40) {
        this.addNewPage();
        this.currentY = 35;
      }

      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('## ')) {
        // H2 heading
        this.doc.setFontSize(fonts.subheading);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(...colors.secondary);
        this.doc.text(trimmedLine.replace('## ', ''), margin, this.currentY);
        this.currentY += 10;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(...colors.text);
      } else if (trimmedLine.startsWith('### ')) {
        // H3 heading
        this.doc.setFontSize(fonts.body + 2);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(trimmedLine.replace('### ', ''), margin, this.currentY);
        this.currentY += 8;
        this.doc.setFont('helvetica', 'normal');
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        // Bullet point
        this.doc.setFontSize(fonts.body);
        const bulletText = trimmedLine.substring(2);
        this.doc.text('•', margin, this.currentY);
        this.doc.text(bulletText, margin + 5, this.currentY);
        this.currentY += 6;
      } else if (trimmedLine.startsWith('| ') && trimmedLine.endsWith(' |')) {
        // Skip markdown tables (handled separately)
        continue;
      } else if (trimmedLine === '---') {
        // Horizontal rule
        this.doc.setDrawColor(...colors.lightGray);
        this.doc.line(margin, this.currentY, this.config.pageWidth - margin, this.currentY);
        this.currentY += 8;
      } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        // Bold text
        this.doc.setFontSize(fonts.body);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(trimmedLine.replace(/\*\*/g, ''), margin, this.currentY);
        this.doc.setFont('helvetica', 'normal');
        this.currentY += 6;
      } else if (trimmedLine.length > 0 && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('!')) {
        // Regular text
        this.doc.setFontSize(fonts.body);
        const splitText = this.doc.splitTextToSize(trimmedLine, this.config.contentWidth);
        this.doc.text(splitText, margin, this.currentY);
        this.currentY += splitText.length * 5;
      } else if (trimmedLine.length === 0) {
        // Empty line
        this.currentY += 3;
      }
    }
  }

  /**
   * Add a data table
   */
  private addTable(table: TableData): void {
    if (this.currentY > this.config.pageHeight - 60) {
      this.addNewPage();
      this.currentY = 35;
    }

    const { margin, colors } = this.config;

    // Table title
    this.doc.setFontSize(this.config.fonts.body + 1);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(table.title, margin, this.currentY);
    this.currentY += 8;
    this.doc.setFont('helvetica', 'normal');

    // Generate table
    autoTable(this.doc, {
      startY: this.currentY,
      head: [table.headers],
      body: table.rows.map(row => row.map(cell => String(cell))),
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: colors.text,
      },
      alternateRowStyles: {
        fillColor: colors.lightGray,
      },
      styles: {
        cellPadding: 3,
        overflow: 'linebreak',
      },
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  /**
   * Add chart placeholder with data summary
   */
  private addChartPlaceholder(chart: ChartData): void {
    if (this.currentY > this.config.pageHeight - 80) {
      this.addNewPage();
      this.currentY = 35;
    }

    const { margin, colors, fonts } = this.config;

    // Chart title
    this.doc.setFontSize(fonts.body + 1);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(chart.title, margin, this.currentY);
    this.currentY += 8;

    // Draw chart box
    const chartHeight = 50;
    this.doc.setDrawColor(...colors.secondary);
    this.doc.setFillColor(...colors.lightGray);
    this.doc.roundedRect(margin, this.currentY, this.config.contentWidth, chartHeight, 3, 3, 'FD');

    // Add data summary inside box
    this.doc.setFontSize(fonts.caption);
    this.doc.setFont('helvetica', 'normal');
    let dataY = this.currentY + 10;
    for (const item of chart.data.slice(0, 5)) {
      const percentage = ((item.value / chart.data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1);
      this.doc.text(`${item.label}: ${item.value.toLocaleString()} (${percentage}%)`, margin + 10, dataY);
      dataY += 8;
    }

    this.currentY += chartHeight + 10;
  }

  /**
   * Add summary page
   */
  private addSummaryPage(report: Report): void {
    const { pageWidth, colors, fonts, margin } = this.config;

    // Header
    this.doc.setFillColor(...colors.primary);
    this.doc.rect(0, 0, pageWidth, 20, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(fonts.heading);
    this.doc.text('Summary & Recommendations', margin, 14);

    this.currentY = 35;
    this.doc.setTextColor(...colors.text);

    // Key metrics box
    this.doc.setFillColor(...colors.lightGray);
    this.doc.roundedRect(margin, this.currentY, this.config.contentWidth, 40, 3, 3, 'F');

    this.doc.setFontSize(fonts.subheading);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Key Metrics', margin + 10, this.currentY + 12);

    this.doc.setFontSize(fonts.body);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Critical Issues: ${report.summary.criticalIssues}`, margin + 10, this.currentY + 24);
    this.doc.text(`Warnings: ${report.summary.warnings}`, margin + 80, this.currentY + 24);
    if (report.summary.overallScore !== undefined) {
      this.doc.text(`Overall Score: ${report.summary.overallScore}/100`, margin + 10, this.currentY + 34);
    }

    this.currentY += 55;

    // Recommendations
    this.doc.setFontSize(fonts.subheading);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Recommendations', margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(fonts.body);
    this.doc.setFont('helvetica', 'normal');
    for (const rec of report.summary.recommendations) {
      this.doc.text(`• ${rec}`, margin + 5, this.currentY);
      this.currentY += 8;
    }

    // Compliance status if present
    if (report.summary.complianceStatus) {
      this.currentY += 10;
      this.doc.setFontSize(fonts.subheading);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Compliance Status', margin, this.currentY);
      this.currentY += 10;

      const statusColor = report.summary.complianceStatus === 'compliant'
        ? colors.primary
        : report.summary.complianceStatus === 'partial'
          ? [234, 179, 8] as [number, number, number] // Yellow
          : [239, 68, 68] as [number, number, number]; // Red

      this.doc.setTextColor(...statusColor);
      this.doc.setFontSize(fonts.heading);
      this.doc.text(report.summary.complianceStatus.toUpperCase(), margin, this.currentY);
    }
  }

  /**
   * Add a new page with footer
   */
  private addNewPage(): void {
    if (this.pageNumber > 1) {
      this.addFooter();
    }
    if (this.pageNumber > 1) {
      this.doc.addPage();
    }
    this.pageNumber++;
    this.currentY = this.config.margin;
  }

  /**
   * Add page footer
   */
  private addFooter(): void {
    const { pageWidth, pageHeight, colors, fonts } = this.config;

    this.doc.setFontSize(fonts.caption);
    this.doc.setTextColor(...colors.text);
    this.doc.text(
      `Page ${this.pageNumber}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
}

// ============================================
// Export Functions
// ============================================

/**
 * Generate PDF from Report object
 */
export async function generatePDF(report: Report): Promise<Blob> {
  const generator = new PDFReportGenerator();
  return generator.generate(report);
}

/**
 * Download PDF report
 */
export async function downloadPDF(report: Report, filename?: string): Promise<void> {
  const blob = await generatePDF(report);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${report.type}-report-${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
