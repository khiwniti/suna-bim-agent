'use client';

/**
 * useFloorPlanAPI Hook
 *
 * React hook for floor plan processing via direct API endpoint.
 * This is a simpler alternative to useFloorPlanMCP that doesn't require MCP.
 */

import { useState, useCallback } from 'react';
import { useBIMStore } from '@/stores/bim-store';
import type { BIMModel, BIMElement } from '@/types';
import type { Scene3D } from '@/mcp';
import { nanoid } from 'nanoid';

// ============================================
// Types
// ============================================

export interface UseFloorPlanAPIOptions {
  /** Callback when processing starts */
  onStart?: () => void;
  /** Callback when processing completes successfully */
  onComplete?: (scene: Scene3D) => void;
  /** Callback when processing fails */
  onError?: (error: string) => void;
  /** Whether to automatically update BIM store */
  updateStore?: boolean;
}

export interface UseFloorPlanAPIReturn {
  /** Whether processing is currently in progress */
  isProcessing: boolean;
  /** Resulting 3D scene after successful processing */
  result: Scene3D | null;
  /** Error message if processing failed */
  error: string | null;
  /** Progress message */
  progressMessage: string | null;
  /** Process a floor plan image from base64 */
  processFloorPlan: (imageBase64: string, options?: ProcessOptions) => Promise<Scene3D | null>;
  /** Reset hook state */
  reset: () => void;
}

export interface ProcessOptions {
  /** Wall height in meters (default: 2.8) */
  wallHeight?: number;
  /** Generate room labels in 3D scene */
  generateLabels?: boolean;
}

// ============================================
// Scene to BIM Model Converter
// ============================================

/**
 * Convert Scene3D to BIMModel for store integration
 */
function scene3DToBIMModel(scene: Scene3D, imageName?: string): BIMModel {
  const elements: BIMElement[] = [];

  // Convert meshes to BIM elements
  for (const mesh of scene.meshes) {
    const element: BIMElement = {
      id: mesh.id,
      globalId: mesh.id,
      type: meshTypeToBIMType(mesh.type),
      name: (mesh.userData?.name as string) || `${mesh.type}_${mesh.id}`,
      properties: {
        ...mesh.userData,
        materialColor: mesh.material.color,
        materialOpacity: mesh.material.opacity,
      },
      geometry: {
        position: {
          x: mesh.position[0],
          y: mesh.position[1],
          z: mesh.position[2],
        },
        rotation: {
          x: mesh.rotation[0],
          y: mesh.rotation[1],
          z: mesh.rotation[2],
        },
        scale: {
          x: mesh.scale[0],
          y: mesh.scale[1],
          z: mesh.scale[2],
        },
        boundingBox: {
          min: scene.boundingBox.min,
          max: scene.boundingBox.max,
        },
      },
    };
    elements.push(element);
  }

  return {
    id: scene.id,
    name: imageName || `Floor Plan ${new Date().toLocaleDateString()}`,
    description: `Generated from floor plan analysis`,
    createdAt: new Date(scene.metadata.generatedAt),
    updatedAt: new Date(),
    source: 'floorplan',
    elements,
    levels: [
      {
        id: 'level-0',
        name: 'Ground Floor',
        elevation: 0,
        height: scene.metadata.wallHeight,
      },
    ],
    metadata: {
      totalArea: scene.metadata.floorArea,
      elementCount: elements.length,
      levelCount: 1,
      boundingBox: {
        min: scene.boundingBox.min,
        max: scene.boundingBox.max,
      },
      units: 'metric',
    },
  };
}

/**
 * Convert mesh type to BIM element type
 */
