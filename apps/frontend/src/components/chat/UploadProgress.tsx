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

type PanelId = '3d-viewer' | 'boq-table' | 'carbon-dashboard' | 'clash-report' | 'floorplan-viewer' | 'document-editor' | string;

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

const PANEL_NAMES: Record<string, string> = {
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
        'bg-zinc-900/80 backdrop-blur-sm border-white/10',
        status === 'error' && 'border-red-500/50 bg-red-500/10',
        status === 'success' && 'border-[var(--carbon-primary)]/50 bg-[var(--carbon-primary)]/10'
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            status === 'uploading' && 'bg-[var(--carbon-primary)]/20 text-[var(--carbon-primary)]',
            status === 'success' && 'bg-[var(--carbon-primary)]/20 text-[var(--carbon-primary)]',
            status === 'error' && 'bg-red-500/20 text-red-500'
          )}
        >
          {status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'success' && <CheckCircle className="w-4 h-4" />}
          {status === 'error' && <AlertCircle className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-white/50 flex-shrink-0" />
            <span className="font-medium truncate text-white">{filename}</span>
          </div>
        </div>

        {status === 'uploading' && onCancel && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10"
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
            className="h-2 bg-white/10 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--carbon-primary)] to-[var(--carbon-accent)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-white/60">
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
          <span className="text-[var(--carbon-primary)]">
            Uploaded to {panelName}
          </span>
        )}

        {status === 'error' && (
          <div className="flex items-center justify-between w-full">
            <span className="text-red-400">{error || 'Upload failed'}</span>
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry} className="text-white/80 hover:text-white">
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
