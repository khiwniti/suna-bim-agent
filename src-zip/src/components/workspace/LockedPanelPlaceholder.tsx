'use client';

/**
 * LockedPanelPlaceholder
 *
 * Displays a locked state when users click on disabled tabs.
 * Prompts users to upload an IFC model or ask the BIM Agent.
 */

import { Lock, Upload, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface LockedPanelPlaceholderProps {
  /** Name of the panel that is locked (e.g., "3D Viewer", "Carbon Dashboard") */
  panelName: string;
  /** Handler for "Upload IFC" button click */
  onUploadClick?: () => void;
  /** Handler for "Ask Agent" button click */
  onAskAgentClick?: () => void;
  /** Optional additional styling */
  className?: string;
}

export function LockedPanelPlaceholder({
  panelName,
  onUploadClick,
  onAskAgentClick,
  className,
}: LockedPanelPlaceholderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center h-full w-full bg-muted/30 p-8 text-center',
        className
      )}
    >
      {/* Lock Icon */}
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
        <Lock
          className="w-8 h-8 text-muted-foreground"
          data-testid="lock-icon"
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-3">Panel Locked</h3>

      {/* Description */}
      <p className="text-muted-foreground mb-6 max-w-sm">
        Upload an IFC model or ask the BIM Agent to analyze your building to unlock the{' '}
        {panelName}.
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onUploadClick}>
          <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
          Upload IFC
        </Button>
        <Button variant="primary" onClick={onAskAgentClick}>
          <MessageSquare className="w-4 h-4 mr-2" aria-hidden="true" />
          Ask Agent
        </Button>
      </div>
    </div>
  );
}

export default LockedPanelPlaceholder;
