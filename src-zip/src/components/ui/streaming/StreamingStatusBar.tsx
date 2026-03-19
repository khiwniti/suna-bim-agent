'use client';

/**
 * StreamingStatusBar Component
 *
 * Displays streaming metrics and controls during AI response generation.
 * Shows current phase, token metrics, and playback controls in a compact
 * horizontal layout suitable for the bottom of the chat interface.
 *
 * @example
 * ```tsx
 * <StreamingStatusBar
 *   isStreaming={true}
 *   phase="responding"
 *   tokensPerSecond={42}
 *   totalTokens={1500}
 *   estimatedCompletion={5}
 *   onPause={() => console.log('Paused')}
 *   onStop={() => console.log('Stopped')}
 * />
 * ```
 */

import { memo } from 'react';
import {
  Circle,
  Brain,
  Lightbulb,
  Wrench,
  Settings,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Pause,
  Play,
  Square,
} from 'lucide-react';
import type { AgentPhase } from '@/lib/streaming';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';

// ============================================================================
// Types
// ============================================================================

export interface StreamingStatusBarProps {
  /** Whether streaming is currently active */
  isStreaming: boolean;
  /** Current phase of the agent */
  phase: AgentPhase;
  /** Current tokens per second rate */
  tokensPerSecond?: number;
  /** Total tokens generated so far */
  totalTokens?: number;
  /** Estimated seconds to completion */
  estimatedCompletion?: number;
  /** Callback when pause is clicked */
  onPause?: () => void;
  /** Callback when resume is clicked */
  onResume?: () => void;
  /** Callback when stop is clicked */
  onStop?: () => void;
}

// ============================================================================
// Phase Configuration
// ============================================================================

interface PhaseConfig {
  label: string;
  icon: typeof Circle;
  colorClass: string;
  animate?: boolean;
}

const PHASE_CONFIG: Record<AgentPhase, PhaseConfig> = {
  idle: {
    label: 'Idle',
    icon: Circle,
    colorClass: 'text-muted-foreground',
  },
  thinking: {
    label: 'Thinking',
    icon: Brain,
    colorClass: 'text-yellow-500 dark:text-yellow-400',
    animate: true,
  },
  reasoning: {
    label: 'Reasoning',
    icon: Lightbulb,
    colorClass: 'text-blue-500 dark:text-blue-400',
    animate: true,
  },
  tool_calling: {
    label: 'Calling Tool',
    icon: Wrench,
    colorClass: 'text-purple-500 dark:text-purple-400',
  },
  tool_executing: {
    label: 'Executing',
    icon: Settings,
    colorClass: 'text-purple-500 dark:text-purple-400',
    animate: true,
  },
  synthesizing: {
    label: 'Synthesizing',
    icon: Sparkles,
    colorClass: 'text-orange-500 dark:text-orange-400',
    animate: true,
  },
  responding: {
    label: 'Responding',
    icon: MessageSquare,
    colorClass: 'text-green-500 dark:text-green-400',
    animate: true,
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    colorClass: 'text-red-500 dark:text-red-400',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format a number with comma separators
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

// ============================================================================
// Component
// ============================================================================

export const StreamingStatusBar = memo(function StreamingStatusBar({
  isStreaming,
  phase,
  tokensPerSecond,
  totalTokens,
  estimatedCompletion,
  onPause,
  onResume,
  onStop,
}: StreamingStatusBarProps) {
  const { t } = useTranslation();

  // Don't render if not streaming
  if (!isStreaming) {
    return null;
  }

  const phaseConfig = PHASE_CONFIG[phase];
  const IconComponent = phaseConfig.icon;

  return (
    <div
      data-testid="streaming-status-bar"
      role="status"
      aria-live="polite"
      aria-label={`AI is ${phaseConfig.label.toLowerCase()}`}
      className={cn(
        'flex items-center gap-4 px-4 py-2',
        'bg-background/80 backdrop-blur-sm',
        'border-t border-border/50',
        'text-sm'
      )}
    >
      {/* Phase Indicator */}
      <div
        data-testid="phase-indicator"
        className={cn('flex items-center gap-2', phaseConfig.colorClass)}
      >
        <span data-testid="phase-icon" className="flex-shrink-0">
          <IconComponent
            className={cn(
              'w-4 h-4',
              phaseConfig.animate && phase === 'tool_executing' && 'animate-spin',
              phaseConfig.animate && phase !== 'tool_executing' && 'animate-pulse'
            )}
          />
        </span>
        <span data-testid="phase-label" className="font-medium">
          {phaseConfig.label}
        </span>
      </div>

      {/* Separator */}
      <div className="h-4 w-px bg-border/50" />

      {/* Token Metrics */}
      <div className="flex items-center gap-4 text-muted-foreground">
        {tokensPerSecond !== undefined && (
          <span className="tabular-nums">{tokensPerSecond} tok/s</span>
        )}
        {totalTokens !== undefined && (
          <span className="tabular-nums">{formatNumber(totalTokens)} tokens</span>
        )}
        {estimatedCompletion !== undefined && (
          <span className="text-xs opacity-75">~{estimatedCompletion}s remaining</span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Controls */}
      <div className="flex items-center gap-2">
        {onPause && (
          <button
            data-testid="pause-button"
            onClick={onPause}
            className={cn(
              'p-1.5 rounded-md',
              'hover:bg-muted/50 transition-colors',
              'text-muted-foreground hover:text-foreground'
            )}
            aria-label={t('streaming.pauseStreaming')}
          >
            <Pause className="w-4 h-4" />
          </button>
        )}
        {onResume && (
          <button
            data-testid="resume-button"
            onClick={onResume}
            className={cn(
              'p-1.5 rounded-md',
              'hover:bg-muted/50 transition-colors',
              'text-muted-foreground hover:text-foreground'
            )}
            aria-label={t('streaming.resumeStreaming')}
          >
            <Play className="w-4 h-4" />
          </button>
        )}
        {onStop && (
          <button
            data-testid="stop-button"
            onClick={onStop}
            className={cn(
              'p-1.5 rounded-md',
              'hover:bg-destructive/10 transition-colors',
              'text-muted-foreground hover:text-destructive'
            )}
            aria-label={t('streaming.stopStreaming')}
          >
            <Square className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});
