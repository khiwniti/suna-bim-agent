/**
 * Complexity Gate - Query complexity analysis for routing decisions
 *
 * Analyzes user queries to determine whether they should be:
 * - Routed directly to an agent for immediate response (simple queries)
 * - Routed to planning mode for multi-step execution (complex queries)
 *
 * Uses heuristics based on:
 * - Word count
 * - Question type (what is, define, explain = simple)
 * - BIM domain keywords (suggests specific agents)
 * - Multi-step indicators (then, after that, first...then)
 */

export interface ComplexityAnalysis {
  /** Complexity score from 0 to 1 */
  score: number;
  /** Routing decision */
  route: 'direct' | 'plan';
  /** Human-readable reasoning */
  reasoning: string;
  /** Suggested agents based on domain keywords */
  suggestedAgents: string[];
}

/** Threshold above which queries route to planning mode */
export const COMPLEXITY_THRESHOLD = 0.5;

// Heuristic weights (must sum to 1.0)
const WEIGHTS = {
  wordCount: 0.10,
  questionType: 0.30,
  domainKeywords: 0.20,
  multiStepIndicators: 0.35,
  historicalPatterns: 0.05, // Reserved for future ML-based patterns
};

// Simple question patterns - these route directly
const SIMPLE_PATTERNS = [
  /^what is\b/i,
  /^what are\b/i,
  /^what's\b/i,
  /^define\b/i,
  /^explain\b/i,
  /^describe\b/i,
  /^who is\b/i,
  /^when did\b/i,
  /^where is\b/i,
  /^how does\b/i,
  /^why is\b/i,
  /^tell me about\b/i,
];

// Multi-step indicators - suggest complex workflow
const MULTI_STEP_PATTERNS = [
  /\bthen\b/i,
  /\bafter that\b/i,
  /\balso\b/i,
  /\bfirst\b.*\bthen\b/i,
  /\band then\b/i,
  /\bfinally\b/i,
  /\bnext\b/i,
  /\bstep\s*\d/i,
  /\bfollowed by\b/i,
  /\bsubsequently\b/i,
];

// Action verbs indicating complex operations
const ACTION_PATTERNS = [
  /\banalyze\b/i,
  /\bcreate\b/i,
  /\bgenerate\b/i,
  /\bbuild\b/i,
  /\bimplement\b/i,
  /\bdesign\b/i,
  /\bcompare\b/i,
  /\bdetect\b/i,
  /\brun\b/i,
  /\bexecute\b/i,
  /\bvalidate\b/i,
  /\bcheck\b/i,
  /\bexport\b/i,
  /\bcalculate\b/i,
];

// BIM domain keywords mapped to specialist agents
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  // Sustainability
  carbon: ['sustainability'],
  'carbon footprint': ['sustainability'],
  'embodied carbon': ['sustainability'],
  sustainability: ['sustainability'],
  leed: ['sustainability', 'code_compliance'],
  breeam: ['sustainability', 'code_compliance'],
  well: ['sustainability', 'code_compliance'],
  'green building': ['sustainability'],
  'energy efficiency': ['sustainability'],

  // Clash Detection
  clash: ['clash_detection'],
  collision: ['clash_detection'],
  conflict: ['clash_detection'],
  interference: ['clash_detection'],
  'spatial conflict': ['clash_detection'],

  // MEP
  mep: ['mep'],
  hvac: ['mep'],
  plumbing: ['mep'],
  electrical: ['mep'],
  mechanical: ['mep'],
  ductwork: ['mep'],
  piping: ['mep'],

  // Structural
  structural: ['structural'],
  beam: ['structural'],
  column: ['structural'],
  foundation: ['structural'],
  slab: ['structural'],
  'load bearing': ['structural'],
  'structural analysis': ['structural'],

  // Floor Plan
  floor: ['floor_plan'],
  layout: ['floor_plan'],
  'floor plan': ['floor_plan'],
  room: ['floor_plan'],
  space: ['floor_plan'],

  // Cost Estimation
  cost: ['cost_estimator'],
  estimate: ['cost_estimator'],
  budget: ['cost_estimator'],
  pricing: ['cost_estimator'],
  'quantity takeoff': ['cost_estimator'],
  boq: ['cost_estimator'],

  // Compliance
  compliance: ['code_compliance'],
  code: ['code_compliance'],
  regulation: ['code_compliance'],
  'building code': ['code_compliance'],
  standard: ['code_compliance'],

  // Facility Management
  maintenance: ['maintenance'],
  facility: ['facility_manager'],
  operation: ['facility_manager'],
  'building management': ['facility_manager'],

  // Asset Tracking
  asset: ['asset_tracker'],
  inventory: ['asset_tracker'],
  equipment: ['asset_tracker'],
};

