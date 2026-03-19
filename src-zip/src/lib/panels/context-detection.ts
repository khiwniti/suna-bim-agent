import type { PanelId, PanelContext } from './types';

const EXPLICIT_PATTERNS: Record<PanelId, RegExp[]> = {
  '3d-viewer': [
    /show.*3d.*model/i,
    /open.*viewer/i,
    /view.*building/i,
    /highlight.*element/i,
    /show.*model/i,
  ],
  'boq-table': [
    /show.*boq/i,
    /edit.*quantit/i,
    /update.*cost/i,
    /bill.*quantit/i,
  ],
  'carbon-dashboard': [
    /calculate.*carbon/i,
    /carbon.*footprint/i,
    /emission/i,
    /sustainability/i,
  ],
  'clash-report': [
    /clash.*detection/i,
    /find.*clash/i,
    /show.*clash/i,
    /resolve.*clash/i,
  ],
  'floorplan-viewer': [
    /analyze.*floor.*plan/i,
    /show.*drawing/i,
    /floor.*plan/i,
    /2d.*plan/i,
  ],
  'document-editor': [
    /generate.*report/i,
    /create.*document/i,
    /certification.*report/i,
    /export.*pdf/i,
  ],
};

const FILE_TYPE_PANELS: Record<string, PanelId> = {
  '.ifc': '3d-viewer',
  '.pdf': 'floorplan-viewer',
  '.jpg': 'floorplan-viewer',
  '.png': 'floorplan-viewer',
  '.xlsx': 'boq-table',
  '.csv': 'boq-table',
};

const AI_TOOL_PANELS: Record<string, PanelId> = {
  calculateCarbon: 'carbon-dashboard',
  analyzeBOQ: 'boq-table',
  generateReport: 'document-editor',
  analyzeFloorPlan: 'floorplan-viewer',
  loadIFCModel: '3d-viewer',
};

const RELEVANCE_KEYWORDS: Record<PanelId, string[]> = {
  '3d-viewer': ['model', '3d', 'element', 'view', 'building', 'ifc'],
  'boq-table': ['quantity', 'boq', 'material', 'cost', 'table', 'item'],
  'carbon-dashboard': ['carbon', 'emission', 'footprint', 'sustainability'],
  'clash-report': ['clash', 'conflict', 'collision', 'interference', 'overlap'],
  'floorplan-viewer': ['floor', 'plan', 'drawing', '2d', 'layout'],
  'document-editor': ['report', 'document', 'certification', 'export'],
};

export class PanelContextDetector {
  /**
   * Detect which panel should be activated based on context
   * Priority: Explicit commands > File uploads > AI actions > Context relevance
   */
  static detectPanel(context: PanelContext): PanelId | null {
    // 1. Check explicit user commands (highest priority)
    const explicitPanel = this.detectExplicitCommand(context.userMessage);
    if (explicitPanel) {
      return explicitPanel;
    }

    // 2. Check file uploads
    if (context.uploadedFiles && context.uploadedFiles.length > 0) {
      const filePanel = this.detectFileType(context.uploadedFiles[0]);
      if (filePanel) {
        return filePanel;
      }
    }

    // 3. Check AI tool calls
    if (context.aiToolCall) {
      const toolPanel = AI_TOOL_PANELS[context.aiToolCall];
      if (toolPanel) {
        return toolPanel;
      }
    }

    // 4. Check context relevance (keep current panel if still relevant)
    if (context.currentPanelId && context.recentMessages) {
      const isRelevant = this.checkContextRelevance(
        context.currentPanelId,
        context.recentMessages
      );
      if (isRelevant) {
        return context.currentPanelId;
      }
    }

    // 5. No panel detected
    return null;
  }

  private static detectExplicitCommand(message: string): PanelId | null {
    for (const [panelId, patterns] of Object.entries(EXPLICIT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          return panelId as PanelId;
        }
      }
    }
    return null;
  }

  private static detectFileType(file: File): PanelId | null {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return FILE_TYPE_PANELS[extension] || null;
  }

  private static checkContextRelevance(
    panelId: PanelId,
    recentMessages: string[]
  ): boolean {
    const keywords = RELEVANCE_KEYWORDS[panelId];
    const combinedText = recentMessages.join(' ').toLowerCase();

    let matchCount = 0;
    for (const keyword of keywords) {
      if (combinedText.includes(keyword)) {
        matchCount++;
      }
    }

    // Context is relevant if 2+ keywords found in recent messages
    return matchCount >= 2;
  }
}
