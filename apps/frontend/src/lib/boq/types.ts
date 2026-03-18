/**
 * BOQ (Bill of Quantities) Analysis Types
 *
 * Type definitions for BOQ document analysis results.
 */

/**
 * Carbon footprint breakdown for a single BOQ item
 */
export interface CarbonFootprint {
  /** Total carbon in kgCO2e */
  total: number;
  /** Embodied carbon from materials */
  embodied?: number;
  /** Operational carbon (if applicable) */
  operational?: number;
  /** Carbon from transportation */
  transport?: number;
}

/**
 * A single item extracted from the BOQ document
 */
export interface BOQItem {
  /** Unique identifier */
  id: string;
  /** Item number from the BOQ (e.g., "1.1", "2.3.1") */
  itemNumber: string;
  /** Description of the item/work */
  description: string;
  /** Quantity value */
  quantity: number;
  /** Unit of measurement (e.g., "m²", "m³", "kg", "pcs") */
  unit: string;
  /** Category classification */
  category: string;
  /** Unit rate/price (if available) */
  unitRate?: number;
  /** Total amount (quantity × unitRate) */
  amount?: number;
  /** Carbon footprint calculation */
  carbonFootprint?: CarbonFootprint;
  /** Confidence score of the extraction (0-1) */
  confidence?: number;
  /** Whether the item was matched to a material database */
  matched?: boolean;
  /** Material code from database (if matched) */
  materialCode?: string;
}

/**
 * Category summary with aggregated carbon data
 */
export interface CategorySummary {
  /** Category name */
  category: string;
  /** Number of items in this category */
  count: number;
  /** Total carbon for this category in kgCO2e */
  carbon: number;
  /** Percentage of total carbon */
  percentage?: number;
}

/**
 * Summary statistics from the BOQ analysis
 */
export interface BOQSummary {
  /** Total number of items extracted */
  totalItems: number;
  /** Number of items matched to material database */
  matchedItems: number;
  /** Total carbon footprint in kgCO2e */
  totalCarbon: number;
  /** Category breakdown */
  categories: CategorySummary[];
  /** Total project cost (if available) */
  totalCost?: number;
  /** Currency code */
  currency?: string;
}

/**
 * Metadata about the analysis process
 */
export interface BOQMetadata {
  /** Number of pages processed */
  pageCount: number;
  /** Document filename */
  filename?: string;
  /** Analysis timestamp */
  analyzedAt?: string;
  /** Processing duration in milliseconds */
  processingTime?: number;
  /** Model/AI used for extraction */
  modelUsed?: string;
  /** Document language detected */
  language?: string;
}

/**
 * Complete result from BOQ document analysis
 */
export interface BOQAnalysisResult {
  /** Summary statistics */
  summary: BOQSummary;
  /** Individual BOQ items */
  items: BOQItem[];
  /** Analysis metadata */
  metadata: BOQMetadata;
  /** Raw text extracted (for debugging) */
  rawText?: string;
  /** Any warnings or issues encountered */
  warnings?: string[];
}
