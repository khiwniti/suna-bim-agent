'use client';

/**
 * Panel Context Detector - Automatic panel activation based on context
 *
 * Analyzes user messages, file uploads, and AI actions to determine
 * which panel should be automatically activated.
 *
 * ★ Insight ─────────────────────────────────────
 * Context-aware panel switching improves UX by anticipating user needs.
 * When a user uploads an IFC file, they likely want the 3D viewer.
 * When the AI completes a carbon analysis, they want the dashboard.
 * ─────────────────────────────────────────────────
 */

import type { PanelId } from './event-bus';

// ============================================
// Types
// ============================================

export interface DetectionContext {
  /** User's message text */
  userMessage?: string;
  /** AI's response text */
  aiMessage?: string;
  /** Currently active panel (for relevance) */
  currentPanel?: PanelId | null;
  /** Files being uploaded */
  uploadedFiles?: File[];
  /** Tool/action just completed by AI */
  completedAction?: {
    type: string;
    toolName?: string;
    result?: unknown;
  };
  /** Mentioned element IDs in conversation */
  mentionedElementIds?: string[];
}

export interface DetectionResult {
  /** Detected panel ID */
  panelId: PanelId | null;
  /** Confidence score 0-1 */
  confidence: number;
  /** Reason for detection */
  reason: string;
  /** Whether to auto-expand the panel */
  autoExpand: boolean;
}

// ============================================
// Trigger Patterns
// ============================================

interface TriggerPattern {
  panelId: PanelId;
  /** Regex patterns for user messages */
  messagePatterns: RegExp[];
  /** File extensions that trigger this panel */
  fileExtensions?: string[];
  /** Tool names that trigger this panel */
  toolNames?: string[];
  /** Confidence boost for explicit commands */
  explicitCommands?: RegExp[];
}

const TRIGGER_PATTERNS: TriggerPattern[] = [
  // 3D Viewer Panel
  {
    panelId: '3d-viewer',
    messagePatterns: [
      /show\s*(me\s*)?(the\s*)?3d\s*model/i,
      /open\s*(the\s*)?ifc\s*viewer/i,
      /let\s*me\s*see\s*(the\s*)?building/i,
      /highlight\s*element/i,
      /view\s*(the\s*)?(3d|model|building)/i,
      /zoom\s*(to|in|on)/i,
      /isolate\s*(element|layer)/i,
      /show\s*(section|slice|cut)/i,
      /measure\s*(distance|area|angle)/i,
    ],
    fileExtensions: ['.ifc', '.ifczip', '.glb', '.gltf'],
    toolNames: ['highlight_elements', 'isolate_elements', 'navigate_to_element'],
    explicitCommands: [/^(show|open)\s*(the\s*)?(3d|ifc|model|viewer)/i],
  },

  // BOQ Data Table Panel
  {
    panelId: 'boq-table',
    messagePatterns: [
      /show\s*(me\s*)?(the\s*)?boq/i,
      /edit\s*(the\s*)?quantities/i,
      /update\s*(material\s*)?costs/i,
      /export\s*(boq|bill\s*of\s*quantities)\s*to\s*excel/i,
      /quantity\s*take\s*off/i,
      /material\s*list/i,
      /add\s*(item|row)\s*to\s*boq/i,
      /calculate\s*(total\s*)?(cost|price)/i,
    ],
    fileExtensions: ['.xlsx', '.csv'],
    toolNames: ['extract_boq', 'update_boq_row', 'add_boq_item', 'calculate_quantities'],
    explicitCommands: [/^(show|open|edit)\s*(the\s*)?boq/i],
  },

  // Carbon Analysis Dashboard Panel
  {
    panelId: 'carbon-dashboard',
    messagePatterns: [
      /calculate\s*(the\s*)?carbon\s*(footprint|emission)/i,
      /show\s*(the\s*)?carbon\s*(analysis|dashboard)/i,
      /what\s*are\s*(the\s*)?emissions/i,
      /carbon\s*hotspots/i,
      /embodied\s*carbon/i,
      /gwp\s*(analysis|calculation)/i,
      /sustainability\s*(analysis|report)/i,
      /environmental\s*impact/i,
    ],
    toolNames: ['carbon_analysis', 'calculate_carbon', 'analyze_sustainability'],
    explicitCommands: [/^(show|calculate|analyze)\s*(the\s*)?carbon/i],
  },

  // Clash Report Panel
  {
    panelId: 'clash-report',
    messagePatterns: [
      /clash\s*(detection|analysis|report)/i,
      /find\s*(the\s*)?(conflicts|clashes|collisions)/i,
      /interference\s*(check|detection)/i,
      /coordination\s*(issues|problems)/i,
      /overlapping\s*elements/i,
    ],
    toolNames: ['clash_detection', 'find_clashes', 'coordination_check'],
    explicitCommands: [/^(detect|find|show)\s*(the\s*)?clash/i],
  },

  // Document Editor Panel
  {
    panelId: 'document-editor',
    messagePatterns: [
      /generate\s*(a\s*)?(certification\s*)?report/i,
      /create\s*(a\s*)?(bank\s*)?loan\s*document/i,
      /export\s*to\s*pdf/i,
      /write\s+.*report/i,  // Matches "write a comprehensive report", "write the report", etc.
      /write\s+.*document/i,  // Matches "write a document", "write the document", etc.
      /draft\s*(a|the)\s*(letter|proposal)/i,
      /edit\s*(the\s*)?document/i,
      /comprehensive\s*report/i,  // Direct match for "comprehensive report"
      /detailed\s*report/i,  // "detailed report"
      /full\s*report/i,  // "full report"
    ],
    fileExtensions: ['.pdf', '.docx', '.doc'],
    toolNames: ['generate_report', 'create_document', 'export_pdf'],
    explicitCommands: [
      /^(generate|create|write|edit)\s+.*?(report|document)/i,  // More flexible explicit command
      /report/i,  // Any message with "report" gets consideration
    ],
  },
];

