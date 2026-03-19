'use client';

import React, { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { usePanelStore } from '@/stores/panel-store';
import type { PanelId } from '@/lib/panels/types';
import { cn } from '@/lib/utils';

interface PanelContainerProps {
  panelId: PanelId;
  title: string;
  icon: keyof typeof Icons;
  isExpanded: boolean;
  children: ReactNode;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  registerRef?: (ref: HTMLButtonElement | null) => void;
}

export function PanelContainer({
  panelId,
  title,
  icon,
  isExpanded,
  children,
  onKeyDown,
  registerRef,
}: PanelContainerProps) {
  const { togglePanel, activePanelId } = usePanelStore();
  const Icon = Icons[icon] as React.ComponentType<{ className?: string }>;
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Track activation glow for visual feedback
  const wasJustActivated = useRef(false);
  const [showActivationGlow, setShowActivationGlow] = useState(false);
  const isActive = activePanelId === panelId;

  // Show glow when panel is activated from outside (e.g., tool completion)
  useEffect(() => {
    if (isActive && !wasJustActivated.current) {
      wasJustActivated.current = true;
      setShowActivationGlow(true);
      const timer = setTimeout(() => setShowActivationGlow(false), 1500);
      return () => clearTimeout(timer);
    } else if (!isActive) {
      wasJustActivated.current = false;
    }
  }, [isActive]);

  const headerId = `panel-header-${panelId}`;
  const contentId = `panel-content-${panelId}`;

  // Register the button ref with parent
  useEffect(() => {
    registerRef?.(buttonRef.current);
    return () => registerRef?.(null);
  }, [registerRef]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Let parent handle navigation keys
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        onKeyDown?.(e);
        return;
      }

      // Handle toggle on Enter/Space (native button behavior, but ensure it works)
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        togglePanel(panelId);
      }
    },
    [onKeyDown, togglePanel, panelId]
  );

  return (
    <div
      className={cn(
        "border-b border-neutral-200 dark:border-neutral-800 transition-all duration-300",
        showActivationGlow && "ring-2 ring-primary/50 ring-inset bg-primary/5"
      )}
      data-panel-id={panelId}
      data-expanded={isExpanded}
      role="presentation"
    >
      {/* Header - acts as tab in vertical tablist */}
      <button
        ref={buttonRef}
        id={headerId}
        className="flex w-full items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        onClick={() => togglePanel(panelId)}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        role="tab"
        aria-selected={isExpanded}
        tabIndex={0}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="font-medium">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
        >
          <Icons.ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      {/* Content - acts as tabpanel */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={contentId}
            role="tabpanel"
            aria-labelledby={headerId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            tabIndex={0}
          >
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