/**
 * Score based on word count
 * Short queries are simpler, long queries often more complex
 */
function scoreWordCount(query: string): number {
  const wordCount = query.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 5) return 0.1;
  if (wordCount <= 10) return 0.2;
  if (wordCount <= 20) return 0.4;
  if (wordCount <= 50) return 0.7;
  return 0.9;
}

/**
 * Score based on question type
 * Simple questions (what is, define) score low
 * Action-oriented questions score high
 */
function scoreQuestionType(query: string): number {
  // Check for simple patterns first
  const isSimple = SIMPLE_PATTERNS.some((pattern) => pattern.test(query));
  if (isSimple) return 0.1;

  // Check for action patterns
  const actionCount = ACTION_PATTERNS.filter((pattern) => pattern.test(query)).length;
  if (actionCount >= 3) return 0.9;
  if (actionCount >= 2) return 0.7;
  if (actionCount >= 1) return 0.5;

  return 0.3; // Neutral for unknown patterns
}

/**
 * Score based on BIM domain keywords
 * Returns both score and suggested agents
 */
function scoreDomainKeywords(query: string): { score: number; agents: string[] } {
  const lowerQuery = query.toLowerCase();
  const foundAgents = new Set<string>();
  let keywordCount = 0;

  // Check each keyword
  for (const [keyword, agents] of Object.entries(DOMAIN_KEYWORDS)) {
    if (lowerQuery.includes(keyword)) {
      keywordCount++;
      agents.forEach((a) => foundAgents.add(a));
    }
  }

  // More domain keywords = higher complexity (likely multi-agent workflow)
  const score = Math.min(keywordCount * 0.2, 1);
  return { score, agents: Array.from(foundAgents) };
}

/**
 * Score based on multi-step indicators
 * Presence of words like "then", "after that", "first" indicate complex workflow
 */
function scoreMultiStep(query: string): number {
  const matches = MULTI_STEP_PATTERNS.filter((pattern) => pattern.test(query));

  // Multiple indicators strongly suggest complex workflow
  if (matches.length >= 3) return 1.0;
  if (matches.length >= 2) return 0.8;
  if (matches.length >= 1) return 0.5;

  return 0.0;
}

/**
 * Analyze query complexity and determine routing
 */
export function analyzeComplexity(query: string): ComplexityAnalysis {
  // Calculate individual scores
  const wordCountScore = scoreWordCount(query);
  const questionTypeScore = scoreQuestionType(query);
  const { score: domainScore, agents } = scoreDomainKeywords(query);
  const multiStepScore = scoreMultiStep(query);

  // Weighted sum (historicalPatterns defaults to 0 for now)
  const totalScore =
    wordCountScore * WEIGHTS.wordCount +
    questionTypeScore * WEIGHTS.questionType +
    domainScore * WEIGHTS.domainKeywords +
    multiStepScore * WEIGHTS.multiStepIndicators +
    0 * WEIGHTS.historicalPatterns;

  // Determine routing
  const route = totalScore >= COMPLEXITY_THRESHOLD ? 'plan' : 'direct';

  // Build reasoning string
  const reasoning = [
    `Word count: ${wordCountScore.toFixed(2)}`,
    `Question type: ${questionTypeScore.toFixed(2)}`,
    `Domain keywords: ${domainScore.toFixed(2)}`,
    `Multi-step: ${multiStepScore.toFixed(2)}`,
    `Total: ${totalScore.toFixed(2)} → ${route}`,
  ].join(', ');

  return {
    score: totalScore,
    route,
    reasoning,
    suggestedAgents: agents,
  };
}

export default analyzeComplexity;