// ============================================
// Detection Functions
// ============================================

/**
 * Calculate pattern match score for a message
 */
function calculateMessageScore(
  message: string,
  pattern: TriggerPattern
): { score: number; isExplicit: boolean } {
  if (!message) return { score: 0, isExplicit: false };

  const normalizedMessage = message.toLowerCase().trim();
  let score = 0;
  let isExplicit = false;

  // Check explicit commands first (highest priority)
  if (pattern.explicitCommands) {
    for (const cmd of pattern.explicitCommands) {
      if (cmd.test(normalizedMessage)) {
        score = 0.95;
        isExplicit = true;
        break;
      }
    }
  }

  // Check regular patterns
  if (!isExplicit) {
    let matchCount = 0;
    for (const regex of pattern.messagePatterns) {
      if (regex.test(normalizedMessage)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      score = Math.min(0.7 + matchCount * 0.1, 0.9);
    }
  }

  return { score, isExplicit };
}

/**
 * Calculate file extension match score
 */
function calculateFileScore(files: File[], pattern: TriggerPattern): number {
  if (!files?.length || !pattern.fileExtensions) return 0;

  for (const file of files) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (pattern.fileExtensions.includes(ext)) {
      return 0.9;
    }
  }

  return 0;
}

/**
 * Calculate tool/action match score
 */
function calculateToolScore(
  action: DetectionContext['completedAction'],
  pattern: TriggerPattern
): number {
  if (!action || !pattern.toolNames) return 0;

  const toolName = action.toolName || action.type;
  if (toolName && pattern.toolNames.includes(toolName)) {
    return 0.85;
  }

  return 0;
}

// ============================================
// Main Detection Class
// ============================================

/**
 * PanelContextDetector - Static class for panel detection
 */
