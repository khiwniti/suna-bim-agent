'use client';

/**
 * TravelAgentMessage - Main wrapper for travel-themed agent responses
 *
 * Combines all travel components into a cohesive message view:
 * - JourneyProgressBar (top)
 * - CaptainsLog (collapsible reasoning)
 * - DestinationsVisited (tool calls)
 * - DiscoveryCard(s) (artifacts/results)
 * - Main response content (bottom)
 *
 * This component replaces AgentResponseCard when travel theme is enabled.
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { JourneyProgressBar } from './JourneyProgressBar';
import { CaptainsLog } from './CaptainsLog';
import { DestinationsVisited, type DestinationInfo } from './DestinationsVisited';
import { DiscoveryCard, type DiscoveryCardProps } from './DiscoveryCard';
import { BIMMarkdown } from '../BIMMarkdown';
import {
  agentPhaseToTravelPhase,
  getRandomDestination,
  type TravelPhase,
} from '@/lib/travel-destinations';

// ============================================
// Types
// ============================================

export interface TravelToolCall {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  description?: string;
  duration?: number;
  result?: unknown;
  error?: string;
}

export interface TravelDiscovery {
  id: string;
  title: string;
  toolName?: string;
  type?: DiscoveryCardProps['type'];
  summary?: string;
  content?: string;
  metrics?: DiscoveryCardProps['metrics'];
}

export interface TravelAgentMessageProps {
  /** Main response content */
  content: string;
  /** Agent reasoning/thinking text */
  reasoning?: string;
  /** Next agent being routed to */
  nextAgent?: string;
  /** Task for the next agent */
  taskForAgent?: string;
  /** Tool calls */
  toolCalls?: TravelToolCall[];
  /** Discoveries/artifacts from tool results */
  discoveries?: TravelDiscovery[];
  /** Agent name */
  agentName?: string;
  /** Current agent phase */
  agentPhase?: string;
  /** Is currently streaming */
  isStreaming?: boolean;
  /** Timestamp */
  timestamp?: Date;
  /** Show progress bar */
  showProgressBar?: boolean;
  /** Optional className */
  className?: string;
}

// ============================================
// Destination name cache
// ============================================

const destinationNameCache = new Map<string, string>();

function getCachedDestinationName(toolId: string, toolName: string): string {
  if (!destinationNameCache.has(toolId)) {
    destinationNameCache.set(toolId, getRandomDestination(toolName));
  }
  return destinationNameCache.get(toolId)!;
}

// ============================================
// Animation variants
// ============================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 300,
    },
  },
};

// ============================================
// Sub-components
// ============================================

/**
 * Agent badge showing which specialist handled the request
 */
const AgentBadge = memo(function AgentBadge({ agentName }: { agentName: string }) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center gap-2 px-2 py-1"
    >
      <span className="text-sm">🤖</span>
      <span className="text-xs font-medium text-muted-foreground">
        {agentName.charAt(0).toUpperCase() + agentName.slice(1).replace(/_/g, ' ')} Agent
      </span>
    </motion.div>
  );
});

/**
 * Main content section with markdown
 */
const ContentSection = memo(function ContentSection({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  if (!content) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="py-2"
    >
      {/* Arrival indicator */}
      <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
        <span>🏝️</span>
        <span className="font-medium">Arrived at Destination</span>
      </div>

      {/* Response content */}
      <div className="text-sm leading-relaxed text-foreground">
        <BIMMarkdown content={content} />
        {isStreaming && (
          <motion.span
            className="inline-block w-2 h-4 bg-primary rounded-sm ml-1"
            animate={{ opacity: [1, 0.3] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
});

/**
 * Timestamp footer
 */
const TimestampFooter = memo(function TimestampFooter({
  timestamp,
}: {
  timestamp: Date;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="text-[10px] text-muted-foreground/50 pt-2"
    >
      {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </motion.div>
  );
});

// ============================================
// Main Component
// ============================================

export const TravelAgentMessage = memo(function TravelAgentMessage({
  content,
  reasoning,
  nextAgent,
  taskForAgent,
  toolCalls = [],
  discoveries = [],
  agentName,
  agentPhase,
  isStreaming = false,
  timestamp,
  showProgressBar = true,
  className,
}: TravelAgentMessageProps) {
  // Convert agent phase to travel phase
  const travelPhase: TravelPhase = useMemo(() => {
    return agentPhaseToTravelPhase(agentPhase);
  }, [agentPhase]);

  // Determine if journey is complete
  const isComplete = useMemo(() => {
    return !isStreaming && travelPhase === 'arriving' && content.length > 0;
  }, [isStreaming, travelPhase, content]);

  // Convert tool calls to destinations
  const destinations: DestinationInfo[] = useMemo(() => {
    return toolCalls.map((tc) => ({
      id: tc.id,
      toolName: tc.name,
      status: tc.status,
      description: tc.description,
      duration: tc.duration,
      result: tc.result,
      error: tc.error,
      destinationName: getCachedDestinationName(tc.id, tc.name),
    }));
  }, [toolCalls]);

  // Show progress bar if:
  // 1. showProgressBar prop is true (default)
  // 2. AND any of these conditions:
  //    - isStreaming is true (actively streaming response)
  //    - toolCalls exist (tools were called)
  //    - reasoning exists (agent is thinking)
  //    - agentPhase is set (agent is in some phase of execution)
  const shouldShowProgressBar = useMemo(() => {
    const hasActivity = isStreaming || toolCalls.length > 0 || !!reasoning || !!agentPhase;
    return showProgressBar && hasActivity;
  }, [showProgressBar, isStreaming, toolCalls.length, reasoning, agentPhase]);

  return (
    <div className={cn('relative', className)}>
      {/* Subtle left border accent */}
      <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent rounded-full" />

      <motion.div
        className="pl-4 space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Agent badge */}
        {agentName && <AgentBadge agentName={agentName} />}

        {/* Journey Progress Bar */}
        {shouldShowProgressBar && (
          <motion.div variants={itemVariants}>
            <JourneyProgressBar currentPhase={travelPhase} isComplete={isComplete} />
          </motion.div>
        )}

        {/* Captain's Log (Reasoning) */}
        {(reasoning || (isStreaming && (agentPhase === 'thinking' || agentPhase === 'reasoning'))) && (
          <motion.div variants={itemVariants}>
            <CaptainsLog
              reasoning={reasoning || ''}
              nextDestination={nextAgent}
              taskDescription={taskForAgent}
              isStreaming={isStreaming && !content}
              defaultExpanded={isStreaming}
            />
          </motion.div>
        )}

        {/* Destinations Visited (Tool Calls) */}
        {destinations.length > 0 && (
          <motion.div variants={itemVariants}>
            <DestinationsVisited destinations={destinations} />
          </motion.div>
        )}

        {/* Discoveries (Artifacts) */}
        {discoveries.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="text-sm">🎁</span>
              <span className="text-xs font-medium text-muted-foreground">
                Discoveries
              </span>
            </div>
            {discoveries.map((discovery) => (
              <DiscoveryCard
                key={discovery.id}
                id={discovery.id}
                title={discovery.title}
                toolName={discovery.toolName}
                type={discovery.type}
                summary={discovery.summary}
                content={discovery.content}
                metrics={discovery.metrics}
              />
            ))}
          </motion.div>
        )}

        {/* Main Response Content */}
        {content && <ContentSection content={content} isStreaming={isStreaming} />}

        {/* Timestamp */}
        {timestamp && <TimestampFooter timestamp={timestamp} />}
      </motion.div>
    </div>
  );
});

export default TravelAgentMessage;
