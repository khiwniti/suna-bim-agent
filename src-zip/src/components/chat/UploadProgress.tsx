'use client';

/**
 * UploadProgress Component
 *
 * Inline progress indicator for file uploads in chat.
 * Shows filename, progress bar, file size, and cancel button.
 */

import { X, Paperclip, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PanelId } from '@/lib/panels/types';

interface UploadProgressProps {
  filename: string;
  fileSize: number;
  progress: number;
  targetPanel: PanelId;
  status?: 'uploading' | 'success' | 'error';
  error?: string;
  onCancel?: () => void;
  onRetry?: () => void;
}

const PANEL_NAMES: Record<PanelId, string> = {
  '3d-viewer': '3D Viewer',
  'boq-table': 'BOQ Table',
  'carbon-dashboard': 'Carbon Dashboard',
  'clash-report': 'Clash Report',
  'floorplan-viewer': 'Floor Plan Viewer',
  'document-editor': 'Document Editor',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function UploadProgress({
  filename,
  fileSize,
  progress,
  targetPanel,
  status = 'uploading',
  error,
  onCancel,
  onRetry,
}: UploadProgressProps) {
  const panelName = PANEL_NAMES[targetPanel] || targetPanel;
  const uploadedBytes = Math.round((progress / 100) * fileSize);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'mx-4 mb-4 p-4 rounded-xl border',
        'bg-card/50 backdrop-blur-sm',
        status === 'error' && 'border-destructive/50 bg-destructive/5',
        status === 'success' && 'border-green-500/50 bg-green-500/5'
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            status === 'uploading' && 'bg-primary/10 text-primary',
            status === 'success' && 'bg-green-500/10 text-green-500',
            status === 'error' && 'bg-destructive/10 text-destructive'
          )}
        >
          {status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'success' && <CheckCircle className="w-4 h-4" />}
          {status === 'error' && <AlertCircle className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{filename}</span>
          </div>
        </div>

        {status === 'uploading' && onCancel && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={onCancel}
            aria-label="Cancel upload"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {status === 'uploading' && (
        <div className="mb-2">
          <div
            className="h-2 bg-muted rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {status === 'uploading' && (
          <>
            <span>
              {formatBytes(uploadedBytes)} / {formatBytes(fileSize)}
            </span>
            <span className="flex items-center gap-2">
              <span>{progress}%</span>
              <span className="text-xs">Opening {panelName}...</span>
            </span>
          </>
        )}

        {status === 'success' && (
          <span className="text-green-600">
            Uploaded to {panelName}
          </span>
        )}

        {status === 'error' && (
          <div className="flex items-center justify-between w-full">
            <span className="text-destructive">{error || 'Upload failed'}</span>
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry}>
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
