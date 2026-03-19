/**
 * Model Upload Service
 *
 * Handles IFC model file upload to backend with:
 * - CSRF token handling
 * - Progress tracking
 * - Error handling
 * - Model metadata sync
 */

import { getCSRFToken, CSRF_HEADER_NAME } from '@/hooks/useCSRF';
import type { BIMModel, ModelMetadata } from '@/types/bim';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface UploadProgress {
  stage: 'preparing' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  url?: string;
  path?: string;
  originalName?: string;
  size?: number;
  error?: string;
}

export interface ModelSyncData {
  name: string;
  fileUrl: string;
  fileSize: number;
  metadata: ModelMetadata & {
    elements?: Array<{
      id: string;
      name: string;
      type: string;
      level?: string;
      material?: string;
      properties?: Record<string, unknown>;
    }>;
  };
  projectId?: string;
}

/**
 * Upload IFC file to storage with CSRF protection
 */
export async function uploadModelFile(
  file: File,
  projectId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    onProgress?.({ stage: 'preparing', progress: 0, message: 'Preparing upload...' });

    // Get CSRF token
    const csrfToken = getCSRFToken();
    if (!csrfToken) {
      // Try to initialize CSRF token
      await fetch('/api/health');
      const retryToken = getCSRFToken();
      if (!retryToken) {
        console.warn('CSRF token not available, proceeding anyway');
      }
    }

    onProgress?.({ stage: 'uploading', progress: 10, message: 'Uploading file...' });

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) {
      formData.append('projectId', projectId);
    }

    // Upload with CSRF header
    const headers: HeadersInit = {};
    const token = getCSRFToken();
    if (token) {
      headers[CSRF_HEADER_NAME] = token;
    }

    const response = await fetch(`${API_BASE_URL}/api/models/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `Upload failed: ${response.status}`);
    }

    onProgress?.({ stage: 'processing', progress: 80, message: 'Processing response...' });

    const result = await response.json();

    onProgress?.({ stage: 'complete', progress: 100, message: 'Upload complete!' });

    return {
      success: true,
      fileId: result.fileId,
      url: result.url,
      path: result.path,
      originalName: result.originalName,
      size: result.size,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    onProgress?.({ stage: 'error', progress: 0, message });
    return { success: false, error: message };
  }
}

/**
 * Sync model metadata to backend after IFC parsing
 * This stores the extracted model data for AI analysis
 */
export async function syncModelMetadata(
  modelData: ModelSyncData
): Promise<{ success: boolean; modelId?: string; error?: string }> {
  try {
    const csrfToken = getCSRFToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (csrfToken) {
      headers[CSRF_HEADER_NAME] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/api/models`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: modelData.name,
        projectId: modelData.projectId,
        format: 'IFC',
        fileUrl: modelData.fileUrl,
        fileSize: modelData.fileSize,
        metadata: modelData.metadata,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Sync failed' }));
      return { success: false, error: errorData.error || `Sync failed: ${response.status}` };
    }

    const result = await response.json();
    return { success: true, modelId: result.model?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    };
  }
}

/**
 * Upload model and sync metadata in one operation
 */
export async function uploadAndSyncModel(
  file: File,
  model: BIMModel,
  projectId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{
  success: boolean;
  uploadResult?: UploadResult;
  syncResult?: { modelId?: string };
  error?: string;
}> {
  // Step 1: Upload file
  const uploadResult = await uploadModelFile(file, projectId, (progress) => {
    // Scale upload progress to 0-70%
    onProgress?.({
      ...progress,
      progress: progress.stage === 'complete' ? 70 : Math.min(progress.progress * 0.7, 70),
    });
  });

  if (!uploadResult.success || !uploadResult.url) {
    return { success: false, uploadResult, error: uploadResult.error };
  }

  // Step 2: Sync metadata
  onProgress?.({ stage: 'processing', progress: 80, message: 'Syncing model metadata...' });

  const syncResult = await syncModelMetadata({
    name: model.name,
    fileUrl: uploadResult.url,
    fileSize: uploadResult.size || file.size,
    projectId,
    metadata: {
      ...model.metadata,
      elements: model.elements.slice(0, 1000).map((el) => ({
        id: el.id,
        name: el.name,
        type: el.type,
        level: el.level,
        material: el.material,
        properties: el.properties,
      })),
    },
  });

  if (syncResult.success) {
    onProgress?.({ stage: 'complete', progress: 100, message: 'Model uploaded and synced!' });
  } else {
    // Upload succeeded but sync failed - still return partial success
    onProgress?.({ stage: 'complete', progress: 100, message: 'Uploaded (sync failed)' });
  }

  return {
    success: true,
    uploadResult,
    syncResult,
    error: syncResult.success ? undefined : syncResult.error,
  };
}
