'use client';

/**
 * AgentStateVisualization - Real-time visualization of AI agent thinking process
 *
 * Displays:
 * - Current thinking/reasoning state
 * - Tool calls with parameters and results
 * - MCP server calls
 * - A2A protocol events
 * - Timeline of all events
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Wrench,
  Server,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  Database,
  Code2,
  Building2,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';

// ============================================
// Types
// ============================================

export type AgentEventType =
  | 'thinking'
  | 'tool_start'
  | 'tool_end'
  | 'mcp_call'
  | 'mcp_result'
  | 'a2a_task_update'
  | 'a2a_artifact'
  | 'llm_start'
  | 'llm_token'
  | 'error';

export type AgentEventStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AgentEvent {
  id: string;
  type: AgentEventType;
  status: AgentEventStatus;
  timestamp: Date;
  duration?: number; // ms
  data: {
    name?: string;
    description?: string;
    input?: Record<string, unknown>;
    output?: unknown;
    error?: string;
    // Tool-specific
    toolName?: string;
    // MCP-specific
    serverName?: string;
    method?: string;
    // A2A-specific
    taskId?: string;
    taskStatus?: string;
    agentId?: string;
  };
}

export interface AgentState {
  isThinking: boolean;
  currentPhase: string;
  events: AgentEvent[];
  activeTools: string[];
  mcpConnections: string[];
  a2aAgents: string[];
}

interface AgentStateVisualizationProps {
  state: AgentState;
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

// ============================================
// Icon Mapping
// ============================================

const EVENT_ICONS: Record<AgentEventType, React.ComponentType<{ className?: string }>> = {
  thinking: Brain,
  tool_start: Wrench,
  tool_end: Wrench,
  mcp_call: Server,
  mcp_result: Database,
  a2a_task_update: MessageSquare,
  a2a_artifact: Building2,
  llm_start: Sparkles,
  llm_token: Code2,
  error: XCircle,
};

const TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'analyze_model': BarChart3,
  'calculate_carbon': Building2,
  'classify_elements': Database,
  'detect_clashes': Zap,
  default: Wrench,
};

// ============================================
// Component
// ============================================

export function AgentStateVisualization({
  state,
  className,
  collapsed = false,
  onToggleCollapse,
}: AgentStateVisualizationProps) {
  const { t } = useTranslation();
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const timelineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    if (timelineRef.current && state.events.length > 0) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [state.events.length]);

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  if (collapsed) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={onToggleCollapse}
        className={cn(
          'flex items-center gap-2 px-3 py-2 bg-card/90 backdrop-blur-sm rounded-lg border border-border shadow-lg hover:bg-muted transition-colors',
          className
        )}
      >
        <Brain className={cn('w-4 h-4', state.isThinking && 'text-primary animate-pulse')} />
        <span className="text-sm font-medium">
          {state.isThinking ? 'Thinking...' : 'Agent State'}
        </span>
        {state.activeTools.length > 0 && (
          <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
            {state.activeTools.length}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-card/95 backdrop-blur-sm rounded-xl border border-border shadow-lg overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            state.isThinking
              ? 'bg-primary/20 text-primary'
              : 'bg-muted text-muted-foreground'
          )}>
            <Brain className={cn('w-4 h-4', state.isThinking && 'animate-pulse')} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t('agentState.agentState')}</h3>
            <p className="text-xs text-muted-foreground">
              {state.isThinking ? state.currentPhase : t('agentState.idle')}
            </p>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Active Connections */}
      {(state.mcpConnections.length > 0 || state.a2aAgents.length > 0) && (
        <div className="px-4 py-2 border-b border-border bg-muted/10">
          <div className="flex flex-wrap gap-2">
            {state.mcpConnections.map((server) => (
              <span
                key={server}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs rounded-full"
              >
                <Server className="w-3 h-3" />
                {server}
              </span>
            ))}
            {state.a2aAgents.map((agent) => (
              <span
                key={agent}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs rounded-full"
              >
                <MessageSquare className="w-3 h-3" />
                {agent}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Event Timeline */}
      <div
        ref={timelineRef}
        className="max-h-64 overflow-y-auto p-3 space-y-2"
      >
        <AnimatePresence mode="popLayout">
          {state.events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 text-sm text-muted-foreground"
            >
              {t('agentState.noEventsYet')}
            </motion.div>
          ) : (
            state.events.map((event) => (
              <AgentEventCard
                key={event.id}
                event={event}
                expanded={expandedEvents.has(event.id)}
                onToggle={() => toggleEventExpanded(event.id)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Active Tools Footer */}
      {state.activeTools.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-primary/5">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">{t('agentState.active')}:</span>
            {state.activeTools.map((tool) => (
              <span
                key={tool}
                className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// Event Card Component
// ============================================

interface AgentEventCardProps {
  event: AgentEvent;
  expanded: boolean;
  onToggle: () => void;
}

function AgentEventCard({ event, expanded, onToggle }: AgentEventCardProps) {
  const { t } = useTranslation();
  const Icon = EVENT_ICONS[event.type] || Wrench;
  const ToolIcon = event.data.toolName
    ? TOOL_ICONS[event.data.toolName] || TOOL_ICONS.default
    : Icon;

  const statusColors: Record<AgentEventStatus, string> = {
    pending: 'text-yellow-500 bg-yellow-500/10',
    running: 'text-blue-500 bg-blue-500/10',
    completed: 'text-green-500 bg-green-500/10',
    failed: 'text-red-500 bg-red-500/10',
  };

  const statusIcons: Record<AgentEventStatus, React.ComponentType<{ className?: string }>> = {
    pending: Clock,
    running: Sparkles,
    completed: CheckCircle2,
    failed: XCircle,
  };

  const StatusIcon = statusIcons[event.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        'rounded-lg border transition-colors',
        event.status === 'running'
          ? 'border-primary/30 bg-primary/5'
          : 'border-border bg-card/50'
      )}
    >
      {/* Event Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className={cn('p-1.5 rounded', statusColors[event.status])}>
          <ToolIcon className="w-3.5 h-3.5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {event.data.name || event.data.toolName || event.type}
            </span>
            <StatusIcon
              className={cn(
                'w-3.5 h-3.5 flex-shrink-0',
                event.status === 'running' && 'animate-spin'
              )}
            />
          </div>
          {event.data.description && (
            <p className="text-xs text-muted-foreground truncate">
              {event.data.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {event.duration !== undefined && (
            <span className="text-xs text-muted-foreground">
              {event.duration < 1000
                ? `${event.duration}ms`
                : `${(event.duration / 1000).toFixed(1)}s`}
            </span>
          )}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-border/50">
              {/* Input */}
              {event.data.input && Object.keys(event.data.input).length > 0 && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-muted-foreground">{t('agentState.input')}:</span>
                  <pre className="mt-1 p-2 bg-muted/50 rounded text-xs overflow-x-auto">
                    {JSON.stringify(event.data.input, null, 2)}
                  </pre>
                </div>
              )}

              {/* Output */}
              {event.data.output !== undefined && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-muted-foreground">{t('agentState.output')}:</span>
                  <pre className="mt-1 p-2 bg-muted/50 rounded text-xs overflow-x-auto max-h-32">
                    {typeof event.data.output === 'string'
                      ? event.data.output
                      : JSON.stringify(event.data.output, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error */}
              {event.data.error && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600 dark:text-red-400">
                  {event.data.error}
                </div>
              )}

              {/* MCP Info */}
              {event.data.serverName && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Server className="w-3 h-3" />
                  <span>{event.data.serverName}</span>
                  {event.data.method && (
                    <>
                      <span>→</span>
                      <code className="px-1 bg-muted rounded">{event.data.method}</code>
                    </>
                  )}
                </div>
              )}

              {/* A2A Info */}
              {event.data.taskId && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageSquare className="w-3 h-3" />
                  <span>{t('agentState.task')}: {event.data.taskId}</span>
                  {event.data.taskStatus && (
                    <span className="px-1.5 py-0.5 bg-muted rounded">
                      {event.data.taskStatus}
                    </span>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <div className="mt-2 text-xs text-muted-foreground">
                {event.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// Thinking Animation Component
// ============================================

export function ThinkingAnimation({ phase }: { phase: string }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl"
    >
      <div className="relative">
        <Brain className="w-5 h-5 text-primary" />
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-primary">{t('agentState.thinking')}</p>
        <p className="text-xs text-muted-foreground">{phase}</p>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{
              y: [0, -6, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default AgentStateVisualization;
