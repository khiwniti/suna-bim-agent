/**
 * Report Generator
 *
 * Generates structured reports from BIM analysis results
 */

import { nanoid } from 'nanoid';
import type { BIMModel } from '@/types';
import {
  analyzeSpatialStructure,
  summarizeElements,
  analyzeEgress,
  calculateSustainability,
  type SpatialAnalysis,
  type SustainabilityMetrics,
  type EgressAnalysis,
} from '@/lib/ifc/extraction';
import type {
  Report,
  ReportSection,
  ReportSummary,
  ReportType,
  ReportOptions,
  ReportIssue,
  ChartData,
  TableData,
} from './types';
import { DEFAULT_REPORT_OPTIONS } from './types';

// ============================================
// Report Generator Class
// ============================================

export class ReportGenerator {
  private model: BIMModel;
  private options: ReportOptions;
  private startTime: number;

  constructor(model: BIMModel, options: Partial<ReportOptions> = {}) {
    this.model = model;
    this.options = { ...DEFAULT_REPORT_OPTIONS, ...options };
    this.startTime = Date.now();
  }

  /**
   * Generate a comprehensive report covering all analyses
   */
  async generateComprehensive(): Promise<Report> {
    const spatial = analyzeSpatialStructure(this.model);
    const elements = summarizeElements(this.model);
    const sustainability = calculateSustainability(this.model);
    const egress = analyzeEgress(this.model);

    const sections: ReportSection[] = [
      this.generateExecutiveSummarySection(spatial, sustainability, egress),
      this.generateSpatialSection(spatial),
      this.generateElementsSection(elements),
      this.generateSustainabilitySection(sustainability),
      this.generateComplianceSection(egress),
      this.generateRecommendationsSection(sustainability, egress),
    ];

    const allIssues = sections.flatMap(s => s.issues || []);
    const summary = this.generateSummary(allIssues, sustainability, egress);

    return this.buildReport('comprehensive', sections, summary);
  }

  /**
   * Generate a spatial analysis report
   */
  async generateSpatial(): Promise<Report> {
    const spatial = analyzeSpatialStructure(this.model);
    const elements = summarizeElements(this.model);

    const sections: ReportSection[] = [
      this.generateSpatialSection(spatial),
      this.generateElementsSection(elements),
    ];

    const summary: ReportSummary = {
      keyFindings: [
        `Total area: ${spatial.totalArea.toLocaleString()}m²`,
        `${spatial.floorCount} floors with average ${spatial.averageFloorArea.toFixed(0)}m² per floor`,
        `Net-to-gross ratio: ${(spatial.netToGrossRatio * 100).toFixed(1)}%`,
      ],
      criticalIssues: 0,
      warnings: spatial.netToGrossRatio < 0.75 ? 1 : 0,
      recommendations: spatial.netToGrossRatio < 0.75
        ? ['Consider optimizing circulation areas to improve net-to-gross ratio']
        : [],
    };

    return this.buildReport('spatial', sections, summary);
  }

  /**
   * Generate a sustainability report
   */
  async generateSustainability(): Promise<Report> {
    const sustainability = calculateSustainability(this.model);

    const sections: ReportSection[] = [
      this.generateSustainabilitySection(sustainability),
      this.generateRecommendationsSection(sustainability),
    ];

    const summary: ReportSummary = {
      keyFindings: [
        `Total embodied carbon: ${sustainability.estimatedEmbodiedCarbon.toLocaleString()} kgCO2e`,
        `Carbon intensity: ${sustainability.carbonPerSquareMeter} kgCO2e/m²`,
        `Energy use intensity: ${sustainability.energyUseIntensity} kWh/m²/year`,
      ],
      criticalIssues: sustainability.carbonPerSquareMeter > 1000 ? 1 : 0,
      warnings: sustainability.carbonPerSquareMeter > 500 ? 1 : 0,
      recommendations: sustainability.recommendations.map(r => r.suggestion),
    };

    return this.buildReport('sustainability', sections, summary);
  }

