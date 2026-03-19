'use client';

/**
 * useFloorPlanMCP Hook
 *
 * React hook for floor plan processing via MCP (Model Context Protocol).
 * Provides streaming progress updates and integrates with Zustand store.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { MCPClient, getMCPClient } from '@/mcp';
import type {
  ProcessingProgress,
  AnalyzeFloorPlanResult,
  MCPConnectionState,
  Scene3D,
} from '@/mcp';
import { useBIMStore } from '@/stores/bim-store';
import type { BIMModel, BIMElement } from '@/types';
import { nanoid } from 'nanoid';

// ============================================
// Hook Types
// ============================================

export interface UseFloorPlanMCPOptions {
  /** Callback when processing starts */
  onStart?: () => void;
  /** Callback for each progress update */
  onProgress?: (progress: ProcessingProgress) => void;
  /** Callback when processing completes successfully */
  onComplete?: (scene: Scene3D) => void;
  /** Callback when processing fails */
  onError?: (error: string) => void;
  /** Whether to automatically update BIM store */
  updateStore?: boolean;
  /** MCP endpoint override */
  endpoint?: string;
}

export interface UseFloorPlanMCPReturn {
  /** Whether processing is currently in progress */
  isProcessing: boolean;
  /** Current processing progress */
  progress: ProcessingProgress | null;
  /** Resulting 3D scene after successful processing */
  result: Scene3D | null;
  /** Error message if processing failed */
  error: string | null;
  /** MCP connection state */
  connectionState: MCPConnectionState;
  /** Process a floor plan image from base64 */
  processFloorPlan: (imageBase64: string, options?: ProcessOptions) => Promise<Scene3D | null>;
  /** Process a floor plan image from URL */
  processFloorPlanUrl: (imageUrl: string, options?: ProcessOptions) => Promise<Scene3D | null>;
  /** Cancel ongoing processing */
  cancelProcessing: () => void;
  /** Reset hook state */
  reset: () => void;
  /** MCP client instance for advanced usage */
  client: MCPClient;
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
      globalId: mesh.id, // Use same ID for now
      type: meshTypeToBIMType(mesh.type),
      name: mesh.userData.name as string || `${mesh.type}_${mesh.id}`,
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
 * Hook for floor plan processing via MCP
 *
 * @example
 * ```tsx
 * function FloorPlanUploader() {
 *   const { processFloorPlan, isProcessing, progress, error } = useFloorPlanMCP({
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
 *       {isProcessing && <Progress value={progress?.progress} />}
 *       {error && <Error message={error} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFloorPlanMCP(options: UseFloorPlanMCPOptions = {}): UseFloorPlanMCPReturn {
  const {
    onStart,
    onProgress,
    onComplete,
    onError,
    updateStore = true,
    endpoint,
  } = options;

  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [result, setResult] = useState<Scene3D | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<MCPConnectionState>('disconnected');

  // Refs
  const clientRef = useRef<MCPClient | null>(null);
  const abortRef = useRef<boolean>(false);

  // Store actions
  const setCurrentModel = useBIMStore((state) => state.setCurrentModel);
  const addModel = useBIMStore((state) => state.addModel);
  const setLoading = useBIMStore((state) => state.setLoading);
  const setStoreError = useBIMStore((state) => state.setError);

  // Initialize client
  useEffect(() => {
    const config = endpoint ? { endpoint } : undefined;
    clientRef.current = getMCPClient(config);

    // Subscribe to connection state changes
    const unsubscribe = clientRef.current.onConnectionChange((state) => {
      setConnectionState(state);
    });

    // Connect on mount
    clientRef.current.connect().catch((err) => {
      console.error('[useFloorPlanMCP] Connection failed:', err);
    });

    return () => {
      unsubscribe();
    };
  }, [endpoint]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(null);
    setResult(null);
    setError(null);
    abortRef.current = false;
  }, []);

  /**
   * Cancel ongoing processing
   */
  const cancelProcessing = useCallback(() => {
    abortRef.current = true;
    setIsProcessing(false);
    setProgress(null);
  }, []);

  /**
   * Process floor plan with streaming progress
   */
  const processFloorPlanInternal = useCallback(
    async (
      args: { imageBase64?: string; imageUrl?: string },
      processOptions?: ProcessOptions
    ): Promise<Scene3D | null> => {
      const client = clientRef.current;
      if (!client) {
        const err = 'MCP client not initialized';
        setError(err);
        onError?.(err);
        return null;
      }

      // Reset state
      reset();
      setIsProcessing(true);
      abortRef.current = false;
      onStart?.();

      if (updateStore) {
        setLoading(true);
        setStoreError(null);
      }

      try {
        // Ensure connected
        if (client.getConnectionState() !== 'connected') {
          await client.connect();
        }

        // Initial progress
        const initialProgress: ProcessingProgress = {
          step: 'connecting',
          progress: 0,
          message: 'Connecting to MCP server...',
          timestamp: new Date().toISOString(),
        };
        setProgress(initialProgress);
        onProgress?.(initialProgress);

        // Call tool with streaming progress
        const toolArgs = {
          ...args,
          wallHeight: processOptions?.wallHeight ?? 2.8,
          generateLabels: processOptions?.generateLabels ?? true,
        };

        let finalResult: AnalyzeFloorPlanResult | null = null;

        for await (const progressUpdate of client.callToolWithProgress(
          'analyze_floorplan',
          toolArgs
        )) {
          // Check for cancellation
          if (abortRef.current) {
            break;
          }

          setProgress(progressUpdate);
          onProgress?.(progressUpdate);

          // Check if this is the final result
          if (progressUpdate.step === 'complete' && progressUpdate.data) {
            finalResult = progressUpdate.data as unknown as AnalyzeFloorPlanResult;
          }
        }

        // Handle cancellation
        if (abortRef.current) {
          setIsProcessing(false);
          return null;
        }

        // Handle missing result - fallback to non-streaming call
        if (!finalResult) {
          const fallbackResult = await client.callToolSimple<AnalyzeFloorPlanResult>(
            'analyze_floorplan',
            toolArgs
          );
          finalResult = fallbackResult;
        }

        // Validate result
        if (!finalResult || !finalResult.success) {
          throw new Error(finalResult?.error || 'Processing failed');
        }

        const scene3D = finalResult.scene3D;
        if (!scene3D) {
          throw new Error('No 3D scene generated');
        }

        // Update state
        setResult(scene3D);
        setIsProcessing(false);

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
      onProgress,
      onComplete,
      onError,
      updateStore,
      setLoading,
      setStoreError,
      addModel,
      setCurrentModel,
    ]
  );

  /**
   * Process floor plan from base64 image
   */
  const processFloorPlan = useCallback(
    async (imageBase64: string, processOptions?: ProcessOptions): Promise<Scene3D | null> => {
      return processFloorPlanInternal({ imageBase64 }, processOptions);
    },
    [processFloorPlanInternal]
  );

  /**
   * Process floor plan from URL
   */
  const processFloorPlanUrl = useCallback(
    async (imageUrl: string, processOptions?: ProcessOptions): Promise<Scene3D | null> => {
      return processFloorPlanInternal({ imageUrl }, processOptions);
    },
    [processFloorPlanInternal]
  );

  return {
    isProcessing,
    progress,
    result,
    error,
    connectionState,
    processFloorPlan,
    processFloorPlanUrl,
    cancelProcessing,
    reset,
    client: clientRef.current || getMCPClient(),
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

/**
 * Convert base64 to data URL
 */
export function base64ToDataUrl(base64: string, mimeType = 'image/png'): string {
  return `data:${mimeType};base64,${base64}`;
}
