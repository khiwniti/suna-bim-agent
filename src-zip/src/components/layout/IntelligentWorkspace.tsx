'use client';

/**
 * Intelligent Workspace Layout
 *
 * Context-aware viewport activation that only shows 3D viewer when needed.
 * Matches UX patterns from ChatGPT, Claude, and Gemini.
 */

import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzePromptIntent, getViewportLayout, shouldPersistViewport, type PromptIntent } from '@/lib/agent/viewport-activator';

interface IntelligentWorkspaceProps {
  /** Viewport content (3D viewer) */
  viewportPanel: React.ReactNode;
  /** Chat panel content */
  chatPanel: React.ReactNode;
  /** Callback when back button is clicked */
  onBackToLanding?: () => void;
  /** Initial viewport visibility (default: false) */
  initialViewportVisible?: boolean;
}

export function IntelligentWorkspace({
  viewportPanel,
  chatPanel,
  onBackToLanding,
  initialViewportVisible = false,
}: IntelligentWorkspaceProps) {
  // State
  const [viewportVisible, setViewportVisible] = useState(initialViewportVisible);
  const [previousIntent, setPreviousIntent] = useState<PromptIntent | null>(null);
  const [manualOverride, setManualOverride] = useState(false);

  /**
   * Analyzes user prompt and conditionally shows viewport
   * This function is called by the chat component when user sends a message
   */
  const handleUserMessage = useCallback((message: string) => {
    // If user has manually toggled, respect their choice
    if (manualOverride) {
      return;
    }

    // Analyze the prompt
    const intent = analyzePromptIntent(message);

    // Determine if viewport should be visible
    const shouldShowViewport = shouldPersistViewport(previousIntent, intent);

    // Update state
    setViewportVisible(shouldShowViewport);
    setPreviousIntent(intent);

    // Log for debugging (remove in production)
    console.log('[IntelligentWorkspace] Prompt:', message);
    console.log('[IntelligentWorkspace] Intent:', intent);
    console.log('[IntelligentWorkspace] Viewport visible:', shouldShowViewport);
  }, [previousIntent, manualOverride]);

  /**
   * Manual toggle for viewport (user control)
   */
  const handleToggleViewport = useCallback(() => {
    setViewportVisible(!viewportVisible);
    setManualOverride(true);

    // Reset manual override after 30 seconds
    setTimeout(() => {
      setManualOverride(false);
    }, 30000);
  }, [viewportVisible]);

  // Get layout configuration
  const layout = previousIntent
    ? getViewportLayout(previousIntent)
    : { chatWidth: 'w-full', viewportWidth: 'w-0', viewportVisible: false, transition: '' };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Main content area */}
      <div className="flex-1 flex relative">
        {/* Chat Panel - Always visible */}
        <motion.div
          className={cn(
            'relative',
            viewportVisible ? layout.chatWidth : 'w-full',
            layout.transition
          )}
          layout
        >
          {/* Render chat panel directly - message handling via context/store */}
          {chatPanel}
        </motion.div>

        {/* 3D Viewport - Conditional */}
        <AnimatePresence>
          {viewportVisible && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{
                width: layout.viewportWidth === 'w-1/2' ? '50%' : '66.666%',
                opacity: 1,
              }}
              exit={{ width: 0, opacity: 0 }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 300,
                opacity: { duration: 0.2 },
              }}
              className="border-l border-border overflow-hidden"
            >
              {viewportPanel}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Viewport Toggle Button (Manual Control) */}
        <motion.button
          onClick={handleToggleViewport}
          className={cn(
            'absolute top-4 right-4 z-50',
            'p-2 rounded-lg',
            'bg-card/90 backdrop-blur-sm border border-border',
            'hover:bg-accent transition-colors',
            'shadow-lg'
          )}
          title={viewportVisible ? 'Hide 3D Viewport' : 'Show 3D Viewport'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {viewportVisible ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </motion.button>

        {/* Manual Override Indicator */}
        <AnimatePresence>
          {manualOverride && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'absolute top-16 right-4 z-50',
                'px-3 py-1.5 rounded-lg',
                'bg-primary/10 text-primary text-xs',
                'border border-primary/20'
              )}
            >
              Manual mode (30s)
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Backward-compatible WorkspaceLayout wrapper
 *
 * This maintains the original API while adding intelligent viewport activation
 */
export function WorkspaceLayoutIntelligent(props: any) {
  return (
    <IntelligentWorkspace
      viewportPanel={props.viewportPanel}
      chatPanel={props.chatPanel}
      onBackToLanding={props.onBackToLanding}
      initialViewportVisible={false}
    />
  );
}

export default IntelligentWorkspace;
