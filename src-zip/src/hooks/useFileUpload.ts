'use client';

/**
 * useFileUpload Hook - Core file upload orchestration
 *
 * Combines file-detector, upload-service, and stores to provide
 * a complete file upload experience with drag-drop support.
 *
 * Features:
 * - File type detection and validation
 * - Progress tracking with cancel support
 * - Auto panel activation after upload
 * - Drag-drop zone integration
 * - Chat store integration for file tracking
 */

import { useState, useCallback, useRef } from 'react';
import {
  detectFileType,
  getTargetPanelForFile,
  isFileSupported,
  getMaxFileSizeForFile,
  getAcceptString,
} from '@/lib/upload/file-detector';
import { uploadFile, type UploadResult } from '@/lib/upload/upload-service';
import { usePanelStore } from '@/stores/panel-store';
import { useChatStore } from '@/stores/chat-store';
import { useBIMStore } from '@/stores/bim-store';
import type { PanelId } from '@/lib/panels/types';

export interface UploadError {
  message: string;
  code?: string;
}

export interface UseFileUploadOptions {
  /** Auto-activate panel when upload completes */
  autoActivatePanel?: boolean;
  /** Max file size in MB (overrides per-type limits) */
  maxSizeMB?: number;
  /** Allowed file extensions */
  allowedExtensions?: string[];
  /** Callback when upload starts */
  onUploadStart?: (file: File, targetPanel: PanelId) => void;
  /** Callback when upload completes */
  onUploadComplete?: (result: UploadResult) => void;
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
  currentFile: { name: string; size: number; targetPanel: PanelId } | null;
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

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    autoActivatePanel = true,
    maxSizeMB,
    allowedExtensions,
    onUploadStart,
    onUploadComplete,
    onError,
  } = options;

  // State
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<{ name: string; size: number; targetPanel: PanelId } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Store access
  const activatePanel = usePanelStore((state) => state.activatePanel);
  const enableTab = usePanelStore((state) => state.enableTab);
  const setActiveTab = usePanelStore((state) => state.setActiveTab);
  const addUploadedFile = useChatStore((state) => state.addUploadedFile);
  const setCurrentModel = useBIMStore((state) => state.setCurrentModel);

  // BIM service URL
  const BIM_SERVICE_URL = process.env.NEXT_PUBLIC_BIM_AGENT_URL || process.env.BIM_AGENT_SERVICE_URL || 'http://localhost:8000';

  // Process a single file upload
  const processFile = useCallback(
    async (file: File) => {
      // Check allowed extensions if specified
      if (allowedExtensions && allowedExtensions.length > 0) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !allowedExtensions.includes(ext)) {
          const err = { message: `File extension not allowed: ${file.name}`, code: 'EXTENSION_NOT_ALLOWED' };
          setError(err.message);
          setUploadState('error');
          onError?.(err);
          return;
        }
      }

      // Validation - check if file type is supported
      if (!isFileSupported(file)) {
        const err = { message: `Unsupported file type: ${file.name}`, code: 'UNSUPPORTED_TYPE' };
        setError(err.message);
        setUploadState('error');
        onError?.(err);
        return;
      }

      // Check file size
      const maxSize = maxSizeMB ? maxSizeMB * 1024 * 1024 : getMaxFileSizeForFile(file);
      if (file.size > maxSize) {
        const maxMB = maxSizeMB || Math.round(maxSize / (1024 * 1024));
        const err = { message: `File too large: ${file.name} (max ${maxMB}MB)`, code: 'FILE_TOO_LARGE' };
        setError(err.message);
        setUploadState('error');
        onError?.(err);
        return;
      }

      // Get target panel
      const targetPanel = getTargetPanelForFile(file);
      if (!targetPanel) {
        const err = { message: `Cannot determine target panel for: ${file.name}`, code: 'NO_TARGET_PANEL' };
        setError(err.message);
        setUploadState('error');
        onError?.(err);
        return;
      }

      // Start upload
      setUploadState('uploading');
      setProgress(0);
      setError(null);
      setCurrentFile({ name: file.name, size: file.size, targetPanel });
      onUploadStart?.(file, targetPanel);

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        const result = await uploadFile(file, {
          onProgress: setProgress,
          signal: abortControllerRef.current.signal,
        });

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        setUploadState('success');
        setProgress(100);

        // Add to chat store
        const fileType = detectFileType(file);
        addUploadedFile({
          id: crypto.randomUUID(),
          filename: file.name,
          fileType,
          panelId: targetPanel,
          uploadedAt: new Date(),
          backendId: result.fileId || '',
        });

        // Auto-activate panel
        if (autoActivatePanel) {
          activatePanel(targetPanel, true);
          enableTab(targetPanel);
          setActiveTab(targetPanel);
        }

        // For IFC files, load the model into the viewer
        // We use the original file blob URL since backend mock parser doesn't save files
        if (fileType === 'ifc' && result.fileId) {
          try {
            // Create a blob URL from the original file for local loading
            // This works because we still have the File object in scope
            const blobUrl = URL.createObjectURL(file);
            
            const bimModel = {
              id: result.fileId,
              name: result.filename || file.name,
              createdAt: new Date(),
              updatedAt: new Date(),
              source: 'ifc' as const,
              fileUrl: blobUrl,
              elements: [],
              levels: [],
              metadata: {
                elementCount: 0,
                levelCount: 0,
                boundingBox: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
                units: 'metric' as const,
              },
            };
            setCurrentModel(bimModel);
          } catch (err) {
            console.error('Failed to load model into viewer:', err);
          }
        }

        onUploadComplete?.(result);

        // Reset after short delay
        setTimeout(() => {
          setUploadState('idle');
          setCurrentFile(null);
          setProgress(0);
        }, 2000);
      } catch (err) {
        // Handle cancellation
        if (err instanceof Error && err.message === 'Upload cancelled') {
          setUploadState('idle');
          setCurrentFile(null);
          setProgress(0);
          return;
        }

        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMsg);
        setUploadState('error');
        onError?.({ message: errorMsg });
      } finally {
        abortControllerRef.current = null;
      }
    },
    [autoActivatePanel, maxSizeMB, allowedExtensions, onUploadStart, onUploadComplete, onError, activatePanel, enableTab, setActiveTab, addUploadedFile]
  );

  // Open file picker
  const openFilePicker = useCallback(() => {
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      input.accept = allowedExtensions?.map((ext) => `.${ext}`).join(',') || getAcceptString();
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
  }, [allowedExtensions, processFile]);

  // Handle dropped files
  const handleDrop = useCallback((files: FileList) => {
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  // Cancel upload
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
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

