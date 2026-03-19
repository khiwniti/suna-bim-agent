'use client';

/**
 * FloatingChatFAB - Floating Action Button for headless chat interface
 *
 * Features:
 * - Pulsing animation when new messages arrive
 * - Unread count badge with bounce animation
 * - Smooth scale/morph animation on hover
 * - Configurable position (bottom-right, bottom-left, bottom-center)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FABPosition = 'bottom-right' | 'bottom-left' | 'bottom-center';

interface FloatingChatFABProps {
  onClick: () => void;
  isOpen: boolean;
  unreadCount?: number;
  position?: FABPosition;
  className?: string;
}

// Position styles
const positionStyles: Record<FABPosition, string> = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
};

// Animation variants
const fabVariants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 20,
    },
  },
  hover: {
    scale: 1.1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 10,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 15,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

const iconVariants = {
  initial: {
    rotate: 0,
    scale: 1,
  },
  open: {
    rotate: 90,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 20,
    },
  },
  closed: {
    rotate: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 20,
    },
  },
};

const badgeVariants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 15,
    },
  },
  pulse: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

export function FloatingChatFAB({
  onClick,
  isOpen,
  unreadCount = 0,
  position = 'bottom-right',
  className,
}: FloatingChatFABProps) {
  const hasUnread = unreadCount > 0 && !isOpen;

  return (
    <motion.button
      className={cn(
        'fixed z-50 flex items-center justify-center',
        'chat-fab btn-ripple',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        hasUnread && 'animate-fab-pulse',
        positionStyles[position],
        className
      )}
      variants={fabVariants}
      initial="initial"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      exit="exit"
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      aria-expanded={isOpen}
    >
      {/* Icon with rotation animation */}
      <motion.div
        variants={iconVariants}
        initial="initial"
        animate={isOpen ? 'open' : 'closed'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Unread badge */}
      <AnimatePresence>
        {hasUnread && (
          <motion.span
            className={cn(
              'absolute -top-1 -right-1',
              'flex items-center justify-center',
              'min-w-[20px] h-5 px-1.5',
              'bg-destructive text-destructive-foreground',
              'text-xs font-semibold rounded-full',
              'border-2 border-background'
            )}
            variants={badgeVariants}
            initial="initial"
            animate="visible"
            exit="exit"
            key={unreadCount} // Re-trigger animation on count change
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Ripple effect overlay */}
      <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <span className="absolute inset-0 opacity-0 bg-white/30 transition-opacity group-hover:opacity-100" />
      </span>
    </motion.button>
  );
}

export default FloatingChatFAB;
