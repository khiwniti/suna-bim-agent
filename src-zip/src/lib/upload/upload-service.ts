/**
 * Upload Service Module
 *
 * Handles file uploads to backend API.
 * Routes IFC files to /models/upload, other files to /files/upload.
 * Always routes to bim-agent-service backend (not Next.js API routes).
 */

import { detectFileType, getTargetPanel, type FileType } from './file-detector';
import type { PanelId } from '@/lib/panels/types';

const BIM_SERVICE_URL = process.env.BIM_AGENT_SERVICE_URL || 'http://localhost:8000';

/**
 * Upload result from backend
 */
export interface UploadResult {
  success: boolean;
  fileId?: string;
  filename?: string;
  fileType?: FileType;
  panelId?: PanelId;
  error?: string;
  /** Additional data from backend (model info, preview URL, etc.) */
  data?: Record<string, unknown>;
}

export interface UploadOptions {
  /** Progress callback (0-100) */
  onProgress?: (progress: number) => void;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

/**
 * Upload a file to the backend
 */
export async function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
  const { onProgress, signal } = options;
  const fileType = detectFileType(file);
  const targetPanel = getTargetPanel(fileType);

  const formData = new FormData();
  formData.append('file', file);

  // Route to bim-agent-service backend directly
  const endpoint = fileType === 'ifc' ? '/models/upload' : '/files/upload';
  const url = `${BIM_SERVICE_URL}${endpoint}`;

  try {
    // Use XMLHttpRequest for progress tracking
    if (onProgress) {
      return await uploadWithProgress(url, formData, fileType, targetPanel, onProgress, signal);
    }

    // Simple fetch for no progress tracking
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: errorText || `Upload failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return parseUploadResponse(data, fileType, targetPanel);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Upload cancelled' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload with XMLHttpRequest for progress tracking
 */
function uploadWithProgress(
  url: string,
  formData: FormData,
  fileType: FileType,
  targetPanel: PanelId | null,
  onProgress: (progress: number) => void,
  signal?: AbortSignal
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        resolve({ success: false, error: 'Upload cancelled' });
      });
    }

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(parseUploadResponse(data, fileType, targetPanel));
        } catch {
          resolve({ success: false, error: 'Invalid response from server' });
        }
      } else {
        resolve({
          success: false,
          error: xhr.responseText || `Upload failed with status ${xhr.status}`,
        });
      }
    });

    xhr.addEventListener('error', () => {
      resolve({ success: false, error: 'Network error during upload' });
    });

    xhr.addEventListener('abort', () => {
      resolve({ success: false, error: 'Upload cancelled' });
    });

    xhr.open('POST', url);

    xhr.send(formData);
  });
}

/**
 * Parse backend response into UploadResult
 */
function parseUploadResponse(
  data: Record<string, unknown>,
  fileType: FileType,
  targetPanel: PanelId | null
): UploadResult {
  // Handle IFC model response from bim-agent-service
  if (fileType === 'ifc' && data.model_id) {
    return {
      success: true,
      fileId: data.model_id as string,
      filename: data.name as string,
      fileType: 'ifc',
      panelId: '3d-viewer',
      data,
    };
  }

  // Handle general file response from bim-agent-service
  if (data.file_id) {
    return {
      success: true,
      fileId: data.file_id as string,
      filename: data.filename as string,
      fileType: (data.file_type as FileType) || fileType,
      panelId: (data.panel_hint as PanelId) || targetPanel || undefined,
      data,
    };
  }

  // Handle Supabase storage response (from /api/models/upload)
  if (data.fileId || data.path) {
    return {
      success: true,
      fileId: (data.fileId || data.path) as string,
      filename: data.originalName as string || 'unknown',
      fileType,
      panelId: targetPanel || undefined,
      data,
    };
  }

  // Fallback for unexpected response format
  return {
    success: true,
    fileId: (data.id || data.file_id || data.model_id) as string,
    fileType,
    panelId: targetPanel || undefined,
    data,
  };
}