  /**
   * Generate a compliance report
   */
  async generateCompliance(): Promise<Report> {
    const egress = analyzeEgress(this.model);

    const sections: ReportSection[] = [
      this.generateComplianceSection(egress),
    ];

    const summary: ReportSummary = {
      keyFindings: [
        `Occupant load: ${egress.occupantLoad} persons`,
        `Required exits: ${egress.requiredExits}, Actual exits: ${egress.actualExits}`,
        egress.compliant ? 'Building appears compliant with egress requirements' : 'Compliance issues detected',
      ],
      criticalIssues: egress.issues.filter(i => i.severity === 'critical').length,
      warnings: egress.issues.filter(i => i.severity === 'high' || i.severity === 'medium').length,
      recommendations: egress.issues.map(i => i.description),
      complianceStatus: egress.compliant ? 'compliant' : 'non-compliant',
    };

    return this.buildReport('compliance', sections, summary);
  }

  // ============================================
  // Section Generators
  // ============================================

  private generateExecutiveSummarySection(
    spatial: SpatialAnalysis,
    sustainability: SustainabilityMetrics,
    egress: EgressAnalysis
  ): ReportSection {
    return {
      id: 'executive-summary',
      title: 'Executive Summary',
      content: `
## Building Overview

**${this.model.name}** is a ${spatial.floorCount}-story building with a total area of ${spatial.totalArea.toLocaleString()}m².

### Key Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Total Area | ${spatial.totalArea.toLocaleString()}m² | ✓ |
| Floor Count | ${spatial.floorCount} | ✓ |
| Net-to-Gross Ratio | ${(spatial.netToGrossRatio * 100).toFixed(1)}% | ${spatial.netToGrossRatio >= 0.8 ? '✓' : '⚠️'} |
| Embodied Carbon | ${sustainability.estimatedEmbodiedCarbon.toLocaleString()} kgCO2e | ${sustainability.carbonPerSquareMeter < 500 ? '✓' : '⚠️'} |
| Egress Compliance | ${egress.compliant ? 'Compliant' : 'Issues Found'} | ${egress.compliant ? '✓' : '❌'} |

### Critical Findings

${egress.issues.filter(i => i.severity === 'critical').map(i => `- ❌ ${i.description}`).join('\n') || '- No critical issues found'}
      `.trim(),
      data: {
        totalArea: spatial.totalArea,
        floorCount: spatial.floorCount,
        embodiedCarbon: sustainability.estimatedEmbodiedCarbon,
        egressCompliant: egress.compliant,
      },
    };
  }

  private generateSpatialSection(spatial: SpatialAnalysis): ReportSection {
    const charts: ChartData[] = [];

    if (this.options.includeCharts) {
      charts.push({
        type: 'pie',
        title: 'Area Distribution',
        data: [
          { label: 'Net Usable Area', value: spatial.totalArea * spatial.netToGrossRatio, color: '#22c55e' },
          { label: 'Circulation', value: spatial.circulationArea, color: '#f59e0b' },
          { label: 'Other', value: spatial.totalArea * (1 - spatial.netToGrossRatio) - spatial.circulationArea, color: '#94a3b8' },
        ],
      });
    }

    return {
      id: 'spatial-analysis',
      title: 'Spatial Analysis',
      content: `
## Spatial Characteristics

### Area Summary

- **Total Gross Area:** ${spatial.totalArea.toLocaleString()}m²
- **Net Usable Area:** ${(spatial.totalArea * spatial.netToGrossRatio).toLocaleString()}m²
- **Circulation Area:** ${spatial.circulationArea.toLocaleString()}m²
- **Net-to-Gross Ratio:** ${(spatial.netToGrossRatio * 100).toFixed(1)}%

### Building Volume

- **Total Volume:** ${spatial.totalVolume.toLocaleString()}m³
- **Average Floor Height:** ${(spatial.totalVolume / spatial.totalArea).toFixed(2)}m

### Floor Distribution

- **Number of Floors:** ${spatial.floorCount}
- **Average Floor Area:** ${spatial.averageFloorArea.toFixed(0)}m²

### Space Utilization Assessment

${spatial.netToGrossRatio >= 0.85 ? '✓ Excellent space efficiency (>85%)' : ''}
${spatial.netToGrossRatio >= 0.8 && spatial.netToGrossRatio < 0.85 ? '✓ Good space efficiency (80-85%)' : ''}
${spatial.netToGrossRatio < 0.8 ? '⚠️ Space efficiency below optimal (<80%)' : ''}
      `.trim(),
      charts,
    };
  }

