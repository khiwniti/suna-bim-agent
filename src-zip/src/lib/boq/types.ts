/**
 * BOQ Types
 *
 * Type definitions for Bill of Quantities analysis.
 */

export interface BOQItem {
  id: string;
  itemNumber: string;
  description: string;
  unit: string;
  quantity: number;
  category: string;
  materialMatch?: {
    materialId: string;
    materialName: string;
    confidence: number;
  };
  carbonFootprint?: {
    factor: number;
    total: number;
    unit: string;
  };
}

export interface BOQAnalysisResult {
  id: string;
  filename: string;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'error';
  items: BOQItem[];
  summary: {
    totalItems: number;
    matchedItems: number;
    unmatchedItems: number;
    totalCarbon: number;
    categories: { category: string; count: number; carbon: number }[];
  };
  metadata: {
    projectName?: string;
    contractor?: string;
    date?: string;
    pageCount: number;
  };
  error?: string;
}

export interface BOQExtractionRequest {
  imageBase64: string;
  pageNumber: number;
  filename: string;
}

export interface BOQExtractionResponse {
  success: boolean;
  items: Omit<BOQItem, 'id' | 'carbonFootprint'>[];
  metadata: {
    projectName?: string;
    contractor?: string;
    date?: string;
  };
  error?: string;
}
