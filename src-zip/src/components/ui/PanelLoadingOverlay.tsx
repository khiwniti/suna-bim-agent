'use client';

/**
 * PanelLoadingOverlay - Loading state overlay for panels
 *
 * Shows a semi-transparent overlay with spinner during tool execution.
 * Positioned absolute within panel container.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface PanelLoadingOverlayProps {
  /** Whether the loading overlay should be visible */
  isLoading: boolean;
  /** Optional loading message to display */
  message?: string;
}

export function PanelLoadingOverlay({ isLoading, message }: PanelLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label={message || 'Loading'}
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            {message && (
              <p className="text-sm text-muted-foreground font-medium">{message}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PanelLoadingOverlay;