  private generateElementsSection(elements: ReturnType<typeof summarizeElements>): ReportSection {
    const tables: TableData[] = [];

    if (this.options.includeTables) {
      tables.push({
        title: 'Elements by Type',
        headers: ['Element Type', 'Count', 'Percentage'],
        rows: Object.entries(elements.byType).map(([type, count]) => [
          type.charAt(0).toUpperCase() + type.slice(1),
          count,
          `${((count / elements.totalCount) * 100).toFixed(1)}%`,
        ]),
      });
    }

    return {
      id: 'elements-summary',
      title: 'Building Elements',
      content: `
## Element Summary

This building contains **${elements.totalCount}** modeled elements.

### Distribution by Type

${Object.entries(elements.byType)
  .map(([type, count]) => `- **${type.charAt(0).toUpperCase() + type.slice(1)}:** ${count}`)
  .join('\n')}

### Distribution by Level

${Object.entries(elements.byLevel)
  .map(([level, count]) => `- **${level}:** ${count} elements`)
  .join('\n')}
      `.trim(),
      tables,
    };
  }

  private generateSustainabilitySection(sustainability: SustainabilityMetrics): ReportSection {
    const charts: ChartData[] = [];
    const issues: ReportIssue[] = [];

    if (this.options.includeCharts) {
      charts.push({
        type: 'bar',
        title: 'Carbon by Material',
        data: sustainability.materialBreakdown.slice(0, 5).map(m => ({
          label: m.material.charAt(0).toUpperCase() + m.material.slice(1),
          value: m.estimatedCarbon,
          color: m.material === 'timber' ? '#22c55e' : '#ef4444',
        })),
      });

      charts.push({
        type: 'gauge',
        title: 'Carbon Intensity',
        data: [
          { label: 'Current', value: sustainability.carbonPerSquareMeter },
          { label: 'Target', value: 300 }, // RIBA 2030 target
        ],
      });
    }

    // Check for high carbon issues
    if (sustainability.carbonPerSquareMeter > 500) {
      issues.push({
        id: 'high-carbon',
        severity: 'warning',
        category: 'Sustainability',
        title: 'High Carbon Intensity',
        description: `Carbon intensity of ${sustainability.carbonPerSquareMeter} kgCO2e/m² exceeds recommended targets`,
        recommendation: 'Consider low-carbon material alternatives',
      });
    }

    return {
      id: 'sustainability',
      title: 'Sustainability Analysis',
      content: `
## Carbon Assessment

### Embodied Carbon

- **Total Embodied Carbon:** ${sustainability.estimatedEmbodiedCarbon.toLocaleString()} kgCO2e
- **Carbon Intensity:** ${sustainability.carbonPerSquareMeter} kgCO2e/m²
- **RIBA 2030 Target:** 300 kgCO2e/m² ${sustainability.carbonPerSquareMeter <= 300 ? '✓ Met' : '⚠️ Exceeded'}

### Operational Energy

- **Estimated Energy Use Intensity:** ${sustainability.energyUseIntensity} kWh/m²/year

### Material Carbon Breakdown

${sustainability.materialBreakdown.slice(0, 5).map(m =>
  `- **${m.material.charAt(0).toUpperCase() + m.material.slice(1)}:** ${m.estimatedCarbon.toLocaleString()} kgCO2e (${m.percentage.toFixed(1)}%)`
).join('\n')}
      `.trim(),
      charts,
      issues,
    };
  }

  private generateComplianceSection(egress: EgressAnalysis): ReportSection {
    const issues: ReportIssue[] = egress.issues.map(i => ({
      id: nanoid(),
      severity: i.severity === 'critical' ? 'critical' : i.severity === 'high' ? 'error' : 'warning',
      category: 'Egress',
      title: i.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: i.description,
      recommendation: i.location,
    }));

    return {
      id: 'compliance',
      title: 'Code Compliance',
      content: `
## Egress Analysis

### Occupant Load

- **Calculated Occupant Load:** ${egress.occupantLoad} persons
- **Building Area Factor:** Based on occupancy classification

### Exit Requirements

| Requirement | Required | Actual | Status |
|-------------|----------|--------|--------|
| Exit Count | ${egress.requiredExits} | ${egress.actualExits} | ${egress.actualExits >= egress.requiredExits ? '✓' : '❌'} |
| Max Travel Distance | ${60}m | ~${egress.maxTravelDistance.toFixed(1)}m | ${egress.maxTravelDistance <= 60 ? '✓' : '⚠️'} |

### Compliance Status

**Overall Status:** ${egress.compliant ? '✓ COMPLIANT' : '❌ NON-COMPLIANT'}

${egress.issues.length > 0 ? '### Issues Found\n\n' + egress.issues.map(i =>
  `- **${i.severity.toUpperCase()}:** ${i.description}`
).join('\n') : '✓ No compliance issues detected'}
      `.trim(),
      issues,
    };
  }