function meshTypeToBIMType(meshType: string): BIMElement['type'] {
  const typeMap: Record<string, BIMElement['type']> = {
    wall: 'wall',
    floor: 'slab',
    ceiling: 'slab',
    door: 'door',
    window: 'window',
    room_label: 'space',
  };
  return typeMap[meshType] || 'other';
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Hook for floor plan processing via direct API
 *
 * @example
 * ```tsx
 * function FloorPlanUploader() {
 *   const { processFloorPlan, isProcessing, error } = useFloorPlanAPI({
 *     onComplete: (scene) => console.log('Generated:', scene),
 *   });
 *
 *   const handleUpload = async (file: File) => {
 *     const base64 = await fileToBase64(file);
 *     await processFloorPlan(base64);
 *   };
 *
 *   return (
 *     <div>
 *       {isProcessing && <Spinner />}
 *       {error && <Error message={error} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFloorPlanAPI(options: UseFloorPlanAPIOptions = {}): UseFloorPlanAPIReturn {
  const {
    onStart,
    onComplete,
    onError,
    updateStore = true,
  } = options;

  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Scene3D | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  // Store actions
  const setCurrentModel = useBIMStore((state) => state.setCurrentModel);
  const addModel = useBIMStore((state) => state.addModel);
  const setLoading = useBIMStore((state) => state.setLoading);
  const setStoreError = useBIMStore((state) => state.setError);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setIsProcessing(false);
    setResult(null);
    setError(null);
    setProgressMessage(null);
  }, []);

  /**
   * Process floor plan via API
   */
  const processFloorPlan = useCallback(
    async (imageBase64: string, processOptions?: ProcessOptions): Promise<Scene3D | null> => {
      // Reset state
      reset();
      setIsProcessing(true);
      setProgressMessage('Uploading floor plan...');
      onStart?.();

      if (updateStore) {
        setLoading(true);
        setStoreError(null);
      }

      try {
        setProgressMessage('Analyzing floor plan with AI...');

        const response = await fetch('/api/floor-plan/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageBase64,
            options: {
              wallHeight: processOptions?.wallHeight ?? 2.8,
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle authentication error
          if (response.status === 401) {
            throw new Error('Please sign in to use floor plan analysis');
          }
          throw new Error(data.error || `Request failed: ${response.status}`);
        }

        if (!data.success) {
          throw new Error(data.error || 'Processing failed');
        }

        // Extract Scene3D from result
        const scene3D = data.scene3D || data.scene || createScene3DFromResult(data);

        if (!scene3D) {
          throw new Error('No 3D scene generated');
        }

        // Update state
        setResult(scene3D);
        setIsProcessing(false);
        setProgressMessage(null);

        // Update store if enabled
        if (updateStore) {
          const bimModel = scene3DToBIMModel(scene3D);
          addModel(bimModel);
          setCurrentModel(bimModel);
          setLoading(false);
        }

        // Callbacks
        onComplete?.(scene3D);

        return scene3D;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsProcessing(false);
        setProgressMessage(null);

        if (updateStore) {
          setLoading(false);
          setStoreError(errorMessage);
        }

        onError?.(errorMessage);
        return null;
      }
    },
    [
      reset,
      onStart,
      onComplete,
      onError,
      updateStore,
      setLoading,
      setStoreError,
      addModel,
      setCurrentModel,
    ]
  );

  return {
    isProcessing,
    result,
    error,
    progressMessage,
    processFloorPlan,
    reset,
  };
}

/**
 * Create Scene3D from API result if not directly provided
 */
function createScene3DFromResult(data: Record<string, unknown>): Scene3D | null {
  // Handle case where the response has analysis data but not a full Scene3D
  const analysis = data.analysis as Record<string, unknown> | undefined;
  const geometry = data.geometry as Record<string, unknown> | undefined;

  if (!analysis && !geometry) {
    return null;
  }

  const id = nanoid();
  const timestamp = new Date().toISOString();

  // Create basic Scene3D structure with required lights and camera
  return {
    id,
    meshes: [],
    lights: [
      {
        type: 'ambient' as const,
        color: '#ffffff',
        intensity: 0.6,
      },
      {
        type: 'directional' as const,
        color: '#ffffff',
        intensity: 0.8,
        position: [10, 20, 10] as [number, number, number],
        target: [0, 0, 0] as [number, number, number],
      },
    ],
    camera: {
      type: 'perspective' as const,
      position: [15, 15, 15] as [number, number, number],
      target: [0, 0, 0] as [number, number, number],
      fov: 60,
      near: 0.1,
      far: 1000,
    },
    boundingBox: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 10, y: 3, z: 10 },
    },
    metadata: {
      generatedAt: timestamp,
      sourceAnalysisId: id,
      wallHeight: 2.8,
      floorArea: (analysis?.totalArea as number) || 100,
      totalWalls: (analysis?.wallCount as number) || 0,
      totalRooms: (analysis?.roomCount as number) || 0,
      totalOpenings: (analysis?.openingCount as number) || 0,
    },
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Convert File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
