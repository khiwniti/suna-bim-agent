'use client';

/**
 * MessageBubble - Enhanced message styling for chat interface
 *
 * Features:
 * - User messages: gradient background with subtle glow
 * - Assistant messages: glass effect with border
 * - System messages: centered, muted style
 * - Typing indicator: animated dots with spring physics
 * - Delivery status: subtle checkmarks with fade animation
 * - Typewriter effect: character-by-character streaming
 *
 * ★ Insight ─────────────────────────────────────
 * The typewriter effect creates the illusion of "live typing"
 * similar to ChatGPT/Claude. When isStreaming=true, text reveals
 * progressively. Users can click to skip the animation.
 * ─────────────────────────────────────────────────
 */

import { memo, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Bot, User, AlertCircle, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BIMMarkdown } from './BIMMarkdown';
import { useStreamingText } from '@/hooks/useStreamingText';

export type MessageRole = 'user' | 'assistant' | 'system';
export type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

// Format relative time without date-fns
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export interface MessageBubbleProps {
  role: MessageRole;
  content: string;
  timestamp?: Date;
  status?: DeliveryStatus;
  isStreaming?: boolean;
  /** Enable typewriter effect for streaming messages */
  enableTypewriter?: boolean;
  /** Speed of typewriter effect (ms per char, lower = faster) */
  typewriterSpeed?: number;
  /** Callback when typewriter animation completes */
  onStreamingComplete?: () => void;
  className?: string;
}

// Animation variants
const bubbleVariants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 300,
    },
  },
};

const userVariants = {
  hidden: {
    opacity: 0,
    x: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 300,
    },
  },
};

const assistantVariants = {
  hidden: {
    opacity: 0,
    x: -20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 300,
    },
  },
};

// Status icon component
function StatusIcon({ status }: { status?: DeliveryStatus }) {
  if (!status) return null;

  const iconClass = 'w-3.5 h-3.5';

  switch (status) {
    case 'sending':
      return (
        <motion.div
          className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      );
    case 'sent':
      return <Check className={cn(iconClass, 'text-muted-foreground')} />;
    case 'delivered':
      return <CheckCheck className={cn(iconClass, 'text-muted-foreground')} />;
    case 'read':
      return <CheckCheck className={cn(iconClass, 'text-primary')} />;
    case 'error':
      return <AlertCircle className={cn(iconClass, 'text-destructive')} />;
    default:
      return null;
  }
}

// Typing indicator with spring physics
export function TypingIndicator() {
  return (
    <motion.div
      className={cn(
        'flex items-center gap-3',
        'max-w-[85%] px-4 py-3',
        'rounded-2xl rounded-bl-sm',
        'glass-chat'
      )}
      variants={assistantVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="typing-indicator">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{
              y: [0, -6, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export const MessageBubble = memo(function MessageBubble({
  role,
  content,
  timestamp,
  status,
  isStreaming = false,
  enableTypewriter = true,
  typewriterSpeed = 15,
  onStreamingComplete,
  className,
}: MessageBubbleProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';
  const [skipped, setSkipped] = useState(false);

  // Use streaming text hook for assistant messages
  // Enable typewriter for assistant messages that are streaming OR have content to reveal
  const canTypewrite = !isUser && !isSystem && enableTypewriter && !skipped;
  const {
    displayedText,
    isRevealing,
    isComplete: typewriterComplete,
    skipToEnd,
    progress,
  } = useStreamingText(content, isStreaming, {
    charDelay: typewriterSpeed,
    punctuationDelay: 80,
    instant: isUser || isSystem || !enableTypewriter || skipped,
    onComplete: onStreamingComplete,
  });

  // Handle skip click
  const handleSkip = useCallback(() => {
    setSkipped(true);
    skipToEnd();
  }, [skipToEnd]);

  // Show typewriter text while revealing, full content when complete
  // Key insight: keep using displayedText until typewriter is complete, not until isStreaming is false
  const displayContent = canTypewrite && !typewriterComplete ? displayedText : content;

  // Show streaming indicators while streaming OR while typewriter is still revealing
  const showStreamingIndicators = isStreaming || (canTypewrite && isRevealing);

  // System messages
  if (isSystem) {
    return (
      <motion.div
        className={cn(
          'flex justify-center px-4 py-2',
          className
        )}
        variants={bubbleVariants}
        initial="hidden"
        animate="visible"
      >
        <div className={cn(
          'px-3 py-1.5 rounded-full',
          'bg-muted text-muted-foreground text-xs',
          'border border-border/50'
        )}>
          {content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        'flex items-end gap-2',
        isUser ? 'flex-row-reverse' : 'flex-row',
        'px-4 py-1',
        className
      )}
      variants={isUser ? userVariants : assistantVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
        isUser
          ? 'bg-muted'
          : 'bg-gradient-to-br from-primary to-accent'
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message content */}
      <div className={cn(
        'flex flex-col',
        isUser ? 'items-end' : 'items-start',
        'max-w-[80%]'
      )}>
        <div
          className={cn(
            'px-4 py-3 rounded-2xl',
            'text-sm leading-relaxed',
            isUser
              ? [
                  'bg-gradient-to-br from-primary to-accent',
                  'text-white',
                  'rounded-br-sm',
                  'shadow-md',
                ]
              : [
                  'glass-chat',
                  'text-foreground',
                  'rounded-bl-sm',
                  'max-w-full overflow-hidden',
                ],
            showStreamingIndicators && 'animate-pulse-subtle'
          )}
        >
          {/* Render content with markdown for assistant, plain for user */}
          {isUser ? (
            <p className="whitespace-pre-wrap">{displayContent}</p>
          ) : (
            <BIMMarkdown content={displayContent} />
          )}

          {/* Streaming cursor with progress hint */}
          {showStreamingIndicators && (
            <span className="inline-flex items-center gap-1 ml-1">
              <motion.span
                className="inline-block w-2 h-4 bg-primary rounded-sm"
                animate={{ opacity: [1, 0.3] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
              {canTypewrite && progress < 100 && (
                <button
                  onClick={handleSkip}
                  className="inline-flex items-center gap-0.5 px-1 py-0.5 text-xs text-muted-foreground hover:text-foreground rounded transition-colors"
                  title="Skip animation"
                >
                  <SkipForward className="w-3 h-3" />
                </button>
              )}
            </span>
          )}
        </div>

        {/* Timestamp and status */}
        {(timestamp || status) && (
          <div className={cn(
            'flex items-center gap-1.5 mt-1 px-1',
            'text-xs text-muted-foreground'
          )}>
            {timestamp && (
              <span>
                {formatRelativeTime(timestamp)}
              </span>
            )}
            {isUser && status && <StatusIcon status={status} />}
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default MessageBubble;