  private generateRecommendationsSection(
    sustainability?: SustainabilityMetrics,
    egress?: EgressAnalysis
  ): ReportSection {
    const allRecommendations: Array<{ priority: string; text: string }> = [];

    if (sustainability) {
      sustainability.recommendations.forEach(r => {
        allRecommendations.push({ priority: r.priority, text: r.suggestion });
      });
    }

    if (egress) {
      egress.issues.forEach(i => {
        allRecommendations.push({ priority: i.severity, text: i.description });
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    allRecommendations.sort((a, b) =>
      (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4) -
      (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4)
    );

    return {
      id: 'recommendations',
      title: 'Recommendations',
      content: `
## Action Items

${allRecommendations.length === 0 ? 'No immediate actions required.' : ''}

${allRecommendations.map((r, i) => `${i + 1}. **[${r.priority.toUpperCase()}]** ${r.text}`).join('\n\n')}

### Next Steps

1. Review all high-priority items with the project team
2. Consult with relevant specialists for detailed analysis
3. Update the BIM model with any design changes
4. Re-run analysis to verify improvements
      `.trim(),
    };
  }

  // ============================================
  // Helpers
  // ============================================

  private generateSummary(
    issues: ReportIssue[],
    sustainability?: SustainabilityMetrics,
    egress?: EgressAnalysis
  ): ReportSummary {
    return {
      keyFindings: [
        `Model: ${this.model.name}`,
        `Elements: ${this.model.elements.length}`,
        `Levels: ${this.model.levels.length}`,
      ],
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      warnings: issues.filter(i => i.severity === 'warning' || i.severity === 'error').length,
      recommendations: sustainability?.recommendations.slice(0, 3).map(r => r.suggestion) || [],
      complianceStatus: egress?.compliant ? 'compliant' : 'non-compliant',
    };
  }

  private buildReport(
    type: ReportType,
    sections: ReportSection[],
    summary: ReportSummary
  ): Report {
    return {
      id: nanoid(),
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Analysis Report`,
      description: `${type} analysis of ${this.model.name}`,
      generatedAt: new Date(),
      modelId: this.model.id,
      modelName: this.model.name,
      status: 'complete',
      sections,
      summary,
      metadata: {
        generatedBy: 'BIM Agent',
        version: '1.0.0',
        analysisDepth: this.options.depth,
        includedAnalyses: sections.map(s => s.id),
        processingTimeMs: Date.now() - this.startTime,
      },
    };
  }
}

// ============================================
// Convenience Functions
// ============================================

export async function generateReport(
  model: BIMModel,
  type: ReportType,
  options?: Partial<ReportOptions>
): Promise<Report> {
  const generator = new ReportGenerator(model, options);

  switch (type) {
    case 'comprehensive':
      return generator.generateComprehensive();
    case 'spatial':
      return generator.generateSpatial();
    case 'sustainability':
      return generator.generateSustainability();
    case 'compliance':
      return generator.generateCompliance();
    default:
      return generator.generateComprehensive();
  }
}

/**
 * Export report to markdown
 */
export function reportToMarkdown(report: Report): string {
  const lines: string[] = [
    `# ${report.title}`,
    '',
    `**Generated:** ${report.generatedAt.toISOString()}`,
    `**Model:** ${report.modelName}`,
    '',
    '---',
    '',
  ];

  // Summary
  lines.push('## Summary', '');
  lines.push('### Key Findings', '');
  report.summary.keyFindings.forEach(f => lines.push(`- ${f}`));
  lines.push('');

  if (report.summary.criticalIssues > 0) {
    lines.push(`⚠️ **Critical Issues:** ${report.summary.criticalIssues}`);
  }
  if (report.summary.warnings > 0) {
    lines.push(`⚡ **Warnings:** ${report.summary.warnings}`);
  }
  lines.push('');

  // Sections
  for (const section of report.sections) {
    lines.push('---', '');
    lines.push(section.content, '');
  }

  return lines.join('\n');
}