export class PanelContextDetector {
  /**
   * Detect which panel should be activated based on context
   *
   * @param context - The detection context
   * @returns Detection result with panel ID, confidence, and reason
   */
  static detectPanel(context: DetectionContext): DetectionResult {
    const results: Array<{
      panelId: PanelId;
      score: number;
      reason: string;
      isExplicit: boolean;
    }> = [];

    for (const pattern of TRIGGER_PATTERNS) {
      let totalScore = 0;
      let reason = '';
      let isExplicit = false;

      // Check user message
      if (context.userMessage) {
        const { score, isExplicit: explicit } = calculateMessageScore(
          context.userMessage,
          pattern
        );
        if (score > 0) {
          totalScore = Math.max(totalScore, score);
          reason = explicit ? 'Explicit command' : 'Message pattern match';
          isExplicit = explicit;
        }
      }

      // Check AI message (lower weight)
      if (context.aiMessage && !isExplicit) {
        const { score } = calculateMessageScore(context.aiMessage, pattern);
        if (score > 0) {
          const adjustedScore = score * 0.7; // Lower weight for AI messages
          if (adjustedScore > totalScore) {
            totalScore = adjustedScore;
            reason = 'AI response context';
          }
        }
      }

      // Check file uploads
      if (context.uploadedFiles) {
        const fileScore = calculateFileScore(context.uploadedFiles, pattern);
        if (fileScore > totalScore) {
          totalScore = fileScore;
          reason = 'File upload detected';
        }
      }

      // Check completed actions
      if (context.completedAction) {
        const toolScore = calculateToolScore(context.completedAction, pattern);
        if (toolScore > totalScore) {
          totalScore = toolScore;
          reason = `Tool completed: ${context.completedAction.toolName || context.completedAction.type}`;
        }
      }

      // Add relevance boost if switching to a different panel
      if (totalScore > 0 && context.currentPanel !== pattern.panelId) {
        // Small boost for panel switching context
        totalScore = Math.min(totalScore + 0.05, 1);
      }

      if (totalScore > 0) {
        results.push({
          panelId: pattern.panelId,
          score: totalScore,
          reason,
          isExplicit,
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Return best match or null
    if (results.length > 0 && results[0].score >= 0.5) {
      return {
        panelId: results[0].panelId,
        confidence: results[0].score,
        reason: results[0].reason,
        autoExpand: results[0].isExplicit || results[0].score >= 0.8,
      };
    }

    return {
      panelId: null,
      confidence: 0,
      reason: 'No matching context detected',
      autoExpand: false,
    };
  }

  /**
   * Check if a specific panel should be activated
   */
  static shouldActivatePanel(panelId: PanelId, context: DetectionContext): boolean {
    const result = this.detectPanel(context);
    return result.panelId === panelId && result.confidence >= 0.5;
  }

  /**
   * Get all matching panels with scores
   */
  static getAllMatches(context: DetectionContext): Array<{
    panelId: PanelId;
    confidence: number;
    reason: string;
  }> {
    const results: Array<{
      panelId: PanelId;
      confidence: number;
      reason: string;
    }> = [];

    for (const pattern of TRIGGER_PATTERNS) {
      let totalScore = 0;
      let reason = '';

      if (context.userMessage) {
        const { score, isExplicit } = calculateMessageScore(context.userMessage, pattern);
        if (score > 0) {
          totalScore = score;
          reason = isExplicit ? 'Explicit command' : 'Message pattern match';
        }
      }

      if (context.uploadedFiles) {
        const fileScore = calculateFileScore(context.uploadedFiles, pattern);
        if (fileScore > totalScore) {
          totalScore = fileScore;
          reason = 'File upload';
        }
      }

      if (context.completedAction) {
        const toolScore = calculateToolScore(context.completedAction, pattern);
        if (toolScore > totalScore) {
          totalScore = toolScore;
          reason = 'Tool completion';
        }
      }

      if (totalScore > 0) {
        results.push({
          panelId: pattern.panelId,
          confidence: totalScore,
          reason,
        });
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect panel from file MIME type
   */
  static detectFromFile(file: File): PanelId | null {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    for (const pattern of TRIGGER_PATTERNS) {
      if (pattern.fileExtensions?.includes(ext)) {
        return pattern.panelId;
      }
    }

    return null;
  }

  /**
   * Detect panel from completed tool action
   */
  static detectFromTool(toolName: string): PanelId | null {
    for (const pattern of TRIGGER_PATTERNS) {
      if (pattern.toolNames?.includes(toolName)) {
        return pattern.panelId;
      }
    }

    return null;
  }
}

// ============================================
// React Hook
// ============================================

import { useMemo, useCallback } from 'react';
import { panelEventBus } from './event-bus';

/**
 * React hook to use context detection
 *
 * @param context - The detection context
 * @returns Detection result and helper functions
 */
export function useContextDetection(context: DetectionContext) {
  const result = useMemo(() => PanelContextDetector.detectPanel(context), [context]);

  const activateIfDetected = useCallback(() => {
    if (result.panelId && result.confidence >= 0.5) {
      panelEventBus.publish('system', {
        type: 'ACTIVATE_PANEL',
        panelId: result.panelId,
        autoExpand: result.autoExpand,
      });
      return true;
    }
    return false;
  }, [result]);

  return {
    ...result,
    activateIfDetected,
  };
}

export default PanelContextDetector;
