/**
 * File Type Detection Module
 *
 * Detects file types by extension (primary) and MIME type (fallback).
 * Maps file types to target panels for auto-activation.
 */

import type { PanelId } from '@/lib/panels/types';

/**
 * Supported file types
 */
export type FileType = 'ifc' | 'pdf' | 'spreadsheet' | 'image' | 'cad' | 'unknown';

/**
 * File type configuration
 */
export interface FileTypeConfig {
  extensions: string[];
  mimeTypes: string[];
  panelId: PanelId;
  maxSizeMB: number;
}

/**
 * File type to panel mapping configuration
 */
export const FILE_TYPE_CONFIG: Record<Exclude<FileType, 'unknown'>, FileTypeConfig> = {
  ifc: {
    extensions: ['.ifc', '.ifczip'],
    mimeTypes: ['application/x-step', 'application/octet-stream'],
    panelId: '3d-viewer',
    maxSizeMB: 100,
  },
  pdf: {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    panelId: 'document-editor',
    maxSizeMB: 20,
  },
  spreadsheet: {
    extensions: ['.xlsx', '.xls', '.csv'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ],
    panelId: 'boq-table',
    maxSizeMB: 10,
  },
  image: {
    extensions: ['.png', '.jpg', '.jpeg', '.webp'],
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    panelId: 'floorplan-viewer',
    maxSizeMB: 10,
  },
  cad: {
    extensions: ['.dwg', '.dxf', '.rvt', '.rfa'],
    mimeTypes: ['application/acad', 'application/x-autocad'],
    panelId: 'floorplan-viewer',
    maxSizeMB: 50,
  },
};

/**
 * Get file extension from filename (lowercase, with dot)
 */
function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Detect file type from File object
 * Uses extension first, then MIME type fallback
 */
export function detectFileType(file: File): FileType {
  const extension = getExtension(file.name);

  // Check by extension first (more reliable)
  for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if (config.extensions.includes(extension)) {
      return type as FileType;
    }
  }

  // Fallback to MIME type
  for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if (config.mimeTypes.includes(file.type)) {
      return type as FileType;
    }
  }

  return 'unknown';
}

/**
 * Get target panel ID for a file type
 */
export function getTargetPanel(fileType: FileType): PanelId | null {
  if (fileType === 'unknown') return null;
  return FILE_TYPE_CONFIG[fileType]?.panelId ?? null;
}

/**
 * Get target panel ID directly from a File object
 */
export function getTargetPanelForFile(file: File): PanelId | null {
  const fileType = detectFileType(file);
  return getTargetPanel(fileType);
}

/**
 * Check if a file is supported for upload
 */
export function isFileSupported(file: File): boolean {
  return detectFileType(file) !== 'unknown';
}

/**
 * Get max file size in bytes for a file type
 */
export function getMaxFileSize(fileType: FileType): number {
  if (fileType === 'unknown') return 0;
  return (FILE_TYPE_CONFIG[fileType]?.maxSizeMB ?? 0) * 1024 * 1024;
}

/**
 * Get max file size in bytes for a File object
 */
export function getMaxFileSizeForFile(file: File): number {
  const fileType = detectFileType(file);
  return getMaxFileSize(fileType);
}

/**
 * Validate file size against limits
 */
export function validateFileSize(file: File): { valid: boolean; error?: string } {
  const fileType = detectFileType(file);
  if (fileType === 'unknown') {
    return { valid: false, error: 'Unsupported file type' };
  }

  const maxSize = getMaxFileSize(fileType);
  if (file.size > maxSize) {
    const maxMB = FILE_TYPE_CONFIG[fileType].maxSizeMB;
    return { valid: false, error: `File exceeds ${maxMB}MB limit` };
  }

  return { valid: true };
}

/**
 * Get accept string for file input
 */
export function getAcceptString(): string {
  const extensions: string[] = [];
  for (const config of Object.values(FILE_TYPE_CONFIG)) {
    extensions.push(...config.extensions);
  }
  return extensions.join(',');
}

