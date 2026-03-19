'use client';

/**
 * AgentResponseCard - Beautiful AI response visualization
 *
 * Separates and displays:
 * - Reasoning/Thinking (collapsible, subtle)
 * - Tool Calls (with status animations)
 * - Agent Routing (which specialist handled)
 * - Final Response (main content)
 *
 * Design: Clean, no background, minimal shadows, smooth animations
 * Inspired by: Manus.im, Devin.ai, Claude Artifacts
 */

import { useState, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Wrench,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Building2,
  Leaf,
  Zap,
  Shield,
  Calculator,
  Users,
  Settings,
  FileCode,
  Eye,
  Cpu,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BIMMarkdown } from './BIMMarkdown';
import { useTranslation } from '@/i18n/provider';
import type { ViewportCommand } from '@/types/bim';

// ============================================
// Types
// ============================================

export type { ViewportCommand };

export interface AgentReasoning {
  reasoning: string;
  nextAgent?: string;
  taskForAgent?: string;
  userResponse?: string;
}

export interface ToolCallInfo {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  description?: string;
  duration?: number;
  result?: unknown;
}

export interface AgentResponseCardProps {
  /** Raw response that may contain reasoning JSON */
  content: string;
  /** Parsed reasoning block */
  reasoning?: AgentReasoning;
  /** Tool calls made during response */
  toolCalls?: ToolCallInfo[];
  /** Which agent handled this */
  agentName?: string;
  /** Viewport commands for 3D viewer */
  viewportCommands?: ViewportCommand[];
  /** Is the response still streaming */
  isStreaming?: boolean;
  /** Timestamp */
  timestamp?: Date;
  /** Custom className */
  className?: string;
  /** Current agent execution phase */
  agentPhase?: 'idle' | 'thinking' | 'reasoning' | 'tool_calling' | 'tool_executing' | 'synthesizing' | 'responding';
  /** Current task description */
  currentTask?: string;
}

// ============================================
// Agent Icons Mapping
// ============================================

const AGENT_ICONS: Record<string, typeof Bot> = {
  supervisor: Bot,
  architectural: Building2,
  structural: Building2,
  mep: Settings,
  sustainability: Leaf,
  cost_estimator: Calculator,
  code_compliance: Shield,
  clash_detection: Zap,
  coordination: Users,
  facility_manager: Building2,
  maintenance: Wrench,
  asset_tracker: FileCode,
  planner: Cpu,
};

const AGENT_COLORS: Record<string, string> = {
  supervisor: 'text-blue-500',
  architectural: 'text-amber-500',
  structural: 'text-orange-500',
  mep: 'text-cyan-500',
  sustainability: 'text-green-500',
  cost_estimator: 'text-purple-500',
  code_compliance: 'text-red-500',
  clash_detection: 'text-yellow-500',
  coordination: 'text-indigo-500',
  facility_manager: 'text-teal-500',
  maintenance: 'text-slate-500',
  asset_tracker: 'text-pink-500',
  planner: 'text-violet-500',
};

// ============================================
// Animation Variants
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

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
};

// ============================================
// Sub-components
// ============================================

/**
 * Thinking/Reasoning Section - Collapsible
 */
