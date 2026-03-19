/**
 * useBIMFileUpload Hook
 *
 * Unified file upload hook that handles multiple BIM file types:
 * - IFC files: Loaded into 3D viewer, metadata extracted for AI analysis
 * - Floor plan images: Processed via AI vision to extract geometry
 * - DWG/DXF: Future support for CAD files
 *
 * Connects uploads to both the 3D viewer and AI chat context.
 */

import { useState, useCallback } from 'react';
import { useBIMStore } from '@/stores/bim-store';
import { useChatStore } from '@/stores/chat-store';
import { getIFCLoader, type IFCLoadProgress } from '@/lib/ifc';
import type { BIMModel } from '@/types';
import { nanoid } from 'nanoid';

// ============================================
// Types
// ============================================

export type SupportedFileType = 'ifc' | 'image' | 'dwg' | 'dxf' | 'rvt' | 'unknown';

export interface FileUploadProgress {
  stage: 'validating' | 'uploading' | 'parsing' | 'analyzing' | 'complete' | 'error';
  progress: number;
  message: string;
  fileType: SupportedFileType;
}

export interface UploadResult {
  success: boolean;
  fileType: SupportedFileType;
  model?: BIMModel;
  error?: string;
  /** Summary for AI context */
  contextSummary?: string;
}

export interface UseBIMFileUploadOptions {
  /** Called when upload starts */
  onStart?: (file: File) => void;
  /** Called when upload completes */
  onComplete?: (result: UploadResult) => void;
  /** Called on error */
  onError?: (error: string) => void;
  /** Whether to send summary to AI chat */
  notifyChat?: boolean;
  /** Whether to update BIM store */
  updateStore?: boolean;
}

export interface UseBIMFileUploadReturn {
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Current progress */
  progress: FileUploadProgress | null;
  /** Last upload result */
  result: UploadResult | null;
  /** Upload a file */
  uploadFile: (file: File) => Promise<UploadResult>;
  /** Upload multiple files */
  uploadFiles: (files: File[]) => Promise<UploadResult[]>;
  /** Reset state */
  reset: () => void;
  /** Supported file extensions */
  supportedExtensions: string[];
}

// ============================================
// File Type Detection
// ============================================

function detectFileType(file: File): SupportedFileType {
  const extension = file.name.toLowerCase().split('.').pop() || '';
  const mimeType = file.type.toLowerCase();

  // IFC files
  if (extension === 'ifc') return 'ifc';

  // Image files (floor plans)
  if (
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension) ||
    mimeType.startsWith('image/')
  ) {
    return 'image';
  }

  // CAD files
  if (extension === 'dwg') return 'dwg';
  if (extension === 'dxf') return 'dxf';

  // Revit files
  if (extension === 'rvt' || extension === 'rfa') return 'rvt';

  return 'unknown';
}

// ============================================
// Hook Implementation
// ============================================

