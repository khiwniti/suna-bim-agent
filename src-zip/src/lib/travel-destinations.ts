/**
 * Travel Destinations Utility
 *
 * Provides travel-themed naming for agent phases and tool calls.
 * Part of the Manus.im-style agent chat experience.
 */

// ============================================
// Types
// ============================================

export type TravelPhase =
  | 'departing'
  | 'charting'
  | 'packing'
  | 'in_flight'
  | 'navigating'
  | 'arriving';

export type DestinationCategory =
  | 'carbon'
  | 'query'
  | 'compliance'
  | 'clash'
  | 'boq'
  | 'default';

export interface TravelPhaseInfo {
  name: string;
  icon: string;
  description: string;
  agentPhase: string; // Maps to original AgentPhase
}

// ============================================
// Constants
// ============================================

export const TRAVEL_PHASES: TravelPhase[] = [
  'departing',
  'charting',
  'packing',
  'in_flight',
  'navigating',
  'arriving',
] as const;

/**
 * Maps agent phases to travel phases
 */
export const AGENT_TO_TRAVEL_PHASE: Record<string, TravelPhase> = {
  thinking: 'departing',
  reasoning: 'charting',
  tool_calling: 'packing',
  tool_executing: 'in_flight',
  synthesizing: 'navigating',
  responding: 'arriving',
  idle: 'departing',
};

/**
 * Travel phase information with icons and descriptions
 */
const PHASE_INFO: Record<TravelPhase, TravelPhaseInfo> = {
  departing: {
    name: 'Departing',
    icon: '🛫',
    description: 'Preparing for the journey ahead',
    agentPhase: 'thinking',
  },
  charting: {
    name: 'Charting Course',
    icon: '🗺️',
    description: 'Routing to specialist agent',
    agentPhase: 'reasoning',
  },
  packing: {
    name: 'Packing Gear',
    icon: '🧳',
    description: 'Preparing tools for the expedition',
    agentPhase: 'tool_calling',
  },
  in_flight: {
    name: 'In Flight',
    icon: '✈️',
    description: 'Executing analysis tools',
    agentPhase: 'tool_executing',
  },
  navigating: {
    name: 'Navigating Waters',
    icon: '🌊',
    description: 'Processing results',
    agentPhase: 'synthesizing',
  },
  arriving: {
    name: 'Arriving at Destination',
    icon: '🏝️',
    description: 'Delivering final response',
    agentPhase: 'responding',
  },
};

/**
 * Destination pools by tool category
 * Mix of air, sea, land, and expedition themes
 */
const TOOL_DESTINATIONS: Record<DestinationCategory, readonly string[]> = {
  // Carbon/Sustainability tools - Mountain/Summit theme
  carbon: [
    'Summit Peak',
    'Mount Verde',
    'Glacier Point',
    'Alpine Ridge',
    'Evergreen Summit',
    'Carbon Canyon',
    'Emerald Heights',
    'Pine Peak',
  ] as const,

  // Query/Search tools - Ocean/Bay theme
  query: [
    'Coral Bay',
    'Crystal Cove',
    'Sapphire Lagoon',
    'Hidden Harbor',
    'Azure Marina',
    'Pearl Reef',
    'Mystic Cove',
    'Serene Shores',
  ] as const,

  // Compliance/Check tools - Base Camp theme
  compliance: [
    'Base Camp Alpha',
    'Checkpoint Charlie',
    'Frontier Post',
    'Ranger Station',
    'Outpost Omega',
    'Sentinel Point',
    'Guardian Gate',
    'Watchman Ridge',
  ] as const,

  // Clash Detection tools - Storm/Dramatic theme
  clash: [
    'Storm Valley',
    'Thunder Pass',
    'Collision Canyon',
    'Lightning Ridge',
    'Tempest Point',
    'Fury Falls',
    'Clash Creek',
    'Impact Isle',
  ] as const,

  // BOQ/Quantity tools - Treasure theme
  boq: [
    'Treasure Island',
    'Golden Archives',
    'Inventory Oasis',
    'Fortune Bay',
    'Bounty Beach',
    'Riches Reef',
    'Prosperity Port',
    'Abundance Atoll',
  ] as const,

  // General/Default - Explorer theme
  default: [
    'Discovery Point',
    "Explorer's Rest",
    "Voyager's View",
    'Pioneer Peak',
    "Adventurer's Alcove",
    "Wanderer's Way",
    "Nomad's Nook",
    'Trailblazer Terrace',
  ] as const,
};

