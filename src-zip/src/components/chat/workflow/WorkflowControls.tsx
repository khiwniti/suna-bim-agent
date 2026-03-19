'use client';

/**
 * WorkflowControls - Zoom, collapse, and filter controls for workflow timeline
 */

import {
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewMode } from './types';

export interface WorkflowControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showAbandoned: boolean;
  onToggleAbandoned: () => void;
  isAllExpanded: boolean;
  onToggleAllExpanded: () => void;
  className?: string;
}

export function WorkflowControls({
  viewMode,
  onViewModeChange,
  showAbandoned,
  onToggleAbandoned,
  isAllExpanded,
  onToggleAllExpanded,
  className,
}: WorkflowControlsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border',
        className
      )}
    >
      {/* View Mode Toggle */}
      <div className="flex items-center rounded-md bg-background">
        <button
          onClick={() => onViewModeChange('simple')}
          className={cn(
            'px-2 py-1 text-xs rounded-l-md transition-colors',
            viewMode === 'simple'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          )}
        >
          Simple
        </button>
        <button
          onClick={() => onViewModeChange('detailed')}
          className={cn(
            'px-2 py-1 text-xs rounded-r-md transition-colors',
            viewMode === 'detailed'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          )}
        >
          Detailed
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-border mx-1" />

      {/* Toggle All Expanded */}
      <button
        onClick={onToggleAllExpanded}
        className={cn(
          'p-1.5 rounded-md transition-colors hover:bg-muted',
          'text-muted-foreground hover:text-foreground'
        )}
        title={isAllExpanded ? 'Collapse all' : 'Expand all'}
      >
        {isAllExpanded ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </button>

      {/* Show/Hide Abandoned Paths */}
      <button
        onClick={onToggleAbandoned}
        className={cn(
          'p-1.5 rounded-md transition-colors hover:bg-muted',
          showAbandoned
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title={showAbandoned ? 'Hide abandoned paths' : 'Show abandoned paths'}
      >
        {showAbandoned ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export default WorkflowControls;
