/**
 * Floor Plan Processing Hook
 *
 * Handles uploading floor plan images and processing them via API
 */

import { useState, useCallback } from 'react';
import type { PipelineResult } from '@/lib/pipeline';
import type { FloorPlanProcessingState, ProcessingStep } from '@/lib/vision/types';

export interface UseFloorPlanProcessingOptions {
  onProgress?: (state: FloorPlanProcessingState) => void;
  onComplete?: (result: PipelineResult) => void;
  onError?: (error: string) => void;
}

export interface UseFloorPlanProcessingReturn {
  isProcessing: boolean;
  progress: FloorPlanProcessingState | null;
  result: PipelineResult | null;
  error: string | null;
  processImage: (file: File) => Promise<void>;
  processImageUrl: (url: string) => Promise<void>;
  reset: () => void;
}

/**
 * Convert file to base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useFloorPlanProcessing(
  options?: UseFloorPlanProcessingOptions
): UseFloorPlanProcessingReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<FloorPlanProcessingState | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  const processImage = useCallback(async (file: File) => {
    reset();
    setIsProcessing(true);

    // Create initial progress state
    const initialProgress: FloorPlanProcessingState = {
      sessionId: '',
      imageUrl: URL.createObjectURL(file),
      currentStep: 'upload',
      steps: [
        { name: 'upload', status: 'running', progress: 0 },
        { name: 'vision_analysis', status: 'pending', progress: 0 },
        { name: 'geometry', status: 'pending', progress: 0 },
        { name: 'rendering', status: 'pending', progress: 0 },
      ],
    };
    setProgress(initialProgress);
    options?.onProgress?.(initialProgress);

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);

      // Update progress - upload complete
      const uploadedProgress: FloorPlanProcessingState = {
        ...initialProgress,
        currentStep: 'vision_analysis',
        steps: [
          { name: 'upload', status: 'completed', progress: 100 },
          { name: 'vision_analysis', status: 'running', progress: 10, message: 'Analyzing with AI...' },
          { name: 'geometry', status: 'pending', progress: 0 },
          { name: 'rendering', status: 'pending', progress: 0 },
        ],
      };
      setProgress(uploadedProgress);
      options?.onProgress?.(uploadedProgress);

      // Call API
      const response = await fetch('/api/floor-plan/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
        }),
      });

      const data: PipelineResult = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      // Update with final result
      const completedProgress: FloorPlanProcessingState = {
        sessionId: data.sessionId,
        imageUrl: initialProgress.imageUrl,
        currentStep: 'rendering',
        steps: data.steps,
        analysis: data.analysis,
      };
      setProgress(completedProgress);
      setResult(data);
      options?.onProgress?.(completedProgress);
      options?.onComplete?.(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      options?.onError?.(errorMessage);

      // Update progress with error
      if (progress) {
        const errorProgress: FloorPlanProcessingState = {
          ...progress,
          error: errorMessage,
          steps: progress.steps.map((step) =>
            step.status === 'running'
              ? { ...step, status: 'failed' as ProcessingStep['status'], message: errorMessage }
              : step
          ),
        };
        setProgress(errorProgress);
        options?.onProgress?.(errorProgress);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [options, progress, reset]);

  const processImageUrl = useCallback(async (url: string) => {
    reset();
    setIsProcessing(true);

    const initialProgress: FloorPlanProcessingState = {
      sessionId: '',
      imageUrl: url,
      currentStep: 'vision_analysis',
      steps: [
        { name: 'upload', status: 'completed', progress: 100 },
        { name: 'vision_analysis', status: 'running', progress: 10 },
        { name: 'geometry', status: 'pending', progress: 0 },
        { name: 'rendering', status: 'pending', progress: 0 },
      ],
    };
    setProgress(initialProgress);
    options?.onProgress?.(initialProgress);

    try {
      const response = await fetch('/api/floor-plan/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: url,
        }),
      });

      const data: PipelineResult = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      setResult(data);
      options?.onComplete?.(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      options?.onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [options, reset]);

  return {
    isProcessing,
    progress,
    result,
    error,
    processImage,
    processImageUrl,
    reset,
  };
}
