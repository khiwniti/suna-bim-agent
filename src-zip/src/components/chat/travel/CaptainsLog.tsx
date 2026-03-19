'use client';

/**
 * CaptainsLog - Collapsible reasoning/thinking section
 *
 * Displays agent reasoning with travel-themed styling:
 * - Collapsible "Captain's Log" header
 * - Typewriter effect for streaming text
 * - Paper texture background
 * - Shows next destination hint
 *
 * Features:
 * - Smooth expand/collapse with spring physics
 * - Streaming text with cursor animation
 * - Subtle paper-like background
 */

import { useState, memo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Scroll, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CaptainsLogProps {
  /** The reasoning/thinking text */
  reasoning: string;
  /** Next agent/destination being routed to */
  nextDestination?: string;
  /** Task description for the next agent */
  taskDescription?: string;
  /** Whether content is still streaming */
  isStreaming?: boolean;
  /** Start expanded? */
  defaultExpanded?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * Typewriter text with cursor
 */
const StreamingText = memo(function StreamingText({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming: boolean;
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const textRef = useRef(text);

  // Update displayed text with typewriter effect when streaming
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(text);
      setShowCursor(false);
      return;
    }

    // Only animate if text changed
    if (text === textRef.current && displayedText === text) {
      return;
    }
    textRef.current = text;

    // If new text is longer, append characters
    if (text.length > displayedText.length) {
      const newChars = text.slice(displayedText.length);
      let charIndex = 0;

      const interval = setInterval(() => {
        if (charIndex < newChars.length) {
          setDisplayedText((prev) => prev + newChars[charIndex]);
          charIndex++;
        } else {
          clearInterval(interval);
        }
      }, 15); // 15ms per character for smooth typing

      return () => clearInterval(interval);
    } else {
      // Text shortened (unlikely) - just set it
      setDisplayedText(text);
    }
  }, [text, isStreaming, displayedText]);

  // Cursor blink
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <span>
      {displayedText}
      {isStreaming && (
        <motion.span
          className={cn(
            'inline-block w-0.5 h-4 bg-primary ml-0.5 -mb-0.5',
            !showCursor && 'opacity-0'
          )}
          animate={{ opacity: showCursor ? 1 : 0 }}
        />
      )}
    </span>
  );
});

/**
 * CaptainsLog - Main component
 */
export const CaptainsLog = memo(function CaptainsLog({
  reasoning,
  nextDestination,
  taskDescription,
  isStreaming = false,
  defaultExpanded = false,
  className,
}: CaptainsLogProps) {
  // Calculate initial expanded state based on streaming
  const shouldAutoExpand = defaultExpanded || (isStreaming && !!reasoning);
  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand);

  if (!reasoning && !isStreaming) return null;

  return (
    <motion.div
      className={cn(
        'rounded-lg overflow-hidden',
        'bg-gradient-to-br from-amber-50/50 via-amber-50/30 to-orange-50/20',
        'dark:from-amber-950/20 dark:via-amber-950/10 dark:to-orange-950/10',
        'border border-amber-200/30 dark:border-amber-800/30',
        className
      )}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2',
          'text-sm text-amber-900/80 dark:text-amber-100/80',
          'hover:bg-amber-100/30 dark:hover:bg-amber-900/20',
          'transition-colors duration-200'
        )}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>

        <Scroll className="w-4 h-4" />

        <span className="font-medium">Captain&apos;s Log</span>

        {/* Streaming indicator */}
        {isStreaming && (
          <motion.span
            className="flex gap-0.5 ml-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1 h-1 rounded-full bg-amber-500 dark:bg-amber-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.span>
        )}

        {/* Next destination hint */}
        {nextDestination && (
          <span className="ml-auto flex items-center gap-1 text-xs text-amber-700/60 dark:text-amber-300/60">
            <ArrowRight className="w-3 h-3" />
            {nextDestination}
          </span>
        )}
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
              transition: {
                height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.2, delay: 0.1 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.15 },
              },
            }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'px-4 pb-3 pt-1',
                // Paper texture effect with subtle pattern
                'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]',
                'from-transparent via-amber-100/10 to-transparent',
                'dark:from-transparent dark:via-amber-900/5 dark:to-transparent'
              )}
            >
              {/* Reasoning text with typewriter effect */}
              <p className="text-sm text-amber-900/70 dark:text-amber-100/70 leading-relaxed italic">
                &ldquo;
                <StreamingText text={reasoning} isStreaming={isStreaming} />
                &rdquo;
              </p>

              {/* Task for agent */}
              {taskDescription && (
                <motion.div
                  className={cn(
                    'mt-3 flex items-start gap-2 p-2 rounded-md',
                    'bg-amber-100/50 dark:bg-amber-900/20',
                    'border border-amber-200/50 dark:border-amber-800/30'
                  )}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-sm">📋</span>
                  <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                    {taskDescription}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default CaptainsLog;
