/**
 * Floor Plan Vision Analyzer
 *
 * Uses GPT-4o Vision or Claude to analyze floor plan images
 * and extract architectural elements (walls, doors, windows, rooms)
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { nanoid } from 'nanoid';
import type {
  FloorPlanAnalysis,
  Wall,
  Opening,
  Room,
  Point2D,
  RoomType,
} from './types';

// ============================================
// Prompts
// ============================================

const SYSTEM_PROMPT = `You are an expert architectural floor plan analyzer. Your task is to analyze floor plan images and extract precise geometric data for 3D model generation.

You must be extremely accurate with coordinates and measurements. The output will be used to generate a 3D model, so precision is critical.

Guidelines:
1. Coordinates are in pixels from the image top-left corner (0,0)
2. All walls should be represented as line segments with start/end points
3. Detect wall thickness by measuring the width of wall lines
4. Exterior walls are typically thicker (shown in bold/dark)
5. Identify all doors (swing arcs indicate door direction)
6. Identify all windows (shown as double lines in walls)
7. Rooms are enclosed spaces bounded by walls
8. Estimate room types based on fixtures (toilets=bathroom, sink+stove=kitchen, etc.)

Be methodical: trace walls clockwise starting from the top-left corner.`;

const ANALYSIS_PROMPT = `Analyze this floor plan image and extract all architectural elements.

Return a JSON object with EXACTLY this structure:
{
  "image_dimensions": { "width": number, "height": number },
  "scale": {
    "pixels_per_meter": number,
    "detected": boolean,
    "notes": "string explaining how scale was determined"
  },
  "walls": [
    {
      "id": "wall_1",
      "start_x": number,
      "start_y": number,
      "end_x": number,
      "end_y": number,
      "thickness_px": number,
      "type": "exterior" | "interior" | "partition"
    }
  ],
  "openings": [
    {
      "id": "opening_1",
      "type": "door" | "window" | "archway",
      "center_x": number,
      "center_y": number,
      "width_px": number,
      "height_px": number,
      "wall_id": "wall_1",
      "swing_direction": "left" | "right" | "double" | "sliding" | null
    }
  ],
  "rooms": [
    {
      "id": "room_1",
      "type": "bedroom" | "bathroom" | "kitchen" | "living" | "dining" | "office" | "hallway" | "closet" | "balcony" | "elevator" | "stairs" | "storage" | "utility" | "unknown",
      "polygon": [[x1, y1], [x2, y2], ...],
      "center_x": number,
      "center_y": number,
      "area_estimate_sqm": number
    }
  ],
  "furniture": [
    {
      "type": "string describing furniture",
      "center_x": number,
      "center_y": number,
      "width_px": number,
      "height_px": number
    }
  ]
}

IMPORTANT:
- Trace ALL walls completely - don't skip any
- Each wall segment should connect to others at corners
- For the central corridor (dark area in image), this appears to be the hallway/elevator area
- Detect apartment unit boundaries as separate rooms
- Be precise with coordinates - trace wall endpoints carefully`;

// ============================================
// Analyzer Class
// ============================================

export class FloorPlanVisionAnalyzer {
  private model: ChatOpenAI;
  private modelName: string;

  constructor(options?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  }) {
    this.modelName = options?.model || 'gpt-4o';

    this.model = new ChatOpenAI({
      model: this.modelName,
      temperature: 0,
      maxTokens: 8000,
      ...(options?.apiKey && { apiKey: options.apiKey }),
      ...(options?.baseUrl && {
        configuration: {
          baseURL: options.baseUrl,
        }
      }),
    });
  }

  /**
   * Analyze a floor plan image
   */
  async analyze(
    imageInput: { base64?: string; url?: string },
    options?: {
      estimatedScale?: number;
      wallHeight?: number;
    }
  ): Promise<FloorPlanAnalysis> {
    const startTime = Date.now();
    const analysisId = nanoid();

    // Prepare image content
    let imageContent: { type: 'image_url'; image_url: { url: string } };

    if (imageInput.base64) {
      // Detect image type from base64 header or default to png
      const mimeType = this.detectMimeType(imageInput.base64);
      imageContent = {
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${imageInput.base64}`,
        },
      };
    } else if (imageInput.url) {
      imageContent = {
        type: 'image_url',
        image_url: {
          url: imageInput.url,
        },
      };
    } else {
      throw new Error('Either base64 or url must be provided');
    }

    // Call vision model
    const response = await this.model.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage({
        content: [
          imageContent,
          { type: 'text', text: ANALYSIS_PROMPT },
        ],
      }),
    ]);

    // Parse response
    const content = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const rawAnalysis = this.parseJsonResponse(content);

    // Convert to typed structure
    const analysis = this.convertToAnalysis(
      rawAnalysis,
      analysisId,
      imageInput.url || 'data:image',
      options?.wallHeight || 2.8
    );

    analysis.metadata = {
      analyzedAt: new Date().toISOString(),
      modelUsed: this.modelName,
      confidence: this.calculateConfidence(analysis),
      processingTimeMs: Date.now() - startTime,
    };

    return analysis;
  }

  /**
   * Detect MIME type from base64 data
   */
  private detectMimeType(base64: string): string {
    if (base64.startsWith('/9j/')) return 'image/jpeg';
    if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
    if (base64.startsWith('R0lGOD')) return 'image/gif';
    if (base64.startsWith('UklGR')) return 'image/webp';
    return 'image/png'; // Default
  }

  /**
   * Parse JSON from LLM response (handles markdown code blocks)
   */
  private parseJsonResponse(content: string): Record<string, unknown> {
    // Remove markdown code blocks if present
    let jsonStr = content;

    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Try to find JSON object
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }

    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to parse JSON response:', content);
      throw new Error(`Failed to parse vision analysis response: ${error}`);
    }
  }

  /**
   * Convert raw LLM response to typed FloorPlanAnalysis
   */
  private convertToAnalysis(
    raw: Record<string, unknown>,
    id: string,
    imageUrl: string,
    defaultWallHeight: number
  ): FloorPlanAnalysis {
    const imageDims = raw.image_dimensions as { width: number; height: number } || { width: 1000, height: 500 };
    const scaleData = raw.scale as { pixels_per_meter: number; detected: boolean } || { pixels_per_meter: 50, detected: false };

    // Convert walls
    const rawWalls = (raw.walls as Array<Record<string, unknown>>) || [];
    const walls: Wall[] = rawWalls.map((w, i) => ({
      id: (w.id as string) || `wall_${i + 1}`,
      start: {
        x: (w.start_x as number) || 0,
        y: (w.start_y as number) || 0
      },
      end: {
        x: (w.end_x as number) || 0,
        y: (w.end_y as number) || 0
      },
      thickness: ((w.thickness_px as number) || 10) / scaleData.pixels_per_meter,
      height: defaultWallHeight,
      type: (w.type as 'exterior' | 'interior' | 'partition') || 'interior',
    }));

    // Convert openings
    const rawOpenings = (raw.openings as Array<Record<string, unknown>>) || [];
    const openings: Opening[] = rawOpenings.map((o, i) => ({
      id: (o.id as string) || `opening_${i + 1}`,
      type: (o.type as 'door' | 'window' | 'archway') || 'door',
      position: {
        x: (o.center_x as number) || 0,
        y: (o.center_y as number) || 0,
      },
      width: ((o.width_px as number) || 80) / scaleData.pixels_per_meter,
      height: (o.type === 'window' ? 1.2 : 2.1), // Standard heights
      wallId: (o.wall_id as string) || '',
      swingDirection: o.swing_direction as Opening['swingDirection'],
    }));

    // Convert rooms
    const rawRooms = (raw.rooms as Array<Record<string, unknown>>) || [];
    const rooms: Room[] = rawRooms.map((r, i) => {
      const polygon = (r.polygon as number[][]) || [];
      const points: Point2D[] = polygon.map(p => ({
        x: p[0] / scaleData.pixels_per_meter,
        y: p[1] / scaleData.pixels_per_meter,
      }));

      return {
        id: (r.id as string) || `room_${i + 1}`,
        type: (r.type as RoomType) || 'unknown',
        polygon: points,
        centroid: {
          x: (r.center_x as number) / scaleData.pixels_per_meter,
          y: (r.center_y as number) / scaleData.pixels_per_meter,
        },
        areaSquareMeters: (r.area_estimate_sqm as number) || 0,
      };
    });

    return {
      id,
      imageUrl,
      imageDimensions: imageDims,
      scale: {
        pixelsPerMeter: scaleData.pixels_per_meter,
        detected: scaleData.detected,
      },
      walls: walls.map(w => ({
        ...w,
        start: {
          x: w.start.x / scaleData.pixels_per_meter,
          y: w.start.y / scaleData.pixels_per_meter,
        },
        end: {
          x: w.end.x / scaleData.pixels_per_meter,
          y: w.end.y / scaleData.pixels_per_meter,
        },
      })),
      openings,
      rooms,
      furniture: [],
      metadata: {
        analyzedAt: '',
        modelUsed: '',
        confidence: 0,
        processingTimeMs: 0,
      },
    };
  }

  /**
   * Calculate confidence score based on analysis completeness
   */
  private calculateConfidence(analysis: FloorPlanAnalysis): number {
    let score = 0;

    // Has walls
    if (analysis.walls.length > 0) score += 0.3;
    if (analysis.walls.length > 5) score += 0.1;

    // Has rooms
    if (analysis.rooms.length > 0) score += 0.2;

    // Has openings
    if (analysis.openings.length > 0) score += 0.2;

    // Scale was detected
    if (analysis.scale.detected) score += 0.1;

    // Reasonable proportions
    if (analysis.walls.length > 0 && analysis.rooms.length > 0) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }
}

// ============================================
// Export singleton for convenience
// ============================================

let defaultAnalyzer: FloorPlanVisionAnalyzer | null = null;

export function getFloorPlanAnalyzer(): FloorPlanVisionAnalyzer {
  if (!defaultAnalyzer) {
    // Support both Anthropic-compatible and OpenAI endpoints
    const baseUrl = process.env.ANTHROPIC_BASE_URL || process.env.OPENAI_BASE_URL;
    const apiKey = process.env.ANTHROPIC_AUTH_TOKEN || process.env.OPENAI_API_KEY || 'dummy';
    const model = process.env.ANTHROPIC_MODEL || process.env.OPENAI_MODEL || 'gpt-4o';

    console.log(`[VisionAnalyzer] Initializing with model: ${model}, baseUrl: ${baseUrl ? 'custom' : 'default'}`);

    defaultAnalyzer = new FloorPlanVisionAnalyzer({
      baseUrl,
      apiKey,
      model,
    });
  }
  return defaultAnalyzer;
}
