/**
 * Floor Plan Processing Pipeline
 *
 * Orchestrates the complete floor plan to 3D model conversion:
 * 1. Vision Analysis (GPT-4o/Claude) → FloorPlanAnalysis
 * 2. Geometry Generation → Scene3D
 * 3. Real-time progress updates
 */

import { FloorPlanVisionAnalyzer, getFloorPlanAnalyzer } from '../vision';
import { FloorPlan3DGenerator, getFloorPlan3DGenerator } from '../geometry';
import type { FloorPlanAnalysis, FloorPlanProcessingState, ProcessingStep } from '../vision/types';
import type { Scene3D, GenerationProgress } from '../geometry/types';
import { nanoid } from 'nanoid';

// ============================================
// Pipeline Types
// ============================================

export interface PipelineResult {
  success: boolean;
  sessionId: string;
  analysis?: FloorPlanAnalysis;
  scene3D?: Scene3D;
  error?: string;
  steps: ProcessingStep[];
  totalTimeMs: number;
}

export interface PipelineOptions {
  wallHeight?: number;
  estimatedScale?: number;
  generateLabels?: boolean;
  onProgress?: (state: FloorPlanProcessingState) => void;
}

// ============================================
// Main Pipeline Class
// ============================================

export class FloorPlanPipeline {
  private analyzer: FloorPlanVisionAnalyzer;
  private generator: FloorPlan3DGenerator;
  private onProgress?: (state: FloorPlanProcessingState) => void;

  constructor(options?: PipelineOptions) {
    this.analyzer = getFloorPlanAnalyzer();
    this.generator = getFloorPlan3DGenerator({
      wallHeight: options?.wallHeight || 2.8,
      generateLabels: options?.generateLabels ?? true,
    });
    this.onProgress = options?.onProgress;

    // Wire up generator progress to pipeline progress
    this.generator.setProgressCallback((progress: GenerationProgress) => {
      this.updateStepProgress('geometry', progress.progress, progress.currentItem);
    });
  }

  /**
   * Process a floor plan image and generate 3D model
   */
  async process(imageInput: { base64?: string; url?: string }): Promise<PipelineResult> {
    const sessionId = nanoid();
    const startTime = Date.now();
    const steps: ProcessingStep[] = [
      { name: 'upload', status: 'completed', progress: 100 },
      { name: 'vision_analysis', status: 'pending', progress: 0 },
      { name: 'geometry', status: 'pending', progress: 0 },
      { name: 'rendering', status: 'pending', progress: 0 },
    ];

    const state: FloorPlanProcessingState = {
      sessionId,
      imageUrl: imageInput.url || 'data:image',
      currentStep: 'vision_analysis',
      steps,
    };

    try {
      // Step 1: Vision Analysis
      this.updateState(state, 'vision_analysis', 'running', 10, 'Analyzing floor plan with AI...');

      const analysis = await this.analyzer.analyze(imageInput, {
        wallHeight: 2.8,
      });

      this.updateState(state, 'vision_analysis', 'completed', 100, 'Analysis complete');
      state.analysis = analysis;

      // Log analysis summary for debugging
      console.log(`[Pipeline] Analysis complete:`, {
        walls: analysis.walls.length,
        openings: analysis.openings.length,
        rooms: analysis.rooms.length,
        scale: analysis.scale,
      });

      // Step 2: Generate 3D Geometry
      this.updateState(state, 'geometry', 'running', 10, 'Generating 3D walls...');

      const scene3D = await this.generator.generate(analysis);

      this.updateState(state, 'geometry', 'completed', 100, '3D model generated');

      // Step 3: Mark rendering as complete (frontend handles actual rendering)
      this.updateState(state, 'rendering', 'completed', 100, 'Ready for display');

      return {
        success: true,
        sessionId,
        analysis,
        scene3D,
        steps: state.steps,
        totalTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Mark current step as failed
      const currentStepIndex = state.steps.findIndex((s) => s.status === 'running');
      if (currentStepIndex >= 0) {
        state.steps[currentStepIndex].status = 'failed';
        state.steps[currentStepIndex].message = errorMessage;
      }

      state.error = errorMessage;
      this.emitProgress(state);

      return {
        success: false,
        sessionId,
        error: errorMessage,
        steps: state.steps,
        totalTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Update step status and emit progress
   */
  private updateState(
    state: FloorPlanProcessingState,
    stepName: string,
    status: ProcessingStep['status'],
    progress: number,
    message?: string
  ) {
    const stepIndex = state.steps.findIndex((s) => s.name === stepName);
    if (stepIndex >= 0) {
      state.steps[stepIndex].status = status;
      state.steps[stepIndex].progress = progress;
      if (message) {
        state.steps[stepIndex].message = message;
      }
      if (status === 'running') {
        state.steps[stepIndex].startedAt = new Date().toISOString();
      }
      if (status === 'completed' || status === 'failed') {
        state.steps[stepIndex].completedAt = new Date().toISOString();
      }
    }
    state.currentStep = stepName;
    this.emitProgress(state);
  }

  /**
   * Update step progress during processing
   */
  private updateStepProgress(stepName: string, progress: number, message?: string) {
    // This would need the current state reference, simplified for now
    console.log(`[Pipeline] ${stepName}: ${progress}% - ${message || ''}`);
  }

  /**
   * Emit progress update to callback
   */
  private emitProgress(state: FloorPlanProcessingState) {
    if (this.onProgress) {
      this.onProgress({ ...state, steps: [...state.steps] });
    }
  }
}

// ============================================
// Singleton Export
// ============================================

let defaultPipeline: FloorPlanPipeline | null = null;

export function getFloorPlanPipeline(options?: PipelineOptions): FloorPlanPipeline {
  if (!defaultPipeline || options) {
    defaultPipeline = new FloorPlanPipeline(options);
  }
  return defaultPipeline;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Quick analysis without 3D generation (for preview)
 */
export async function analyzeFloorPlanQuick(imageInput: { base64?: string; url?: string }): Promise<FloorPlanAnalysis> {
  const analyzer = getFloorPlanAnalyzer();
  return analyzer.analyze(imageInput);
}

/**
 * Generate 3D from existing analysis
 */
export async function generate3DFromAnalysis(analysis: FloorPlanAnalysis): Promise<Scene3D> {
  const generator = getFloorPlan3DGenerator();
  return generator.generate(analysis);
}