export function useBIMFileUpload(options: UseBIMFileUploadOptions = {}): UseBIMFileUploadReturn {
  const {
    onStart,
    onComplete,
    onError,
    notifyChat = true,
    updateStore = true,
  } = options;

  // State
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<FileUploadProgress | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  // Store actions
  const setCurrentModel = useBIMStore((state) => state.setCurrentModel);
  const addModel = useBIMStore((state) => state.addModel);
  const setLoading = useBIMStore((state) => state.setLoading);
  const addMessage = useChatStore((state) => state.addMessage);

  const supportedExtensions = ['.ifc', '.jpg', '.jpeg', '.png', '.gif', '.webp'];

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(null);
    setResult(null);
  }, []);

  /**
   * Process IFC file
   */
  const processIFCFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      const loader = getIFCLoader();

      const onProgress = (p: IFCLoadProgress) => {
        setProgress({
          stage: p.stage === 'complete' ? 'complete' : 'parsing',
          progress: p.progress,
          message: p.message,
          fileType: 'ifc',
        });
      };

      const { model } = await loader.loadFromFile(file, onProgress);

      // Generate context summary for AI
      const contextSummary = generateIFCContextSummary(model, file.name);

      return {
        success: true,
        fileType: 'ifc',
        model,
        contextSummary,
      };
    },
    []
  );

  /**
   * Process image file (floor plan)
   */
  const processImageFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      setProgress({
        stage: 'uploading',
        progress: 20,
        message: 'Uploading floor plan...',
        fileType: 'image',
      });

      // Convert to base64
      const base64 = await fileToBase64(file);

      setProgress({
        stage: 'analyzing',
        progress: 50,
        message: 'Analyzing with AI vision...',
        fileType: 'image',
      });

      // Call floor plan analysis API
      const response = await fetch('/api/floor-plan/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          options: { wallHeight: 2.8 },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Floor plan analysis failed');
      }

      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Floor plan analyzed',
        fileType: 'image',
      });

      // Convert to BIMModel
      const model = createBIMModelFromFloorPlan(data, file.name);
      const contextSummary = generateFloorPlanContextSummary(data, file.name);

      return {
        success: true,
        fileType: 'image',
        model,
        contextSummary,
      };
    },
    []
  );

  /**
   * Upload a single file
   */
  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      reset();
      setIsUploading(true);
      onStart?.(file);

      if (updateStore) {
        setLoading(true);
      }

      const fileType = detectFileType(file);

      setProgress({
        stage: 'validating',
        progress: 0,
        message: 'Validating file...',
        fileType,
      });

      try {
        let uploadResult: UploadResult;

        switch (fileType) {
          case 'ifc':
            uploadResult = await processIFCFile(file);
            break;
          case 'image':
            uploadResult = await processImageFile(file);
            break;
          case 'dwg':
          case 'dxf':
          case 'rvt':
            throw new Error(`${fileType.toUpperCase()} files are not yet supported. Please convert to IFC first.`);
          default:
            throw new Error(`Unsupported file type: ${file.name}`);
        }

        // Update stores
        if (updateStore && uploadResult.model) {
          addModel(uploadResult.model);
          setCurrentModel(uploadResult.model);
          setLoading(false);
        }

        // Notify chat
        if (notifyChat && uploadResult.contextSummary) {
          addMessage({
            id: nanoid(),
            role: 'system',
            content: uploadResult.contextSummary,
            timestamp: new Date(),
            metadata: {
              elementRefs: uploadResult.model?.elements.map(e => e.id),
            },
          });
        }

        setResult(uploadResult);
        setIsUploading(false);
        onComplete?.(uploadResult);

        return uploadResult;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        const errorResult: UploadResult = {
          success: false,
          fileType,
          error: errorMessage,
        };

        setProgress({
          stage: 'error',
          progress: 0,
          message: errorMessage,
          fileType,
        });

        setResult(errorResult);
        setIsUploading(false);

        if (updateStore) {
          setLoading(false);
        }

        onError?.(errorMessage);

        return errorResult;
      }
    },
    [
      reset,
      onStart,
      onComplete,
      onError,
      updateStore,
      notifyChat,
      processIFCFile,
      processImageFile,
      setLoading,
      addModel,
      setCurrentModel,
      addMessage,
    ]
  );

  /**
   * Upload multiple files
   */
  const uploadFiles = useCallback(
    async (files: File[]): Promise<UploadResult[]> => {
      const results: UploadResult[] = [];
      for (const file of files) {
        const result = await uploadFile(file);
        results.push(result);
      }
      return results;
    },
    [uploadFile]
  );

  return {
    isUploading,
    progress,
    result,
    uploadFile,
    uploadFiles,
    reset,
    supportedExtensions,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Convert File to base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Generate AI context summary for IFC file
 */
function generateIFCContextSummary(model: BIMModel, filename: string): string {
  const elementsByType: Record<string, number> = {};
  for (const el of model.elements) {
    elementsByType[el.type] = (elementsByType[el.type] || 0) + 1;
  }

  const typeList = Object.entries(elementsByType)
    .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
    .join(', ');

  return `**IFC Model Loaded: ${filename}**

📊 **Model Summary:**
- **Name:** ${model.name}
- **Elements:** ${model.elements.length} total (${typeList || 'none parsed'})
- **Levels:** ${model.levels.length}
- **Source:** IFC file

The model is now loaded in the 3D viewer. You can ask me to:
- Analyze specific building elements
- Calculate sustainability metrics
- Identify MEP systems
- Generate reports

What would you like to know about this model?`;
}

/**
 * Generate AI context summary for floor plan
 */
function generateFloorPlanContextSummary(data: Record<string, unknown>, filename: string): string {
  const analysis = data.analysis as Record<string, unknown> | undefined;

  return `**Floor Plan Analyzed: ${filename}**

📊 **Analysis Summary:**
- **Total Area:** ${analysis?.totalArea || 'calculating...'}m²
- **Rooms:** ${analysis?.roomCount || 0}
- **Walls:** ${analysis?.wallCount || 0}
- **Openings:** ${analysis?.openingCount || 0}

The floor plan has been converted to 3D geometry. You can ask me to:
- Describe the spatial layout
- Suggest improvements
- Calculate areas by room
- Identify accessibility issues

What would you like to know about this floor plan?`;
}

/**
 * Create BIMModel from floor plan analysis result
 */
function createBIMModelFromFloorPlan(data: Record<string, unknown>, filename: string): BIMModel {
  const analysis = data.analysis as Record<string, unknown> | undefined;
  const id = nanoid();

  return {
    id,
    name: filename.replace(/\.[^/.]+$/, ''),
    description: 'Generated from floor plan analysis',
    createdAt: new Date(),
    updatedAt: new Date(),
    source: 'floorplan',
    elements: [],
    levels: [
      {
        id: 'level-0',
        name: 'Ground Floor',
        elevation: 0,
        height: 2.8,
      },
    ],
    metadata: {
      totalArea: (analysis?.totalArea as number) || 0,
      elementCount: 0,
      levelCount: 1,
      boundingBox: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 10, y: 3, z: 10 },
      },
      units: 'metric',
    },
  };
}
