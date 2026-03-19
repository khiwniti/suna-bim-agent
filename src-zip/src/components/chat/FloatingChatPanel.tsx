'use client';

/**
 * FloatingChatPanel - Expandable overlay chat panel
 *
 * Features:
 * - Glassmorphism background with blur effect
 * - Smooth slide-up/scale animation with Framer Motion
 * - Multiple dock positions (corner, bottom, side)
 * - Smart viewport boundary detection
 * - Draggable header (optional)
 * - Resize handles
 */

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  X,
  Minimize2,
  Maximize2,
  GripVertical,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import type { DockPosition } from '@/stores/chat-store';

interface FloatingChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  dockPosition?: DockPosition;
  onDockPositionChange?: (position: DockPosition) => void;
  children: ReactNode;
  className?: string;
  title?: string;
}

// Dock position styles per plan requirements
const dockPositionStyles: Record<DockPosition, string> = {
  corner: 'bottom-4 right-4',                    // corner: bottom-4 right-4, fixed size
  bottom: 'bottom-0 left-0 right-0',             // bottom: full width, anchored to bottom
  side: 'top-0 right-0 bottom-0',                // side: full height, anchored to right
};

// Panel dimension presets per plan: var(--chat-panel-width) 340px, var(--chat-panel-height) 420px
const dockDimensions: Record<DockPosition, { width: string; height: string; maxHeight?: string }> = {
  corner: { width: 'var(--chat-panel-width, 340px)', height: 'var(--chat-panel-height, 420px)' },
  bottom: { width: '100%', height: 'auto', maxHeight: '50vh' },  // bottom: full width, 50% height max
  side: { width: '340px', height: '100%' },                       // side: full height, 340px width
};

// Animation variants
const panelVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 300,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    filter: 'blur(4px)',
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 300,
    },
  },
};

export function FloatingChatPanel({
  isOpen,
  onClose,
  dockPosition = 'corner',
  onDockPositionChange,
  children,
  className,
  title = 'BIM Assistant',
}: FloatingChatPanelProps) {
  const { t } = useTranslation();
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Cycle through dock positions
  const cycleDockPosition = () => {
    const positions: DockPosition[] = ['corner', 'bottom', 'side'];
    const currentIndex = positions.indexOf(dockPosition);
    const nextPosition = positions[(currentIndex + 1) % positions.length];
    onDockPositionChange?.(nextPosition);
  };

  const dimensions = isMaximized
    ? { width: 'calc(100vw - 2rem)', height: 'calc(100vh - 6rem)', maxHeight: undefined as string | undefined }
    : dockDimensions[dockPosition];

  // Get position-specific class overrides for special layouts
  const getPositionClasses = () => {
    if (isMaximized) return 'top-4 left-4 right-4 bottom-20';
    switch (dockPosition) {
      case 'bottom':
        return 'rounded-t-2xl rounded-b-none';
      case 'side':
        return 'rounded-l-2xl rounded-r-none';
      default:
        return 'rounded-2xl';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          className={cn(
            'fixed z-40',
            'flex flex-col',
            // Glassmorphism: backdrop-blur-xl, bg-white/90 dark:bg-background/90
            'backdrop-blur-xl bg-white/90 dark:bg-background/90',
            // Shadow: shadow-2xl with subtle glow
            'shadow-2xl shadow-black/10 dark:shadow-black/30',
            // Border for glass effect
            'border border-white/20 dark:border-border/50',
            'overflow-hidden',
            !isMaximized && dockPositionStyles[dockPosition],
            getPositionClasses(),
            isMaximized && 'top-4 left-4 right-4 bottom-20 rounded-2xl',
            className
          )}
          style={!isMaximized ? {
            width: dimensions.width,
            height: dimensions.height,
            maxHeight: dimensions.maxHeight,
          } : undefined}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          drag={!isMaximized}
          dragControls={dragControls}
          dragMomentum={false}
          dragElastic={0.1}
          dragConstraints={{
            top: -window.innerHeight + 200,
            left: -window.innerWidth + 200,
            right: window.innerWidth - 200,
            bottom: window.innerHeight - 200,
          }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('floatingChat.chatPanel')}
        >
          {/* Header */}
          <motion.header
            className={cn(
              'flex items-center justify-between gap-2',
              'px-4 py-3',
              'border-b border-border/50',
              'bg-gradient-to-r from-primary/5 to-accent/5',
              'cursor-grab active:cursor-grabbing',
              isDragging && 'cursor-grabbing'
            )}
            onPointerDown={(e) => {
              if (!isMaximized) {
                dragControls.start(e);
              }
            }}
            variants={contentVariants}
          >
            {/* Left: Drag handle + Title */}
            <div className="flex items-center gap-3">
              {!isMaximized && (
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              )}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {title}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t('floatingChat.bimIntelligence')}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-1">
              {/* Dock position toggle */}
              {onDockPositionChange && !isMaximized && (
                <button
                  onClick={cycleDockPosition}
                  className={cn(
                    'p-1.5 rounded-lg',
                    'text-muted-foreground hover:text-foreground',
                    'hover:bg-muted/50 transition-colors'
                  )}
                  aria-label={t('floatingChat.changeDockPosition')}
                  title={`Dock: ${dockPosition}`}
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}

              {/* Maximize/Minimize toggle */}
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className={cn(
                  'p-1.5 rounded-lg',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-muted/50 transition-colors'
                )}
                aria-label={isMaximized ? t('floatingChat.minimize') : t('floatingChat.maximize')}
              >
                {isMaximized ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              {/* Close button */}
              <button
                onClick={onClose}
                className={cn(
                  'p-1.5 rounded-lg',
                  'text-muted-foreground hover:text-destructive',
                  'hover:bg-destructive/10 transition-colors'
                )}
                aria-label={t('floatingChat.closeChat')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.header>

          {/* Content */}
          <motion.div
            className="flex-1 overflow-hidden"
            variants={contentVariants}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FloatingChatPanel;
