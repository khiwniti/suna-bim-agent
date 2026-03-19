/**
 * Viewport Activation Logic
 *
 * Intelligent viewport activation based on prompt analysis.
 * Only shows 3D viewer when user intent requires spatial visualization.
 *
 * ★ Insight ─────────────────────────────────────
 * This implements ChatGPT/Claude/Gemini UX patterns:
 * - Tools/canvases only appear when needed
 * - Chat stays focused for non-visual queries
 * - Smooth transitions when switching contexts
 * ─────────────────────────────────────────────────
 */

export interface PromptIntent {
  /** Whether the prompt requires 3D visualization */
  requires3D: boolean;

  /** Whether the prompt requires canvas/chart visualization */
  requiresCanvas: boolean;

  /** Whether the prompt requires data visualization */
  requiresDataVisualization: boolean;

  /** Primary focus for the response */
  primaryFocus: 'chat' | 'viewport' | 'both';

  /** Confidence level (0-1) */
  confidence: number;
}

/**
 * Analyzes user prompt to determine if 3D viewport should be activated
 *
 * @param userMessage - The user's prompt text
 * @returns Intent analysis with viewport requirements
 */
export function analyzePromptIntent(userMessage: string): PromptIntent {
  const message = userMessage.toLowerCase();

  // 3D viewport keywords (English)
  const viewport3DKeywords = [
    'show', 'highlight', 'zoom', 'rotate', 'view', 'visualize', 'display',
    'model', 'building', 'floor', 'wall', 'element', 'clash', 'component',
    'navigate', 'camera', 'angle', 'perspective', 'section', 'elevation',
    'hide', 'isolate', 'select', 'inspect', 'measure', 'dimension',
    'look at', 'focus on', 'center on', 'orbit', 'pan', 'fly to',
  ];

  // 3D viewport keywords (Thai - ภาษาไทย)
  const viewport3DKeywordsThai = [
    'ดู', 'แสดง', 'โมเดล', 'อาคาร', 'ชั้น', 'ผนัง', 'ส่วนประกอบ',
    'ซูม', 'หมุน', 'เลื่อน', 'มุมมอง', 'ภาพ', 'แบบจำลอง',
  ];

  // Carbon calculation/analysis keywords (English)
  const analyticsKeywords = [
    'calculate', 'carbon', 'emissions', 'footprint', 'report', 'analyze',
    'certification', 'edge', 'trees', 'tver', 'bank', 'financing', 'loan',
    'optimize', 'material', 'boq', 'quantity', 'estimate', 'cost',
    'download', 'export', 'generate', 'document', 'summary', 'data',
    'how much', 'what is', 'tell me', 'explain', 'help', 'guide',
  ];

  // Strong analytics phrases that override 3D keywords
  const strongAnalyticsKeywords = [
    'carbon report', 'certification report', 'certification status',
    'bank financing', 'bank eligibility', 'trees report', 'edge report',
    'carbon calculation', 'emission report', 'cost report', 'boq report',
  ];

  // Strong analytics phrases (Thai)
  const strongAnalyticsKeywordsThai = [
    'ใบรับรอง', // certificate
    'รายงานคาร์บอน', // carbon report
    'สินเชื่อ', // loan/credit
  ];

  // Carbon calculation/analysis keywords (Thai - ภาษาไทย)
  const analyticsKeywordsThai = [
    'คำนวณ', 'คาร์บอน', 'ก๊าซเรือนกระจก', 'รายงาน', 'วิเคราะห์',
    'ใบรับรอง', 'เอจ', 'ทรีส', 'ธนาคาร', 'สินเชื่อ', 'กู้เงิน',
    'ปรับปรุง', 'วัสดุ', 'บีโอคิว', 'ประมาณการ', 'ราคา', 'ต้นทุน',
    'ดาวน์โหลด', 'ส่งออก', 'สร้าง', 'เอกสาร', 'สรุป', 'ข้อมูล',
  ];

  // Chat-only keywords (definitively not 3D) - INFORMATIONAL QUERIES
  // Note: These are purely informational without visualization action verbs
  // They should NOT override explicit 3D action verbs (show, highlight, zoom)
  const chatOnlyKeywords = [
    'what is', 'how does', 'how do', 'how to', 'why', 'when', 'where', 'who',
    'explain', 'help me', 'guide me', 'tutorial', 'definition', 'meaning',
    'difference between', 'compare', 'list all', 'recommend', 'suggest',
  ];

  // Combine all keyword sets
  const all3DKeywords = [...viewport3DKeywords, ...viewport3DKeywordsThai];
  const allAnalyticsKeywords = [...analyticsKeywords, ...analyticsKeywordsThai];

  // Check for keyword matches
  const has3DIntent = all3DKeywords.some(keyword => message.includes(keyword));
  const hasAnalyticsIntent = allAnalyticsKeywords.some(keyword => message.includes(keyword));
  const hasChatOnlyIntent = chatOnlyKeywords.some(keyword => message.includes(keyword));
  const hasStrongAnalytics = [...strongAnalyticsKeywords, ...strongAnalyticsKeywordsThai].some(keyword => message.includes(keyword));

  // Calculate confidence based on keyword density and specificity
  const words = message.split(/\s+/).length;
  const matches3D = all3DKeywords.filter(kw => message.includes(kw)).length;
  const matchesAnalytics = allAnalyticsKeywords.filter(kw => message.includes(kw)).length;

  // Boost confidence for explicit keywords (not generic "maybe", "possibly")
  const hasExplicitLanguage = !message.match(/\b(maybe|possibly|perhaps|might)\b/);
  const confidenceMultiplier = hasExplicitLanguage ? 1.0 : 0.7;

  const confidence3D = Math.min(matches3D / Math.max(words * 0.2, 1), 1) * confidenceMultiplier;
  const confidenceAnalytics = Math.min(matchesAnalytics / Math.max(words * 0.2, 1), 1) * confidenceMultiplier;

  // Decision logic - Refined priority order
  // Key insight: Strong analytics phrases (carbon report, certification status) override 3D verbs
  // But pure 3D action verbs (show model, highlight walls) activate viewport
  let requires3D = false;
  const requiresCanvas = false;
  let requiresDataVisualization = false;
  let primaryFocus: 'chat' | 'viewport' | 'both' = 'chat';
  let confidence = 0.5;

  // Priority 1: Strong analytics phrases - OVERRIDE 3D keywords
  if (hasStrongAnalytics) {
    // "Show carbon report", "Check certification status" = analytics, not 3D
    requires3D = false;
    requiresDataVisualization = true;
    primaryFocus = 'chat';
    confidence = 0.9;
  }
  // Priority 2: Pure 3D intent (show, highlight, zoom, etc.) - STRONGEST SIGNAL
  else if (has3DIntent && !hasAnalyticsIntent && !hasChatOnlyIntent) {
    // Clear 3D intent, no conflicting signals
    requires3D = true;
    primaryFocus = 'viewport';
    confidence = Math.max(confidence3D, 0.7);
  }
  // Priority 3: Mixed 3D + Analytics (show model AND calculate)
  else if (has3DIntent && hasAnalyticsIntent && !hasChatOnlyIntent) {
    // Mixed intent - show viewport if 3D confidence is equal or higher
    // (When in doubt, show visualization since it's more valuable for BIM workflows)
    if (confidence3D >= confidenceAnalytics) {
      requires3D = true;
      requiresDataVisualization = true;
      primaryFocus = 'both';
      confidence = Math.max(confidence3D, confidenceAnalytics);
    } else {
      // Analytics is stronger, stay in chat
      requiresDataVisualization = true;
      primaryFocus = 'chat';
      confidence = confidenceAnalytics;
    }
  }
  // Priority 4: Chat-only with analytics (compare, explain, help + carbon terms)
  else if (hasChatOnlyIntent && hasAnalyticsIntent) {
    // Informational query about analytics - stay in chat
    requires3D = false;
    requiresDataVisualization = true;
    primaryFocus = 'chat';
    confidence = 0.8;
  }
  // Priority 5: Pure chat-only (compare, explain, help without 3D or analytics)
  else if (hasChatOnlyIntent && !has3DIntent) {
    // Definitely chat only
    requires3D = false;
    requiresDataVisualization = false;
    primaryFocus = 'chat';
    confidence = 0.8;
  }
  // Priority 6: Analytics keywords only (calculate, carbon, material, etc.)
  else if (hasAnalyticsIntent && !has3DIntent && !hasChatOnlyIntent) {
    // Analytics only - chat focused
    requiresDataVisualization = true;
    primaryFocus = 'chat';
    confidence = Math.max(confidenceAnalytics, 0.6);
  }
  // Priority 7: Default to chat
  else {
    primaryFocus = 'chat';
    confidence = 0.5;
  }

  return {
    requires3D,
    requiresCanvas,
    requiresDataVisualization,
    primaryFocus,
    confidence,
  };
}