/**
 * Tool name to category mapping
 */
const TOOL_CATEGORY_MAP: Record<string, DestinationCategory> = {
  // Carbon tools
  analyzeCarbon: 'carbon',
  analyze_carbon: 'carbon',
  carbon_analysis: 'carbon',
  calculateEmissions: 'carbon',
  calculate_emissions: 'carbon',
  sustainabilityAnalysis: 'carbon',
  sustainability_analysis: 'carbon',

  // Query tools
  queryElements: 'query',
  query_elements: 'query',
  queryElementsByType: 'query',
  query_elements_by_type: 'query',
  searchElements: 'query',
  search_elements: 'query',
  findElements: 'query',
  find_elements: 'query',

  // Compliance tools
  checkCompliance: 'compliance',
  check_compliance: 'compliance',
  compliance_check: 'compliance',
  validateCode: 'compliance',
  validate_code: 'compliance',
  codeCompliance: 'compliance',
  code_compliance: 'compliance',

  // Clash detection tools
  detectClashes: 'clash',
  detect_clashes: 'clash',
  clash_detection: 'clash',
  findClashes: 'clash',
  find_clashes: 'clash',
  clashAnalysis: 'clash',
  clash_analysis: 'clash',

  // BOQ tools
  generateBOQ: 'boq',
  generate_boq: 'boq',
  createBOQ: 'boq',
  create_boq: 'boq',
  quantityTakeoff: 'boq',
  quantity_takeoff: 'boq',
  estimateCost: 'boq',
  estimate_cost: 'boq',
};

/**
 * Category icons for visual display
 */
export const CATEGORY_ICONS: Record<DestinationCategory, string> = {
  carbon: '🏔️',
  query: '🏝️',
  compliance: '⛺',
  clash: '⛈️',
  boq: '🏴‍☠️',
  default: '🧭',
};

// ============================================
// Functions
// ============================================

/**
 * Get the destination category for a tool name
 */
export function getToolCategory(toolName: string): DestinationCategory {
  return TOOL_CATEGORY_MAP[toolName] ?? 'default';
}

/**
 * Get a random destination name for a tool
 * Each tool call gets a unique travel-themed destination
 */
export function getRandomDestination(toolName: string): string {
  const category = getToolCategory(toolName);
  const destinations = TOOL_DESTINATIONS[category];
  const index = Math.floor(Math.random() * destinations.length);
  return destinations[index];
}

/**
 * Get travel phase information
 */
export function getTravelPhaseInfo(phase: TravelPhase): TravelPhaseInfo {
  return PHASE_INFO[phase];
}

/**
 * Convert agent phase to travel phase
 */
export function agentPhaseToTravelPhase(
  agentPhase: string | undefined
): TravelPhase {
  if (!agentPhase) return 'departing';
  return AGENT_TO_TRAVEL_PHASE[agentPhase] ?? 'departing';
}

/**
 * Get phase index (0-5) for progress calculation
 */
export function getPhaseIndex(phase: TravelPhase): number {
  return TRAVEL_PHASES.indexOf(phase);
}

/**
 * Get progress percentage (0-100) for a phase
 */
export function getPhaseProgress(phase: TravelPhase): number {
  const index = getPhaseIndex(phase);
  // Each phase represents ~16.67% progress (100/6)
  return Math.round(((index + 1) / TRAVEL_PHASES.length) * 100);
}

/**
 * Get all phases up to and including the current phase
 */
export function getCompletedPhases(currentPhase: TravelPhase): TravelPhase[] {
  const currentIndex = getPhaseIndex(currentPhase);
  return TRAVEL_PHASES.slice(0, currentIndex);
}

/**
 * Check if a phase is completed relative to current phase
 */
export function isPhaseCompleted(
  phase: TravelPhase,
  currentPhase: TravelPhase
): boolean {
  return getPhaseIndex(phase) < getPhaseIndex(currentPhase);
}

/**
 * Check if a phase is the current active phase
 */
export function isPhaseActive(
  phase: TravelPhase,
  currentPhase: TravelPhase
): boolean {
  return phase === currentPhase;
}