const ThinkingSection = memo(function ThinkingSection({
  reasoning,
  nextAgent,
  taskForAgent,
  isStreaming,
  agentPhase,
  currentTask,
}: {
  reasoning: string;
  nextAgent?: string;
  taskForAgent?: string;
  isStreaming?: boolean;
  agentPhase?: string;
  currentTask?: string;
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Show section if we have reasoning OR if we're in a thinking/reasoning phase
  const showSection = reasoning || (isStreaming && (agentPhase === 'thinking' || agentPhase === 'reasoning'));

  if (!showSection) return null;

  // Determine label based on phase
  const phaseLabel = agentPhase === 'thinking'
    ? t('chat.thinking')
    : agentPhase === 'reasoning'
    ? t('chat.reasoning') || 'Reasoning'
    : agentPhase === 'tool_executing'
    ? t('chat.executing') || 'Executing'
    : t('chat.thinking');

  return (
    <motion.div variants={itemVariants} className="group">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 w-full py-2 px-1',
          'text-xs text-muted-foreground/70 hover:text-muted-foreground',
          'transition-colors duration-200'
        )}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-3 h-3" />
        </motion.div>

        <Brain className={cn('w-3.5 h-3.5', isStreaming && 'animate-pulse')} />

        <span className="font-medium">{phaseLabel}</span>

        {/* Show current task if available */}
        {currentTask && isStreaming && (
          <span className="text-[10px] text-muted-foreground/60 truncate max-w-[200px]">
            — {currentTask}
          </span>
        )}

        {isStreaming && (
          <motion.span
            className="flex gap-0.5 ml-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1 h-1 rounded-full bg-current"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.span>
        )}

        {nextAgent && (
          <span className="ml-auto flex items-center gap-1 text-[10px] opacity-60">
            <ArrowRight className="w-2.5 h-2.5" />
            {nextAgent.toUpperCase()}
          </span>
        )}
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={expandVariants}
            className="overflow-hidden"
          >
            <div className="pl-6 pr-2 pb-3 space-y-2">
              {/* Reasoning text */}
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                {reasoning}
              </p>

              {/* Task for agent */}
              {taskForAgent && (
                <div className="flex items-start gap-2 p-2 rounded-md bg-muted/30">
                  <Sparkles className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">{taskForAgent}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

/**
 * Tool Call Chip - Single tool visualization with animated status transitions
 */
const ToolCallChip = memo(function ToolCallChip({
  tool,
  index,
}: {
  tool: ToolCallInfo;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusIcon = {
    pending: <Loader2 className="w-3 h-3 text-muted-foreground" />,
    running: <Loader2 className="w-3 h-3 text-primary animate-spin" />,
    success: <CheckCircle2 className="w-3 h-3 text-green-500" />,
    error: <XCircle className="w-3 h-3 text-red-500" />,
  };

  const statusBorder = {
    pending: 'border-muted-foreground/20',
    running: 'border-primary/40 bg-primary/5',
    success: 'border-green-500/30 bg-green-500/5',
    error: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <motion.div
      key={`${tool.id}-${tool.status}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: tool.status === 'success' ? [1, 1.05, 1] : 1,
      }}
      transition={{
        delay: index * 0.05,
        scale: { duration: 0.3 }
      }}
      layout
    >
      <button
        onClick={() => tool.result && setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 px-2.5 py-1.5 rounded-full',
          'text-xs border transition-all duration-300',
          statusBorder[tool.status],
          'hover:bg-muted/30',
          tool.result ? 'cursor-pointer' : ''
        )}
      >
        <motion.div
          key={tool.status}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {statusIcon[tool.status]}
        </motion.div>
        <span className="text-muted-foreground">{tool.name}</span>
        {tool.duration !== undefined && tool.status !== 'running' && (
          <span className="text-[10px] text-muted-foreground/60">
            {tool.duration < 1000 ? `${tool.duration}ms` : `${(tool.duration / 1000).toFixed(1)}s`}
          </span>
        )}
        {tool.result !== undefined && (
          <ChevronDown className={cn('w-3 h-3 text-muted-foreground/50 transition-transform', isExpanded && 'rotate-180')} />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && tool.result !== undefined && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 ml-2 overflow-hidden"
          >
            <pre className="p-2 text-[10px] bg-muted/30 rounded-md overflow-x-auto max-h-32 text-muted-foreground">
              {typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

/**
 * Tool Calls Section - Horizontal chips
 */
const ToolCallsSection = memo(function ToolCallsSection({
  toolCalls,
}: {
  toolCalls: ToolCallInfo[];
}) {
  if (!toolCalls.length) return null;

  return (
    <motion.div variants={itemVariants} className="flex flex-wrap gap-2 py-2">
      {toolCalls.map((tool, idx) => (
        <ToolCallChip key={tool.id} tool={tool} index={idx} />
      ))}
    </motion.div>
  );
});

/**
 * Agent Badge - Shows which specialist handled
 */
const AgentBadge = memo(function AgentBadge({
  agentName,
}: {
  agentName: string;
}) {
  const Icon = AGENT_ICONS[agentName.toLowerCase()] || Bot;
  const colorClass = AGENT_COLORS[agentName.toLowerCase()] || 'text-primary';

  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center gap-1.5 py-1"
    >
      <Icon className={cn('w-4 h-4', colorClass)} />
      <span className="text-xs font-medium text-muted-foreground">
        {agentName.charAt(0).toUpperCase() + agentName.slice(1).replace(/_/g, ' ')} Analysis
      </span>
    </motion.div>
  );
});

/**
 * Main Content Section - The actual response
 */
const ContentSection = memo(function ContentSection({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  return (
    <motion.div variants={itemVariants} className="py-2">
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
 * Viewport Commands Preview
 */
const ViewportCommandsSection = memo(function ViewportCommandsSection({
  commands,
}: {
  commands: ViewportCommand[];
}) {
  if (!commands.length) return null;

  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center gap-2 py-2 border-t border-border/30 mt-2"
    >
      <Eye className="w-3.5 h-3.5 text-primary" />
      <span className="text-xs text-muted-foreground">
        {commands.length} viewport {commands.length === 1 ? 'action' : 'actions'} available
      </span>
      <div className="flex gap-1.5 ml-auto">
        {commands.map((cmd, idx) => (
          <span
            key={idx}
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px]',
              'bg-primary/10 text-primary'
            )}
          >
            {cmd.type}
          </span>
        ))}
      </div>
    </motion.div>
  );
});

// ============================================
// Main Component
// ============================================

export const AgentResponseCard = memo(function AgentResponseCard({
  content,
  reasoning,
  toolCalls = [],
  agentName,
  viewportCommands = [],
  isStreaming = false,
  timestamp,
  className,
  agentPhase,
  currentTask,
}: AgentResponseCardProps) {
  // Parse content to extract reasoning if not provided separately
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- Complex parsing logic benefits from manual memoization
  const parsedData = useMemo(() => {
    if (reasoning) {
      return { reasoning, mainContent: content };
    }

    // Try to extract JSON reasoning from content
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]) as AgentReasoning;
        const mainContent = content.replace(/```json[\s\S]*?```/g, '').trim();
        return { reasoning: parsed, mainContent };
      }

      // Try inline JSON at start
      if (content.startsWith('{')) {
        const endIdx = content.indexOf('}') + 1;
        const jsonStr = content.slice(0, endIdx);
        const parsed = JSON.parse(jsonStr) as AgentReasoning;
        const mainContent = content.slice(endIdx).trim();
        return { reasoning: parsed, mainContent };
      }
    } catch {
      // Not JSON, use as-is
    }

    return { reasoning: undefined, mainContent: content };
  }, [content, reasoning]);

  const { reasoning: parsedReasoning, mainContent } = parsedData;

  return (
    <div className={cn('relative', className)}>
      {/* Subtle left border accent */}
      <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent rounded-full" />

      <motion.div
        className="pl-4 space-y-1"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Agent Badge */}
        {agentName && <AgentBadge agentName={agentName} />}

        {/* Thinking Section */}
        {(parsedReasoning || (isStreaming && agentPhase)) && (
          <ThinkingSection
            reasoning={parsedReasoning?.reasoning || ''}
            nextAgent={parsedReasoning?.nextAgent}
            taskForAgent={parsedReasoning?.taskForAgent}
            isStreaming={isStreaming && !mainContent}
            agentPhase={agentPhase}
            currentTask={currentTask}
          />
        )}

        {/* Tool Calls */}
        {toolCalls.length > 0 && <ToolCallsSection toolCalls={toolCalls} />}

        {/* Main Content */}
        {mainContent && (
          <ContentSection content={mainContent} isStreaming={isStreaming} />
        )}

        {/* Viewport Commands */}
        {viewportCommands.length > 0 && (
          <ViewportCommandsSection commands={viewportCommands} />
        )}

        {/* Timestamp */}
        {timestamp && (
          <motion.div
            variants={itemVariants}
            className="text-[10px] text-muted-foreground/50 pt-1"
          >
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
});

export default AgentResponseCard;