/**
 * Determines viewport layout based on prompt intent
 *
 * @param intent - The analyzed prompt intent
 * @returns Layout configuration
 */
export function getViewportLayout(intent: PromptIntent): {
  chatWidth: string;
  viewportWidth: string;
  viewportVisible: boolean;
  transition: string;
} {
  if (!intent.requires3D) {
    return {
      chatWidth: 'w-full',
      viewportWidth: 'w-0',
      viewportVisible: false,
      transition: 'transition-all duration-300 ease-out',
    };
  }

  if (intent.primaryFocus === 'viewport') {
    return {
      chatWidth: 'w-1/3',
      viewportWidth: 'w-2/3',
      viewportVisible: true,
      transition: 'transition-all duration-300 ease-out',
    };
  }

  // Both or default split
  return {
    chatWidth: 'w-1/2',
    viewportWidth: 'w-1/2',
    viewportVisible: true,
    transition: 'transition-all duration-300 ease-out',
  };
}

/**
 * Helper to check if viewport should persist
 *
 * @param previousIntent - Previous prompt intent
 * @param currentIntent - Current prompt intent
 * @returns Whether viewport should stay visible
 */
export function shouldPersistViewport(
  previousIntent: PromptIntent | null,
  currentIntent: PromptIntent
): boolean {
  // If viewport was visible and new prompt is not explicitly non-3D, keep it
  if (previousIntent?.requires3D && !currentIntent.requiresDataVisualization) {
    return true;
  }

  // If confidence is low, maintain previous state
  if (currentIntent.confidence < 0.5 && previousIntent?.requires3D) {
    return true;
  }

  return currentIntent.requires3D;
}

/**
 * Example usage:
 *
 * const intent = analyzePromptIntent("Show me the building model");
 * console.log(intent.requires3D); // true
 * console.log(intent.primaryFocus); // 'viewport'
 *
 * const layout = getViewportLayout(intent);
 * console.log(layout.viewportVisible); // true
 * console.log(layout.chatWidth); // 'w-1/3'
 */
