'use client';

/**
 * useFileUpload Hook - Stub for Landing Page
 *
 * Simplified version of the file upload hook for the landing page.
 * Does not include full upload functionality - just provides the interface.
 */

import { useState, useCallback, useRef } from 'react';

export interface UploadError {
  message: string;
  code?: string;
}

export interface UseFileUploadOptions {
  /** Auto-activate panel when upload completes */
  autoActivatePanel?: boolean;
  /** Max file size in MB */
  maxSizeMB?: number;
  /** Allowed file extensions */
  allowedExtensions?: string[];
  /** Callback when upload starts */
  onUploadStart?: (file: File, targetPanel: string) => void;
  /** Callback when upload completes */
  onUploadComplete?: (result: { success: boolean; filename?: string }) => void;
  /** Callback on error */
  onError?: (error: UploadError) => void;
}

export interface UseFileUploadReturn {
  /** Trigger file picker dialog */
  openFilePicker: () => void;
  /** Handle dropped files */
  handleDrop: (files: FileList) => void;
  /** Current upload state */
  uploadState: 'idle' | 'uploading' | 'success' | 'error';
  /** Upload progress (0-100) */
  progress: number;
  /** Currently uploading file info */
  currentFile: { name: string; size: number; targetPanel: string } | null;
  /** Last error message */
  error: string | null;
  /** Cancel current upload */
  cancel: () => void;
  /** Props to spread on drop zone element */
  dropZoneProps: {
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  /** Whether drag is active over drop zone */
  isDragActive: boolean;
}

const ACCEPTED_EXTENSIONS = ['.ifc', '.dwg', '.dxf', '.pdf', '.xlsx', '.xls', '.csv'];
const MAX_FILE_SIZE_MB = 100;

/**
 * Detect target panel based on file extension
 */
function getTargetPanel(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'ifc':
      return '3d-viewer';
    case 'dwg':
    case 'dxf':
      return 'floorplan-viewer';
    case 'pdf':
      return 'document-editor';
    case 'xlsx':
    case 'xls':
    case 'csv':
      return 'boq-table';
    default:
      return 'document-editor';
  }
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    maxSizeMB = MAX_FILE_SIZE_MB,
    allowedExtensions,
    onUploadStart,
    onUploadComplete,
    onError,
  } = options;

  // State
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<{ name: string; size: number; targetPanel: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Process a single file
  const processFile = useCallback(
    async (file: File) => {
      // Check file extension
      const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
      const validExtensions = allowedExtensions?.map(e => e.startsWith('.') ? e : `.${e}`) || ACCEPTED_EXTENSIONS;

      if (!validExtensions.includes(ext)) {
        const err = { message: `Unsupported file type: ${ext}`, code: 'UNSUPPORTED_TYPE' };
        setError(err.message);
        setUploadState('error');
        onError?.(err);
        return;
      }

      // Check file size
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        const err = { message: `File too large: max ${maxSizeMB}MB`, code: 'FILE_TOO_LARGE' };
        setError(err.message);
        setUploadState('error');
        onError?.(err);
        return;
      }

      const targetPanel = getTargetPanel(file.name);

      // Start upload simulation
      setUploadState('uploading');
      setProgress(0);
      setError(null);
      setCurrentFile({ name: file.name, size: file.size, targetPanel });
      onUploadStart?.(file, targetPanel);

      // Simulate upload progress
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += Math.random() * 30 + 10;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(progressInterval);

          setProgress(100);
          setUploadState('success');
          onUploadComplete?.({ success: true, filename: file.name });

          // Reset after a delay
          setTimeout(() => {
            setUploadState('idle');
            setCurrentFile(null);
            setProgress(0);
          }, 2000);
        } else {
          setProgress(Math.round(currentProgress));
        }
      }, 200);
    },
    [maxSizeMB, allowedExtensions, onUploadStart, onUploadComplete, onError]
  );

  // Open file picker
  const openFilePicker = useCallback(() => {
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      input.accept = ACCEPTED_EXTENSIONS.join(',');
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          processFile(files[0]);
        }
        input.value = '';
      };
      fileInputRef.current = input;
      document.body.appendChild(input);
    }
    fileInputRef.current.click();
  }, [processFile]);

  // Handle dropped files
  const handleDrop = useCallback((files: FileList) => {
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  // Cancel upload (stub - would abort actual upload)
  const cancel = useCallback(() => {
    setUploadState('idle');
    setCurrentFile(null);
    setProgress(0);
  }, []);

  // Drag-drop event handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    handleDrop(e.dataTransfer.files);
  }, [handleDrop]);

  return {
    openFilePicker,
    handleDrop,
    uploadState,
    progress,
    currentFile,
    error,
    cancel,
    dropZoneProps: { onDragOver, onDragLeave, onDrop },
    isDragActive,
  };
}
