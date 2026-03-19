/**
 * Firebase Storage Service
 *
 * File upload and management for IFC models and reports.
 * Includes progress tracking and URL generation.
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  UploadTask,
  StorageReference,
} from 'firebase/storage';
import { storage } from './config';

// ============================================
// Types
// ============================================

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
  state: 'running' | 'paused' | 'success' | 'error';
}

export interface UploadResult {
  success: boolean;
  downloadUrl?: string;
  path?: string;
  error?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  contentType: string;
  createdAt: Date;
  downloadUrl: string;
  path: string;
}

// ============================================
// Storage Paths
// ============================================

const PATHS = {
  models: (userId: string, projectId: string) =>
    `users/${userId}/projects/${projectId}/models`,
  reports: (userId: string, projectId: string) =>
    `users/${userId}/projects/${projectId}/reports`,
  thumbnails: (userId: string, projectId: string) =>
    `users/${userId}/projects/${projectId}/thumbnails`,
  avatars: (userId: string) => `users/${userId}/avatar`,
};

// ============================================
// Upload Functions
// ============================================

/**
 * Upload a file with progress tracking
 */
export function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const storageRef = ref(storage, path);
    const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          progress,
          state: snapshot.state as UploadProgress['state'],
        });
      },
      (error) => {
        console.error('[Storage] Upload error:', error);
        resolve({
          success: false,
          error: error.message,
        });
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('[Storage] Upload complete:', path);
          resolve({
            success: true,
            downloadUrl,
            path,
          });
        } catch (error) {
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get download URL',
          });
        }
      }
    );
  });
}

/**
 * Upload an IFC model
 */
export async function uploadModel(
  userId: string,
  projectId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  // Validate file type
  const validTypes = ['.ifc', '.ifczip', '.ifcxml'];
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

  if (!validTypes.includes(ext)) {
    return {
      success: false,
      error: `Invalid file type. Supported types: ${validTypes.join(', ')}`,
    };
  }

  // Validate file size (max 100MB)
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      success: false,
      error: 'File too large. Maximum size is 100MB.',
    };
  }

  const path = `${PATHS.models(userId, projectId)}/${Date.now()}_${file.name}`;
  return uploadFile(file, path, onProgress);
}

/**
 * Upload a report PDF
 */
export async function uploadReport(
  userId: string,
  projectId: string,
  file: File,
  reportName: string
): Promise<UploadResult> {
  const path = `${PATHS.reports(userId, projectId)}/${Date.now()}_${reportName}.pdf`;
  return uploadFile(file, path);
}

/**
 * Upload a project thumbnail
 */
export async function uploadThumbnail(
  userId: string,
  projectId: string,
  file: File
): Promise<UploadResult> {
  // Validate image type
  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      error: 'Invalid file type. Only images are allowed.',
    };
  }

  const path = `${PATHS.thumbnails(userId, projectId)}/thumbnail.${file.type.split('/')[1]}`;
  return uploadFile(file, path);
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<UploadResult> {
  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      error: 'Invalid file type. Only images are allowed.',
    };
  }

  // Max 5MB for avatars
  if (file.size > 5 * 1024 * 1024) {
    return {
      success: false,
      error: 'Image too large. Maximum size is 5MB.',
    };
  }

  const path = `${PATHS.avatars(userId)}.${file.type.split('/')[1]}`;
  return uploadFile(file, path);
}

// ============================================
// Download Functions
// ============================================

/**
 * Get download URL for a file
 */
export async function getFileUrl(path: string): Promise<string | null> {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('[Storage] Error getting URL:', error);
    return null;
  }
}

// ============================================
// Delete Functions
// ============================================

/**
 * Delete a file
 */
export async function deleteFile(path: string): Promise<boolean> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    console.log('[Storage] File deleted:', path);
    return true;
  } catch (error) {
    console.error('[Storage] Delete error:', error);
    return false;
  }
}

/**
 * Delete all files in a folder
 */
export async function deleteFolder(path: string): Promise<number> {
  try {
    const folderRef = ref(storage, path);
    const listResult = await listAll(folderRef);

    let deletedCount = 0;
    for (const itemRef of listResult.items) {
      await deleteObject(itemRef);
      deletedCount++;
    }

    // Recursively delete subfolders
    for (const prefixRef of listResult.prefixes) {
      deletedCount += await deleteFolder(prefixRef.fullPath);
    }

    console.log(`[Storage] Deleted ${deletedCount} files from:`, path);
    return deletedCount;
  } catch (error) {
    console.error('[Storage] Folder delete error:', error);
    return 0;
  }
}

// ============================================
// List Functions
// ============================================

/**
 * List files in a folder with metadata
 */
export async function listFiles(path: string): Promise<FileMetadata[]> {
  try {
    const folderRef = ref(storage, path);
    const listResult = await listAll(folderRef);

    const files: FileMetadata[] = [];

    for (const itemRef of listResult.items) {
      try {
        const metadata = await getMetadata(itemRef);
        const downloadUrl = await getDownloadURL(itemRef);

        files.push({
          name: metadata.name,
          size: metadata.size,
          contentType: metadata.contentType || 'application/octet-stream',
          createdAt: new Date(metadata.timeCreated),
          downloadUrl,
          path: itemRef.fullPath,
        });
      } catch (e) {
        console.error('[Storage] Error getting file metadata:', e);
      }
    }

    return files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('[Storage] List error:', error);
    return [];
  }
}

/**
 * List project models
 */
export async function listProjectModels(
  userId: string,
  projectId: string
): Promise<FileMetadata[]> {
  return listFiles(PATHS.models(userId, projectId));
}

/**
 * List project reports
 */
export async function listProjectReports(
  userId: string,
  projectId: string
): Promise<FileMetadata[]> {
  return listFiles(PATHS.reports(userId, projectId));
}

// ============================================
// Export
// ============================================

export { storage };

export default {
  uploadFile,
  uploadModel,
  uploadReport,
  uploadThumbnail,
  uploadAvatar,
  getFileUrl,
  deleteFile,
  deleteFolder,
  listFiles,
  listProjectModels,
  listProjectReports,
};
