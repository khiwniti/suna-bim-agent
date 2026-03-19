/**
 * BOQ AI Extraction Service
 *
 * Uses Claude Vision to extract BOQ data from images/PDFs.
 */

import { BOQExtractionRequest, BOQExtractionResponse, BOQItem } from './types';

const EXTRACTION_PROMPT = `You are an expert at reading construction Bill of Quantities (BOQ) documents.
Analyze this image and extract all line items from the BOQ table.

For each item, extract:
1. Item Number (e.g., "1.1", "2.3.1")
2. Description (full description of work/material)
3. Unit (e.g., "m³", "kg", "m²", "nos", "set")
4. Quantity (numeric value)
5. Category (classify as one of: Concrete, Steel, Masonry, Finishes, MEP, Structural, Earthwork, Other)

Also extract any document metadata visible:
- Project name
- Contractor name
- Document date

Return the data as valid JSON in this exact format:
{
  "items": [
    {
      "itemNumber": "1.1",
      "description": "Supply and place ready-mixed concrete Grade C30",
      "unit": "m³",
      "quantity": 150.5,
      "category": "Concrete"
    }
  ],
  "metadata": {
    "projectName": "Example Project",
    "contractor": "ABC Construction",
    "date": "2025-01-15"
  }
}

Important:
- Extract ALL items visible in the image
- Use standard units (m³, m², kg, nos, m, set, lot)
- Quantities must be numbers (not strings)
- If quantity is unclear, make best estimate
- Classify materials into appropriate categories
- Return ONLY valid JSON, no other text`;

interface ContentBlock {
  type: string;
  text?: string;
}

/**
 * Extract BOQ items from an image using Claude Vision
 */
export async function extractBOQFromImage(
  request: BOQExtractionRequest
): Promise<BOQExtractionResponse> {
  try {
    // Dynamic import to avoid build issues
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: request.imageBase64,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((c: ContentBlock) => c.type === 'text') as ContentBlock | undefined;
    if (!textContent || !textContent.text) {
      throw new Error('No text response from AI');
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      items: parsed.items || [],
      metadata: parsed.metadata || {},
    };
  } catch (error) {
    console.error('[BOQ] Extraction error:', error);
    return {
      success: false,
      items: [],
      metadata: {},
      error: error instanceof Error ? error.message : 'Extraction failed',
    };
  }
}

/**
 * Map extracted items to Thai material database
 */
export function mapToMaterials(
  items: Omit<BOQItem, 'id' | 'carbonFootprint'>[]
): Omit<BOQItem, 'id'>[] {
  // Import Thai materials for matching
  // This is a simplified version - in production, use fuzzy matching
  const categoryMaterialMap: Record<string, { id: string; name: string; factor: number }> = {
    Concrete: { id: 'concrete-c30', name: 'Ready-mixed Concrete C30', factor: 0.13 },
    Steel: { id: 'steel-rebar', name: 'Steel Reinforcement', factor: 1.46 },
    Masonry: { id: 'clay-brick', name: 'Clay Brick', factor: 0.22 },
    Finishes: { id: 'ceramic-tile', name: 'Ceramic Floor Tile', factor: 0.78 },
    MEP: { id: 'pvc-pipe', name: 'PVC Pipe', factor: 2.41 },
    Structural: { id: 'structural-steel', name: 'Structural Steel', factor: 1.55 },
    Earthwork: { id: 'gravel', name: 'Gravel/Aggregate', factor: 0.0048 },
    Other: { id: 'unknown', name: 'Unknown Material', factor: 0.5 },
  };

  return items.map((item) => {
    const material = categoryMaterialMap[item.category] || categoryMaterialMap.Other;
    const carbonTotal = item.quantity * material.factor;

    return {
      ...item,
      materialMatch: {
        materialId: material.id,
        materialName: material.name,
        confidence: item.category !== 'Other' ? 0.85 : 0.5,
      },
      carbonFootprint: {
        factor: material.factor,
        total: carbonTotal,
        unit: 'kgCO2e',
      },
    };
  });
}

/**
 * Calculate summary statistics from BOQ items
 */
export function calculateSummary(items: BOQItem[]): BOQItem['carbonFootprint'] & {
  totalItems: number;
  matchedItems: number;
  unmatchedItems: number;
  totalCarbon: number;
  categories: { category: string; count: number; carbon: number }[];
} {
  const categoryMap = new Map<string, { count: number; carbon: number }>();

  let totalCarbon = 0;
  let matchedItems = 0;
  let unmatchedItems = 0;

  items.forEach((item) => {
    const carbon = item.carbonFootprint?.total || 0;
    totalCarbon += carbon;

    if (item.materialMatch && item.materialMatch.confidence > 0.7) {
      matchedItems++;
    } else {
      unmatchedItems++;
    }

    const existing = categoryMap.get(item.category) || { count: 0, carbon: 0 };
    categoryMap.set(item.category, {
      count: existing.count + 1,
      carbon: existing.carbon + carbon,
    });
  });

  const categories = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    count: data.count,
    carbon: data.carbon,
  }));

  return {
    factor: 0,
    total: totalCarbon,
    unit: 'kgCO2e',
    totalItems: items.length,
    matchedItems,
    unmatchedItems,
    totalCarbon,
    categories,
  };
}
